'use strict';
const { Buffer } = require('buffer');
const crypto = require('crypto');
const EventEmitter = require('node:events');
const { setTimeout } = require('node:timers');
const { StringDecoder } = require('string_decoder');
const axios = require('axios');
const chalk = require('chalk');
const { encode: urlsafe_b64encode } = require('safe-base64');
const WebSocket = require('ws');
const { defaultUA } = require('./Constants');
const Options = require('./Options');

const defaultClientOptions = Options.createDefault();

const baseURL = 'https://discord.com/ra/';

const wsURL = 'wss://remote-auth-gateway.discord.gg/?v=2';

const receiveEvent = {
  HELLO: 'hello',
  NONCE_PROOF: 'nonce_proof',
  PENDING_REMOTE_INIT: 'pending_remote_init',
  HEARTBEAT_ACK: 'heartbeat_ack',
  PENDING_LOGIN: 'pending_ticket',
  CANCEL: 'cancel',
  SUCCESS: 'pending_login',
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
  WAIT: 'pending',
  SUCCESS: 'success',
  FINISH: 'finish',
  CLOSED: 'closed',
};

/**
 * @typedef {Object} DiscordAuthWebsocketOptions
 * @property {?boolean} [debug=false] Log debug info
 * @property {?boolean} [hiddenLog=false] Hide log ?
 * @property {?boolean} [autoLogin=false] Automatically login (DiscordJS.Client Login) ?
 * @property {?boolean} [failIfError=true] Throw error ?
 * @property {?boolean} [generateQR=true] Create QR Code ?
 * @property {?number} [apiVersion=9] API Version
 * @property {?string} [userAgent] User Agent
 * @property {?Object.<string,string>} [wsProperties]  Web Socket Properties
 */

/**
 * Discord Auth QR (Discord.RemoteAuth will be removed in the future, v13.9.0 release)
 * @extends {EventEmitter}
 * @abstract
 */
class DiscordAuthWebsocket extends EventEmitter {
  /**
   * Creates a new DiscordAuthWebsocket instance.
   * @param {?DiscordAuthWebsocketOptions} options Options
   */
  constructor(options) {
    super();
    /**
     * WebSocket
     * @type {?WebSocket}
     */
    this.ws = null;
    /**
     * Heartbeat Interval
     * @type {?number}
     */
    this.heartbeatInterval = NaN;
    this._expire = NaN;
    this.key = null;
    /**
     * User (Scan QR Code)
     * @type {?Object}
     */
    this.user = null;
    /**
     * Temporary Token (Scan QR Code)
     * @type {?string}
     */
    this.token = undefined;
    /**
     * Real Token (Login)
     * @type {?string}
     */
    this.realToken = undefined;
    /**
     * Fingerprint (QR Code)
     * @type {?string}
     */
    this.fingerprint = null;

    /**
     * Captcha Handler
     * @type {Function}
     * @param {Captcha} data hcaptcha data
     * @returns {Promise<string>} Captcha token
     */
    // eslint-disable-next-line no-unused-vars
    this.captchaHandler = data =>
      new Promise((resolve, reject) => {
        reject(
          new Error(`
Captcha Handler not found - Please set captchaHandler option
Example captchaHandler function:

new DiscordAuthWebsocket({
  captchaHandler: async (data) => {
    const token = await hcaptchaSolver(data.captcha_sitekey, 'discord.com');
    return token;
  }
});

`),
        );
      });

    /**
     * Captcha Cache
     * @type {?Captcha}
     */
    this.captchaCache = null;

    this._validateOptions(options);

    this.callFindRealTokenCount = 0;
  }
  /**
   * Get expire time
   * @type {string} Expire time
   * @readonly
   */
  get exprireTime() {
    return this._expire.toLocaleString('en-US');
  }
  _validateOptions(options = {}) {
    /**
     * Options
     * @type {?DiscordAuthWebsocketOptions}
     */
    this.options = {
      debug: false,
      hiddenLog: false,
      autoLogin: false,
      failIfError: true,
      generateQR: true,
      apiVersion: 9,
      userAgent: defaultUA,
      wsProperties: defaultClientOptions.ws.properties,
      captchaHandler: () => new Error('Captcha Handler not found. Please set captchaHandler option.'),
    };
    if (typeof options == 'object') {
      if (typeof options.debug == 'boolean') this.options.debug = options.debug;
      if (typeof options.hiddenLog == 'boolean') this.options.hiddenLog = options.hiddenLog;
      if (typeof options.autoLogin == 'boolean') this.options.autoLogin = options.autoLogin;
      if (typeof options.failIfError == 'boolean') this.options.failIfError = options.failIfError;
      if (typeof options.generateQR == 'boolean') this.options.generateQR = options.generateQR;
      if (typeof options.apiVersion == 'number') this.options.apiVersion = options.apiVersion;
      if (typeof options.userAgent == 'string') this.options.userAgent = options.userAgent;
      if (typeof options.wsProperties == 'object') this.options.wsProperties = options.wsProperties;
      if (typeof options.captchaHandler == 'function') this.captchaHandler = options.captchaHandler;
    }
  }
  _createWebSocket(url) {
    this.ws = new WebSocket(url, {
      headers: {
        Origin: 'https://discord.com',
        'User-Agent': this.options.userAgent,
      },
    });
    this._handleWebSocket();
  }
  _handleWebSocket() {
    this.ws.on('error', error => {
      this._logger('error', error);
    });
    this.ws.on('open', () => {
      this._logger('debug', 'Client Connected');
    });
    this.ws.on('close', () => {
      this._logger('debug', 'Connection closed.');
    });
    this.ws.on('message', message => {
      this._handleMessage(JSON.parse(message));
    });
  }
  _handleMessage(message) {
    switch (message.op) {
      case receiveEvent.HELLO: {
        this._ready(message);
        break;
      }
      case receiveEvent.NONCE_PROOF: {
        this._receiveNonceProof(message);
        break;
      }
      case receiveEvent.PENDING_REMOTE_INIT: {
        this._pendingRemoteInit(message);
        break;
      }
      case receiveEvent.HEARTBEAT_ACK: {
        this._logger('debug', 'Heartbeat acknowledged.');
        this._heartbeatAck();
        break;
      }
      case receiveEvent.PENDING_LOGIN: {
        this._pendingLogin(message);
        break;
      }
      case receiveEvent.CANCEL: {
        this._logger('debug', 'Cancel login.');
        /**
         * Emitted whenever a user cancels the login process.
         * @event DiscordAuthWebsocket#cancel
         * @param {object} user User (Raw)
         */
        this.emit(Event.CANCEL, this.user);
        this.destroy();
        break;
      }
      case receiveEvent.SUCCESS: {
        this._logger('debug', 'Receive Token - Login Success.', message.ticket);
        /**
         * Emitted whenever a token is created. (Fake token)
         * @event DiscordAuthWebsocket#success
         * @param {object} user Discord User
         * @param {string} token Discord Token (Fake)
         */
        this.emit(Event.SUCCESS, this.user, message.ticket);
        this.token = message.ticket;
        this._findRealToken();
        this._logger('default', 'Get token success.');
        break;
      }
      default: {
        this._logger('debug', `Unknown op: ${message.op}`, message);
      }
    }
  }
  _logger(type = 'default', ...message) {
    if (this.options.hiddenLog) return;
    switch (type.toLowerCase()) {
      case 'error': {
        // eslint-disable-next-line no-unused-expressions
        this.options.failIfError
          ? this._throwError(new Error(message[0]))
          : console.error(chalk.red(`[DiscordRemoteAuth] ERROR`), ...message);
        break;
      }
      case 'default': {
        console.log(chalk.green(`[DiscordRemoteAuth]`), ...message);
        break;
      }
      case 'debug': {
        if (this.options.debug) console.log(chalk.yellow(`[DiscordRemoteAuth] DEBUG`), ...message);
        break;
      }
    }
  }
  _throwError(error) {
    if (error.request) {
      // Axios error
      console.log(chalk.red(`[DiscordRemoteAuth] ERROR`), error.message, error.response);
      throw new Error(`Request failed with status code ${error.response.status}`);
    } else {
      throw error;
    }
  }
  _send(op, data) {
    if (!this.ws) this._throwError(new Error('WebSocket is not connected.'));
    let payload = { op: op };
    if (data !== null) payload = { ...payload, ...data };
    this._logger('debug', `Send Data:`, payload);
    this.ws.send(JSON.stringify(payload));
  }
  _heartbeat() {
    this._send(sendEvent.HEARTBEAT);
  }
  _heartbeatAck() {
    setTimeout(() => {
      this._heartbeat();
    }, this.heartbeatInterval).unref();
  }
  _ready(data) {
    this._logger('debug', 'Attempting server handshake...');
    this._expire = new Date(Date.now() + data.timeout_ms);
    this.heartbeatInterval = data.heartbeat_interval;
    this._createKey();
    this._heartbeatAck();
    this._init();
  }
  _createKey() {
    if (this.key) this._throwError(new Error('Key is already created.'));
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
  }
  _createPublicKey() {
    if (!this.key) this._throwError(new Error('Key is not created.'));
    this._logger('debug', 'Generating public key...');
    const decoder = new StringDecoder('utf-8');
    let pub_key = decoder.write(this.key.publicKey);
    pub_key = pub_key.split('\n').slice(1, -2).join('');
    this._logger('debug', 'Public key generated.', pub_key);
    return pub_key;
  }
  _init() {
    const public_key = this._createPublicKey();
    this._send(sendEvent.INIT, { encoded_public_key: public_key });
  }
  _receiveNonceProof(data) {
    const nonce = data.encrypted_nonce;
    const decrypted_nonce = this._decryptPayload(nonce);
    let proof = crypto.createHash('sha256').update(decrypted_nonce).digest();
    proof = urlsafe_b64encode(proof);
    proof = proof.replace(/\s+$/, '');
    this._send(sendEvent.NONCE_PROOF, { proof: proof });
    this._logger('debug', `Nonce proof decrypted:`, proof);
  }
  _decryptPayload(encrypted_payload) {
    if (!this.key) this._throwError(new Error('Key is not created.'));
    const payload = Buffer.from(encrypted_payload, 'base64');
    this._logger('debug', `Encrypted Payload (Buffer):`, payload);
    const decoder = new StringDecoder('utf-8');
    const private_key = decoder.write(this.key.privateKey);
    const data = crypto.privateDecrypt(
      {
        key: private_key,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      payload,
    );
    this._logger('debug', `Decrypted Payload:`, data.toString());
    return data;
  }
  _pendingLogin(data) {
    const user_data = this._decryptPayload(data.encrypted_user_payload);
    const user = new User(user_data.toString());
    this.user = user;
    /**
     * Emitted whenever a user is scan QR Code.
     * @event DiscordAuthWebsocket#pending
     * @param {object} user Discord User Raw
     */
    this.emit(Event.WAIT, user);
    this._logger('debug', 'Waiting for user to finish login...');
    this.user.prettyPrint(this);
    this._logger('default', 'Please check your phone again to confirm login.');
  }
  _pendingRemoteInit(data) {
    this._logger('debug', `Pending Remote Init:`, data);
    /**
     * Emitted whenever a url is created.
     * @event DiscordAuthWebsocket#ready
     * @param {string} fingerprint Fingerprint
     * @param {string} url DiscordAuthWebsocket
     */
    this.emit(Event.READY, data.fingerprint, `${baseURL}${data.fingerprint}`);
    this.fingerprint = data.fingerprint;
    if (this.options.generateQR) this.generateQR();
  }
  _awaitLogin(client) {
    this.once(Event.FINISH, (user, token) => {
      this._logger('debug', 'Create login state...', user, token);
      client.login(token);
    });
  }
  /**
   * Connect to DiscordAuthWebsocket.
   * @param {?Client} client Using only for auto login.
   * @returns {undefined}
   */
  connect(client) {
    this._createWebSocket(wsURL);
    if (client && this.options.autoLogin) this._awaitLogin(client);
  }
  /**
   * Disconnect from DiscordAuthWebsocket.
   * @returns {undefined}
   */
  destroy() {
    if (!this.ws) this._throwError(new Error('WebSocket is not connected.'));
    this.ws.close();
    /**
     * Emitted whenever a connection is closed.
     * @event DiscordAuthWebsocket#closed
     * @param {boolean} loginState Login state
     */
    this.emit(Event.CLOSED, this.token);
    this._logger('debug', 'WebSocket closed.');
  }
  /**
   * Generate QR code for user to scan (Terminal)
   * @returns {undefined}
   */
  generateQR() {
    if (!this.fingerprint) this._throwError(new Error('Fingerprint is not created.'));
    require('@aikochan2k6/qrcode-terminal').generate(`${baseURL}${this.fingerprint}`, {
      small: true,
    });
    this._logger('default', `Please scan the QR code to continue.\nQR Code will expire in ${this.exprireTime}`);
  }

  async _findRealToken(captchaSolveData) {
    this.callFindRealTokenCount++;
    if (!this.token) return this._throwError(new Error('Token is not created.'));
    if (!captchaSolveData && this.captchaCache) return this._throwError(new Error('Captcha is not solved.'));
    if (this.callFindRealTokenCount > 5) return this._throwError(new Error('Failed to find real token.'));
    this._logger('debug', 'Find real token...');
    const res = await axios
      .post(
        `https://discord.com/api/v${this.options.apiVersion}/users/@me/remote-auth/login`,
        captchaSolveData
          ? {
              ticket: this.token,
              captcha_rqtoken: this.captchaCache.captcha_rqtoken,
              captcha_key: captchaSolveData,
            }
          : {
              ticket: this.token,
            },
        {
          headers: {
            Accept: '*/*',
            'Accept-Language': 'en-US',
            'Content-Type': 'application/json',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            'X-Debug-Options': 'bugReporterEnabled',
            'X-Super-Properties': `${Buffer.from(JSON.stringify(this.options.wsProperties), 'ascii').toString(
              'base64',
            )}`,
            'X-Discord-Locale': 'en-US',
            'User-Agent': this.options.userAgent,
            Referer: 'https://discord.com/channels/@me',
            Connection: 'keep-alive',
          },
        },
      )
      .catch(e => {
        if (e.response.data?.captcha_key) {
          this.captchaCache = e.response.data;
        } else {
          this._throwError(e);
          this.captchaCache = null;
        }
      });
    if (!res && this.captchaCache) {
      this._logger('debug', 'Detect captcha... Try call captchaHandler()', this.captchaCache);
      const token = await this.options.captchaHandler(this.captchaCache);
      return this._findRealToken(token);
    }
    this.realToken = this._decryptPayload(res.data.encrypted_token).toString();
    /**
     * Emitted whenever a real token is found.
     * @event DiscordAuthWebsocket#finish
     * @param {object} user User
     * @param {string} token Real token
     */
    this.emit(Event.FINISH, this.user, this.realToken);
    return this;
  }
}

class User {
  constructor(payload) {
    const values = payload.split(':');
    this.id = values[0];
    this.username = values[3];
    this.discriminator = values[1];
    this.avatar = values[2];
    return this;
  }
  get avatarURL() {
    return `https://cdn.discordapp.com/avatars/${this.id}/${this.avatar}.${
      this.avatar.startsWith('a_') ? 'gif' : 'png'
    }`;
  }
  get tag() {
    return `${this.username}#${this.discriminator}`;
  }
  prettyPrint(RemoteAuth) {
    let string = `\n`;
    string += `         ${chalk.bgBlue('User:')}           `;
    string += `${this.tag} (${this.id})\n`;
    string += `         ${chalk.bgGreen('Avatar URL:')}     `;
    string += chalk.cyan(`${this.avatarURL}\n`);
    string += `         ${chalk.bgMagenta('Token:')}          `;
    string += chalk.red(`${this.token ? this.token : 'Unknown'}`);
    RemoteAuth._logger('default', string);
  }
}

module.exports = DiscordAuthWebsocket;
