'use strict';

const { Buffer } = require('node:buffer');
const crypto = require('node:crypto');
const EventEmitter = require('node:events');
const { StringDecoder } = require('node:string_decoder');
const { setTimeout } = require('node:timers');
const { fetch } = require('undici');
const WebSocket = require('ws');
const { UserAgent } = require('./Constants');
const Options = require('./Options');

const defaultClientOptions = Options.createDefault();

const baseURL = 'https://discord.com/ra/';

const wsURL = 'wss://remote-auth-gateway.discord.gg/?v=2';

const receiveEvent = {
  HELLO: 'hello',
  NONCE_PROOF: 'nonce_proof',
  PENDING_REMOTE_INIT: 'pending_remote_init',
  HEARTBEAT_ACK: 'heartbeat_ack',
  PENDING_TICKET: 'pending_ticket',
  CANCEL: 'cancel',
  PENDING_LOGIN: 'pending_login',
};

const sendEvent = {
  INIT: 'init',
  NONCE_PROOF: 'nonce_proof',
  HEARTBEAT: 'heartbeat',
};

const Event = {
  READY: 'ready',
  ERROR: 'error',
  CANCEL: 'cancel',
  WAIT_SCAN: 'pending',
  FINISH: 'finish',
  CLOSED: 'closed',
  DEBUG: 'debug',
};

/**
 * Discord Auth QR
 * @extends {EventEmitter}
 * @abstract
 */
class DiscordAuthWebsocket extends EventEmitter {
  #ws = null;
  #heartbeatInterval = null;
  #expire = null;
  #publicKey = null;
  #privateKey = null;
  #ticket = null;
  #fingerprint = '';
  #userDecryptString = '';

  /**
   * Creates a new DiscordAuthWebsocket instance.
   */
  constructor() {
    super();
    this.token = '';
  }

  /**
   * @type {string}
   */
  get AuthURL() {
    return baseURL + this.#fingerprint;
  }

  /**
   * @type {Date}
   */
  get exprire() {
    return this.#expire;
  }

  /**
   * @type {UserRaw}
   */
  get user() {
    return DiscordAuthWebsocket.decryptUser(this.#userDecryptString);
  }

  #createWebSocket(url) {
    this.#ws = new WebSocket(url, {
      headers: {
        Origin: 'https://discord.com',
        'User-Agent': UserAgent,
      },
    });
    this.#handleWebSocket();
  }

  #handleWebSocket() {
    this.#ws.on('error', error => {
      /**
       * WS Error
       * @event DiscordAuthWebsocket#error
       * @param {Error} error Error
       */
      this.emit(Event.ERROR, error);
    });
    this.#ws.on('open', () => {
      /**
       * Debug Event
       * @event DiscordAuthWebsocket#debug
       * @param {string} msg Debug msg
       */
      this.emit(Event.DEBUG, '[WS] Client Connected');
    });
    this.#ws.on('close', () => {
      this.emit(Event.DEBUG, '[WS] Connection closed');
    });
    this.#ws.on('message', this.#handleMessage.bind(this));
  }

  #handleMessage(message) {
    message = JSON.parse(message);
    switch (message.op) {
      case receiveEvent.HELLO: {
        this.#ready(message);
        break;
      }

      case receiveEvent.NONCE_PROOF: {
        this.#receiveNonceProof(message);
        break;
      }

      case receiveEvent.PENDING_REMOTE_INIT: {
        this.#fingerprint = message.fingerprint;
        /**
         * Ready Event
         * @event DiscordAuthWebsocket#ready
         * @param {DiscordAuthWebsocket} client WS
         */
        this.emit(Event.READY, this);
        break;
      }

      case receiveEvent.HEARTBEAT_ACK: {
        this.emit(Event.DEBUG, `Heartbeat acknowledged.`);
        this.#heartbeatAck();
        break;
      }

      case receiveEvent.PENDING_TICKET: {
        this.#pendingLogin(message);
        break;
      }

      case receiveEvent.CANCEL: {
        /**
         * Cancel
         * @event DiscordAuthWebsocket#cancel
         * @param {DiscordAuthWebsocket} client WS
         */
        this.emit(Event.CANCEL, this);
        this.destroy();
        break;
      }

      case receiveEvent.PENDING_LOGIN: {
        this.#ticket = message.ticket;
        this.#findRealToken();
        break;
      }
    }
  }

  #send(op, data) {
    if (!this.#ws) return;
    let payload = { op: op };
    if (data !== null) payload = { ...payload, ...data };
    this.#ws.send(JSON.stringify(payload));
  }

  #heartbeatAck() {
    setTimeout(() => {
      this.#send(sendEvent.HEARTBEAT);
    }, this.#heartbeatInterval).unref();
  }

  #ready(data) {
    this.emit(Event.DEBUG, 'Attempting server handshake...');
    this.#expire = new Date(Date.now() + data.timeout_ms);
    this.#heartbeatInterval = data.heartbeat_interval;
    this.#createKey();
    this.#heartbeatAck();
    this.#init();
  }

  #createKey() {
    const key = crypto.generateKeyPairSync('rsa', {
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
    this.#privateKey = key.privateKey;
    this.#publicKey = key.publicKey;
  }

  #encodePublicKey() {
    const decoder = new StringDecoder('utf-8');
    let pub_key = decoder.write(this.#publicKey);
    pub_key = pub_key.split('\n').slice(1, -2).join('');
    return pub_key;
  }

  #init() {
    const public_key = this.#encodePublicKey();
    this.#send(sendEvent.INIT, { encoded_public_key: public_key });
  }

  #receiveNonceProof(data) {
    const nonce = data.encrypted_nonce;
    const decrypted_nonce = this.#decryptPayload(nonce);
    const proof = crypto
      .createHash('sha256')
      .update(decrypted_nonce)
      .digest()
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+/, '')
      .replace(/\s+$/, '');
    this.#send(sendEvent.NONCE_PROOF, { proof: proof });
  }

  #decryptPayload(encrypted_payload) {
    const payload = Buffer.from(encrypted_payload, 'base64');
    const decoder = new StringDecoder('utf-8');
    const private_key = decoder.write(this.#privateKey);
    const data = crypto.privateDecrypt(
      {
        key: private_key,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      payload,
    );
    return data;
  }

  #pendingLogin(data) {
    const user_data = this.#decryptPayload(data.encrypted_user_payload);
    this.#userDecryptString = user_data.toString();

    /**
     * @typedef {Object} UserRaw
     * @property {Snowflake} id
     * @property {string} username
     * @property {number} discriminator
     * @property {string} avatar
     */

    /**
     * Emitted whenever a user is scan QR Code.
     * @event DiscordAuthWebsocket#pending
     * @param {UserRaw} user Discord User Raw
     */
    this.emit(Event.WAIT_SCAN, this.user);
  }

  #awaitLogin(client) {
    return new Promise(r => {
      this.once(Event.FINISH, token => {
        r(client.login(token));
      });
    });
  }

  /**
   * Connect WS
   * @param {Client} [client] DiscordJS Client
   * @returns {Promise<void>}
   */
  connect(client) {
    this.#createWebSocket(wsURL);
    if (client) {
      return this.#awaitLogin(client);
    } else {
      return Promise.resolve();
    }
  }

  /**
   * Destroy client
   * @returns {void}
   */
  destroy() {
    if (!this.ws) return;
    this.ws.close();
    this.emit(Event.DEBUG, 'WebSocket closed.');
    /**
     * Emitted whenever a connection is closed.
     * @event DiscordAuthWebsocket#closed
     */
    this.emit(Event.CLOSED);
  }

  /**
   * Generate QR code for user to scan (Terminal)
   * @returns {void}
   */
  generateQR() {
    if (!this.#fingerprint) return;
    require('qrcode').toString(this.AuthURL, { type: 'utf8', errorCorrectionLevel: 'L' }, (err, url) => {
      if (err) {
        //
      }
      console.log(url);
    });
  }

  #findRealToken() {
    return fetch(`https://discord.com/api/v9/users/@me/remote-auth/login`, {
      method: 'POST',
      headers: {
        Accept: '*/*',
        'Accept-Language': 'en-US',
        'Content-Type': 'application/json',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'X-Debug-Options': 'bugReporterEnabled',
        'X-Super-Properties': `${Buffer.from(JSON.stringify(defaultClientOptions.ws.properties), 'ascii').toString(
          'base64',
        )}`,
        'X-Discord-Locale': 'en-US',
        'User-Agent': UserAgent,
        Referer: 'https://discord.com/channels/@me',
        Connection: 'keep-alive',
        Origin: 'https://discord.com',
      },
      body: JSON.stringify({
        ticket: this.#ticket,
      }),
    })
      .then(r => r.json())
      .then(res => {
        if (res.encrypted_token) {
          this.token = this.#decryptPayload(res.encrypted_token).toString();
        }
        /**
         * Emitted whenever a real token is found.
         * @event DiscordAuthWebsocket#finish
         * @param {string} token Discord Token
         */
        this.emit(Event.FINISH, this.token);
        this.destroy();
      })
      .catch(() => false);
  }

  static decryptUser(payload) {
    const values = payload.split(':');
    const id = values[0];
    const username = values[3];
    const discriminator = values[1];
    const avatar = values[2];
    return {
      id,
      username,
      discriminator,
      avatar,
    };
  }
}

module.exports = DiscordAuthWebsocket;
