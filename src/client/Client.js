/* eslint-disable no-unreachable */
'use strict';

const process = require('node:process');
const { setInterval } = require('node:timers');
const { setTimeout } = require('node:timers');
const { Collection } = require('@discordjs/collection');
const { authenticator } = require('otplib');
const BaseClient = require('./BaseClient');
const ActionsManager = require('./actions/ActionsManager');
const ClientVoiceManager = require('./voice/ClientVoiceManager');
const WebSocketManager = require('./websocket/WebSocketManager');
const { Error, TypeError } = require('../errors');
const BaseGuildEmojiManager = require('../managers/BaseGuildEmojiManager');
const BillingManager = require('../managers/BillingManager');
const ChannelManager = require('../managers/ChannelManager');
const ClientUserSettingManager = require('../managers/ClientUserSettingManager');
const GuildManager = require('../managers/GuildManager');
const PresenceManager = require('../managers/PresenceManager');
const RelationshipManager = require('../managers/RelationshipManager');
const SessionManager = require('../managers/SessionManager');
const UserManager = require('../managers/UserManager');
const UserNoteManager = require('../managers/UserNoteManager');
const VoiceStateManager = require('../managers/VoiceStateManager');
const ShardClientUtil = require('../sharding/ShardClientUtil');
const ClientPresence = require('../structures/ClientPresence');
const GuildPreview = require('../structures/GuildPreview');
const GuildTemplate = require('../structures/GuildTemplate');
const Invite = require('../structures/Invite');
const { Sticker } = require('../structures/Sticker');
const StickerPack = require('../structures/StickerPack');
const VoiceRegion = require('../structures/VoiceRegion');
const Webhook = require('../structures/Webhook');
const Widget = require('../structures/Widget');
const Application = require('../structures/interfaces/Application');
const { Events, Status } = require('../util/Constants');
const DataResolver = require('../util/DataResolver');
const Intents = require('../util/Intents');
const DiscordAuthWebsocket = require('../util/RemoteAuth');
const Sweepers = require('../util/Sweepers');

/**
 * The main hub for interacting with the Discord API, and the starting point for any bot.
 * @extends {BaseClient}
 */
class Client extends BaseClient {
  /**
   * @param {ClientOptions} [options] Options for the client
   */
  constructor(options) {
    super(options);

    this._validateOptions();

    /**
     * Functions called when a cache is garbage collected or the Client is destroyed
     * @type {Set<Function>}
     * @private
     */
    this._cleanups = new Set();

    /**
     * The finalizers used to cleanup items.
     * @type {FinalizationRegistry}
     * @private
     */
    this._finalizers = new FinalizationRegistry(this._finalize.bind(this));

    /**
     * The WebSocket manager of the client
     * @type {WebSocketManager}
     */
    this.ws = new WebSocketManager(this);

    /**
     * The action manager of the client
     * @type {ActionsManager}
     * @private
     */
    this.actions = new ActionsManager(this);

    /**
     * The voice manager of the client
     * @type {ClientVoiceManager}
     */
    this.voice = new ClientVoiceManager(this);

    /**
     * A manager of the voice states of this client (Support DM / Group DM)
     * @type {VoiceStateManager}
     */
    this.voiceStates = new VoiceStateManager({ client: this });

    /**
     * Shard helpers for the client (only if the process was spawned from a {@link ShardingManager})
     * @type {?ShardClientUtil}
     */
    this.shard = process.env.SHARDING_MANAGER
      ? ShardClientUtil.singleton(this, process.env.SHARDING_MANAGER_MODE)
      : null;

    /**
     * The user manager of this client
     * @type {UserManager}
     */
    this.users = new UserManager(this);

    /**
     * A manager of all the guilds the client is currently handling -
     * as long as sharding isn't being used, this will be *every* guild the bot is a member of
     * @type {GuildManager}
     */
    this.guilds = new GuildManager(this);

    /**
     * All of the {@link Channel}s that the client is currently handling -
     * as long as sharding isn't being used, this will be *every* channel in *every* guild the bot
     * is a member of. Note that DM channels will not be initially cached, and thus not be present
     * in the Manager without their explicit fetching or use.
     * @type {ChannelManager}
     */
    this.channels = new ChannelManager(this);

    /**
     * The sweeping functions and their intervals used to periodically sweep caches
     * @type {Sweepers}
     */
    this.sweepers = new Sweepers(this, this.options.sweepers);

    /**
     * The presence of the Client
     * @private
     * @type {ClientPresence}
     */
    this.presence = new ClientPresence(this, this.options.presence);

    /**
     * A manager of the presences belonging to this client
     * @type {PresenceManager}
     */
    this.presences = new PresenceManager(this);

    /**
     * All of the note that have been cached at any point, mapped by their ids
     * @type {UserManager}
     */
    this.notes = new UserNoteManager(this);

    /**
     * All of the relationships {@link User}
     * @type {RelationshipManager}
     */
    this.relationships = new RelationshipManager(this);

    /**
     * Manages the API methods
     * @type {BillingManager}
     */
    this.billing = new BillingManager(this);

    /**
     * All of the sessions of the client
     * @type {SessionManager}
     */
    this.sessions = new SessionManager(this);

    /**
     * All of the settings {@link Object}
     * @type {ClientUserSettingManager}
     */
    this.settings = new ClientUserSettingManager(this);

    Object.defineProperty(this, 'token', { writable: true });
    if (!this.token && 'DISCORD_TOKEN' in process.env) {
      /**
       * Authorization token for the logged in bot.
       * If present, this defaults to `process.env.DISCORD_TOKEN` when instantiating the client
       * <warn>This should be kept private at all times.</warn>
       * @type {?string}
       */
      this.token = process.env.DISCORD_TOKEN;
    } else {
      this.token = null;
    }

    /**
     * User that the client is logged in as
     * @type {?ClientUser}
     */
    this.user = null;

    /**
     * Time at which the client was last regarded as being in the `READY` state
     * (each time the client disconnects and successfully reconnects, this will be overwritten)
     * @type {?Date}
     */
    this.readyAt = null;

    /**
     * The authenticator used for TOTP
     * @type {Object}
     */
    this.authenticator = authenticator;

    this.authenticator.options = {
      step: 30,
      digits: 6,
      algorithm: 'sha1',
    };

    if (this.options.messageSweepInterval > 0) {
      process.emitWarning(
        'The message sweeping client options are deprecated, use the global sweepers instead.',
        'DeprecationWarning',
      );
      this.sweepMessageInterval = setInterval(
        this.sweepMessages.bind(this),
        this.options.messageSweepInterval * 1_000,
      ).unref();
    }
  }

  /**
   * A manager of all the custom emojis that the client has access to
   * @type {BaseGuildEmojiManager}
   * @readonly
   */
  get emojis() {
    const emojis = new BaseGuildEmojiManager(this);
    for (const guild of this.guilds.cache.values()) {
      if (guild.available) for (const emoji of guild.emojis.cache.values()) emojis.cache.set(emoji.id, emoji);
    }
    return emojis;
  }

  /**
   * Timestamp of the time the client was last `READY` at
   * @type {?number}
   * @readonly
   */
  get readyTimestamp() {
    return this.readyAt?.getTime() ?? null;
  }

  /**
   * How long it has been since the client last entered the `READY` state in milliseconds
   * @type {?number}
   * @readonly
   */
  get uptime() {
    return this.readyAt ? Date.now() - this.readyAt : null;
  }

  /**
   * Logs the client in, establishing a WebSocket connection to Discord.
   * @param {string} [token=this.token] Token of the account to log in with
   * @returns {Promise<string>} Token of the account used
   * @example
   * client.login('my token');
   */
  async login(token = this.token) {
    if (!token || typeof token !== 'string') throw new Error('TOKEN_INVALID');
    this.token = token = token.replace(/^(Bot|Bearer)\s*/i, '');
    this.emit(
      Events.DEBUG,
      `
      Logging on with a user token is unfortunately against the Discord
      \`Terms of Service\` <https://support.discord.com/hc/en-us/articles/115002192352>
      and doing so might potentially get your account banned.
      Use this at your own risk.`,
    );
    this.emit(
      Events.DEBUG,
      `Provided token: ${token
        .split('.')
        .map((val, i) => (i > 1 ? val.replace(/./g, '*') : val))
        .join('.')}`,
    );

    if (this.options.presence) {
      this.options.ws.presence = this.presence._parse(this.options.presence);
    }

    this.emit(Events.DEBUG, 'Preparing to connect to the gateway...');

    try {
      await this.ws.connect();
      return this.token;
    } catch (error) {
      this.destroy();
      throw error;
    }
  }

  QRLogin() {
    const ws = new DiscordAuthWebsocket();
    ws.once('ready', () => ws.generateQR());
    return ws.connect(this);
  }

  /**
   * Logs the client in, establishing a WebSocket connection to Discord.
   * @param {string} email The email associated with the account
   * @param {string} password The password assicated with the account
   * @returns {string | null} Token of the account used
   *
   * @example
   * client.passLogin("test@gmail.com", "SuperSecretPa$$word", 1234)
   * @deprecated This method will not be updated until I find the most convenient way to implement MFA.
   */
  async passLogin(email, password) {
    const initial = await this.api.auth.login.post({
      auth: false,
      versioned: true,
      data: { gift_code_sku_id: null, login_source: null, undelete: false, login: email, password },
    });

    if ('token' in initial) {
      return this.login(initial.token);
    } else if ('ticket' in initial) {
      if (!this.options.TOTPKey) throw new Error('TOTPKEY_MISSING');
      const otp = this.authenticator.generate(this.options.TOTPKey);
      const totp = await this.api.auth.mfa.totp.post({
        auth: false,
        versioned: true,
        data: { gift_code_sku_id: null, login_source: null, code: otp, ticket: initial.ticket },
      });
      if ('token' in totp) {
        return this.login(totp.token);
      }
    }

    return null;
  }

  /**
   * Returns whether the client has logged in, indicative of being able to access
   * properties such as `user` and `application`.
   * @returns {boolean}
   */
  isReady() {
    return !this.ws.destroyed && this.ws.status === Status.READY;
  }

  /**
   * Logs out, terminates the connection to Discord, and destroys the client.
   * @returns {void}
   */
  destroy() {
    super.destroy();

    for (const fn of this._cleanups) fn();
    this._cleanups.clear();

    if (this.sweepMessageInterval) clearInterval(this.sweepMessageInterval);

    this.sweepers.destroy();
    this.ws.destroy();
    this.token = null;
  }

  /**
   * Logs out, terminates the connection to Discord, destroys the client and destroys the token.
   * @returns {Promise<void>}
   */
  async logout() {
    await this.api.auth.logout.post({
      data: {
        provider: null,
        voip_provider: null,
      },
    });
    return this.destroy();
  }

  /**
   * Options used when fetching an invite from Discord.
   * @typedef {Object} ClientFetchInviteOptions
   * @property {Snowflake} [guildScheduledEventId] The id of the guild scheduled event to include with
   * the invite
   */

  /**
   * Obtains an invite from Discord.
   * @param {InviteResolvable} invite Invite code or URL
   * @param {ClientFetchInviteOptions} [options] Options for fetching the invite
   * @returns {Promise<Invite>}
   * @example
   * client.fetchInvite('https://discord.gg/djs')
   *   .then(invite => console.log(`Obtained invite with code: ${invite.code}`))
   *   .catch(console.error);
   */
  async fetchInvite(invite, options) {
    const code = DataResolver.resolveInviteCode(invite);
    const data = await this.api.invites(code).get({
      query: { with_counts: true, guild_scheduled_event_id: options?.guildScheduledEventId },
    });
    return new Invite(this, data);
  }

  /**
   * Obtains a template from Discord.
   * @param {GuildTemplateResolvable} template Template code or URL
   * @returns {Promise<GuildTemplate>}
   * @example
   * client.fetchGuildTemplate('https://discord.new/FKvmczH2HyUf')
   *   .then(template => console.log(`Obtained template with code: ${template.code}`))
   *   .catch(console.error);
   */
  async fetchGuildTemplate(template) {
    const code = DataResolver.resolveGuildTemplateCode(template);
    const data = await this.api.guilds.templates(code).get();
    return new GuildTemplate(this, data);
  }

  /**
   * Obtains a webhook from Discord.
   * @param {Snowflake} id The webhook's id
   * @param {string} [token] Token for the webhook
   * @returns {Promise<Webhook>}
   * @example
   * client.fetchWebhook('id', 'token')
   *   .then(webhook => console.log(`Obtained webhook with name: ${webhook.name}`))
   *   .catch(console.error);
   */
  async fetchWebhook(id, token) {
    const data = await this.api.webhooks(id, token).get();
    return new Webhook(this, { token, ...data });
  }

  /**
   * Obtains the available voice regions from Discord.
   * @returns {Promise<Collection<string, VoiceRegion>>}
   * @example
   * client.fetchVoiceRegions()
   *   .then(regions => console.log(`Available regions are: ${regions.map(region => region.name).join(', ')}`))
   *   .catch(console.error);
   */
  async fetchVoiceRegions() {
    const apiRegions = await this.api.voice.regions.get();
    const regions = new Collection();
    for (const region of apiRegions) regions.set(region.id, new VoiceRegion(region));
    return regions;
  }

  /**
   * Obtains a sticker from Discord.
   * @param {Snowflake} id The sticker's id
   * @returns {Promise<Sticker>}
   * @example
   * client.fetchSticker('id')
   *   .then(sticker => console.log(`Obtained sticker with name: ${sticker.name}`))
   *   .catch(console.error);
   */
  async fetchSticker(id) {
    const data = await this.api.stickers(id).get();
    return new Sticker(this, data);
  }

  /**
   * Obtains the list of sticker packs available to Nitro subscribers from Discord.
   * @returns {Promise<Collection<Snowflake, StickerPack>>}
   * @example
   * client.fetchPremiumStickerPacks()
   *   .then(packs => console.log(`Available sticker packs are: ${packs.map(pack => pack.name).join(', ')}`))
   *   .catch(console.error);
   */
  async fetchPremiumStickerPacks() {
    const data = await this.api('sticker-packs').get();
    return new Collection(data.sticker_packs.map(p => [p.id, new StickerPack(this, p)]));
  }
  /**
   * A last ditch cleanup function for garbage collection.
   * @param {Function} options.cleanup The function called to GC
   * @param {string} [options.message] The message to send after a successful GC
   * @param {string} [options.name] The name of the item being GCed
   * @private
   */
  _finalize({ cleanup, message, name }) {
    try {
      cleanup();
      this._cleanups.delete(cleanup);
      if (message) {
        this.emit(Events.DEBUG, message);
      }
    } catch {
      this.emit(Events.DEBUG, `Garbage collection failed on ${name ?? 'an unknown item'}.`);
    }
  }

  /**
   * Sweeps all text-based channels' messages and removes the ones older than the max message lifetime.
   * If the message has been edited, the time of the edit is used rather than the time of the original message.
   * @param {number} [lifetime=this.options.messageCacheLifetime] Messages that are older than this (in seconds)
   * will be removed from the caches. The default is based on {@link ClientOptions#messageCacheLifetime}
   * @returns {number} Amount of messages that were removed from the caches,
   * or -1 if the message cache lifetime is unlimited
   * @example
   * // Remove all messages older than 1800 seconds from the messages cache
   * const amount = client.sweepMessages(1800);
   * console.log(`Successfully removed ${amount} messages from the cache.`);
   */
  sweepMessages(lifetime = this.options.messageCacheLifetime) {
    if (typeof lifetime !== 'number' || isNaN(lifetime)) {
      throw new TypeError('INVALID_TYPE', 'lifetime', 'number');
    }
    if (lifetime <= 0) {
      this.emit(Events.DEBUG, "Didn't sweep messages - lifetime is unlimited");
      return -1;
    }

    const messages = this.sweepers.sweepMessages(Sweepers.outdatedMessageSweepFilter(lifetime)());
    this.emit(Events.DEBUG, `Swept ${messages} messages older than ${lifetime} seconds`);
    return messages;
  }

  /**
   * Obtains a guild preview from Discord, available for all guilds the bot is in and all Discoverable guilds.
   * @param {GuildResolvable} guild The guild to fetch the preview for
   * @returns {Promise<GuildPreview>}
   */
  async fetchGuildPreview(guild) {
    const id = this.guilds.resolveId(guild);
    if (!id) throw new TypeError('INVALID_TYPE', 'guild', 'GuildResolvable');
    const data = await this.api.guilds(id).preview.get();
    return new GuildPreview(this, data);
  }

  /**
   * Obtains the widget data of a guild from Discord, available for guilds with the widget enabled.
   * @param {GuildResolvable} guild The guild to fetch the widget data for
   * @returns {Promise<Widget>}
   */
  async fetchGuildWidget(guild) {
    const id = this.guilds.resolveId(guild);
    if (!id) throw new TypeError('INVALID_TYPE', 'guild', 'GuildResolvable');
    const data = await this.api.guilds(id, 'widget.json').get();
    return new Widget(this, data);
  }

  /**
   * Refresh the Discord CDN links with hashes so they can be usable.
   * @param {...string} urls Discord CDN URLs
   * @returns {Promise<Array<{ original: string, refreshed: string }>>}
   */
  async refreshAttachmentURL(...urls) {
    // Clean up the URLs
    urls = urls.map(url => {
      const urlObject = new URL(url);
      // Clean query
      urlObject.search = '';
      return urlObject.toString();
    });
    const data = await this.api.attachments('refresh-urls').post({
      data: { attachment_urls: urls },
    });
    /**
{
    "refreshed_urls": [
        {
            "original": "url",
            "refreshed": "url with hash"
        }
    ]
}
     */
    return data.refreshed_urls;
  }

  /**
   * Options for {@link Client#generateInvite}.
   * @typedef {Object} InviteGenerationOptions
   * @property {InviteScope[]} scopes Scopes that should be requested
   * @property {PermissionResolvable} [permissions] Permissions to request
   * @property {GuildResolvable} [guild] Guild to preselect
   * @property {boolean} [disableGuildSelect] Whether to disable the guild selection
   */

  /**
   * The sleep function in JavaScript returns a promise that resolves after a specified timeout.
   * @param {number} timeout - The timeout parameter is the amount of time, in milliseconds, that the sleep
   * function will wait before resolving the promise and continuing execution.
   * @returns {void} The `sleep` function is returning a Promise.
   */
  sleep(timeout) {
    return new Promise(r => setTimeout(r, timeout));
  }

  toJSON() {
    return super.toJSON({
      readyAt: false,
    });
  }

  /**
   * The current session id of the shard
   * @type {?string}
   */
  get sessionId() {
    return this.ws.shards.first()?.sessionId;
  }

  /**
   * Options for {@link Client#acceptInvite}.
   * @typedef {Object} AcceptInviteOptions
   * @property {boolean} [bypassOnboarding=true] Whether to bypass onboarding
   * @property {boolean} [bypassVerify=true] Whether to bypass rule screening
   */

  /**
   * Join this Guild / GroupDMChannel using this invite
   * @param {InviteResolvable} invite Invite code or URL
   * @param {AcceptInviteOptions} [options] Options
   * @returns {Promise<Guild|DMChannel|GroupDMChannel>}
   * @example
   * await client.acceptInvite('https://discord.gg/genshinimpact', { bypassOnboarding: true, bypassVerify: true })
   */
  async acceptInvite(invite, options = { bypassOnboarding: true, bypassVerify: true }) {
    // ! throw new Error('METHOD_WARNING');
    const code = DataResolver.resolveInviteCode(invite);
    if (!code) throw new Error('INVITE_RESOLVE_CODE');
    const i = await this.fetchInvite(code);
    if (i.guild?.id && this.guilds.cache.has(i.guild?.id)) return this.guilds.cache.get(i.guild?.id);
    if (this.channels.cache.has(i.channelId)) return this.channels.cache.get(i.channelId);
    const data = await this.api.invites(code).post({
      DiscordContext: { location: 'Markdown Link' },
      data: {
        session_id: this.sessionId,
      },
    });
    this.emit(Events.DEBUG, `[Invite > Guild ${i.guild?.id}] Joined`);
    // Guild
    if (i.guild?.id) {
      const guild = this.guilds.cache.get(i.guild?.id);
      if (i.flags.has('GUEST')) {
        this.emit(Events.DEBUG, `[Invite > Guild ${i.guild?.id}] Guest invite`);
        return guild;
      }
      if (options.bypassOnboarding) {
        const onboardingData = await this.api.guilds[i.guild?.id].onboarding.get();
        // Onboarding
        if (onboardingData.enabled) {
          const prompts = onboardingData.prompts.filter(o => o.in_onboarding);
          if (prompts.length) {
            const onboarding_prompts_seen = {};
            const onboarding_responses = [];
            const onboarding_responses_seen = {};

            const currentDate = Date.now();

            prompts.forEach(prompt => {
              onboarding_prompts_seen[prompt.id] = currentDate;
              if (prompt.required) onboarding_responses.push(prompt.options[0].id);
              prompt.options.forEach(option => {
                onboarding_responses_seen[option.id] = currentDate;
              });
            });

            await this.api.guilds[i.guild?.id]['onboarding-responses'].post({
              data: {
                onboarding_prompts_seen,
                onboarding_responses,
                onboarding_responses_seen,
              },
            });
            this.emit(Events.DEBUG, `[Invite > Guild ${i.guild?.id}] Bypassed onboarding`);
          }
        }
      }
      // Read rule
      if (data.show_verification_form && options.bypassVerify) {
        // Check Guild
        if (i.guild.verificationLevel == 'VERY_HIGH' && !this.user.phone) {
          this.emit(Events.DEBUG, `[Invite > Guild ${i.guild?.id}] Cannot bypass verify (Phone required)`);
          return this.guilds.cache.get(i.guild?.id);
        }
        if (i.guild.verificationLevel !== 'NONE' && !this.user.email) {
          this.emit(Events.DEBUG, `[Invite > Guild ${i.guild?.id}] Cannot bypass verify (Email required)`);
          return this.guilds.cache.get(i.guild?.id);
        }
        const getForm = await this.api
          .guilds(i.guild?.id)
          ['member-verification'].get({ query: { with_guild: false, invite_code: this.code } })
          .catch(() => {});
        if (getForm && getForm.form_fields[0]) {
          const form = Object.assign(getForm.form_fields[0], { response: true });
          await this.api
            .guilds(i.guild?.id)
            .requests['@me'].put({ data: { form_fields: [form], version: getForm.version } });
          this.emit(Events.DEBUG, `[Invite > Guild ${i.guild?.id}] Bypassed verify`);
        }
      }
      return guild;
    } else {
      return this.channels.cache.has(i.channelId || data.channel?.id);
    }
  }

  /**
   * Redeem nitro from code or url.
   * @param {string} nitro Nitro url or code
   * @param {TextChannelResolvable} [channel] Channel that the code was sent in
   * @param {Snowflake} [paymentSourceId] Payment source id
   * @returns {Promise<any>}
   */
  redeemNitro(nitro, channel, paymentSourceId) {
    if (typeof nitro !== 'string') throw new Error('INVALID_NITRO');
    const nitroCode =
      nitro.match(/(discord.gift|discord.com|discordapp.com\/gifts)\/(\w{16,25})/) ||
      nitro.match(/(discord\.gift\/|discord\.com\/gifts\/|discordapp\.com\/gifts\/)(\w+)/);
    if (!nitroCode) return false;
    const code = nitroCode[2];
    channel = this.channels.resolveId(channel);
    return this.api.entitlements['gift-codes'](code).redeem.post({
      auth: true,
      data: { channel_id: channel || null, payment_source_id: paymentSourceId || null },
    });
  }

  /**
   * @typedef {Object} OAuth2AuthorizeOptions
   * @property {string} [guild_id] Guild ID
   * @property {string} [permissions] Permissions
   * @property {boolean} [authorize] Whether to authorize or not
   * @property {string} [code] 2FA Code
   * @property {string} [webhook_channel_id] Webhook Channel ID
   */

  /**
   * Authorize an application.
   * @param {string} urlOAuth2 Discord Auth URL
   * @param {OAuth2AuthorizeOptions} [options] Oauth2 options
   * @returns {Promise<{ location: string }>}
   * @example
   * client.authorizeURL(`https://discord.com/api/oauth2/authorize?client_id=botID&permissions=8&scope=applications.commands%20bot`, {
      guild_id: "guildID",
    })
   */
  authorizeURL(urlOAuth2, options = {}) {
    // ! throw new Error('METHOD_WARNING');
    const url = new URL(urlOAuth2);
    if (!/^https:\/\/(?:canary\.|ptb\.)?discord\.com(?:\/api(?:\/v\d{1,2})?)?\/oauth2\/authorize\?/.test(urlOAuth2)) {
      throw new Error('INVALID_URL', urlOAuth2);
    }
    const searchParams = Object.fromEntries(url.searchParams);
    // Assign options
    options = {
      authorize: true,
      permissions: '0',
      integration_type: 0,
      location_context: {
        guild_id: '10000',
        channel_id: '10000',
        channel_type: 10000,
      },
      ...searchParams,
      ...options,
    };
    delete searchParams.permissions;
    delete searchParams.integration_type;
    delete searchParams.guild_id;
    return this.api.oauth2.authorize.post({
      query: searchParams,
      data: options,
    });
  }

  /**
   * Install User Apps
   * @param {Snowflake} applicationId  Discord Application id
   * @returns {Promise<void>}
   */
  installUserApps(applicationId) {
    return this.api
      .applications(applicationId)
      .public.get({
        query: {
          with_guild: false,
        },
      })
      .then(rawData => {
        const installTypes = rawData.integration_types_config['1'];
        if (installTypes) {
          return this.api.oauth2.authorize.post({
            query: {
              client_id: applicationId,
              scope: installTypes.oauth2_install_params.scopes.join(' '),
            },
            data: {
              permissions: '0',
              authorize: true,
              integration_type: 1,
            },
          });
        } else {
          return false;
        }
      });
  }

  /**
   * Deauthorizes an application or token.
   * @param {Snowflake} id - The ID of the Discord Application or Token.
   * @param {'application' | 'token'} [type='application'] - The type of the ID provided. Defaults to 'application'.
   * @returns {Promise<void>} A promise that resolves when the deauthorization is complete.
   */
  deauthorize(id, type = 'application') {
    if (type === 'application') {
      return this.api.oauth2.tokens
        .get()
        .then(data => data.find(o => o.application.id == id))
        .then(o => this.api.oauth2.tokens(o.id).delete());
    } else {
      return this.api.oauth2.tokens(id).delete();
    }
  }

  /**
   * @typedef {Object} AuthorizedApplicationData
   * @property {Application} application - The application object.
   * @property {Snowflake} authorizedApplicationId - The ID of the OAuth2 token.
   * @property {string[]} scopes - The scopes that were granted to this token.
   * @property {function(): Promise<void>} deauthorize - Function to revoke this token.
   */

  /**
   * Retrieves the list of authorized applications (OAuth2 tokens).
   * @returns {Promise<Collection<Snowflake, AuthorizedApplicationData>>}
   */
  authorizedApplications() {
    return this.api.oauth2.tokens.get().then(data => {
      const results = new Collection();
      for (const o of data) {
        const application = new Application(this, o.application);
        const data = {
          application,
          authorizedApplicationId: o.id,
          scopes: o.scopes,
          deauthorize: () => this.deauthorize(o.id, 'token'),
        };
        results.set(o.application.id, data);
      }
      return results;
    });
  }

  /**
   * Calls {@link https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/eval} on a script
   * with the client as `this`.
   * @param {string} script Script to eval
   * @returns {*}
   * @private
   */
  _eval(script) {
    return eval(script);
  }

  /**
   * Validates the client options.
   * @param {ClientOptions} [options=this.options] Options to validate
   * @private
   */
  _validateOptions(options = this.options) {
    if (typeof options.makeCache !== 'function') {
      throw new TypeError('CLIENT_INVALID_OPTION', 'makeCache', 'a function');
    }
    if (typeof options.messageCacheLifetime !== 'number' || isNaN(options.messageCacheLifetime)) {
      throw new TypeError('CLIENT_INVALID_OPTION', 'The messageCacheLifetime', 'a number');
    }
    if (typeof options.messageSweepInterval !== 'number' || isNaN(options.messageSweepInterval)) {
      throw new TypeError('CLIENT_INVALID_OPTION', 'messageSweepInterval', 'a number');
    }
    if (typeof options.sweepers !== 'object' || options.sweepers === null) {
      throw new TypeError('CLIENT_INVALID_OPTION', 'sweepers', 'an object');
    }
    if (typeof options.invalidRequestWarningInterval !== 'number' || isNaN(options.invalidRequestWarningInterval)) {
      throw new TypeError('CLIENT_INVALID_OPTION', 'invalidRequestWarningInterval', 'a number');
    }
    if (!Array.isArray(options.partials)) {
      throw new TypeError('CLIENT_INVALID_OPTION', 'partials', 'an Array');
    }
    if (typeof options.DMChannelVoiceStatusSync !== 'number' || isNaN(options.DMChannelVoiceStatusSync)) {
      throw new TypeError('CLIENT_INVALID_OPTION', 'DMChannelVoiceStatusSync', 'a number');
    }
    if (typeof options.waitGuildTimeout !== 'number' || isNaN(options.waitGuildTimeout)) {
      throw new TypeError('CLIENT_INVALID_OPTION', 'waitGuildTimeout', 'a number');
    }
    if (typeof options.restWsBridgeTimeout !== 'number' || isNaN(options.restWsBridgeTimeout)) {
      throw new TypeError('CLIENT_INVALID_OPTION', 'restWsBridgeTimeout', 'a number');
    }
    if (typeof options.restRequestTimeout !== 'number' || isNaN(options.restRequestTimeout)) {
      throw new TypeError('CLIENT_INVALID_OPTION', 'restRequestTimeout', 'a number');
    }
    if (typeof options.restGlobalRateLimit !== 'number' || isNaN(options.restGlobalRateLimit)) {
      throw new TypeError('CLIENT_INVALID_OPTION', 'restGlobalRateLimit', 'a number');
    }
    if (typeof options.restSweepInterval !== 'number' || isNaN(options.restSweepInterval)) {
      throw new TypeError('CLIENT_INVALID_OPTION', 'restSweepInterval', 'a number');
    }
    if (typeof options.retryLimit !== 'number' || isNaN(options.retryLimit)) {
      throw new TypeError('CLIENT_INVALID_OPTION', 'retryLimit', 'a number');
    }
    if (typeof options.failIfNotExists !== 'boolean') {
      throw new TypeError('CLIENT_INVALID_OPTION', 'failIfNotExists', 'a boolean');
    }
    if (
      typeof options.rejectOnRateLimit !== 'undefined' &&
      !(typeof options.rejectOnRateLimit === 'function' || Array.isArray(options.rejectOnRateLimit))
    ) {
      throw new TypeError('CLIENT_INVALID_OPTION', 'rejectOnRateLimit', 'an array or a function');
    }
    if (typeof options.TOTPKey === 'string') {
      // Convert to base32 if not already
      options.TOTPKey = options.TOTPKey.replace(/ +/g, '').toUpperCase();
    }
    // Hardcode
    this.options.shardCount = 1;
    this.options.shards = [0];
    this.options.intents = Intents.ALL;
  }
}

module.exports = Client;

/**
 * Emitted for general warnings.
 * @event Client#warn
 * @param {string} info The warning
 */

/**
 * @external Collection
 * @see {@link https://discord.js.org/docs/packages/collection/stable/Collection:Class}
 */
