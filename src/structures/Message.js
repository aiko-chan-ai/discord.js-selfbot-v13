'use strict';

const process = require('node:process');
const { Collection } = require('@discordjs/collection');
const Base = require('./Base');
const BaseMessageComponent = require('./BaseMessageComponent');
const MessageAttachment = require('./MessageAttachment');
const Embed = require('./MessageEmbed');
const Mentions = require('./MessageMentions');
const MessagePayload = require('./MessagePayload');
const { Poll } = require('./Poll');
const ReactionCollector = require('./ReactionCollector');
const { Sticker } = require('./Sticker');
const Application = require('./interfaces/Application');
const { Error } = require('../errors');
const ReactionManager = require('../managers/ReactionManager');
const {
  InteractionTypes,
  MessageTypes,
  SystemMessageTypes,
  MessageComponentTypes,
  MessageReferenceTypes,
} = require('../util/Constants');
const MessageFlags = require('../util/MessageFlags');
const Permissions = require('../util/Permissions');
const SnowflakeUtil = require('../util/SnowflakeUtil');
const Util = require('../util/Util');

/**
 * @type {WeakSet<Message>}
 * @private
 * @internal
 */
const deletedMessages = new WeakSet();
let deprecationEmittedForDeleted = false;

/**
 * Represents a message on Discord.
 * @extends {Base}
 */
class Message extends Base {
  constructor(client, data) {
    super(client);

    /**
     * The id of the channel the message was sent in
     * @type {Snowflake}
     */
    this.channelId = data.channel_id;

    /**
     * The id of the guild the message was sent in, if any
     * @type {?Snowflake}
     */
    this.guildId = data.guild_id ?? this.channel?.guild?.id ?? null;

    this._patch(data);
  }

  _patch(data) {
    /**
     * The message's id
     * @type {Snowflake}
     */
    this.id = data.id;

    if ('position' in data) {
      /**
       * A generally increasing integer (there may be gaps or duplicates) that represents
       * the approximate position of the message in a thread.
       * @type {?number}
       */
      this.position = data.position;
    } else {
      this.position ??= null;
    }

    /**
     * The timestamp the message was sent at
     * @type {number}
     */
    this.createdTimestamp = this.id ? SnowflakeUtil.timestampFrom(this.id) : new Date(data.timestamp).getTime();

    if ('type' in data) {
      /**
       * The type of the message
       * @type {?MessageType}
       */
      this.type = MessageTypes[data.type];

      /**
       * Whether or not this message was sent by Discord, not actually a user (e.g. pin notifications)
       * @type {?boolean}
       */
      this.system = SystemMessageTypes.includes(this.type);
    } else {
      this.system ??= null;
      this.type ??= null;
    }

    if ('content' in data) {
      /**
       * The content of the message
       * @type {?string}
       */
      this.content = data.content;
    } else {
      this.content ??= null;
    }

    if ('author' in data) {
      /**
       * The author of the message
       * @type {?User}
       */
      this.author = this.client.users._add(data.author, !data.webhook_id);
    } else {
      this.author ??= null;
    }

    if ('pinned' in data) {
      /**
       * Whether or not this message is pinned
       * @type {?boolean}
       */
      this.pinned = Boolean(data.pinned);
    } else {
      this.pinned ??= null;
    }

    if ('tts' in data) {
      /**
       * Whether or not the message was Text-To-Speech
       * @type {?boolean}
       */
      this.tts = data.tts;
    } else {
      this.tts ??= null;
    }

    if ('nonce' in data) {
      /**
       * A random number or string used for checking message delivery
       * <warn>This is only received after the message was sent successfully, and
       * lost if re-fetched</warn>
       * @type {?string}
       */
      this.nonce = data.nonce;
    } else {
      this.nonce ??= null;
    }

    if ('embeds' in data) {
      /**
       * A list of embeds in the message - e.g. YouTube Player
       * @type {MessageEmbed[]}
       */
      this.embeds = data.embeds.map(e => new Embed(e, true));
    } else {
      this.embeds = this.embeds?.slice() ?? [];
    }

    /**
     * @typedef {MessageActionRow|ContainerComponent|FileComponent|MediaGalleryComponent|SectionComponent|SeparatorComponent|TextDisplayComponent} TopLevelComponent
     */

    if ('components' in data) {
      /**
       * An array of components in the message
       * @type {TopLevelComponent[]}
       */
      this.components = data.components.map(c => BaseMessageComponent.create(c, this.client));
    } else {
      this.components = this.components?.slice() ?? [];
    }

    if ('attachments' in data) {
      /**
       * A collection of attachments in the message - e.g. Pictures - mapped by their ids
       * @type {Collection<Snowflake, MessageAttachment>}
       */
      this.attachments = new Collection();
      if (data.attachments) {
        for (const attachment of data.attachments) {
          this.attachments.set(attachment.id, new MessageAttachment(attachment.url, attachment.filename, attachment));
        }
      }
    } else {
      this.attachments = new Collection(this.attachments);
    }

    if ('sticker_items' in data || 'stickers' in data) {
      /**
       * A collection of stickers in the message
       * @type {Collection<Snowflake, Sticker>}
       */
      this.stickers = new Collection(
        (data.sticker_items ?? data.stickers)?.map(s => [s.id, new Sticker(this.client, s)]),
      );
    } else {
      this.stickers = new Collection(this.stickers);
    }

    // Discord sends null if the message has not been edited
    if (data.edited_timestamp) {
      /**
       * The timestamp the message was last edited at (if applicable)
       * @type {?number}
       */
      this.editedTimestamp = data.edited_timestamp ? Date.parse(data.edited_timestamp) : null;
    } else {
      this.editedTimestamp ??= null;
    }

    if ('reactions' in data) {
      /**
       * A manager of the reactions belonging to this message
       * @type {ReactionManager}
       */
      this.reactions = new ReactionManager(this);
      if (data.reactions?.length > 0) {
        for (const reaction of data.reactions) {
          this.reactions._add(reaction);
        }
      }
    } else {
      this.reactions ??= new ReactionManager(this);
    }

    if (!this.mentions) {
      /**
       * All valid mentions that the message contains
       * @type {MessageMentions}
       */
      this.mentions = new Mentions(
        this,
        data.mentions,
        data.mention_roles,
        data.mention_everyone,
        data.mention_channels,
        data.referenced_message?.author,
      );
    } else {
      this.mentions = new Mentions(
        this,
        data.mentions ?? this.mentions.users,
        data.mention_roles ?? this.mentions.roles,
        data.mention_everyone ?? this.mentions.everyone,
        data.mention_channels ?? this.mentions.crosspostedChannels,
        data.referenced_message?.author ?? this.mentions.repliedUser,
      );
    }

    if ('webhook_id' in data) {
      /**
       * The id of the webhook that sent the message, if applicable
       * @type {?Snowflake}
       */
      this.webhookId = data.webhook_id;
    } else {
      this.webhookId ??= null;
    }

    if (data.poll) {
      /**
       * The poll that was sent with the message
       * @type {?Poll}
       */
      this.poll = new Poll(this.client, data.poll, this);
    } else {
      this.poll ??= null;
    }

    if ('application' in data) {
      /**
       * Supplemental application information for group activities
       * @type {?Application}
       */
      this.groupActivityApplication = new Application(this.client, data.application);
    } else {
      this.groupActivityApplication ??= null;
    }

    if ('application_id' in data) {
      /**
       * The id of the application of the interaction that sent this message, if any
       * @type {?Snowflake}
       */
      this.applicationId = data.application_id;
    } else {
      this.applicationId ??= null;
    }

    if ('activity' in data) {
      /**
       * Group activity
       * @type {?MessageActivity}
       */
      this.activity = {
        partyId: data.activity.party_id,
        type: data.activity.type,
      };
    } else {
      this.activity ??= null;
    }

    if ('thread' in data) {
      this.client.channels._add(data.thread, this.guild);
    }

    if (this.member && data.member) {
      this.member._patch(data.member);
    } else if (data.member && this.guild && this.author) {
      this.guild.members._add(Object.assign(data.member, { user: this.author }));
    }

    if ('flags' in data) {
      /**
       * Flags that are applied to the message
       * @type {Readonly<MessageFlags>}
       */
      this.flags = new MessageFlags(data.flags).freeze();
    } else {
      this.flags = new MessageFlags(this.flags).freeze();
    }

    /**
     * Reference data sent in a message that contains ids identifying the referenced message.
     * This can be present in the following types of message:
     * * Crossposted messages (IS_CROSSPOST {@link MessageFlags.FLAGS message flag})
     * * CHANNEL_FOLLOW_ADD
     * * CHANNEL_PINNED_MESSAGE
     * * REPLY
     * * THREAD_STARTER_MESSAGE
     * @see {@link https://discord.com/developers/docs/resources/channel#message-types}
     * @typedef {Object} MessageReference
     * @property {Snowflake} channelId The channel's id the message was referenced
     * @property {?Snowflake} guildId The guild's id the message was referenced
     * @property {?Snowflake} messageId The message's id that was referenced
     * @property {MessageReferenceType} type The type of the message reference
     */

    if ('message_reference' in data) {
      /**
       * Message reference data
       * @type {?MessageReference}
       */
      this.reference = {
        channelId: data.message_reference.channel_id,
        guildId: data.message_reference.guild_id,
        messageId: data.message_reference.message_id,
        type: MessageReferenceTypes[data.message_reference.type ?? 0],
      };
    } else {
      this.reference ??= null;
    }

    if (data.referenced_message) {
      this.channel?.messages._add({ guild_id: data.message_reference?.guild_id, ...data.referenced_message });
    }

    /**
     * Partial data of the interaction that a message is a reply to
     * @typedef {Object} MessageInteraction
     * @property {Snowflake} id The interaction's id
     * @property {InteractionType} type The type of the interaction
     * @property {string} commandName The name of the interaction's application command,
     * as well as the subcommand and subcommand group, where applicable
     * @property {User} user The user that invoked the interaction
     */

    if (data.interaction) {
      /**
       * Partial data of the interaction that this message is a reply to
       * @type {?MessageInteraction}
       */
      this.interaction = {
        id: data.interaction.id,
        type: InteractionTypes[data.interaction.type],
        commandName: data.interaction.name,
        user: this.client.users._add(data.interaction.user),
      };
    } else {
      this.interaction ??= null;
    }

    if (data.message_snapshots) {
      /**
       * The message snapshots associated with the message reference
       * @type {Collection<Snowflake, Message>}
       */
      this.messageSnapshots = data.message_snapshots.reduce((coll, snapshot) => {
        const channel = this.client.channels.cache.get(this.reference.channelId);
        const snapshotData = {
          ...snapshot.message,
          id: this.reference.messageId,
          channel_id: this.reference.channelId,
          guild_id: this.reference.guildId,
        };

        return coll.set(
          this.reference.messageId,
          channel ? channel.messages._add(snapshotData) : new this.constructor(this.client, snapshotData),
        );
      }, new Collection());
    } else {
      this.messageSnapshots ??= new Collection();
    }

    /**
     * A call associated with a message
     * @typedef {Object} MessageCall
     * @property {Readonly<?Date>} endedAt The time the call ended
     * @property {?number} endedTimestamp The timestamp the call ended
     * @property {Snowflake[]} participants The ids of the users that participated in the call
     */

    if (data.call) {
      /**
       * The call associated with the message
       * @type {?MessageCall}
       */
      this.call = {
        endedTimestamp: data.call.ended_timestamp ? Date.parse(data.call.ended_timestamp) : null,
        participants: data.call.participants,
        get endedAt() {
          return this.endedTimestamp && new Date(this.endedTimestamp);
        },
      };
    } else {
      this.call ??= null;
    }
  }

  /**
   * Whether or not the structure has been deleted
   * @type {boolean}
   * @deprecated This will be removed in the next major version, see https://github.com/discordjs/discord.js/issues/7091
   */
  get deleted() {
    if (!deprecationEmittedForDeleted) {
      deprecationEmittedForDeleted = true;
      process.emitWarning(
        'Message#deleted is deprecated, see https://github.com/discordjs/discord.js/issues/7091.',
        'DeprecationWarning',
      );
    }

    return deletedMessages.has(this);
  }

  set deleted(value) {
    if (!deprecationEmittedForDeleted) {
      deprecationEmittedForDeleted = true;
      process.emitWarning(
        'Message#deleted is deprecated, see https://github.com/discordjs/discord.js/issues/7091.',
        'DeprecationWarning',
      );
    }

    if (value) deletedMessages.add(this);
    else deletedMessages.delete(this);
  }

  /**
   * The channel that the message was sent in
   * @type {TextBasedChannels}
   * @readonly
   */
  get channel() {
    return this.client.channels.cache.get(this.channelId) ?? null;
  }

  /**
   * Whether or not this message is a partial
   * @type {boolean}
   * @readonly
   */
  get partial() {
    return typeof this.content !== 'string' || !this.author;
  }

  /**
   * Represents the author of the message as a guild member.
   * Only available if the message comes from a guild where the author is still a member
   * @type {?GuildMember}
   * @readonly
   */
  get member() {
    return this.guild?.members.resolve(this.author) ?? null;
  }

  /**
   * The time the message was sent at
   * @type {Date}
   * @readonly
   */
  get createdAt() {
    return new Date(this.createdTimestamp);
  }

  /**
   * The time the message was last edited at (if applicable)
   * @type {?Date}
   * @readonly
   */
  get editedAt() {
    return this.editedTimestamp ? new Date(this.editedTimestamp) : null;
  }

  /**
   * The guild the message was sent in (if in a guild channel)
   * @type {?Guild}
   * @readonly
   */
  get guild() {
    return this.client.guilds.cache.get(this.guildId) ?? this.channel?.guild ?? null;
  }

  /**
   * Whether this message has a thread associated with it
   * @type {boolean}
   * @readonly
   */
  get hasThread() {
    return this.flags.has(MessageFlags.FLAGS.HAS_THREAD);
  }

  /**
   * The thread started by this message
   * <info>This property is not suitable for checking whether a message has a thread,
   * use {@link Message#hasThread} instead.</info>
   * @type {?ThreadChannel}
   * @readonly
   */
  get thread() {
    return this.channel?.threads?.cache.get(this.id) ?? null;
  }

  /**
   * The URL to jump to this message
   * @type {string}
   * @readonly
   */
  get url() {
    return `https://discord.com/channels/${this.guildId ?? '@me'}/${this.channelId}/${this.id}`;
  }

  /**
   * The message contents with all mentions replaced by the equivalent text.
   * If mentions cannot be resolved to a name, the relevant mention in the message content will not be converted.
   * @type {?string}
   * @readonly
   */
  get cleanContent() {
    // eslint-disable-next-line eqeqeq
    return this.content != null && this.channel ? Util.cleanContent(this.content, this.channel) : null;
  }

  /**
   * Creates a reaction collector.
   * @param {ReactionCollectorOptions} [options={}] Options to send to the collector
   * @returns {ReactionCollector}
   * @example
   * // Create a reaction collector
   * const filter = (reaction, user) => reaction.emoji.name === '👌' && user.id === 'someId';
   * const collector = message.createReactionCollector({ filter, time: 15_000 });
   * collector.on('collect', r => console.log(`Collected ${r.emoji.name}`));
   * collector.on('end', collected => console.log(`Collected ${collected.size} items`));
   */
  createReactionCollector(options = {}) {
    return new ReactionCollector(this, options);
  }

  /**
   * An object containing the same properties as CollectorOptions, but a few more:
   * @typedef {ReactionCollectorOptions} AwaitReactionsOptions
   * @property {string[]} [errors] Stop/end reasons that cause the promise to reject
   */

  /**
   * Similar to createReactionCollector but in promise form.
   * Resolves with a collection of reactions that pass the specified filter.
   * @param {AwaitReactionsOptions} [options={}] Optional options to pass to the internal collector
   * @returns {Promise<Collection<string | Snowflake, MessageReaction>>}
   * @example
   * // Create a reaction collector
   * const filter = (reaction, user) => reaction.emoji.name === '👌' && user.id === 'someId'
   * message.awaitReactions({ filter, time: 15_000 })
   *   .then(collected => console.log(`Collected ${collected.size} reactions`))
   *   .catch(console.error);
   */
  awaitReactions(options = {}) {
    return new Promise((resolve, reject) => {
      const collector = this.createReactionCollector(options);
      collector.once('end', (reactions, reason) => {
        if (options.errors?.includes(reason)) reject(reactions);
        else resolve(reactions);
      });
    });
  }

  /**
   * Whether the message is editable by the client user
   * @type {boolean}
   * @readonly
   */
  get editable() {
    const precheck = Boolean(
      this.author.id === this.client.user.id &&
        !deletedMessages.has(this) &&
        (!this.guild || this.channel?.viewable) &&
        this.reference?.type !== 'FORWARD',
    );

    // Regardless of permissions thread messages cannot be edited if
    // the thread is archived or the thread is locked and the bot does not have permission to manage threads.
    if (this.channel?.isThread()) {
      if (this.channel.archived) return false;
      if (this.channel.locked) {
        const permissions = this.channel.permissionsFor(this.client.user);
        if (!permissions?.has(Permissions.FLAGS.MANAGE_THREADS, true)) return false;
      }
    }

    return precheck;
  }

  /**
   * Whether the message is deletable by the client user
   * @type {boolean}
   * @readonly
   */
  get deletable() {
    if (deletedMessages.has(this)) {
      return false;
    }
    if (!this.guild) {
      return this.author.id === this.client.user.id;
    }
    // DMChannel does not have viewable property, so check viewable after proved that message is on a guild.
    if (!this.channel?.viewable) {
      return false;
    }

    const permissions = this.channel?.permissionsFor(this.client.user);
    if (!permissions) return false;
    // This flag allows deleting even if timed out
    if (permissions.has(Permissions.FLAGS.ADMINISTRATOR, false)) return true;

    return Boolean(
      this.author.id === this.client.user.id ||
        (permissions.has(Permissions.FLAGS.MANAGE_MESSAGES, false) &&
          this.guild.members.me.communicationDisabledUntilTimestamp < Date.now()),
    );
  }

  /**
   * Whether the message is bulk deletable by the client user
   * @type {boolean}
   * @readonly
   * @example
   * // Filter for bulk deletable messages
   * channel.bulkDelete(messages.filter(message => message.bulkDeletable));
   */
  get bulkDeletable() {
    return false;
  }

  /**
   * Whether the message is pinnable by the client user
   * @type {boolean}
   * @readonly
   */
  get pinnable() {
    const { channel } = this;
    return Boolean(
      !this.system &&
        !deletedMessages.has(this) &&
        (!this.guild ||
          (channel?.viewable &&
            channel?.permissionsFor(this.client.user)?.has(Permissions.FLAGS.MANAGE_MESSAGES, false))),
    );
  }

  /**
   * Fetches the Message this crosspost/reply/pin-add references, if available to the client
   * @returns {Promise<Message>}
   */
  async fetchReference() {
    if (!this.reference) throw new Error('MESSAGE_REFERENCE_MISSING');
    const { channelId, messageId } = this.reference;
    if (!messageId) throw new Error('MESSAGE_REFERENCE_MISSING');
    const channel = this.client.channels.resolve(channelId);
    if (!channel) throw new Error('GUILD_CHANNEL_RESOLVE');
    const message = await channel.messages.fetch(messageId);
    return message;
  }

  /**
   * Whether the message is crosspostable by the client user
   * @type {boolean}
   * @readonly
   */
  get crosspostable() {
    const bitfield =
      Permissions.FLAGS.SEND_MESSAGES |
      (this.author.id === this.client.user.id ? Permissions.defaultBit : Permissions.FLAGS.MANAGE_MESSAGES);
    const { channel } = this;
    return Boolean(
      channel?.type === 'GUILD_NEWS' &&
        !this.flags.has(MessageFlags.FLAGS.CROSSPOSTED) &&
        this.reference?.type !== 'FORWARD' &&
        this.type === 'DEFAULT' &&
        !this.poll &&
        channel.viewable &&
        channel.permissionsFor(this.client.user)?.has(bitfield, false) &&
        !deletedMessages.has(this),
    );
  }

  /**
   * Options that can be passed into {@link Message#edit}.
   * @typedef {Object} MessageEditOptions
   * @property {?string} [content] Content to be edited
   * @property {MessageEmbed[]|APIEmbed[]} [embeds] Embeds to be added/edited
   * @property {MessageMentionOptions} [allowedMentions] Which mentions should be parsed from the message content
   * @property {MessageFlags} [flags] Which flags to set for the message. Only `SUPPRESS_EMBEDS` can be edited.
   * @property {MessageAttachment[]} [attachments] An array of attachments to keep,
   * all attachments will be kept if omitted
   * @property {FileOptions[]|BufferResolvable[]|MessageAttachment[]} [files] Files to add to the message
   * @property {MessageActionRow[]|MessageActionRowOptions[]} [components]
   * Action rows containing interactive components for the message (buttons, select menus)
   */

  /**
   * Edits the content of the message.
   * @param {string|MessagePayload|MessageEditOptions} options The options to provide
   * @returns {Promise<Message>}
   * @example
   * // Update the content of a message
   * message.edit('This is my new content!')
   *   .then(msg => console.log(`Updated the content of a message to ${msg.content}`))
   *   .catch(console.error);
   */
  async edit(options) {
    if (!this.channel) throw new Error('CHANNEL_NOT_CACHED');
    return this.channel.messages.edit(this, options);
  }

  /**
   * Publishes a message in an announcement channel to all channels following it.
   * @returns {Promise<Message>}
   * @example
   * // Crosspost a message
   * if (message.channel.type === 'GUILD_NEWS') {
   *   message.crosspost()
   *     .then(() => console.log('Crossposted message'))
   *     .catch(console.error);
   * }
   */
  async crosspost() {
    if (!this.channel) throw new Error('CHANNEL_NOT_CACHED');
    return this.channel.messages.crosspost(this.id);
  }

  /**
   * Pins this message to the channel's pinned messages.
   * @param {string} [reason] Reason for pinning
   * @returns {Promise<Message>}
   * @example
   * // Pin a message
   * message.pin()
   *   .then(console.log)
   *   .catch(console.error)
   */
  async pin(reason) {
    if (!this.channel) throw new Error('CHANNEL_NOT_CACHED');
    await this.channel.messages.pin(this.id, reason);
    return this;
  }

  /**
   * Unpins this message from the channel's pinned messages.
   * @param {string} [reason] Reason for unpinning
   * @returns {Promise<Message>}
   * @example
   * // Unpin a message
   * message.unpin()
   *   .then(console.log)
   *   .catch(console.error)
   */
  async unpin(reason) {
    if (!this.channel) throw new Error('CHANNEL_NOT_CACHED');
    await this.channel.messages.unpin(this.id, reason);
    return this;
  }

  /**
   * Adds a reaction to the message.
   * @param {EmojiIdentifierResolvable} emoji The emoji to react with
   * @param {boolean} [burst=false] Super Reactions
   * @returns {Promise<MessageReaction>}
   * @example
   * // React to a message with a unicode emoji
   * message.react('🤔')
   *   .then(console.log)
   *   .catch(console.error);
   * @example
   * // React to a message with a custom emoji
   * message.react(message.guild.emojis.cache.get('123456789012345678'))
   *   .then(console.log)
   *   .catch(console.error);
   */
  async react(emoji, burst = false) {
    if (!this.channel) throw new Error('CHANNEL_NOT_CACHED');
    await this.channel.messages.react(this.id, emoji, burst);

    return this.client.actions.MessageReactionAdd.handle(
      {
        [this.client.actions.injectedUser]: this.client.user,
        [this.client.actions.injectedChannel]: this.channel,
        [this.client.actions.injectedMessage]: this,
        emoji: Util.resolvePartialEmoji(emoji),
        me_burst: burst,
      },
      true,
    ).reaction;
  }

  /**
   * Deletes the message.
   * @returns {Promise<Message>}
   * @example
   * // Delete a message
   * message.delete()
   *   .then(msg => console.log(`Deleted message from ${msg.author.username}`))
   *   .catch(console.error);
   */
  async delete() {
    if (!this.channel) throw new Error('CHANNEL_NOT_CACHED');
    await this.channel.messages.delete(this.id);
    return this;
  }

  /**
   * Options provided when sending a message as an inline reply.
   * @typedef {BaseMessageOptions} ReplyMessageOptions
   * @property {boolean} [failIfNotExists=true] Whether to error if the referenced message
   * does not exist (creates a standard message in this case when false)
   * @property {StickerResolvable[]} [stickers=[]] Stickers to send in the message
   */

  /**
   * Send an inline reply to this message.
   * @param {string|MessagePayload|ReplyMessageOptions} options The options to provide
   * @returns {Promise<Message>}
   * @example
   * // Reply to a message
   * message.reply('This is a reply!')
   *   .then(() => console.log(`Replied to message "${message.content}"`))
   *   .catch(console.error);
   */
  async reply(options) {
    if (!this.channel) throw new Error('CHANNEL_NOT_CACHED');
    let data;

    if (options instanceof MessagePayload) {
      data = options;
    } else {
      data = MessagePayload.create(this, options, {
        reply: {
          messageReference: this,
          failIfNotExists: options?.failIfNotExists ?? this.client.options.failIfNotExists,
        },
      });
    }
    return this.channel.send(data);
  }

  /**
   * Forwards this message
   * @param {TextBasedChannelResolvable} channel The channel to forward this message to.
   * @returns {Promise<Message>}
   */
  forward(channel) {
    const resolvedChannel = this.client.channels.resolve(channel);
    if (!resolvedChannel) throw new Error('INVALID_TYPE', 'channel', 'TextBasedChannelResolvable');
    return resolvedChannel.send({
      forward: {
        message: this.id,
        channel: this.channelId,
        guild: this.guildId,
      },
    });
  }

  /**
   * A number that is allowed to be the duration (in minutes) of inactivity after which a thread is automatically
   * archived. This can be:
   * * `60` (1 hour)
   * * `1440` (1 day)
   * * `4320` (3 days)
   * * `10080` (7 days)
   * * `'MAX'` (7 days)
   * <warn>This option is deprecated and will be removed in the next major version.</warn>
   * @typedef {number|string} ThreadAutoArchiveDuration
   */

  /**
   * Options for starting a thread on a message.
   * @typedef {Object} StartThreadOptions
   * @property {string} name The name of the new thread
   * @property {ThreadAutoArchiveDuration} [autoArchiveDuration=this.channel.defaultAutoArchiveDuration] The amount of
   * time (in minutes) after which the thread should automatically archive in case of no recent activity
   * @property {string} [reason] Reason for creating the thread
   * @property {number} [rateLimitPerUser] The rate limit per user (slowmode) for the thread in seconds
   */

  /**
   * Create a new public thread from this message
   * @see GuildTextThreadManager#create
   * @param {StartThreadOptions} [options] Options for starting a thread on this message
   * @returns {Promise<ThreadChannel>}
   */
  async startThread(options = {}) {
    if (!this.channel) throw new Error('CHANNEL_NOT_CACHED');
    if (!['GUILD_TEXT', 'GUILD_NEWS'].includes(this.channel.type)) {
      throw new Error('MESSAGE_THREAD_PARENT');
    }
    if (this.hasThread) throw new Error('MESSAGE_EXISTING_THREAD');
    return this.channel.threads.create({ ...options, startMessage: this });
  }

  /**
   * Submits a poll vote for the current user. Returns a 204 empty response on success.
   * @param  {...number[]} ids ID of the answer
   * @returns {Promise<void>}
   * @example
   * // Vote multi choices
   * message.vote(1,2);
   * // Remove vote
   * message.vote();
   */
  vote(...ids) {
    return this.client.api
      .channels(this.channel.id)
      .polls(this.id)
      .answers['@me'].put({
        data: {
          answer_ids: ids.flat(1).map(value => value.toString()),
        },
      });
  }

  /**
   * Fetch this message.
   * @param {boolean} [force=true] Whether to skip the cache check and request the API
   * @returns {Promise<Message>}
   */
  async fetch(force = true) {
    if (!this.channel) throw new Error('CHANNEL_NOT_CACHED');
    return this.channel.messages.fetch(this.id, { force });
  }

  /**
   * Fetches the webhook used to create this message.
   * @returns {Promise<?Webhook>}
   */
  async fetchWebhook() {
    if (!this.webhookId) throw new Error('WEBHOOK_MESSAGE');
    if (this.webhookId === this.applicationId) throw new Error('WEBHOOK_APPLICATION');
    return this.client.fetchWebhook(this.webhookId);
  }

  /**
   * Suppresses or unsuppresses embeds on a message.
   * @param {boolean} [suppress=true] If the embeds should be suppressed or not
   * @returns {Promise<Message>}
   */
  suppressEmbeds(suppress = true) {
    const flags = new MessageFlags(this.flags.bitfield);

    if (suppress) {
      flags.add(MessageFlags.FLAGS.SUPPRESS_EMBEDS);
    } else {
      flags.remove(MessageFlags.FLAGS.SUPPRESS_EMBEDS);
    }

    return this.edit({ flags });
  }

  /**
   * Removes the attachments from this message.
   * @returns {Promise<Message>}
   */
  removeAttachments() {
    return this.edit({ attachments: [] });
  }

  /**
   * Resolves a component by a custom id.
   * @param {string} customId The custom id to resolve against
   * @returns {?MessageActionRowComponent}
   */
  resolveComponent(customId) {
    return (
      this.components
        .flatMap(BaseMessageComponent.extractInteractiveComponents)
        .find(component => (component.customId ?? component.custom_id) === customId) ?? null
    );
  }

  /**
   * Used mainly internally. Whether two messages are identical in properties. If you want to compare messages
   * without checking all the properties, use `message.id === message2.id`, which is much more efficient. This
   * method allows you to see if there are differences in content, embeds, attachments, nonce and tts properties.
   * @param {Message} message The message to compare it to
   * @param {APIMessage} rawData Raw data passed through the WebSocket about this message
   * @returns {boolean}
   */
  equals(message, rawData) {
    if (!message) return false;
    const embedUpdate = !message.author && !message.attachments;
    if (embedUpdate) return this.id === message.id && this.embeds.length === message.embeds.length;

    let equal =
      this.id === message.id &&
      this.author.id === message.author.id &&
      this.content === message.content &&
      this.tts === message.tts &&
      this.nonce === message.nonce &&
      this.embeds.length === message.embeds.length &&
      this.attachments.size === message.attachments.size &&
      this.attachments.every(attachment => message.attachments.has(attachment.id)) &&
      this.embeds.every((embed, index) => embed.equals(message.embeds[index]));

    if (equal && rawData) {
      equal =
        this.mentions.everyone === message.mentions.everyone &&
        this.createdTimestamp === new Date(rawData.timestamp).getTime() &&
        this.editedTimestamp === new Date(rawData.edited_timestamp).getTime();
    }

    return equal;
  }

  /**
   * Whether this message is from a guild.
   * @returns {boolean}
   */
  inGuild() {
    return Boolean(this.guildId);
  }

  /**
   * When concatenated with a string, this automatically concatenates the message's content instead of the object.
   * @returns {string}
   * @example
   * // Logs: Message: This is a message!
   * console.log(`Message: ${message}`);
   */
  toString() {
    return this.content;
  }

  toJSON() {
    return super.toJSON({
      channel: 'channelId',
      author: 'authorId',
      groupActivityApplication: 'groupActivityApplicationId',
      guild: 'guildId',
      cleanContent: true,
      member: false,
      reactions: false,
    });
  }

  // TypeScript
  /**
   * Check data
   * @type {boolean}
   * @readonly
   */
  get isMessage() {
    return true;
  }

  /**
   * Click a specified button in the message based on the button's CustomID
   * @param {string} buttonid customId of the button to click
   *
   * To be compatible with Components V2, the following methods have been removed in this version:
   * - Clicking by coordinates (using ActionRow)
   * - Clicking the first button in the message
   *
   * Currently, only clicking by CustomID is supported.
   * @returns {Promise<Message|Modal>}
   */
  clickButton(buttonid) {
    const button = this.resolveComponent(buttonid);
    if (!button || button.type !== 'BUTTON') throw new TypeError('BUTTON_NOT_FOUND');
    if (button.disabled) throw new TypeError('BUTTON_CANNOT_CLICK');
    const nonce = SnowflakeUtil.generate();
    const data = {
      type: InteractionTypes.MESSAGE_COMPONENT,
      nonce,
      guild_id: this.guildId,
      channel_id: this.channelId,
      message_id: this.id,
      application_id: this.applicationId ?? this.author.id,
      session_id: this.client.sessionId,
      message_flags: this.flags.bitfield,
      data: {
        component_type: MessageComponentTypes.BUTTON,
        custom_id: button.customId,
      },
    };
    this.client.api.interactions.post({
      data,
    });
    return Util.createPromiseInteraction(this.client, nonce, 5_000, true, this);
  }

  /**
   * Select specific menu
   * @param {number|string} menu Target
   * @param {Array<UserResolvable | RoleResolvable | ChannelResolvable | string>} values Any value
   * @returns {Promise<Message|Modal>}
   */
  selectMenu(menu, values = []) {
    let selectMenu = menu;
    if (/[0-4]/.test(menu)) {
      selectMenu = this.components[menu]?.components[0];
    } else if (typeof menu == 'string') {
      selectMenu = this.components
        .flatMap(row => row.components)
        .find(
          b =>
            ['STRING_SELECT', 'USER_SELECT', 'ROLE_SELECT', 'MENTIONABLE_SELECT', 'CHANNEL_SELECT'].includes(b.type) &&
            b.customId == menu &&
            !b.disabled,
        );
    }
    if (values.length < selectMenu.minValues) {
      throw new RangeError(`[SELECT_MENU_MIN_VALUES] The minimum number of values is ${selectMenu.minValues}`);
    }
    if (values.length > selectMenu?.maxValues) {
      throw new RangeError(`[SELECT_MENU_MAX_VALUES] The maximum number of values is ${selectMenu.maxValues}`);
    }
    values = values.map(value => {
      switch (selectMenu.type) {
        case 'STRING_SELECT': {
          return selectMenu.options.find(obj => obj.value === value || obj.label === value).value;
        }
        case 'USER_SELECT': {
          return this.client.users.resolveId(value);
        }
        case 'ROLE_SELECT': {
          return this.guild.roles.resolveId(value);
        }
        case 'MENTIONABLE_SELECT': {
          return this.client.users.resolveId(value) || this.guild.roles.resolveId(value);
        }
        case 'CHANNEL_SELECT': {
          return this.client.channels.resolveId(value);
        }
        default: {
          return value;
        }
      }
    });
    const nonce = SnowflakeUtil.generate();
    const data = {
      type: InteractionTypes.MESSAGE_COMPONENT,
      guild_id: this.guildId,
      channel_id: this.channelId,
      message_id: this.id,
      application_id: this.applicationId ?? this.author.id,
      session_id: this.client.sessionId,
      message_flags: this.flags.bitfield,
      data: {
        component_type: MessageComponentTypes[selectMenu.type],
        custom_id: selectMenu.customId,
        type: MessageComponentTypes[selectMenu.type],
        values,
      },
      nonce,
    };
    this.client.api.interactions.post({
      data,
    });
    return Util.createPromiseInteraction(this.client, nonce, 5_000, true, this);
  }

  /**
   * Marks the message as unread.
   * @returns {Promise<void>}
   */
  markUnread() {
    return this.client.api.channels[this.channelId].messages[this.id].ack.post({
      data: {
        manual: true,
        mention_count: 1,
      },
    });
  }

  /**
   * Marks the message as read.
   * @returns {Promise<void>}
   */
  markRead() {
    return this.client.api.channels[this.channelId].messages[this.id].ack.post({
      data: {
        token: null,
      },
    });
  }

  /**
   * Report Message
   * @param {Arrray<number>} breadcrumbs Options for reporting
   * @param {Object} [elements={}] Metadata
   * @returns {Promise<{ report_id: Snowflake }>}
   * @example
   * // GET https://discord.com/api/v9/reporting/menu/message?variant=4
   * // Report Category
   * // - <hidden>MESSAGE_WELCOME (3)</hidden>
   * // - Something else (28)
   * // - Hacks, cheats, phishing or malicious links (72)
   * message.report([3, 28, 72]).then(console.log);
   * // { "report_id": "1199663489988440124" }
   */
  report(breadcrumbs, elements = {}) {
    return this.client.api.reporting.message.post({
      data: {
        version: '1.0',
        variant: '4',
        language: 'en',
        breadcrumbs,
        elements,
        channel_id: this.channelId,
        message_id: this.id,
        name: 'message',
      },
    });
  }
}

exports.Message = Message;
exports.deletedMessages = deletedMessages;
