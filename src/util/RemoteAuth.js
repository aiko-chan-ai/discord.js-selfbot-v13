'use strict';
// Thanks to https://github.com/raleighrimwell/discord-qr-scam-tool
const { Buffer } = require('buffer');
const crypto = require('crypto');
const EventEmitter = require('node:events');
const { setInterval, clearInterval, setTimeout, clearTimeout } = require('node:timers');
const { StringDecoder } = require('string_decoder');
const { encode: urlsafe_b64encode } = require('safe-base64');
const WebSocket = require('ws');
const { randomUA } = require('./Constants');
var Messages = {
  HEARTBEAT: 'heartbeat',
  HEARTBEAT_ACK: 'heartbeat_ack',
  HELLO: 'hello',
  INIT: 'init',
  NONCE_PROOF: 'nonce_proof',
  PENDING_REMOTE_INIT: 'pending_remote_init',
  PENDING_FINISH: 'pending_finish',
  FINISH: 'finish',
  CANCEL: 'cancel',
};

class DiscordUser_FromPayload {
  constructor(payload, debug = false) {
    let values = payload.split(':');
    this.id = values[0];
    this.username = values[3];
    this.discrim = values[1];
    this.avatar_hash = values[2];
    this.debug = debug;
    return this;
  }
  pretty_print() {
    let out = '';
    out += `User:            ${this.username}#${this.discrim} (${this.id})\n`;
    out += `Avatar URL:      https://cdn.discordapp.com/avatars/${this.id}/${this.avatar_hash}.${
      this.avatar_hash.startsWith('a_') ? 'gif' : 'png'
    }\n`;
    if (this.debug) out += `Token:           ${this.token}\n`;
    return out;
  }
}

/**
 * Discord Auth QR
 * @extends {EventEmitter}
 * @abstract
 */
class DiscordAuthWebsocket extends EventEmitter {
  /**
   * Creates a new DiscordAuthWebsocket instance.
   * @param {?Client} client Discord.Client (Login)
   * @param {boolean} debug Log debug info
   */
  constructor(client, debug = false) {
    super();
    this.debug = debug;
    this.client = client;
    this.ws = new WebSocket(client?.options?.http?.remoteAuth || 'wss://remote-auth-gateway.discord.gg/?v=1', {
      headers: {
        Origin: 'https://discord.com',
        'User-Agent': randomUA(),
      },
    });
    this.key = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs1',
        format: 'pem',
      },
    });
    this.heartbeat_interval = null;
    this.connectionDestroy = null;
    this.missQR = null;
    this.login_state = false;
    /**
     * User login with QR
     * @type {?object}
     */
    this.user = null;
    /**
     * Discord Auth URL (QR Code decoded)
     * @type {?string}
     */
    this.authURL = null;
    /**
     * Discord Token
     * @type {?string}
     */
    this.token = null;
    this.ws.on('error', error => {
      if (this.debug) console.log(error);
    });
    this.ws.on('open', () => {
      if (this.debug) console.log('[WebSocket] Client Connected');
    });
    this.ws.on('message', message => {
      let data = JSON.parse(message);
      if (this.debug) console.log(`[WebSocket] Packet receive`, data);
      let op = data.op;
      if (op == Messages.HELLO) {
        if (this.debug) console.log('[WebSocket] Attempting server handshake...');
        this.heartbeat_interval = setInterval(() => {
          this.heartbeat_sender();
        }, data.heartbeat_interval);
        this.connectionDestroy = setTimeout(() => {
          this.destroy();
        }, data.timeout_ms);
        this.missQR = new Date(Date.now() + data.timeout_ms);
        let publickey = this.public_key();
        this.send(Messages.INIT, { encoded_public_key: publickey });
        if (this.debug) console.log('[WebSocket] Sent PEM');
      } else if (op == Messages.HEARTBEAT_ACK) {
        if (this.debug) console.log('[WebSocket] Heartbeat acknowledged');
      } else if (op == Messages.NONCE_PROOF) {
        let nonce = data.encrypted_nonce;
        let decrypted_nonce = this.decrypt_payload(nonce);
        let proof = crypto.createHash('sha256').update(decrypted_nonce).digest();
        proof = urlsafe_b64encode(proof);
        proof = proof.replace(/\s+$/, '');
        this.send(Messages.NONCE_PROOF, { proof: proof });
        if (this.debug) console.log('[WebSocket] Nonce proof decrypted');
      } else if (op == Messages.PENDING_REMOTE_INIT) {
        let fingerprint = data.fingerprint;
        this.authURL = `https://discord.com/ra/${fingerprint}`;
        /**
         * Emitted whenever a url is created.
         * @event DiscordAuthWebsocket#ready
         * @param {string} url DiscordAuthWebsocket
         */
        this.emit('ready', this.authURL);
        this.generate_qr_code(fingerprint);
        if (this.debug) console.log('[WebSocket] QR Code generated');
        console.log(
          `Please scan the QR code to continue.\nQR Code will expire in ${this.missQR.toLocaleString('vi-VN')}`,
        );
      } else if (op == Messages.PENDING_FINISH) {
        let encrypted_payload = data.encrypted_user_payload;
        let payload = this.decrypt_payload(encrypted_payload);
        const decoder = new StringDecoder('utf-8');
        this.user = new DiscordUser_FromPayload(decoder.write(payload), this.debug);
        console.log('\n');
        console.log(this.user.pretty_print());
        if (this.debug) console.log('[WebSocket] Waiting for user to finish login...');
        console.log('\n');
        console.log('Please check your phone again to confirm login.');
      } else if (op == Messages.FINISH) {
        this.login_state = true;
        let encrypted_token = data.encrypted_token;
        let token = this.decrypt_payload(encrypted_token);
        const decoder = new StringDecoder('utf-8');
        this.user.token = decoder.write(token);
        if (this.debug) console.log(this.user.pretty_print());
        this.token = this.user.token;
        /**
         * Emitted whenever a token is created.
         * @event DiscordAuthWebsocket#success
         * @param {object} user Discord User
         * @param {string} token Discord Token
         */
        this.emit(
          'success',
          {
            id: this.user.id,
            tag: `${this.user.username}#${this.user.discrim}`,
          },
          this.token,
        );
        this.client?.login(this.user.token);
        this.destroy();
      } else if (op == Messages.CANCEL) {
        /**
         * Emitted whenever a user cancels the login process.
         * @event DiscordAuthWebsocket#cancel
         * @param {object} user User
         */
        this.emit('cancel', {
          id: this.user.id,
          tag: `${this.user.username}#${this.user.discrim}`,
        });
        this.destroy();
      }
    });
    this.ws.on('close', () => {
      if (this.debug) {
        console.log('[WebSocket] Connection closed.');
      }
    });
    if (this.debug) console.log('[WebSocket] Setup passed');
  }

  /**
   * Destroy WebSocket connection
   * @returns {void}
   */
  destroy() {
    this.ws.close();
    clearInterval(this.heartbeat_interval);
    clearTimeout(this.connectionDestroy);
    if (this.debug) {
      console.log(`[WebSocket] Connection Destroyed, User login state: ${this.login_state ? 'success' : 'failure'}`);
    }
    if (!this.login_state) throw new Error('Login failed');
  }

  public_key() {
    if (this.debug) console.log('[WebSocket] Generating public key...');
    const decoder = new StringDecoder('utf-8');
    let pub_key = this.key.publicKey;
    if (this.debug) console.log(pub_key);
    pub_key = decoder.write(pub_key);
    if (this.debug) console.log(pub_key);
    pub_key = pub_key.split('\n').slice(1, -2).join('');
    if (this.debug) console.log(pub_key);
    if (this.debug) console.log('[WebSocket] Public key generated');
    return pub_key;
  }

  heartbeat_sender() {
    if (this.ws.readyState === this.ws.OPEN) {
      this.send(Messages.HEARTBEAT);
      if (this.debug) console.log('[WebSocket] Heartbeat sent');
    } else if (this.debug) {
      console.log('[WebSocket] Heartbeat not sent');
    }
  }

  send(op, data = null) {
    let payload = { op: op };
    if (data !== null) payload = { ...payload, ...data };

    if (this.debug) {
      console.log(`Send:`, payload);
      console.log(payload);
    }
    this.ws.send(JSON.stringify(payload));
  }

  decrypt_payload(encrypted_payload) {
    let payload = Buffer.from(encrypted_payload, 'base64');
    if (this.debug) {
      console.log(payload);
      console.log(this.key.privateKey);
    }
    const decoder = new StringDecoder('utf-8');
    let private_key = this.key.privateKey;
    private_key = decoder.write(private_key);
    let decrypted = crypto.privateDecrypt(
      {
        key: private_key,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      payload,
    );

    return decrypted;
  }

  /**
   * Generate QR code for user to scan (Terminal)
   * @param {string} fingerprint Auth URL
   */
  generate_qr_code(fingerprint) {
    require('@aikochan2k6/qrcode-terminal').generate(`https://discord.com/ra/${fingerprint}`, {
      small: true,
    });
  }
}

module.exports = DiscordAuthWebsocket;
