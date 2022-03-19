'use strict';

const process = require('node:process');
const { ChannelType, MessageType } = require('discord-api-types/v9');
const Package = (exports.Package = require('../../package.json'));

exports.UserAgent = `Mozilla/5.0 (iPhone; CPU iPhone OS 15_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/90.0.4430.78 Mobile/15E148 Safari/604.1`;

/**
 * The name of an item to be swept in Sweepers
 * * `applicationCommands` - both global and guild commands
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
 * The types of messages that are not `System`. The available types are:
 * * {@link MessageType.Default}
 * * {@link MessageType.Reply}
 * * {@link MessageType.ChatInputCommand}
 * * {@link MessageType.ContextMenuCommand}
 * @typedef {MessageType[]} NonSystemMessageTypes
 */
exports.NonSystemMessageTypes = [
  MessageType.Default,
  MessageType.Reply,
  MessageType.ChatInputCommand,
  MessageType.ContextMenuCommand,
];

/**
 * The channels that are text-based.
 * * DMChannel
 * * TextChannel
 * * NewsChannel
 * * ThreadChannel
 * @typedef {DMChannel|TextChannel|NewsChannel|ThreadChannel} TextBasedChannels
 */

/**
 * The types of channels that are text-based. The available types are:
 * * {@link ChannelType.DM}
 * * {@link ChannelType.GuildText}
 * * {@link ChannelType.GuildNews}
 * * {@link ChannelType.GuildNewsThread}
 * * {@link ChannelType.GuildPublicThread}
 * * {@link ChannelType.GuildPrivateThread}
 * @typedef {ChannelType} TextBasedChannelTypes
 */
exports.TextBasedChannelTypes = [
  ChannelType.DM,
  ChannelType.GuildText,
  ChannelType.GuildNews,
  ChannelType.GuildNewsThread,
  ChannelType.GuildPublicThread,
  ChannelType.GuildPrivateThread,
];

/**
 * The types of channels that are threads. The available types are:
 * * {@link ChannelType.GuildNewsThread}
 * * {@link ChannelType.GuildPublicThread}
 * * {@link ChannelType.GuildPrivateThread}
 * @typedef {ChannelType[]} ThreadChannelTypes
 */
exports.ThreadChannelTypes = [
  ChannelType.GuildNewsThread,
  ChannelType.GuildPublicThread,
  ChannelType.GuildPrivateThread,
];

/**
 * The types of channels that are voice-based. The available types are:
 * * {@link ChannelType.GuildVoice}
 * * {@link ChannelType.GuildStageVoice}
 * @typedef {ChannelType[]} VoiceBasedChannelTypes
 */
exports.VoiceBasedChannelTypes = [ChannelType.GuildVoice, ChannelType.GuildStageVoice];

/* eslint-enable max-len */

/**
 * @typedef {Object} Constants Constants that can be used in an enum or object-like way.
 * @property {Status} Status The available statuses of the client.
 */


exports.Events = {
  RATE_LIMIT: 'rateLimit',
  INVALID_REQUEST_WARNING: 'invalidRequestWarning',
  API_RESPONSE: 'apiResponse',
  API_REQUEST: 'apiRequest',
  CLIENT_READY: 'ready',
  /**
   * @deprecated See {@link https://github.com/discord/discord-api-docs/issues/3690 this issue} for more information.
   */
  APPLICATION_COMMAND_CREATE: 'applicationCommandCreate',
  /**
   * @deprecated See {@link https://github.com/discord/discord-api-docs/issues/3690 this issue} for more information.
   */
  APPLICATION_COMMAND_DELETE: 'applicationCommandDelete',
  /**
   * @deprecated See {@link https://github.com/discord/discord-api-docs/issues/3690 this issue} for more information.
   */
  APPLICATION_COMMAND_UPDATE: 'applicationCommandUpdate',
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
  INTERACTION_CREATE: 'interactionCreate',
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
};

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

// https://discord.com/developers/docs/reference#image-formatting-cdn-endpoints
exports.Endpoints = {
  CDN(root) {
    return {
      Emoji: (emojiId, format = 'webp') => `${root}/emojis/${emojiId}.${format}`,
      Asset: name => `${root}/assets/${name}`,
      DefaultAvatar: discriminator => `${root}/embed/avatars/${discriminator}.png`,
      Avatar: (userId, hash, format, size, dynamic = false) => {
        if (dynamic && hash.startsWith('a_')) format = 'gif';
        return makeImageUrl(`${root}/avatars/${userId}/${hash}`, { format, size });
      },
      GuildMemberAvatar: (guildId, memberId, hash, format = 'webp', size, dynamic = false) => {
        if (dynamic && hash.startsWith('a_')) format = 'gif';
        return makeImageUrl(`${root}/guilds/${guildId}/users/${memberId}/avatars/${hash}`, { format, size });
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
        `${root}/stickers/${stickerId}.${stickerFormat === 'LOTTIE' ? 'json' : 'png'}`,
      RoleIcon: (roleId, hash, format = 'webp', size) =>
        makeImageUrl(`${root}/role-icons/${roleId}/${hash}`, { size, format }),
    };
  },
  invite: (root, code, eventId) => (eventId ? `${root}/${code}?event=${eventId}` : `${root}/${code}`),
  scheduledEvent: (root, guildId, eventId) => `${root}/${guildId}/${eventId}`,
  botGateway: '/gateway/bot',
};