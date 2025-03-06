'use strict';

const process = require('node:process');
const { Collection } = require('@discordjs/collection');
const AnonymousGuild = require('./AnonymousGuild');
const GuildAuditLogs = require('./GuildAuditLogs');
const GuildPreview = require('./GuildPreview');
const GuildTemplate = require('./GuildTemplate');
const Integration = require('./Integration');
const Webhook = require('./Webhook');
const WelcomeScreen = require('./WelcomeScreen');
const { Error } = require('../errors');
const AutoModerationRuleManager = require('../managers/AutoModerationRuleManager');
const GuildBanManager = require('../managers/GuildBanManager');
const GuildChannelManager = require('../managers/GuildChannelManager');
const GuildEmojiManager = require('../managers/GuildEmojiManager');
const GuildInviteManager = require('../managers/GuildInviteManager');
const GuildMemberManager = require('../managers/GuildMemberManager');
const GuildScheduledEventManager = require('../managers/GuildScheduledEventManager');
const GuildSettingManager = require('../managers/GuildSettingManager');
const GuildStickerManager = require('../managers/GuildStickerManager');
const PresenceManager = require('../managers/PresenceManager');
const RoleManager = require('../managers/RoleManager');
const StageInstanceManager = require('../managers/StageInstanceManager');
const VoiceStateManager = require('../managers/VoiceStateManager');
const {
  ChannelTypes,
  DefaultMessageNotificationLevels,
  VerificationLevels,
  ExplicitContentFilterLevels,
  Status,
  MFALevels,
  PremiumTiers,
} = require('../util/Constants');
const DataResolver = require('../util/DataResolver');
const SystemChannelFlags = require('../util/SystemChannelFlags');
const Util = require('../util/Util');

let deprecationEmittedForSetChannelPositions = false;
let deprecationEmittedForSetRolePositions = false;
let deprecationEmittedForDeleted = false;
let deprecationEmittedForMe = false;

/**
 * @type {WeakSet<Guild>}
 * @private
 * @internal
 */
const deletedGuilds = new WeakSet();

/**
 * Represents a guild (or a server) on Discord.
 * <info>It's recommended to see if a guild is available before performing operations or reading data from it. You can
 * check this with {@link Guild#available}.</info>
 * @extends {AnonymousGuild}
 */
class Guild extends AnonymousGuild {
  constructor(client, data) {
    super(client, data, false);

    /**
     * A manager of the members belonging to this guild
     * @type {GuildMemberManager}
     */
    this.members = new GuildMemberManager(this);

    /**
     * A manager of the channels belonging to this guild
     * @type {GuildChannelManager}
     */
    this.channels = new GuildChannelManager(this);

    /**
     * A manager of the bans belonging to this guild
     * @type {GuildBanManager}
     */
    this.bans = new GuildBanManager(this);

    /**
     * A manager of the roles belonging to this guild
     * @type {RoleManager}
     */
    this.roles = new RoleManager(this);

    /**
     * A manager of the presences belonging to this guild
     * @type {PresenceManager}
     */
    this.presences = new PresenceManager(this.client);

    /**
     * A manager of the voice states of this guild
     * @type {VoiceStateManager}
     */
    this.voiceStates = new VoiceStateManager(this);

    /**
     * A manager of the stage instances of this guild
     * @type {StageInstanceManager}
     */
    this.stageInstances = new StageInstanceManager(this);

    /**
     * A manager of the invites of this guild
     * @type {GuildInviteManager}
     */
    this.invites = new GuildInviteManager(this);

    /**
     * A manager of the scheduled events of this guild
     * @type {GuildScheduledEventManager}
     */
    this.scheduledEvents = new GuildScheduledEventManager(this);

    /**
     * A manager of the auto moderation rules of this guild.
     * @type {AutoModerationRuleManager}
     */
    this.autoModerationRules = new AutoModerationRuleManager(this);

    /**
     * All of the settings {@link Object}
     * @type {GuildSettingManager}
     */
    this.settings = new GuildSettingManager(this.client, this.id);

    if (!data) return;
    if (data.unavailable) {
      /**
       * Whether the guild is available to access. If it is not available, it indicates a server outage
       * @type {boolean}
       */
      this.available = false;
    } else {
      this._patch(data);
      if (!data.channels) this.available = false;
    }

    /**
     * The id of the shard this Guild belongs to.
     * @type {number}
     */
    this.shardId = data.shardId;
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
        'Guild#deleted is deprecated, see https://github.com/discordjs/discord.js/issues/7091.',
        'DeprecationWarning',
      );
    }

    return deletedGuilds.has(this);
  }

  set deleted(value) {
    if (!deprecationEmittedForDeleted) {
      deprecationEmittedForDeleted = true;
      process.emitWarning(
        'Guild#deleted is deprecated, see https://github.com/discordjs/discord.js/issues/7091.',
        'DeprecationWarning',
      );
    }

    if (value) deletedGuilds.add(this);
    else deletedGuilds.delete(this);
  }

  /**
   * The read state for the guild home
   * @type {ReadState}
   * @readonly
   */
  get homeReadState() {
    return this.client.readStates.get(this.id, { type: 'GUILD_HOME' });
  }
  

  /**
   * The read state for the onboarding questions
   * @type {ReadState}
   * @readonly
   */
  get onboardingQuestionReadState() {
    return this.client.readStates.get(this.id, { type: 'GUILD_ONBOARDING_QUESTION' });
  }
  
  /**
   * The Shard this Guild belongs to.
   * @type {WebSocketShard}
   * @readonly
   */
  get shard() {
    return this.client.ws.shards.get(this.shardId);
  }

  _patch(data) {
    super._patch(data);
    this.id = data.id;
    if ('name' in data) this.name = data.name;
    if ('icon' in data) this.icon = data.icon;
    if ('unavailable' in data) {
      this.available = !data.unavailable;
    } else {
      this.available ??= true;
    }

    if ('discovery_splash' in data) {
      /**
       * The hash of the guild discovery splash image
       * @type {?string}
       */
      this.discoverySplash = data.discovery_splash;
    }

    if ('member_count' in data) {
      /**
       * The full amount of members in this guild
       * @type {number}
       */
      this.memberCount = data.member_count;
    }

    if ('large' in data) {
      /**
       * Whether the guild is "large" (has more than {@link WebsocketOptions large_threshold} members, 50 by default)
       * @type {boolean}
       */
      this.large = Boolean(data.large);
    }

    if ('premium_progress_bar_enabled' in data) {
      /**
       * Whether this guild has its premium (boost) progress bar enabled
       * @type {boolean}
       */
      this.premiumProgressBarEnabled = data.premium_progress_bar_enabled;
    }

    /**
     * An array of enabled guild features, here are the possible values:
     * * ANIMATED_ICON
     * * AUTO_MODERATION
     * * BANNER
     * * COMMERCE
     * * COMMUNITY
     * * CREATOR_MONETIZABLE_PROVISIONAL
     * * CREATOR_STORE_PAGE
     * * DISCOVERABLE
     * * FEATURABLE
     * * INVITES_DISABLED
     * * INVITE_SPLASH
     * * MEMBER_VERIFICATION_GATE_ENABLED
     * * NEWS
     * * PARTNERED
     * * PREVIEW_ENABLED
     * * VANITY_URL
     * * VERIFIED
     * * VIP_REGIONS
     * * WELCOME_SCREEN_ENABLED
     * * TICKETED_EVENTS_ENABLED
     * * MONETIZATION_ENABLED
     * <warn>`MONETIZATION_ENABLED` has been replaced.
     * See [this pull request](https://github.com/discord/discord-api-docs/pull/5724) for more information.</warn>
     * * MORE_STICKERS
     * * THREE_DAY_THREAD_ARCHIVE
     * * SEVEN_DAY_THREAD_ARCHIVE
     * * PRIVATE_THREADS
     * * ROLE_ICONS
     * * RAID_ALERTS_DISABLED
     * * ROLE_SUBSCRIPTIONS_AVAILABLE_FOR_PURCHASE
     * * ROLE_SUBSCRIPTIONS_ENABLED
     * @typedef {string} Features
     * @see {@link https://discord.com/developers/docs/resources/guild#guild-object-guild-features}
     */

    if ('application_id' in data) {
      /**
       * The id of the application that created this guild (if applicable)
       * @type {?Snowflake}
       */
      this.applicationId = data.application_id;
    }

    if ('afk_timeout' in data) {
      /**
       * The time in seconds before a user is counted as "away from keyboard"
       * @type {?number}
       */
      this.afkTimeout = data.afk_timeout;
    }

    if ('afk_channel_id' in data) {
      /**
       * The id of the voice channel where AFK members are moved
       * @type {?Snowflake}
       */
      this.afkChannelId = data.afk_channel_id;
    }

    if ('system_channel_id' in data) {
      /**
       * The system channel's id
       * @type {?Snowflake}
       */
      this.systemChannelId = data.system_channel_id;
    }

    if ('premium_tier' in data) {
      /**
       * The premium tier of this guild
       * @type {PremiumTier}
       */
      this.premiumTier = PremiumTiers[data.premium_tier];
    }

    if ('widget_enabled' in data) {
      /**
       * Whether widget images are enabled on this guild
       * @type {?boolean}
       */
      this.widgetEnabled = data.widget_enabled;
    }

    if ('widget_channel_id' in data) {
      /**
       * The widget channel's id, if enabled
       * @type {?string}
       */
      this.widgetChannelId = data.widget_channel_id;
    }

    if ('explicit_content_filter' in data) {
      /**
       * The explicit content filter level of the guild
       * @type {ExplicitContentFilterLevel}
       */
      this.explicitContentFilter = ExplicitContentFilterLevels[data.explicit_content_filter];
    }

    if ('mfa_level' in data) {
      /**
       * The required MFA level for this guild
       * @type {MFALevel}
       */
      this.mfaLevel = MFALevels[data.mfa_level];
    }

    if ('joined_at' in data) {
      /**
       * The timestamp the client user joined the guild at
       * @type {number}
       */
      this.joinedTimestamp = new Date(data.joined_at).getTime();
    }

    if ('default_message_notifications' in data) {
      /**
       * The default message notification level of the guild
       * @type {DefaultMessageNotificationLevel}
       */
      this.defaultMessageNotifications = DefaultMessageNotificationLevels[data.default_message_notifications];
    }

    if ('system_channel_flags' in data) {
      /**
       * The value set for the guild's system channel flags
       * @type {Readonly<SystemChannelFlags>}
       */
      this.systemChannelFlags = new SystemChannelFlags(data.system_channel_flags).freeze();
    }

    if ('max_members' in data) {
      /**
       * The maximum amount of members the guild can have
       * @type {?number}
       */
      this.maximumMembers = data.max_members;
    } else {
      this.maximumMembers ??= null;
    }

    if ('max_presences' in data) {
      /**
       * The maximum amount of presences the guild can have
       * <info>You will need to fetch the guild using {@link Guild#fetch} if you want to receive this parameter</info>
       * @type {?number}
       */
      this.maximumPresences = data.max_presences ?? 25_000;
    } else {
      this.maximumPresences ??= null;
    }

    if ('max_video_channel_users' in data) {
      /**
       * The maximum amount of users allowed in a video channel.
       * @type {?number}
       */
      this.maxVideoChannelUsers = data.max_video_channel_users;
    } else {
      this.maxVideoChannelUsers ??= null;
    }

    if ('max_stage_video_channel_users' in data) {
      /**
       * The maximum amount of users allowed in a stage video channel.
       * @type {?number}
       */
      this.maxStageVideoChannelUsers = data.max_stage_video_channel_users;
    } else {
      this.maxStageVideoChannelUsers ??= null;
    }

    if ('approximate_member_count' in data) {
      /**
       * The approximate amount of members the guild has
       * <info>You will need to fetch the guild using {@link Guild#fetch} if you want to receive this parameter</info>
       * @type {?number}
       */
      this.approximateMemberCount = data.approximate_member_count;
    } else {
      this.approximateMemberCount ??= null;
    }

    if ('approximate_presence_count' in data) {
      /**
       * The approximate amount of presences the guild has
       * <info>You will need to fetch the guild using {@link Guild#fetch} if you want to receive this parameter</info>
       * @type {?number}
       */
      this.approximatePresenceCount = data.approximate_presence_count;
    } else {
      this.approximatePresenceCount ??= null;
    }

    /**
     * The use count of the vanity URL code of the guild, if any
     * <info>You will need to fetch this parameter using {@link Guild#fetchVanityData} if you want to receive it</info>
     * @type {?number}
     */
    this.vanityURLUses ??= null;

    if ('rules_channel_id' in data) {
      /**
       * The rules channel's id for the guild
       * @type {?Snowflake}
       */
      this.rulesChannelId = data.rules_channel_id;
    }

    if ('public_updates_channel_id' in data) {
      /**
       * The community updates channel's id for the guild
       * @type {?Snowflake}
       */
      this.publicUpdatesChannelId = data.public_updates_channel_id;
    }

    if ('preferred_locale' in data) {
      /**
       * The preferred locale of the guild, defaults to `en-US`
       * @type {Locale}
       * @see {@link https://discord.com/developers/docs/reference#locales}
       */
      this.preferredLocale = data.preferred_locale;
    }

    if ('safety_alerts_channel_id' in data) {
      /**
       * The safety alerts channel's id for the guild
       * @type {?Snowflake}
       */
      this.safetyAlertsChannelId = data.safety_alerts_channel_id;
    } else {
      this.safetyAlertsChannelId ??= null;
    }

    if (data.channels) {
      this.channels.cache.clear();
      for (const rawChannel of data.channels) {
        this.client.channels._add(rawChannel, this);
      }
    }

    if (data.threads) {
      for (const rawThread of data.threads) {
        this.client.channels._add(rawThread, this);
      }
    }

    if (data.roles) {
      this.roles.cache.clear();
      for (const role of data.roles) this.roles._add(role);
    }

    if (data.members) {
      this.members.cache.clear();
      for (const guildUser of data.members) this.members._add(guildUser);
    }

    if ('owner_id' in data) {
      /**
       * The user id of this guild's owner
       * @type {Snowflake}
       */
      this.ownerId = data.owner_id;
    }

    if (data.presences) {
      for (const presence of data.presences) {
        this.presences._add(Object.assign(presence, { guild: this }));
      }
    }

    if (data.stage_instances) {
      this.stageInstances.cache.clear();
      for (const stageInstance of data.stage_instances) {
        this.stageInstances._add(stageInstance);
      }
    }

    if (data.guild_scheduled_events) {
      this.scheduledEvents.cache.clear();
      for (const scheduledEvent of data.guild_scheduled_events) {
        this.scheduledEvents._add(scheduledEvent);
      }
    }

    if (data.voice_states) {
      this.voiceStates.cache.clear();
      for (const voiceState of data.voice_states) {
        this.voiceStates._add(voiceState);
      }
    }

    if (!this.emojis) {
      /**
       * A manager of the emojis belonging to this guild
       * @type {GuildEmojiManager}
       */
      this.emojis = new GuildEmojiManager(this);
      if (data.emojis) for (const emoji of data.emojis) this.emojis._add(emoji);
    } else if (data.emojis) {
      this.client.actions.GuildEmojisUpdate.handle({
        guild_id: this.id,
        emojis: data.emojis,
      });
    }

    if (!this.stickers) {
      /**
       * A manager of the stickers belonging to this guild
       * @type {GuildStickerManager}
       */
      this.stickers = new GuildStickerManager(this);
      if (data.stickers) for (const sticker of data.stickers) this.stickers._add(sticker);
    } else if (data.stickers) {
      this.client.actions.GuildStickersUpdate.handle({
        guild_id: this.id,
        stickers: data.stickers,
      });
    }

    if ('incidents_data' in data) {
      /**
       * Incident actions of a guild.
       * @typedef {Object} IncidentActions
       * @property {?Date} invitesDisabledUntil When invites would be enabled again
       * @property {?Date} dmsDisabledUntil When direct messages would be enabled again
       * @property {?Date} dmSpamDetectedAt When direct message spam was detected
       * @property {?Date} raidDetectedAt When a raid was detected
       */

      /**
       * The incidents data of this guild.
       * <info>You will need to fetch the guild using {@link BaseGuild#fetch} if you want to receive
       * this property.</info>
       * @type {?IncidentActions}
       */
      this.incidentsData = data.incidents_data && Util.transformAPIIncidentsData(data.incidents_data);
    } else {
      this.incidentsData ??= null;
    }
  }

  /**
   * The time the client user joined the guild
   * @type {Date}
   * @readonly
   */
  get joinedAt() {
    return new Date(this.joinedTimestamp);
  }

  /**
   * The URL to this guild's discovery splash image.
   * @param {StaticImageURLOptions} [options={}] Options for the Image URL
   * @returns {?string}
   */
  discoverySplashURL({ format, size } = {}) {
    return this.discoverySplash && this.client.rest.cdn.DiscoverySplash(this.id, this.discoverySplash, format, size);
  }

  /**
   * Fetches the owner of the guild.
   * If the member object isn't needed, use {@link Guild#ownerId} instead.
   * @param {BaseFetchOptions} [options] The options for fetching the member
   * @returns {Promise<GuildMember>}
   */
  fetchOwner(options) {
    return this.members.fetch({ ...options, user: this.ownerId });
  }

  /**
   * AFK voice channel for this guild
   * @type {?VoiceChannel}
   * @readonly
   */
  get afkChannel() {
    return this.client.channels.resolve(this.afkChannelId);
  }

  /**
   * System channel for this guild
   * @type {?TextChannel}
   * @readonly
   */
  get systemChannel() {
    return this.client.channels.resolve(this.systemChannelId);
  }

  /**
   * Safety alerts channel for this guild
   * @type {?TextChannel}
   * @readonly
   */
  get safetyAlertsChannel() {
    return this.client.channels.resolve(this.safetyAlertsChannelId);
  }

  /**
   * Widget channel for this guild
   * @type {?(TextChannel|NewsChannel|VoiceChannel|StageChannel|ForumChannel|MediaChannel)}
   * @readonly
   */
  get widgetChannel() {
    return this.client.channels.resolve(this.widgetChannelId);
  }

  /**
   * Rules channel for this guild
   * @type {?TextChannel}
   * @readonly
   */
  get rulesChannel() {
    return this.client.channels.resolve(this.rulesChannelId);
  }

  /**
   * Public updates channel for this guild
   * @type {?TextChannel}
   * @readonly
   */
  get publicUpdatesChannel() {
    return this.client.channels.resolve(this.publicUpdatesChannelId);
  }

  /**
   * The client user as a GuildMember of this guild
   * @type {?GuildMember}
   * @deprecated Use {@link GuildMemberManager#me} instead.
   * @readonly
   */
  get me() {
    if (!deprecationEmittedForMe) {
      process.emitWarning('Guild#me is deprecated. Use Guild#members#me instead.', 'DeprecationWarning');
      deprecationEmittedForMe = true;
    }

    return this.members.me;
  }

  /**
   * The maximum bitrate available for this guild
   * @type {number}
   * @readonly
   */
  get maximumBitrate() {
    if (this.features.includes('VIP_REGIONS')) {
      return 384_000;
    }

    switch (PremiumTiers[this.premiumTier]) {
      case PremiumTiers.TIER_1:
        return 128_000;
      case PremiumTiers.TIER_2:
        return 256_000;
      case PremiumTiers.TIER_3:
        return 384_000;
      default:
        return 96_000;
    }
  }

  /**
   * Fetches a collection of integrations to this guild.
   * Resolves with a collection mapping integrations by their ids.
   * @returns {Promise<Collection<Snowflake|string, Integration>>}
   * @example
   * // Fetch integrations
   * guild.fetchIntegrations()
   *   .then(integrations => console.log(`Fetched ${integrations.size} integrations`))
   *   .catch(console.error);
   */
  async fetchIntegrations() {
    const data = await this.client.api.guilds(this.id).integrations.get();
    return data.reduce(
      (collection, integration) => collection.set(integration.id, new Integration(this.client, integration, this)),
      new Collection(),
    );
  }

  /**
   * Fetches a collection of templates from this guild.
   * Resolves with a collection mapping templates by their codes.
   * @returns {Promise<Collection<string, GuildTemplate>>}
   */
  async fetchTemplates() {
    const templates = await this.client.api.guilds(this.id).templates.get();
    return templates.reduce((col, data) => col.set(data.code, new GuildTemplate(this.client, data)), new Collection());
  }

  /**
   * Fetches the welcome screen for this guild.
   * @returns {Promise<WelcomeScreen>}
   */
  async fetchWelcomeScreen() {
    const data = await this.client.api.guilds(this.id, 'welcome-screen').get();
    return new WelcomeScreen(this, data);
  }

  /**
   * Creates a template for the guild.
   * @param {string} name The name for the template
   * @param {string} [description] The description for the template
   * @returns {Promise<GuildTemplate>}
   */
  async createTemplate(name, description) {
    const data = await this.client.api.guilds(this.id).templates.post({ data: { name, description } });
    return new GuildTemplate(this.client, data);
  }

  /**
   * Obtains a guild preview for this guild from Discord.
   * @returns {Promise<GuildPreview>}
   */
  async fetchPreview() {
    const data = await this.client.api.guilds(this.id).preview.get();
    return new GuildPreview(this.client, data);
  }

  /**
   * An object containing information about a guild's vanity invite.
   * @typedef {Object} Vanity
   * @property {?string} code Vanity invite code
   * @property {number} uses How many times this invite has been used
   */

  /**
   * Fetches the vanity URL invite object to this guild.
   * Resolves with an object containing the vanity URL invite code and the use count
   * @returns {Promise<Vanity>}
   * @example
   * // Fetch invite data
   * guild.fetchVanityData()
   *   .then(res => {
   *     console.log(`Vanity URL: https://discord.gg/${res.code} with ${res.uses} uses`);
   *   })
   *   .catch(console.error);
   */
  async fetchVanityData() {
    const data = await this.client.api.guilds(this.id, 'vanity-url').get();
    this.vanityURLCode = data.code;
    this.vanityURLUses = data.uses;

    return data;
  }

  /**
   * Fetches all webhooks for the guild.
   * @returns {Promise<Collection<Snowflake, Webhook>>}
   * @example
   * // Fetch webhooks
   * guild.fetchWebhooks()
   *   .then(webhooks => console.log(`Fetched ${webhooks.size} webhooks`))
   *   .catch(console.error);
   */
  async fetchWebhooks() {
    const apiHooks = await this.client.api.guilds(this.id).webhooks.get();
    const hooks = new Collection();
    for (const hook of apiHooks) hooks.set(hook.id, new Webhook(this.client, hook));
    return hooks;
  }

  /**
   * Fetches the guild widget data, requires the widget to be enabled.
   * @returns {Promise<Widget>}
   * @example
   * // Fetches the guild widget data
   * guild.fetchWidget()
   *   .then(widget => console.log(`The widget shows ${widget.channels.size} channels`))
   *   .catch(console.error);
   */
  fetchWidget() {
    return this.client.fetchGuildWidget(this.id);
  }

  /**
   * Data for the Guild Widget Settings object
   * @typedef {Object} GuildWidgetSettings
   * @property {boolean} enabled Whether the widget is enabled
   * @property {?GuildChannel} channel The widget invite channel
   */

  /**
   * The Guild Widget Settings object
   * @typedef {Object} GuildWidgetSettingsData
   * @property {boolean} enabled Whether the widget is enabled
   * @property {?GuildChannelResolvable} channel The widget invite channel
   */

  /**
   * Fetches the guild widget settings.
   * @returns {Promise<GuildWidgetSettings>}
   * @example
   * // Fetches the guild widget settings
   * guild.fetchWidgetSettings()
   *   .then(widget => console.log(`The widget is ${widget.enabled ? 'enabled' : 'disabled'}`))
   *   .catch(console.error);
   */
  async fetchWidgetSettings() {
    const data = await this.client.api.guilds(this.id).widget.get();
    this.widgetEnabled = data.enabled;
    this.widgetChannelId = data.channel_id;
    return {
      enabled: data.enabled,
      channel: data.channel_id ? this.channels.cache.get(data.channel_id) : null,
    };
  }

  /**
   * Options used to fetch audit logs.
   * @typedef {Object} GuildAuditLogsFetchOptions
   * @property {Snowflake|GuildAuditLogsEntry} [before] Consider only entries before this entry
   * @property {Snowflake|GuildAuditLogsEntry} [after] Consider only entries after this entry
   * @property {number} [limit] The number of entries to return
   * @property {UserResolvable} [user] Only return entries for actions made by this user
   * @property {AuditLogAction|number} [type] Only return entries for this action type
   */

  /**
   * Fetches audit logs for this guild.
   * @param {GuildAuditLogsFetchOptions} [options={}] Options for fetching audit logs
   * @returns {Promise<GuildAuditLogs>}
   * @example
   * // Output audit log entries
   * guild.fetchAuditLogs()
   *   .then(audit => console.log(audit.entries.first()))
   *   .catch(console.error);
   */
  async fetchAuditLogs({ before, after, limit, user, type } = {}) {
    const data = await this.client.api.guilds(this.id)['audit-logs'].get({
      query: {
        before: before?.id ?? before,
        after: after?.id ?? after,
        limit,
        user_id: this.client.users.resolveId(user),
        action_type: typeof type === 'string' ? GuildAuditLogs.Actions[type] : type,
      },
    });

    return GuildAuditLogs.build(this, data);
  }

  /**
   * The data for editing a guild.
   * @typedef {Object} GuildEditData
   * @property {string} [name] The name of the guild
   * @property {?(VerificationLevel|number)} [verificationLevel] The verification level of the guild
   * @property {?(ExplicitContentFilterLevel|number)} [explicitContentFilter] The level of the explicit content filter
   * @property {?VoiceChannelResolvable} [afkChannel] The AFK channel of the guild
   * @property {?TextChannelResolvable} [systemChannel] The system channel of the guild
   * @property {number} [afkTimeout] The AFK timeout of the guild
   * @property {?(BufferResolvable|Base64Resolvable)} [icon] The icon of the guild
   * @property {GuildMemberResolvable} [owner] The owner of the guild
   * @property {?(BufferResolvable|Base64Resolvable)} [splash] The invite splash image of the guild
   * @property {?(BufferResolvable|Base64Resolvable)} [discoverySplash] The discovery splash image of the guild
   * @property {?(BufferResolvable|Base64Resolvable)} [banner] The banner of the guild
   * @property {?(DefaultMessageNotificationLevel|number)} [defaultMessageNotifications] The default message
   * notification level of the guild
   * @property {SystemChannelFlagsResolvable} [systemChannelFlags] The system channel flags of the guild
   * @property {?TextChannelResolvable} [rulesChannel] The rules channel of the guild
   * @property {?TextChannelResolvable} [publicUpdatesChannel] The community updates channel of the guild
   * @property {?string} [preferredLocale] The preferred locale of the guild
   * @property {?TextChannelResolvable} [safetyAlertsChannel] The safety alerts channel of the guild
   * @property {boolean} [premiumProgressBarEnabled] Whether the guild's premium progress bar is enabled
   * @property {?string} [description] The discovery description of the guild
   * @property {Features[]} [features] The features of the guild
   */

  /**
   * Data that can be resolved to a Text Channel object. This can be:
   * * A TextChannel
   * * A Snowflake
   * @typedef {TextChannel|Snowflake} TextChannelResolvable
   */

  /**
   * Data that can be resolved to a Voice Channel object. This can be:
   * * A VoiceChannel
   * * A Snowflake
   * @typedef {VoiceChannel|Snowflake} VoiceChannelResolvable
   */

  /**
   * Updates the guild with new information - e.g. a new name.
   * @param {GuildEditData} data The data to update the guild with
   * @param {string} [reason] Reason for editing this guild
   * @returns {Promise<Guild>}
   * @example
   * // Set the guild name
   * guild.edit({
   *   name: 'Discord Guild',
   * })
   *   .then(updated => console.log(`New guild name ${updated}`))
   *   .catch(console.error);
   */
  async edit(data, reason) {
    const _data = {};
    if (data.name) _data.name = data.name;
    if (typeof data.verificationLevel !== 'undefined') {
      _data.verification_level =
        typeof data.verificationLevel === 'number'
          ? data.verificationLevel
          : VerificationLevels[data.verificationLevel];
    }
    if (typeof data.afkChannel !== 'undefined') {
      _data.afk_channel_id = this.client.channels.resolveId(data.afkChannel);
    }
    if (typeof data.systemChannel !== 'undefined') {
      _data.system_channel_id = this.client.channels.resolveId(data.systemChannel);
    }
    if (data.afkTimeout) _data.afk_timeout = Number(data.afkTimeout);
    if (typeof data.icon !== 'undefined') _data.icon = await DataResolver.resolveImage(data.icon);
    if (data.owner) _data.owner_id = this.client.users.resolveId(data.owner);
    if (typeof data.splash !== 'undefined') _data.splash = await DataResolver.resolveImage(data.splash);
    if (typeof data.discoverySplash !== 'undefined') {
      _data.discovery_splash = await DataResolver.resolveImage(data.discoverySplash);
    }
    if (typeof data.banner !== 'undefined') _data.banner = await DataResolver.resolveImage(data.banner);
    if (typeof data.explicitContentFilter !== 'undefined') {
      _data.explicit_content_filter =
        typeof data.explicitContentFilter === 'number'
          ? data.explicitContentFilter
          : ExplicitContentFilterLevels[data.explicitContentFilter];
    }
    if (typeof data.defaultMessageNotifications !== 'undefined') {
      _data.default_message_notifications =
        typeof data.defaultMessageNotifications === 'number'
          ? data.defaultMessageNotifications
          : DefaultMessageNotificationLevels[data.defaultMessageNotifications];
    }
    if (typeof data.systemChannelFlags !== 'undefined') {
      _data.system_channel_flags = SystemChannelFlags.resolve(data.systemChannelFlags);
    }
    if (typeof data.rulesChannel !== 'undefined') {
      _data.rules_channel_id = this.client.channels.resolveId(data.rulesChannel);
    }
    if (typeof data.publicUpdatesChannel !== 'undefined') {
      _data.public_updates_channel_id = this.client.channels.resolveId(data.publicUpdatesChannel);
    }
    if (typeof data.features !== 'undefined') {
      _data.features = data.features;
    }
    if (typeof data.description !== 'undefined') {
      _data.description = data.description;
    }
    if (typeof data.preferredLocale !== 'undefined') _data.preferred_locale = data.preferredLocale;
    if (typeof data.safetyAlertsChannel !== 'undefined') {
      _data.safety_alerts_channel_id = this.client.channels.resolveId(data.safetyAlertsChannel);
    }
    if ('premiumProgressBarEnabled' in data) _data.premium_progress_bar_enabled = data.premiumProgressBarEnabled;
    const newData = await this.client.api.guilds(this.id).patch({ data: _data, reason });
    return this.client.actions.GuildUpdate.handle(newData).updated;
  }

  /**
   * Welcome channel data
   * @typedef {Object} WelcomeChannelData
   * @property {string} description The description to show for this welcome channel
   * @property {TextChannel|NewsChannel|StoreChannel|Snowflake} channel The channel to link for this welcome channel
   * @property {EmojiIdentifierResolvable} [emoji] The emoji to display for this welcome channel
   */

  /**
   * Welcome screen edit data
   * @typedef {Object} WelcomeScreenEditData
   * @property {boolean} [enabled] Whether the welcome screen is enabled
   * @property {string} [description] The description for the welcome screen
   * @property {WelcomeChannelData[]} [welcomeChannels] The welcome channel data for the welcome screen
   */

  /**
   * Data that can be resolved to a GuildTextChannel object. This can be:
   * * A TextChannel
   * * A NewsChannel
   * * A Snowflake
   * @typedef {TextChannel|NewsChannel|Snowflake} GuildTextChannelResolvable
   */

  /**
   * Data that can be resolved to a GuildVoiceChannel object. This can be:
   * * A VoiceChannel
   * * A StageChannel
   * * A Snowflake
   * @typedef {VoiceChannel|StageChannel|Snowflake} GuildVoiceChannelResolvable
   */

  /**
   * Updates the guild's welcome screen
   * @param {WelcomeScreenEditData} data Data to edit the welcome screen with
   * @returns {Promise<WelcomeScreen>}
   * @example
   * guild.editWelcomeScreen({
   *   description: 'Hello World',
   *   enabled: true,
   *   welcomeChannels: [
   *     {
   *       description: 'foobar',
   *       channel: '222197033908436994',
   *     }
   *   ],
   * })
   */
  async editWelcomeScreen(data) {
    const { enabled, description, welcomeChannels } = data;
    const welcome_channels = welcomeChannels?.map(welcomeChannelData => {
      const emoji = this.emojis.resolve(welcomeChannelData.emoji);
      return {
        emoji_id: emoji?.id,
        emoji_name: emoji?.name ?? welcomeChannelData.emoji,
        channel_id: this.channels.resolveId(welcomeChannelData.channel),
        description: welcomeChannelData.description,
      };
    });

    const patchData = await this.client.api.guilds(this.id, 'welcome-screen').patch({
      data: {
        welcome_channels,
        description,
        enabled,
      },
    });
    return new WelcomeScreen(this, patchData);
  }

  /**
   * Edits the level of the explicit content filter.
   * @param {?(ExplicitContentFilterLevel|number)} explicitContentFilter The new level of the explicit content filter
   * @param {string} [reason] Reason for changing the level of the guild's explicit content filter
   * @returns {Promise<Guild>}
   */
  setExplicitContentFilter(explicitContentFilter, reason) {
    return this.edit({ explicitContentFilter }, reason);
  }

  /* eslint-disable max-len */
  /**
   * Edits the setting of the default message notifications of the guild.
   * @param {?(DefaultMessageNotificationLevel|number)} defaultMessageNotifications The new default message notification level of the guild
   * @param {string} [reason] Reason for changing the setting of the default message notifications
   * @returns {Promise<Guild>}
   */
  setDefaultMessageNotifications(defaultMessageNotifications, reason) {
    return this.edit({ defaultMessageNotifications }, reason);
  }
  /* eslint-enable max-len */

  /**
   * Edits the flags of the default message notifications of the guild.
   * @param {SystemChannelFlagsResolvable} systemChannelFlags The new flags for the default message notifications
   * @param {string} [reason] Reason for changing the flags of the default message notifications
   * @returns {Promise<Guild>}
   */
  setSystemChannelFlags(systemChannelFlags, reason) {
    return this.edit({ systemChannelFlags }, reason);
  }

  /**
   * Edits the name of the guild.
   * @param {string} name The new name of the guild
   * @param {string} [reason] Reason for changing the guild's name
   * @returns {Promise<Guild>}
   * @example
   * // Edit the guild name
   * guild.setName('Discord Guild')
   *  .then(updated => console.log(`Updated guild name to ${updated.name}`))
   *  .catch(console.error);
   */
  setName(name, reason) {
    return this.edit({ name }, reason);
  }

  /**
   * Edits the verification level of the guild.
   * @param {?(VerificationLevel|number)} verificationLevel The new verification level of the guild
   * @param {string} [reason] Reason for changing the guild's verification level
   * @returns {Promise<Guild>}
   * @example
   * // Edit the guild verification level
   * guild.setVerificationLevel(1)
   *  .then(updated => console.log(`Updated guild verification level to ${guild.verificationLevel}`))
   *  .catch(console.error);
   */
  setVerificationLevel(verificationLevel, reason) {
    return this.edit({ verificationLevel }, reason);
  }

  /**
   * Edits the AFK channel of the guild.
   * @param {?VoiceChannelResolvable} afkChannel The new AFK channel
   * @param {string} [reason] Reason for changing the guild's AFK channel
   * @returns {Promise<Guild>}
   * @example
   * // Edit the guild AFK channel
   * guild.setAFKChannel(channel)
   *  .then(updated => console.log(`Updated guild AFK channel to ${guild.afkChannel.name}`))
   *  .catch(console.error);
   */
  setAFKChannel(afkChannel, reason) {
    return this.edit({ afkChannel }, reason);
  }

  /**
   * Edits the system channel of the guild.
   * @param {?TextChannelResolvable} systemChannel The new system channel
   * @param {string} [reason] Reason for changing the guild's system channel
   * @returns {Promise<Guild>}
   * @example
   * // Edit the guild system channel
   * guild.setSystemChannel(channel)
   *  .then(updated => console.log(`Updated guild system channel to ${guild.systemChannel.name}`))
   *  .catch(console.error);
   */
  setSystemChannel(systemChannel, reason) {
    return this.edit({ systemChannel }, reason);
  }

  /**
   * Edits the AFK timeout of the guild.
   * @param {number} afkTimeout The time in seconds that a user must be idle to be considered AFK
   * @param {string} [reason] Reason for changing the guild's AFK timeout
   * @returns {Promise<Guild>}
   * @example
   * // Edit the guild AFK channel
   * guild.setAFKTimeout(60)
   *  .then(updated => console.log(`Updated guild AFK timeout to ${guild.afkTimeout}`))
   *  .catch(console.error);
   */
  setAFKTimeout(afkTimeout, reason) {
    return this.edit({ afkTimeout }, reason);
  }

  /**
   * Sets a new guild icon.
   * @param {?(Base64Resolvable|BufferResolvable)} icon The new icon of the guild
   * @param {string} [reason] Reason for changing the guild's icon
   * @returns {Promise<Guild>}
   * @example
   * // Edit the guild icon
   * guild.setIcon('./icon.png')
   *  .then(updated => console.log('Updated the guild icon'))
   *  .catch(console.error);
   */
  setIcon(icon, reason) {
    return this.edit({ icon }, reason);
  }

  /**
   * Sets a new owner of the guild.
   * @param {GuildMemberResolvable} owner The new owner of the guild
   * @param {string} [reason] Reason for setting the new owner
   * @returns {Promise<Guild>}
   * @example
   * // Edit the guild owner
   * guild.setOwner(guild.members.cache.first())
   *  .then(guild => guild.fetchOwner())
   *  .then(owner => console.log(`Updated the guild owner to ${owner.displayName}`))
   *  .catch(console.error);
   */
  setOwner(owner, reason) {
    return this.edit({ owner }, reason);
  }

  /**
   * Sets a new guild invite splash image.
   * @param {?(Base64Resolvable|BufferResolvable)} splash The new invite splash image of the guild
   * @param {string} [reason] Reason for changing the guild's invite splash image
   * @returns {Promise<Guild>}
   * @example
   * // Edit the guild splash
   * guild.setSplash('./splash.png')
   *  .then(updated => console.log('Updated the guild splash'))
   *  .catch(console.error);
   */
  setSplash(splash, reason) {
    return this.edit({ splash }, reason);
  }

  /**
   * Sets a new guild discovery splash image.
   * @param {?(Base64Resolvable|BufferResolvable)} discoverySplash The new discovery splash image of the guild
   * @param {string} [reason] Reason for changing the guild's discovery splash image
   * @returns {Promise<Guild>}
   * @example
   * // Edit the guild discovery splash
   * guild.setDiscoverySplash('./discoverysplash.png')
   *   .then(updated => console.log('Updated the guild discovery splash'))
   *   .catch(console.error);
   */
  setDiscoverySplash(discoverySplash, reason) {
    return this.edit({ discoverySplash }, reason);
  }

  /**
   * Sets a new guild banner.
   * @param {?(Base64Resolvable|BufferResolvable)} banner The new banner of the guild
   * @param {string} [reason] Reason for changing the guild's banner
   * @returns {Promise<Guild>}
   * @example
   * guild.setBanner('./banner.png')
   *  .then(updated => console.log('Updated the guild banner'))
   *  .catch(console.error);
   */
  setBanner(banner, reason) {
    return this.edit({ banner }, reason);
  }

  /**
   * Edits the rules channel of the guild.
   * @param {?TextChannelResolvable} rulesChannel The new rules channel
   * @param {string} [reason] Reason for changing the guild's rules channel
   * @returns {Promise<Guild>}
   * @example
   * // Edit the guild rules channel
   * guild.setRulesChannel(channel)
   *  .then(updated => console.log(`Updated guild rules channel to ${guild.rulesChannel.name}`))
   *  .catch(console.error);
   */
  setRulesChannel(rulesChannel, reason) {
    return this.edit({ rulesChannel }, reason);
  }

  /**
   * Edits the community updates channel of the guild.
   * @param {?TextChannelResolvable} publicUpdatesChannel The new community updates channel
   * @param {string} [reason] Reason for changing the guild's community updates channel
   * @returns {Promise<Guild>}
   * @example
   * // Edit the guild community updates channel
   * guild.setPublicUpdatesChannel(channel)
   *  .then(updated => console.log(`Updated guild community updates channel to ${guild.publicUpdatesChannel.name}`))
   *  .catch(console.error);
   */
  setPublicUpdatesChannel(publicUpdatesChannel, reason) {
    return this.edit({ publicUpdatesChannel }, reason);
  }

  /**
   * Edits the preferred locale of the guild.
   * @param {?string} preferredLocale The new preferred locale of the guild
   * @param {string} [reason] Reason for changing the guild's preferred locale
   * @returns {Promise<Guild>}
   * @example
   * // Edit the guild preferred locale
   * guild.setPreferredLocale('en-US')
   *  .then(updated => console.log(`Updated guild preferred locale to ${guild.preferredLocale}`))
   *  .catch(console.error);
   */
  setPreferredLocale(preferredLocale, reason) {
    return this.edit({ preferredLocale }, reason);
  }

  /**
   * Edits the safety alerts channel of the guild.
   * @param {?TextChannelResolvable} safetyAlertsChannel The new safety alerts channel
   * @param {string} [reason] Reason for changing the guild's safety alerts channel
   * @returns {Promise<Guild>}
   * @example
   * // Edit the guild safety alerts channel
   * guild.setSafetyAlertsChannel(channel)
   *  .then(updated => console.log(`Updated guild safety alerts channel to ${updated.safetyAlertsChannel.name}`))
   *  .catch(console.error);
   */
  setSafetyAlertsChannel(safetyAlertsChannel, reason) {
    return this.edit({ safetyAlertsChannel }, reason);
  }

  /**
   * Edits the enabled state of the guild's premium progress bar
   * @param {boolean} [enabled=true] The new enabled state of the guild's premium progress bar
   * @param {string} [reason] Reason for changing the state of the guild's premium progress bar
   * @returns {Promise<Guild>}
   */
  setPremiumProgressBarEnabled(enabled = true, reason) {
    return this.edit({ premiumProgressBarEnabled: enabled }, reason);
  }

  /**
   * Data that can be resolved to give a Category Channel object. This can be:
   * * A CategoryChannel object
   * * A Snowflake
   * @typedef {CategoryChannel|Snowflake} CategoryChannelResolvable
   */

  /**
   * The data needed for updating a channel's position.
   * @typedef {Object} ChannelPosition
   * @property {GuildChannel|Snowflake} channel Channel to update
   * @property {number} [position] New position for the channel
   * @property {CategoryChannelResolvable} [parent] Parent channel for this channel
   * @property {boolean} [lockPermissions] If the overwrites should be locked to the parents overwrites
   */

  /**
   * Batch-updates the guild's channels' positions.
   * <info>Only one channel's parent can be changed at a time</info>
   * @param {ChannelPosition[]} channelPositions Channel positions to update
   * @returns {Promise<Guild>}
   * @deprecated Use {@link GuildChannelManager#setPositions} instead
   * @example
   * guild.setChannelPositions([{ channel: channelId, position: newChannelIndex }])
   *   .then(guild => console.log(`Updated channel positions for ${guild}`))
   *   .catch(console.error);
   */
  setChannelPositions(channelPositions) {
    if (!deprecationEmittedForSetChannelPositions) {
      process.emitWarning(
        'The Guild#setChannelPositions method is deprecated. Use GuildChannelManager#setPositions instead.',
        'DeprecationWarning',
      );

      deprecationEmittedForSetChannelPositions = true;
    }

    return this.channels.setPositions(channelPositions);
  }

  /**
   * The data needed for updating a guild role's position
   * @typedef {Object} GuildRolePosition
   * @property {RoleResolvable} role The role's id
   * @property {number} position The position to update
   */

  /**
   * Batch-updates the guild's role positions
   * @param {GuildRolePosition[]} rolePositions Role positions to update
   * @returns {Promise<Guild>}
   * @deprecated Use {@link RoleManager#setPositions} instead
   * @example
   * guild.setRolePositions([{ role: roleId, position: updatedRoleIndex }])
   *  .then(guild => console.log(`Role positions updated for ${guild}`))
   *  .catch(console.error);
   */
  setRolePositions(rolePositions) {
    if (!deprecationEmittedForSetRolePositions) {
      process.emitWarning(
        'The Guild#setRolePositions method is deprecated. Use RoleManager#setPositions instead.',
        'DeprecationWarning',
      );

      deprecationEmittedForSetRolePositions = true;
    }

    return this.roles.setPositions(rolePositions);
  }

  /**
   * Edits the guild's widget settings.
   * @param {GuildWidgetSettingsData} settings The widget settings for the guild
   * @param {string} [reason] Reason for changing the guild's widget settings
   * @returns {Promise<Guild>}
   */
  async setWidgetSettings(settings, reason) {
    await this.client.api.guilds(this.id).widget.patch({
      data: {
        enabled: settings.enabled,
        channel_id: this.channels.resolveId(settings.channel),
      },
      reason,
    });
    return this;
  }

  /**
   * Sets whether this guild's invites are disabled.
   * @param {boolean} [disabled=true] Whether the invites are disabled
   * @returns {Promise<Guild>}
   */
  disableInvites(disabled = true) {
    const features = this.features.filter(feature => feature !== 'INVITES_DISABLED');
    if (disabled) features.push('INVITES_DISABLED');
    return this.edit({ features });
  }

  /**
   * Sets the incident actions for a guild.
   * @param {IncidentActionsEditOptions} incidentActions The incident actions to set
   * @returns {Promise<IncidentActions>}
   */
  setIncidentActions(incidentActions) {
    return this.client.guilds.setIncidentActions(this.id, incidentActions);
  }

  /**
   * Leaves the guild.
   * @returns {Promise<Guild>}
   * @example
   * // Leave a guild
   * guild.leave()
   *   .then(guild => console.log(`Left the guild: ${guild.name}`))
   *   .catch(console.error);
   */
  async leave() {
    if (this.ownerId === this.client.user.id) throw new Error('GUILD_OWNED');
    await this.client.api.users('@me').guilds(this.id).delete();
    return this.client.actions.GuildDelete.handle({ id: this.id }).guild;
  }

  /**
   * Deletes the guild.
   * @returns {Promise<Guild>}
   * @example
   * // Delete a guild
   * guild.delete()
   *   .then(g => console.log(`Deleted the guild ${g}`))
   *   .catch(console.error);
   */
  async delete() {
    await this.client.api.guilds(this.id).delete();
    return this.client.actions.GuildDelete.handle({ id: this.id }).guild;
  }

  /**
   * Whether this guild equals another guild. It compares all properties, so for most operations
   * it is advisable to just compare `guild.id === guild2.id` as it is much faster and is often
   * what most users need.
   * @param {Guild} guild The guild to compare with
   * @returns {boolean}
   */
  equals(guild) {
    return (
      guild &&
      guild instanceof this.constructor &&
      this.id === guild.id &&
      this.available === guild.available &&
      this.splash === guild.splash &&
      this.discoverySplash === guild.discoverySplash &&
      this.name === guild.name &&
      this.memberCount === guild.memberCount &&
      this.large === guild.large &&
      this.icon === guild.icon &&
      this.ownerId === guild.ownerId &&
      this.verificationLevel === guild.verificationLevel &&
      (this.features === guild.features ||
        (this.features.length === guild.features.length &&
          this.features.every((feat, i) => feat === guild.features[i])))
    );
  }

  toJSON() {
    const json = super.toJSON({
      available: false,
      createdTimestamp: true,
      nameAcronym: true,
      presences: false,
      voiceStates: false,
    });
    json.iconURL = this.iconURL();
    json.splashURL = this.splashURL();
    json.discoverySplashURL = this.discoverySplashURL();
    json.bannerURL = this.bannerURL();
    return json;
  }

  /**
   * Marks the guild as read.
   * @returns {Promise<void>}
   * @example
   * const guild = client.guilds.cache.get('222078108977594368');
   * guild.markAsRead();
   */
  markAsRead() {
    return this.client.readStates.ackGuild(this.id);
  }

  /**
   * Set Community Feature.
   * @param {boolean} stats True / False to enable / disable Community Feature
   * @param {GuildTextChannelResolvable} [publicUpdatesChannel] The community updates channel of the guild
   * @param {GuildTextChannelResolvable} [rulesChannel] The new rules channel
   * @param {string} [reason] Reason for changing the community feature
   * @returns {Promise<Guild>}
   */
  async setCommunity(stats = true, publicUpdatesChannel, rulesChannel, reason) {
    if (stats) {
      // Check everyone role
      const everyoneRole = this.roles.everyone;
      if (everyoneRole.mentionable) {
        await everyoneRole.setMentionable(false, reason);
      }
      // Setting
      return this.edit(
        {
          defaultMessageNotifications: 'ONLY_MENTIONS',
          explicitContentFilter: 'ALL_MEMBERS',
          features: [...this.features, 'COMMUNITY'],
          publicUpdatesChannel: this.channels.resolveId(publicUpdatesChannel) || '1',
          rulesChannel: this.channels.resolveId(rulesChannel) || '1',
          verificationLevel: VerificationLevels[this.verificationLevel] < 1 ? 'LOW' : this.verificationLevel, // Email
        },
        reason,
      );
    } else {
      return this.edit(
        {
          publicUpdatesChannel: null,
          rulesChannel: null,
          features: this.features.filter(f => f !== 'COMMUNITY'),
          preferredLocale: this.preferredLocale,
          description: this.description,
        },
        reason,
      );
    }
  }

  /**
   * Get the top emojis of this guild.
   * @returns {Promise<Collection<number, GuildEmoji>>}
   */
  topEmojis() {
    return new Promise((resolve, reject) => {
      this.client.api
        .guilds(this.id)
        ['top-emojis'].get()
        .then(data => {
          const emojis = new Collection();
          for (const emoji of data.items) {
            emojis.set(emoji.emoji_rank, this.emojis.cache.get(emoji.emoji_id));
          }
          resolve(emojis);
        })
        .catch(reject);
    });
  }

  /**
   * Set the vanity URL to this guild.
   * Resolves with an object containing the vanity URL invite code and the use count.
   * @param {string} [code=''] Vanity URL code
   * @returns {Promise<Vanity>}
   * @example
   * // Set invite code
   * guild.setVanityCode('elysia', '123456')
   *   .then(res => {
   *     console.log(`Vanity URL: https://discord.gg/${res.code} with ${res.uses} uses`);
   *   })
   *   .catch(console.error);
   */
  async setVanityCode(code = '') {
    if (typeof code !== 'string') throw new TypeError('INVALID_VANITY_URL_CODE');
    const data = await this.client.api.guilds(this.id, 'vanity-url').patch({
      data: { code },
    });
    this.vanityURLCode = data.code;
    this.vanityURLUses = data.uses;

    return data;
  }

  /**
   * The voice state adapter for this guild that can be used with @discordjs/voice to play audio in voice
   * and stage channels.
   * @type {Function}
   * @readonly
   */
  get voiceAdapterCreator() {
    return methods => {
      this.client.voice.adapters.set(this.id, methods);
      return {
        sendPayload: data => {
          if (this.shard.status !== Status.READY) return false;
          this.shard.send(data);
          return true;
        },
        destroy: () => {
          this.client.voice.adapters.delete(this.id);
        },
      };
    };
  }

  /**
   * Creates a collection of this guild's roles, sorted by their position and ids.
   * @returns {Collection<Snowflake, Role>}
   * @private
   */
  _sortedRoles() {
    return Util.discordSort(this.roles.cache);
  }

  /**
   * Creates a collection of this guild's or a specific category's channels, sorted by their position and ids.
   * @param {GuildChannel} [channel] Category to get the channels of
   * @returns {Collection<Snowflake, GuildChannel>}
   * @private
   */
  _sortedChannels(channel) {
    const category = channel.type === ChannelTypes.GUILD_CATEGORY;
    return Util.discordSort(
      this.channels.cache.filter(
        c =>
          (['GUILD_TEXT', 'GUILD_NEWS', 'GUILD_STORE'].includes(channel.type)
            ? ['GUILD_TEXT', 'GUILD_NEWS', 'GUILD_STORE'].includes(c.type)
            : c.type === channel.type) &&
          (category || c.parent === channel.parent),
      ),
    );
  }
}

exports.Guild = Guild;
exports.deletedGuilds = deletedGuilds;

/**
 * @external APIGuild
 * @see {@link https://discord.com/developers/docs/resources/guild#guild-object}
 */
