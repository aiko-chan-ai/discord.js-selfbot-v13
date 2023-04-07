'use strict';

const process = require('node:process');
const { setInterval, setTimeout } = require('node:timers');
const tls = require('tls');
const { Collection } = require('@discordjs/collection');
const { getVoiceConnection } = require('@discordjs/voice');
const axios = require('axios');
const chalk = require('chalk');
const _ = require('lodash');
const BaseClient = require('./BaseClient');
const ActionsManager = require('./actions/ActionsManager');
const ClientVoiceManager = require('./voice/ClientVoiceManager');
const WebSocketManager = require('./websocket/WebSocketManager');
const { Error, TypeError, RangeError } = require('../errors');
const Discord = require('../index');
const BaseGuildEmojiManager = require('../managers/BaseGuildEmojiManager');
const BillingManager = require('../managers/BillingManager');
const ChannelManager = require('../managers/ChannelManager');
const ClientUserSettingManager = require('../managers/ClientUserSettingManager');
const DeveloperPortalManager = require('../managers/DeveloperPortalManager');
const GuildManager = require('../managers/GuildManager');
const RelationshipManager = require('../managers/RelationshipManager');
const SessionManager = require('../managers/SessionManager');
const UserManager = require('../managers/UserManager');
const VoiceStateManager = require('../managers/VoiceStateManager');
const ShardClientUtil = require('../sharding/ShardClientUtil');
const ClientPresence = require('../structures/ClientPresence');
const GuildPreview = require('../structures/GuildPreview');
const GuildTemplate = require('../structures/GuildTemplate');
const Invite = require('../structures/Invite');
const { CustomStatus } = require('../structures/RichPresence');
const { Sticker } = require('../structures/Sticker');
const StickerPack = require('../structures/StickerPack');
const VoiceRegion = require('../structures/VoiceRegion');
const Webhook = require('../structures/Webhook');
const Widget = require('../structures/Widget');
const { Events, InviteScopes, Status, captchaServices } = require('../util/Constants');
const DataResolver = require('../util/DataResolver');
const Intents = require('../util/Intents');
const Options = require('../util/Options');
const Permissions = require('../util/Permissions');
const DiscordAuthWebsocket = require('../util/RemoteAuth');
const Sweepers = require('../util/Sweepers');
const { lazy, testImportModule } = require('../util/Util');
const Message = lazy(() => require('../structures/Message').Message);
// Patch TLS fingerprint
require('lodash.permutations');
const defaultCiphers = tls.DEFAULT_CIPHERS.split(':');
const temp = _.permutations(defaultCiphers.slice(0, 4), 4).filter(
  x => JSON.stringify(x) !== JSON.stringify(defaultCiphers.slice(0, 4)),
);
tls.DEFAULT_CIPHERS = [...temp[Math.floor(Math.random() * temp.length)], ...defaultCiphers.slice(4)].join(':');

/**
 * The main hub for interacting with the Discord API, and the starting point for any bot.
 * @extends {BaseClient}
 */
class Client extends BaseClient {
  /**
   * @param {ClientOptions} options Options for the client
   */
  constructor(options = {}) {
    super(options);

    const data = require('node:worker_threads').workerData ?? process.env;
    const defaults = Options.createDefault();

    if (this.options.shards === defaults.shards) {
      if ('SHARDS' in data) {
        this.options.shards = JSON.parse(data.SHARDS);
      }
    }

    if (this.options.shardCount === defaults.shardCount) {
      if ('SHARD_COUNT' in data) {
        this.options.shardCount = Number(data.SHARD_COUNT);
      } else if (Array.isArray(this.options.shards)) {
        this.options.shardCount = this.options.shards.length;
      }
    }

    const typeofShards = typeof this.options.shards;

    if (typeofShards === 'undefined' && typeof this.options.shardCount === 'number') {
      this.options.shards = Array.from({ length: this.options.shardCount }, (_, i) => i);
    }

    if (typeofShards === 'number') this.options.shards = [this.options.shards];

    if (Array.isArray(this.options.shards)) {
      this.options.shards = [
        ...new Set(
          this.options.shards.filter(item => !isNaN(item) && item >= 0 && item < Infinity && item === (item | 0)),
        ),
      ];
    }

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
     * All of the {@link User} objects that have been cached at any point, mapped by their ids
     * @type {UserManager}
     */
    this.users = new UserManager(this);

    // Patch
    /**
     * All of the relationships {@link User}
     * @type {RelationshipManager}
     */
    this.relationships = new RelationshipManager(this);
    /**
     * All of the settings {@link Object}
     * @type {ClientUserSettingManager}
     */
    this.settings = new ClientUserSettingManager(this);
    /**
     * All of the guilds the client is currently handling, mapped by their ids -
     * as long as sharding isn't being used, this will be *every* guild the bot is a member of
     * @type {GuildManager}
     */
    this.guilds = new GuildManager(this);

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
     * All of the {@link Channel}s that the client is currently handling, mapped by their ids -
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
     * The developer portal manager of the client
     * @type {DeveloperPortalManager}
     */
    this.developerPortal = new DeveloperPortalManager(this);

    /**
     * The presence of the Client
     * @private
     * @type {ClientPresence}
     */
    this.presence = new ClientPresence(this, this.options.presence);

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

    this._interactionCache = new Collection();

    /**
     * User that the client is logged in as
     * @type {?ClientUser}
     */
    this.user = null;

    /**
     * The application of this bot
     * @type {?ClientApplication}
     */
    this.application = null;

    /**
     * Time at which the client was last regarded as being in the `READY` state
     * (each time the client disconnects and successfully reconnects, this will be overwritten)
     * @type {?Date}
     */
    this.readyAt = null;

    /**
     * Password cache
     * @type {?string}
     */
    this.password = this.options.password;

    /**
     * Nitro cache
     * @type {Array}
     */
    this.usedCodes = [];

    setInterval(() => {
      this.usedCodes = [];
    }, 1000 * 60 * 60).unref();

    this.session_id = null;

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
   * Session ID
   * @type {?string}
   * @readonly
   */
  get sessionId() {
    return this.session_id;
  }

  /**
   * All custom emojis that the client has access to, mapped by their ids
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
   * @external VoiceConnection
   * @see {@link https://discord.js.org/#/docs/voice/main/class/VoiceConnection}
   */
  /**
   * Get connection to current call
   * @type {?VoiceConnection}
   * @readonly
   */
  get callVoice() {
    return getVoiceConnection(null);
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
      Use this at your own risk.
`,
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

  /**
   * Login Discord with Username and Password
   * @param {string} username Email or Phone Number
   * @param {?string} password Password
   * @param {?string} mfaCode 2FA Code / Backup Code
   * @returns {Promise<string>}
   */
  async normalLogin(username, password = this.password, mfaCode) {
    if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
      throw new Error('NORMAL_LOGIN');
    }
    this.emit(
      Events.DEBUG,
      `Connecting to Discord with: 
      username: ${username}
      password: ${password.replace(/./g, '*')}`,
    );
    const data = await this.api.auth.login.post({
      data: {
        login: username,
        password: password,
        undelete: false,
        captcha_key: null,
        login_source: null,
        gift_code_sku_id: null,
      },
      auth: false,
    });
    this.password = password;
    if (!data.token && data.ticket && data.mfa) {
      this.emit(Events.DEBUG, `Using 2FA Code: ${mfaCode}`);
      const normal2fa = /(\d{6})/g;
      const backupCode = /([a-z0-9]{4})-([a-z0-9]{4})/g;
      if (!mfaCode || typeof mfaCode !== 'string') {
        throw new Error('LOGIN_FAILED_2FA');
      }
      if (normal2fa.test(mfaCode) || backupCode.test(mfaCode)) {
        const data2 = await this.api.auth.mfa.totp.post({
          data: {
            code: mfaCode,
            ticket: data.ticket,
            login_source: null,
            gift_code_sku_id: null,
          },
          auth: false,
        });
        return this.login(data2.token);
      } else {
        throw new Error('LOGIN_FAILED_2FA');
      }
    } else if (data.token) {
      return this.login(data.token);
    } else {
      throw new Error('LOGIN_FAILED_UNKNOWN');
    }
  }

  /**
   * Switch the user
   * @param {string} token User Token
   * @returns {Promise<string>}
   */
  switchUser(token) {
    this._clearCache(this.emojis.cache);
    this._clearCache(this.guilds.cache);
    this._clearCache(this.channels.cache);
    this._clearCache(this.users.cache);
    this._clearCache(this.relationships.cache);
    this._clearCache(this.sessions.cache);
    this._clearCache(this.voiceStates.cache);
    this.ws.status = Status.IDLE;
    return this.login(token);
  }

  /**
   * Sign in with the QR code on your phone.
   * @param {DiscordAuthWebsocketOptions} options Options
   * @returns {DiscordAuthWebsocket}
   * @example
   * client.QRLogin();
   */
  QRLogin(options = {}) {
    const QR = new DiscordAuthWebsocket({ ...options, autoLogin: true });
    this.emit(Events.DEBUG, `Preparing to connect to the gateway (QR Login)`, QR);
    return QR.connect(this);
  }

  /**
   * @typedef {Object} remoteAuthConfrim
   * @property {function} yes Yes
   * @property {function} no No
   */

  /**
   * Implement `remoteAuth`, like using your phone to scan a QR code
   * @param {string} url URL from QR code
   * @param {boolean} forceAccept Whether to force confirm `yes`
   * @returns {Promise<remoteAuthConfrim | void>}
   */
  async remoteAuth(url, forceAccept = false) {
    if (!this.isReady()) throw new Error('CLIENT_NOT_READY', 'Remote Auth');
    // Step 1: Parse URL
    url = new URL(url);
    if (
      !['discordapp.com', 'discord.com'].includes(url.hostname) ||
      !url.pathname.startsWith('/ra/') ||
      url.pathname.length <= 4
    ) {
      throw new Error('INVALID_REMOTE_AUTH_URL');
    }
    const hash = url.pathname.replace('/ra/', '');
    // Step 2: Post > Get handshake_token
    const res = await this.api.users['@me']['remote-auth'].post({
      data: {
        fingerprint: hash,
      },
    });
    const handshake_token = res.handshake_token;
    // Step 3: Post
    const yes = () =>
      this.api.users['@me']['remote-auth'].finish.post({ data: { handshake_token, temporary_token: false } });
    const no = () => this.api.users['@me']['remote-auth'].cancel.post({ data: { handshake_token } });
    if (forceAccept) {
      return yes();
    } else {
      return {
        yes,
        no,
      };
    }
  }

  /**
   * Create a new token based on the current token
   * @returns {Promise<string>} New Discord Token
   */
  createToken() {
    return new Promise(resolve => {
      // Step 1: Create DiscordAuthWebsocket
      const QR = new DiscordAuthWebsocket({
        hiddenLog: true,
        generateQR: false,
        autoLogin: false,
        debug: false,
        failIfError: false,
        userAgent: this.options.http.headers['User-Agent'],
        wsProperties: this.options.ws.properties,
      });
      // Step 2: Add event
      QR.once('ready', async (_, url) => {
        await this.remoteAuth(url, true);
      }).once('finish', (user, token) => {
        resolve(token);
      });
      // Step 3: Connect
      QR.connect();
    });
  }

  /**
   * Emitted whenever clientOptions.checkUpdate = false
   * @event Client#update
   * @param {string} oldVersion Current version
   * @param {string} newVersion Latest version
   */

  /**
   * Check for updates
   * @returns {Promise<Client>}
   */
  async checkUpdate() {
    const res_ = await axios
      .get(`https://registry.npmjs.com/${encodeURIComponent('discord.js-selfbot-v13')}`)
      .catch(() => {});
    try {
      const latest_tag = res_.data['dist-tags'].latest;
      this.emit('update', Discord.version, latest_tag);
    } catch {
      this.emit('debug', `${chalk.redBright('[Fail]')} Check Update error`);
      this.emit('update', Discord.version, false);
    }
    return this;
  }

  /**
   * Returns whether the client has logged in, indicative of being able to access
   * properties such as `user` and `application`.
   * @returns {boolean}
   */
  isReady() {
    return this.ws.status === Status.READY;
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
    this.password = null;
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
    await this.destroy();
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
      query: { with_counts: true, with_expiration: true, guild_scheduled_event_id: options?.guildScheduledEventId },
    });
    return new Invite(this, data);
  }

  /**
   * Join this Guild using this invite (fast)
   * @param {InviteResolvable} invite Invite code or URL
   * @returns {Promise<void>}
   * @example
   * await client.acceptInvite('https://discord.gg/genshinimpact')
   */
  async acceptInvite(invite) {
    const code = DataResolver.resolveInviteCode(invite);
    if (!code) throw new Error('INVITE_RESOLVE_CODE');
    if (invite instanceof Invite) {
      await invite.acceptInvite();
    } else {
      await this.api.invites(code).post({
        headers: {
          'X-Context-Properties': 'eyJsb2NhdGlvbiI6Ik1hcmtkb3duIExpbmsifQ==', // Markdown Link
        },
        data: {},
      });
    }
  }

  /**
   * Automatically Redeem Nitro from raw message.
   * @param {Message} message Discord Message
   */
  async autoRedeemNitro(message) {
    if (!(message instanceof Message())) return;
    await this.redeemNitro(message.content, message.channel, false);
  }

  /**
   * Redeem nitro from code or url.
   * @param {string} nitro Nitro url or code
   * @param {TextChannelResolvable} channel Channel that the code was sent in
   * @param {boolean} failIfNotExists Whether to fail if the code doesn't exist
   * @returns {Promise<boolean>}
   */
  async redeemNitro(nitro, channel, failIfNotExists = true) {
    if (typeof nitro !== 'string') throw new Error('INVALID_NITRO');
    channel = this.channels.resolveId(channel);
    const regex = {
      gift: /(discord.gift|discord.com|discordapp.com\/gifts)\/\w{16,25}/gim,
      url: /(discord\.gift\/|discord\.com\/gifts\/|discordapp\.com\/gifts\/)/gim,
    };
    const nitroArray = nitro.match(regex.gift);
    if (!nitroArray) return false;
    const codeArray = nitroArray.map(code => code.replace(regex.url, ''));
    let redeem = false;
    this.emit('debug', `${chalk.greenBright('[Nitro]')} Redeem Nitro: ${nitroArray.join(', ')}`);
    for await (const code of codeArray) {
      if (this.usedCodes.includes(code)) continue;
      await this.api.entitlements['gift-codes'](code)
        .redeem.post({
          auth: true,
          data: { channel_id: channel || null, payment_source_id: null },
        })
        .then(() => {
          this.usedCodes.push(code);
          redeem = true;
        })
        .catch(e => {
          this.usedCodes.push(code);
          if (failIfNotExists) throw e;
        });
    }
    return redeem;
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
   * Clear a cache
   * @param {Collection} cache The cache to clear
   * @returns {number} The number of removed entries
   * @private
   */
  _clearCache(cache) {
    return cache.sweep(() => true);
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
   * Options for {@link Client#generateInvite}.
   * @typedef {Object} InviteGenerationOptions
   * @property {InviteScope[]} scopes Scopes that should be requested
   * @property {PermissionResolvable} [permissions] Permissions to request
   * @property {GuildResolvable} [guild] Guild to preselect
   * @property {boolean} [disableGuildSelect] Whether to disable the guild selection
   */

  /**
   * Generates a link that can be used to invite the bot to a guild.
   * @param {InviteGenerationOptions} [options={}] Options for the invite
   * @returns {string}
   * @example
   * const link = client.generateInvite({
   *   scopes: ['applications.commands'],
   * });
   * console.log(`Generated application invite link: ${link}`);
   * @example
   * const link = client.generateInvite({
   *   permissions: [
   *     Permissions.FLAGS.SEND_MESSAGES,
   *     Permissions.FLAGS.MANAGE_GUILD,
   *     Permissions.FLAGS.MENTION_EVERYONE,
   *   ],
   *   scopes: ['bot'],
   * });
   * console.log(`Generated bot invite link: ${link}`);
   */
  generateInvite(options = {}) {
    if (typeof options !== 'object') throw new TypeError('INVALID_TYPE', 'options', 'object', true);
    if (!this.application) throw new Error('CLIENT_NOT_READY', 'generate an invite link');

    const query = new URLSearchParams({
      client_id: this.application.id,
    });

    const { scopes } = options;
    if (typeof scopes === 'undefined') {
      throw new TypeError('INVITE_MISSING_SCOPES');
    }
    if (!Array.isArray(scopes)) {
      throw new TypeError('INVALID_TYPE', 'scopes', 'Array of Invite Scopes', true);
    }
    if (!scopes.some(scope => ['bot', 'applications.commands'].includes(scope))) {
      throw new TypeError('INVITE_MISSING_SCOPES');
    }
    const invalidScope = scopes.find(scope => !InviteScopes.includes(scope));
    if (invalidScope) {
      throw new TypeError('INVALID_ELEMENT', 'Array', 'scopes', invalidScope);
    }
    query.set('scope', scopes.join(' '));

    if (options.permissions) {
      const permissions = Permissions.resolve(options.permissions);
      if (permissions) query.set('permissions', permissions);
    }

    if (options.disableGuildSelect) {
      query.set('disable_guild_select', true);
    }

    if (options.guild) {
      const guildId = this.guilds.resolveId(options.guild);
      if (!guildId) throw new TypeError('INVALID_TYPE', 'options.guild', 'GuildResolvable');
      query.set('guild_id', guildId);
    }

    return `${this.options.http.api}${this.api.oauth2.authorize}?${query}`;
  }

  toJSON() {
    return super.toJSON({
      readyAt: false,
    });
  }

  /**
   * Calls {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval} on a script
   * with the client as `this`.
   * @param {string} script Script to eval
   * @returns {*}
   * @private
   */
  _eval(script) {
    return eval(script);
  }

  /**
   * Sets the client's presence. (Sync Setting).
   * @param {Client} client Discord Client
   * @private
   */
  customStatusAuto(client) {
    client = client ?? this;
    if (!client.user) return;
    const custom_status = new CustomStatus();
    if (!client.settings.rawSetting.custom_status?.text && !client.settings.rawSetting.custom_status?.emoji_name) {
      client.user.setPresence({
        activities: this.presence.activities.filter(a => a.type !== 'CUSTOM'),
        status: client.settings.rawSetting.status ?? 'invisible',
      });
    } else {
      custom_status.setEmoji({
        name: client.settings.rawSetting.custom_status?.emoji_name,
        id: client.settings.rawSetting.custom_status?.emoji_id,
      });
      custom_status.setState(client.settings.rawSetting.custom_status?.text);
      client.user.setPresence({
        activities: [custom_status.toJSON(), ...this.presence.activities.filter(a => a.type !== 'CUSTOM')],
        status: client.settings.rawSetting.status ?? 'invisible',
      });
    }
  }

  /**
   * Authorize an URL.
   * @param {string} url Discord Auth URL
   * @param {Object} options Oauth2 options
   * @returns {Promise<boolean>}
   * @example
   * client.authorizeURL(`https://discord.com/api/oauth2/authorize?client_id=botID&permissions=8&scope=applications.commands%20bot`, {
      guild_id: "guildID",
      permissions: "62221393", // your permissions
      authorize: true
    })
   */
  async authorizeURL(url, options = {}) {
    const reg = /(api\/)*oauth2\/authorize/gim;
    let searchParams = {};
    const checkURL = () => {
      try {
        // eslint-disable-next-line no-new
        const url_ = new URL(url);
        if (!['discord.com', 'canary.discord.com', 'ptb.discord.com'].includes(url_.hostname)) return false;
        if (!reg.test(url_.pathname)) return false;
        for (const [key, value] of url_.searchParams.entries()) {
          searchParams[key] = value;
        }
        return true;
      } catch (e) {
        return false;
      }
    };
    options = Object.assign(
      {
        authorize: true,
        permissions: '0',
      },
      options,
    );
    if (!url || !checkURL()) {
      throw new Error('INVALID_URL', url);
    }
    await this.api.oauth2.authorize.post({
      query: searchParams,
      data: options,
    });
    return true;
  }

  /**
   * Makes waiting time for Client.
   * @param {number} miliseconds Sleeping time as milliseconds.
   * @returns {Promise<void> | null}
   */
  sleep(miliseconds) {
    return typeof miliseconds === 'number' ? new Promise(r => setTimeout(r, miliseconds).unref()) : null;
  }

  /**
   * Validates the client options.
   * @param {ClientOptions} [options=this.options] Options to validate
   * @private
   */
  _validateOptions(options = this.options) {
    if (typeof options.intents === 'undefined') {
      throw new TypeError('CLIENT_MISSING_INTENTS');
    } else {
      options.intents = Intents.resolve(options.intents);
    }
    if (options && typeof options.checkUpdate !== 'boolean') {
      throw new TypeError('CLIENT_INVALID_OPTION', 'checkUpdate', 'a boolean');
    }
    if (options && typeof options.syncStatus !== 'boolean') {
      throw new TypeError('CLIENT_INVALID_OPTION', 'syncStatus', 'a boolean');
    }
    if (options && typeof options.autoRedeemNitro !== 'boolean') {
      throw new TypeError('CLIENT_INVALID_OPTION', 'autoRedeemNitro', 'a boolean');
    }
    if (options && options.captchaService && !captchaServices.includes(options.captchaService)) {
      throw new TypeError('CLIENT_INVALID_OPTION', 'captchaService', captchaServices.join(', '));
    }
    // Parse captcha key
    if (options && captchaServices.includes(options.captchaService) && options.captchaService !== 'custom') {
      if (typeof options.captchaKey !== 'string') {
        throw new TypeError('CLIENT_INVALID_OPTION', 'captchaKey', 'a string');
      }
      switch (options.captchaService) {
        case '2captcha':
          if (options.captchaKey.length !== 32) {
            throw new TypeError('CLIENT_INVALID_OPTION', 'captchaKey', 'a 32 character string');
          }
          break;
        case 'capmonster':
          if (options.captchaKey.length !== 32) {
            throw new TypeError('CLIENT_INVALID_OPTION', 'captchaKey', 'a 32 character string');
          }
          break;
        case 'nopecha': {
          if (options.captchaKey.length !== 16) {
            throw new TypeError('CLIENT_INVALID_OPTION', 'captchaKey', 'a 16 character string');
          }
          break;
        }
      }
    }
    if (typeof options.captchaRetryLimit !== 'number' || isNaN(options.captchaRetryLimit)) {
      throw new TypeError('CLIENT_INVALID_OPTION', 'captchaRetryLimit', 'a number');
    }
    if (options && typeof options.captchaSolver !== 'function') {
      throw new TypeError('CLIENT_INVALID_OPTION', 'captchaSolver', 'a function');
    }
    if (options && typeof options.DMSync !== 'boolean') {
      throw new TypeError('CLIENT_INVALID_OPTION', 'DMSync', 'a boolean');
    }
    if (options && typeof options.patchVoice !== 'boolean') {
      throw new TypeError('CLIENT_INVALID_OPTION', 'patchVoice', 'a boolean');
    }
    if (options && options.password && typeof options.password !== 'string') {
      throw new TypeError('CLIENT_INVALID_OPTION', 'password', 'a string');
    }
    if (options && options.usingNewAttachmentAPI && typeof options.usingNewAttachmentAPI !== 'boolean') {
      throw new TypeError('CLIENT_INVALID_OPTION', 'usingNewAttachmentAPI', 'a boolean');
    }
    if (options && options.interactionTimeout && typeof options.interactionTimeout !== 'number') {
      throw new TypeError('CLIENT_INVALID_OPTION', 'interactionTimeout', 'a number');
    }
    if (options && typeof options.proxy !== 'string') {
      throw new TypeError('CLIENT_INVALID_OPTION', 'proxy', 'a string');
    } else if (
      options &&
      options.proxy &&
      typeof options.proxy === 'string' &&
      testImportModule('proxy-agent') === false
    ) {
      throw new Error('MISSING_MODULE', 'proxy-agent', 'npm install proxy-agent');
    }
    if (typeof options.shardCount !== 'number' || isNaN(options.shardCount) || options.shardCount < 1) {
      throw new TypeError('CLIENT_INVALID_OPTION', 'shardCount', 'a number greater than or equal to 1');
    }
    if (options.shards && !(options.shards === 'auto' || Array.isArray(options.shards))) {
      throw new TypeError('CLIENT_INVALID_OPTION', 'shards', "'auto', a number or array of numbers");
    }
    if (options.shards && !options.shards.length) throw new RangeError('CLIENT_INVALID_PROVIDED_SHARDS');
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
    if (typeof options.waitGuildTimeout !== 'number' || isNaN(options.waitGuildTimeout)) {
      throw new TypeError('CLIENT_INVALID_OPTION', 'waitGuildTimeout', 'a number');
    }
    if (typeof options.messageCreateEventGuildTimeout !== 'number' || isNaN(options.messageCreateEventGuildTimeout)) {
      throw new TypeError('CLIENT_INVALID_OPTION', 'messageCreateEventGuildTimeout', 'a number');
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
    if (!Array.isArray(options.userAgentSuffix)) {
      throw new TypeError('CLIENT_INVALID_OPTION', 'userAgentSuffix', 'an array of strings');
    }
    if (
      typeof options.rejectOnRateLimit !== 'undefined' &&
      !(typeof options.rejectOnRateLimit === 'function' || Array.isArray(options.rejectOnRateLimit))
    ) {
      throw new TypeError('CLIENT_INVALID_OPTION', 'rejectOnRateLimit', 'an array or a function');
    }
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
 * @see {@link https://discord.js.org/#/docs/collection/main/class/Collection}
 */
