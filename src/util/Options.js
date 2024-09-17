'use strict';

const { UserAgent } = require('./Constants');
const Intents = require('./Intents');

/**
 * Rate limit data
 * @typedef {Object} RateLimitData
 * @property {number} timeout Time until this rate limit ends, in milliseconds
 * @property {number} limit The maximum amount of requests of this endpoint
 * @property {string} method The HTTP method of this request
 * @property {string} path The path of the request relative to the HTTP endpoint
 * @property {string} route The route of the request relative to the HTTP endpoint
 * @property {boolean} global Whether this is a global rate limit
 */

/**
 * Whether this rate limit should throw an Error
 * @typedef {Function} RateLimitQueueFilter
 * @param {RateLimitData} rateLimitData The data of this rate limit
 * @returns {boolean|Promise<boolean>}
 */

/**
 * @typedef {Function} CacheFactory
 * @param {Function} manager The manager class the cache is being requested from.
 * @param {Function} holds The class that the cache will hold.
 * @returns {Collection} A Collection used to store the cache of the manager.
 */

/**
 * @typedef {Function} CaptchaSolver
 * @param {Captcha} captcha Discord Captcha
 * @param {string} UserAgent Current UserAgent
 * @returns {Promise<string>} HCaptcha Token
 * @example
 * const Captcha = require("2captcha")
 * // A new 'solver' instance with our API key
 * const solver = new Captcha.Solver("<Your 2captcha api key>")
 * function solveCaptcha(captcha, UA) {
 *  return solver.hcaptcha(captcha.captcha_sitekey, 'discord.com', {
 *    invisible: 1,
 *    userAgent: UA,
 *    data: captcha.captcha_rqdata,
 *  }).then(res => res.data)
 * }
 */

/**
 * Options for a client.
 * @typedef {Object} ClientOptions
 * @property {number} [DMChannelVoiceStatusSync=0] The amount of time in milliseconds that the Client to register the event with each DM channel (0=Disable)
 * @property {number} [captchaRetryLimit=3] Captcha retry limit
 * @property {CaptchaSolver} [captchaSolver] Captcha Solver
 * @property {number} [closeTimeout=5000] The amount of time in milliseconds to wait for the close frame to be received
 * from the WebSocket.
 * <info>Don't have this too high/low. It's best to have it between 2000-6000 ms.</info>
 * (e.g. recommended shard count, shard count of the ShardingManager)
 * @property {CacheFactory} [makeCache] Function to create a cache.
 * You can use your own function, or the {@link Options} class to customize the Collection used for the cache.
 * <warn>Overriding the cache used in `GuildManager`, `ChannelManager`, `GuildChannelManager`, `RoleManager`,
 * and `PermissionOverwriteManager` is unsupported and **will** break functionality</warn>
 * @property {number} [messageCacheLifetime=0] DEPRECATED: Pass `lifetime` to `sweepers.messages` instead.
 * How long a message should stay in the cache until it is considered sweepable (in seconds, 0 for forever)
 * @property {number} [messageSweepInterval=0] DEPRECATED: Pass `interval` to `sweepers.messages` instead.
 * How frequently to remove messages from the cache that are older than the message cache lifetime
 * (in seconds, 0 for never)
 * @property {MessageMentionOptions} [allowedMentions] Default value for {@link MessageOptions#allowedMentions}
 * @property {number} [invalidRequestWarningInterval=0] The number of invalid REST requests (those that return
 * 401, 403, or 429) in a 10 minute window between emitted warnings (0 for no warnings). That is, if set to 500,
 * warnings will be emitted at invalid request number 500, 1000, 1500, and so on.
 * @property {PartialType[]} [partials=['USER', 'CHANNEL', 'GUILD_MEMBER', 'MESSAGE', 'REACTION', 'GUILD_SCHEDULED_EVENT']] Structures allowed to be partial. This means events can be emitted even when
 * they're missing all the data for a particular structure. See the "Partial Structures" topic on the
 * [guide](https://discordjs.guide/popular-topics/partials.html) for some
 * important usage information, as partials require you to put checks in place when handling data.
 * @property {number} [restWsBridgeTimeout=5000] Maximum time permitted between REST responses and their
 * corresponding WebSocket events
 * @property {number} [restTimeOffset=500] Extra time in milliseconds to wait before continuing to make REST
 * requests (higher values will reduce rate-limiting errors on bad connections)
 * @property {number} [restRequestTimeout=15000] Time to wait before cancelling a REST request, in milliseconds
 * @property {number} [restSweepInterval=60] How frequently to delete inactive request buckets, in seconds
 * (or 0 for never)
 * @property {number} [restGlobalRateLimit=0] How many requests to allow sending per second (0 for unlimited, 50 for
 * the standard global limit used by Discord)
 * @property {string[]|RateLimitQueueFilter} [rejectOnRateLimit] Decides how rate limits and pre-emptive throttles
 * should be handled. If this option is an array containing the prefix of the request route (e.g. /channels to match any
 * route starting with /channels, such as /channels/222197033908436994/messages) or a function returning true, a
 * {@link RateLimitError} will be thrown. Otherwise the request will be queued for later
 * @property {number} [retryLimit=1] How many times to retry on 5XX errors
 * (Infinity for an indefinite amount of retries)
 * @property {boolean} [failIfNotExists=true] Default value for {@link ReplyMessageOptions#failIfNotExists}
 * @property {PresenceData} [presence={ status: 'online', since: 0, activities: [], afk: false }] Presence data to use upon login
 * @property {number} [waitGuildTimeout=15_000] Time in milliseconds that Clients with the GUILDS intent should wait for
 * missing guilds to be received before starting the bot. If not specified, the default is 15 seconds.
 * @property {SweeperOptions} [sweepers={}] Options for cache sweeping
 * @property {WebsocketOptions} [ws] Options for the WebSocket
 * @property {HTTPOptions} [http] HTTP options
 */

/**
 * Options for {@link Sweepers} defining the behavior of cache sweeping
 * @typedef {Object<SweeperKey, SweepOptions>} SweeperOptions
 */

/**
 * Options for sweeping a single type of item from cache
 * @typedef {Object} SweepOptions
 * @property {number} interval The interval (in seconds) at which to perform sweeping of the item
 * @property {number} [lifetime] How long an item should stay in cache until it is considered sweepable.
 * <warn>This property is only valid for the `invites`, `messages`, and `threads` keys. The `filter` property
 * is mutually exclusive to this property and takes priority</warn>
 * @property {GlobalSweepFilter} filter The function used to determine the function passed to the sweep method
 * <info>This property is optional when the key is `invites`, `messages`, or `threads` and `lifetime` is set</info>
 */

/**
 * WebSocket options (these are left as snake_case to match the API)
 * @typedef {Object} WebsocketOptions
 * @property {AgentOptions} [agent={}] HTTPS Agent options (WS Proxy)
 * @property {boolean} [compress=false] Whether to compress data sent on the connection
 * @property {WebSocketProperties} [properties] Properties to identify the client with
 */

/**
 * HTTPS Agent options.
 * @typedef {Object} AgentOptions
 * @see {@link https://nodejs.org/api/https.html#https_class_https_agent}
 * @see {@link https://nodejs.org/api/http.html#http_new_agent_options}
 */

/**
 * HTTP options
 * @typedef {Object} HTTPOptions
 * @property {number} [version=9] API version to use
 * @property {AgentOptions} [agent={}] HTTPS Agent options
 * @property {string} [api='https://discord.com/api'] Base URL of the API
 * @property {string} [cdn='https://cdn.discordapp.com'] Base URL of the CDN
 * @property {string} [invite='https://discord.gg'] Base URL of invites
 * @property {string} [template='https://discord.new'] Base URL of templates
 * @property {Object} [headers] Additional headers to send for all API requests
 * @property {string} [scheduledEvent='https://discord.com/events'] Base URL of guild scheduled events
 */

/**
 * Contains various utilities for client options.
 */
class Options extends null {
  /**
   * The default client options.
   * @returns {ClientOptions}
   */
  static createDefault() {
    return {
      DMChannelVoiceStatusSync: 0,
      captchaRetryLimit: 3,
      captchaSolver: () => Promise.reject(new Error('CAPTCHA_SOLVER_NOT_IMPLEMENTED')),
      closeTimeout: 5_000,
      waitGuildTimeout: 15_000,
      shardCount: 1,
      shards: [0],
      makeCache: this.cacheWithLimits(this.defaultMakeCacheSettings),
      messageCacheLifetime: 0,
      messageSweepInterval: 0,
      invalidRequestWarningInterval: 0,
      intents: Intents.ALL,
      partials: ['USER', 'CHANNEL', 'GUILD_MEMBER', 'MESSAGE', 'REACTION', 'GUILD_SCHEDULED_EVENT'], // Enable the partials
      restWsBridgeTimeout: 5_000,
      restRequestTimeout: 15_000,
      restGlobalRateLimit: 0,
      retryLimit: 1,
      restTimeOffset: 500,
      restSweepInterval: 60,
      failIfNotExists: true,
      presence: { status: 'online', since: 0, activities: [], afk: true },
      sweepers: {},
      ws: {
        capabilities: 0, // https://discord-userdoccers.vercel.app/topics/gateway#gateway-capabilities
        properties: {
          os: 'Windows',
          browser: 'Chrome',
          device: '',
          system_locale: 'vi-VN',
          browser_user_agent: UserAgent,
          browser_version: '108.0.5359.215',
          os_version: '10',
          referrer: '',
          referring_domain: '',
          referrer_current: '',
          referring_domain_current: '',
          release_channel: 'stable',
          client_build_number: 327446,
          client_event_source: null,
        },
        compress: false,
        client_state: {
          guild_versions: {},
        },
        version: 9,
        agent: {},
      },
      http: {
        agent: {},
        headers: {
          'User-Agent': UserAgent,
        },
        version: 9,
        api: 'https://discord.com/api',
        cdn: 'https://cdn.discordapp.com',
        invite: 'https://discord.gg',
        template: 'https://discord.new',
        scheduledEvent: 'https://discord.com/events',
      },
    };
  }

  /**
   * Create a cache factory using predefined settings to sweep or limit.
   * @param {Object<string, LimitedCollectionOptions|number>} [settings={}] Settings passed to the relevant constructor.
   * If no setting is provided for a manager, it uses Collection.
   * If a number is provided for a manager, it uses that number as the max size for a LimitedCollection.
   * If LimitedCollectionOptions are provided for a manager, it uses those settings to form a LimitedCollection.
   * @returns {CacheFactory}
   * @example
   * // Store up to 200 messages per channel and discard archived threads if they were archived more than 4 hours ago.
   * // Note archived threads will remain in the guild and client caches with these settings
   * Options.cacheWithLimits({
   *    MessageManager: 200,
   *    ThreadManager: {
   *      sweepInterval: 3600,
   *      sweepFilter: LimitedCollection.filterByLifetime({
   *        getComparisonTimestamp: e => e.archiveTimestamp,
   *        excludeFromSweep: e => !e.archived,
   *      }),
   *    },
   *  });
   * @example
   * // Sweep messages every 5 minutes, removing messages that have not been edited or created in the last 30 minutes
   * Options.cacheWithLimits({
   *   // Keep default thread sweeping behavior
   *   ...Options.defaultMakeCacheSettings,
   *   // Override MessageManager
   *   MessageManager: {
   *     sweepInterval: 300,
   *     sweepFilter: LimitedCollection.filterByLifetime({
   *       lifetime: 1800,
   *       getComparisonTimestamp: e => e.editedTimestamp ?? e.createdTimestamp,
   *     })
   *   }
   * });
   */
  static cacheWithLimits(settings = {}) {
    const { Collection } = require('@discordjs/collection');
    const LimitedCollection = require('./LimitedCollection');

    return manager => {
      const setting = settings[manager.name];
      /* eslint-disable-next-line eqeqeq */
      if (setting == null) {
        return new Collection();
      }
      if (typeof setting === 'number') {
        if (setting === Infinity) {
          return new Collection();
        }
        return new LimitedCollection({ maxSize: setting });
      }
      /* eslint-disable eqeqeq */
      const noSweeping =
        setting.sweepFilter == null ||
        setting.sweepInterval == null ||
        setting.sweepInterval <= 0 ||
        setting.sweepInterval === Infinity;
      const noLimit = setting.maxSize == null || setting.maxSize === Infinity;
      /* eslint-enable eqeqeq */
      if (noSweeping && noLimit) {
        return new Collection();
      }
      return new LimitedCollection(setting);
    };
  }

  /**
   * Create a cache factory that always caches everything.
   * @returns {CacheFactory}
   */
  static cacheEverything() {
    const { Collection } = require('@discordjs/collection');
    return () => new Collection();
  }

  /**
   * The default settings passed to {@link ClientOptions.makeCache}.
   * The caches that this changes are:
   * * `MessageManager` - Limit to 200 messages
   * * `ChannelManager` - Sweep archived threads
   * * `GuildChannelManager` - Sweep archived threads
   * * `ThreadManager` - Sweep archived threads
   * <info>If you want to keep default behavior and add on top of it you can use this object and add on to it, e.g.
   * `makeCache: Options.cacheWithLimits({ ...Options.defaultMakeCacheSettings, ReactionManager: 0 })`</info>
   * @type {Object<string, LimitedCollectionOptions|number>}
   */
  static get defaultMakeCacheSettings() {
    return {
      MessageManager: 200,
      ChannelManager: {
        sweepInterval: 3600,
        sweepFilter: require('./Util').archivedThreadSweepFilter(),
      },
      GuildChannelManager: {
        sweepInterval: 3600,
        sweepFilter: require('./Util').archivedThreadSweepFilter(),
      },
      ThreadManager: {
        sweepInterval: 3600,
        sweepFilter: require('./Util').archivedThreadSweepFilter(),
      },
    };
  }
}

/**
 * The default settings passed to {@link ClientOptions.sweepers}.
 * The sweepers that this changes are:
 * * `threads` - Sweep archived threads every hour, removing those archived more than 4 hours ago
 * <info>If you want to keep default behavior and add on top of it you can use this object and add on to it, e.g.
 * `sweepers: { ...Options.defaultSweeperSettings, messages: { interval: 300, lifetime: 600 } }`</info>
 * @type {SweeperOptions}
 */
Options.defaultSweeperSettings = {
  threads: {
    interval: 3600,
    lifetime: 14400,
  },
};

module.exports = Options;
