'use strict';

const { Collection } = require('@discordjs/collection');
const BigNumber = require('bignumber.js');
const CachedManager = require('./CachedManager');
const { TypeError, Error } = require('../errors');
const { Message } = require('../structures/Message');
const MessagePayload = require('../structures/MessagePayload');
const Util = require('../util/Util');

/**
 * Manages API methods for Messages and holds their cache.
 * @extends {CachedManager}
 */
class MessageManager extends CachedManager {
  constructor(channel, iterable) {
    super(channel.client, Message, iterable);

    /**
     * The channel that the messages belong to
     * @type {TextBasedChannels}
     */
    this.channel = channel;
  }

  /**
   * The cache of Messages
   * @type {Collection<Snowflake, Message>}
   * @name MessageManager#cache
   */

  _add(data, cache) {
    return super._add(data, cache);
  }

  /**
   * The parameters to pass in when requesting previous messages from a channel. `around`, `before` and
   * `after` are mutually exclusive. All the parameters are optional.
   * @typedef {Object} ChannelLogsQueryOptions
   * @property {number} [limit=50] Number of messages to acquire
   * @property {Snowflake} [before] The message's id to get the messages that were posted before it
   * @property {Snowflake} [after] The message's id to get the messages that were posted after it
   * @property {Snowflake} [around] The message's id to get the messages that were posted around it
   */

  /**
   * Gets a message, or messages, from this channel.
   * <info>The returned Collection does not contain reaction users of the messages if they were not cached.
   * Those need to be fetched separately in such a case.</info>
   * @param {Snowflake|ChannelLogsQueryOptions} [message] The id of the message to fetch, or query parameters.
   * @param {BaseFetchOptions} [options] Additional options for this fetch
   * @returns {Promise<Message|Collection<Snowflake, Message>>}
   * @example
   * // Get message
   * channel.messages.fetch('99539446449315840')
   *   .then(message => console.log(message.content))
   *   .catch(console.error);
   * @example
   * // Get messages
   * channel.messages.fetch({ limit: 10 })
   *   .then(messages => console.log(`Received ${messages.size} messages`))
   *   .catch(console.error);
   * @example
   * // Get messages and filter by user id
   * channel.messages.fetch()
   *   .then(messages => console.log(`${messages.filter(m => m.author.id === '84484653687267328').size} messages`))
   *   .catch(console.error);
   */
  fetch(message, { cache = true, force = false } = {}) {
    return typeof message === 'string' ? this._fetchId(message, cache, force) : this._fetchMany(message, cache);
  }

  /**
   * Fetches the pinned messages of this channel and returns a collection of them.
   * <info>The returned Collection does not contain any reaction data of the messages.
   * Those need to be fetched separately.</info>
   * @param {boolean} [cache=true] Whether to cache the message(s)
   * @returns {Promise<Collection<Snowflake, Message>>}
   * @example
   * // Get pinned messages
   * channel.messages.fetchPinned()
   *   .then(messages => console.log(`Received ${messages.size} messages`))
   *   .catch(console.error);
   */
  async fetchPinned(cache = true) {
    const data = await this.client.api.channels[this.channel.id].pins.get();
    const messages = new Collection();
    for (const message of data) messages.set(message.id, this._add(message, cache));
    return messages;
  }

  /**
   * Data that can be resolved to a Message object. This can be:
   * * A Message
   * * A Snowflake
   * @typedef {Message|Snowflake} MessageResolvable
   */

  /**
   * Resolves a {@link MessageResolvable} to a {@link Message} object.
   * @method resolve
   * @memberof MessageManager
   * @instance
   * @param {MessageResolvable} message The message resolvable to resolve
   * @returns {?Message}
   */

  /**
   * Resolves a {@link MessageResolvable} to a {@link Message} id.
   * @method resolveId
   * @memberof MessageManager
   * @instance
   * @param {MessageResolvable} message The message resolvable to resolve
   * @returns {?Snowflake}
   */

  /**
   * Edits a message, even if it's not cached.
   * @param {MessageResolvable} message The message to edit
   * @param {string|MessageEditOptions|MessagePayload} options The options to edit the message
   * @returns {Promise<Message>}
   */
  async edit(message, options) {
    const messageId = this.resolveId(message);
    if (!messageId) throw new TypeError('INVALID_TYPE', 'message', 'MessageResolvable');

    let messagePayload;
    if (options instanceof MessagePayload) {
      messagePayload = await options.resolveData();
    } else {
      messagePayload = await MessagePayload.create(message instanceof Message ? message : this, options).resolveData();
    }
    const { data, files } = await messagePayload.resolveFiles();
    const d = await this.client.api.channels[this.channel.id].messages[messageId].patch({ data, files });

    const existing = this.cache.get(messageId);
    if (existing) {
      const clone = existing._clone();
      clone._patch(d);
      return clone;
    }
    return this._add(d);
  }

  /**
   * Publishes a message in an announcement channel to all channels following it, even if it's not cached.
   * @param {MessageResolvable} message The message to publish
   * @returns {Promise<Message>}
   */
  async crosspost(message) {
    message = this.resolveId(message);
    if (!message) throw new TypeError('INVALID_TYPE', 'message', 'MessageResolvable');

    const data = await this.client.api.channels(this.channel.id).messages(message).crosspost.post();
    return this.cache.get(data.id) ?? this._add(data);
  }

  /**
   * Pins a message to the channel's pinned messages, even if it's not cached.
   * @param {MessageResolvable} message The message to pin
   * @param {string} [reason] Reason for pinning
   * @returns {Promise<void>}
   */
  async pin(message, reason) {
    message = this.resolveId(message);
    if (!message) throw new TypeError('INVALID_TYPE', 'message', 'MessageResolvable');

    await this.client.api.channels(this.channel.id).pins(message).put({ reason });
  }

  /**
   * Unpins a message from the channel's pinned messages, even if it's not cached.
   * @param {MessageResolvable} message The message to unpin
   * @param {string} [reason] Reason for unpinning
   * @returns {Promise<void>}
   */
  async unpin(message, reason) {
    message = this.resolveId(message);
    if (!message) throw new TypeError('INVALID_TYPE', 'message', 'MessageResolvable');

    await this.client.api.channels(this.channel.id).pins(message).delete({ reason });
  }

  /**
   * Adds a reaction to a message, even if it's not cached.
   * @param {MessageResolvable} message The message to react to
   * @param {EmojiIdentifierResolvable} emoji The emoji to react with
   * @returns {Promise<void>}
   */
  async react(message, emoji) {
    message = this.resolveId(message);
    if (!message) throw new TypeError('INVALID_TYPE', 'message', 'MessageResolvable');

    emoji = Util.resolvePartialEmoji(emoji);
    if (!emoji) throw new TypeError('EMOJI_TYPE', 'emoji', 'EmojiIdentifierResolvable');

    const emojiId = emoji.id
      ? `${emoji.animated ? 'a:' : ''}${emoji.name}:${emoji.id}`
      : encodeURIComponent(emoji.name);

    // eslint-disable-next-line newline-per-chained-call
    await this.client.api.channels(this.channel.id).messages(message).reactions(emojiId, '@me').put();
  }

  /**
   * Deletes a message, even if it's not cached.
   * @param {MessageResolvable} message The message to delete
   * @returns {Promise<void>}
   */
  async delete(message) {
    message = this.resolveId(message);
    if (!message) throw new TypeError('INVALID_TYPE', 'message', 'MessageResolvable');

    await this.client.api.channels(this.channel.id).messages(message).delete();
  }

  async _fetchId(messageId, cache, force) {
    if (!force) {
      const existing = this.cache.get(messageId);
      if (existing && !existing.partial) return existing;
    }

    if (this.channel.guildId) {
      const data = (
        await this.client.api.guilds[this.channel.guild.id].messages.search.get({
          query: {
            channel_id: this.channel.id,
            max_id: new BigNumber.BigNumber(messageId).plus(1).toString(),
            min_id: new BigNumber.BigNumber(messageId).minus(1).toString(),
            include_nsfw: true,
          },
        })
      ).messages[0];
      if (data) return this._add(data[0], cache);
      else throw new Error('MESSAGE_ID_NOT_FOUND');
    } else {
      const data = (
        await this.client.api.channels[this.channel.id].messages.search.get({
          query: {
            max_id: new BigNumber.BigNumber(messageId).plus(1).toString(),
            min_id: new BigNumber.BigNumber(messageId).minus(1).toString(),
          },
        })
      ).messages[0];
      if (data) return this._add(data[0], cache);
      else throw new Error('MESSAGE_ID_NOT_FOUND');
    }
  }

  async _fetchMany(options = {}, cache) {
    const data = await this.client.api.channels[this.channel.id].messages.get({ query: options });
    const messages = new Collection();
    for (const message of data) messages.set(message.id, this._add(message, cache));
    return messages;
  }

  /**
   * @typedef {object} MessageSearchOptions
   * @property {Array<Snowflake>} [author] An array of author IDs to filter by
   * @property {Array<Snowflake>} [mentions] An array of user IDs (mentioned) to filter by
   * @property {string} [content] A messageContent to filter by
   * @property {Snowflake} [maxId] The maximum Message ID to filter by
   * @property {Snowflake} [minId] The minimum Message ID to filter by
   * @property {Array<Snowflake>} [channel] An array of channel IDs to filter by
   * @property {boolean} [pinned] Whether to filter by pinned messages
   * @property {Array<string>} [has] Message has: `link`, `embed`, `file`, `video`, `image`, or `sound`
   * @property {boolean} [nsfw=false] Whether to filter by NSFW channels
   * @property {number} [offset=0] The number of messages to skip (for pagination, 25 results per page)
   * @property {number} [limit=25] The number of messages to fetch
   */

  /**
   * @typedef {object} MessageSearchResult
   * @property {Collection<Snowflake, Message>} messages A collection of found messages
   * @property {number} total The total number of messages that match the search criteria
   */

  /**
   * Search Messages in the channel.
   * @param {MessageSearchOptions} options Performs a search within the channel.
   * @returns {MessageSearchResult}
   */
  async search(options = {}) {
    let { author, content, mentions, has, maxId, minId, channelId, pinned, nsfw, offset, limit } = Object.assign(
      {
        author: [],
        content: '',
        mentions: [],
        has: [],
        maxId: null,
        minId: null,
        channelId: [],
        pinned: false,
        nsfw: false,
        offset: 0,
        limit: 25,
      },
      options,
    );
    let stringQuery = [];
    const result = new Collection();
    let data;
    if (author.length > 0) stringQuery.push(author.map(id => `author_id=${id}`).join('&'));
    if (content && content.length) stringQuery.push(`content=${encodeURIComponent(content)}`);
    if (mentions.length > 0) stringQuery.push(mentions.map(id => `mentions=${id}`).join('&'));
    has = has.filter(v => ['link', 'embed', 'file', 'video', 'image', 'sound', 'sticker'].includes(v));
    if (has.length > 0) stringQuery.push(has.map(v => `has=${v}`).join('&'));
    if (maxId) stringQuery.push(`max_id=${maxId}`);
    if (minId) stringQuery.push(`min_id=${minId}`);
    if (nsfw) stringQuery.push('include_nsfw=true');
    if (offset !== 0) stringQuery.push(`offset=${offset}`);
    if (limit !== 25) stringQuery.push(`limit=${limit}`);
    if (this.channel.guildId && channelId.length > 0) {
      stringQuery.push(channelId.map(id => `channel_id=${id}`).join('&'));
    }
    if (typeof pinned == 'boolean') stringQuery.push(`pinned=${pinned}`);
    // Main
    if (!stringQuery.length) {
      return {
        messages: result,
        total: 0,
      };
    }
    if (this.channel.guildId) {
      data = await this.client.api.guilds[this.channel.guildId].messages[`search?${stringQuery.join('&')}`].get();
    } else {
      stringQuery = stringQuery.filter(v => !v.startsWith('channel_id') && !v.startsWith('include_nsfw'));
      data = await this.client.api.channels[this.channel.id].messages[`search?${stringQuery.join('&')}`].get();
    }
    for await (const message of data.messages) result.set(message[0].id, new Message(this.client, message[0]));
    return {
      messages: result,
      total: data.total_results,
    };
  }
}

module.exports = MessageManager;
