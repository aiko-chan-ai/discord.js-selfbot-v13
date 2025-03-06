'use strict';

const { Error, RangeError, TypeError } = require('../errors');

/**
 * Max bulk deletable message age
 * @typedef {number} MaxBulkDeletableMessageAge
 */
exports.MaxBulkDeletableMessageAge = 1_209_600_000;

exports.UserAgent =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Electron/33.0.0 Safari/537.36';

/**
 * Google Chrome v131 TLS ciphers
 * @see {@link https://tls.browserleaks.com/tls}
 * @see {@link https://github.com/yifeikong/curl-impersonate}
 * @typedef {Array<string>} Ciphers
 */
exports.ciphers = [
  'TLS_AES_128_GCM_SHA256',
  'TLS_AES_256_GCM_SHA384',
  'TLS_CHACHA20_POLY1305_SHA256',
  'ECDHE-ECDSA-AES128-GCM-SHA256',
  'ECDHE-RSA-AES128-GCM-SHA256',
  'ECDHE-ECDSA-AES256-GCM-SHA384',
  'ECDHE-RSA-AES256-GCM-SHA384',
  'ECDHE-ECDSA-CHACHA20-POLY1305',
  'ECDHE-RSA-CHACHA20-POLY1305',
  'ECDHE-RSA-AES128-SHA',
  'ECDHE-RSA-AES256-SHA',
  'AES128-GCM-SHA256',
  'AES256-GCM-SHA384',
  'AES128-SHA',
  'AES256-SHA',
];

/**
 * The types of WebSocket error codes:
 * * 1000: WS_CLOSE_REQUESTED
 * * 1011: INTERNAL_ERROR
 * * 4004: TOKEN_INVALID
 * * 4010: SHARDING_INVALID
 * * 4011: SHARDING_REQUIRED
 * * 4013: INVALID_INTENTS
 * * 4014: DISALLOWED_INTENTS
 * @typedef {Object<number, string>} WSCodes
 */
exports.WSCodes = {
  1000: 'WS_CLOSE_REQUESTED',
  1011: 'INTERNAL_ERROR',
  4004: 'TOKEN_INVALID',
  4010: 'SHARDING_INVALID',
  4011: 'SHARDING_REQUIRED',
  4013: 'INVALID_INTENTS',
  4014: 'DISALLOWED_INTENTS',
};

const AllowedImageFormats = ['webp', 'png', 'jpg', 'jpeg', 'gif'];

const AllowedImageSizes = [16, 32, 56, 64, 96, 128, 256, 300, 512, 600, 1024, 2048, 4096];

function makeImageUrl(root, { format = 'webp', size } = {}) {
  if (!['undefined', 'number'].includes(typeof size)) throw new TypeError('INVALID_TYPE', 'size', 'number');
  if (format && !AllowedImageFormats.includes(format)) throw new Error('IMAGE_FORMAT', format);
  if (size && !AllowedImageSizes.includes(size)) throw new RangeError('IMAGE_SIZE', size);
  return `${root}.${format}${size ? `?size=${size}` : ''}`;
}

/**
 * Options for Image URLs.
 * @typedef {StaticImageURLOptions} ImageURLOptions
 * @property {boolean} [dynamic=false] If true, the format will dynamically change to `gif` for animated avatars.
 */

/**
 * Options for static Image URLs.
 * @typedef {Object} StaticImageURLOptions
 * @property {string} [format='webp'] One of `webp`, `png`, `jpg`, `jpeg`.
 * @property {number} [size] One of `16`, `32`, `56`, `64`, `96`, `128`, `256`, `300`, `512`, `600`, `1024`, `2048`,
 * `4096`
 */

/**
 * An object containing functions that return certain endpoints on the API.
 * @typedef {Object<string, Function|string>} Endpoints
 * @see {@link https://discord.com/developers/docs/reference#image-formatting-cdn-endpoints}
 */
exports.Endpoints = {
  CDN(root) {
    return {
      Emoji: (emojiId, format = 'webp') => `${root}/emojis/${emojiId}.${format}`,
      Asset: name => `${root}/assets/${name}`,
      DefaultAvatar: index => `${root}/embed/avatars/${index}.png`,
      Avatar: (userId, hash, format, size, dynamic = false) => {
        if (dynamic && hash.startsWith('a_')) format = 'gif';
        return makeImageUrl(`${root}/avatars/${userId}/${hash}`, { format, size });
      },
      AvatarDecoration: (hash, size) =>
        makeImageUrl(`${root}/avatar-decoration-presets/${hash}`, { format: 'png', size }),
      ClanBadge: (guildId, hash) => `${root}/clan-badges/${guildId}/${hash}.png`,
      GuildMemberAvatar: (guildId, memberId, hash, format = 'webp', size, dynamic = false) => {
        if (dynamic && hash.startsWith('a_')) format = 'gif';
        return makeImageUrl(`${root}/guilds/${guildId}/users/${memberId}/avatars/${hash}`, { format, size });
      },
      GuildMemberBanner: (guildId, memberId, hash, format = 'webp', size, dynamic = false) => {
        if (dynamic && hash.startsWith('a_')) format = 'gif';
        return makeImageUrl(`${root}/guilds/${guildId}/users/${memberId}/banners/${hash}`, { format, size });
      },
      Banner: (id, hash, format, size, dynamic = false) => {
        if (dynamic && hash.startsWith('a_')) format = 'gif';
        return makeImageUrl(`${root}/banners/${id}/${hash}`, { format, size });
      },
      Icon: (guildId, hash, format, size, dynamic = false) => {
        if (dynamic && hash.startsWith('a_')) format = 'gif';
        return makeImageUrl(`${root}/icons/${guildId}/${hash}`, { format, size });
      },
      AppIcon: (appId, hash, options) => makeImageUrl(`${root}/app-icons/${appId}/${hash}`, options),
      AppAsset: (appId, hash, options) => makeImageUrl(`${root}/app-assets/${appId}/${hash}`, options),
      StickerPackBanner: (bannerId, format, size) =>
        makeImageUrl(`${root}/app-assets/710982414301790216/store/${bannerId}`, { size, format }),
      GDMIcon: (channelId, hash, format, size) =>
        makeImageUrl(`${root}/channel-icons/${channelId}/${hash}`, { size, format }),
      Splash: (guildId, hash, format, size) => makeImageUrl(`${root}/splashes/${guildId}/${hash}`, { size, format }),
      DiscoverySplash: (guildId, hash, format, size) =>
        makeImageUrl(`${root}/discovery-splashes/${guildId}/${hash}`, { size, format }),
      TeamIcon: (teamId, hash, options) => makeImageUrl(`${root}/team-icons/${teamId}/${hash}`, options),
      Sticker: (stickerId, stickerFormat) =>
        `${root}/stickers/${stickerId}.${
          stickerFormat === 'LOTTIE' ? 'json' : stickerFormat === 'GIF' ? 'gif' : 'png'
        }`,
      RoleIcon: (roleId, hash, format = 'webp', size) =>
        makeImageUrl(`${root}/role-icons/${roleId}/${hash}`, { size, format }),
      GuildScheduledEventCover: (scheduledEventId, coverHash, format, size) =>
        makeImageUrl(`${root}/guild-events/${scheduledEventId}/${coverHash}`, { size, format }),
    };
  },
  invite: (root, code, eventId) => (eventId ? `${root}/${code}?event=${eventId}` : `${root}/${code}`),
  scheduledEvent: (root, guildId, eventId) => `${root}/${guildId}/${eventId}`,
  botGateway: '/gateway',
};

/**
 * The current status of the client. Here are the available statuses:
 * * READY: 0
 * * CONNECTING: 1
 * * RECONNECTING: 2
 * * IDLE: 3
 * * NEARLY: 4
 * * DISCONNECTED: 5
 * * WAITING_FOR_GUILDS: 6
 * * IDENTIFYING: 7
 * * RESUMING: 8
 * @typedef {Object<string, number>} Status
 */
exports.Status = {
  READY: 0,
  CONNECTING: 1,
  RECONNECTING: 2,
  IDLE: 3,
  NEARLY: 4,
  DISCONNECTED: 5,
  WAITING_FOR_GUILDS: 6,
  IDENTIFYING: 7,
  RESUMING: 8,
};

/**
 * The current status of a voice connection. Here are the available statuses:
 * * CONNECTED: 0
 * * CONNECTING: 1
 * * AUTHENTICATING: 2
 * * RECONNECTING: 3
 * * DISCONNECTED: 4
 * @typedef {number} VoiceStatus
 */
exports.VoiceStatus = {
  CONNECTED: 0,
  CONNECTING: 1,
  AUTHENTICATING: 2,
  RECONNECTING: 3,
  DISCONNECTED: 4,
};

/**
 * The Opcodes sent to the Gateway:
 * * DISPATCH: 0
 * * HEARTBEAT: 1
 * * IDENTIFY: 2
 * * STATUS_UPDATE: 3
 * * VOICE_STATE_UPDATE: 4
 * * VOICE_GUILD_PING: 5
 * * RESUME: 6
 * * RECONNECT: 7
 * * REQUEST_GUILD_MEMBERS: 8
 * * INVALID_SESSION: 9
 * * HELLO: 10
 * * HEARTBEAT_ACK: 11
 * * GUILD_SYNC: 12 [Unused]
 * * DM_UPDATE: 13 #  Send => used to get dm features
 * * GUILD_SUBSCRIPTIONS: 14 #  Send => discord responds back with GUILD_MEMBER_LIST_UPDATE type SYNC...
 * * LOBBY_CONNECT: 15
 * * LOBBY_DISCONNECT: 16
 * * LOBBY_VOICE_STATE_UPDATE: 17 #  Receive
 * * STREAM_CREATE: 18
 * * STREAM_DELETE: 19
 * * STREAM_WATCH: 20
 * * STREAM_PING: 21 #  Send
 * * STREAM_SET_PAUSED: 22
 * * LFG_SUBSCRIPTIONS: 23 [Unused]
 * * REQUEST_GUILD_APPLICATION_COMMANDS: 24 [Unused]
 * * EMBEDDED_ACTIVITY_LAUNCH: 25 => Launch an embedded activity in a voice channel or call.
 * * EMBEDDED_ACTIVITY_CLOSE: 26 => Stop an embedded activity.
 * * EMBEDDED_ACTIVITY_UPDATE: 27 => Update an embedded activity.
 * * REQUEST_FORUM_UNREADS: 28 => Request forum channel unread counts.
 * * REMOTE_COMMAND: 29 => Send a remote command to an embedded (Xbox, PlayStation) voice session.
 * * GET_DELETED_ENTITY_IDS_NOT_MATCHING_HASH: 30 => Request deleted entity IDs not matching a given hash for a guild.
 * * REQUEST_SOUNDBOARD_SOUNDS: 31
 * * SPEED_TEST_CREATE: 32 => Create a voice speed test.
 * * SPEED_TEST_DELETE: 33 => Delete a voice speed test.
 * * REQUEST_LAST_MESSAGES: 34 => Request last messages for a guild's channels.
 * * SEARCH_RECENT_MEMBERS: 35 => ~ Opcode 8 (Member Safety)
 * * REQUEST_CHANNEL_STATUSES: 36 => Request Voice Channel status.
 * * GUILD_SUBSCRIPTIONS_BULK: 37 => ~ Opcode 14
 * @typedef {Object<string, number>} Opcodes
 */
exports.Opcodes = {
  DISPATCH: 0,
  HEARTBEAT: 1,
  IDENTIFY: 2,
  STATUS_UPDATE: 3,
  VOICE_STATE_UPDATE: 4,
  VOICE_GUILD_PING: 5,
  RESUME: 6,
  RECONNECT: 7,
  REQUEST_GUILD_MEMBERS: 8,
  INVALID_SESSION: 9,
  HELLO: 10,
  HEARTBEAT_ACK: 11,
  GUILD_SYNC: 12,
  DM_UPDATE: 13,
  GUILD_SUBSCRIPTIONS: 14,
  LOBBY_CONNECT: 15,
  LOBBY_DISCONNECT: 16,
  LOBBY_VOICE_STATE_UPDATE: 17,
  STREAM_CREATE: 18,
  STREAM_DELETE: 19,
  STREAM_WATCH: 20,
  STREAM_PING: 21,
  STREAM_SET_PAUSED: 22,
  REQUEST_GUILD_APPLICATION_COMMANDS: 24,
  EMBEDDED_ACTIVITY_LAUNCH: 25,
  EMBEDDED_ACTIVITY_CLOSE: 26,
  EMBEDDED_ACTIVITY_UPDATE: 27,
  REQUEST_FORUM_UNREADS: 28, // Payload: { guild_id: Snowflake, channel_id: Snowflake, threads: { thread_id: Snowflake, ack_message_id: Snowflake }[] }
  REMOTE_COMMAND: 29, // Payload: { target_session_id: string, payload: any }
  GET_DELETED_ENTITY_IDS_NOT_MATCHING_HASH: 30, // Payload: { guild_id: Snowflake, channel_ids_hash: string[], role_ids_hash: string[], emoji_ids_hash: string[], sticker_ids_hash: string[] }
  REQUEST_SOUNDBOARD_SOUNDS: 31, // Payload: { guild_ids: string[] }
  SPEED_TEST_CREATE: 32, // Payload: { preferred_region: string }
  SPEED_TEST_DELETE: 33, // Payload: null
  REQUEST_LAST_MESSAGES: 34, // Payload: { guild_id: string, channel_ids: string[] }
  SEARCH_RECENT_MEMBERS: 35, // Payload: { guild_id: string, query: string, continuation_token?: Snowflake }
  REQUEST_CHANNEL_STATUSES: 36, // Payload: { guild_id: string } | Response: CHANNEL_STATUSES | { guild_id, channels: { status, id }[] }
  GUILD_SUBSCRIPTIONS_BULK: 37, // Payload: { subscriptions: Object<guild_id, { Payload_op14 - guild_id }> } | Response: Opcode 14
  // Updated: 23/1/2024
};

/**
 * @typedef {Opject<string, number>} VoiceOpcodes
 */
exports.VoiceOpcodes = {
  IDENTIFY: 0,
  SELECT_PROTOCOL: 1,
  READY: 2,
  HEARTBEAT: 3,
  SESSION_DESCRIPTION: 4,
  SPEAKING: 5,
  HEARTBEAT_ACK: 6,
  RESUME: 7,
  HELLO: 8,
  RESUMED: 9,
  SOURCES: 12,
  CLIENT_DISCONNECT: 13,
  SESSION_UPDATE: 14,
  MEDIA_SINK_WANTS: 15,
  VOICE_BACKEND_VERSION: 16,
  CHANNEL_OPTIONS_UPDATE: 17,
};

/**
 * The types of events emitted by the Client:
 * * RATE_LIMIT: rateLimit
 * * INVALID_REQUEST_WARNING: invalidRequestWarning
 * * API_RESPONSE: apiResponse
 * * API_REQUEST: apiRequest
 * * CLIENT_READY: ready
 * * APPLICATION_COMMAND_CREATE: applicationCommandCreate (deprecated)
 * * APPLICATION_COMMAND_DELETE: applicationCommandDelete (deprecated)
 * * APPLICATION_COMMAND_UPDATE: applicationCommandUpdate (deprecated)
 * * APPLICATION_COMMAND_PERMISSIONS_UPDATE: applicationCommandPermissionsUpdate
 * * AUTO_MODERATION_ACTION_EXECUTION: autoModerationActionExecution
 * * AUTO_MODERATION_RULE_CREATE: autoModerationRuleCreate
 * * AUTO_MODERATION_RULE_DELETE: autoModerationRuleDelete
 * * AUTO_MODERATION_RULE_UPDATE: autoModerationRuleUpdate
 * * GUILD_AVAILABLE: guildAvailable
 * * GUILD_CREATE: guildCreate
 * * GUILD_DELETE: guildDelete
 * * GUILD_UPDATE: guildUpdate
 * * GUILD_UNAVAILABLE: guildUnavailable
 * * GUILD_MEMBER_ADD: guildMemberAdd
 * * GUILD_MEMBER_REMOVE: guildMemberRemove
 * * GUILD_MEMBER_UPDATE: guildMemberUpdate
 * * GUILD_MEMBER_AVAILABLE: guildMemberAvailable
 * * GUILD_MEMBERS_CHUNK: guildMembersChunk
 * * GUILD_INTEGRATIONS_UPDATE: guildIntegrationsUpdate
 * * GUILD_ROLE_CREATE: roleCreate
 * * GUILD_ROLE_DELETE: roleDelete
 * * INVITE_CREATE: inviteCreate
 * * INVITE_DELETE: inviteDelete
 * * GUILD_ROLE_UPDATE: roleUpdate
 * * GUILD_EMOJI_CREATE: emojiCreate
 * * GUILD_EMOJI_DELETE: emojiDelete
 * * GUILD_EMOJI_UPDATE: emojiUpdate
 * * GUILD_BAN_ADD: guildBanAdd
 * * GUILD_BAN_REMOVE: guildBanRemove
 * * CHANNEL_CREATE: channelCreate
 * * CHANNEL_DELETE: channelDelete
 * * CHANNEL_UPDATE: channelUpdate
 * * CHANNEL_PINS_UPDATE: channelPinsUpdate
 * * MESSAGE_CREATE: messageCreate
 * * MESSAGE_DELETE: messageDelete
 * * MESSAGE_UPDATE: messageUpdate
 * * MESSAGE_BULK_DELETE: messageDeleteBulk
 * * MESSAGE_REACTION_ADD: messageReactionAdd
 * * MESSAGE_REACTION_REMOVE: messageReactionRemove
 * * MESSAGE_REACTION_REMOVE_ALL: messageReactionRemoveAll
 * * MESSAGE_REACTION_REMOVE_EMOJI: messageReactionRemoveEmoji
 * * THREAD_CREATE: threadCreate
 * * THREAD_DELETE: threadDelete
 * * THREAD_UPDATE: threadUpdate
 * * THREAD_LIST_SYNC: threadListSync
 * * THREAD_MEMBER_UPDATE: threadMemberUpdate
 * * THREAD_MEMBERS_UPDATE: threadMembersUpdate
 * * USER_UPDATE: userUpdate
 * * PRESENCE_UPDATE: presenceUpdate
 * * VOICE_SERVER_UPDATE: voiceServerUpdate
 * * VOICE_STATE_UPDATE: voiceStateUpdate
 * * TYPING_START: typingStart
 * * WEBHOOKS_UPDATE: webhookUpdate
 * * ERROR: error
 * * WARN: warn
 * * DEBUG: debug
 * * CACHE_SWEEP: cacheSweep
 * * SHARD_DISCONNECT: shardDisconnect
 * * SHARD_ERROR: shardError
 * * SHARD_RECONNECTING: shardReconnecting
 * * SHARD_READY: shardReady
 * * SHARD_RESUME: shardResume
 * * INVALIDATED: invalidated
 * * RAW: raw
 * * STAGE_INSTANCE_CREATE: stageInstanceCreate
 * * STAGE_INSTANCE_UPDATE: stageInstanceUpdate
 * * STAGE_INSTANCE_DELETE: stageInstanceDelete
 * * GUILD_STICKER_CREATE: stickerCreate
 * * GUILD_STICKER_DELETE: stickerDelete
 * * GUILD_STICKER_UPDATE: stickerUpdate
 * * GUILD_SCHEDULED_EVENT_CREATE: guildScheduledEventCreate
 * * GUILD_SCHEDULED_EVENT_UPDATE: guildScheduledEventUpdate
 * * GUILD_SCHEDULED_EVENT_DELETE: guildScheduledEventDelete
 * * GUILD_SCHEDULED_EVENT_USER_ADD: guildScheduledEventUserAdd
 * * GUILD_SCHEDULED_EVENT_USER_REMOVE: guildScheduledEventUserRemove
 * * GUILD_AUDIT_LOG_ENTRY_CREATE: guildAuditLogEntryCreate
 * * UNHANDLED_PACKET: unhandledPacket
 * * RELATIONSHIP_ADD: relationshipAdd
 * * RELATIONSHIP_REMOVE: relationshipRemove
 * * RELATIONSHIP_UPDATE: relationshipUpdate
 * * CHANNEL_RECIPIENT_ADD: channelRecipientAdd
 * * CHANNEL_RECIPIENT_REMOVE: channelRecipientRemove
 * * INTERACTION_MODAL_CREATE: interactionModalCreate
 * * CALL_CREATE: callCreate
 * * CALL_UPDATE: callUpdate
 * * CALL_DELETE: callDelete
 * * VOICE_CHANNEL_EFFECT_SEND: voiceChannelEffectSend
 * @typedef {Object<string, string>} Events
 */
exports.Events = {
  RATE_LIMIT: 'rateLimit',
  INVALID_REQUEST_WARNING: 'invalidRequestWarning',
  API_RESPONSE: 'apiResponse',
  API_REQUEST: 'apiRequest',
  CLIENT_READY: 'ready',
  APPLICATION_COMMAND_CREATE: 'applicationCommandCreate',
  APPLICATION_COMMAND_DELETE: 'applicationCommandDelete',
  APPLICATION_COMMAND_UPDATE: 'applicationCommandUpdate',
  APPLICATION_COMMAND_PERMISSIONS_UPDATE: 'applicationCommandPermissionsUpdate',
  AUTO_MODERATION_ACTION_EXECUTION: 'autoModerationActionExecution',
  AUTO_MODERATION_RULE_CREATE: 'autoModerationRuleCreate',
  AUTO_MODERATION_RULE_DELETE: 'autoModerationRuleDelete',
  AUTO_MODERATION_RULE_UPDATE: 'autoModerationRuleUpdate',
  GUILD_AVAILABLE: 'guildAvailable',
  GUILD_CREATE: 'guildCreate',
  GUILD_DELETE: 'guildDelete',
  GUILD_UPDATE: 'guildUpdate',
  GUILD_UNAVAILABLE: 'guildUnavailable',
  GUILD_MEMBER_ADD: 'guildMemberAdd',
  GUILD_MEMBER_REMOVE: 'guildMemberRemove',
  GUILD_MEMBER_UPDATE: 'guildMemberUpdate',
  GUILD_MEMBER_AVAILABLE: 'guildMemberAvailable',
  GUILD_MEMBERS_CHUNK: 'guildMembersChunk',
  GUILD_INTEGRATIONS_UPDATE: 'guildIntegrationsUpdate',
  GUILD_ROLE_CREATE: 'roleCreate',
  GUILD_ROLE_DELETE: 'roleDelete',
  INVITE_CREATE: 'inviteCreate',
  INVITE_DELETE: 'inviteDelete',
  GUILD_ROLE_UPDATE: 'roleUpdate',
  GUILD_EMOJI_CREATE: 'emojiCreate',
  GUILD_EMOJI_DELETE: 'emojiDelete',
  GUILD_EMOJI_UPDATE: 'emojiUpdate',
  GUILD_BAN_ADD: 'guildBanAdd',
  GUILD_BAN_REMOVE: 'guildBanRemove',
  CHANNEL_CREATE: 'channelCreate',
  CHANNEL_DELETE: 'channelDelete',
  CHANNEL_UPDATE: 'channelUpdate',
  CHANNEL_PINS_UPDATE: 'channelPinsUpdate',
  MESSAGE_CREATE: 'messageCreate',
  MESSAGE_DELETE: 'messageDelete',
  MESSAGE_UPDATE: 'messageUpdate',
  MESSAGE_BULK_DELETE: 'messageDeleteBulk',
  MESSAGE_REACTION_ADD: 'messageReactionAdd',
  MESSAGE_REACTION_REMOVE: 'messageReactionRemove',
  MESSAGE_REACTION_REMOVE_ALL: 'messageReactionRemoveAll',
  MESSAGE_REACTION_REMOVE_EMOJI: 'messageReactionRemoveEmoji',
  THREAD_CREATE: 'threadCreate',
  THREAD_DELETE: 'threadDelete',
  THREAD_UPDATE: 'threadUpdate',
  THREAD_LIST_SYNC: 'threadListSync',
  THREAD_MEMBER_UPDATE: 'threadMemberUpdate',
  THREAD_MEMBERS_UPDATE: 'threadMembersUpdate',
  USER_UPDATE: 'userUpdate',
  PRESENCE_UPDATE: 'presenceUpdate',
  VOICE_SERVER_UPDATE: 'voiceServerUpdate',
  VOICE_STATE_UPDATE: 'voiceStateUpdate',
  TYPING_START: 'typingStart',
  WEBHOOKS_UPDATE: 'webhookUpdate',
  ERROR: 'error',
  WARN: 'warn',
  DEBUG: 'debug',
  CACHE_SWEEP: 'cacheSweep',
  SHARD_DISCONNECT: 'shardDisconnect',
  SHARD_ERROR: 'shardError',
  SHARD_RECONNECTING: 'shardReconnecting',
  SHARD_READY: 'shardReady',
  SHARD_RESUME: 'shardResume',
  INVALIDATED: 'invalidated',
  RAW: 'raw',
  STAGE_INSTANCE_CREATE: 'stageInstanceCreate',
  STAGE_INSTANCE_UPDATE: 'stageInstanceUpdate',
  STAGE_INSTANCE_DELETE: 'stageInstanceDelete',
  GUILD_STICKER_CREATE: 'stickerCreate',
  GUILD_STICKER_DELETE: 'stickerDelete',
  GUILD_STICKER_UPDATE: 'stickerUpdate',
  GUILD_SCHEDULED_EVENT_CREATE: 'guildScheduledEventCreate',
  GUILD_SCHEDULED_EVENT_UPDATE: 'guildScheduledEventUpdate',
  GUILD_SCHEDULED_EVENT_DELETE: 'guildScheduledEventDelete',
  GUILD_SCHEDULED_EVENT_USER_ADD: 'guildScheduledEventUserAdd',
  GUILD_SCHEDULED_EVENT_USER_REMOVE: 'guildScheduledEventUserRemove',
  GUILD_AUDIT_LOG_ENTRY_CREATE: 'guildAuditLogEntryCreate',
  UNHANDLED_PACKET: 'unhandledPacket',
  RELATIONSHIP_ADD: 'relationshipAdd',
  RELATIONSHIP_UPDATE: 'relationshipUpdate',
  RELATIONSHIP_REMOVE: 'relationshipRemove',
  CHANNEL_RECIPIENT_ADD: 'channelRecipientAdd',
  CHANNEL_RECIPIENT_REMOVE: 'channelRecipientRemove',
  INTERACTION_MODAL_CREATE: 'interactionModalCreate',
  CALL_CREATE: 'callCreate',
  CALL_UPDATE: 'callUpdate',
  CALL_DELETE: 'callDelete',
  MESSAGE_POLL_VOTE_ADD: 'messagePollVoteAdd',
  MESSAGE_POLL_VOTE_REMOVE: 'messagePollVoteRemove',
  VOICE_CHANNEL_EFFECT_SEND: 'voiceChannelEffectSend',
  MESSAGE_ACK: 'messageAck',
  CHANNEL_PINS_ACK: 'channelPinsAck',
  GUILD_FEATURE_ACK: 'guildFeatureAck',
  USER_FEATURE_ACK: 'userFeatureAck',
  // Djs v12
  VOICE_BROADCAST_SUBSCRIBE: 'subscribe',
  VOICE_BROADCAST_UNSUBSCRIBE: 'unsubscribe',
};

/**
 * The types of events emitted by a Shard:
 * * CLOSE: close
 * * DESTROYED: destroyed
 * * INVALID_SESSION: invalidSession
 * * READY: ready
 * * RESUMED: resumed
 * * ALL_READY: allReady
 * @typedef {Object<string, string>} ShardEvents
 */
exports.ShardEvents = {
  CLOSE: 'close',
  DESTROYED: 'destroyed',
  INVALID_SESSION: 'invalidSession',
  READY: 'ready',
  RESUMED: 'resumed',
  ALL_READY: 'allReady',
};

/**
 * The type of Structure allowed to be a partial:
 * * USER
 * * CHANNEL (only affects DMChannels)
 * * GUILD_MEMBER
 * * MESSAGE
 * * REACTION
 * * GUILD_SCHEDULED_EVENT
 * <warn>Partials require you to put checks in place when handling data. See the "Partial Structures" topic on the
 * [guide](https://discordjs.guide/popular-topics/partials.html) for more information.</warn>
 * @typedef {string} PartialType
 */
exports.PartialTypes = keyMirror(['USER', 'CHANNEL', 'GUILD_MEMBER', 'MESSAGE', 'REACTION', 'GUILD_SCHEDULED_EVENT']);

/**
 * The type of a WebSocket message event, e.g. `MESSAGE_CREATE`. Here are the available events:
 * * READY
 * * RESUMED
 * * APPLICATION_COMMAND_CREATE (deprecated)
 * * APPLICATION_COMMAND_DELETE (deprecated)
 * * APPLICATION_COMMAND_PERMISSIONS_UPDATE
 * * APPLICATION_COMMAND_UPDATE (deprecated)
 * * AUTO_MODERATION_ACTION_EXECUTION
 * * AUTO_MODERATION_RULE_CREATE
 * * AUTO_MODERATION_RULE_DELETE
 * * AUTO_MODERATION_RULE_UPDATE
 * * GUILD_CREATE
 * * GUILD_DELETE
 * * GUILD_UPDATE
 * * INVITE_CREATE
 * * INVITE_DELETE
 * * GUILD_MEMBER_ADD
 * * GUILD_MEMBER_REMOVE
 * * GUILD_MEMBER_UPDATE
 * * GUILD_MEMBERS_CHUNK
 * * GUILD_INTEGRATIONS_UPDATE
 * * GUILD_ROLE_CREATE
 * * GUILD_ROLE_DELETE
 * * GUILD_ROLE_UPDATE
 * * GUILD_BAN_ADD
 * * GUILD_BAN_REMOVE
 * * GUILD_EMOJIS_UPDATE
 * * CHANNEL_CREATE
 * * CHANNEL_DELETE
 * * CHANNEL_UPDATE
 * * CHANNEL_PINS_UPDATE
 * * MESSAGE_CREATE
 * * MESSAGE_DELETE
 * * MESSAGE_UPDATE
 * * MESSAGE_DELETE_BULK
 * * MESSAGE_REACTION_ADD
 * * MESSAGE_REACTION_REMOVE
 * * MESSAGE_REACTION_REMOVE_ALL
 * * MESSAGE_REACTION_REMOVE_EMOJI
 * * THREAD_CREATE
 * * THREAD_UPDATE
 * * THREAD_DELETE
 * * THREAD_LIST_SYNC
 * * THREAD_MEMBER_UPDATE
 * * THREAD_MEMBERS_UPDATE
 * * USER_UPDATE
 * * PRESENCE_UPDATE
 * * TYPING_START
 * * VOICE_STATE_UPDATE
 * * VOICE_SERVER_UPDATE
 * * WEBHOOKS_UPDATE
 * * STAGE_INSTANCE_CREATE
 * * STAGE_INSTANCE_UPDATE
 * * STAGE_INSTANCE_DELETE
 * * GUILD_STICKERS_UPDATE
 * * GUILD_SCHEDULED_EVENT_CREATE
 * * GUILD_SCHEDULED_EVENT_UPDATE
 * * GUILD_SCHEDULED_EVENT_DELETE
 * * GUILD_SCHEDULED_EVENT_USER_ADD
 * * GUILD_SCHEDULED_EVENT_USER_REMOVE
 * * GUILD_AUDIT_LOG_ENTRY_CREATE
 * @typedef {string} WSEventType
 * @see {@link https://discord.com/developers/docs/topics/gateway-events#receive-events}
 */
exports.WSEvents = keyMirror([
  'READY',
  'RESUMED',
  'APPLICATION_COMMAND_CREATE',
  'APPLICATION_COMMAND_DELETE',
  'APPLICATION_COMMAND_UPDATE',
  'APPLICATION_COMMAND_PERMISSIONS_UPDATE',
  'AUTO_MODERATION_ACTION_EXECUTION',
  'AUTO_MODERATION_RULE_CREATE',
  'AUTO_MODERATION_RULE_DELETE',
  'AUTO_MODERATION_RULE_UPDATE',
  'GUILD_CREATE',
  'GUILD_DELETE',
  'GUILD_UPDATE',
  'INVITE_CREATE',
  'INVITE_DELETE',
  'GUILD_MEMBER_ADD',
  'GUILD_MEMBER_REMOVE',
  'GUILD_MEMBER_UPDATE',
  'GUILD_MEMBERS_CHUNK',
  'GUILD_INTEGRATIONS_UPDATE',
  'GUILD_ROLE_CREATE',
  'GUILD_ROLE_DELETE',
  'GUILD_ROLE_UPDATE',
  'GUILD_BAN_ADD',
  'GUILD_BAN_REMOVE',
  'GUILD_EMOJIS_UPDATE',
  'CHANNEL_CREATE',
  'CHANNEL_DELETE',
  'CHANNEL_UPDATE',
  'CHANNEL_PINS_UPDATE',
  'MESSAGE_CREATE',
  'MESSAGE_DELETE',
  'MESSAGE_UPDATE',
  'MESSAGE_DELETE_BULK',
  'MESSAGE_REACTION_ADD',
  'MESSAGE_REACTION_REMOVE',
  'MESSAGE_REACTION_REMOVE_ALL',
  'MESSAGE_REACTION_REMOVE_EMOJI',
  'THREAD_CREATE',
  'THREAD_UPDATE',
  'THREAD_DELETE',
  'THREAD_LIST_SYNC',
  'THREAD_MEMBER_UPDATE',
  'THREAD_MEMBERS_UPDATE',
  'USER_UPDATE',
  'PRESENCE_UPDATE',
  'TYPING_START',
  'VOICE_STATE_UPDATE',
  'VOICE_SERVER_UPDATE',
  'WEBHOOKS_UPDATE',
  'STAGE_INSTANCE_CREATE',
  'STAGE_INSTANCE_UPDATE',
  'STAGE_INSTANCE_DELETE',
  'GUILD_STICKERS_UPDATE',
  'GUILD_SCHEDULED_EVENT_CREATE',
  'GUILD_SCHEDULED_EVENT_UPDATE',
  'GUILD_SCHEDULED_EVENT_DELETE',
  'GUILD_SCHEDULED_EVENT_USER_ADD',
  'GUILD_SCHEDULED_EVENT_USER_REMOVE',
  'GUILD_AUDIT_LOG_ENTRY_CREATE',
]);

/**
 * A valid scope to request when generating an invite link.
 * <warn>Scopes that require whitelist are not considered valid for this generator</warn>
 * * `applications.builds.read`: allows reading build data for a users applications
 * * `applications.commands`: allows this bot to create commands in the server
 * * `applications.entitlements`: allows reading entitlements for a users applications
 * * `applications.store.update`: allows reading and updating of store data for a users applications
 * * `bot`: makes the bot join the selected guild
 * * `connections`: makes the endpoint for getting a users connections available
 * * `email`: allows the `/users/@me` endpoint return with an email
 * * `identify`: allows the `/users/@me` endpoint without an email
 * * `guilds`: makes the `/users/@me/guilds` endpoint available for a user
 * * `guilds.join`: allows the bot to join the user to any guild it is in using Guild#addMember
 * * `gdm.join`: allows joining the user to a group dm
 * * `webhook.incoming`: generates a webhook to a channel
 * * `role_connections.write`: allows your app to update a user's connection and metadata for the app
 * @typedef {string} InviteScope
 * @see {@link https://discord.com/developers/docs/topics/oauth2#shared-resources-oauth2-scopes}
 */
exports.InviteScopes = [
  'applications.builds.read',
  'applications.commands',
  'applications.entitlements',
  'applications.store.update',
  'bot',
  'connections',
  'email',
  'identify',
  'guilds',
  'guilds.join',
  'gdm.join',
  'webhook.incoming',
  'role_connections.write',
];

// TODO: change Integration#expireBehavior to this and clean up Integration
/**
 * The behavior of expiring subscribers for Integrations. This can be:
 * * REMOVE_ROLE
 * * KICK
 * @typedef {string} IntegrationExpireBehavior
 * @see {@link https://discord.com/developers/docs/resources/guild#integration-object-integration-expire-behaviors}
 */
exports.IntegrationExpireBehaviors = createEnum(['REMOVE_ROLE', 'KICK']);

/**
 * The type of a message, e.g. `DEFAULT`. Here are the available types:
 * * DEFAULT
 * * RECIPIENT_ADD
 * * RECIPIENT_REMOVE
 * * CALL
 * * CHANNEL_NAME_CHANGE
 * * CHANNEL_ICON_CHANGE
 * * CHANNEL_PINNED_MESSAGE
 * * GUILD_MEMBER_JOIN
 * * USER_PREMIUM_GUILD_SUBSCRIPTION
 * * USER_PREMIUM_GUILD_SUBSCRIPTION_TIER_1
 * * USER_PREMIUM_GUILD_SUBSCRIPTION_TIER_2
 * * USER_PREMIUM_GUILD_SUBSCRIPTION_TIER_3
 * * CHANNEL_FOLLOW_ADD
 * * GUILD_DISCOVERY_DISQUALIFIED
 * * GUILD_DISCOVERY_REQUALIFIED
 * * GUILD_DISCOVERY_GRACE_PERIOD_INITIAL_WARNING
 * * GUILD_DISCOVERY_GRACE_PERIOD_FINAL_WARNING
 * * THREAD_CREATED
 * * REPLY
 * * APPLICATION_COMMAND
 * * THREAD_STARTER_MESSAGE
 * * GUILD_INVITE_REMINDER
 * * CONTEXT_MENU_COMMAND
 * * AUTO_MODERATION_ACTION
 * * ROLE_SUBSCRIPTION_PURCHASE
 * * INTERACTION_PREMIUM_UPSELL
 * * STAGE_START
 * * STAGE_END
 * * STAGE_SPEAKER
 * * STAGE_RAISE_HAND
 * * STAGE_TOPIC
 * * GUILD_APPLICATION_PREMIUM_SUBSCRIPTION
 * * PREMIUM_REFERRAL
 * * GUILD_INCIDENT_ALERT_MODE_ENABLED
 * * GUILD_INCIDENT_ALERT_MODE_DISABLED
 * * GUILD_INCIDENT_REPORT_RAID
 * * GUILD_INCIDENT_REPORT_FALSE_ALARM
 * * GUILD_DEADCHAT_REVIVE_PROMPT
 * * CUSTOM_GIFT
 * * GUILD_GAMING_STATS_PROMPT
 * * PURCHASE_NOTIFICATION
 * * POLL_RESULT
 * * CHANGELOG
 * * NITRO_NOTIFICATION
 * @typedef {string} MessageType
 * @see {@link https://discord.com/developers/docs/resources/channel#message-object-message-types}
 * @see {@link https://docs.discord.sex/resources/message#message-type}
 */
exports.MessageTypes = [
  'DEFAULT', // 0
  'RECIPIENT_ADD',
  'RECIPIENT_REMOVE',
  'CALL',
  'CHANNEL_NAME_CHANGE',
  'CHANNEL_ICON_CHANGE',
  'CHANNEL_PINNED_MESSAGE',
  'GUILD_MEMBER_JOIN',
  'USER_PREMIUM_GUILD_SUBSCRIPTION',
  'USER_PREMIUM_GUILD_SUBSCRIPTION_TIER_1',
  'USER_PREMIUM_GUILD_SUBSCRIPTION_TIER_2',
  'USER_PREMIUM_GUILD_SUBSCRIPTION_TIER_3',
  'CHANNEL_FOLLOW_ADD',
  null, // 13
  'GUILD_DISCOVERY_DISQUALIFIED',
  'GUILD_DISCOVERY_REQUALIFIED',
  'GUILD_DISCOVERY_GRACE_PERIOD_INITIAL_WARNING',
  'GUILD_DISCOVERY_GRACE_PERIOD_FINAL_WARNING',
  'THREAD_CREATED',
  'REPLY',
  'APPLICATION_COMMAND',
  'THREAD_STARTER_MESSAGE',
  'GUILD_INVITE_REMINDER',
  'CONTEXT_MENU_COMMAND',
  'AUTO_MODERATION_ACTION',
  'ROLE_SUBSCRIPTION_PURCHASE',
  'INTERACTION_PREMIUM_UPSELL',
  'STAGE_START',
  'STAGE_END',
  'STAGE_SPEAKER',
  'STAGE_RAISE_HAND',
  'STAGE_TOPIC',
  'GUILD_APPLICATION_PREMIUM_SUBSCRIPTION',
  null, // 33
  null,
  'PREMIUM_REFERRAL',
  'GUILD_INCIDENT_ALERT_MODE_ENABLED',
  'GUILD_INCIDENT_ALERT_MODE_DISABLED',
  'GUILD_INCIDENT_REPORT_RAID',
  'GUILD_INCIDENT_REPORT_FALSE_ALARM',
  'GUILD_DEADCHAT_REVIVE_PROMPT',
  'CUSTOM_GIFT',
  'GUILD_GAMING_STATS_PROMPT',
  null,
  'PURCHASE_NOTIFICATION',
  null,
  'POLL_RESULT',
  'CHANGELOG',
  'NITRO_NOTIFICATION',
];

/**
 * The type of a message reference, e.g. `DEFAULT`. Here are the available types:
 * * DEFAULT
 * * FORWARD
 * @typedef {string} MessageReferenceType
 * @see {@link https://discord.com/developers/docs/resources/message#message-reference-types}
 */
exports.MessageReferenceTypes = createEnum([
  'DEFAULT', // 0
  'FORWARD',
]);

/**
 * The name of an item to be swept in Sweepers
 * * `applicationCommands` - both global and guild commands
 * * `autoModerationRules`
 * * `bans`
 * * `emojis`
 * * `invites` - accepts the `lifetime` property, using it will sweep based on expires timestamp
 * * `guildMembers`
 * * `messages` - accepts the `lifetime` property, using it will sweep based on edited or created timestamp
 * * `presences`
 * * `reactions`
 * * `stageInstances`
 * * `stickers`
 * * `threadMembers`
 * * `threads` - accepts the `lifetime` property, using it will sweep archived threads based on archived timestamp
 * * `users`
 * * `voiceStates`
 * @typedef {string} SweeperKey
 */
exports.SweeperKeys = [
  'applicationCommands',
  'autoModerationRules',
  'bans',
  'emojis',
  'invites',
  'guildMembers',
  'messages',
  'presences',
  'reactions',
  'stageInstances',
  'stickers',
  'threadMembers',
  'threads',
  'users',
  'voiceStates',
];

/**
 * The types of messages that are `System`. The available types are `MessageTypes` excluding:
 * * DEFAULT
 * * REPLY
 * * APPLICATION_COMMAND
 * * CONTEXT_MENU_COMMAND
 * @typedef {string} SystemMessageType
 */
exports.SystemMessageTypes = exports.MessageTypes.filter(
  type => type && !['DEFAULT', 'REPLY', 'APPLICATION_COMMAND', 'CONTEXT_MENU_COMMAND'].includes(type),
);

/**
 * <info>Bots cannot set a `CUSTOM` activity type, it is only for custom statuses received from users</info>
 * The type of an activity of a user's presence. Here are the available types:
 * * PLAYING
 * * STREAMING
 * * LISTENING
 * * WATCHING
 * * CUSTOM
 * * COMPETING
 * * HANG
 * @typedef {string} ActivityType
 * @see {@link https://discord.com/developers/docs/game-sdk/activities#data-models-activitytype-enum}
 */
exports.ActivityTypes = createEnum(['PLAYING', 'STREAMING', 'LISTENING', 'WATCHING', 'CUSTOM', 'COMPETING', 'HANG']);

/**
 * All available channel types:
 * * `GUILD_TEXT` - a guild text channel
 * * `DM` - a DM channel
 * * `GUILD_VOICE` - a guild voice channel
 * * `GROUP_DM` - a group DM channel
 * * `GUILD_CATEGORY` - a guild category channel
 * * `GUILD_NEWS` - a guild news channel
 * * `GUILD_STORE` - a guild store channel
 * <warn>Store channels are deprecated and will be removed from Discord in March 2022. See
 * [Self-serve Game Selling Deprecation](https://support-dev.discord.com/hc/en-us/articles/6309018858647)
 * for more information.</warn>
 * * `GUILD_NEWS_THREAD` - a guild news channel's public thread channel
 * * `GUILD_PUBLIC_THREAD` - a guild text channel's public thread channel
 * * `GUILD_PRIVATE_THREAD` - a guild text channel's private thread channel
 * * `GUILD_STAGE_VOICE` - a guild stage voice channel
 * * `GUILD_DIRECTORY` - the channel in a hub containing guilds
 * * `GUILD_FORUM` - a channel that can only contain threads
 * * `GUILD_MEDIA` - a channel that can only contain threads, similar to `GUILD_FORUM` channels
 * * `UNKNOWN` - a generic channel of unknown type, could be Channel or GuildChannel
 * @typedef {string} ChannelType
 * @see {@link https://discord.com/developers/docs/resources/channel#channel-object-channel-types}
 */
exports.ChannelTypes = createEnum([
  'GUILD_TEXT',
  'DM',
  'GUILD_VOICE',
  'GROUP_DM',
  'GUILD_CATEGORY',
  'GUILD_NEWS',
  'GUILD_STORE',
  ...Array(3).fill(null),
  // 10
  'GUILD_NEWS_THREAD',
  'GUILD_PUBLIC_THREAD',
  'GUILD_PRIVATE_THREAD',
  'GUILD_STAGE_VOICE',
  'GUILD_DIRECTORY',
  'GUILD_FORUM',
  'GUILD_MEDIA',
]);

/**
 * The channels that are text-based.
 * * DMChannel
 * * TextChannel
 * * NewsChannel
 * * ThreadChannel
 * * VoiceChannel
 * * StageChannel
 * @typedef {DMChannel|TextChannel|NewsChannel|ThreadChannel|VoiceChannel|StageChannel} TextBasedChannels
 */

/**
 * Data that resolves to give a text-based channel. This can be:
 * * A text-based channel
 * * A snowflake
 * @typedef {TextBasedChannels|Snowflake} TextBasedChannelsResolvable
 */

/**
 * The types of channels that are text-based. The available types are:
 * * DM
 * * GUILD_TEXT
 * * GUILD_NEWS
 * * GUILD_NEWS_THREAD
 * * GUILD_PUBLIC_THREAD
 * * GUILD_PRIVATE_THREAD
 * * GUILD_VOICE
 * * GUILD_STAGE_VOICE
 * @typedef {string} TextBasedChannelTypes
 */
exports.TextBasedChannelTypes = [
  'DM',
  'GUILD_TEXT',
  'GUILD_NEWS',
  'GUILD_NEWS_THREAD',
  'GUILD_PUBLIC_THREAD',
  'GUILD_PRIVATE_THREAD',
  'GUILD_VOICE',
  'GUILD_STAGE_VOICE',
];

/**
 * The types of channels that are threads. The available types are:
 * * GUILD_NEWS_THREAD
 * * GUILD_PUBLIC_THREAD
 * * GUILD_PRIVATE_THREAD
 * @typedef {string} ThreadChannelTypes
 */
exports.ThreadChannelTypes = ['GUILD_NEWS_THREAD', 'GUILD_PUBLIC_THREAD', 'GUILD_PRIVATE_THREAD'];

/**
 * The types of channels that are voice-based. The available types are:
 * * GUILD_VOICE
 * * GUILD_STAGE_VOICE
 * @typedef {string} VoiceBasedChannelTypes
 */
exports.VoiceBasedChannelTypes = ['GUILD_VOICE', 'GUILD_STAGE_VOICE'];

/**
 * The types of assets of an application:
 * * SMALL: 1
 * * BIG: 2
 * @typedef {Object<string, number>} ClientApplicationAssetTypes
 */
exports.ClientApplicationAssetTypes = {
  SMALL: 1,
  BIG: 2,
};

/**
 * A commonly used color:
 * * DEFAULT
 * * WHITE
 * * AQUA
 * * GREEN
 * * BLUE
 * * YELLOW
 * * PURPLE
 * * LUMINOUS_VIVID_PINK
 * * FUCHSIA
 * * GOLD
 * * ORANGE
 * * RED
 * * GREY
 * * NAVY
 * * DARK_AQUA
 * * DARK_GREEN
 * * DARK_BLUE
 * * DARK_PURPLE
 * * DARK_VIVID_PINK
 * * DARK_GOLD
 * * DARK_ORANGE
 * * DARK_RED
 * * DARK_GREY
 * * DARKER_GREY
 * * LIGHT_GREY
 * * DARK_NAVY
 * * BLURPLE
 * * GREYPLE
 * * DARK_BUT_NOT_BLACK
 * * NOT_QUITE_BLACK
 * @typedef {string} Color
 */
exports.Colors = {
  DEFAULT: 0x000000,
  WHITE: 0xffffff,
  AQUA: 0x1abc9c,
  GREEN: 0x57f287,
  BLUE: 0x3498db,
  YELLOW: 0xfee75c,
  PURPLE: 0x9b59b6,
  LUMINOUS_VIVID_PINK: 0xe91e63,
  FUCHSIA: 0xeb459e,
  GOLD: 0xf1c40f,
  ORANGE: 0xe67e22,
  RED: 0xed4245,
  GREY: 0x95a5a6,
  NAVY: 0x34495e,
  DARK_AQUA: 0x11806a,
  DARK_GREEN: 0x1f8b4c,
  DARK_BLUE: 0x206694,
  DARK_PURPLE: 0x71368a,
  DARK_VIVID_PINK: 0xad1457,
  DARK_GOLD: 0xc27c0e,
  DARK_ORANGE: 0xa84300,
  DARK_RED: 0x992d22,
  DARK_GREY: 0x979c9f,
  DARKER_GREY: 0x7f8c8d,
  LIGHT_GREY: 0xbcc0c0,
  DARK_NAVY: 0x2c3e50,
  BLURPLE: 0x5865f2,
  GREYPLE: 0x99aab5,
  DARK_BUT_NOT_BLACK: 0x2c2f33,
  NOT_QUITE_BLACK: 0x23272a,
};

/**
 * The value set for the explicit content filter levels for a guild:
 * * DISABLED
 * * MEMBERS_WITHOUT_ROLES
 * * ALL_MEMBERS
 * @typedef {string} ExplicitContentFilterLevel
 * @see {@link https://discord.com/developers/docs/resources/guild#guild-object-explicit-content-filter-level}
 */
exports.ExplicitContentFilterLevels = createEnum(['DISABLED', 'MEMBERS_WITHOUT_ROLES', 'ALL_MEMBERS']);

/**
 * The value set for the verification levels for a guild:
 * * NONE
 * * LOW
 * * MEDIUM
 * * HIGH
 * * VERY_HIGH
 * @typedef {string} VerificationLevel
 * @see {@link https://discord.com/developers/docs/resources/guild#guild-object-verification-level}
 */
exports.VerificationLevels = createEnum(['NONE', 'LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH']);

/**
 * An error encountered while performing an API request. Here are the potential errors:
 * * UNKNOWN_ACCOUNT
 * * UNKNOWN_APPLICATION
 * * UNKNOWN_CHANNEL
 * * UNKNOWN_GUILD
 * * UNKNOWN_INTEGRATION
 * * UNKNOWN_INVITE
 * * UNKNOWN_MEMBER
 * * UNKNOWN_MESSAGE
 * * UNKNOWN_OVERWRITE
 * * UNKNOWN_PROVIDER
 * * UNKNOWN_ROLE
 * * UNKNOWN_TOKEN
 * * UNKNOWN_USER
 * * UNKNOWN_EMOJI
 * * UNKNOWN_WEBHOOK
 * * UNKNOWN_WEBHOOK_SERVICE
 * * UNKNOWN_SESSION
 * * UNKNOWN_BAN
 * * UNKNOWN_SKU
 * * UNKNOWN_STORE_LISTING
 * * UNKNOWN_ENTITLEMENT
 * * UNKNOWN_BUILD
 * * UNKNOWN_LOBBY
 * * UNKNOWN_BRANCH
 * * UNKNOWN_STORE_DIRECTORY_LAYOUT
 * * UNKNOWN_REDISTRIBUTABLE
 * * UNKNOWN_GIFT_CODE
 * * UNKNOWN_STREAM
 * * UNKNOWN_PREMIUM_SERVER_SUBSCRIBE_COOLDOWN
 * * UNKNOWN_GUILD_TEMPLATE
 * * UNKNOWN_DISCOVERABLE_SERVER_CATEGORY
 * * UNKNOWN_STICKER
 * * UNKNOWN_INTERACTION
 * * UNKNOWN_APPLICATION_COMMAND
 * * UNKNOWN_APPLICATION_COMMAND_PERMISSIONS
 * * UNKNOWN_STAGE_INSTANCE
 * * UNKNOWN_GUILD_MEMBER_VERIFICATION_FORM
 * * UNKNOWN_GUILD_WELCOME_SCREEN
 * * UNKNOWN_GUILD_SCHEDULED_EVENT
 * * UNKNOWN_GUILD_SCHEDULED_EVENT_USER
 * * BOT_PROHIBITED_ENDPOINT
 * * BOT_ONLY_ENDPOINT
 * * CANNOT_SEND_EXPLICIT_CONTENT
 * * NOT_AUTHORIZED
 * * SLOWMODE_RATE_LIMIT
 * * ACCOUNT_OWNER_ONLY
 * * ANNOUNCEMENT_EDIT_LIMIT_EXCEEDED
 * * CHANNEL_HIT_WRITE_RATELIMIT
 * * SERVER_HIT_WRITE_RATELIMIT
 * * CONTENT_NOT_ALLOWED
 * * GUILD_PREMIUM_LEVEL_TOO_LOW
 * * MAXIMUM_GUILDS
 * * MAXIMUM_FRIENDS
 * * MAXIMUM_PINS
 * * MAXIMUM_RECIPIENTS
 * * MAXIMUM_ROLES
 * * MAXIMUM_WEBHOOKS
 * * MAXIMUM_EMOJIS
 * * MAXIMUM_REACTIONS
 * * MAXIMUM_CHANNELS
 * * MAXIMUM_ATTACHMENTS
 * * MAXIMUM_INVITES
 * * MAXIMUM_ANIMATED_EMOJIS
 * * MAXIMUM_SERVER_MEMBERS
 * * MAXIMUM_NUMBER_OF_SERVER_CATEGORIES
 * * GUILD_ALREADY_HAS_TEMPLATE
 * * MAXIMUM_THREAD_PARTICIPANTS
 * * MAXIMUM_NON_GUILD_MEMBERS_BANS
 * * MAXIMUM_BAN_FETCHES
 * * MAXIMUM_NUMBER_OF_UNCOMPLETED_GUILD_SCHEDULED_EVENTS_REACHED
 * * MAXIMUM_NUMBER_OF_STICKERS_REACHED
 * * MAXIMUM_PRUNE_REQUESTS
 * * MAXIMUM_GUILD_WIDGET_SETTINGS_UPDATE
 * * UNAUTHORIZED
 * * ACCOUNT_VERIFICATION_REQUIRED
 * * DIRECT_MESSAGES_TOO_FAST
 * * REQUEST_ENTITY_TOO_LARGE
 * * FEATURE_TEMPORARILY_DISABLED
 * * USER_BANNED
 * * TARGET_USER_NOT_CONNECTED_TO_VOICE
 * * ALREADY_CROSSPOSTED
 * * MISSING_ACCESS
 * * INVALID_ACCOUNT_TYPE
 * * CANNOT_EXECUTE_ON_DM
 * * EMBED_DISABLED
 * * CANNOT_EDIT_MESSAGE_BY_OTHER
 * * CANNOT_SEND_EMPTY_MESSAGE
 * * CANNOT_MESSAGE_USER
 * * CANNOT_SEND_MESSAGES_IN_VOICE_CHANNEL
 * * CHANNEL_VERIFICATION_LEVEL_TOO_HIGH
 * * OAUTH2_APPLICATION_BOT_ABSENT
 * * MAXIMUM_OAUTH2_APPLICATIONS
 * * INVALID_OAUTH_STATE
 * * MISSING_PERMISSIONS
 * * INVALID_AUTHENTICATION_TOKEN
 * * NOTE_TOO_LONG
 * * INVALID_BULK_DELETE_QUANTITY
 * * CANNOT_PIN_MESSAGE_IN_OTHER_CHANNEL
 * * INVALID_OR_TAKEN_INVITE_CODE
 * * CANNOT_EXECUTE_ON_SYSTEM_MESSAGE
 * * CANNOT_EXECUTE_ON_CHANNEL_TYPE
 * * INVALID_OAUTH_TOKEN
 * * MISSING_OAUTH_SCOPE
 * * INVALID_WEBHOOK_TOKEN
 * * INVALID_ROLE
 * * INVALID_RECIPIENTS
 * * BULK_DELETE_MESSAGE_TOO_OLD
 * * INVALID_FORM_BODY
 * * INVITE_ACCEPTED_TO_GUILD_NOT_CONTAINING_BOT
 * * INVALID_API_VERSION
 * * FILE_UPLOADED_EXCEEDS_MAXIMUM_SIZE
 * * INVALID_FILE_UPLOADED
 * * CANNOT_SELF_REDEEM_GIFT
 * * INVALID_GUILD
 * * INVALID_MESSAGE_TYPE
 * * PAYMENT_SOURCE_REQUIRED
 * * CANNOT_DELETE_COMMUNITY_REQUIRED_CHANNEL
 * * INVALID_STICKER_SENT
 * * INVALID_OPERATION_ON_ARCHIVED_THREAD
 * * INVALID_THREAD_NOTIFICATION_SETTINGS
 * * PARAMETER_EARLIER_THAN_CREATION
 * * GUILD_NOT_AVAILABLE_IN_LOCATION
 * * GUILD_MONETIZATION_REQUIRED
 * * INSUFFICIENT_BOOSTS
 * * INVALID_JSON
 * * TWO_FACTOR_REQUIRED
 * * NO_USERS_WITH_DISCORDTAG_EXIST
 * * REACTION_BLOCKED
 * * RESOURCE_OVERLOADED
 * * STAGE_ALREADY_OPEN
 * * CANNOT_REPLY_WITHOUT_READ_MESSAGE_HISTORY_PERMISSION
 * * MESSAGE_ALREADY_HAS_THREAD
 * * THREAD_LOCKED
 * * MAXIMUM_ACTIVE_THREADS
 * * MAXIMUM_ACTIVE_ANNOUNCEMENT_THREADS
 * * INVALID_JSON_FOR_UPLOADED_LOTTIE_FILE
 * * UPLOADED_LOTTIES_CANNOT_CONTAIN_RASTERIZED_IMAGES
 * * STICKER_MAXIMUM_FRAMERATE_EXCEEDED
 * * STICKER_FRAME_COUNT_EXCEEDS_MAXIMUM_OF_1000_FRAMES
 * * LOTTIE_ANIMATION_MAXIMUM_DIMENSIONS_EXCEEDED
 * * STICKER_FRAME_RATE_IS_TOO_SMALL_OR_TOO_LARGE
 * * STICKER_ANIMATION_DURATION_EXCEEDS_MAXIMUM_OF_5_SECONDS
 * * CANNOT_UPDATE_A_FINISHED_EVENT
 * * FAILED_TO_CREATE_STAGE_NEEDED_FOR_STAGE_EVENT
 * @typedef {string} APIError
 * @see {@link https://discord.com/developers/docs/topics/opcodes-and-status-codes#json-json-error-codes}
 * @see {@link https://gist.github.com/Dziurwa14/de2498e5ee28d2089f095aa037957cbb}
 */
exports.APIErrors = {
  UNKNOWN_ACCOUNT: 10001,
  UNKNOWN_APPLICATION: 10002,
  UNKNOWN_CHANNEL: 10003,
  UNKNOWN_GUILD: 10004,
  UNKNOWN_INTEGRATION: 10005,
  UNKNOWN_INVITE: 10006,
  UNKNOWN_MEMBER: 10007,
  UNKNOWN_MESSAGE: 10008,
  UNKNOWN_OVERWRITE: 10009,
  UNKNOWN_PROVIDER: 10010,
  UNKNOWN_ROLE: 10011,
  UNKNOWN_TOKEN: 10012,
  UNKNOWN_USER: 10013,
  UNKNOWN_EMOJI: 10014,
  UNKNOWN_WEBHOOK: 10015,
  UNKNOWN_WEBHOOK_SERVICE: 10016,
  UNKNOWN_SESSION: 10020,
  UNKNOWN_BAN: 10026,
  UNKNOWN_SKU: 10027,
  UNKNOWN_STORE_LISTING: 10028,
  UNKNOWN_ENTITLEMENT: 10029,
  UNKNOWN_BUILD: 10030,
  UNKNOWN_LOBBY: 10031,
  UNKNOWN_BRANCH: 10032,
  UNKNOWN_STORE_DIRECTORY_LAYOUT: 10033,
  UNKNOWN_REDISTRIBUTABLE: 10036,
  UNKNOWN_GIFT_CODE: 10038,
  UNKNOWN_STREAM: 10049,
  UNKNOWN_PREMIUM_SERVER_SUBSCRIBE_COOLDOWN: 10050,
  UNKNOWN_GUILD_TEMPLATE: 10057,
  UNKNOWN_DISCOVERABLE_SERVER_CATEGORY: 10059,
  UNKNOWN_STICKER: 10060,
  UNKNOWN_INTERACTION: 10062,
  UNKNOWN_APPLICATION_COMMAND: 10063,
  UNKNOWN_APPLICATION_COMMAND_PERMISSIONS: 10066,
  UNKNOWN_STAGE_INSTANCE: 10067,
  UNKNOWN_GUILD_MEMBER_VERIFICATION_FORM: 10068,
  UNKNOWN_GUILD_WELCOME_SCREEN: 10069,
  UNKNOWN_GUILD_SCHEDULED_EVENT: 10070,
  UNKNOWN_GUILD_SCHEDULED_EVENT_USER: 10071,
  BOT_PROHIBITED_ENDPOINT: 20001,
  BOT_ONLY_ENDPOINT: 20002,
  CANNOT_SEND_EXPLICIT_CONTENT: 20009,
  NOT_AUTHORIZED: 20012,
  SLOWMODE_RATE_LIMIT: 20016,
  ACCOUNT_OWNER_ONLY: 20018,
  ANNOUNCEMENT_EDIT_LIMIT_EXCEEDED: 20022,
  CHANNEL_HIT_WRITE_RATELIMIT: 20028,
  SERVER_HIT_WRITE_RATELIMIT: 20029,
  CONTENT_NOT_ALLOWED: 20031,
  GUILD_PREMIUM_LEVEL_TOO_LOW: 20035,
  MAXIMUM_GUILDS: 30001,
  MAXIMUM_FRIENDS: 30002,
  MAXIMUM_PINS: 30003,
  MAXIMUM_RECIPIENTS: 30004,
  MAXIMUM_ROLES: 30005,
  MAXIMUM_WEBHOOKS: 30007,
  MAXIMUM_EMOJIS: 30008,
  MAXIMUM_REACTIONS: 30010,
  MAXIMUM_CHANNELS: 30013,
  MAXIMUM_ATTACHMENTS: 30015,
  MAXIMUM_INVITES: 30016,
  MAXIMUM_ANIMATED_EMOJIS: 30018,
  MAXIMUM_SERVER_MEMBERS: 30019,
  MAXIMUM_NUMBER_OF_SERVER_CATEGORIES: 30030,
  GUILD_ALREADY_HAS_TEMPLATE: 30031,
  MAXIMUM_THREAD_PARTICIPANTS: 30033,
  MAXIMUM_NON_GUILD_MEMBERS_BANS: 30035,
  MAXIMUM_BAN_FETCHES: 30037,
  MAXIMUM_NUMBER_OF_UNCOMPLETED_GUILD_SCHEDULED_EVENTS_REACHED: 30038,
  MAXIMUM_NUMBER_OF_STICKERS_REACHED: 30039,
  MAXIMUM_PRUNE_REQUESTS: 30040,
  MAXIMUM_GUILD_WIDGET_SETTINGS_UPDATE: 30042,
  MAXIMUM_NUMBER_OF_PREMIUM_EMOJIS: 30056,
  UNAUTHORIZED: 40001,
  ACCOUNT_VERIFICATION_REQUIRED: 40002,
  DIRECT_MESSAGES_TOO_FAST: 40003,
  REQUEST_ENTITY_TOO_LARGE: 40005,
  FEATURE_TEMPORARILY_DISABLED: 40006,
  USER_BANNED: 40007,
  TARGET_USER_NOT_CONNECTED_TO_VOICE: 40032,
  ALREADY_CROSSPOSTED: 40033,
  MISSING_ACCESS: 50001,
  INVALID_ACCOUNT_TYPE: 50002,
  CANNOT_EXECUTE_ON_DM: 50003,
  EMBED_DISABLED: 50004,
  CANNOT_EDIT_MESSAGE_BY_OTHER: 50005,
  CANNOT_SEND_EMPTY_MESSAGE: 50006,
  CANNOT_MESSAGE_USER: 50007,
  CANNOT_SEND_MESSAGES_IN_VOICE_CHANNEL: 50008,
  CHANNEL_VERIFICATION_LEVEL_TOO_HIGH: 50009,
  OAUTH2_APPLICATION_BOT_ABSENT: 50010,
  MAXIMUM_OAUTH2_APPLICATIONS: 50011,
  INVALID_OAUTH_STATE: 50012,
  MISSING_PERMISSIONS: 50013,
  INVALID_AUTHENTICATION_TOKEN: 50014,
  NOTE_TOO_LONG: 50015,
  INVALID_BULK_DELETE_QUANTITY: 50016,
  CANNOT_PIN_MESSAGE_IN_OTHER_CHANNEL: 50019,
  INVALID_OR_TAKEN_INVITE_CODE: 50020,
  CANNOT_EXECUTE_ON_SYSTEM_MESSAGE: 50021,
  CANNOT_EXECUTE_ON_CHANNEL_TYPE: 50024,
  INVALID_OAUTH_TOKEN: 50025,
  MISSING_OAUTH_SCOPE: 50026,
  INVALID_WEBHOOK_TOKEN: 50027,
  INVALID_ROLE: 50028,
  INVALID_RECIPIENTS: 50033,
  BULK_DELETE_MESSAGE_TOO_OLD: 50034,
  INVALID_FORM_BODY: 50035,
  INVITE_ACCEPTED_TO_GUILD_NOT_CONTAINING_BOT: 50036,
  INVALID_API_VERSION: 50041,
  FILE_UPLOADED_EXCEEDS_MAXIMUM_SIZE: 50045,
  INVALID_FILE_UPLOADED: 50046,
  CANNOT_SELF_REDEEM_GIFT: 50054,
  INVALID_GUILD: 50055,
  INVALID_MESSAGE_TYPE: 50068,
  PAYMENT_SOURCE_REQUIRED: 50070,
  CANNOT_DELETE_COMMUNITY_REQUIRED_CHANNEL: 50074,
  INVALID_STICKER_SENT: 50081,
  INVALID_OPERATION_ON_ARCHIVED_THREAD: 50083,
  INVALID_THREAD_NOTIFICATION_SETTINGS: 50084,
  PARAMETER_EARLIER_THAN_CREATION: 50085,
  GUILD_NOT_AVAILABLE_IN_LOCATION: 50095,
  GUILD_MONETIZATION_REQUIRED: 50097,
  INSUFFICIENT_BOOSTS: 50101,
  INVALID_JSON: 50109,
  CANNOT_MIX_SUBSCRIPTION_AND_NON_SUBSCRIPTION_ROLES_FOR_EMOJI: 50144,
  CANNOT_CONVERT_PREMIUM_EMOJI_TO_NORMAL_EMOJI: 50145,
  VOICE_MESSAGES_DO_NOT_SUPPORT_ADDITIONAL_CONTENT: 50159,
  VOICE_MESSAGES_MUST_HAVE_A_SINGLE_AUDIO_ATTACHMENT: 50160,
  VOICE_MESSAGES_MUST_HAVE_SUPPORTING_METADATA: 50161,
  VOICE_MESSAGES_CANNOT_BE_EDITED: 50162,
  YOU_CANNOT_SEND_VOICE_MESSAGES_IN_THIS_CHANNEL: 50173,
  TWO_FACTOR_REQUIRED: 60003,
  NO_USERS_WITH_DISCORDTAG_EXIST: 80004,
  REACTION_BLOCKED: 90001,
  RESOURCE_OVERLOADED: 130000,
  STAGE_ALREADY_OPEN: 150006,
  CANNOT_REPLY_WITHOUT_READ_MESSAGE_HISTORY_PERMISSION: 160002,
  MESSAGE_ALREADY_HAS_THREAD: 160004,
  THREAD_LOCKED: 160005,
  MAXIMUM_ACTIVE_THREADS: 160006,
  MAXIMUM_ACTIVE_ANNOUNCEMENT_THREADS: 160007,
  INVALID_JSON_FOR_UPLOADED_LOTTIE_FILE: 170001,
  UPLOADED_LOTTIES_CANNOT_CONTAIN_RASTERIZED_IMAGES: 170002,
  STICKER_MAXIMUM_FRAMERATE_EXCEEDED: 170003,
  STICKER_FRAME_COUNT_EXCEEDS_MAXIMUM_OF_1000_FRAMES: 170004,
  LOTTIE_ANIMATION_MAXIMUM_DIMENSIONS_EXCEEDED: 170005,
  STICKER_FRAME_RATE_IS_TOO_SMALL_OR_TOO_LARGE: 170006,
  STICKER_ANIMATION_DURATION_EXCEEDS_MAXIMUM_OF_5_SECONDS: 170007,
  CANNOT_UPDATE_A_FINISHED_EVENT: 180000,
  FAILED_TO_CREATE_STAGE_NEEDED_FOR_STAGE_EVENT: 180002,
};

/**
 * The value set for a guild's default message notifications, e.g. `ALL_MESSAGES`. Here are the available types:
 * * ALL_MESSAGES
 * * ONLY_MENTIONS
 * @typedef {string} DefaultMessageNotificationLevel
 * @see {@link https://discord.com/developers/docs/resources/guild#guild-object-default-message-notification-level}
 */
exports.DefaultMessageNotificationLevels = createEnum(['ALL_MESSAGES', 'ONLY_MENTIONS']);

/**
 * The value set for a team member's membership state:
 * * INVITED
 * * ACCEPTED
 * @typedef {string} MembershipState
 * @see {@link https://discord.com/developers/docs/topics/teams#data-models-membership-state-enum}
 */
exports.MembershipStates = createEnum([null, 'INVITED', 'ACCEPTED']);

/**
 * The value set for a webhook's type:
 * * Incoming
 * * Channel Follower
 * * Application
 * @typedef {string} WebhookType
 * @see {@link https://discord.com/developers/docs/resources/webhook#webhook-object-webhook-types}
 */
exports.WebhookTypes = createEnum([null, 'Incoming', 'Channel Follower', 'Application']);

/**
 * The value set for a sticker's type:
 * * STANDARD
 * * GUILD
 * @typedef {string} StickerType
 * @see {@link https://discord.com/developers/docs/resources/sticker#sticker-object-sticker-types}
 */
exports.StickerTypes = createEnum([null, 'STANDARD', 'GUILD']);

/**
 * The value set for a sticker's format type:
 * * PNG
 * * APNG
 * * LOTTIE
 * * GIF
 * @typedef {string} StickerFormatType
 * @see {@link https://discord.com/developers/docs/resources/sticker#sticker-object-sticker-format-types}
 */
exports.StickerFormatTypes = createEnum([null, 'PNG', 'APNG', 'LOTTIE', 'GIF']);

/**
 * An overwrite type:
 * * role
 * * member
 * @typedef {string} OverwriteType
 * @see {@link https://discord.com/developers/docs/resources/channel#overwrite-object-overwrite-structure}
 */
exports.OverwriteTypes = createEnum(['role', 'member']);

/* eslint-disable max-len */
/**
 * The type of an {@link ApplicationCommand} object:
 * * CHAT_INPUT
 * * USER
 * * MESSAGE
 * @typedef {string} ApplicationCommandType
 * @see {@link https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-types}
 */
exports.ApplicationCommandTypes = createEnum([null, 'CHAT_INPUT', 'USER', 'MESSAGE']);

/**
 * The type of an {@link ApplicationCommandOption} object:
 * * SUB_COMMAND
 * * SUB_COMMAND_GROUP
 * * STRING
 * * INTEGER
 * * BOOLEAN
 * * USER
 * * CHANNEL
 * * ROLE
 * * MENTIONABLE
 * * NUMBER
 * * ATTACHMENT
 * @typedef {string} ApplicationCommandOptionType
 * @see {@link https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-option-type}
 */
exports.ApplicationCommandOptionTypes = createEnum([
  null,
  'SUB_COMMAND',
  'SUB_COMMAND_GROUP',
  'STRING',
  'INTEGER',
  'BOOLEAN',
  'USER',
  'CHANNEL',
  'ROLE',
  'MENTIONABLE',
  'NUMBER',
  'ATTACHMENT',
]);

/**
 * The type of an {@link ApplicationCommandPermissions} object:
 * * ROLE
 * * USER
 * @typedef {string} ApplicationCommandPermissionType
 * @see {@link https://discord.com/developers/docs/interactions/application-commands#application-command-permissions-object-application-command-permission-type}
 */
exports.ApplicationCommandPermissionTypes = createEnum([null, 'ROLE', 'USER']);

/**
 * Each metadata type offers a comparison operation that allows
 * guilds to configure role requirements based on metadata values stored by the bot.
 * Bots specify a metadata value for each user and guilds specify
 * the required guild's configured value within the guild role settings.
 * All available channel types:
 * * INTEGER_LESS_THAN_OR_EQUAL
 * * INTEGER_GREATER_THAN_OR_EQUAL
 * * INTEGER_EQUAL
 * * INTEGER_NOT_EQUAL
 * * DATATIME_LESS_THAN_OR_EQUAL
 * * DATATIME_GREATER_THAN_OR_EQUAL
 * * BOOLEAN_EQUAL
 * * BOOLEAN_NOT_EQUAL
 * @typedef {string} ApplicationRoleConnectionMetadataType
 * @see{@link https://discord.com/developers/docs/resources/application-role-connection-metadata#application-role-connection-metadata-object-application-role-connection-metadata-type}
 */
exports.ApplicationRoleConnectionMetadataTypes = createEnum([
  null,
  'INTEGER_LESS_THAN_OR_EQUAL',
  'INTEGER_GREATER_THAN_OR_EQUAL',
  'INTEGER_EQUAL',
  'INTEGER_NOT_EQUAL',
  'DATATIME_LESS_THAN_OR_EQUAL',
  'DATATIME_GREATER_THAN_OR_EQUAL',
  'BOOLEAN_EQUAL',
  'BOOLEAN_NOT_EQUAL',
]);

/**
 * The type of an {@link AutoModerationRuleTriggerTypes} object:
 * * KEYWORD
 * * SPAM
 * * KEYWORD_PRESET
 * * MENTION_SPAM
 * @typedef {string} AutoModerationRuleTriggerType
 * @see {@link https://discord.com/developers/docs/resources/auto-moderation#auto-moderation-rule-object-trigger-types}
 */
exports.AutoModerationRuleTriggerTypes = createEnum([null, 'KEYWORD', null, 'SPAM', 'KEYWORD_PRESET', 'MENTION_SPAM']);

/**
 * The type of an {@link AutoModerationRuleKeywordPresetTypes} object:
 * * KEYWORD
 * * SPAM
 * * KEYWORD_PRESET
 * * MENTION_SPAM
 * @typedef {string} AutoModerationRuleKeywordPresetType
 * @see {@link https://discord.com/developers/docs/resources/auto-moderation#auto-moderation-rule-object-keyword-preset-types}
 */
exports.AutoModerationRuleKeywordPresetTypes = createEnum([null, 'PROFANITY', 'SEXUAL_CONTENT', 'SLURS']);
/**
 * The type of an {@link AutoModerationActionTypes} object:
 * * BLOCK_MESSAGE
 * * SEND_ALERT_MESSAGE
 * * TIMEOUT
 * @typedef {string} AutoModerationActionType
 * @see {@link https://discord.com/developers/docs/resources/auto-moderation#auto-moderation-action-object-action-types}
 */
exports.AutoModerationActionTypes = createEnum([null, 'BLOCK_MESSAGE', 'SEND_ALERT_MESSAGE', 'TIMEOUT']);

/**
 * The type of an {@link AutoModerationRuleEventTypes} object:
 * * MESSAGE_SEND
 * @typedef {string} AutoModerationRuleEventType
 * @see {@link https://discord.com/developers/docs/resources/auto-moderation#auto-moderation-rule-object-event-types}
 */

exports.AutoModerationRuleEventTypes = createEnum([null, 'MESSAGE_SEND']);
/**
 * The type of an {@link Interaction} object:
 * * PING
 * * APPLICATION_COMMAND
 * * MESSAGE_COMPONENT
 * * APPLICATION_COMMAND_AUTOCOMPLETE
 * * MODAL_SUBMIT
 * @typedef {string} InteractionType
 * @see {@link https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-object-interaction-type}
 */
exports.InteractionTypes = createEnum([
  null,
  'PING',
  'APPLICATION_COMMAND',
  'MESSAGE_COMPONENT',
  'APPLICATION_COMMAND_AUTOCOMPLETE',
  'MODAL_SUBMIT',
]);

/**
 * The type of an interaction response:
 * * PONG
 * * CHANNEL_MESSAGE_WITH_SOURCE
 * * DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE
 * * DEFERRED_MESSAGE_UPDATE
 * * UPDATE_MESSAGE
 * * APPLICATION_COMMAND_AUTOCOMPLETE_RESULT
 * * MODAL
 * @typedef {string} InteractionResponseType
 * @see {@link https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-response-object-interaction-callback-type}
 */
exports.InteractionResponseTypes = createEnum([
  null,
  'PONG',
  null,
  null,
  'CHANNEL_MESSAGE_WITH_SOURCE',
  'DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE',
  'DEFERRED_MESSAGE_UPDATE',
  'UPDATE_MESSAGE',
  'APPLICATION_COMMAND_AUTOCOMPLETE_RESULT',
  'MODAL',
]);

/**
 * The type of a message component
 * * ACTION_ROW
 * * BUTTON
 * * STRING_SELECT
 * * TEXT_INPUT
 * * USER_SELECT
 * * ROLE_SELECT
 * * MENTIONABLE_SELECT
 * * CHANNEL_SELECT
 * @typedef {string} MessageComponentType
 * @see {@link https://discord.com/developers/docs/interactions/message-components#component-object-component-types}
 */
exports.MessageComponentTypes = createEnum([
  null,
  'ACTION_ROW',
  'BUTTON',
  'STRING_SELECT',
  'TEXT_INPUT',
  'USER_SELECT',
  'ROLE_SELECT',
  'MENTIONABLE_SELECT',
  'CHANNEL_SELECT',
]);

/**
 * The types of components that are select menus. The available types are:
 * * STRING_MENU
 * * USER_SELECT
 * * ROLE_SELECT
 * * MENTIONABLE_SELECT
 * * CHANNEL_SELECT
 * @typedef {string} SelectMenuComponentType
 * @see {@link https://discord.com/developers/docs/interactions/message-components#component-object-component-types}
 */
exports.SelectMenuComponentTypes = createEnum([
  ...new Array(3).fill(null),
  'STRING_MENU',
  null,
  'USER_SELECT',
  'ROLE_SELECT',
  'MENTIONABLE_SELECT',
  'CHANNEL_SELECT',
]);

/**
 * The style of a message button
 * * PRIMARY
 * * SECONDARY
 * * SUCCESS
 * * DANGER
 * * LINK
 * @typedef {string} MessageButtonStyle
 * @see {@link https://discord.com/developers/docs/interactions/message-components#button-object-button-styles}
 */
exports.MessageButtonStyles = createEnum([null, 'PRIMARY', 'SECONDARY', 'SUCCESS', 'DANGER', 'LINK']);

/**
 * The required MFA level for a guild
 * * NONE
 * * ELEVATED
 * @typedef {string} MFALevel
 * @see {@link https://discord.com/developers/docs/resources/guild#guild-object-mfa-level}
 */
exports.MFALevels = createEnum(['NONE', 'ELEVATED']);

/**
 * NSFW level of a Guild:
 * * DEFAULT
 * * EXPLICIT
 * * SAFE
 * * AGE_RESTRICTED
 * @typedef {string} NSFWLevel
 * @see {@link https://discord.com/developers/docs/resources/guild#guild-object-guild-nsfw-level}
 */
exports.NSFWLevels = createEnum(['DEFAULT', 'EXPLICIT', 'SAFE', 'AGE_RESTRICTED']);

/**
 * Privacy level of a {@link StageInstance} object:
 * * PUBLIC
 * * GUILD_ONLY
 * @typedef {string} PrivacyLevel
 * @see {@link https://discord.com/developers/docs/resources/stage-instance#stage-instance-object-privacy-level}
 */
exports.PrivacyLevels = createEnum([null, 'PUBLIC', 'GUILD_ONLY']);

/**
 * The style of a text input component
 * * SHORT
 * * PARAGRAPH
 * @typedef {string} TextInputStyle
 * @see {@link https://discord.com/developers/docs/interactions/message-components#text-inputs-text-input-styles}
 */
exports.TextInputStyles = createEnum([null, 'SHORT', 'PARAGRAPH']);

/**
 * Privacy level of a {@link GuildScheduledEvent} object:
 * * GUILD_ONLY
 * @typedef {string} GuildScheduledEventPrivacyLevel
 * @see {@link https://discord.com/developers/docs/resources/guild-scheduled-event#guild-scheduled-event-object-guild-scheduled-event-privacy-level}
 */
exports.GuildScheduledEventPrivacyLevels = createEnum([null, null, 'GUILD_ONLY']);

/**
 * The premium tier (Server Boost level) of a guild:
 * * NONE
 * * TIER_1
 * * TIER_2
 * * TIER_3
 * @typedef {string} PremiumTier
 * @see {@link https://discord.com/developers/docs/resources/guild#guild-object-premium-tier}
 */
exports.PremiumTiers = createEnum(['NONE', 'TIER_1', 'TIER_2', 'TIER_3']);

/**
 * The status of a {@link GuildScheduledEvent}:
 * * SCHEDULED
 * * ACTIVE
 * * COMPLETED
 * * CANCELED
 * @typedef {string} GuildScheduledEventStatus
 * @see {@link https://discord.com/developers/docs/resources/guild-scheduled-event#guild-scheduled-event-object-guild-scheduled-event-status}
 */
exports.GuildScheduledEventStatuses = createEnum([null, 'SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELED']);

/**
 * The entity type of a {@link GuildScheduledEvent}:
 * * NONE
 * * STAGE_INSTANCE
 * * VOICE
 * * EXTERNAL
 * @typedef {string} GuildScheduledEventEntityType
 * @see {@link https://discord.com/developers/docs/resources/guild-scheduled-event#guild-scheduled-event-object-guild-scheduled-event-entity-types}
 */
exports.GuildScheduledEventEntityTypes = createEnum([null, 'STAGE_INSTANCE', 'VOICE', 'EXTERNAL']);
/* eslint-enable max-len */

/**
 * The camera video quality mode of a {@link VoiceChannel}:
 * * AUTO
 * * FULL
 * @typedef {string} VideoQualityMode
 * @see {@link https://discord.com/developers/docs/resources/channel#channel-object-video-quality-modes}
 */
exports.VideoQualityModes = createEnum([null, 'AUTO', 'FULL']);

/**
 * The type of reaction
 * * NORMAL
 * * BURST
 * @typedef {string} ReactionType
 * @see {@link https://discord.com/developers/docs/resources/channel#channel-object-video-quality-modes}
 */
exports.ReactionTypes = createEnum(['NORMAL', 'BURST']);

/**
 * Sort {@link ThreadOnlyChannel} posts by creation time or activity
 * * LATEST_ACTIVITY
 * * CREATION_DATE
 * @typedef {string} SortOrderType
 * @see {@link https://discord.com/developers/docs/resources/channel/#channel-object-sort-order-types}
 */
exports.SortOrderTypes = createEnum([null, 'LATEST_ACTIVITY', 'CREATION_DATE']);

/**
 * The default forum layout to set on the {@link ForumChannel}
 * * NOT_SET
 * * LIST_VIEW
 * * GALLERY_VIEW
 * @typedef {string} ForumLayoutType
 * @see {@link https://discord.com/developers/docs/resources/channel/#channel-object-forum-layout-types}
 */
exports.ForumLayoutTypes = createEnum(['NOT_SET', 'LIST_VIEW', 'GALLERY_VIEW']);

/**
 * Different layouts for {@link MessagePoll} will come in the future. For now though, this value will always be `DEFAULT`.
 * * DEFAULT
 * * IMAGE_ONLY_ANSWERS
 * @typedef {string} PollLayoutType
 * @see {@link https://docs.discord.sex/resources/message#poll-layout-type}
 */
exports.PollLayoutTypes = createEnum([null, 'DEFAULT', 'IMAGE_ONLY_ANSWERS']);

/**
 * The {@link ReadState} type
 * * CHANNEL
 * * GUILD_SCHEDULED_EVENT
 * * NOTIFICATION_CENTER
 * * GUILD_HOME
 * * GUILD_ONBOARDING_QUESTION
 * * MESSAGE_REQUESTS
 * @typedef {string} ReadStateType
 */
exports.ReadStateTypes = createEnum([
  'CHANNEL',
  'GUILD_SCHEDULED_EVENT',
  'NOTIFICATION_CENTER',
  'GUILD_HOME',
  'GUILD_ONBOARDING_QUESTION',
  'MESSAGE_REQUESTS',
]);

/**
 * Relationship Enums:
 * * 0: NONE
 * * 1: FRIEND
 * * 2: BLOCKED
 * * 3: PENDING_INCOMING
 * * 4: PENDING_OUTGOING
 * * 5: IMPLICIT
 * @typedef {string} RelationshipType
 * @see {@link https://luna.gitlab.io/discord-unofficial-docs/relationships.html}
 */

exports.RelationshipTypes = createEnum([
  'NONE',
  'FRIEND',
  'BLOCKED',
  'PENDING_INCOMING',
  'PENDING_OUTGOING',
  'IMPLICIT',
]);

exports._cleanupSymbol = Symbol('djsCleanup');

function keyMirror(arr) {
  let tmp = Object.create(null);
  for (const value of arr) tmp[value] = value;
  return tmp;
}

function createEnum(keys) {
  const obj = {};
  for (const [index, key] of keys.entries()) {
    if (key === null) continue;
    obj[key] = index;
    obj[index] = key;
  }
  return obj;
}

/**
 * @typedef {Object} Constants Constants that can be used in an enum or object-like way.
 * @property {Object<ActivityType, number>} ActivityTypes The type of an activity of a users presence.
 * @property {Object<APIError, number>} APIErrors An error encountered while performing an API request.
 * @property {Object<ApplicationCommandOptionType, number>} ApplicationCommandOptionTypes
 * The type of an {@link ApplicationCommandOption} object.
 * @property {Object<ApplicationCommandPermissionType, number>} ApplicationCommandPermissionTypes
 * The type of an {@link ApplicationCommandPermissions} object.
 * @property {Object<ApplicationCommandType, number>} ApplicationCommandTypes
 * The type of an {@link ApplicationCommand} object.
 * @property {Object<ApplicationRoleConnectionMetadataType, number>} ApplicationRoleConnectionMetadataTypes
 * The type of an {@link ApplicationRoleConnectionMetadata} object.
 * @property {Object<AutoModerationActionType, number>} AutoModerationActionTypes
 * A type of an action which executes whenever a rule is triggered.
 * @property {Object<AutoModerationRuleEventType, number>} AutoModerationRuleEventTypes Indicates in what event context
 * a rule should be checked.
 * @property {Object<AutoModerationRuleKeywordPresetType, number>} AutoModerationRuleKeywordPresetTypes
 * The internally pre-defined wordsetswhich will be searched for in content
 * @property {Object<AutoModerationRuleTriggerType, number>} AutoModerationRuleTriggerTypes Characterizes the type
 * of content which can trigger the rule.
 * @property {Object<ChannelType, number>} ChannelTypes All available channel types.
 * @property {ClientApplicationAssetTypes} ClientApplicationAssetTypes The types of an {@link ApplicationAsset} object.
 * @property {Object<Color, number>} Colors An object with regularly used colors.
 * @property {Object<DefaultMessageNotificationLevel, number>} DefaultMessageNotificationLevels
 * The value set for a guilds default message notifications.
 * @property {Endpoints} Endpoints Object containing functions that return certain endpoints on the API.
 * @property {Events} Events The types of events emitted by the Client.
 * @property {Object<ExplicitContentFilterLevel, number>} ExplicitContentFilterLevels
 * The value set for the explicit content filter levels for a guild.
 * @property {Object<GuildScheduledEventEntityType, number>} GuildScheduledEventEntityTypes
 * The entity type of a {@link GuildScheduledEvent} object.
 * @property {Object<GuildScheduledEventPrivacyLevel, number>} GuildScheduledEventPrivacyLevels
 * Privacy level of a {@link GuildScheduledEvent} object.
 * @property {Object<GuildScheduledEventStatus, number>} GuildScheduledEventStatuses
 * The status of a {@link GuildScheduledEvent} object.
 * @property {Object<IntegrationExpireBehavior, number>} IntegrationExpireBehaviors
 * The behavior of expiring subscribers for Integrations.
 * @property {Object<InteractionResponseType, number>} InteractionResponseTypes The type of an interaction response.
 * @property {Object<InteractionType, number>} InteractionTypes The type of an {@link Interaction} object.
 * @property {InviteScope[]} InviteScopes The scopes of an invite.
 * @property {Object<RelationshipType, number>} RelationshipTypes Relationship Enums
 * @property {Object<MembershipState, number>} MembershipStates The value set for a team members membership state.
 * @property {Object<MessageButtonStyle, number>} MessageButtonStyles The style of a message button.
 * @property {Object<MessageComponentType, number>} MessageComponentTypes The type of a message component.
 * @property {MessageType[]} MessageTypes The type of a {@link Message} object.
 * @property {Object<MFALevel, number>} MFALevels The required MFA level for a guild.
 * @property {Object<NSFWLevel, number>} NSFWLevels NSFW level of a guild.
 * @property {Opcodes} Opcodes The types of Opcodes sent to the Gateway.
 * @property {Object<OverwriteType, number>} OverwriteTypes An overwrite type.
 * @property {Object} Package The package.json of the library.
 * @property {Object<PartialType, PartialType>} PartialTypes The type of Structure allowed to be a partial.
 * @property {Object<PremiumTier, number>} PremiumTiers The premium tier (Server Boost level) of a guild.
 * @property {Object<PrivacyLevel, number>} PrivacyLevels Privacy level of a {@link StageInstance} object.
 * @property {ShardEvents} ShardEvents The type of events emitted by a Shard.
 * @property {Status} Status The available statuses of the client.
 * @property {Object<SelectMenuComponentType, number>} SelectMenuComponentTypes The type of any select menu.
 * @property {Object<StickerFormatType, number>} StickerFormatTypes The value set for a stickers format type.
 * @property {Object<StickerType, number>} StickerTypes The value set for a stickers type.
 * @property {SweeperKey[]} SweeperKeys The name of an item to be swept in Sweepers.
 * @property {SystemMessageType[]} SystemMessageTypes The types of messages that are `System`.
 * @property {Object<TextInputStyle, number>} TextInputStyles The style of a text input component.
 * @property {ThreadChannelTypes[]} ThreadChannelTypes The type of a {@link ThreadChannel} object.
 * @property {string} UserAgent The user agent used for requests.
 * @property {Object<VerificationLevel, number>} VerificationLevels
 * The value set for the verification levels for a guild.
 * @property {Object<VideoQualityMode, number>} VideoQualityModes
 * The camera video quality mode for a {@link VoiceChannel}.
 * @property {Object<WebhookType, number>} WebhookTypes The value set for a webhooks type.
 * @property {WSCodes} WSCodes The types of WebSocket error codes.
 * @property {Object<WSEventType, WSEventType>} WSEvents The type of a WebSocket message event.
 */
