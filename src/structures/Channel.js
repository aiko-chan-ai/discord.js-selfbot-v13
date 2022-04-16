'use strict';

const process = require('node:process');
const { Message } = require('discord.js');
const Base = require('./Base');
let CategoryChannel;
let DMChannel;
let NewsChannel;
let StageChannel;
let StoreChannel;
let TextChannel;
let ThreadChannel;
let VoiceChannel;
const { ChannelTypes, ThreadChannelTypes, VoiceBasedChannelTypes } = require('../util/Constants');
const SnowflakeUtil = require('../util/SnowflakeUtil');
// Const { ApplicationCommand } = require('discord.js-selfbot-v13'); - Not being used in this file, not necessary.

/**
 * @type {WeakSet<Channel>}
 * @private
 * @internal
 */
const deletedChannels = new WeakSet();
let deprecationEmittedForDeleted = false;

/**
 * Represents any channel on Discord.
 * @extends {Base}
 * @abstract
 */
class Channel extends Base {
  constructor(client, data, immediatePatch = true) {
    super(client);

    const type = ChannelTypes[data?.type];
    /**
     * The type of the channel
     * @type {ChannelType}
     */
    this.type = type ?? 'UNKNOWN';

    if (data && immediatePatch) this._patch(data);
  }

  _patch(data) {
    /**
     * The channel's id
     * @type {Snowflake}
     */
    this.id = data.id;
  }

  /**
   * The timestamp the channel was created at
   * @type {number}
   * @readonly
   */
  get createdTimestamp() {
    return SnowflakeUtil.timestampFrom(this.id);
  }

  /**
   * The time the channel was created at
   * @type {Date}
   * @readonly
   */
  get createdAt() {
    return new Date(this.createdTimestamp);
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
        'Channel#deleted is deprecated, see https://github.com/discordjs/discord.js/issues/7091.',
        'DeprecationWarning',
      );
    }

    return deletedChannels.has(this);
  }

  set deleted(value) {
    if (!deprecationEmittedForDeleted) {
      deprecationEmittedForDeleted = true;
      process.emitWarning(
        'Channel#deleted is deprecated, see https://github.com/discordjs/discord.js/issues/7091.',
        'DeprecationWarning',
      );
    }

    if (value) deletedChannels.add(this);
    else deletedChannels.delete(this);
  }

  /**
   * Whether this Channel is a partial
   * <info>This is always false outside of DM channels.</info>
   * @type {boolean}
   * @readonly
   */
  get partial() {
    return false;
  }

  /**
   * When concatenated with a string, this automatically returns the channel's mention instead of the Channel object.
   * @returns {string}
   * @example
   * // Logs: Hello from <#123456789012345678>!
   * console.log(`Hello from ${channel}!`);
   */
  toString() {
    return `<#${this.id}>`;
  }

  /**
   * Deletes this channel.
   * @returns {Promise<Channel>}
   * @example
   * // Delete the channel
   * channel.delete()
   *   .then(console.log)
   *   .catch(console.error);
   */
  async delete() {
    await this.client.api.channels(this.id).delete();
    return this;
  }

  /**
   * Fetches this channel.
   * @param {boolean} [force=true] Whether to skip the cache check and request the API
   * @returns {Promise<Channel>}
   */
  fetch(force = true) {
    return this.client.channels.fetch(this.id, { force });
  }

  /**
   * Indicates whether this channel is {@link TextBasedChannels text-based}.
   * @returns {boolean}
   */
  isText() {
    return 'messages' in this;
  }

  /**
   * Indicates whether this channel is {@link BaseGuildVoiceChannel voice-based}.
   * @returns {boolean}
   */
  isVoice() {
    return VoiceBasedChannelTypes.includes(this.type);
  }

  /**
   * Indicates whether this channel is a {@link ThreadChannel}.
   * @returns {boolean}
   */
  isThread() {
    return ThreadChannelTypes.includes(this.type);
  }

  static create(client, data, guild, { allowUnknownGuild, fromInteraction } = {}) {
    CategoryChannel ??= require('./CategoryChannel');
    DMChannel ??= require('./DMChannel');
    NewsChannel ??= require('./NewsChannel');
    StageChannel ??= require('./StageChannel');
    StoreChannel ??= require('./StoreChannel');
    TextChannel ??= require('./TextChannel');
    ThreadChannel ??= require('./ThreadChannel');
    VoiceChannel ??= require('./VoiceChannel');

    let channel;
    if (!data.guild_id && !guild) {
      if ((data.recipients && data.type !== ChannelTypes.GROUP_DM) || data.type === ChannelTypes.DM) {
        channel = new DMChannel(client, data);
      } else if (data.type === ChannelTypes.GROUP_DM) {
        const PartialGroupDMChannel = require('./PartialGroupDMChannel');
        channel = new PartialGroupDMChannel(client, data);
      }
    } else {
      guild ??= client.guilds.cache.get(data.guild_id);

      if (guild || allowUnknownGuild) {
        switch (data.type) {
          case ChannelTypes.GUILD_TEXT: {
            channel = new TextChannel(guild, data, client);
            break;
          }
          case ChannelTypes.GUILD_VOICE: {
            channel = new VoiceChannel(guild, data, client);
            break;
          }
          case ChannelTypes.GUILD_CATEGORY: {
            channel = new CategoryChannel(guild, data, client);
            break;
          }
          case ChannelTypes.GUILD_NEWS: {
            channel = new NewsChannel(guild, data, client);
            break;
          }
          case ChannelTypes.GUILD_STORE: {
            channel = new StoreChannel(guild, data, client);
            break;
          }
          case ChannelTypes.GUILD_STAGE_VOICE: {
            channel = new StageChannel(guild, data, client);
            break;
          }
          case ChannelTypes.GUILD_NEWS_THREAD:
          case ChannelTypes.GUILD_PUBLIC_THREAD:
          case ChannelTypes.GUILD_PRIVATE_THREAD: {
            channel = new ThreadChannel(guild, data, client, fromInteraction);
            if (!allowUnknownGuild) channel.parent?.threads.cache.set(channel.id, channel);
            break;
          }
        }
        if (channel && !allowUnknownGuild) guild.channels?.cache.set(channel.id, channel);
      }
    }
    return channel;
  }

  toJSON(...props) {
    return super.toJSON({ createdTimestamp: true }, ...props);
  }

  // Send Slash
  /**
   * Send Slash to this channel
   * @param {DiscordBot} botID Bot ID
   * @param {string<ApplicationCommand.name>} commandName Command name
   * @param {Array<ApplicationCommand.options>} args Command arguments
   * @returns {Promise<pending>}
   */
  async sendSlash(botID, commandName, args = []) {
    if (!this.isText()) throw new Error('This channel is not text-based.');
    if (!botID) throw new Error('Bot ID is required');
    const user = await this.client.users.fetch(botID).catch(() => {});
    if (!user || !user.bot || !user.applications) {
      throw new Error('BotID is not a bot or does not have an application slash command');
    }
    if (!commandName || typeof commandName !== 'string') throw new Error('Command name is required');
    const listApplication =
      user.applications.cache.size == 0 ? await user.applications.fetch() : user.applications.cache;
    let slashCommand;
    await Promise.all(
      listApplication.map(application => {
        if (commandName == application.name && application.type == 'CHAT_INPUT') slashCommand = application;
        return true;
      }),
    );
    if (!slashCommand) {
      throw new Error(
        `Command ${commandName} is not found\nList command avalible: ${listApplication
          .filter(a => a.type == 'CHAT_INPUT')
          .map(a => a.name)
          .join(', ')}`,
      );
    }
    return slashCommand.sendSlashCommand(
      new Message(this.client, {
        channel_id: this.id,
        guild_id: this.guild?.id || null,
        author: this.client.user,
        content: '',
        id: this.client.user.id,
      }),
      args,
    );
  }
}

exports.Channel = Channel;
exports.deletedChannels = deletedChannels;

/**
 * @external APIChannel
 * @see {@link https://discord.com/developers/docs/resources/channel#channel-object}
 */
