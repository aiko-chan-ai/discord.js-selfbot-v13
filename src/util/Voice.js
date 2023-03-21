'use strict';
var __create = Object.create,
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
  __copyProps = (e, t, s, o) => {
    if ((t && 'object' == typeof t) || 'function' == typeof t)
      for (let n of __getOwnPropNames(t))
        __hasOwnProp.call(e, n) ||
          n === s ||
          __defProp(e, n, { get: () => t[n], enumerable: !(o = __getOwnPropDesc(t, n)) || o.enumerable });
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
  const t = groups.get(e);
  if (t) return t;
  const s = new Map();
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
var audioCycleInterval,
  FRAME_LENGTH = 20,
  nextTime = -1,
  audioPlayers = [];
function audioCycleStep() {
  if (-1 === nextTime) return;
  nextTime += FRAME_LENGTH;
  const e = audioPlayers.filter(e => e.checkPlayable());
  for (const t of e) t._stepDispatch();
  prepareNextAudioFrame(e);
}
function prepareNextAudioFrame(e) {
  const t = e.shift();
  t
    ? (t._stepPrepare(), setImmediate(() => prepareNextAudioFrame(e)))
    : -1 !== nextTime && (audioCycleInterval = setTimeout(() => audioCycleStep(), nextTime - Date.now()));
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
  const t = audioPlayers.indexOf(e);
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
      open: (t, s, o) => {
        if (t) {
          const n = import_node_buffer.Buffer.allocUnsafe(t.length - e.crypto_box_MACBYTES);
          if (e.crypto_secretbox_open_easy(n, t, s, o)) return n;
        }
        return null;
      },
      close: (t, s, o) => {
        const n = import_node_buffer.Buffer.allocUnsafe(t.length + e.crypto_box_MACBYTES);
        return e.crypto_secretbox_easy(n, t, s, o), n;
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
    throw new Error(
      'Cannot play audio as no valid encryption package is installed.\n- Install sodium, libsodium-wrappers, or tweetnacl.\n- Use the generateDependencyReport() function for more information.\n',
    );
  }, 'fallbackError'),
  methods = { open: fallbackError, close: fallbackError, random: fallbackError };
(async () => {
  for (const e of Object.keys(libs))
    try {
      const t = require(e);
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
  const t = import_node_buffer2.Buffer.from(e),
    s = t.slice(8, t.indexOf(0, 8)).toString('utf8');
  if (!(0, import_node_net.isIPv4)(s)) throw new Error('Malformed IP address');
  return { ip: s, port: t.readUInt16BE(t.length - 2) };
}
__name(parseLocalPacket, 'parseLocalPacket');
var KEEP_ALIVE_INTERVAL = 5e3,
  MAX_COUNTER_VALUE = 2 ** 32 - 1,
  VoiceUDPSocket = class extends import_node_events.EventEmitter {
    keepAliveCounter = 0;
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
        const o = __name(e => {
          try {
            if (2 !== e.readUInt16BE(0)) return;
            const s = parseLocalPacket(e);
            this.socket.off('message', o), t(s);
          } catch {}
        }, 'listener');
        this.socket.on('message', o),
          this.socket.once('close', () => s(new Error('Cannot perform IP discovery - socket closed')));
        const n = import_node_buffer2.Buffer.alloc(74);
        n.writeUInt16BE(1, 0), n.writeUInt16BE(70, 2), n.writeUInt32BE(e, 4), this.send(n);
      });
    }
  };
__name(VoiceUDPSocket, 'VoiceUDPSocket');
var import_node_events2 = require('events'),
  import_v4 = require('discord-api-types/voice/v4'),
  import_ws = __toESM(require('ws')),
  VoiceWebSocket = class extends import_node_events2.EventEmitter {
    missedHeartbeats = 0;
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
        const t = e;
        this.emit('error', t);
      }
    }
    onMessage(e) {
      if ('string' != typeof e.data) return;
      let t;
      this.debug?.(`<< ${e.data}`);
      try {
        t = JSON.parse(e.data);
      } catch (e) {
        const t = e;
        return void this.emit('error', t);
      }
      t.op === import_v4.VoiceOpcodes.HeartbeatAck &&
        ((this.lastHeartbeatAck = Date.now()),
        (this.missedHeartbeats = 0),
        (this.ping = this.lastHeartbeatAck - this.lastHeartbeatSend)),
        this.emit('packet', t);
    }
    sendPacket(e) {
      try {
        const t = JSON.stringify(e);
        return this.debug?.(`>> ${t}`), void this.ws.send(t);
      } catch (e) {
        const t = e;
        this.emit('error', t);
      }
    }
    sendHeartbeat() {
      (this.lastHeartbeatSend = Date.now()), this.missedHeartbeats++;
      const e = this.lastHeartbeatSend;
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
var NetworkingStatusCode,
  CHANNELS = 2,
  TIMESTAMP_INC = 480 * CHANNELS,
  MAX_NONCE_SIZE = 2 ** 32 - 1,
  SUPPORTED_ENCRYPTION_MODES = ['xsalsa20_poly1305_lite', 'xsalsa20_poly1305_suffix', 'xsalsa20_poly1305'];
!(function (e) {
  (e[(e.OpeningWs = 0)] = 'OpeningWs'),
    (e[(e.Identifying = 1)] = 'Identifying'),
    (e[(e.UdpHandshaking = 2)] = 'UdpHandshaking'),
    (e[(e.SelectingProtocol = 3)] = 'SelectingProtocol'),
    (e[(e.Ready = 4)] = 'Ready'),
    (e[(e.Resuming = 5)] = 'Resuming'),
    (e[(e.Closed = 6)] = 'Closed');
})(NetworkingStatusCode || (NetworkingStatusCode = {}));
var nonce = import_node_buffer3.Buffer.alloc(24);
function stringifyState(e) {
  return JSON.stringify({ ...e, ws: Reflect.has(e, 'ws'), udp: Reflect.has(e, 'udp') });
}
function chooseEncryptionMode(e) {
  const t = e.find(e => SUPPORTED_ENCRYPTION_MODES.includes(e));
  if (!t) throw new Error(`No compatible encryption modes. Available include: ${e.join(', ')}`);
  return t;
}
function randomNBit(e) {
  return Math.floor(Math.random() * 2 ** e);
}
__name(stringifyState, 'stringifyState'),
  __name(chooseEncryptionMode, 'chooseEncryptionMode'),
  __name(randomNBit, 'randomNBit');
var Networking = class extends import_node_events3.EventEmitter {
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
      (this._state = {
        code: NetworkingStatusCode.OpeningWs,
        ws: this.createWebSocket(e.endpoint),
        connectionOptions: e,
      });
  }
  destroy() {
    this.state = { code: NetworkingStatusCode.Closed };
  }
  get state() {
    return this._state;
  }
  set state(e) {
    const t = Reflect.get(this._state, 'ws'),
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
    const o = Reflect.get(this._state, 'udp'),
      n = Reflect.get(e, 'udp');
    o &&
      o !== n &&
      (o.on('error', noop),
      o.off('error', this.onChildError),
      o.off('close', this.onUdpClose),
      o.off('debug', this.onUdpDebug),
      o.destroy());
    const i = this._state;
    (this._state = e),
      this.emit('stateChange', i, e),
      this.debug?.(`state change:\nfrom ${stringifyState(i)}\nto ${stringifyState(e)}`);
  }
  createWebSocket(e) {
    const t = new VoiceWebSocket(`wss://${e}?v=4`, Boolean(this.debug));
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
    if (this.state.code === NetworkingStatusCode.OpeningWs) {
      const e = {
        op: import_v42.VoiceOpcodes.Identify,
        d: {
          server_id: this.state.connectionOptions.serverId,
          user_id: this.state.connectionOptions.userId,
          session_id: this.state.connectionOptions.sessionId,
          token: this.state.connectionOptions.token,
        },
      };
      this.state.ws.sendPacket(e), (this.state = { ...this.state, code: NetworkingStatusCode.Identifying });
    } else if (this.state.code === NetworkingStatusCode.Resuming) {
      const e = {
        op: import_v42.VoiceOpcodes.Resume,
        d: {
          server_id: this.state.connectionOptions.serverId,
          session_id: this.state.connectionOptions.sessionId,
          token: this.state.connectionOptions.token,
        },
      };
      this.state.ws.sendPacket(e);
    }
  }
  onWsClose({ code: e }) {
    (4015 === e || e < 4e3) && this.state.code === NetworkingStatusCode.Ready
      ? (this.state = {
          ...this.state,
          code: NetworkingStatusCode.Resuming,
          ws: this.createWebSocket(this.state.connectionOptions.endpoint),
        })
      : this.state.code !== NetworkingStatusCode.Closed && (this.destroy(), this.emit('close', e));
  }
  onUdpClose() {
    this.state.code === NetworkingStatusCode.Ready &&
      (this.state = {
        ...this.state,
        code: NetworkingStatusCode.Resuming,
        ws: this.createWebSocket(this.state.connectionOptions.endpoint),
      });
  }
  onWsPacket(e) {
    if (e.op === import_v42.VoiceOpcodes.Hello && this.state.code !== NetworkingStatusCode.Closed)
      this.state.ws.setHeartbeatInterval(e.d.heartbeat_interval);
    else if (e.op === import_v42.VoiceOpcodes.Ready && this.state.code === NetworkingStatusCode.Identifying) {
      const { ip: t, port: s, ssrc: o, modes: n } = e.d,
        i = new VoiceUDPSocket({ ip: t, port: s });
      i.on('error', this.onChildError),
        i.on('debug', this.onUdpDebug),
        i.once('close', this.onUdpClose),
        i
          .performIPDiscovery(o)
          .then(e => {
            this.state.code === NetworkingStatusCode.UdpHandshaking &&
              (this.state.ws.sendPacket({
                op: import_v42.VoiceOpcodes.SelectProtocol,
                d: { protocol: 'udp', data: { address: e.ip, port: e.port, mode: chooseEncryptionMode(n) } },
              }),
              (this.state = { ...this.state, code: NetworkingStatusCode.SelectingProtocol }));
          })
          .catch(e => this.emit('error', e)),
        (this.state = {
          ...this.state,
          code: NetworkingStatusCode.UdpHandshaking,
          udp: i,
          connectionData: { ssrc: o },
        });
    } else if (
      e.op === import_v42.VoiceOpcodes.SessionDescription &&
      this.state.code === NetworkingStatusCode.SelectingProtocol
    ) {
      const { mode: t, secret_key: s } = e.d;
      this.state = {
        ...this.state,
        code: NetworkingStatusCode.Ready,
        connectionData: {
          ...this.state.connectionData,
          encryptionMode: t,
          secretKey: new Uint8Array(s),
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
        this.state.code === NetworkingStatusCode.Resuming &&
        ((this.state = { ...this.state, code: NetworkingStatusCode.Ready }), (this.state.connectionData.speaking = !1));
  }
  onWsDebug(e) {
    this.debug?.(`[WS] ${e}`);
  }
  onUdpDebug(e) {
    this.debug?.(`[UDP] ${e}`);
  }
  prepareAudioPacket(e) {
    const t = this.state;
    if (t.code === NetworkingStatusCode.Ready)
      return (t.preparedPacket = this.createAudioPacket(e, t.connectionData)), t.preparedPacket;
  }
  dispatchAudio() {
    const e = this.state;
    return (
      e.code === NetworkingStatusCode.Ready &&
      void 0 !== e.preparedPacket &&
      (this.playAudioPacket(e.preparedPacket), (e.preparedPacket = void 0), !0)
    );
  }
  playAudioPacket(e) {
    const t = this.state;
    if (t.code !== NetworkingStatusCode.Ready) return;
    const { connectionData: s } = t;
    s.packetsPlayed++,
      s.sequence++,
      (s.timestamp += TIMESTAMP_INC),
      s.sequence >= 65536 && (s.sequence = 0),
      s.timestamp >= 2 ** 32 && (s.timestamp = 0),
      this.setSpeaking(!0),
      t.udp.send(e);
  }
  setSpeaking(e) {
    const t = this.state;
    t.code === NetworkingStatusCode.Ready &&
      t.connectionData.speaking !== e &&
      ((t.connectionData.speaking = e),
      t.ws.sendPacket({
        op: import_v42.VoiceOpcodes.Speaking,
        d: { speaking: e ? 1 : 0, delay: 0, ssrc: t.connectionData.ssrc },
      }));
  }
  createAudioPacket(e, t) {
    const s = import_node_buffer3.Buffer.alloc(12);
    (s[0] = 128), (s[1] = 120);
    const { sequence: o, timestamp: n, ssrc: i } = t;
    return (
      s.writeUIntBE(o, 2, 2),
      s.writeUIntBE(n, 4, 4),
      s.writeUIntBE(i, 8, 4),
      s.copy(nonce, 0, 0, 12),
      import_node_buffer3.Buffer.concat([s, ...this.encryptOpusPacket(e, t)])
    );
  }
  encryptOpusPacket(e, t) {
    const { secretKey: s, encryptionMode: o } = t;
    if ('xsalsa20_poly1305_lite' === o)
      return (
        t.nonce++,
        t.nonce > MAX_NONCE_SIZE && (t.nonce = 0),
        t.nonceBuffer.writeUInt32BE(t.nonce, 0),
        [methods.close(e, t.nonceBuffer, s), t.nonceBuffer.slice(0, 4)]
      );
    if ('xsalsa20_poly1305_suffix' === o) {
      const o = methods.random(24, t.nonceBuffer);
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
    constructor(e, t) {
      super(e.message), (this.resource = t), (this.name = e.name), (this.stack = e.stack);
    }
  };
__name(AudioPlayerError, 'AudioPlayerError');
var PlayerSubscription = class {
  constructor(e, t) {
    (this.connection = e), (this.player = t);
  }
  unsubscribe() {
    this.connection.onSubscriptionRemoved(this), this.player.unsubscribe(this);
  }
};
__name(PlayerSubscription, 'PlayerSubscription');
var NoSubscriberBehavior,
  AudioPlayerStatus,
  SILENCE_FRAME = import_node_buffer4.Buffer.from([248, 255, 254]);
function stringifyState2(e) {
  return JSON.stringify({ ...e, resource: Reflect.has(e, 'resource'), stepTimeout: Reflect.has(e, 'stepTimeout') });
}
!(function (e) {
  (e.Pause = 'pause'), (e.Play = 'play'), (e.Stop = 'stop');
})(NoSubscriberBehavior || (NoSubscriberBehavior = {})),
  (function (e) {
    (e.AutoPaused = 'autopaused'),
      (e.Buffering = 'buffering'),
      (e.Idle = 'idle'),
      (e.Paused = 'paused'),
      (e.Playing = 'playing');
  })(AudioPlayerStatus || (AudioPlayerStatus = {})),
  __name(stringifyState2, 'stringifyState');
var EndBehaviorType,
  AudioPlayer = class extends import_node_events4.EventEmitter {
    subscribers = [];
    constructor(e = {}) {
      super(),
        (this._state = { status: AudioPlayerStatus.Idle }),
        (this.behaviors = { noSubscriber: NoSubscriberBehavior.Pause, maxMissedFrames: 5, ...e.behaviors }),
        (this.debug = !1 === e.debug ? null : e => this.emit('debug', e));
    }
    get playable() {
      return this.subscribers
        .filter(({ connection: e }) => e.state.status === VoiceConnectionStatus.Ready)
        .map(({ connection: e }) => e);
    }
    subscribe(e) {
      const t = this.subscribers.find(t => t.connection === e);
      if (!t) {
        const t = new PlayerSubscription(e, this);
        return this.subscribers.push(t), setImmediate(() => this.emit('subscribe', t)), t;
      }
      return t;
    }
    unsubscribe(e) {
      const t = this.subscribers.indexOf(e),
        s = -1 !== t;
      return s && (this.subscribers.splice(t, 1), e.connection.setSpeaking(!1), this.emit('unsubscribe', e)), s;
    }
    get state() {
      return this._state;
    }
    set state(e) {
      const t = this._state,
        s = Reflect.get(e, 'resource');
      t.status !== AudioPlayerStatus.Idle &&
        t.resource !== s &&
        (t.resource.playStream.on('error', noop),
        t.resource.playStream.off('error', t.onStreamError),
        (t.resource.audioPlayer = void 0),
        t.resource.playStream.destroy(),
        t.resource.playStream.read()),
        t.status !== AudioPlayerStatus.Buffering ||
          (e.status === AudioPlayerStatus.Buffering && e.resource === t.resource) ||
          (t.resource.playStream.off('end', t.onFailureCallback),
          t.resource.playStream.off('close', t.onFailureCallback),
          t.resource.playStream.off('finish', t.onFailureCallback),
          t.resource.playStream.off('readable', t.onReadableCallback)),
        e.status === AudioPlayerStatus.Idle && (this._signalStopSpeaking(), deleteAudioPlayer(this)),
        s && addAudioPlayer(this);
      const o =
        t.status !== AudioPlayerStatus.Idle && e.status === AudioPlayerStatus.Playing && t.resource !== e.resource;
      (this._state = e),
        this.emit('stateChange', t, this._state),
        (t.status !== e.status || o) && this.emit(e.status, t, this._state),
        this.debug?.(`state change:\nfrom ${stringifyState2(t)}\nto ${stringifyState2(e)}`);
    }
    play(e) {
      if (e.ended) throw new Error('Cannot play a resource that has already ended.');
      if (e.audioPlayer) {
        if (e.audioPlayer === this) return;
        throw new Error('Resource is already being played by another audio player.');
      }
      e.audioPlayer = this;
      const t = __name(t => {
        this.state.status !== AudioPlayerStatus.Idle &&
          this.emit('error', new AudioPlayerError(t, this.state.resource)),
          this.state.status !== AudioPlayerStatus.Idle &&
            this.state.resource === e &&
            (this.state = { status: AudioPlayerStatus.Idle });
      }, 'onStreamError');
      if ((e.playStream.once('error', t), e.started))
        this.state = {
          status: AudioPlayerStatus.Playing,
          missedFrames: 0,
          playbackDuration: 0,
          resource: e,
          onStreamError: t,
        };
      else {
        const s = __name(() => {
            this.state.status === AudioPlayerStatus.Buffering &&
              this.state.resource === e &&
              (this.state = {
                status: AudioPlayerStatus.Playing,
                missedFrames: 0,
                playbackDuration: 0,
                resource: e,
                onStreamError: t,
              });
          }, 'onReadableCallback'),
          o = __name(() => {
            this.state.status === AudioPlayerStatus.Buffering &&
              this.state.resource === e &&
              (this.state = { status: AudioPlayerStatus.Idle });
          }, 'onFailureCallback');
        e.playStream.once('readable', s),
          e.playStream.once('end', o),
          e.playStream.once('close', o),
          e.playStream.once('finish', o),
          (this.state = {
            status: AudioPlayerStatus.Buffering,
            resource: e,
            onReadableCallback: s,
            onFailureCallback: o,
            onStreamError: t,
          });
      }
    }
    pause(e = !0) {
      return (
        this.state.status === AudioPlayerStatus.Playing &&
        ((this.state = { ...this.state, status: AudioPlayerStatus.Paused, silencePacketsRemaining: e ? 5 : 0 }), !0)
      );
    }
    unpause() {
      return (
        this.state.status === AudioPlayerStatus.Paused &&
        ((this.state = { ...this.state, status: AudioPlayerStatus.Playing, missedFrames: 0 }), !0)
      );
    }
    stop(e = !1) {
      return (
        this.state.status !== AudioPlayerStatus.Idle &&
        (e || 0 === this.state.resource.silencePaddingFrames
          ? (this.state = { status: AudioPlayerStatus.Idle })
          : -1 === this.state.resource.silenceRemaining &&
            (this.state.resource.silenceRemaining = this.state.resource.silencePaddingFrames),
        !0)
      );
    }
    checkPlayable() {
      const e = this._state;
      return (
        e.status !== AudioPlayerStatus.Idle &&
        e.status !== AudioPlayerStatus.Buffering &&
        (!!e.resource.readable || ((this.state = { status: AudioPlayerStatus.Idle }), !1))
      );
    }
    _stepDispatch() {
      const e = this._state;
      if (e.status !== AudioPlayerStatus.Idle && e.status !== AudioPlayerStatus.Buffering)
        for (const e of this.playable) e.dispatchAudio();
    }
    _stepPrepare() {
      const e = this._state;
      if (e.status === AudioPlayerStatus.Idle || e.status === AudioPlayerStatus.Buffering) return;
      const t = this.playable;
      if (
        (e.status === AudioPlayerStatus.AutoPaused &&
          t.length > 0 &&
          (this.state = { ...e, status: AudioPlayerStatus.Playing, missedFrames: 0 }),
        e.status === AudioPlayerStatus.Paused || e.status === AudioPlayerStatus.AutoPaused)
      )
        return void (
          e.silencePacketsRemaining > 0 &&
          (e.silencePacketsRemaining--,
          this._preparePacket(SILENCE_FRAME, t, e),
          0 === e.silencePacketsRemaining && this._signalStopSpeaking())
        );
      if (0 === t.length) {
        if (this.behaviors.noSubscriber === NoSubscriberBehavior.Pause)
          return void (this.state = { ...e, status: AudioPlayerStatus.AutoPaused, silencePacketsRemaining: 5 });
        this.behaviors.noSubscriber === NoSubscriberBehavior.Stop && this.stop(!0);
      }
      const s = e.resource.read();
      e.status === AudioPlayerStatus.Playing &&
        (s
          ? (this._preparePacket(s, t, e), (e.missedFrames = 0))
          : (this._preparePacket(SILENCE_FRAME, t, e),
            e.missedFrames++,
            e.missedFrames >= this.behaviors.maxMissedFrames && this.stop()));
    }
    _signalStopSpeaking() {
      for (const { connection: e } of this.subscribers) e.setSpeaking(!1);
    }
    _preparePacket(e, t, s) {
      s.playbackDuration += 20;
      for (const s of t) s.prepareAudioPacket(e);
    }
  };
function createAudioPlayer(e) {
  return new AudioPlayer(e);
}
function createDefaultAudioReceiveStreamOptions() {
  return { end: { behavior: EndBehaviorType.Manual } };
}
__name(AudioPlayer, 'AudioPlayer'),
  __name(createAudioPlayer, 'createAudioPlayer'),
  (function (e) {
    (e[(e.Manual = 0)] = 'Manual'),
      (e[(e.AfterSilence = 1)] = 'AfterSilence'),
      (e[(e.AfterInactivity = 2)] = 'AfterInactivity');
  })(EndBehaviorType || (EndBehaviorType = {})),
  __name(createDefaultAudioReceiveStreamOptions, 'createDefaultAudioReceiveStreamOptions');
var AudioReceiveStream = class extends import_node_stream.Readable {
  constructor({ end: e, ...t }) {
    super({ ...t, objectMode: !0 }), (this.end = e);
  }
  push(e) {
    return (
      !e ||
        (this.end.behavior !== EndBehaviorType.AfterInactivity &&
          (this.end.behavior !== EndBehaviorType.AfterSilence ||
            (0 === e.compare(SILENCE_FRAME) && void 0 !== this.endTimeout))) ||
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
    constructor() {
      super(), (this.map = new Map());
    }
    update(e) {
      const t = this.map.get(e.audioSSRC),
        s = { ...this.map.get(e.audioSSRC), ...e };
      this.map.set(e.audioSSRC, s), t || this.emit('create', s), this.emit('update', t, s);
    }
    get(e) {
      if ('number' == typeof e) return this.map.get(e);
      for (const t of this.map.values()) if (t.userId === e) return t;
    }
    delete(e) {
      if ('number' == typeof e) {
        const t = this.map.get(e);
        return t && (this.map.delete(e), this.emit('delete', t)), t;
      }
      for (const [t, s] of this.map.entries()) if (s.userId === e) return this.map.delete(t), this.emit('delete', s), s;
    }
  };
__name(SSRCMap, 'SSRCMap');
var import_node_events6 = require('events'),
  _SpeakingMap = class extends import_node_events6.EventEmitter {
    constructor() {
      super(), (this.users = new Map()), (this.speakingTimeouts = new Map());
    }
    onPacket(e) {
      const t = this.speakingTimeouts.get(e);
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
var VoiceConnectionStatus,
  VoiceConnectionDisconnectReason,
  VoiceReceiver = class {
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
    decrypt(e, t, s, o) {
      let n;
      'xsalsa20_poly1305_lite' === t
        ? (e.copy(s, 0, e.length - 4), (n = e.length - 4))
        : 'xsalsa20_poly1305_suffix' === t
        ? (e.copy(s, 0, e.length - 24), (n = e.length - 24))
        : e.copy(s, 0, 0, 12);
      const i = methods.open(e.slice(12, n), s, o);
      if (i) return import_node_buffer5.Buffer.from(i);
    }
    parsePacket(e, t, s, o) {
      let n = this.decrypt(e, t, s, o);
      if (n) {
        if (190 === n[0] && 222 === n[1]) {
          const e = n.readUInt16BE(2);
          n = n.subarray(4 + 4 * e);
        }
        return n;
      }
    }
    onUdpMessage(e) {
      if (e.length <= 8) return;
      const t = e.readUInt32BE(8),
        s = this.ssrcMap.get(t);
      if (!s) return;
      this.speaking.onPacket(s.userId);
      const o = this.subscriptions.get(s.userId);
      if (o && this.connectionData.encryptionMode && this.connectionData.nonceBuffer && this.connectionData.secretKey) {
        const t = this.parsePacket(
          e,
          this.connectionData.encryptionMode,
          this.connectionData.nonceBuffer,
          this.connectionData.secretKey,
        );
        t ? o.push(t) : o.destroy(new Error('Failed to parse packet'));
      }
    }
    subscribe(e, t) {
      const s = this.subscriptions.get(e);
      if (s) return s;
      const o = new AudioReceiveStream({ ...createDefaultAudioReceiveStreamOptions(), ...t });
      return o.once('close', () => this.subscriptions.delete(e)), this.subscriptions.set(e, o), o;
    }
  };
__name(VoiceReceiver, 'VoiceReceiver'),
  (function (e) {
    (e.Connecting = 'connecting'),
      (e.Destroyed = 'destroyed'),
      (e.Disconnected = 'disconnected'),
      (e.Ready = 'ready'),
      (e.Signalling = 'signalling');
  })(VoiceConnectionStatus || (VoiceConnectionStatus = {})),
  (function (e) {
    (e[(e.WebSocketClose = 0)] = 'WebSocketClose'),
      (e[(e.AdapterUnavailable = 1)] = 'AdapterUnavailable'),
      (e[(e.EndpointRemoved = 2)] = 'EndpointRemoved'),
      (e[(e.Manual = 3)] = 'Manual');
  })(VoiceConnectionDisconnectReason || (VoiceConnectionDisconnectReason = {}));
var VoiceConnection = class extends import_node_events7.EventEmitter {
  constructor(e, t) {
    super(),
      (this.debug = t.debug ? e => this.emit('debug', e) : null),
      (this.rejoinAttempts = 0),
      (this.receiver = new VoiceReceiver(this)),
      (this.onNetworkingClose = this.onNetworkingClose.bind(this)),
      (this.onNetworkingStateChange = this.onNetworkingStateChange.bind(this)),
      (this.onNetworkingError = this.onNetworkingError.bind(this)),
      (this.onNetworkingDebug = this.onNetworkingDebug.bind(this));
    const s = t.adapterCreator({
      onVoiceServerUpdate: e => this.addServerPacket(e),
      onVoiceStateUpdate: e => this.addStatePacket(e),
      destroy: () => this.destroy(!1),
    });
    (this._state = { status: VoiceConnectionStatus.Signalling, adapter: s }),
      (this.packets = { server: void 0, state: void 0 }),
      (this.joinConfig = e);
  }
  get state() {
    return this._state;
  }
  set state(e) {
    const t = this._state,
      s = Reflect.get(t, 'networking'),
      o = Reflect.get(e, 'networking'),
      n = Reflect.get(t, 'subscription'),
      i = Reflect.get(e, 'subscription');
    if (
      (s !== o &&
        (s &&
          (s.on('error', noop),
          s.off('debug', this.onNetworkingDebug),
          s.off('error', this.onNetworkingError),
          s.off('close', this.onNetworkingClose),
          s.off('stateChange', this.onNetworkingStateChange),
          s.destroy()),
        o && this.updateReceiveBindings(o.state, s?.state)),
      e.status === VoiceConnectionStatus.Ready)
    )
      this.rejoinAttempts = 0;
    else if (e.status === VoiceConnectionStatus.Destroyed)
      for (const e of this.receiver.subscriptions.values()) e.destroyed || e.destroy();
    t.status !== VoiceConnectionStatus.Destroyed && e.status === VoiceConnectionStatus.Destroyed && t.adapter.destroy(),
      (this._state = e),
      n && n !== i && n.unsubscribe(),
      this.emit('stateChange', t, e),
      t.status !== e.status && this.emit(e.status, t, e);
  }
  addServerPacket(e) {
    (this.packets.server = e),
      e.endpoint
        ? this.configureNetworking()
        : this.state.status !== VoiceConnectionStatus.Destroyed &&
          (this.state = {
            ...this.state,
            status: VoiceConnectionStatus.Disconnected,
            reason: VoiceConnectionDisconnectReason.EndpointRemoved,
          });
  }
  addStatePacket(e) {
    (this.packets.state = e),
      void 0 !== e.self_deaf && (this.joinConfig.selfDeaf = e.self_deaf),
      void 0 !== e.self_mute && (this.joinConfig.selfMute = e.self_mute),
      e.channel_id && (this.joinConfig.channelId = e.channel_id);
  }
  updateReceiveBindings(e, t) {
    const s = Reflect.get(t ?? {}, 'ws'),
      o = Reflect.get(e, 'ws'),
      n = Reflect.get(t ?? {}, 'udp'),
      i = Reflect.get(e, 'udp');
    s !== o && (s?.off('packet', this.receiver.onWsPacket), o?.on('packet', this.receiver.onWsPacket)),
      n !== i && (n?.off('message', this.receiver.onUdpMessage), i?.on('message', this.receiver.onUdpMessage)),
      (this.receiver.connectionData = Reflect.get(e, 'connectionData') ?? {});
  }
  configureNetworking() {
    const { server: e, state: t } = this.packets;
    if (!e || !t || this.state.status === VoiceConnectionStatus.Destroyed || !e.endpoint) return;
    const s = new Networking(
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
      (this.state = { ...this.state, status: VoiceConnectionStatus.Connecting, networking: s });
  }
  onNetworkingClose(e) {
    this.state.status !== VoiceConnectionStatus.Destroyed &&
      (4014 === e
        ? (this.state = {
            ...this.state,
            status: VoiceConnectionStatus.Disconnected,
            reason: VoiceConnectionDisconnectReason.WebSocketClose,
            closeCode: e,
          })
        : ((this.state = { ...this.state, status: VoiceConnectionStatus.Signalling }),
          this.rejoinAttempts++,
          this.state.adapter.sendPayload(createJoinVoiceChannelPayload(this.joinConfig)) ||
            (this.state = {
              ...this.state,
              status: VoiceConnectionStatus.Disconnected,
              reason: VoiceConnectionDisconnectReason.AdapterUnavailable,
            })));
  }
  onNetworkingStateChange(e, t) {
    this.updateReceiveBindings(t, e),
      e.code !== t.code &&
        ((this.state.status !== VoiceConnectionStatus.Connecting &&
          this.state.status !== VoiceConnectionStatus.Ready) ||
          (t.code === NetworkingStatusCode.Ready
            ? (this.state = { ...this.state, status: VoiceConnectionStatus.Ready })
            : t.code !== NetworkingStatusCode.Closed &&
              (this.state = { ...this.state, status: VoiceConnectionStatus.Connecting })));
  }
  onNetworkingError(e) {
    this.emit('error', e);
  }
  onNetworkingDebug(e) {
    this.debug?.(`[NW] ${e}`);
  }
  prepareAudioPacket(e) {
    const t = this.state;
    if (t.status === VoiceConnectionStatus.Ready) return t.networking.prepareAudioPacket(e);
  }
  dispatchAudio() {
    const e = this.state;
    if (e.status === VoiceConnectionStatus.Ready) return e.networking.dispatchAudio();
  }
  playOpusPacket(e) {
    const t = this.state;
    if (t.status === VoiceConnectionStatus.Ready)
      return t.networking.prepareAudioPacket(e), t.networking.dispatchAudio();
  }
  destroy(e = !0) {
    if (this.state.status === VoiceConnectionStatus.Destroyed)
      throw new Error('Cannot destroy VoiceConnection - it has already been destroyed');
    getVoiceConnection(this.joinConfig.guildId, this.joinConfig.group) === this && untrackVoiceConnection(this),
      e && this.state.adapter.sendPayload(createJoinVoiceChannelPayload({ ...this.joinConfig, channelId: null })),
      (this.state = { status: VoiceConnectionStatus.Destroyed });
  }
  disconnect() {
    return (
      this.state.status !== VoiceConnectionStatus.Destroyed &&
      this.state.status !== VoiceConnectionStatus.Signalling &&
      ((this.joinConfig.channelId = null),
      this.state.adapter.sendPayload(createJoinVoiceChannelPayload(this.joinConfig))
        ? ((this.state = {
            adapter: this.state.adapter,
            reason: VoiceConnectionDisconnectReason.Manual,
            status: VoiceConnectionStatus.Disconnected,
          }),
          !0)
        : ((this.state = {
            adapter: this.state.adapter,
            subscription: this.state.subscription,
            status: VoiceConnectionStatus.Disconnected,
            reason: VoiceConnectionDisconnectReason.AdapterUnavailable,
          }),
          !1))
    );
  }
  rejoin(e) {
    if (this.state.status === VoiceConnectionStatus.Destroyed) return !1;
    const t = this.state.status !== VoiceConnectionStatus.Ready;
    return (
      t && this.rejoinAttempts++,
      Object.assign(this.joinConfig, e),
      this.state.adapter.sendPayload(createJoinVoiceChannelPayload(this.joinConfig))
        ? (t && (this.state = { ...this.state, status: VoiceConnectionStatus.Signalling }), !0)
        : ((this.state = {
            adapter: this.state.adapter,
            subscription: this.state.subscription,
            status: VoiceConnectionStatus.Disconnected,
            reason: VoiceConnectionDisconnectReason.AdapterUnavailable,
          }),
          !1)
    );
  }
  setSpeaking(e) {
    return this.state.status === VoiceConnectionStatus.Ready && this.state.networking.setSpeaking(e);
  }
  subscribe(e) {
    if (this.state.status === VoiceConnectionStatus.Destroyed) return;
    const t = e.subscribe(this);
    return (this.state = { ...this.state, subscription: t }), t;
  }
  get ping() {
    return this.state.status === VoiceConnectionStatus.Ready &&
      this.state.networking.state.code === NetworkingStatusCode.Ready
      ? { ws: this.state.networking.state.ws.ping, udp: this.state.networking.state.udp.ping }
      : { ws: void 0, udp: void 0 };
  }
  onSubscriptionRemoved(e) {
    this.state.status !== VoiceConnectionStatus.Destroyed &&
      this.state.subscription === e &&
      (this.state = { ...this.state, subscription: void 0 });
  }
};
function createVoiceConnection(e, t) {
  const s = createJoinVoiceChannelPayload(e),
    o = getVoiceConnection(e.guildId, e.group);
  if (o && o.state.status !== VoiceConnectionStatus.Destroyed)
    return (
      o.state.status === VoiceConnectionStatus.Disconnected
        ? o.rejoin({ channelId: e.channelId, selfDeaf: e.selfDeaf, selfMute: e.selfMute })
        : o.state.adapter.sendPayload(s) ||
          (o.state = {
            ...o.state,
            status: VoiceConnectionStatus.Disconnected,
            reason: VoiceConnectionDisconnectReason.AdapterUnavailable,
          }),
      o
    );
  const n = new VoiceConnection(e, t);
  return (
    trackVoiceConnection(n),
    n.state.status === VoiceConnectionStatus.Destroyed ||
      n.state.adapter.sendPayload(s) ||
      (n.state = {
        ...n.state,
        status: VoiceConnectionStatus.Disconnected,
        reason: VoiceConnectionDisconnectReason.AdapterUnavailable,
      }),
    n
  );
}
function joinVoiceChannel(e) {
  return createVoiceConnection(
    { selfDeaf: !0, selfMute: !1, group: 'default', ...e },
    { adapterCreator: e.adapterCreator, debug: e.debug },
  );
}
__name(VoiceConnection, 'VoiceConnection'),
  __name(createVoiceConnection, 'createVoiceConnection'),
  __name(joinVoiceChannel, 'joinVoiceChannel');
var StreamType,
  TransformerType,
  import_node_stream2 = require('stream'),
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
  ];
!(function (e) {
  (e.Arbitrary = 'arbitrary'), (e.OggOpus = 'ogg/opus'), (e.Opus = 'opus'), (e.Raw = 'raw'), (e.WebmOpus = 'webm/opus');
})(StreamType || (StreamType = {})),
  (function (e) {
    (e.FFmpegOgg = 'ffmpeg ogg'),
      (e.FFmpegPCM = 'ffmpeg pcm'),
      (e.InlineVolume = 'volume transformer'),
      (e.OggOpusDemuxer = 'ogg/opus demuxer'),
      (e.OpusDecoder = 'opus decoder'),
      (e.OpusEncoder = 'opus encoder'),
      (e.WebmOpusDemuxer = 'webm/opus demuxer');
  })(TransformerType || (TransformerType = {}));
var Node = class {
  edges = [];
  constructor(e) {
    this.type = e;
  }
  addEdge(e) {
    this.edges.push({ ...e, from: this });
  }
};
__name(Node, 'Node');
var NODES = new Map();
for (const e of Object.values(StreamType)) NODES.set(e, new Node(e));
function getNode(e) {
  const t = NODES.get(e);
  if (!t) throw new Error(`Node type '${e}' does not exist!`);
  return t;
}
__name(getNode, 'getNode'),
  getNode(StreamType.Raw).addEdge({
    type: TransformerType.OpusEncoder,
    to: getNode(StreamType.Opus),
    cost: 1.5,
    transformer: () => new import_prism_media.default.opus.Encoder({ rate: 48e3, channels: 2, frameSize: 960 }),
  }),
  getNode(StreamType.Opus).addEdge({
    type: TransformerType.OpusDecoder,
    to: getNode(StreamType.Raw),
    cost: 1.5,
    transformer: () => new import_prism_media.default.opus.Decoder({ rate: 48e3, channels: 2, frameSize: 960 }),
  }),
  getNode(StreamType.OggOpus).addEdge({
    type: TransformerType.OggOpusDemuxer,
    to: getNode(StreamType.Opus),
    cost: 1,
    transformer: () => new import_prism_media.default.opus.OggDemuxer(),
  }),
  getNode(StreamType.WebmOpus).addEdge({
    type: TransformerType.WebmOpusDemuxer,
    to: getNode(StreamType.Opus),
    cost: 1,
    transformer: () => new import_prism_media.default.opus.WebmDemuxer(),
  });
var FFMPEG_PCM_EDGE = {
  type: TransformerType.FFmpegPCM,
  to: getNode(StreamType.Raw),
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
  (getNode(StreamType.Arbitrary).addEdge(FFMPEG_PCM_EDGE),
  getNode(StreamType.OggOpus).addEdge(FFMPEG_PCM_EDGE),
  getNode(StreamType.WebmOpus).addEdge(FFMPEG_PCM_EDGE),
  getNode(StreamType.Raw).addEdge({
    type: TransformerType.InlineVolume,
    to: getNode(StreamType.Raw),
    cost: 0.5,
    transformer: () => new import_prism_media.default.VolumeTransformer({ type: 's16le' }),
  }),
  __name(canEnableFFmpegOptimizations, 'canEnableFFmpegOptimizations'),
  canEnableFFmpegOptimizations())
) {
  const e = {
    type: TransformerType.FFmpegOgg,
    to: getNode(StreamType.OggOpus),
    cost: 2,
    transformer: e =>
      new import_prism_media.default.FFmpeg({
        args: 'string' == typeof e ? ['-i', e, ...FFMPEG_OPUS_ARGUMENTS] : FFMPEG_OPUS_ARGUMENTS,
      }),
  };
  getNode(StreamType.Arbitrary).addEdge(e),
    getNode(StreamType.OggOpus).addEdge(e),
    getNode(StreamType.WebmOpus).addEdge(e);
}
function findPath(e, t, s = getNode(StreamType.Opus), o = [], n = 5) {
  if (e === s && t(o)) return { cost: 0 };
  if (0 === n) return { cost: Number.POSITIVE_INFINITY };
  let i;
  for (const r of e.edges) {
    if (i && r.cost > i.cost) continue;
    const e = findPath(r.to, t, s, [...o, r], n - 1),
      a = r.cost + e.cost;
    (!i || a < i.cost) && (i = { cost: a, edge: r, next: e });
  }
  return i ?? { cost: Number.POSITIVE_INFINITY };
}
function constructPipeline(e) {
  const t = [];
  let s = e;
  for (; s?.edge; ) t.push(s.edge), (s = s.next);
  return t;
}
function findPipeline(e, t) {
  return constructPipeline(findPath(getNode(e), t));
}
__name(findPath, 'findPath'), __name(constructPipeline, 'constructPipeline'), __name(findPipeline, 'findPipeline');
var AudioResource = class {
  playbackDuration = 0;
  started = !1;
  silenceRemaining = -1;
  constructor(e, t, s, o) {
    (this.edges = e),
      (this.playStream = t.length > 1 ? (0, import_node_stream2.pipeline)(t, noop) : t[0]),
      (this.metadata = s),
      (this.silencePaddingFrames = o);
    for (const e of t)
      e instanceof import_prism_media2.default.VolumeTransformer
        ? (this.volume = e)
        : e instanceof import_prism_media2.default.opus.Encoder && (this.encoder = e);
    this.playStream.once('readable', () => (this.started = !0));
  }
  get readable() {
    if (0 === this.silenceRemaining) return !1;
    const e = this.playStream.readable;
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
    const e = this.playStream.read();
    return e && (this.playbackDuration += 20), e;
  }
};
__name(AudioResource, 'AudioResource');
var VOLUME_CONSTRAINT = __name(e => e.some(e => e.type === TransformerType.InlineVolume), 'VOLUME_CONSTRAINT'),
  NO_CONSTRAINT = __name(() => !0, 'NO_CONSTRAINT');
function inferStreamType(e) {
  return e instanceof import_prism_media2.default.opus.Encoder
    ? { streamType: StreamType.Opus, hasVolume: !1 }
    : e instanceof import_prism_media2.default.opus.Decoder
    ? { streamType: StreamType.Raw, hasVolume: !1 }
    : e instanceof import_prism_media2.default.VolumeTransformer
    ? { streamType: StreamType.Raw, hasVolume: !0 }
    : e instanceof import_prism_media2.default.opus.OggDemuxer ||
      e instanceof import_prism_media2.default.opus.WebmDemuxer
    ? { streamType: StreamType.Opus, hasVolume: !1 }
    : { streamType: StreamType.Arbitrary, hasVolume: !1 };
}
function createAudioResource(e, t = {}) {
  let s = t.inputType,
    o = Boolean(t.inlineVolume);
  if ('string' == typeof e) s = StreamType.Arbitrary;
  else if (void 0 === s) {
    const t = inferStreamType(e);
    (s = t.streamType), (o = o && !t.hasVolume);
  }
  const n = findPipeline(s, o ? VOLUME_CONSTRAINT : NO_CONSTRAINT);
  if (0 === n.length) {
    if ('string' == typeof e) throw new Error(`Invalid pipeline constructed for string resource '${e}'`);
    return new AudioResource([], [e], t.metadata ?? null, t.silencePaddingFrames ?? 5);
  }
  const i = n.map(t => t.transformer(e));
  return 'string' != typeof e && i.unshift(e), new AudioResource(n, i, t.metadata ?? null, t.silencePaddingFrames ?? 5);
}
__name(inferStreamType, 'inferStreamType'), __name(createAudioResource, 'createAudioResource');
var import_node_path = require('path'),
  import_prism_media3 = __toESM(require('prism-media'));
function findPackageJSON(e, t, s) {
  if (0 === s) return;
  const o = (0, import_node_path.resolve)(e, './package.json');
  try {
    const e = require(o);
    if (e.name !== t) throw new Error('package.json does not match');
    return e;
  } catch {
    return findPackageJSON((0, import_node_path.resolve)(e, '..'), t, s - 1);
  }
}
function version(e) {
  try {
    if ('@discordjs/voice' === e) return '[VI]{{inject}}[/VI]';
    const t = findPackageJSON((0, import_node_path.dirname)(require.resolve(e)), e, 3);
    return t?.version ?? 'not found';
  } catch {
    return 'not found';
  }
}
function generateDependencyReport() {
  const e = [],
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
    const t = import_prism_media3.default.FFmpeg.getInfo();
    e.push(`- version: ${t.version}`), e.push('- libopus: ' + (t.output.includes('--enable-libopus') ? 'yes' : 'no'));
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
  const t = new AbortController(),
    s = setTimeout(() => t.abort(), e);
  return t.signal.addEventListener('abort', () => clearTimeout(s)), [t, t.signal];
}
async function entersState(e, t, s) {
  if (e.state.status !== t) {
    const [o, n] = 'number' == typeof s ? abortAfter(s) : [void 0, s];
    try {
      await (0, import_node_events8.once)(e, t, { signal: n });
    } finally {
      o?.abort();
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
  const t = e.readUInt8(9),
    s = e.readUInt32LE(12);
  return 2 === t && 48e3 === s;
}
async function demuxProbe(e, t = 1024, s = validateDiscordOpusHead) {
  return new Promise((o, n) => {
    if (e.readableObjectMode) return void n(new Error('Cannot probe a readable stream in object mode'));
    if (e.readableEnded) return void n(new Error('Cannot probe a stream that has ended'));
    let i,
      r = import_node_buffer6.Buffer.alloc(0);
    const a = __name(t => {
        e.off('data', l),
          e.off('close', p),
          e.off('end', p),
          e.pause(),
          (i = t),
          e.readableEnded
            ? o({ stream: import_node_stream3.Readable.from(r), type: t })
            : (r.length > 0 && e.push(r), o({ stream: e, type: t }));
      }, 'finish'),
      c = __name(
        e => t => {
          s(t) && a(e);
        },
        'foundHead',
      ),
      u = new import_prism_media4.default.opus.WebmDemuxer();
    u.once('error', noop), u.on('head', c(StreamType.WebmOpus));
    const d = new import_prism_media4.default.opus.OggDemuxer();
    d.once('error', noop), d.on('head', c(StreamType.OggOpus));
    const p = __name(() => {
        i || a(StreamType.Arbitrary);
      }, 'onClose'),
      l = __name(s => {
        (r = import_node_buffer6.Buffer.concat([r, s])),
          u.write(s),
          d.write(s),
          r.length >= t && (e.off('data', l), e.pause(), import_node_process.default.nextTick(p));
      }, 'onData');
    e.once('error', n), e.on('data', l), e.once('close', p), e.once('end', p);
  });
}
__name(validateDiscordOpusHead, 'validateDiscordOpusHead'), __name(demuxProbe, 'demuxProbe');
var version2 = '[VI]{{inject}}[/VI]';
