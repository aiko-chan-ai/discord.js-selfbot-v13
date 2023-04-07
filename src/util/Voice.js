'use strict';
var NoSubscriberBehavior2,
  AudioPlayerStatus2,
  EndBehaviorType2,
  VoiceConnectionStatus2,
  VoiceConnectionDisconnectReason2,
  StreamType2,
  audioCycleInterval,
  __create = Object.create,
  __defProp = Object.defineProperty,
  __getOwnPropDesc = Object.getOwnPropertyDescriptor,
  __getOwnPropNames = Object.getOwnPropertyNames,
  __getProtoOf = Object.getPrototypeOf,
  __hasOwnProp = Object.prototype.hasOwnProperty,
  __defNormalProp = (e, t, s) =>
    t in e ? __defProp(e, t, { enumerable: !0, configurable: !0, writable: !0, value: s }) : (e[t] = s),
  __name = (e, t) => __defProp(e, 'name', { value: t, configurable: !0 }),
  __export = (e, t) => {
    for (var s in t) __defProp(e, s, { get: t[s], enumerable: !0 });
  },
  __copyProps = (e, t, s, i) => {
    if ((t && 'object' == typeof t) || 'function' == typeof t)
      for (let o of __getOwnPropNames(t))
        __hasOwnProp.call(e, o) ||
          o === s ||
          __defProp(e, o, { get: () => t[o], enumerable: !(i = __getOwnPropDesc(t, o)) || i.enumerable });
    return e;
  },
  __toESM = (e, t, s) => (
    (s = null != e ? __create(__getProtoOf(e)) : {}),
    __copyProps(!t && e && e.__esModule ? s : __defProp(s, 'default', { value: e, enumerable: !0 }), e)
  ),
  __toCommonJS = e => __copyProps(__defProp({}, '__esModule', { value: !0 }), e),
  __publicField = (e, t, s) => (__defNormalProp(e, 'symbol' != typeof t ? t + '' : t, s), s),
  src_exports = {};
__export(src_exports, {
  AudioPlayer: () => AudioPlayer,
  AudioPlayerError: () => AudioPlayerError,
  AudioPlayerStatus: () => AudioPlayerStatus,
  AudioReceiveStream: () => AudioReceiveStream,
  AudioResource: () => AudioResource,
  EndBehaviorType: () => EndBehaviorType,
  NoSubscriberBehavior: () => NoSubscriberBehavior,
  PlayerSubscription: () => PlayerSubscription,
  SSRCMap: () => SSRCMap,
  SpeakingMap: () => SpeakingMap,
  StreamType: () => StreamType,
  VoiceConnection: () => VoiceConnection,
  VoiceConnectionDisconnectReason: () => VoiceConnectionDisconnectReason,
  VoiceConnectionStatus: () => VoiceConnectionStatus,
  VoiceReceiver: () => VoiceReceiver,
  createAudioPlayer: () => createAudioPlayer,
  createAudioResource: () => createAudioResource,
  createDefaultAudioReceiveStreamOptions: () => createDefaultAudioReceiveStreamOptions,
  demuxProbe: () => demuxProbe,
  entersState: () => entersState,
  generateDependencyReport: () => generateDependencyReport,
  getGroups: () => getGroups,
  getVoiceConnection: () => getVoiceConnection,
  getVoiceConnections: () => getVoiceConnections,
  joinVoiceChannel: () => joinVoiceChannel,
  validateDiscordOpusHead: () => validateDiscordOpusHead,
  version: () => version2,
}),
  (module.exports = __toCommonJS(src_exports));
var import_node_events7 = require('events'),
  import_v10 = require('discord-api-types/v10');
function createJoinVoiceChannelPayload(e) {
  return {
    op: import_v10.GatewayOpcodes.VoiceStateUpdate,
    d: { guild_id: e.guildId, channel_id: e.channelId, self_deaf: e.selfDeaf, self_mute: e.selfMute },
  };
}
__name(createJoinVoiceChannelPayload, 'createJoinVoiceChannelPayload');
var groups = new Map();
function getOrCreateGroup(e) {
  let t = groups.get(e);
  if (t) return t;
  let s = new Map();
  return groups.set(e, s), s;
}
function getGroups() {
  return groups;
}
function getVoiceConnections(e = 'default') {
  return groups.get(e);
}
function getVoiceConnection(e, t = 'default') {
  return getVoiceConnections(t)?.get(e);
}
function untrackVoiceConnection(e) {
  return getVoiceConnections(e.joinConfig.group)?.delete(e.joinConfig.guildId);
}
function trackVoiceConnection(e) {
  return getOrCreateGroup(e.joinConfig.group).set(e.joinConfig.guildId, e);
}
groups.set('default', new Map()),
  __name(getOrCreateGroup, 'getOrCreateGroup'),
  __name(getGroups, 'getGroups'),
  __name(getVoiceConnections, 'getVoiceConnections'),
  __name(getVoiceConnection, 'getVoiceConnection'),
  __name(untrackVoiceConnection, 'untrackVoiceConnection'),
  __name(trackVoiceConnection, 'trackVoiceConnection');
var FRAME_LENGTH = 20,
  nextTime = -1,
  audioPlayers = [];
function audioCycleStep() {
  if (-1 === nextTime) return;
  nextTime += FRAME_LENGTH;
  let e = audioPlayers.filter(e => e.checkPlayable());
  for (let t of e) t._stepDispatch();
  prepareNextAudioFrame(e);
}
function prepareNextAudioFrame(e) {
  let t = e.shift();
  if (!t) {
    -1 !== nextTime && (audioCycleInterval = setTimeout(() => audioCycleStep(), nextTime - Date.now()));
    return;
  }
  t._stepPrepare(), setImmediate(() => prepareNextAudioFrame(e));
}
function hasAudioPlayer(e) {
  return audioPlayers.includes(e);
}
function addAudioPlayer(e) {
  return (
    hasAudioPlayer(e) ||
      (audioPlayers.push(e),
      1 === audioPlayers.length && ((nextTime = Date.now()), setImmediate(() => audioCycleStep()))),
    e
  );
}
function deleteAudioPlayer(e) {
  let t = audioPlayers.indexOf(e);
  -1 !== t &&
    (audioPlayers.splice(t, 1),
    0 === audioPlayers.length && ((nextTime = -1), void 0 !== audioCycleInterval && clearTimeout(audioCycleInterval)));
}
__name(audioCycleStep, 'audioCycleStep'),
  __name(prepareNextAudioFrame, 'prepareNextAudioFrame'),
  __name(hasAudioPlayer, 'hasAudioPlayer'),
  __name(addAudioPlayer, 'addAudioPlayer'),
  __name(deleteAudioPlayer, 'deleteAudioPlayer');
var import_node_buffer3 = require('buffer'),
  import_node_events3 = require('events'),
  import_v42 = require('discord-api-types/voice/v4'),
  import_node_buffer = require('buffer'),
  libs = {
    'sodium-native': e => ({
      open(t, s, i) {
        if (t) {
          let o = import_node_buffer.Buffer.allocUnsafe(t.length - e.crypto_box_MACBYTES);
          if (e.crypto_secretbox_open_easy(o, t, s, i)) return o;
        }
        return null;
      },
      close(t, s, i) {
        let o = import_node_buffer.Buffer.allocUnsafe(t.length + e.crypto_box_MACBYTES);
        return e.crypto_secretbox_easy(o, t, s, i), o;
      },
      random: (t, s = import_node_buffer.Buffer.allocUnsafe(t)) => (e.randombytes_buf(s), s),
    }),
    sodium: e => ({
      open: e.api.crypto_secretbox_open_easy,
      close: e.api.crypto_secretbox_easy,
      random: (t, s = import_node_buffer.Buffer.allocUnsafe(t)) => (e.api.randombytes_buf(s), s),
    }),
    'libsodium-wrappers': e => ({
      open: e.crypto_secretbox_open_easy,
      close: e.crypto_secretbox_easy,
      random: e.randombytes_buf,
    }),
    tweetnacl: e => ({ open: e.secretbox.open, close: e.secretbox, random: e.randomBytes }),
  },
  fallbackError = __name(() => {
    throw Error(`Cannot play audio as no valid encryption package is installed.
- Install sodium, libsodium-wrappers, or tweetnacl.
- Use the generateDependencyReport() function for more information.
`);
  }, 'fallbackError'),
  methods = { open: fallbackError, close: fallbackError, random: fallbackError };
(async () => {
  for (let e of Object.keys(libs))
    try {
      let t = require(e);
      'libsodium-wrappers' === e && t.ready && (await t.ready), Object.assign(methods, libs[e](t));
      break;
    } catch {}
})();
var noop = __name(() => {}, 'noop'),
  import_node_buffer2 = require('buffer'),
  import_node_dgram = require('dgram'),
  import_node_events = require('events'),
  import_node_net = require('net');
function parseLocalPacket(e) {
  let t = import_node_buffer2.Buffer.from(e),
    s = t.slice(8, t.indexOf(0, 8)).toString('utf8');
  if (!(0, import_node_net.isIPv4)(s)) throw Error('Malformed IP address');
  let i = t.readUInt16BE(t.length - 2);
  return { ip: s, port: i };
}
__name(parseLocalPacket, 'parseLocalPacket');
var KEEP_ALIVE_INTERVAL = 5e3,
  MAX_COUNTER_VALUE = 4294967296 - 1,
  VoiceUDPSocket = class extends import_node_events.EventEmitter {
    socket;
    remote;
    keepAliveCounter = 0;
    keepAliveBuffer;
    keepAliveInterval;
    ping;
    constructor(e) {
      super(),
        (this.socket = (0, import_node_dgram.createSocket)('udp4')),
        this.socket.on('error', e => this.emit('error', e)),
        this.socket.on('message', e => this.onMessage(e)),
        this.socket.on('close', () => this.emit('close')),
        (this.remote = e),
        (this.keepAliveBuffer = import_node_buffer2.Buffer.alloc(8)),
        (this.keepAliveInterval = setInterval(() => this.keepAlive(), KEEP_ALIVE_INTERVAL)),
        setImmediate(() => this.keepAlive());
    }
    onMessage(e) {
      this.emit('message', e);
    }
    keepAlive() {
      this.keepAliveBuffer.writeUInt32LE(this.keepAliveCounter, 0),
        this.send(this.keepAliveBuffer),
        this.keepAliveCounter++,
        this.keepAliveCounter > MAX_COUNTER_VALUE && (this.keepAliveCounter = 0);
    }
    send(e) {
      this.socket.send(e, this.remote.port, this.remote.ip);
    }
    destroy() {
      try {
        this.socket.close();
      } catch {}
      clearInterval(this.keepAliveInterval);
    }
    async performIPDiscovery(e) {
      return new Promise((t, s) => {
        let i = __name(e => {
          try {
            if (2 !== e.readUInt16BE(0)) return;
            let s = parseLocalPacket(e);
            this.socket.off('message', i), t(s);
          } catch {}
        }, 'listener');
        this.socket.on('message', i),
          this.socket.once('close', () => s(Error('Cannot perform IP discovery - socket closed')));
        let o = import_node_buffer2.Buffer.alloc(74);
        o.writeUInt16BE(1, 0), o.writeUInt16BE(70, 2), o.writeUInt32BE(e, 4), this.send(o);
      });
    }
  };
__name(VoiceUDPSocket, 'VoiceUDPSocket');
var import_node_events2 = require('events'),
  import_v4 = require('discord-api-types/voice/v4'),
  import_ws = __toESM(require('ws')),
  VoiceWebSocket = class extends import_node_events2.EventEmitter {
    heartbeatInterval;
    lastHeartbeatAck;
    lastHeartbeatSend;
    missedHeartbeats = 0;
    ping;
    debug;
    ws;
    constructor(e, t) {
      super(),
        (this.ws = new import_ws.default(e)),
        (this.ws.onmessage = e => this.onMessage(e)),
        (this.ws.onopen = e => this.emit('open', e)),
        (this.ws.onerror = e => this.emit('error', e instanceof Error ? e : e.error)),
        (this.ws.onclose = e => this.emit('close', e)),
        (this.lastHeartbeatAck = 0),
        (this.lastHeartbeatSend = 0),
        (this.debug = t ? e => this.emit('debug', e) : null);
    }
    destroy() {
      try {
        this.debug?.('destroyed'), this.setHeartbeatInterval(-1), this.ws.close(1e3);
      } catch (e) {
        this.emit('error', e);
      }
    }
    onMessage(e) {
      if ('string' != typeof e.data) return;
      this.debug?.(`<< ${e.data}`);
      let t;
      try {
        t = JSON.parse(e.data);
      } catch (s) {
        this.emit('error', s);
        return;
      }
      t.op === import_v4.VoiceOpcodes.HeartbeatAck &&
        ((this.lastHeartbeatAck = Date.now()),
        (this.missedHeartbeats = 0),
        (this.ping = this.lastHeartbeatAck - this.lastHeartbeatSend)),
        this.emit('packet', t);
    }
    sendPacket(e) {
      try {
        let t = JSON.stringify(e);
        this.debug?.(`>> ${t}`), this.ws.send(t);
        return;
      } catch (s) {
        this.emit('error', s);
      }
    }
    sendHeartbeat() {
      (this.lastHeartbeatSend = Date.now()), this.missedHeartbeats++;
      let e = this.lastHeartbeatSend;
      this.sendPacket({ op: import_v4.VoiceOpcodes.Heartbeat, d: e });
    }
    setHeartbeatInterval(e) {
      void 0 !== this.heartbeatInterval && clearInterval(this.heartbeatInterval),
        e > 0 &&
          (this.heartbeatInterval = setInterval(() => {
            0 !== this.lastHeartbeatSend &&
              this.missedHeartbeats >= 3 &&
              (this.ws.close(), this.setHeartbeatInterval(-1)),
              this.sendHeartbeat();
          }, e));
    }
  };
__name(VoiceWebSocket, 'VoiceWebSocket');
var CHANNELS = 2,
  TIMESTAMP_INC = 480 * CHANNELS,
  MAX_NONCE_SIZE = 4294967296 - 1,
  SUPPORTED_ENCRYPTION_MODES = ['xsalsa20_poly1305_lite', 'xsalsa20_poly1305_suffix', 'xsalsa20_poly1305'],
  nonce = import_node_buffer3.Buffer.alloc(24);
function stringifyState(e) {
  return JSON.stringify({ ...e, ws: Reflect.has(e, 'ws'), udp: Reflect.has(e, 'udp') });
}
function chooseEncryptionMode(e) {
  let t = e.find(e => SUPPORTED_ENCRYPTION_MODES.includes(e));
  if (!t) throw Error(`No compatible encryption modes. Available include: ${e.join(', ')}`);
  return t;
}
function randomNBit(e) {
  return Math.floor(Math.random() * 2 ** e);
}
__name(stringifyState, 'stringifyState'),
  __name(chooseEncryptionMode, 'chooseEncryptionMode'),
  __name(randomNBit, 'randomNBit');
var Networking = class extends import_node_events3.EventEmitter {
  _state;
  debug;
  constructor(e, t) {
    super(),
      (this.onWsOpen = this.onWsOpen.bind(this)),
      (this.onChildError = this.onChildError.bind(this)),
      (this.onWsPacket = this.onWsPacket.bind(this)),
      (this.onWsClose = this.onWsClose.bind(this)),
      (this.onWsDebug = this.onWsDebug.bind(this)),
      (this.onUdpDebug = this.onUdpDebug.bind(this)),
      (this.onUdpClose = this.onUdpClose.bind(this)),
      (this.debug = t ? e => this.emit('debug', e) : null),
      (this._state = { code: 0, ws: this.createWebSocket(e.endpoint), connectionOptions: e });
  }
  destroy() {
    this.state = { code: 6 };
  }
  get state() {
    return this._state;
  }
  set state(e) {
    let t = Reflect.get(this._state, 'ws'),
      s = Reflect.get(e, 'ws');
    t &&
      t !== s &&
      (t.off('debug', this.onWsDebug),
      t.on('error', noop),
      t.off('error', this.onChildError),
      t.off('open', this.onWsOpen),
      t.off('packet', this.onWsPacket),
      t.off('close', this.onWsClose),
      t.destroy());
    let i = Reflect.get(this._state, 'udp'),
      o = Reflect.get(e, 'udp');
    i &&
      i !== o &&
      (i.on('error', noop),
      i.off('error', this.onChildError),
      i.off('close', this.onUdpClose),
      i.off('debug', this.onUdpDebug),
      i.destroy());
    let n = this._state;
    (this._state = e),
      this.emit('stateChange', n, e),
      this.debug?.(`state change:
from ${stringifyState(n)}
to ${stringifyState(e)}`);
  }
  createWebSocket(e) {
    let t = new VoiceWebSocket(`wss://${e}?v=4`, Boolean(this.debug));
    return (
      t.on('error', this.onChildError),
      t.once('open', this.onWsOpen),
      t.on('packet', this.onWsPacket),
      t.once('close', this.onWsClose),
      t.on('debug', this.onWsDebug),
      t
    );
  }
  onChildError(e) {
    this.emit('error', e);
  }
  onWsOpen() {
    if (0 === this.state.code) {
      let e = {
        op: import_v42.VoiceOpcodes.Identify,
        d: {
          server_id: this.state.connectionOptions.serverId,
          user_id: this.state.connectionOptions.userId,
          session_id: this.state.connectionOptions.sessionId,
          token: this.state.connectionOptions.token,
        },
      };
      this.state.ws.sendPacket(e), (this.state = { ...this.state, code: 1 });
    } else if (5 === this.state.code) {
      let t = {
        op: import_v42.VoiceOpcodes.Resume,
        d: {
          server_id: this.state.connectionOptions.serverId,
          session_id: this.state.connectionOptions.sessionId,
          token: this.state.connectionOptions.token,
        },
      };
      this.state.ws.sendPacket(t);
    }
  }
  onWsClose({ code: e }) {
    (4015 === e || e < 4e3) && 4 === this.state.code
      ? (this.state = { ...this.state, code: 5, ws: this.createWebSocket(this.state.connectionOptions.endpoint) })
      : 6 !== this.state.code && (this.destroy(), this.emit('close', e));
  }
  onUdpClose() {
    4 === this.state.code &&
      (this.state = { ...this.state, code: 5, ws: this.createWebSocket(this.state.connectionOptions.endpoint) });
  }
  onWsPacket(e) {
    if (e.op === import_v42.VoiceOpcodes.Hello && 6 !== this.state.code)
      this.state.ws.setHeartbeatInterval(e.d.heartbeat_interval);
    else if (e.op === import_v42.VoiceOpcodes.Ready && 1 === this.state.code) {
      let { ip: t, port: s, ssrc: i, modes: o } = e.d,
        n = new VoiceUDPSocket({ ip: t, port: s });
      n.on('error', this.onChildError),
        n.on('debug', this.onUdpDebug),
        n.once('close', this.onUdpClose),
        n
          .performIPDiscovery(i)
          .then(e => {
            2 === this.state.code &&
              (this.state.ws.sendPacket({
                op: import_v42.VoiceOpcodes.SelectProtocol,
                d: { protocol: 'udp', data: { address: e.ip, port: e.port, mode: chooseEncryptionMode(o) } },
              }),
              (this.state = { ...this.state, code: 3 }));
          })
          .catch(e => this.emit('error', e)),
        (this.state = { ...this.state, code: 2, udp: n, connectionData: { ssrc: i } });
    } else if (e.op === import_v42.VoiceOpcodes.SessionDescription && 3 === this.state.code) {
      let { mode: r, secret_key: a } = e.d;
      this.state = {
        ...this.state,
        code: 4,
        connectionData: {
          ...this.state.connectionData,
          encryptionMode: r,
          secretKey: new Uint8Array(a),
          sequence: randomNBit(16),
          timestamp: randomNBit(32),
          nonce: 0,
          nonceBuffer: import_node_buffer3.Buffer.alloc(24),
          speaking: !1,
          packetsPlayed: 0,
        },
      };
    } else
      e.op === import_v42.VoiceOpcodes.Resumed &&
        5 === this.state.code &&
        ((this.state = { ...this.state, code: 4 }), (this.state.connectionData.speaking = !1));
  }
  onWsDebug(e) {
    this.debug?.(`[WS] ${e}`);
  }
  onUdpDebug(e) {
    this.debug?.(`[UDP] ${e}`);
  }
  prepareAudioPacket(e) {
    let t = this.state;
    if (4 === t.code) return (t.preparedPacket = this.createAudioPacket(e, t.connectionData)), t.preparedPacket;
  }
  dispatchAudio() {
    let e = this.state;
    return (
      4 === e.code &&
      void 0 !== e.preparedPacket &&
      (this.playAudioPacket(e.preparedPacket), (e.preparedPacket = void 0), !0)
    );
  }
  playAudioPacket(e) {
    let t = this.state;
    if (4 !== t.code) return;
    let { connectionData: s } = t;
    s.packetsPlayed++,
      s.sequence++,
      (s.timestamp += TIMESTAMP_INC),
      s.sequence >= 65536 && (s.sequence = 0),
      s.timestamp >= 4294967296 && (s.timestamp = 0),
      this.setSpeaking(!0),
      t.udp.send(e);
  }
  setSpeaking(e) {
    let t = this.state;
    4 === t.code &&
      t.connectionData.speaking !== e &&
      ((t.connectionData.speaking = e),
      t.ws.sendPacket({
        op: import_v42.VoiceOpcodes.Speaking,
        d: { speaking: e ? 1 : 0, delay: 0, ssrc: t.connectionData.ssrc },
      }));
  }
  createAudioPacket(e, t) {
    let s = import_node_buffer3.Buffer.alloc(12);
    (s[0] = 128), (s[1] = 120);
    let { sequence: i, timestamp: o, ssrc: n } = t;
    return (
      s.writeUIntBE(i, 2, 2),
      s.writeUIntBE(o, 4, 4),
      s.writeUIntBE(n, 8, 4),
      s.copy(nonce, 0, 0, 12),
      import_node_buffer3.Buffer.concat([s, ...this.encryptOpusPacket(e, t)])
    );
  }
  encryptOpusPacket(e, t) {
    let { secretKey: s, encryptionMode: i } = t;
    if ('xsalsa20_poly1305_lite' === i)
      return (
        t.nonce++,
        t.nonce > MAX_NONCE_SIZE && (t.nonce = 0),
        t.nonceBuffer.writeUInt32BE(t.nonce, 0),
        [methods.close(e, t.nonceBuffer, s), t.nonceBuffer.slice(0, 4)]
      );
    if ('xsalsa20_poly1305_suffix' === i) {
      let o = methods.random(24, t.nonceBuffer);
      return [methods.close(e, o, s), o];
    }
    return [methods.close(e, nonce, s)];
  }
};
__name(Networking, 'Networking');
var import_node_buffer5 = require('buffer'),
  import_v43 = require('discord-api-types/voice/v4'),
  import_node_stream = require('stream'),
  import_node_buffer4 = require('buffer'),
  import_node_events4 = require('events'),
  AudioPlayerError = class extends Error {
    resource;
    constructor(e, t) {
      super(e.message), (this.resource = t), (this.name = e.name), (this.stack = e.stack);
    }
  };
__name(AudioPlayerError, 'AudioPlayerError');
var PlayerSubscription = class {
  connection;
  player;
  constructor(e, t) {
    (this.connection = e), (this.player = t);
  }
  unsubscribe() {
    this.connection.onSubscriptionRemoved(this), this.player.unsubscribe(this);
  }
};
__name(PlayerSubscription, 'PlayerSubscription');
var SILENCE_FRAME = import_node_buffer4.Buffer.from([248, 255, 254]),
  NoSubscriberBehavior =
    (((NoSubscriberBehavior2 = NoSubscriberBehavior || {}).Pause = 'pause'),
    (NoSubscriberBehavior2.Play = 'play'),
    (NoSubscriberBehavior2.Stop = 'stop'),
    NoSubscriberBehavior2),
  AudioPlayerStatus =
    (((AudioPlayerStatus2 = AudioPlayerStatus || {}).AutoPaused = 'autopaused'),
    (AudioPlayerStatus2.Buffering = 'buffering'),
    (AudioPlayerStatus2.Idle = 'idle'),
    (AudioPlayerStatus2.Paused = 'paused'),
    (AudioPlayerStatus2.Playing = 'playing'),
    AudioPlayerStatus2);
function stringifyState2(e) {
  return JSON.stringify({ ...e, resource: Reflect.has(e, 'resource'), stepTimeout: Reflect.has(e, 'stepTimeout') });
}
__name(stringifyState2, 'stringifyState');
var AudioPlayer = class extends import_node_events4.EventEmitter {
  _state;
  subscribers = [];
  behaviors;
  debug;
  constructor(e = {}) {
    super(),
      (this._state = { status: 'idle' }),
      (this.behaviors = { noSubscriber: 'pause', maxMissedFrames: 5, ...e.behaviors }),
      (this.debug = !1 === e.debug ? null : e => this.emit('debug', e));
  }
  get playable() {
    return this.subscribers.filter(({ connection: e }) => 'ready' === e.state.status).map(({ connection: e }) => e);
  }
  subscribe(e) {
    let t = this.subscribers.find(t => t.connection === e);
    if (!t) {
      let s = new PlayerSubscription(e, this);
      return this.subscribers.push(s), setImmediate(() => this.emit('subscribe', s)), s;
    }
    return t;
  }
  unsubscribe(e) {
    let t = this.subscribers.indexOf(e),
      s = -1 !== t;
    return s && (this.subscribers.splice(t, 1), e.connection.setSpeaking(!1), this.emit('unsubscribe', e)), s;
  }
  get state() {
    return this._state;
  }
  set state(e) {
    let t = this._state,
      s = Reflect.get(e, 'resource');
    'idle' !== t.status &&
      t.resource !== s &&
      (t.resource.playStream.on('error', noop),
      t.resource.playStream.off('error', t.onStreamError),
      (t.resource.audioPlayer = void 0),
      t.resource.playStream.destroy(),
      t.resource.playStream.read()),
      'buffering' === t.status &&
        ('buffering' !== e.status || e.resource !== t.resource) &&
        (t.resource.playStream.off('end', t.onFailureCallback),
        t.resource.playStream.off('close', t.onFailureCallback),
        t.resource.playStream.off('finish', t.onFailureCallback),
        t.resource.playStream.off('readable', t.onReadableCallback)),
      'idle' === e.status && (this._signalStopSpeaking(), deleteAudioPlayer(this)),
      s && addAudioPlayer(this);
    let i = 'idle' !== t.status && 'playing' === e.status && t.resource !== e.resource;
    (this._state = e),
      this.emit('stateChange', t, this._state),
      (t.status !== e.status || i) && this.emit(e.status, t, this._state),
      this.debug?.(`state change:
from ${stringifyState2(t)}
to ${stringifyState2(e)}`);
  }
  play(e) {
    if (e.ended) throw Error('Cannot play a resource that has already ended.');
    if (e.audioPlayer) {
      if (e.audioPlayer === this) return;
      throw Error('Resource is already being played by another audio player.');
    }
    e.audioPlayer = this;
    let t = __name(t => {
      'idle' !== this.state.status && this.emit('error', new AudioPlayerError(t, this.state.resource)),
        'idle' !== this.state.status && this.state.resource === e && (this.state = { status: 'idle' });
    }, 'onStreamError');
    if ((e.playStream.once('error', t), e.started))
      this.state = { status: 'playing', missedFrames: 0, playbackDuration: 0, resource: e, onStreamError: t };
    else {
      let s = __name(() => {
          'buffering' === this.state.status &&
            this.state.resource === e &&
            (this.state = { status: 'playing', missedFrames: 0, playbackDuration: 0, resource: e, onStreamError: t });
        }, 'onReadableCallback'),
        i = __name(() => {
          'buffering' === this.state.status && this.state.resource === e && (this.state = { status: 'idle' });
        }, 'onFailureCallback');
      e.playStream.once('readable', s),
        e.playStream.once('end', i),
        e.playStream.once('close', i),
        e.playStream.once('finish', i),
        (this.state = {
          status: 'buffering',
          resource: e,
          onReadableCallback: s,
          onFailureCallback: i,
          onStreamError: t,
        });
    }
  }
  pause(e = !0) {
    return (
      'playing' === this.state.status &&
      ((this.state = { ...this.state, status: 'paused', silencePacketsRemaining: e ? 5 : 0 }), !0)
    );
  }
  unpause() {
    return 'paused' === this.state.status && ((this.state = { ...this.state, status: 'playing', missedFrames: 0 }), !0);
  }
  stop(e = !1) {
    return (
      'idle' !== this.state.status &&
      (e || 0 === this.state.resource.silencePaddingFrames
        ? (this.state = { status: 'idle' })
        : -1 === this.state.resource.silenceRemaining &&
          (this.state.resource.silenceRemaining = this.state.resource.silencePaddingFrames),
      !0)
    );
  }
  checkPlayable() {
    let e = this._state;
    return (
      'idle' !== e.status &&
      'buffering' !== e.status &&
      (!!e.resource.readable || ((this.state = { status: 'idle' }), !1))
    );
  }
  _stepDispatch() {
    let e = this._state;
    if ('idle' !== e.status && 'buffering' !== e.status) for (let t of this.playable) t.dispatchAudio();
  }
  _stepPrepare() {
    let e = this._state;
    if ('idle' === e.status || 'buffering' === e.status) return;
    let t = this.playable;
    if (
      ('autopaused' === e.status && t.length > 0 && (this.state = { ...e, status: 'playing', missedFrames: 0 }),
      'paused' === e.status || 'autopaused' === e.status)
    ) {
      e.silencePacketsRemaining > 0 &&
        (e.silencePacketsRemaining--,
        this._preparePacket(SILENCE_FRAME, t, e),
        0 === e.silencePacketsRemaining && this._signalStopSpeaking());
      return;
    }
    if (0 === t.length) {
      if ('pause' === this.behaviors.noSubscriber) {
        this.state = { ...e, status: 'autopaused', silencePacketsRemaining: 5 };
        return;
      }
      'stop' === this.behaviors.noSubscriber && this.stop(!0);
    }
    let s = e.resource.read();
    'playing' === e.status &&
      (s
        ? (this._preparePacket(s, t, e), (e.missedFrames = 0))
        : (this._preparePacket(SILENCE_FRAME, t, e),
          e.missedFrames++,
          e.missedFrames >= this.behaviors.maxMissedFrames && this.stop()));
  }
  _signalStopSpeaking() {
    for (let { connection: e } of this.subscribers) e.setSpeaking(!1);
  }
  _preparePacket(e, t, s) {
    for (let i of ((s.playbackDuration += 20), t)) i.prepareAudioPacket(e);
  }
};
function createAudioPlayer(e) {
  return new AudioPlayer(e);
}
__name(AudioPlayer, 'AudioPlayer'), __name(createAudioPlayer, 'createAudioPlayer');
var EndBehaviorType =
  (((EndBehaviorType2 = EndBehaviorType || {})[(EndBehaviorType2.Manual = 0)] = 'Manual'),
  (EndBehaviorType2[(EndBehaviorType2.AfterSilence = 1)] = 'AfterSilence'),
  (EndBehaviorType2[(EndBehaviorType2.AfterInactivity = 2)] = 'AfterInactivity'),
  EndBehaviorType2);
function createDefaultAudioReceiveStreamOptions() {
  return { end: { behavior: 0 } };
}
__name(createDefaultAudioReceiveStreamOptions, 'createDefaultAudioReceiveStreamOptions');
var AudioReceiveStream = class extends import_node_stream.Readable {
  end;
  endTimeout;
  constructor({ end: e, ...t }) {
    super({ ...t, objectMode: !0 }), (this.end = e);
  }
  push(e) {
    return (
      e &&
        (2 === this.end.behavior ||
          (1 === this.end.behavior && (0 !== e.compare(SILENCE_FRAME) || void 0 === this.endTimeout))) &&
        this.renewEndTimeout(this.end),
      super.push(e)
    );
  }
  renewEndTimeout(e) {
    this.endTimeout && clearTimeout(this.endTimeout), (this.endTimeout = setTimeout(() => this.push(null), e.duration));
  }
  _read() {}
};
__name(AudioReceiveStream, 'AudioReceiveStream');
var import_node_events5 = require('events'),
  SSRCMap = class extends import_node_events5.EventEmitter {
    map;
    constructor() {
      super(), (this.map = new Map());
    }
    update(e) {
      let t = this.map.get(e.audioSSRC),
        s = { ...this.map.get(e.audioSSRC), ...e };
      this.map.set(e.audioSSRC, s), t || this.emit('create', s), this.emit('update', t, s);
    }
    get(e) {
      if ('number' == typeof e) return this.map.get(e);
      for (let t of this.map.values()) if (t.userId === e) return t;
    }
    delete(e) {
      if ('number' == typeof e) {
        let t = this.map.get(e);
        return t && (this.map.delete(e), this.emit('delete', t)), t;
      }
      for (let [s, i] of this.map.entries()) if (i.userId === e) return this.map.delete(s), this.emit('delete', i), i;
    }
  };
__name(SSRCMap, 'SSRCMap');
var import_node_events6 = require('events'),
  _SpeakingMap = class extends import_node_events6.EventEmitter {
    users;
    speakingTimeouts;
    constructor() {
      super(), (this.users = new Map()), (this.speakingTimeouts = new Map());
    }
    onPacket(e) {
      let t = this.speakingTimeouts.get(e);
      t ? clearTimeout(t) : (this.users.set(e, Date.now()), this.emit('start', e)), this.startTimeout(e);
    }
    startTimeout(e) {
      this.speakingTimeouts.set(
        e,
        setTimeout(() => {
          this.emit('end', e), this.speakingTimeouts.delete(e), this.users.delete(e);
        }, _SpeakingMap.DELAY),
      );
    }
  },
  SpeakingMap = _SpeakingMap;
__name(SpeakingMap, 'SpeakingMap'), __publicField(SpeakingMap, 'DELAY', 100);
var VoiceReceiver = class {
  voiceConnection;
  ssrcMap;
  subscriptions;
  connectionData;
  speaking;
  constructor(e) {
    (this.voiceConnection = e),
      (this.ssrcMap = new SSRCMap()),
      (this.speaking = new SpeakingMap()),
      (this.subscriptions = new Map()),
      (this.connectionData = {}),
      (this.onWsPacket = this.onWsPacket.bind(this)),
      (this.onUdpMessage = this.onUdpMessage.bind(this));
  }
  onWsPacket(e) {
    e.op === import_v43.VoiceOpcodes.ClientDisconnect && 'string' == typeof e.d?.user_id
      ? this.ssrcMap.delete(e.d.user_id)
      : e.op === import_v43.VoiceOpcodes.Speaking && 'string' == typeof e.d?.user_id && 'number' == typeof e.d?.ssrc
      ? this.ssrcMap.update({ userId: e.d.user_id, audioSSRC: e.d.ssrc })
      : e.op === import_v43.VoiceOpcodes.ClientConnect &&
        'string' == typeof e.d?.user_id &&
        'number' == typeof e.d?.audio_ssrc &&
        this.ssrcMap.update({
          userId: e.d.user_id,
          audioSSRC: e.d.audio_ssrc,
          videoSSRC: 0 === e.d.video_ssrc ? void 0 : e.d.video_ssrc,
        });
  }
  decrypt(e, t, s, i) {
    let o;
    'xsalsa20_poly1305_lite' === t
      ? (e.copy(s, 0, e.length - 4), (o = e.length - 4))
      : 'xsalsa20_poly1305_suffix' === t
      ? (e.copy(s, 0, e.length - 24), (o = e.length - 24))
      : e.copy(s, 0, 0, 12);
    let n = methods.open(e.slice(12, o), s, i);
    if (n) return import_node_buffer5.Buffer.from(n);
  }
  parsePacket(e, t, s, i) {
    let o = this.decrypt(e, t, s, i);
    if (o) {
      if (190 === o[0] && 222 === o[1]) {
        let n = o.readUInt16BE(2);
        o = o.subarray(4 + 4 * n);
      }
      return o;
    }
  }
  onUdpMessage(e) {
    if (e.length <= 8) return;
    let t = e.readUInt32BE(8),
      s = this.ssrcMap.get(t);
    if (!s) return;
    this.speaking.onPacket(s.userId);
    let i = this.subscriptions.get(s.userId);
    if (i && this.connectionData.encryptionMode && this.connectionData.nonceBuffer && this.connectionData.secretKey) {
      let o = this.parsePacket(
        e,
        this.connectionData.encryptionMode,
        this.connectionData.nonceBuffer,
        this.connectionData.secretKey,
      );
      o ? i.push(o) : i.destroy(Error('Failed to parse packet'));
    }
  }
  subscribe(e, t) {
    let s = this.subscriptions.get(e);
    if (s) return s;
    let i = new AudioReceiveStream({ ...createDefaultAudioReceiveStreamOptions(), ...t });
    return i.once('close', () => this.subscriptions.delete(e)), this.subscriptions.set(e, i), i;
  }
};
__name(VoiceReceiver, 'VoiceReceiver');
var VoiceConnectionStatus =
    (((VoiceConnectionStatus2 = VoiceConnectionStatus || {}).Connecting = 'connecting'),
    (VoiceConnectionStatus2.Destroyed = 'destroyed'),
    (VoiceConnectionStatus2.Disconnected = 'disconnected'),
    (VoiceConnectionStatus2.Ready = 'ready'),
    (VoiceConnectionStatus2.Signalling = 'signalling'),
    VoiceConnectionStatus2),
  VoiceConnectionDisconnectReason =
    (((VoiceConnectionDisconnectReason2 = VoiceConnectionDisconnectReason || {})[
      (VoiceConnectionDisconnectReason2.WebSocketClose = 0)
    ] = 'WebSocketClose'),
    (VoiceConnectionDisconnectReason2[(VoiceConnectionDisconnectReason2.AdapterUnavailable = 1)] =
      'AdapterUnavailable'),
    (VoiceConnectionDisconnectReason2[(VoiceConnectionDisconnectReason2.EndpointRemoved = 2)] = 'EndpointRemoved'),
    (VoiceConnectionDisconnectReason2[(VoiceConnectionDisconnectReason2.Manual = 3)] = 'Manual'),
    VoiceConnectionDisconnectReason2),
  VoiceConnection = class extends import_node_events7.EventEmitter {
    rejoinAttempts;
    _state;
    joinConfig;
    packets;
    receiver;
    debug;
    constructor(e, t) {
      super(),
        (this.debug = t.debug ? e => this.emit('debug', e) : null),
        (this.rejoinAttempts = 0),
        (this.receiver = new VoiceReceiver(this)),
        (this.onNetworkingClose = this.onNetworkingClose.bind(this)),
        (this.onNetworkingStateChange = this.onNetworkingStateChange.bind(this)),
        (this.onNetworkingError = this.onNetworkingError.bind(this)),
        (this.onNetworkingDebug = this.onNetworkingDebug.bind(this));
      let s = t.adapterCreator({
        onVoiceServerUpdate: e => this.addServerPacket(e),
        onVoiceStateUpdate: e => this.addStatePacket(e),
        destroy: () => this.destroy(!1),
      });
      (this._state = { status: 'signalling', adapter: s }),
        (this.packets = { server: void 0, state: void 0 }),
        (this.joinConfig = e);
    }
    get state() {
      return this._state;
    }
    set state(e) {
      let t = this._state,
        s = Reflect.get(t, 'networking'),
        i = Reflect.get(e, 'networking'),
        o = Reflect.get(t, 'subscription'),
        n = Reflect.get(e, 'subscription');
      if (
        (s !== i &&
          (s &&
            (s.on('error', noop),
            s.off('debug', this.onNetworkingDebug),
            s.off('error', this.onNetworkingError),
            s.off('close', this.onNetworkingClose),
            s.off('stateChange', this.onNetworkingStateChange),
            s.destroy()),
          i && this.updateReceiveBindings(i.state, s?.state)),
        'ready' === e.status)
      )
        this.rejoinAttempts = 0;
      else if ('destroyed' === e.status) for (let r of this.receiver.subscriptions.values()) r.destroyed || r.destroy();
      'destroyed' !== t.status && 'destroyed' === e.status && t.adapter.destroy(),
        (this._state = e),
        o && o !== n && o.unsubscribe(),
        this.emit('stateChange', t, e),
        t.status !== e.status && this.emit(e.status, t, e);
    }
    addServerPacket(e) {
      (this.packets.server = e),
        e.endpoint
          ? this.configureNetworking()
          : 'destroyed' !== this.state.status && (this.state = { ...this.state, status: 'disconnected', reason: 2 });
    }
    addStatePacket(e) {
      (this.packets.state = e),
        void 0 !== e.self_deaf && (this.joinConfig.selfDeaf = e.self_deaf),
        void 0 !== e.self_mute && (this.joinConfig.selfMute = e.self_mute),
        e.channel_id && (this.joinConfig.channelId = e.channel_id);
    }
    updateReceiveBindings(e, t) {
      let s = Reflect.get(t ?? {}, 'ws'),
        i = Reflect.get(e, 'ws'),
        o = Reflect.get(t ?? {}, 'udp'),
        n = Reflect.get(e, 'udp');
      s !== i && (s?.off('packet', this.receiver.onWsPacket), i?.on('packet', this.receiver.onWsPacket)),
        o !== n && (o?.off('message', this.receiver.onUdpMessage), n?.on('message', this.receiver.onUdpMessage)),
        (this.receiver.connectionData = Reflect.get(e, 'connectionData') ?? {});
    }
    configureNetworking() {
      let { server: e, state: t } = this.packets;
      if (!e || !t || 'destroyed' === this.state.status || !e.endpoint) return;
      let s = new Networking(
        {
          endpoint: e.endpoint,
          serverId: e.guild_id ?? e.channel_id,
          token: e.token,
          sessionId: t.session_id,
          userId: t.user_id,
        },
        Boolean(this.debug),
      );
      s.once('close', this.onNetworkingClose),
        s.on('stateChange', this.onNetworkingStateChange),
        s.on('error', this.onNetworkingError),
        s.on('debug', this.onNetworkingDebug),
        (this.state = { ...this.state, status: 'connecting', networking: s });
    }
    onNetworkingClose(e) {
      'destroyed' === this.state.status ||
        (4014 === e
          ? (this.state = { ...this.state, status: 'disconnected', reason: 0, closeCode: e })
          : ((this.state = { ...this.state, status: 'signalling' }),
            this.rejoinAttempts++,
            this.state.adapter.sendPayload(createJoinVoiceChannelPayload(this.joinConfig)) ||
              (this.state = { ...this.state, status: 'disconnected', reason: 1 })));
    }
    onNetworkingStateChange(e, t) {
      this.updateReceiveBindings(t, e),
        e.code !== t.code &&
          ('connecting' === this.state.status || 'ready' === this.state.status) &&
          (4 === t.code
            ? (this.state = { ...this.state, status: 'ready' })
            : 6 !== t.code && (this.state = { ...this.state, status: 'connecting' }));
    }
    onNetworkingError(e) {
      this.emit('error', e);
    }
    onNetworkingDebug(e) {
      this.debug?.(`[NW] ${e}`);
    }
    prepareAudioPacket(e) {
      let t = this.state;
      if ('ready' === t.status) return t.networking.prepareAudioPacket(e);
    }
    dispatchAudio() {
      let e = this.state;
      if ('ready' === e.status) return e.networking.dispatchAudio();
    }
    playOpusPacket(e) {
      let t = this.state;
      if ('ready' === t.status) return t.networking.prepareAudioPacket(e), t.networking.dispatchAudio();
    }
    destroy(e = !0) {
      if ('destroyed' === this.state.status)
        throw Error('Cannot destroy VoiceConnection - it has already been destroyed');
      getVoiceConnection(this.joinConfig.guildId, this.joinConfig.group) === this && untrackVoiceConnection(this),
        e && this.state.adapter.sendPayload(createJoinVoiceChannelPayload({ ...this.joinConfig, channelId: null })),
        (this.state = { status: 'destroyed' });
    }
    disconnect() {
      return (
        'destroyed' !== this.state.status &&
        'signalling' !== this.state.status &&
        (((this.joinConfig.channelId = null),
        this.state.adapter.sendPayload(createJoinVoiceChannelPayload(this.joinConfig)))
          ? ((this.state = { adapter: this.state.adapter, reason: 3, status: 'disconnected' }), !0)
          : ((this.state = {
              adapter: this.state.adapter,
              subscription: this.state.subscription,
              status: 'disconnected',
              reason: 1,
            }),
            !1))
      );
    }
    rejoin(e) {
      if ('destroyed' === this.state.status) return !1;
      let t = 'ready' !== this.state.status;
      return (t && this.rejoinAttempts++,
      Object.assign(this.joinConfig, e),
      this.state.adapter.sendPayload(createJoinVoiceChannelPayload(this.joinConfig)))
        ? (t && (this.state = { ...this.state, status: 'signalling' }), !0)
        : ((this.state = {
            adapter: this.state.adapter,
            subscription: this.state.subscription,
            status: 'disconnected',
            reason: 1,
          }),
          !1);
    }
    setSpeaking(e) {
      return 'ready' === this.state.status && this.state.networking.setSpeaking(e);
    }
    subscribe(e) {
      if ('destroyed' === this.state.status) return;
      let t = e.subscribe(this);
      return (this.state = { ...this.state, subscription: t }), t;
    }
    get ping() {
      return 'ready' === this.state.status && 4 === this.state.networking.state.code
        ? { ws: this.state.networking.state.ws.ping, udp: this.state.networking.state.udp.ping }
        : { ws: void 0, udp: void 0 };
    }
    onSubscriptionRemoved(e) {
      'destroyed' !== this.state.status &&
        this.state.subscription === e &&
        (this.state = { ...this.state, subscription: void 0 });
    }
  };
function createVoiceConnection(e, t) {
  let s = createJoinVoiceChannelPayload(e),
    i = getVoiceConnection(e.guildId, e.group);
  if (i && 'destroyed' !== i.state.status)
    return (
      'disconnected' === i.state.status
        ? i.rejoin({ channelId: e.channelId, selfDeaf: e.selfDeaf, selfMute: e.selfMute })
        : i.state.adapter.sendPayload(s) || (i.state = { ...i.state, status: 'disconnected', reason: 1 }),
      i
    );
  let o = new VoiceConnection(e, t);
  return (
    trackVoiceConnection(o),
    'destroyed' === o.state.status ||
      o.state.adapter.sendPayload(s) ||
      (o.state = { ...o.state, status: 'disconnected', reason: 1 }),
    o
  );
}
function joinVoiceChannel(e) {
  let t = { selfDeaf: !0, selfMute: !1, group: 'default', ...e };
  return createVoiceConnection(t, { adapterCreator: e.adapterCreator, debug: e.debug });
}
__name(VoiceConnection, 'VoiceConnection'),
  __name(createVoiceConnection, 'createVoiceConnection'),
  __name(joinVoiceChannel, 'joinVoiceChannel');
var import_node_stream2 = require('stream'),
  import_prism_media2 = __toESM(require('prism-media')),
  import_prism_media = __toESM(require('prism-media')),
  FFMPEG_PCM_ARGUMENTS = ['-analyzeduration', '0', '-loglevel', '0', '-f', 's16le', '-ar', '48000', '-ac', '2'],
  FFMPEG_OPUS_ARGUMENTS = [
    '-analyzeduration',
    '0',
    '-loglevel',
    '0',
    '-acodec',
    'libopus',
    '-f',
    'opus',
    '-ar',
    '48000',
    '-ac',
    '2',
  ],
  StreamType =
    (((StreamType2 = StreamType || {}).Arbitrary = 'arbitrary'),
    (StreamType2.OggOpus = 'ogg/opus'),
    (StreamType2.Opus = 'opus'),
    (StreamType2.Raw = 'raw'),
    (StreamType2.WebmOpus = 'webm/opus'),
    StreamType2),
  Node = class {
    edges = [];
    type;
    constructor(e) {
      this.type = e;
    }
    addEdge(e) {
      this.edges.push({ ...e, from: this });
    }
  };
__name(Node, 'Node');
var NODES = new Map();
for (const streamType of Object.values(StreamType)) NODES.set(streamType, new Node(streamType));
function getNode(e) {
  let t = NODES.get(e);
  if (!t) throw Error(`Node type '${e}' does not exist!`);
  return t;
}
__name(getNode, 'getNode'),
  getNode('raw').addEdge({
    type: 'opus encoder',
    to: getNode('opus'),
    cost: 1.5,
    transformer: () => new import_prism_media.default.opus.Encoder({ rate: 48e3, channels: 2, frameSize: 960 }),
  }),
  getNode('opus').addEdge({
    type: 'opus decoder',
    to: getNode('raw'),
    cost: 1.5,
    transformer: () => new import_prism_media.default.opus.Decoder({ rate: 48e3, channels: 2, frameSize: 960 }),
  }),
  getNode('ogg/opus').addEdge({
    type: 'ogg/opus demuxer',
    to: getNode('opus'),
    cost: 1,
    transformer: () => new import_prism_media.default.opus.OggDemuxer(),
  }),
  getNode('webm/opus').addEdge({
    type: 'webm/opus demuxer',
    to: getNode('opus'),
    cost: 1,
    transformer: () => new import_prism_media.default.opus.WebmDemuxer(),
  });
var FFMPEG_PCM_EDGE = {
  type: 'ffmpeg pcm',
  to: getNode('raw'),
  cost: 2,
  transformer: e =>
    new import_prism_media.default.FFmpeg({
      args: 'string' == typeof e ? ['-i', e, ...FFMPEG_PCM_ARGUMENTS] : FFMPEG_PCM_ARGUMENTS,
    }),
};
function canEnableFFmpegOptimizations() {
  try {
    return import_prism_media.default.FFmpeg.getInfo().output.includes('--enable-libopus');
  } catch {}
  return !1;
}
if (
  (getNode('arbitrary').addEdge(FFMPEG_PCM_EDGE),
  getNode('ogg/opus').addEdge(FFMPEG_PCM_EDGE),
  getNode('webm/opus').addEdge(FFMPEG_PCM_EDGE),
  getNode('raw').addEdge({
    type: 'volume transformer',
    to: getNode('raw'),
    cost: 0.5,
    transformer: () => new import_prism_media.default.VolumeTransformer({ type: 's16le' }),
  }),
  __name(canEnableFFmpegOptimizations, 'canEnableFFmpegOptimizations'),
  canEnableFFmpegOptimizations())
) {
  let e = {
    type: 'ffmpeg ogg',
    to: getNode('ogg/opus'),
    cost: 2,
    transformer: e =>
      new import_prism_media.default.FFmpeg({
        args: 'string' == typeof e ? ['-i', e, ...FFMPEG_OPUS_ARGUMENTS] : FFMPEG_OPUS_ARGUMENTS,
      }),
  };
  getNode('arbitrary').addEdge(e), getNode('ogg/opus').addEdge(e), getNode('webm/opus').addEdge(e);
}
function findPath(e, t, s = getNode('opus'), i = [], o = 5) {
  if (e === s && t(i)) return { cost: 0 };
  if (0 === o) return { cost: Number.POSITIVE_INFINITY };
  let n;
  for (let r of e.edges) {
    if (n && r.cost > n.cost) continue;
    let a = findPath(r.to, t, s, [...i, r], o - 1),
      c = r.cost + a.cost;
    (!n || c < n.cost) && (n = { cost: c, edge: r, next: a });
  }
  return n ?? { cost: Number.POSITIVE_INFINITY };
}
function constructPipeline(e) {
  let t = [],
    s = e;
  for (; s?.edge; ) t.push(s.edge), (s = s.next);
  return t;
}
function findPipeline(e, t) {
  return constructPipeline(findPath(getNode(e), t));
}
__name(findPath, 'findPath'), __name(constructPipeline, 'constructPipeline'), __name(findPipeline, 'findPipeline');
var AudioResource = class {
  playStream;
  edges;
  metadata;
  volume;
  encoder;
  audioPlayer;
  playbackDuration = 0;
  started = !1;
  silencePaddingFrames;
  silenceRemaining = -1;
  constructor(e, t, s, i) {
    for (let o of ((this.edges = e),
    (this.playStream = t.length > 1 ? (0, import_node_stream2.pipeline)(t, noop) : t[0]),
    (this.metadata = s),
    (this.silencePaddingFrames = i),
    t))
      o instanceof import_prism_media2.default.VolumeTransformer
        ? (this.volume = o)
        : o instanceof import_prism_media2.default.opus.Encoder && (this.encoder = o);
    this.playStream.once('readable', () => (this.started = !0));
  }
  get readable() {
    if (0 === this.silenceRemaining) return !1;
    let e = this.playStream.readable;
    return (
      e ||
      (-1 === this.silenceRemaining && (this.silenceRemaining = this.silencePaddingFrames), 0 !== this.silenceRemaining)
    );
  }
  get ended() {
    return this.playStream.readableEnded || this.playStream.destroyed || 0 === this.silenceRemaining;
  }
  read() {
    if (0 === this.silenceRemaining) return null;
    if (this.silenceRemaining > 0) return this.silenceRemaining--, SILENCE_FRAME;
    let e = this.playStream.read();
    return e && (this.playbackDuration += 20), e;
  }
};
__name(AudioResource, 'AudioResource');
var VOLUME_CONSTRAINT = __name(e => e.some(e => 'volume transformer' === e.type), 'VOLUME_CONSTRAINT'),
  NO_CONSTRAINT = __name(() => !0, 'NO_CONSTRAINT');
function inferStreamType(e) {
  if (e instanceof import_prism_media2.default.opus.Encoder) return { streamType: 'opus', hasVolume: !1 };
  if (e instanceof import_prism_media2.default.opus.Decoder) return { streamType: 'raw', hasVolume: !1 };
  if (e instanceof import_prism_media2.default.VolumeTransformer) return { streamType: 'raw', hasVolume: !0 };
  if (e instanceof import_prism_media2.default.opus.OggDemuxer) return { streamType: 'opus', hasVolume: !1 };
  if (e instanceof import_prism_media2.default.opus.WebmDemuxer) return { streamType: 'opus', hasVolume: !1 };
  return { streamType: 'arbitrary', hasVolume: !1 };
}
function createAudioResource(e, t = {}) {
  let s = t.inputType,
    i = Boolean(t.inlineVolume);
  if ('string' == typeof e) s = 'arbitrary';
  else if (void 0 === s) {
    let o = inferStreamType(e);
    (s = o.streamType), (i = i && !o.hasVolume);
  }
  let n = findPipeline(s, i ? VOLUME_CONSTRAINT : NO_CONSTRAINT);
  if (0 === n.length) {
    if ('string' == typeof e) throw Error(`Invalid pipeline constructed for string resource '${e}'`);
    return new AudioResource([], [e], t.metadata ?? null, t.silencePaddingFrames ?? 5);
  }
  let r = n.map(t => t.transformer(e));
  return 'string' != typeof e && r.unshift(e), new AudioResource(n, r, t.metadata ?? null, t.silencePaddingFrames ?? 5);
}
__name(inferStreamType, 'inferStreamType'), __name(createAudioResource, 'createAudioResource');
var import_node_path = require('path'),
  import_prism_media3 = __toESM(require('prism-media'));
function findPackageJSON(e, t, s) {
  if (0 === s) return;
  let i = (0, import_node_path.resolve)(e, './package.json');
  try {
    let o = require(i);
    if (o.name !== t) throw Error('package.json does not match');
    return o;
  } catch {
    return findPackageJSON((0, import_node_path.resolve)(e, '..'), t, s - 1);
  }
}
function version(e) {
  try {
    if ('@discordjs/voice' === e) return '0.16.0';
    let t = findPackageJSON((0, import_node_path.dirname)(require.resolve(e)), e, 3);
    return t?.version ?? 'not found';
  } catch {
    return 'not found';
  }
}
function generateDependencyReport() {
  let e = [],
    t = __name(t => e.push(`- ${t}: ${version(t)}`), 'addVersion');
  e.push('Core Dependencies'),
    t('@discordjs/voice'),
    t('prism-media'),
    e.push(''),
    e.push('Opus Libraries'),
    t('@discordjs/opus'),
    t('opusscript'),
    e.push(''),
    e.push('Encryption Libraries'),
    t('sodium-native'),
    t('sodium'),
    t('libsodium-wrappers'),
    t('tweetnacl'),
    e.push(''),
    e.push('FFmpeg');
  try {
    let s = import_prism_media3.default.FFmpeg.getInfo();
    e.push(`- version: ${s.version}`), e.push(`- libopus: ${s.output.includes('--enable-libopus') ? 'yes' : 'no'}`);
  } catch {
    e.push('- not found');
  }
  return ['-'.repeat(50), ...e, '-'.repeat(50)].join('\n');
}
__name(findPackageJSON, 'findPackageJSON'),
  __name(version, 'version'),
  __name(generateDependencyReport, 'generateDependencyReport');
var import_node_events8 = require('events');
function abortAfter(e) {
  let t = new AbortController(),
    s = setTimeout(() => t.abort(), e);
  return t.signal.addEventListener('abort', () => clearTimeout(s)), [t, t.signal];
}
async function entersState(e, t, s) {
  if (e.state.status !== t) {
    let [i, o] = 'number' == typeof s ? abortAfter(s) : [void 0, s];
    try {
      await (0, import_node_events8.once)(e, t, { signal: o });
    } finally {
      i?.abort();
    }
  }
  return e;
}
__name(abortAfter, 'abortAfter'), __name(entersState, 'entersState');
var import_node_buffer6 = require('buffer'),
  import_node_process = __toESM(require('process')),
  import_node_stream3 = require('stream'),
  import_prism_media4 = __toESM(require('prism-media'));
function validateDiscordOpusHead(e) {
  let t = e.readUInt8(9),
    s = e.readUInt32LE(12);
  return 2 === t && 48e3 === s;
}
async function demuxProbe(e, t = 1024, s = validateDiscordOpusHead) {
  return new Promise((i, o) => {
    if (e.readableObjectMode) {
      o(Error('Cannot probe a readable stream in object mode'));
      return;
    }
    if (e.readableEnded) {
      o(Error('Cannot probe a stream that has ended'));
      return;
    }
    let n = import_node_buffer6.Buffer.alloc(0),
      r,
      a = __name(t => {
        e.off('data', l),
          e.off('close', p),
          e.off('end', p),
          e.pause(),
          (r = t),
          e.readableEnded
            ? i({ stream: import_node_stream3.Readable.from(n), type: t })
            : (n.length > 0 && e.push(n), i({ stream: e, type: t }));
      }, 'finish'),
      c = __name(
        e => t => {
          s(t) && a(e);
        },
        'foundHead',
      ),
      d = new import_prism_media4.default.opus.WebmDemuxer();
    d.once('error', noop), d.on('head', c('webm/opus'));
    let u = new import_prism_media4.default.opus.OggDemuxer();
    u.once('error', noop), u.on('head', c('ogg/opus'));
    let p = __name(() => {
        r || a('arbitrary');
      }, 'onClose'),
      l = __name(s => {
        (n = import_node_buffer6.Buffer.concat([n, s])),
          d.write(s),
          u.write(s),
          n.length >= t && (e.off('data', l), e.pause(), import_node_process.default.nextTick(p));
      }, 'onData');
    e.once('error', o), e.on('data', l), e.once('close', p), e.once('end', p);
  });
}
__name(validateDiscordOpusHead, 'validateDiscordOpusHead'), __name(demuxProbe, 'demuxProbe');
var version2 = '0.16.0';
