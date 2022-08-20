'use strict';

const { Collection } = require('@discordjs/collection');
const BaseManager = require('./BaseManager');
const GuildFolderManager = require('./GuildFolderManager');
const { Error, TypeError } = require('../errors/DJSError');
const GuildFolder = require('../structures/GuildFolder');
const { CustomStatus } = require('../structures/RichPresence');
const { localeSetting, DMScanLevel, stickerAnimationMode } = require('../util/Constants');
/**
 * Manages API methods for users and stores their cache.
 * @extends {BaseManager}
 * @see {@link https://luna.gitlab.io/discord-unofficial-docs/user_settings.html}
 */
class ClientSettingManager extends BaseManager {
  constructor(client) {
    super(client);
    /**
     * Raw data
     * @type {Object}
     */
    this.rawSetting = {};
    /**
     * Language
     * @type {?string}
     */
    this.locale = null;
    /**
     * From: Setting => ACTIVITY SETTINGS => Activity Status => Display current activity as a status message
     * @type {?boolean}
     */
    this.activityDisplay = null;
    /**
     * Disable Direct Message from servers
     * @type {Collection<Snowflake, boolean>}
     */
    this.disableDMfromServer = new Collection();
    /**
     * Allow direct messages from server members
     * @type {?boolean}
     */
    this.DMfromServerMode = null;
    /**
     * Display images
     * @type {?boolean}
     */
    this.displayImage = null;
    /**
     * Display linked images
     * @type {?boolean}
     */
    this.linkedImageDisplay = null;
    /**
     * From: Setting => APP SETTINGS => Accessibility => Automatically play GIFs when Discord is focused.
     * @type {?boolean}
     */
    this.autoplayGIF = null;
    /**
     * Show embeds and preview website links pasted into chat
     * @type {?boolean}
     */
    this.previewLink = null;
    /**
     * From: Setting => APP SETTINGS => Accessibility => Play Animated Emojis
     * @type {?boolean}
     */
    this.animatedEmojis = null;
    /**
     * From: Setting => APP SETTINGS => Accessibility => Text-to-speech => Allow playback
     * @type {?boolean}
     */
    this.allowTTS = null;
    /**
     * From: Setting => APP SETTINGS => Appearance => Message Display => Compact Mode
     * @type {?boolean}
     */
    this.compactMode = null;
    /**
     * From: Setting => APP SETTINGS => Text & Images => Emoji => Convert Emoticons
     * @type {?boolean}
     */
    this.convertEmoticons = null;
    /**
     * SAFE DIRECT MESSAGING
     * @type {?DMScanLevel}
     */
    this.DMScanLevel = null;
    /**
     * From: Setting => APP SETTINGS => Appearance => Theme
     * @type {'dark' | 'light' | null}
     */
    this.theme = '';
    /**
     * Developer Mode (Copy ID, etc.)
     * @type {?boolean}
     */
    this.developerMode = null;
    /**
     * AFK timeout (receives notifications)
     * @type {?number}
     */
    this.afkTimeout = null;
    /**
     * Sticker animation mode
     * @type {?stickerAnimationMode}
     */
    this.stickerAnimationMode = null;
    /**
     * WHO CAN ADD YOU AS A FRIEND ?
     * @type {?object}
     * @see {@link https://luna.gitlab.io/discord-unofficial-docs/user_settings.html#friend-source-flags-structure}
     */
    this.addFriendFrom = {
      all: null,
      mutual_friends: null,
      mutual_guilds: null,
    };
    /**
     * From: Setting => APP SETTINGS => Text & Images => Emoji => Show emoji reactions
     * @type {?boolean}
     */
    this.showEmojiReactions = null;
    /**
     * Custom Stauts
     * @type {?object}
     * @see {@link https://luna.gitlab.io/discord-unofficial-docs/custom_status.html#customstatus-structure}
     */
    this.customStatus = null;
    /**
     * Guild folder and position
     * @type {GuildFolderManager}
     */
    this.guildFolder = new GuildFolderManager(client);
    // Todo: add new method from Discum
  }
  /**
   * Patch data file
   * https://github.com/Merubokkusu/Discord-S.C.U.M/blob/master/discum/user/user.py
   * @private
   * @param {Object} data Raw Data to patch
   */
  _patch(data) {
    this.rawSetting = Object.assign(this.rawSetting, data);
    if ('locale' in data) {
      this.locale = localeSetting[data.locale];
    }
    if ('show_current_game' in data) {
      this.activityDisplay = data.show_current_game;
    }
    if ('default_guilds_restricted' in data) {
      this.DMfromServerMode = data.default_guilds_restricted;
    }
    if ('inline_attachment_media' in data) {
      this.displayImage = data.inline_attachment_media;
    }
    if ('inline_embed_media' in data) {
      this.linkedImageDisplay = data.inline_embed_media;
    }
    if ('gif_auto_play' in data) {
      this.autoplayGIF = data.gif_auto_play;
    }
    if ('render_embeds' in data) {
      this.previewLink = data.render_embeds;
    }
    if ('animate_emoji' in data) {
      this.animatedEmojis = data.animate_emoji;
    }
    if ('enable_tts_command' in data) {
      this.allowTTS = data.enable_tts_command;
    }
    if ('message_display_compact' in data) {
      this.compactMode = data.message_display_compact;
    }
    if ('convert_emoticons' in data) {
      this.convertEmoticons = data.convert_emoticons;
    }
    if ('explicit_content_filter' in data) {
      this.DMScanLevel = DMScanLevel[data.explicit_content_filter];
    }
    if ('theme' in data) {
      this.theme = data.theme;
    }
    if ('developer_mode' in data) {
      this.developerMode = data.developer_mode;
    }
    if ('afk_timeout' in data) {
      this.afkTimeout = data.afk_timeout * 1000; // Second => milisecond
    }
    if ('animate_stickers' in data) {
      this.stickerAnimationMode = stickerAnimationMode[data.animate_stickers];
    }
    if ('render_reactions' in data) {
      this.showEmojiReactions = data.render_reactions;
    }
    if ('custom_status' in data) {
      this.customStatus = data.custom_status || {}; // Thanks PinkDuwc._#3443 reported this issue
      this.customStatus.status = data.status;
    }
    if ('friend_source_flags' in data) {
      this.addFriendFrom = {
        all: data.friend_source_flags.all || false,
        mutual_friends: data.friend_source_flags.all ? true : data.friend_source_flags.mutual_friends,
        mutual_guilds: data.friend_source_flags.all ? true : data.friend_source_flags.mutual_guilds,
      };
    }
    if ('guild_folders' in data) {
      data.guild_folders.map((folder, index) =>
        this.guildFolder.cache.set(index, new GuildFolder(this.client, folder)),
      );
    }
    if ('restricted_guilds' in data) {
      this.disableDMfromServer = new Collection(data.restricted_guilds.map(guildId => [guildId, true]));
    }
  }
  async fetch() {
    if (this.client.bot) throw new Error('INVALID_BOT_METHOD');
    const data = await this.client.api.users('@me').settings.get();
    this._patch(data);
    return this;
  }
  /**
   * Edit data
   * @param {Object} data Data to edit
   * @private
   */
  async edit(data) {
    if (this.client.bot) throw new Error('INVALID_BOT_METHOD');
    const res = await this.client.api.users('@me').settings.patch({ data });
    this._patch(res);
    return this;
  }
  /**
   * Set compact mode
   * @param {boolean | null} value Compact mode enable or disable
   * @returns {boolean}
   */
  async setDisplayCompactMode(value) {
    if (typeof value !== 'boolean' && value !== null) {
      throw new TypeError('INVALID_TYPE', 'value', 'boolean | null', true);
    }
    if (!value) value = !this.compactMode;
    if (value !== this.compactMode) {
      await this.edit({ message_display_compact: value });
    }
    return this.compactMode;
  }
  /**
   * Discord Theme
   * @param {null |dark |light} value Theme to set
   * @returns {theme}
   */
  async setTheme(value) {
    const validValues = ['dark', 'light'];
    if (typeof value !== 'string' && value !== null) {
      throw new TypeError('INVALID_TYPE', 'value', 'string | null', true);
    }
    if (!validValues.includes(value)) {
      if (value == validValues[0]) value = validValues[1];
      else value = validValues[0];
    }
    if (value !== this.theme) {
      await this.edit({ theme: value });
    }
    return this.theme;
  }

  /**
   * CustomStatus Object
   * @typedef {Object} CustomStatusOption
   * @property {string | null} text Text to set
   * @property {string | null} status The status to set: 'online', 'idle', 'dnd', 'invisible' or null.
   * @property {EmojiResolvable | null} emoji UnicodeEmoji, DiscordEmoji, or null.
   * @property {number | null} expires The number of seconds until the status expires, or null.
   */

  /**
   * Set custom status
   * @param {?CustomStatus | CustomStatusOption} options CustomStatus
   */
  setCustomStatus(options) {
    if (typeof options !== 'object') {
      this.edit({ custom_status: null });
    } else if (options instanceof CustomStatus) {
      options = options.toJSON();
      let data = {
        emoji_name: null,
        expires_at: null,
        text: null,
      };
      if (typeof options.state === 'string') {
        data.text = options.state;
      }
      if (options.emoji) {
        if (options.emoji?.id) {
          data.emoji_name = options.emoji?.name;
          data.emoji_id = options.emoji?.id;
        } else {
          data.emoji_name = typeof options.emoji?.name === 'string' ? options.emoji?.name : null;
        }
      }
      this.edit({ custom_status: data });
    } else {
      let data = {
        emoji_name: null,
        expires_at: null,
        text: null,
      };
      if (typeof options.text === 'string') {
        if (options.text.length > 128) {
          throw new RangeError('[INVALID_VALUE] Custom status text must be less than 128 characters');
        }
        data.text = options.text;
      }
      if (options.emoji) {
        const emoji = this.client.emojis.resolve(options.emoji);
        if (emoji) {
          data.emoji_name = emoji.name;
          data.emoji_id = emoji.id;
        } else {
          data.emoji_name = typeof options.emoji === 'string' ? options.emoji : null;
        }
      }
      if (typeof options.expires === 'number') {
        if (options.expires < Date.now()) {
          throw new RangeError(`[INVALID_VALUE] Custom status expiration must be greater than ${Date.now()}`);
        }
        data.expires_at = new Date(options.expires).toISOString();
      }
      if (['online', 'idle', 'dnd', 'invisible'].includes(options.status)) this.edit({ status: options.status });
      this.edit({ custom_status: data });
    }
  }

  /**
   * * Locale Setting, must be one of:
   * * `DANISH`
   * * `GERMAN`
   * * `ENGLISH_UK`
   * * `ENGLISH_US`
   * * `SPANISH`
   * * `FRENCH`
   * * `CROATIAN`
   * * `ITALIAN`
   * * `LITHUANIAN`
   * * `HUNGARIAN`
   * * `DUTCH`
   * * `NORWEGIAN`
   * * `POLISH`
   * * `BRAZILIAN_PORTUGUESE`
   * * `ROMANIA_ROMANIAN`
   * * `FINNISH`
   * * `SWEDISH`
   * * `VIETNAMESE`
   * * `TURKISH`
   * * `CZECH`
   * * `GREEK`
   * * `BULGARIAN`
   * * `RUSSIAN`
   * * `UKRAINIAN`
   * * `HINDI`
   * * `THAI`
   * * `CHINA_CHINESE`
   * * `JAPANESE`
   * * `TAIWAN_CHINESE`
   * * `KOREAN`
   * @param {localeSetting} value Locale to set
   * @returns {locale}
   */
  async setLocale(value) {
    if (typeof value !== 'string') {
      throw new TypeError('INVALID_TYPE', 'value', 'string', true);
    }
    if (!localeSetting[value]) throw new Error('INVALID_LOCALE');
    if (localeSetting[value] !== this.locale) {
      await this.edit({ locale: localeSetting[value] });
    }
    return this.locale;
  }
  // TODO: Guild positions & folders
  // Change Index in Array [Hidden]
  /**
   *
   * @param {Array} array Array
   * @param {number} from Index1
   * @param {number} to Index2
   * @returns {Array}
   * @private
   */
  _move(array, from, to) {
    array.splice(to, 0, array.splice(from, 1)[0]);
    return array;
  }
  // TODO: Move Guild
  // folder to folder
  // folder to home
  // home to home
  // home to folder
  /**
   * Change Guild Position (from * to Folder or Home)
   * @param {GuildIDResolve} guildId guild.id
   * @param {number} newPosition Guild Position
   * * **WARNING**: Type = `FOLDER`, newPosition is the guild's index in the Folder.
   * @param {number} type Move to folder or home
   * * `FOLDER`: 1
   * * `HOME`: 2
   * @param {FolderID} folderId If you want to move to folder
   * @private
   */
  guildChangePosition(guildId, newPosition, type, folderId) {
    // Get Guild default position
    // Escape
    const oldGuildFolderPosition = this.rawSetting.guild_folders.findIndex(value => value.guild_ids.includes(guildId));
    const newGuildFolderPosition = this.rawSetting.guild_folders.findIndex(value =>
      value.guild_ids.includes(this.rawSetting.guild_positions[newPosition]),
    );
    if (type == 2 || `${type}`.toUpperCase() == 'HOME') {
      // Delete GuildID from Folder and create new Folder
      // Check it is folder
      const folder = this.rawSetting.guild_folders[oldGuildFolderPosition];
      if (folder.id) {
        this.rawSetting.guild_folders[oldGuildFolderPosition].guild_ids = this.rawSetting.guild_folders[
          oldGuildFolderPosition
        ].guild_ids.filter(v => v !== guildId);
      }
      this.rawSetting.guild_folders = this._move(
        this.rawSetting.guild_folders,
        oldGuildFolderPosition,
        newGuildFolderPosition,
      );
      this.rawSetting.guild_folders[newGuildFolderPosition].id = null;
    } else if (type == 1 || `${type}`.toUpperCase() == 'FOLDER') {
      // Delete GuildID from oldFolder
      this.rawSetting.guild_folders[oldGuildFolderPosition].guild_ids = this.rawSetting.guild_folders[
        oldGuildFolderPosition
      ].guild_ids.filter(v => v !== guildId);
      // Index new Folder
      const folderIndex = this.rawSetting.guild_folders.findIndex(value => value.id == folderId);
      const folder = this.rawSetting.guild_folders[folderIndex];
      folder.guild_ids.push(guildId);
      folder.guild_ids = [...new Set(folder.guild_ids)];
      folder.guild_ids = this._move(
        folder.guild_ids,
        folder.guild_ids.findIndex(v => v == guildId),
        newPosition,
      );
    }
    this.edit({ guild_folders: this.rawSetting.guild_folders });
  }

  /**
   * Restricted guilds setting
   * @param {boolean} status Restricted status
   * @returns {Promise}
   */
  restrictedGuilds(status) {
    if (typeof status !== 'boolean') {
      throw new TypeError('INVALID_TYPE', 'status', 'boolean', true);
    }
    return this.edit({
      default_guilds_restricted: status,
      restricted_guilds: status ? this.client.guilds.cache.map(v => v.id) : [],
    });
  }
  /**
   * Add a guild to the list of restricted guilds.
   * @param {GuildIDResolve} guildId The guild to add
   * @returns {Promise}
   */
  addRestrictedGuild(guildId) {
    const temp = Object.assign(
      [],
      this.disableDMfromServer.map((v, k) => k),
    );
    if (temp.includes(guildId)) throw new Error('Guild is already restricted');
    temp.push(guildId);
    return this.edit({ restricted_guilds: temp });
  }

  /**
   * Remove a guild from the list of restricted guilds.
   * @param {GuildIDResolve} guildId The guild to remove
   * @returns {Promise}
   */
  removeRestrictedGuild(guildId) {
    if (!this.disableDMfromServer.delete(guildId)) throw new Error('Guild is already restricted');
    return this.edit({ restricted_guilds: this.disableDMfromServer.map((v, k) => k) });
  }
}

module.exports = ClientSettingManager;
