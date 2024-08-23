'use strict';

const EventEmitter = require('events');
const { setTimeout } = require('node:timers');
const VoiceUDP = require('./networking/VoiceUDPClient');
const VoiceWebSocket = require('./networking/VoiceWebSocket');
const MediaPlayer = require('./player/MediaPlayer');
const VoiceReceiver = require('./receiver/Receiver');
const { parseStreamKey } = require('./util/Function');
const PlayInterface = require('./util/PlayInterface');
const Silence = require('./util/Silence');
const { Error } = require('../../errors');
const { Opcodes, VoiceOpcodes, VoiceStatus, Events } = require('../../util/Constants');
const Speaking = require('../../util/Speaking');
const Util = require('../../util/Util');

// Workaround for Discord now requiring silence to be sent before being able to receive audio
class SingleSilence extends Silence {
  _read() {
    super._read();
    this.push(null);
  }
}

const SUPPORTED_MODES = ['aead_aes256_gcm_rtpsize', 'aead_xchacha20_poly1305_rtpsize'];
const SUPPORTED_CODECS = ['VP8', 'H264'];

/**
 * Represents a connection to a guild's voice server.
 * ```js
 * // Obtained using:
 * client.voice.joinChannel(channel)
 *   .then(connection => {
 *
 *   });
 * ```
 * @extends {EventEmitter}
 * @implements {PlayInterface}
 */
class VoiceConnection extends EventEmitter {
  constructor(voiceManager, channel) {
    super();

    /**
     * The voice manager that instantiated this connection
     * @type {ClientVoiceManager}
     */
    this.voiceManager = voiceManager;

    /**
     * The voice channel this connection is currently serving
     * @type {VoiceChannel}
     */
    this.channel = channel;

    /**
     * The current status of the voice connection
     * @type {VoiceStatus}
     */
    this.status = VoiceStatus.AUTHENTICATING;

    /**
     * Our current speaking state
     * @type {Readonly<Speaking>}
     */
    this.speaking = new Speaking().freeze();

    /**
     * Our current video state
     * @type {boolean}
     */
    this.videoStatus = false;

    /**
     * The authentication data needed to connect to the voice server
     * @type {Object}
     * @private
     */
    this.authentication = {};

    /**
     * The audio player for this voice connection
     * @type {MediaPlayer}
     */
    this.player = new MediaPlayer(this);

    this.player.on('debug', m => {
      /**
       * Debug info from the connection.
       * @event VoiceConnection#debug
       * @param {string} message The debug message
       */
      this.emit('debug', `audio player - ${m}`);
    });

    this.player.on('error', e => {
      /**
       * Warning info from the connection.
       * @event VoiceConnection#warn
       * @param {string|Error} warning The warning
       */
      this.emit('warn', e);
    });

    this.once('closing', () => this.player.destroy());

    /**
     * Map SSRC values to user IDs
     * @type {Map<number, { userId: Snowflake, speaking: boolean, hasVideo: boolean }>}
     * @private
     */
    this.ssrcMap = new Map();

    /**
     * Tracks which users are talking
     * @type {Map<Snowflake, Readonly<Speaking>>}
     * @private
     */
    this._speaking = new Map();

    /**
     * Object that wraps contains the `ws` and `udp` sockets of this voice connection
     * @type {Object}
     * @private
     */
    this.sockets = {};

    /**
     * The voice receiver of this connection
     * @type {VoiceReceiver}
     */
    this.receiver = new VoiceReceiver(this);

    /**
     * Video codec (encoded)
     * * `VP8`
     * * `VP9` (Not supported)
     * * `H264`
     * * `H265` (Not supported)
     * @typedef {string} VideoCodec
     */

    /**
     * The voice receiver of this connection
     * @type {VideoCodec}
     */
    this.videoCodec = 'H264';

    /**
     * Create a stream connection ?
     * @type {?StreamConnection}
     */
    this.streamConnection = null;
  }

  /**
   * The client that instantiated this connection
   * @type {Client}
   * @readonly
   */
  get client() {
    return this.voiceManager.client;
  }

  /**
   * The current audio dispatcher (if any)
   * @type {?AudioDispatcher}
   * @readonly
   */
  get dispatcher() {
    return this.player.dispatcher;
  }

  /**
   * The current video dispatcher (if any)
   * @type {?VideoDispatcher}
   * @readonly
   */
  get videoDispatcher() {
    return this.player.videoDispatcher;
  }

  /**
   * Sets whether the voice connection should display as "speaking", "soundshare" or "none".
   * @param {BitFieldResolvable} value The new speaking state
   */
  setSpeaking(value) {
    if (this.speaking.equals(value)) return;
    if (this.status !== VoiceStatus.CONNECTED) return;
    this.speaking = new Speaking(value).freeze();
    this.sockets.ws
      .sendPacket({
        op: VoiceOpcodes.SPEAKING,
        d: {
          speaking: this.speaking.bitfield,
          delay: 0,
          ssrc: this.authentication.ssrc,
        },
      })
      .catch(e => {
        this.emit('debug', e);
      });
  }

  /**
   * Set video codec before select protocol
   * @param {VideoCodec} value Codec
   * @returns {VoiceConnection}
   */
  setVideoCodec(value) {
    if (!SUPPORTED_CODECS.includes(value)) throw new Error('INVALID_VIDEO_CODEC', SUPPORTED_CODECS);
    this.videoCodec = value;
    return this;
  }

  /**
   * Sets video status
   * @param {boolean} value Video on or off
   */
  setVideoStatus(value) {
    if (this.status !== VoiceStatus.CONNECTED) return;
    if (value === this.videoStatus) return;
    this.videoStatus = value;
    this.sockets.ws
      .sendPacket({
        op: VoiceOpcodes.SOURCES,
        d: {
          audio_ssrc: this.authentication.ssrc,
          video_ssrc: value ? this.authentication.ssrc + 1 : 0,
          rtx_ssrc: value ? this.authentication.ssrc + 2 : 0,
          streams: [
            {
              type: 'video',
              rid: '100',
              ssrc: value ? this.authentication.ssrc + 1 : 0,
              active: true,
              quality: 100,
              rtx_ssrc: value ? this.authentication.ssrc + 2 : 0,
              max_bitrate: 8000000,
              max_framerate: 60,
              max_resolution: {
                type: 'source',
                width: 0,
                height: 0,
              },
            },
          ],
        },
      })
      .catch(e => {
        this.emit('debug', e);
      });
  }

  /**
   * The voice state of this connection
   * @type {?VoiceState}
   */
  get voice() {
    return this.client.user.voice;
  }

  /**
   * Sends a request to the main gateway to join a voice channel.
   * @param {Object} [options] The options to provide
   * @returns {Promise<Shard>}
   * @private
   */
  sendVoiceStateUpdate(options = {}) {
    options = Util.mergeDefault(
      {
        guild_id: this.channel.guild?.id || null,
        channel_id: this.channel.id,
        self_mute: this.voice ? this.voice.selfMute : false,
        self_deaf: this.voice ? this.voice.selfDeaf : false,
        self_video: this.voice ? this.voice.selfVideo : false,
        flags: 2,
      },
      options,
    );

    this.emit('debug', `Sending voice state update: ${JSON.stringify(options)}`);

    return this.channel.client.ws.broadcast({
      op: Opcodes.VOICE_STATE_UPDATE,
      d: options,
    });
  }

  /**
   * Set the token and endpoint required to connect to the voice servers.
   * @param {string} token The voice token
   * @param {string} endpoint The voice endpoint
   * @returns {void}
   * @private
   */
  setTokenAndEndpoint(token, endpoint) {
    this.emit('debug', `Token "${token}" and endpoint "${endpoint}"`);
    if (!endpoint) {
      // Signifies awaiting endpoint stage
      return;
    }

    if (!token) {
      this.authenticateFailed('VOICE_TOKEN_ABSENT');
      return;
    }

    endpoint = endpoint.match(/([^:]*)/)[0];
    this.emit('debug', `Endpoint resolved as ${endpoint}`);

    if (!endpoint) {
      this.authenticateFailed('VOICE_INVALID_ENDPOINT');
      return;
    }

    if (this.status === VoiceStatus.AUTHENTICATING) {
      this.authentication.token = token;
      this.authentication.endpoint = endpoint;
      this.checkAuthenticated();
    } else if (token !== this.authentication.token || endpoint !== this.authentication.endpoint) {
      this.reconnect(token, endpoint);
    }
  }

  /**
   * Sets the Session ID for the connection.
   * @param {string} sessionId The voice session ID
   * @private
   */
  setSessionId(sessionId) {
    this.emit('debug', `Setting sessionId ${sessionId} (stored as "${this.authentication.sessionId}")`);
    if (!sessionId) {
      this.authenticateFailed('VOICE_SESSION_ABSENT');
      return;
    }

    if (this.status === VoiceStatus.AUTHENTICATING) {
      this.authentication.sessionId = sessionId;
      this.checkAuthenticated();
    } else if (sessionId !== this.authentication.sessionId) {
      this.authentication.sessionId = sessionId;
      /**
       * Emitted when a new session ID is received.
       * @event VoiceConnection#newSession
       * @private
       */
      this.emit('newSession', sessionId);
    }
  }

  /**
   * Checks whether the voice connection is authenticated.
   * @private
   */
  checkAuthenticated() {
    const { token, endpoint, sessionId } = this.authentication;
    this.emit('debug', `Authenticated with sessionId ${sessionId}`);
    if (token && endpoint && sessionId) {
      this.status = VoiceStatus.CONNECTING;
      /**
       * Emitted when we successfully initiate a voice connection.
       * @event VoiceConnection#authenticated
       */
      this.emit('authenticated');
      this.connect();
    }
  }

  /**
   * Invoked when we fail to initiate a voice connection.
   * @param {string} reason The reason for failure
   * @private
   */
  authenticateFailed(reason) {
    clearTimeout(this.connectTimeout);
    this.emit('debug', `Authenticate failed - ${reason}`);
    if (this.status === VoiceStatus.AUTHENTICATING) {
      /**
       * Emitted when we fail to initiate a voice connection.
       * @event VoiceConnection#failed
       * @param {Error} error The encountered error
       */
      this.emit('failed', new Error(reason));
    } else {
      /**
       * Emitted whenever the connection encounters an error.
       * @event VoiceConnection#error
       * @param {Error} error The encountered error
       */
      this.emit('error', new Error(reason));
    }
    this.status = VoiceStatus.DISCONNECTED;
  }

  /**
   * Move to a different voice channel in the same guild.
   * @param {VoiceChannel} channel The channel to move to
   * @private
   */
  updateChannel(channel) {
    this.channel = channel;
    this.sendVoiceStateUpdate();
  }

  /**
   * Attempts to authenticate to the voice server.
   * @param {Object} options Join config
   * @private
   */
  authenticate(options = {}) {
    this.sendVoiceStateUpdate(options);
    this.connectTimeout = setTimeout(() => this.authenticateFailed('VOICE_CONNECTION_TIMEOUT'), 15_000).unref();
  }

  /**
   * Attempts to reconnect to the voice server (typically after a region change).
   * @param {string} token The voice token
   * @param {string} endpoint The voice endpoint
   * @private
   */
  reconnect(token, endpoint) {
    this.authentication.token = token;
    this.authentication.endpoint = endpoint;
    this.speaking = new Speaking().freeze();
    this.status = VoiceStatus.RECONNECTING;
    this.emit('debug', `Reconnecting to ${endpoint}`);
    /**
     * Emitted when the voice connection is reconnecting (typically after a region change).
     * @event VoiceConnection#reconnecting
     */
    this.emit('reconnecting');
    this.connect();
  }

  /**
   * Disconnects the voice connection, causing a disconnect and closing event to be emitted.
   */
  disconnect() {
    this.emit('closing');
    this.emit('debug', 'disconnect() triggered');
    clearTimeout(this.connectTimeout);
    const conn = this.voiceManager.connection;
    if (conn === this) this.voiceManager.connection = null;
    this.sendVoiceStateUpdate({
      channel_id: null,
    });
    this._disconnect();
  }

  /**
   * Internally disconnects (doesn't send disconnect packet).
   * @private
   */
  _disconnect() {
    this.cleanup();
    this.status = VoiceStatus.DISCONNECTED;
    /**
     * Emitted when the voice connection disconnects.
     * @event VoiceConnection#disconnect
     */
    this.emit('disconnect');
  }

  /**
   * Cleans up after disconnect.
   * @private
   */
  cleanup() {
    this.player.destroy();
    this.speaking = new Speaking().freeze();
    const { ws, udp } = this.sockets;

    this.emit('debug', 'Connection clean up');

    if (ws) {
      ws.removeAllListeners('error');
      ws.removeAllListeners('ready');
      ws.removeAllListeners('sessionDescription');
      ws.removeAllListeners('speaking');
      ws.shutdown();
    }

    if (udp) udp.removeAllListeners('error');

    this.sockets.ws = null;
    this.sockets.udp = null;
  }

  /**
   * Connect the voice connection.
   * @private
   */
  connect() {
    this.emit('debug', `Connect triggered`);
    if (this.status !== VoiceStatus.RECONNECTING) {
      if (this.sockets.ws) throw new Error('WS_CONNECTION_EXISTS');
      if (this.sockets.udp) throw new Error('UDP_CONNECTION_EXISTS');
    }

    if (this.sockets.ws) this.sockets.ws.shutdown();
    if (this.sockets.udp) this.sockets.udp.shutdown();

    this.sockets.ws = new VoiceWebSocket(this);
    this.sockets.udp = new VoiceUDP(this);

    const { ws, udp } = this.sockets;

    ws.on('debug', msg => this.emit('debug', msg));
    udp.on('debug', msg => this.emit('debug', msg));
    ws.on('error', err => this.emit('error', err));
    udp.on('error', err => this.emit('error', err));
    ws.on('ready', this.onReady.bind(this));
    ws.on('sessionDescription', this.onSessionDescription.bind(this));
    ws.on('startSpeaking', this.onStartSpeaking.bind(this));
    ws.on('startStreaming', this.onStartStreaming.bind(this));

    this.sockets.ws.connect();
  }

  /**
   * Invoked when the voice websocket is ready.
   * @param {Object} data The received data
   * @private
   */
  onReady(data) {
    Object.assign(this.authentication, data);
    for (let mode of data.modes) {
      if (SUPPORTED_MODES.includes(mode)) {
        this.authentication.mode = mode;
        this.emit('debug', `Selecting the ${mode} mode`);
        break;
      }
    }
    this.sockets.udp.createUDPSocket(data.ip);
  }

  /**
   * Invoked when a session description is received.
   * @param {Object} data The received data
   * @private
   */
  onSessionDescription(data) {
    Object.assign(this.authentication, data);
    this.status = VoiceStatus.CONNECTED;
    const ready = () => {
      clearTimeout(this.connectTimeout);
      this.emit('debug', `Ready with authentication details: ${JSON.stringify(this.authentication)}`);
      /**
       * Emitted once the connection is ready, when a promise to join a voice channel resolves,
       * the connection will already be ready.
       * @event VoiceConnection#ready
       */
      this.emit('ready');
    };
    if (this.dispatcher || this.videoDispatcher) {
      ready();
    } else {
      // This serves to provide support for voice receive, sending audio is required to receive it.
      const dispatcher = this.playAudio(new SingleSilence(), { type: 'opus', volume: false });
      dispatcher.once('finish', ready);
    }
  }

  onStartSpeaking({ user_id, ssrc, speaking }) {
    this.ssrcMap.set(+ssrc, {
      ...(this.ssrcMap.get(+ssrc) || {}),
      userId: user_id,
      speaking: speaking,
    });
  }

  onStartStreaming({ video_ssrc, user_id, audio_ssrc }) {
    this.ssrcMap.set(+audio_ssrc, {
      ...(this.ssrcMap.get(+audio_ssrc) || {}),
      userId: user_id,
      hasVideo: Boolean(video_ssrc), // Maybe ?
    });
    /**
{
  video_ssrc: 0,
  user_id: 'uid',
  streams: [
    {
      ssrc: 27734,
      rtx_ssrc: 27735,
      rid: '100',
      quality: 100,
      max_resolution: { width: 0, type: 'source', height: 0 },,
      max_framerate: 60,
      active: false
    }
  ],
  audio_ssrc: 27733
}
     */
  }

  /**
   * Invoked when a speaking event is received.
   * @param {Object} data The received data
   * @private
   */
  onSpeaking({ user_id, speaking }) {
    speaking = new Speaking(speaking).freeze();
    const guild = this.channel.guild;
    const user = this.client.users.cache.get(user_id);
    const old = this._speaking.get(user_id) || new Speaking(0).freeze();
    this._speaking.set(user_id, speaking);
    /**
     * Emitted whenever a user changes speaking state.
     * @event VoiceConnection#speaking
     * @param {User} user The user that has changed speaking state
     * @param {Readonly<Speaking>} speaking The speaking state of the user
     */
    if (this.status === VoiceStatus.CONNECTED) {
      this.emit('speaking', user, speaking);
      if (!speaking.has(Speaking.FLAGS.SPEAKING)) {
        this.receiver.packets._stoppedSpeaking(user_id);
      }
    }

    if (guild && user && !speaking.equals(old)) {
      const member = guild.members.cache.get(user);
      if (member) {
        /**
         * Emitted once a guild member changes speaking state.
         * @event Client#guildMemberSpeaking
         * @param {GuildMember} member The member that started/stopped speaking
         * @param {Readonly<Speaking>} speaking The speaking state of the member
         */
        this.client.emit(Events.GUILD_MEMBER_SPEAKING, member, speaking);
      }
    }
  }

  playAudio() {} // eslint-disable-line no-empty-function
  playVideo() {} // eslint-disable-line no-empty-function

  /**
   * Create new connection to screenshare stream
   * @returns {Promise<StreamConnection>}
   */
  createStreamConnection() {
    // eslint-disable-next-line consistent-return
    return new Promise((resolve, reject) => {
      if (this.streamConnection) {
        return resolve(this.streamConnection);
      } else {
        const connection = (this.streamConnection = new StreamConnection(this.voiceManager, this.channel, this));
        connection.setVideoCodec(this.videoCodec); // Sync :?
        // Setup event...
        if (!this.eventHook) {
          this.eventHook = true; // Dont listen this event two times :/
          this.channel.client.on('raw', packet => {
            if (
              typeof packet !== 'object' ||
              !packet.t ||
              !packet.d ||
              !this.streamConnection ||
              !packet.d?.stream_key
            ) {
              return;
            }
            const { t: event, d: data } = packet;
            const StreamKey = parseStreamKey(data.stream_key);
            if (StreamKey.userId === this.channel.client.user.id && this.channel.id == StreamKey.channelId) {
              switch (event) {
                case 'STREAM_CREATE': {
                  this.streamConnection.setSessionId(this.authentication.sessionId);
                  this.streamConnection.serverId = data.rtc_server_id;
                  break;
                }
                case 'STREAM_SERVER_UPDATE': {
                  this.streamConnection.setTokenAndEndpoint(data.token, data.endpoint);
                  break;
                }
                case 'STREAM_DELETE': {
                  this.streamConnection.disconnect();
                  break;
                }
              }
            }
          });
        }

        connection.sendSignalScreenshare();
        connection.sendScreenshareState(true);

        connection.on('debug', msg =>
          this.channel.client.emit(
            'debug',
            `[VOICE STREAM (${this.channel.guild?.id || this.channel.id}:${connection.status})]: ${msg}`,
          ),
        );
        connection.once('failed', reason => {
          this.streamConnection = null;
          reject(reason);
        });

        connection.on('error', reject);

        connection.once('authenticated', () => {
          connection.once('ready', () => {
            resolve(connection);
            connection.removeListener('error', reject);
          });
          connection.once('disconnect', () => {
            this.streamConnection = null;
          });
        });
      }
    });
  }
}

/**
 * Represents a connection to a guild's voice server.
 * ```js
 * // Obtained using:
 * client.voice.joinChannel(channel)
 *   .then(connection => connection.createStreamConnection())
 *    .then(connection => {
 *
 *   });
 * ```
 * @extends {VoiceConnection}
 */
class StreamConnection extends VoiceConnection {
  #requestDisconnect = false;
  /**
   * @param {ClientVoiceManager} voiceManager Voice manager
   * @param {Channel} channel any channel (joinable)
   * @param {VoiceConnection} voiceConnection parent
   */
  constructor(voiceManager, channel, voiceConnection) {
    super(voiceManager, channel);

    /**
     * Current voice connection
     * @type {VoiceConnection}
     */
    this.voiceConnection = voiceConnection;

    Object.defineProperty(this, 'voiceConnection', {
      value: voiceConnection,
      writable: false,
    });

    /**
     * Server Id
     * @type {string | null}
     */
    this.serverId = null;

    /**
     * Stream state
     * @type {boolean}
     */
    this.isPaused = false;
  }

  createStreamConnection() {
    return Promise.resolve(this);
  }

  get streamConnection() {
    return this;
  }

  set streamConnection(value) {
    // Why ?
  }

  disconnect() {
    if (this.#requestDisconnect) return;
    this.emit('closing');
    this.emit('debug', 'Stream: disconnect() triggered');
    clearTimeout(this.connectTimeout);
    if (this.voiceConnection.streamConnection === this) this.voiceConnection.streamConnection = null;
    this.sendStopScreenshare();
    this._disconnect();
  }

  /**
   * Create new stream connection (WS packet)
   * @returns {void}
   */
  sendSignalScreenshare() {
    const data = {
      type: ['DM', 'GROUP_DM'].includes(this.channel.type) ? 'call' : 'guild',
      guild_id: this.channel.guild?.id || null,
      channel_id: this.channel.id,
      preferred_region: null,
    };
    this.emit('debug', `Signal Stream: ${JSON.stringify(data)}`);
    return this.channel.client.ws.broadcast({
      op: Opcodes.STREAM_CREATE,
      d: data,
    });
  }

  /**
   * Send screenshare state... (WS)
   * @param {boolean} isPaused screenshare paused ?
   * @returns {void}
   */
  sendScreenshareState(isPaused = false) {
    if (isPaused == this.isPaused) return;
    this.isPaused = isPaused;
    this.channel.client.ws.broadcast({
      op: Opcodes.STREAM_SET_PAUSED,
      d: {
        stream_key: this.streamKey,
        paused: isPaused,
      },
    });
  }

  /**
   * Stop screenshare, delete this connection (WS)
   * @returns {void}
   * @private Using StreamConnection#disconnect()
   */
  sendStopScreenshare() {
    this.#requestDisconnect = true;
    this.channel.client.ws.broadcast({
      op: Opcodes.STREAM_DELETE,
      d: {
        stream_key: this.streamKey,
      },
    });
  }

  /**
   * Current stream key
   * @type {string}
   */
  get streamKey() {
    return `${['DM', 'GROUP_DM'].includes(this.channel.type) ? 'call' : `guild:${this.channel.guild.id}`}:${
      this.channel.id
    }:${this.channel.client.user.id}`;
  }
}

PlayInterface.applyToClass(VoiceConnection);
PlayInterface.applyToClass(StreamConnection);

module.exports = VoiceConnection;
