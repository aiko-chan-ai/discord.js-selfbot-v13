'use strict';

const { register } = require('./DJSError');

const Messages = {
  CLIENT_INVALID_OPTION: (prop, must) => `The ${prop} option must be ${must}`,
  CLIENT_INVALID_PROVIDED_SHARDS: 'None of the provided shards were valid.',
  CLIENT_MISSING_INTENTS: 'Valid intents must be provided for the Client.',
  CLIENT_NOT_READY: action => `The client needs to be logged in to ${action}.`,

  TOKEN_INVALID: 'An invalid token was provided.',
  TOKEN_MISSING: 'Request to use token, but token was unavailable to the client.',
  TOTPKEY_MISSING: 'Request to use mfa, but TOTPKey was not set in client options.',

  WS_CLOSE_REQUESTED: 'WebSocket closed due to user request.',
  WS_CONNECTION_EXISTS: 'There is already an existing WebSocket connection.',
  WS_NOT_OPEN: (data = 'data') => `WebSocket not open to send ${data}`,
  MANAGER_DESTROYED: 'Manager was destroyed.',

  BITFIELD_INVALID: bit => `Invalid bitfield flag or number: ${bit}.`,

  SHARDING_INVALID: '[Bot Token] Invalid shard settings were provided.',
  SHARDING_REQUIRED: '[Bot Token] This session would have handled too many guilds - Sharding is required.',
  INVALID_INTENTS: '[Bot Token] Invalid intent provided for WebSocket intents.',
  DISALLOWED_INTENTS: '[Bot Token] Privileged intent provided is not enabled or whitelisted.',
  SHARDING_NO_SHARDS: 'No shards have been spawned.',
  SHARDING_IN_PROCESS: 'Shards are still being spawned.',
  SHARDING_INVALID_EVAL_BROADCAST: 'Script to evaluate must be a function',
  SHARDING_SHARD_NOT_FOUND: id => `Shard ${id} could not be found.`,
  SHARDING_ALREADY_SPAWNED: count => `Already spawned ${count} shards.`,
  SHARDING_PROCESS_EXISTS: id => `Shard ${id} already has an active process.`,
  SHARDING_WORKER_EXISTS: id => `Shard ${id} already has an active worker.`,
  SHARDING_READY_TIMEOUT: id => `Shard ${id}'s Client took too long to become ready.`,
  SHARDING_READY_DISCONNECTED: id => `Shard ${id}'s Client disconnected before becoming ready.`,
  SHARDING_READY_DIED: id => `Shard ${id}'s process exited before its Client became ready.`,
  SHARDING_NO_CHILD_EXISTS: id => `Shard ${id} has no active process or worker.`,
  SHARDING_SHARD_MISCALCULATION: (shard, guild, count) =>
    `Calculated invalid shard ${shard} for guild ${guild} with ${count} shards.`,

  COLOR_RANGE: 'Color must be within the range 0 - 16777215 (0xFFFFFF).',
  COLOR_CONVERT: 'Unable to convert color to a number.',

  INVITE_OPTIONS_MISSING_CHANNEL: 'A valid guild channel must be provided when GuildScheduledEvent is EXTERNAL.',

  EMBED_TITLE: 'MessageEmbed title must be a string.',
  EMBED_FIELD_NAME: 'MessageEmbed field names must be non-empty strings.',
  EMBED_FIELD_VALUE: 'MessageEmbed field values must be non-empty strings.',
  EMBED_FOOTER_TEXT: 'MessageEmbed footer text must be a string.',
  EMBED_DESCRIPTION: 'MessageEmbed description must be a string.',
  EMBED_AUTHOR_NAME: 'MessageEmbed author name must be a string.',

  BUTTON_LABEL: 'MessageButton label must be a string',
  BUTTON_URL: 'MessageButton URL must be a string',
  BUTTON_CUSTOM_ID: 'MessageButton customId must be a string',

  SELECT_MENU_CUSTOM_ID: 'MessageSelectMenu customId must be a string',
  SELECT_MENU_PLACEHOLDER: 'MessageSelectMenu placeholder must be a string',
  SELECT_OPTION_LABEL: 'MessageSelectOption label must be a string',
  SELECT_OPTION_VALUE: 'MessageSelectOption value must be a string',
  SELECT_OPTION_DESCRIPTION: 'MessageSelectOption description must be a string',

  TEXT_INPUT_CUSTOM_ID: 'TextInputComponent customId must be a string',
  TEXT_INPUT_LABEL: 'TextInputComponent label must be a string',
  TEXT_INPUT_PLACEHOLDER: 'TextInputComponent placeholder must be a string',
  TEXT_INPUT_VALUE: 'TextInputComponent value must be a string',

  MODAL_CUSTOM_ID: 'Modal customId must be a string',
  MODAL_TITLE: 'Modal title must be a string',

  INTERACTION_COLLECTOR_ERROR: reason => `Collector received no interactions before ending with reason: ${reason}`,

  FILE_NOT_FOUND: file => `File could not be found: ${file}`,

  USER_BANNER_NOT_FETCHED: "You must fetch this user's banner before trying to generate its URL!",
  USER_NO_DM_CHANNEL: 'No DM Channel exists!',

  VOICE_NOT_STAGE_CHANNEL: 'You are only allowed to do this in stage channels.',

  VOICE_STATE_NOT_OWN:
    'You cannot self-deafen/mute/request to speak on VoiceStates that do not belong to the ClientUser.',
  VOICE_STATE_INVALID_TYPE: name => `${name} must be a boolean.`,

  REQ_RESOURCE_TYPE: 'The resource must be a string, Buffer or a valid file stream.',

  IMAGE_FORMAT: format => `Invalid image format: ${format}`,
  IMAGE_SIZE: size => `Invalid image size: ${size}`,

  MESSAGE_BULK_DELETE_TYPE: 'The messages must be an Array, Collection, or number.',
  MESSAGE_NONCE_TYPE: 'Message nonce must be an integer or a string.',
  MESSAGE_CONTENT_TYPE: 'Message content must be a non-empty string.',

  SPLIT_MAX_LEN: 'Chunk exceeds the max length and contains no split characters.',

  BAN_RESOLVE_ID: (ban = false) => `Couldn't resolve the user id to ${ban ? 'ban' : 'unban'}.`,
  FETCH_BAN_RESOLVE_ID: "Couldn't resolve the user id to fetch the ban.",

  PRUNE_DAYS_TYPE: 'Days must be a number',

  GUILD_CHANNEL_RESOLVE: 'Could not resolve channel to a guild channel.',
  GUILD_VOICE_CHANNEL_RESOLVE: 'Could not resolve channel to a guild voice channel.',
  GUILD_CHANNEL_ORPHAN: 'Could not find a parent to this guild channel.',
  GUILD_CHANNEL_UNOWNED: "The fetched channel does not belong to this manager's guild.",
  GUILD_OWNED: 'Guild is owned by the client.',
  GUILD_MEMBERS_TIMEOUT: "Members didn't arrive in time.",
  GUILD_UNCACHED_ME: 'The client user as a member of this guild is uncached.',
  CHANNEL_NOT_CACHED: 'Could not find the channel where this message came from in the cache!',
  STAGE_CHANNEL_RESOLVE: 'Could not resolve channel to a stage channel.',
  GUILD_SCHEDULED_EVENT_RESOLVE: 'Could not resolve the guild scheduled event.',

  INVALID_TYPE: (name, expected, an = false) => `Supplied ${name} is not a${an ? 'n' : ''} ${expected}.`,
  INVALID_ELEMENT: (type, name, elem) => `Supplied ${type} ${name} includes an invalid element: ${elem}`,

  MESSAGE_THREAD_PARENT: 'The message was not sent in a guild text or news channel',
  MESSAGE_EXISTING_THREAD: 'The message already has a thread',
  THREAD_INVITABLE_TYPE: type => `Invitable cannot be edited on ${type}`,

  WEBHOOK_MESSAGE: 'The message was not sent by a webhook.',
  WEBHOOK_TOKEN_UNAVAILABLE: 'This action requires a webhook token, but none is available.',
  WEBHOOK_URL_INVALID: 'The provided webhook URL is not valid.',
  WEBHOOK_APPLICATION: 'This message webhook belongs to an application and cannot be fetched.',
  MESSAGE_REFERENCE_MISSING: 'The message does not reference another message',

  EMOJI_TYPE: 'Emoji must be a string or GuildEmoji/ReactionEmoji',
  EMOJI_MANAGED: 'Emoji is managed and has no Author.',
  MISSING_MANAGE_EMOJIS_AND_STICKERS_PERMISSION: guild =>
    `Client must have Manage Emojis and Stickers permission in guild ${guild} to see emoji authors.`,
  NOT_GUILD_STICKER: 'Sticker is a standard (non-guild) sticker and has no author.',

  REACTION_RESOLVE_USER: "Couldn't resolve the user id to remove from the reaction.",

  VANITY_URL: 'This guild does not have the VANITY_URL feature enabled.',

  INVITE_RESOLVE_CODE: 'Could not resolve the code to fetch the invite.',

  INVITE_NOT_FOUND: 'Could not find the requested invite.',

  DELETE_GROUP_DM_CHANNEL: "Bots don't have access to Group DM Channels and cannot delete them",
  FETCH_GROUP_DM_CHANNEL: "Bots don't have access to Group DM Channels and cannot fetch them",

  MEMBER_FETCH_NONCE_LENGTH: 'Nonce length must not exceed 32 characters.',

  GLOBAL_COMMAND_PERMISSIONS:
    'Permissions for global commands may only be fetched or modified by providing a GuildResolvable ' +
    "or from a guild's application command manager.",
  GUILD_UNCACHED_ROLE_RESOLVE: 'Cannot resolve roles from an arbitrary guild, provide an id instead',

  INTERACTION_ALREADY_REPLIED: 'The reply to this interaction has already been sent or deferred.',
  INTERACTION_NOT_REPLIED: 'The reply to this interaction has not been sent or deferred.',

  COMMAND_INTERACTION_OPTION_NOT_FOUND: name => `Required option "${name}" not found.`,
  COMMAND_INTERACTION_OPTION_TYPE: (name, type, expected) =>
    `Option "${name}" is of type: ${type}; expected ${expected}.`,
  COMMAND_INTERACTION_OPTION_EMPTY: (name, type) =>
    `Required option "${name}" is of type: ${type}; expected a non-empty value.`,
  COMMAND_INTERACTION_OPTION_NO_SUB_COMMAND: 'No subcommand specified for interaction.',
  COMMAND_INTERACTION_OPTION_NO_SUB_COMMAND_GROUP: 'No subcommand group specified for interaction.',
  AUTOCOMPLETE_INTERACTION_OPTION_NO_FOCUSED_OPTION: 'No focused option for autocomplete interaction.',

  MODAL_SUBMIT_INTERACTION_FIELD_NOT_FOUND: customId => `Required field with custom id "${customId}" not found.`,
  MODAL_SUBMIT_INTERACTION_FIELD_TYPE: (customId, type, expected) =>
    `Field with custom id "${customId}" is of type: ${type}; expected ${expected}.`,

  INVITE_MISSING_SCOPES: 'At least one valid scope must be provided for the invite',

  NOT_IMPLEMENTED: (what, name) => `Method ${what} not implemented on ${name}.`,

  SWEEP_FILTER_RETURN: 'The return value of the sweepFilter function was not false or a Function',

  GUILD_FORUM_MESSAGE_REQUIRED: 'You must provide a message to create a guild forum thread',

  // Selfbot
  INVALID_USER_API: 'User accounts cannot use this endpoint',
  INVALID_APPLICATION_COMMAND: id => `Could not find a valid command for this bot: ${id}`,
  INVALID_COMMAND_NAME: allCMD => `Could not parse subGroupCommand and subCommand due to too long: ${allCMD.join(' ')}`,
  INVALID_SLASH_COMMAND_CHOICES: (parentOptions, value) =>
    `${value} is not a valid choice for this option (${parentOptions})`,
  SLASH_COMMAND_REQUIRED_OPTIONS_MISSING: (req, opt) => `Value required (${req}) missing (Options: ${opt})`,
  SLASH_COMMAND_SUB_COMMAND_GROUP_INVALID: n => `${n} is not a valid sub command group`,
  SLASH_COMMAND_SUB_COMMAND_INVALID: n => `${n} is not a valid sub command`,
  INTERACTION_FAILED: 'No responsed from Application',
  USER_NOT_STREAMING: 'User is not streaming',
  BULK_BAN_USERS_OPTION_EMPTY: 'Option "users" array or collection is empty',

  // Djs v12
  VOICE_INVALID_HEARTBEAT: 'Tried to set voice heartbeat but no valid interval was specified.',
  VOICE_USER_MISSING: "Couldn't resolve the user to create stream.",
  VOICE_JOIN_CHANNEL: (full = false) =>
    `You do not have permission to join this voice channel${full ? '; it is full.' : '.'}`,
  VOICE_CONNECTION_TIMEOUT: 'Connection not established within 15 seconds.',
  VOICE_TOKEN_ABSENT: 'Token not provided from voice server packet.',
  VOICE_SESSION_ABSENT: 'Session ID not supplied.',
  VOICE_INVALID_ENDPOINT: 'Invalid endpoint received.',
  VOICE_NO_BROWSER: 'Voice connections are not available in browsers.',
  VOICE_CONNECTION_ATTEMPTS_EXCEEDED: attempts => `Too many connection attempts (${attempts}).`,
  VOICE_JOIN_SOCKET_CLOSED: 'Tried to send join packet, but the WebSocket is not open.',
  VOICE_PLAY_INTERFACE_NO_BROADCAST: 'A broadcast cannot be played in this context.',
  VOICE_PLAY_INTERFACE_BAD_TYPE: 'Unknown stream type',
  VOICE_PRISM_DEMUXERS_NEED_STREAM: 'To play a webm/ogg stream, you need to pass a ReadableStream.',

  VOICE_STATE_UNCACHED_MEMBER: 'The member of this voice state is uncached.',

  UDP_SEND_FAIL: 'Tried to send a UDP packet, but there is no socket available.',
  UDP_ADDRESS_MALFORMED: 'Malformed UDP address or port.',
  UDP_CONNECTION_EXISTS: 'There is already an existing UDP connection.',
  UDP_WRONG_HANDSHAKE: 'Wrong handshake packet for UDP',

  INVALID_VIDEO_CODEC: codecs => `Only these codecs are supported: ${codecs.join(', ')}`,

  STREAM_CONNECTION_READONLY: 'Cannot send data to a read-only stream',
  STREAM_CANNOT_JOIN: 'Cannot join a stream to itself',
  VOICE_USER_NOT_STREAMING: 'User is not streaming',
  POLL_ALREADY_EXPIRED: 'This poll has already expired.',
  METHOD_WARNING:
    'This method is flagged as it may lead to a temporary or permanent account ban. Do not use until further notice.',
};

for (const [name, message] of Object.entries(Messages)) register(name, message);
