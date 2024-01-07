'use strict';

/* eslint-disable import/order */
const InteractionManager = require('../../managers/InteractionManager');
const MessageCollector = require('../MessageCollector');
const MessagePayload = require('../MessagePayload');
const SnowflakeUtil = require('../../util/SnowflakeUtil');
const { Collection } = require('@discordjs/collection');
const { InteractionTypes, MaxBulkDeletableMessageAge } = require('../../util/Constants');
const { TypeError, Error } = require('../../errors');
const InteractionCollector = require('../InteractionCollector');
const { lazy, getAttachments, uploadFile } = require('../../util/Util');
const Message = lazy(() => require('../Message').Message);
const { s } = require('@sapphire/shapeshift');
const validateName = stringName =>
  s.string
    .lengthGreaterThanOrEqual(1)
    .lengthLessThanOrEqual(32)
    .regex(/^[\p{Ll}\p{Lm}\p{Lo}\p{N}\p{sc=Devanagari}\p{sc=Thai}_-]+$/u)
    .setValidationEnabled(true)
    .parse(stringName);

/**
 * Interface for classes that have text-channel-like features.
 * @interface
 */
class TextBasedChannel {
  constructor() {
    /**
     * A manager of the messages sent to this channel
     * @type {MessageManager}
     */
    this.messages = new MessageManager(this);

    /**
     * A manager of the interactions sent to this channel
     * @type {InteractionManager}
     */
    this.interactions = new InteractionManager(this);

    /**
     * The channel's last message id, if one was sent
     * @type {?Snowflake}
     */
    this.lastMessageId = null;

    /**
     * The timestamp when the last pinned message was pinned, if there was one
     * @type {?number}
     */
    this.lastPinTimestamp = null;
  }

  /**
   * The Message object of the last message in the channel, if one was sent
   * @type {?Message}
   * @readonly
   */
  get lastMessage() {
    return this.messages.resolve(this.lastMessageId);
  }

  /**
   * The date when the last pinned message was pinned, if there was one
   * @type {?Date}
   * @readonly
   */
  get lastPinAt() {
    return this.lastPinTimestamp ? new Date(this.lastPinTimestamp) : null;
  }

  /**
   * Base options provided when sending.
   * @typedef {Object} BaseMessageOptions
   * @property {MessageActivity} [activity] Group activity
   * @property {boolean} [tts=false] Whether or not the message should be spoken aloud
   * @property {string} [nonce=''] The nonce for the message
   * @property {string} [content=''] The content for the message
   * @property {Array<(MessageEmbed|APIEmbed|WebEmbed)>} [embeds] The embeds for the message
   * (see [here](https://discord.com/developers/docs/resources/channel#embed-object) for more details)
   * @property {MessageMentionOptions} [allowedMentions] Which mentions should be parsed from the message content
   * (see [here](https://discord.com/developers/docs/resources/channel#allowed-mentions-object) for more details)
   * @property {Array<(FileOptions|BufferResolvable|MessageAttachment[])>} [files] Files to send with the message
   * @property {Array<(MessageActionRow|MessageActionRowOptions)>} [components]
   * Action rows containing interactive components for the message (buttons, select menus)
   * @property {MessageAttachment[]} [attachments] Attachments to send in the message
   * @property {boolean} [usingNewAttachmentAPI] Whether to use the new attachment API (`channels/:id/attachments`)
   */

  /**
   * Options provided when sending or editing a message.
   * @typedef {BaseMessageOptions} MessageOptions
   * @property {ReplyOptions} [reply] The options for replying to a message
   * @property {StickerResolvable[]} [stickers=[]] Stickers to send in the message
   * @property {MessageFlags} [flags] Which flags to set for the message.
   * Only `SUPPRESS_EMBEDS`, `SUPPRESS_NOTIFICATIONS` and `IS_VOICE_MESSAGE` can be set.
   */

  /**
   * Options provided to control parsing of mentions by Discord
   * @typedef {Object} MessageMentionOptions
   * @property {MessageMentionTypes[]} [parse] Types of mentions to be parsed
   * @property {Snowflake[]} [users] Snowflakes of Users to be parsed as mentions
   * @property {Snowflake[]} [roles] Snowflakes of Roles to be parsed as mentions
   * @property {boolean} [repliedUser=true] Whether the author of the Message being replied to should be pinged
   */

  /**
   * Types of mentions to enable in MessageMentionOptions.
   * - `roles`
   * - `users`
   * - `everyone`
   * @typedef {string} MessageMentionTypes
   */

  /**
   * @typedef {Object} FileOptions
   * @property {BufferResolvable} attachment File to attach
   * @property {string} [name='file.jpg'] Filename of the attachment
   * @property {string} description The description of the file
   */

  /**
   * Options for sending a message with a reply.
   * @typedef {Object} ReplyOptions
   * @property {MessageResolvable} messageReference The message to reply to (must be in the same channel and not system)
   * @property {boolean} [failIfNotExists=true] Whether to error if the referenced message
   * does not exist (creates a standard message in this case when false)
   */

  /**
   * Sends a message to this channel.
   * @param {string|MessagePayload|MessageOptions} options The options to provide
   * @returns {Promise<Message>}
   * @example
   * // Send a basic message
   * channel.send('hello!')
   *   .then(message => console.log(`Sent message: ${message.content}`))
   *   .catch(console.error);
   * @example
   * // Send a remote file
   * channel.send({
   *   files: ['https://cdn.discordapp.com/icons/222078108977594368/6e1019b3179d71046e463a75915e7244.png?size=2048']
   * })
   *   .then(console.log)
   *   .catch(console.error);
   * @example
   * // Send a local file
   * channel.send({
   *   files: [{
   *     attachment: 'entire/path/to/file.jpg',
   *     name: 'file.jpg',
   *     description: 'A description of the file'
   *   }]
   * })
   *   .then(console.log)
   *   .catch(console.error);
   */
  async send(options) {
    const User = require('../User');
    const { GuildMember } = require('../GuildMember');

    if (this instanceof User || this instanceof GuildMember) {
      const dm = await this.createDM();
      return dm.send(options);
    }

    let messagePayload;

    if (options instanceof MessagePayload) {
      messagePayload = await options.resolveData();
    } else {
      messagePayload = await MessagePayload.create(this, options).resolveData();
    }

    let { data, files } = await messagePayload.resolveFiles();

    if (typeof options == 'object' && typeof options.usingNewAttachmentAPI !== 'boolean') {
      options.usingNewAttachmentAPI = this.client.options.usingNewAttachmentAPI;
    }

    if (options?.usingNewAttachmentAPI === true) {
      const attachments = await getAttachments(this.client, this.id, ...files);
      const requestPromises = attachments.map(async attachment => {
        await uploadFile(files[attachment.id].file, attachment.upload_url);
        return {
          id: attachment.id,
          filename: files[attachment.id].name,
          uploaded_filename: attachment.upload_filename,
          description: files[attachment.id].description,
          duration_secs: files[attachment.id].duration_secs,
          waveform: files[attachment.id].waveform,
        };
      });
      const attachmentsData = await Promise.all(requestPromises);
      attachmentsData.sort((a, b) => parseInt(a.id) - parseInt(b.id));
      data.attachments = attachmentsData;
      files = [];
    }

    const d = await this.client.api.channels[this.id].messages.post({ data, files });

    return this.messages.cache.get(d.id) ?? this.messages._add(d);
  }

  /**
   * Sends a typing indicator in the channel.
   * @returns {Promise<void>} Resolves upon the typing status being sent
   * @example
   * // Start typing in a channel
   * channel.sendTyping();
   */
  async sendTyping() {
    await this.client.api.channels(this.id).typing.post();
  }

  /**
   * Creates a Message Collector.
   * @param {MessageCollectorOptions} [options={}] The options to pass to the collector
   * @returns {MessageCollector}
   * @example
   * // Create a message collector
   * const filter = m => m.content.includes('discord');
   * const collector = channel.createMessageCollector({ filter, time: 15_000 });
   * collector.on('collect', m => console.log(`Collected ${m.content}`));
   * collector.on('end', collected => console.log(`Collected ${collected.size} items`));
   */
  createMessageCollector(options = {}) {
    return new MessageCollector(this, options);
  }

  /**
   * An object containing the same properties as CollectorOptions, but a few more:
   * @typedef {MessageCollectorOptions} AwaitMessagesOptions
   * @property {string[]} [errors] Stop/end reasons that cause the promise to reject
   */

  /**
   * Similar to createMessageCollector but in promise form.
   * Resolves with a collection of messages that pass the specified filter.
   * @param {AwaitMessagesOptions} [options={}] Optional options to pass to the internal collector
   * @returns {Promise<Collection<Snowflake, Message>>}
   * @example
   * // Await !vote messages
   * const filter = m => m.content.startsWith('!vote');
   * // Errors: ['time'] treats ending because of the time limit as an error
   * channel.awaitMessages({ filter, max: 4, time: 60_000, errors: ['time'] })
   *   .then(collected => console.log(collected.size))
   *   .catch(collected => console.log(`After a minute, only ${collected.size} out of 4 voted.`));
   */
  awaitMessages(options = {}) {
    return new Promise((resolve, reject) => {
      const collector = this.createMessageCollector(options);
      collector.once('end', (collection, reason) => {
        if (options.errors?.includes(reason)) {
          reject(collection);
        } else {
          resolve(collection);
        }
      });
    });
  }

  /**
   * Creates a component interaction collector.
   * @param {MessageComponentCollectorOptions} [options={}] Options to send to the collector
   * @returns {InteractionCollector}
   * @example
   * // Create a button interaction collector
   * const filter = (interaction) => interaction.customId === 'button' && interaction.user.id === 'someId';
   * const collector = channel.createMessageComponentCollector({ filter, time: 15_000 });
   * collector.on('collect', i => console.log(`Collected ${i.customId}`));
   * collector.on('end', collected => console.log(`Collected ${collected.size} items`));
   */
  createMessageComponentCollector(options = {}) {
    return new InteractionCollector(this.client, {
      ...options,
      interactionType: InteractionTypes.MESSAGE_COMPONENT,
      channel: this,
    });
  }

  /**
   * Collects a single component interaction that passes the filter.
   * The Promise will reject if the time expires.
   * @param {AwaitMessageComponentOptions} [options={}] Options to pass to the internal collector
   * @returns {Promise<MessageComponentInteraction>}
   * @example
   * // Collect a message component interaction
   * const filter = (interaction) => interaction.customId === 'button' && interaction.user.id === 'someId';
   * channel.awaitMessageComponent({ filter, time: 15_000 })
   *   .then(interaction => console.log(`${interaction.customId} was clicked!`))
   *   .catch(console.error);
   */
  awaitMessageComponent(options = {}) {
    const _options = { ...options, max: 1 };
    return new Promise((resolve, reject) => {
      const collector = this.createMessageComponentCollector(_options);
      collector.once('end', (interactions, reason) => {
        const interaction = interactions.first();
        if (interaction) resolve(interaction);
        else reject(new Error('INTERACTION_COLLECTOR_ERROR', reason));
      });
    });
  }

  /**
   * Bulk deletes given messages that are newer than two weeks.
   * @param {Collection<Snowflake, Message>|MessageResolvable[]|number} messages
   * Messages or number of messages to delete
   * @param {boolean} [filterOld=false] Filter messages to remove those which are older than two weeks automatically
   * @returns {Promise<Collection<Snowflake, Message|undefined>>} Returns the deleted messages
   * @example
   * // Bulk delete messages
   * channel.bulkDelete(5)
   *   .then(messages => console.log(`Bulk deleted ${messages.size} messages`))
   *   .catch(console.error);
   */
  async bulkDelete(messages, filterOld = false) {
    if (!this.client.user.bot) throw new Error('INVALID_USER_METHOD');
    if (Array.isArray(messages) || messages instanceof Collection) {
      let messageIds = messages instanceof Collection ? [...messages.keys()] : messages.map(m => m.id ?? m);
      if (filterOld) {
        messageIds = messageIds.filter(id => Date.now() - SnowflakeUtil.timestampFrom(id) < MaxBulkDeletableMessageAge);
      }
      if (messageIds.length === 0) return new Collection();
      if (messageIds.length === 1) {
        await this.client.api.channels(this.id).messages(messageIds[0]).delete();
        const message = this.client.actions.MessageDelete.getMessage(
          {
            message_id: messageIds[0],
          },
          this,
        );
        return message ? new Collection([[message.id, message]]) : new Collection();
      }
      await this.client.api.channels[this.id].messages['bulk-delete'].post({ data: { messages: messageIds } });
      return messageIds.reduce(
        (col, id) =>
          col.set(
            id,
            this.client.actions.MessageDeleteBulk.getMessage(
              {
                message_id: id,
              },
              this,
            ),
          ),
        new Collection(),
      );
    }
    if (!isNaN(messages)) {
      const msgs = await this.messages.fetch({ limit: messages });
      return this.bulkDelete(msgs, filterOld);
    }
    throw new TypeError('MESSAGE_BULK_DELETE_TYPE');
  }

  /**
   * Fetches all webhooks for the channel.
   * @returns {Promise<Collection<Snowflake, Webhook>>}
   * @example
   * // Fetch webhooks
   * channel.fetchWebhooks()
   *   .then(hooks => console.log(`This channel has ${hooks.size} hooks`))
   *   .catch(console.error);
   */
  fetchWebhooks() {
    return this.guild.channels.fetchWebhooks(this.id);
  }

  /**
   * Options used to create a {@link Webhook} in a guild text-based channel.
   * @typedef {Object} ChannelWebhookCreateOptions
   * @property {?(BufferResolvable|Base64Resolvable)} [avatar] Avatar for the webhook
   * @property {string} [reason] Reason for creating the webhook
   */

  /**
   * Creates a webhook for the channel.
   * @param {string} name The name of the webhook
   * @param {ChannelWebhookCreateOptions} [options] Options for creating the webhook
   * @returns {Promise<Webhook>} Returns the created Webhook
   * @example
   * // Create a webhook for the current channel
   * channel.createWebhook('Snek', {
   *   avatar: 'https://i.imgur.com/mI8XcpG.jpg',
   *   reason: 'Needed a cool new Webhook'
   * })
   *   .then(console.log)
   *   .catch(console.error)
   */
  createWebhook(name, options = {}) {
    return this.guild.channels.createWebhook(this.id, name, options);
  }

  /**
   * Sets the rate limit per user (slowmode) for this channel.
   * @param {number} rateLimitPerUser The new rate limit in seconds
   * @param {string} [reason] Reason for changing the channel's rate limit
   * @returns {Promise<this>}
   */
  setRateLimitPerUser(rateLimitPerUser, reason) {
    return this.edit({ rateLimitPerUser }, reason);
  }

  /**
   * Sets whether this channel is flagged as NSFW.
   * @param {boolean} [nsfw=true] Whether the channel should be considered NSFW
   * @param {string} [reason] Reason for changing the channel's NSFW flag
   * @returns {Promise<this>}
   */
  setNSFW(nsfw = true, reason) {
    return this.edit({ nsfw }, reason);
  }

  /**
   * Search Slash Command (return raw data)
   * @param {Snowflake} applicationId Application ID
   * @param {?ApplicationCommandType} type Command Type
   * @returns {Object}
   */
  searchInteraction(applicationId, type = 'CHAT_INPUT') {
    switch (type) {
      case 'USER':
      case 2:
        type = 2;
        break;
      case 'MESSAGE':
      case 3:
        type = 3;
        break;
      default:
        type = 1;
        break;
    }
    return this.client.api.channels[this.id]['application-commands'].search.get({
      query: {
        type,
        application_id: applicationId,
      },
    });
  }

  /**
   * Send Slash to this channel
   * @param {UserResolvable} bot Bot user (BotID, not applicationID)
   * @param {string} commandString Command name (and sub / group formats)
   * @param {...?any|any[]} args Command arguments
   * @returns {Promise<InteractionResponse>}
   * @example
   * // Send a basic slash
   * channel.sendSlash('botid', 'ping')
   *   .then(console.log)
   *   .catch(console.error);
   * @example
   * // Send a remote file
   * channel.sendSlash('botid', 'emoji upload', 'https://cdn.discordapp.com/icons/222078108977594368/6e1019b3179d71046e463a75915e7244.png?size=2048', 'test')
   *   .then(console.log)
   *   .catch(console.error);
   * @see {@link https://github.com/aiko-chan-ai/discord.js-selfbot-v13/blob/main/Document/SlashCommand.md}
   */
  async sendSlash(bot, commandString, ...args) {
    const perms =
      this.type != 'DM'
        ? this.permissionsFor(this.client.user).toArray()
        : ['USE_APPLICATION_COMMANDS', `${this.recipient.relationships == 'BLOCKED' ? '' : 'SEND_MESSAGES'}`];
    if (!perms.includes('SEND_MESSAGES')) {
      throw new Error(
        'INTERACTION_SEND_FAILURE',
        `Cannot send Slash to ${this.toString()} ${
          this.recipient ? 'because bot has been blocked' : 'due to missing SEND_MESSAGES permission'
        }`,
      );
    }
    if (!perms.includes('USE_APPLICATION_COMMANDS')) {
      throw new Error(
        'INTERACTION_SEND_FAILURE',
        `Cannot send Slash to ${this.toString()} due to missing USE_APPLICATION_COMMANDS permission`,
      );
    }
    args = args.flat(2);
    const cmd = commandString.trim().split(' ');
    // Validate CommandName
    const commandName = validateName(cmd[0]);
    const sub = cmd.slice(1);
    for (let i = 0; i < sub.length; i++) {
      if (sub.length > 2) {
        throw new Error('INVALID_COMMAND_NAME', cmd);
      }
      validateName(sub[i]);
    }
    if (!bot) throw new Error('MUST_SPECIFY_BOT');
    const botId = this.client.users.resolveId(bot);
    const user = await this.client.users.fetch(botId).catch(() => {});
    if (!user || !user.bot || !user.application) {
      throw new Error('botId is not a bot or does not have an application slash command');
    }
    if (user._partial) await user.getProfile().catch(() => {});
    if (!commandName || typeof commandName !== 'string') throw new Error('Command name is required');
    const data = await this.searchInteraction(user.application?.id ?? user.id, 'CHAT_INPUT');
    for (const command of data.application_commands) {
      if (user.id == command.application_id || user.application.id == command.application_id) {
        user.application?.commands?._add(command, true);
      }
    }
    // Remove
    const commandTarget = user.application?.commands?.cache.find(
      c => c.name === commandName && c.type === 'CHAT_INPUT',
    );
    if (!commandTarget) {
      throw new Error(
        'INTERACTION_SEND_FAILURE',
        `SlashCommand ${commandName} is not found (With search)\nDebug:\n+ botId: ${botId} (ApplicationId: ${
          user.application?.id
        })\n+ args: ${args.join(' | ') || null}`,
      );
    }
    return commandTarget.sendSlashCommand(
      new (Message())(this.client, {
        channel_id: this.id,
        guild_id: this.guild?.id || null,
        author: this.client.user,
        content: '',
        id: this.client.user.id,
      }),
      sub && sub.length > 0 ? sub : [],
      args && args.length ? args : [],
    );
  }

  static applyToClass(structure, full = false, ignore = []) {
    const props = ['send'];
    if (full) {
      props.push(
        'lastMessage',
        'lastPinAt',
        'bulkDelete',
        'sendTyping',
        'createMessageCollector',
        'awaitMessages',
        'createMessageComponentCollector',
        'awaitMessageComponent',
        'fetchWebhooks',
        'createWebhook',
        'setRateLimitPerUser',
        'setNSFW',
        'sendSlash',
        'searchInteraction',
      );
    }
    for (const prop of props) {
      if (ignore.includes(prop)) continue;
      Object.defineProperty(
        structure.prototype,
        prop,
        Object.getOwnPropertyDescriptor(TextBasedChannel.prototype, prop),
      );
    }
  }
}

module.exports = TextBasedChannel;

// Fixes Circular
const MessageManager = require('../../managers/MessageManager');
