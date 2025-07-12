'use strict';

const process = require('node:process');
const ApplicationFlags = require('../../util/ApplicationFlags');
const { ClientApplicationAssetTypes, Endpoints } = require('../../util/Constants');
const Permissions = require('../../util/Permissions');
const SnowflakeUtil = require('../../util/SnowflakeUtil');
const { ApplicationRoleConnectionMetadata } = require('../ApplicationRoleConnectionMetadata');
const Base = require('../Base');
const Team = require('../Team');

const AssetTypes = Object.keys(ClientApplicationAssetTypes);

let deprecationEmittedForFetchAssets = false;

/**
 * Represents an OAuth2 Application.
 * @extends {Base}
 * @abstract
 */
class Application extends Base {
  constructor(client, data) {
    super(client);
    this._patch(data);
  }

  _patch(data) {
    /**
     * The application's id
     * @type {Snowflake}
     */
    this.id = data.id;

    if ('name' in data) {
      /**
       * The name of the application
       * @type {?string}
       */
      this.name = data.name;
    } else {
      this.name ??= null;
    }

    if ('description' in data) {
      /**
       * The application's description
       * @type {?string}
       */
      this.description = data.description;
    } else {
      this.description ??= null;
    }

    if ('icon' in data) {
      /**
       * The application's icon hash
       * @type {?string}
       */
      this.icon = data.icon;
    } else {
      this.icon ??= null;
    }

    if ('terms_of_service_url' in data) {
      /**
       * The URL of the application's terms of service
       * @type {?string}
       */
      this.termsOfServiceURL = data.terms_of_service_url;
    } else {
      this.termsOfServiceURL ??= null;
    }

    if ('privacy_policy_url' in data) {
      /**
       * The URL of the application's privacy policy
       * @type {?string}
       */
      this.privacyPolicyURL = data.privacy_policy_url;
    } else {
      this.privacyPolicyURL ??= null;
    }

    if ('verify_key' in data) {
      /**
       * The hex-encoded key for verification in interactions and the GameSDK's GetTicket
       * @type {?string}
       */
      this.verifyKey = data.verify_key;
    } else {
      this.verifyKey ??= null;
    }

    if ('role_connections_verification_url' in data) {
      /**
       * This application's role connection verification entry point URL
       * @type {?string}
       */
      this.roleConnectionsVerificationURL = data.role_connections_verification_url;
    } else {
      this.roleConnectionsVerificationURL ??= null;
    }

    /**
     * The tags this application has (max of 5)
     * @type {string[]}
     */
    this.tags = data.tags ?? [];

    if ('install_params' in data) {
      /**
       * Settings for this application's default in-app authorization
       * @type {?ClientApplicationInstallParams}
       */
      this.installParams = {
        scopes: data.install_params.scopes,
        permissions: new Permissions(data.install_params.permissions).freeze(),
      };
    } else {
      this.installParams ??= null;
    }

    if ('custom_install_url' in data) {
      /**
       * This application's custom installation URL
       * @type {?string}
       */
      this.customInstallURL = data.custom_install_url;
    } else {
      this.customInstallURL = null;
    }

    if ('flags' in data) {
      /**
       * The flags this application has
       * @type {ApplicationFlags}
       */
      this.flags = new ApplicationFlags(data.flags).freeze();
    }

    if ('approximate_guild_count' in data) {
      /**
       * An approximate amount of guilds this application is in.
       * @type {?number}
       */
      this.approximateGuildCount = data.approximate_guild_count;
    } else {
      this.approximateGuildCount ??= null;
    }

    if ('guild_id' in data) {
      /**
       * The id of the guild associated with this application.
       * @type {?Snowflake}
       */
      this.guildId = data.guild_id;
    } else {
      this.guildId ??= null;
    }

    if ('cover_image' in data) {
      /**
       * The hash of the application's cover image
       * @type {?string}
       */
      this.cover = data.cover_image;
    } else {
      this.cover ??= null;
    }

    if ('rpc_origins' in data) {
      /**
       * The application's RPC origins, if enabled
       * @type {string[]}
       */
      this.rpcOrigins = data.rpc_origins;
    } else {
      this.rpcOrigins ??= [];
    }

    if ('bot_require_code_grant' in data) {
      /**
       * If this application's bot requires a code grant when using the OAuth2 flow
       * @deprecated
       * @type {?boolean}
       */
      this.botRequireCodeGrant = data.bot_require_code_grant;
    } else {
      this.botRequireCodeGrant ??= null;
    }

    if ('bot_public' in data) {
      /**
       * If this application's bot is public
       * @deprecated
       * @type {?boolean}
       */
      this.botPublic = data.bot_public;
    } else {
      this.botPublic ??= null;
    }

    /**
     * The owner of this OAuth application
     * @type {?(User|Team)}
     */
    this.owner = data.team
      ? new Team(this.client, data.team)
      : data.owner
      ? this.client.users._add(data.owner)
      : this.owner ?? null;

    if ('splash' in data) {
      /**
       * The application's splash image hash
       * @type {?string}
       */
      this.splash = data.splash;
    } else {
      this.splash ??= null;
    }

    if ('type' in data) {
      /**
       * The type of the application
       * @type {number}
       * @see {@link https://docs.discord.food/resources/application#application-type}
       */
      this.type = data.type;
    } else {
      this.type = null;
    }

    if ('primary_sku_id' in data) {
      /**
       * The ID of the application's primary SKU (game, application subscription, etc.)
       * @type {?Snowflake}
       */
      this.primarySkuId = data.primary_sku_id;
    } else {
      this.primarySkuId = null;
    }

    if ('eula_id' in data) {
      /**
       * The ID of the application's EULA
       * @type {?Snowflake}
       */
      this.eulaId = data.eula_id;
    } else {
      this.eulaId = null;
    }

    if ('slug' in data) {
      /**
       * The URL slug that links to the primary store page of the application
       * @type {?string}
       */
      this.slug = data.slug;
    } else {
      this.slug = null;
    }

    if ('aliases' in data) {
      /**
       * Other names the application's game is associated with
       * @type {string[]}
       */
      this.aliases = data.aliases;
    } else {
      this.aliases = [];
    }

    if ('executables' in data) {
      /**
       * @typedef {Object} ApplicationExecutable
       * @property {string} os - The operating system the executable can be found on
       * @property {string} name - The name of the executable
       * @property {boolean} is_launcher - Whether the executable is for a game launcher
       */

      /**
       * The unique executables of the application's game
       * @type {?ApplicationExecutable[]}
       */
      this.executables = data.executables;
    } else {
      this.executables ??= null;
    }

    if ('third_party_skus' in data) {
      /**
       * @typedef {Object} ApplicationSku
       * @property {?Snowflake} id - The ID of the game
       * @property {?string} sku - The SKU of the game
       * @property {string} distributor - The distributor of the game
       */

      /**
       * The third party SKUs of the application's game
       * @type {?ApplicationSku[]}
       */
      this.thirdPartySkus = data.third_party_skus;
    } else {
      this.thirdPartySkus ??= null;
    }

    if ('hook' in data) {
      /**
       * Whether the Discord client is allowed to hook into the application's game directly
       * @type {?boolean}
       */
      this.hook = data.hook;
    } else {
      this.hook ??= null;
    }

    if ('overlay' in data) {
      /**
       * Whether the application's game supports the Discord overlay (default false)
       * @type {?boolean}
       */
      this.overlay = data.overlay;
    } else {
      this.overlay ??= null;
    }

    if ('overlay_methods' in data) {
      /**
       * The methods of overlaying that the application's game supports
       * @type {?number}
       */
      this.overlayMethods = data.overlay_methods;
    } else {
      this.overlayMethods ??= null;
    }

    if ('overlay_warn' in data) {
      /**
       * Whether the Discord overlay is known to be problematic with this application's game (default false)
       * @type {?boolean}
       */
      this.overlayWarn = data.overlay_warn;
    } else {
      this.overlayWarn ??= null;
    }

    if ('overlay_compatibility_hook' in data) {
      /**
       * Whether to use the compatibility hook for the overlay (default false)
       * @type {?boolean}
       */
      this.overlayCompatibilityHook = data.overlay_compatibility_hook;
    } else {
      this.overlayCompatibilityHook ??= null;
    }

    if ('bot' in data) {
      /**
       * The bot attached to this application
       * @type {?User}
       */
      this.bot = data.bot;
    } else {
      this.bot ??= null;
    }

    if ('developers' in data) {
      /**
       * @typedef {Object} Company
       * @property {?Snowflake} id - The ID of the company
       * @property {?string} name - The name of the company
       */

      /**
       * The companies that developed the application
       * @type {?Company[]}
       */
      this.developers = data.developers;
    } else {
      this.developers ??= null;
    }

    if ('publishers' in data) {
      /**
       * The companies that published the application
       * @type {?Company[]}
       */
      this.publishers = data.publishers;
    } else {
      this.publishers ??= null;
    }

    if ('redirect_uris' in data) {
      /**
       * The whitelisted URLs for redirecting to during OAuth2 authorization (max 10)
       * @type {?string[]}
       */
      this.redirectUris = data.redirect_uris;
    } else {
      this.redirectUris ??= null;
    }

    if ('deeplink_uri' in data) {
      /**
       * The URL used for deep linking during OAuth2 authorization on mobile devices
       * @type {?string}
       */
      this.deeplinkUri = data.deeplink_uri;
    } else {
      this.deeplinkUri ??= null;
    }

    if ('integration_public' in data) {
      /**
       * Whether only the application owner can add the integration
       * @type {?boolean}
       */
      this.integrationPublic = data.integration_public;
    } else {
      this.integrationPublic ??= null;
    }

    if ('integration_require_code_grant' in data) {
      /**
       * Whether the integration will only be added upon completion of a full OAuth2 token exchange
       * @type {?boolean}
       */
      this.integrationRequireCodeGrant = data.integration_require_code_grant;
    } else {
      this.integrationRequireCodeGrant ??= null;
    }

    if ('bot_disabled' in data) {
      /**
       * Whether the application's bot is disabled by Discord (default false)
       * @type {?boolean}
       */
      this.botDisabled = data.bot_disabled;
    } else {
      this.botDisabled ??= null;
    }

    if ('bot_quarantined' in data) {
      /**
       * Whether the application's bot is quarantined by Discord
       * @type {?boolean}
       */
      this.botQuarantined = data.bot_quarantined;
    } else {
      this.botQuarantined ??= null;
    }

    if ('approximate_user_install_count' in data) {
      /**
       * Approximate count of users that have authorized the application with the applications.commands scope
       * @type {?number}
       */
      this.approximateUserInstallCount = data.approximate_user_install_count;
    } else {
      this.approximateUserInstallCount ??= null;
    }

    if ('approximate_user_authorization_count' in data) {
      /**
       * Approximate count of users that have OAuth2 authorizations for the application
       * @type {?number}
       */
      this.approximateUserAuthorizationCount = data.approximate_user_authorization_count;
    } else {
      this.approximateUserAuthorizationCount ??= null;
    }

    if ('internal_guild_restriction' in data) {
      /**
       * What guilds the application can be authorized in
       * @type {?number}
       */
      this.internalGuildRestriction = data.internal_guild_restriction;
    } else {
      this.internalGuildRestriction ??= null;
    }

    if ('interactions_endpoint_url' in data) {
      /**
       * The URL of the application's interactions endpoint
       * @type {?string}
       */
      this.interactionsEndpointUrl = data.interactions_endpoint_url;
    } else {
      this.interactionsEndpointUrl ??= null;
    }

    if ('interactions_version' in data) {
      /**
       * The version of the application's interactions endpoint implementation
       * @type {?number}
       */
      this.interactionsVersion = data.interactions_version;
    } else {
      this.interactionsVersion ??= null;
    }

    if ('interactions_event_types' in data) {
      /**
       * The enabled event webhook types to send to the interaction endpoint
       * @type {?string[]}
       */
      this.interactionsEventTypes = data.interactions_event_types;
    } else {
      this.interactionsEventTypes ??= null;
    }

    if ('event_webhooks_status' in data) {
      /**
       * Whether event webhooks are enabled
       * @type {?number}
       */
      this.eventWebhooksStatus = data.event_webhooks_status;
    } else {
      this.eventWebhooksStatus ??= null;
    }

    if ('event_webhooks_url' in data) {
      /**
       * The URL of the application's event webhooks endpoint
       * @type {?string}
       */
      this.eventWebhooksUrl = data.event_webhooks_url;
    } else {
      this.eventWebhooksUrl ??= null;
    }

    if ('event_webhooks_types' in data) {
      /**
       * The enabled event webhook types to send to the event webhooks endpoint
       * @type {?string[]}
       */
      this.eventWebhooksTypes = data.event_webhooks_types;
    } else {
      this.eventWebhooksTypes ??= null;
    }

    if ('explicit_content_filter' in data) {
      /**
       * Whether uploaded media content used in application commands is scanned and deleted for explicit content
       * @type {?number}
       */
      this.explicitContentFilter = data.explicit_content_filter;
    } else {
      this.explicitContentFilter ??= null;
    }

    if ('integration_types_config' in data) {
      /**
       * The configuration for each integration type supported by the application
       * @type {?object}
       */
      this.integrationTypesConfig = data.integration_types_config;
    } else {
      this.integrationTypesConfig ??= null;
    }

    if ('is_verified' in data) {
      /**
       * Whether the application is verified
       * @type {?boolean}
       */
      this.isVerified = data.is_verified;
    } else {
      this.isVerified ??= null;
    }

    if ('verification_state' in data) {
      /**
       * The current verification state of the application
       * @type {?number}
       */
      this.verificationState = data.verification_state;
    } else {
      this.verificationState ??= null;
    }

    if ('store_application_state' in data) {
      /**
       * The current store approval state of the commerce application
       * @type {?number}
       */
      this.storeApplicationState = data.store_application_state;
    } else {
      this.storeApplicationState ??= null;
    }

    if ('rpc_application_state' in data) {
      /**
       * The current RPC approval state of the application
       * @type {?number}
       */
      this.rpcApplicationState = data.rpc_application_state;
    } else {
      this.rpcApplicationState ??= null;
    }

    if ('creator_monetization_state' in data) {
      /**
       * The current guild creator monetization state of the application
       * @type {?number}
       */
      this.creatorMonetizationState = data.creator_monetization_state;
    } else {
      this.creatorMonetizationState ??= null;
    }

    if ('is_discoverable' in data) {
      /**
       * Whether the application is discoverable in the application directory
       * @type {?boolean}
       */
      this.isDiscoverable = data.is_discoverable;
    } else {
      this.isDiscoverable ??= null;
    }

    if ('discoverability_state' in data) {
      /**
       * The current application directory discoverability state of the application
       * @type {?number}
       */
      this.discoverabilityState = data.discoverability_state;
    } else {
      this.discoverabilityState ??= null;
    }

    if ('discovery_eligibility_flags' in data) {
      /**
       * The current application directory eligibility flags for the application
       * @type {?number}
       */
      this.discoveryEligibilityFlags = data.discovery_eligibility_flags;
    } else {
      this.discoveryEligibilityFlags ??= null;
    }

    if ('is_monetized' in data) {
      /**
       * Whether the application has monetization enabled
       * @type {?boolean}
       */
      this.isMonetized = data.is_monetized;
    } else {
      this.isMonetized ??= null;
    }

    if ('storefront_available' in data) {
      /**
       * Whether the application has public subscriptions or products available for purchase
       * @type {?boolean}
       */
      this.storefrontAvailable = data.storefront_available;
    } else {
      this.storefrontAvailable ??= null;
    }

    if ('monetization_state' in data) {
      /**
       * The current application monetization state of the application
       * @type {?number}
       */
      this.monetizationState = data.monetization_state;
    } else {
      this.monetizationState ??= null;
    }

    if ('monetization_eligibility_flags' in data) {
      /**
       * The current application monetization eligibility flags for the application
       * @type {?number}
       */
      this.monetizationEligibilityFlags = data.monetization_eligibility_flags;
    } else {
      this.monetizationEligibilityFlags ??= null;
    }

    if ('max_participants' in data) {
      /**
       * The maximum possible participants in the application's embedded activity (-1 for no limit)
       * @type {?number}
       */
      this.maxParticipants = data.max_participants;
    } else {
      this.maxParticipants ??= null;
    }
  }

  /**
   * The guild associated with this application.
   * @type {?Guild}
   * @readonly
   */
  get guild() {
    return this.client.guilds.cache.get(this.guildId) ?? null;
  }

  /**
   * Whether this application is partial
   * @type {boolean}
   * @readonly
   */
  get partial() {
    return !this.name;
  }

  /**
   * The timestamp the application was created at
   * @type {number}
   * @readonly
   */
  get createdTimestamp() {
    return SnowflakeUtil.timestampFrom(this.id);
  }

  /**
   * The time the application was created at
   * @type {Date}
   * @readonly
   */
  get createdAt() {
    return new Date(this.createdTimestamp);
  }

  /**
   * Obtains this application from Discord.
   * @returns {Promise<Application>}
   */
  async fetch() {
    const app = await this.client.api.oauth2.authorize.get({
      query: {
        client_id: this.id,
        scope: 'bot applications.commands',
      },
    });
    const user = this.client.users._add(app.bot);
    user._partial = false;
    this._patch(app.application);
    return this;
  }

  /**
   * Gets this application's role connection metadata records
   * @returns {Promise<ApplicationRoleConnectionMetadata[]>}
   */
  async fetchRoleConnectionMetadataRecords() {
    const metadata = await this.client.api.applications(this.id)('role-connections').metadata.get();
    return metadata.map(data => new ApplicationRoleConnectionMetadata(data));
  }

  /**
   * A link to the application's icon.
   * @param {StaticImageURLOptions} [options={}] Options for the Image URL
   * @returns {?string}
   */
  iconURL({ format, size } = {}) {
    if (!this.icon) return null;
    return this.client.rest.cdn.AppIcon(this.id, this.icon, { format, size });
  }

  /**
   * A link to this application's cover image.
   * @param {StaticImageURLOptions} [options={}] Options for the Image URL
   * @returns {?string}
   */
  coverURL({ format, size } = {}) {
    if (!this.cover) return null;
    return Endpoints.CDN(this.client.options.http.cdn).AppIcon(this.id, this.cover, { format, size });
  }

  /**
   * Asset data.
   * @typedef {Object} ApplicationAsset
   * @property {Snowflake} id The asset's id
   * @property {string} name The asset's name
   * @property {string} type The asset's type
   */

  /**
   * Gets the application's rich presence assets.
   * @returns {Promise<Array<ApplicationAsset>>}
   * @deprecated This will be removed in the next major as it is unsupported functionality.
   */
  async fetchAssets() {
    if (!deprecationEmittedForFetchAssets) {
      process.emitWarning(
        'Application#fetchAssets is deprecated as it is unsupported and will be removed in the next major version.',
        'DeprecationWarning',
      );

      deprecationEmittedForFetchAssets = true;
    }

    const assets = await this.client.api.oauth2.applications(this.id).assets.get();
    return assets.map(a => ({
      id: a.id,
      name: a.name,
      type: AssetTypes[a.type - 1],
    }));
  }

  /**
   * When concatenated with a string, this automatically returns the application's name instead of the
   * Application object.
   * @returns {?string}
   * @example
   * // Logs: Application name: My App
   * console.log(`Application name: ${application}`);
   */
  toString() {
    return this.name;
  }

  toJSON() {
    return super.toJSON({ createdTimestamp: true });
  }
}

module.exports = Application;
