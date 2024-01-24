'use strict';

const BaseManager = require('./BaseManager');
/**
 * Manages API methods for users and stores their cache.
 * @extends {BaseManager}
 * @see {@link https://luna.gitlab.io/discord-unofficial-docs/user_settings.html}
 */
class GuildSettingManager extends BaseManager {
  #rawSetting = {};
  constructor(guild) {
    super(guild.client);
    /**
     * Guild Id
     * @type {?Snowflake}
     */
    this.guildId = guild.id;
  }

  /**
   * Raw data
   * @type {Object}
   */
  get raw() {
    return this.#rawSetting;
  }

  /**
   * Get the guild
   * @type {?Guild}
   * @readonly
   */
  get guild() {
    return this.client.guilds.cache.get(this.guildId);
  }

  /**
   * Patch data file
   * @private
   * @param {Object} data Raw Data to patch
   */
  _patch(data = {}) {
    this.#rawSetting = Object.assign(this.#rawSetting, data);
    this.client.emit('debug', `[SETTING > Guild ${this.guildId}] Sync setting`);
    if ('suppress_everyone' in data) {
      /**
       * Notification setting > Suppress `@everyone` and `@here`
       * @type {?boolean}
       */
      this.suppressEveryone = data.suppress_everyone;
    }
    if ('suppress_roles' in data) {
      /**
       * Notification setting > Suppress all role `@mention`
       * @type {?boolean}
       */
      this.suppressRoles = data.suppress_roles;
    }
    if ('mute_scheduled_events' in data) {
      /**
       * Notification setting > Mute new events
       * @type {?boolean}
       */
      this.muteScheduledEvents = data.mute_scheduled_events;
    }
    if ('message_notifications' in data) {
      /**
       * Notification setting > Message notifications
       * * `0`: All messages
       * * `1`: Only @mentions
       * * `2`: Nothing
       * @type {?number}
       */
      this.messageNotifications = data.message_notifications;
    }
    if ('flags' in data) {
      /**
       * Flags (unknown)
       * @type {?number}
       */
      this.flags = data.flags;
    }
    if ('mobile_push' in data) {
      /**
       * Notification setting > Mobile push notifications
       * @type {?boolean}
       */
      this.mobilePush = data.mobile_push;
    }
    if ('muted' in data) {
      /**
       * Mute server
       * @type {?boolean}
       */
      this.muted = data.muted;
    }
    if ('mute_config' in data && data.mute_config !== null) {
      /**
       * Mute config (muted = true)
       * * `muteConfig.endTime`: End time (Date)
       * * `muteConfig.selectedTimeWindow`: Selected time window (seconds) (number)
       * @type {?Object}
       */
      this.muteConfig = {
        endTime: new Date(data.mute_config.end_time),
        selectedTimeWindow: data.mute_config.selected_time_window,
      };
    } else {
      this.muteConfig = null;
    }
    if ('hide_muted_channels' in data) {
      /**
       * Hide muted channels
       * @type {?boolean}
       */
      this.hideMutedChannels = data.hide_muted_channels;
    }
    if ('channel_overrides' in data) {
      /**
       * Channel overrides (unknown)
       * @type {?Array}
       */
      this.channelOverrides = data.channel_overrides;
    }
    if ('notify_highlights' in data) {
      /**
       * Notification setting > Suppress highlights
       * * `0`: ??? (unknown)
       * * `1`: Enable
       * * `2`: Disable
       * @type {?number}
       */
      this.notifyHighlights = data.notify_highlights;
    }
    if ('version' in data) {
      /**
       * Version (unknown)
       * @type {?number}
       */
      this.version = data.version;
    }
  }
  /**
   * Edit guild settings
   * @param {Object} data Data to edit
   * @returns {Promise<GuildSettingManager>}
   */
  async edit(data) {
    const data_ = await this.client.api.users('@me').settings.patch(data);
    this._patch(data_);
    return this;
  }
}

module.exports = GuildSettingManager;
