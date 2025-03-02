'use strict';

const EventEmitter = require('events');
const { setTimeout, setInterval } = require('node:timers');
const WebSocket = require('../../../WebSocket');
const { Error } = require('../../../errors');
const { Opcodes, VoiceOpcodes } = require('../../../util/Constants');

/**
 * Represents a Voice Connection's WebSocket.
 * @extends {EventEmitter}
 * @private
 */
class VoiceWebSocket extends EventEmitter {
  constructor(connection) {
    super();
    /**
     * The Voice Connection that this WebSocket serves
     * @type {VoiceConnection}
     */
    this.connection = connection;

    /**
     * How many connection attempts have been made
     * @type {number}
     */
    this.attempts = 0;

    this._sequenceNumber = -1;

    this.dead = false;
    this.connection.on('closing', this.shutdown.bind(this));
  }

  /**
   * The client of this voice WebSocket
   * @type {Client}
   * @readonly
   */
  get client() {
    return this.connection.client;
  }

  shutdown() {
    this.emit('debug', `[WS] shutdown requested`);
    this.dead = true;
    this.reset();
  }

  /**
   * Resets the current WebSocket.
   */
  reset() {
    this.emit('debug', `[WS] reset requested`);
    if (this.ws) {
      if (this.ws.readyState !== WebSocket.CLOSED) this.ws.close();
      this.ws = null;
    }
    this.clearHeartbeat();
  }

  /**
   * Starts connecting to the Voice WebSocket Server.
   */
  connect() {
    this.emit('debug', `[WS] connect requested`);
    if (this.dead) return;
    if (this.ws) this.reset();
    if (this.attempts >= 5) {
      this.emit('debug', new Error('VOICE_CONNECTION_ATTEMPTS_EXCEEDED', this.attempts));
      return;
    }

    this.attempts++;

    /**
     * The actual WebSocket used to connect to the Voice WebSocket Server.
     * @type {WebSocket}
     */
    this.ws = WebSocket.create(`wss://${this.connection.authentication.endpoint}/`, { v: 8 });
    this.emit('debug', `[WS] connecting, ${this.attempts} attempts, ${this.ws.url}`);
    this.ws.onopen = this.onOpen.bind(this);
    this.ws.onmessage = this.onMessage.bind(this);
    this.ws.onclose = this.onClose.bind(this);
    this.ws.onerror = this.onError.bind(this);
  }

  /**
   * Sends data to the WebSocket if it is open.
   * @param {string} data The data to send to the WebSocket
   * @returns {Promise<string>}
   */
  send(data) {
    this.emit('debug', `[WS] >> ${data}`);
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) throw new Error('WS_NOT_OPEN', data);
      this.ws.send(data, null, error => {
        if (error) reject(error);
        else resolve(data);
      });
    });
  }

  /**
   * JSON.stringify's a packet and then sends it to the WebSocket Server.
   * @param {Object} packet The packet to send
   * @returns {Promise<string>}
   */
  async sendPacket(packet) {
    packet = JSON.stringify(packet);
    return this.send(packet);
  }

  /**
   * Called whenever the WebSocket opens.
   */
  onOpen() {
    this.emit('debug', `[WS] opened at gateway ${this.connection.authentication.endpoint}`);
    this.sendPacket({
      op: Opcodes.DISPATCH,
      d: {
        server_id: this.connection.serverId || this.connection.channel.guild?.id || this.connection.channel.id,
        user_id: this.client.user.id,
        token: this.connection.authentication.token,
        session_id: this.connection.authentication.sessionId,
        streams: [{ type: 'screen', rid: '100', quality: 100 }],
        video: true,
      },
    }).catch(() => {
      this.emit('error', new Error('VOICE_JOIN_SOCKET_CLOSED'));
    });
  }

  /**
   * Called whenever a message is received from the WebSocket.
   * @param {MessageEvent} event The message event that was received
   * @returns {void}
   */
  onMessage(event) {
    try {
      return this.onPacket(WebSocket.unpack(event.data, 'json'));
    } catch (error) {
      return this.onError(error);
    }
  }

  /**
   * Called whenever the connection to the WebSocket server is lost.
   * @param {CloseEvent} event The WebSocket close event
   */
  onClose(event) {
    this.emit('debug', `[WS] closed with code ${event.code} and reason: ${event.reason}`);
    if (!this.dead) setTimeout(this.connect.bind(this), this.attempts * 1000).unref();
  }

  /**
   * Called whenever an error occurs with the WebSocket.
   * @param {Error} error The error that occurred
   */
  onError(error) {
    this.emit('debug', `[WS] Error: ${error}`);
    this.emit('error', error);
  }

  /**
   * Called whenever a valid packet is received from the WebSocket.
   * @param {Object} packet The received packet
   */
  onPacket(packet) {
    this.emit('debug', `[WS] << ${JSON.stringify(packet)}`);
    if (packet.seq) this._sequenceNumber = packet.seq;
    switch (packet.op) {
      case VoiceOpcodes.HELLO:
        this.setHeartbeat(packet.d.heartbeat_interval);
        break;
      case VoiceOpcodes.READY:
        /**
         * Emitted once the voice WebSocket receives the ready packet.
         * @param {Object} packet The received packet
         * @event VoiceWebSocket#ready
         */
        this.emit('ready', packet.d);
        this.connection.setVideoStatus(false);
        break;
      /* eslint-disable no-case-declarations */
      case VoiceOpcodes.SESSION_DESCRIPTION:
        packet.d.secret_key = new Uint8Array(packet.d.secret_key);
        /**
         * Emitted once the Voice Websocket receives a description of this voice session.
         * @param {Object} packet The received packet
         * @event VoiceWebSocket#sessionDescription
         */
        this.emit('sessionDescription', packet.d);
        break;
      case VoiceOpcodes.CLIENT_CONNECT:
        this.connection.ssrcMap.set(+packet.d.audio_ssrc, {
          userId: packet.d.user_id,
          speaking: 0,
          hasVideo: Boolean(packet.d.video_ssrc),
        });
        break;
      case VoiceOpcodes.CLIENT_DISCONNECT:
        const streamInfo = this.connection.receiver && this.connection.receiver.packets.streams.get(packet.d.user_id);
        if (streamInfo) {
          this.connection.receiver.packets.streams.delete(packet.d.user_id);
          streamInfo.stream.push(null);
        }
        break;
      case VoiceOpcodes.SPEAKING:
        /**
         * Emitted whenever a speaking packet is received.
         * @param {Object} data
         * @event VoiceWebSocket#startSpeaking
         */
        this.emit('startSpeaking', packet.d);
        break;
      case VoiceOpcodes.SOURCES:
        /**
         * Emitted whenever a streaming packet is received.
         * @param {Object} data
         * @event VoiceWebSocket#startStreaming
         */
        this.emit('startStreaming', packet.d);
        break;
      default:
        /**
         * Emitted when an unhandled packet is received.
         * @param {Object} packet
         * @event VoiceWebSocket#unknownPacket
         */
        this.emit('unknownPacket', packet);
        break;
    }
  }

  /**
   * Sets an interval at which to send a heartbeat packet to the WebSocket.
   * @param {number} interval The interval at which to send a heartbeat packet
   */
  setHeartbeat(interval) {
    if (!interval || isNaN(interval)) {
      this.onError(new Error('VOICE_INVALID_HEARTBEAT'));
      return;
    }
    if (this.heartbeatInterval) {
      /**
       * Emitted whenever the voice WebSocket encounters a non-fatal error.
       * @param {string} warn The warning
       * @event VoiceWebSocket#warn
       */
      this.emit('warn', 'A voice heartbeat interval is being overwritten');
      clearInterval(this.heartbeatInterval);
    }
    this.heartbeatInterval = setInterval(this.sendHeartbeat.bind(this), interval).unref();
  }

  /**
   * Clears a heartbeat interval, if one exists.
   */
  clearHeartbeat() {
    if (!this.heartbeatInterval) {
      this.emit('warn', 'Tried to clear a heartbeat interval that does not exist');
      return;
    }
    clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = null;
  }

  /**
   * Sends a heartbeat packet.
   */
  sendHeartbeat() {
    this.sendPacket({
      op: VoiceOpcodes.HEARTBEAT,
      d: {
        t: Date.now(),
        seq_ack: this._sequenceNumber,
      },
    }).catch(() => {
      this.emit('warn', 'Tried to send heartbeat, but connection is not open');
      this.clearHeartbeat();
    });
  }
}

module.exports = VoiceWebSocket;
