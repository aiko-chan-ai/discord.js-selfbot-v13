'use strict';
const { Collection } = require('@discordjs/collection');
const { ApplicationRoleConnectionMetadata } = require('./ApplicationRoleConnectionMetadata');
const Base = require('./Base');
const ApplicationFlags = require('../util/ApplicationFlags');
const { ClientApplicationAssetTypes, Endpoints, ApplicationRoleConnectionMetadataTypes } = require('../util/Constants');
const DataResolver = require('../util/DataResolver');
const Permissions = require('../util/Permissions');
const SnowflakeUtil = require('../util/SnowflakeUtil');

const AssetTypes = Object.keys(ClientApplicationAssetTypes);

/**
 * Represents an OAuth2 Application.
 * @extends {Base}
 * @abstract
 */
class DeveloperPortalApplication extends Base {
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

    if ('bot' in data) {
      /**
       * Bot application
       * @type {User}
       */
      this.bot = this.client.users._add(data.bot);
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
       * @type {?boolean}
       */
      this.botRequireCodeGrant = data.bot_require_code_grant;
    } else {
      this.botRequireCodeGrant ??= null;
    }

    if ('bot_public' in data) {
      /**
       * If this application's bot is public
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
    this.owner = null;
    if (data.owner.username == `team${data.owner.id}` && data.owner.discriminator == '0000') {
      this.owner = this.client.developerPortal.teams.get(data.owner.id);
    } else {
      this.owner = data.owner ? this.client.users._add(data.owner) : this.owner ?? null;
    }

    /**
     * Redirect URIs for this application
     * @type {Array<string>}
     */
    this.redirectURIs = data.redirect_uris ?? [];

    /**
     * BOT_HTTP_INTERACTIONS feature flag
     * @type {?string}
     */
    this.interactionEndpointURL = data.interactions_endpoint_url ?? null;

    /**
     * Public key
     * @type {?string}
     */
    this.publicKey = data.verify_key ?? null;

    /**
     * @typedef {Object} Tester
     * @property {number} state The state of the tester (2: Accepted, 1: Pending)
     * @property {User} user The user that the tester is
     */
    /**
     * User tester
     * @type {Collection<Snowflake, Tester>}
     */
    this.testers = new Collection(); // <Snowflake, User>

    /**
     * Terms of service URL
     * @type {?string}
     */
    this.TermsOfService = data.terms_of_service_url ?? null;

    /**
     * Privacy policy URL
     * @type {?string}
     */
    this.PrivacyPolicy = data.privacy_policy_url ?? null;

    if ('role_connections_verification_url' in data) {
      /**
       * This application's role connection verification entry point URL
       * @type {?string}
       */
      this.roleConnectionsVerificationURL = data.role_connections_verification_url;
    } else {
      this.roleConnectionsVerificationURL ??= null;
    }
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
    const assets = await this.client.api.oauth2.applications(this.id).assets.get();
    return assets.map(a => ({
      id: a.id,
      name: a.name,
      type: AssetTypes[a.type - 1],
    }));
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
   * Obtains this application from Discord.
   * @returns {Promise<DeveloperPortalApplication>}
   */
  async fetch() {
    const app = await this.client.api.applications[this.id].get();
    this._patch(app);
    return this;
  }

  /**
   * Gets all testers for this application.
   * @returns {Promise<DeveloperPortalApplication>}
   */
  async fetchTesters() {
    const app = await this.client.api.applications[this.id].allowlist.get();
    this.testers = new Collection();
    for (const tester of app || []) {
      this.testers.set(tester.user.id, {
        state: tester.state,
        user: this.client.users._add(tester.user),
      });
    }
    return this;
  }

  /**
   * Add user to this application's allowlist.
   * @param {string} username Username of the user to add
   * @param {string} discriminator Discriminator of the user to add
   * @returns {Promise<DeveloperPortalApplication>}
   */
  async addTester(username, discriminator) {
    const app = await this.client.api.applications[this.id].allowlist.post({
      data: {
        username,
        discriminator,
      },
    });
    this.testers.set(app.user.id, {
      state: app.state,
      user: this.client.users._add(app.user),
    });
    return this;
  }

  /**
   * Delete user from this application's allowlist.
   * @param {UserResolvable} user User
   * @returns {Promise<DeveloperPortalApplication>}
   */
  async deleteTester(user) {
    const userId = this.client.users.resolveId(user);
    await this.client.api.applications[this.id].allowlist[userId].delete();
    this.testers.delete(userId);
    return this;
  }

  /**
   * The data for editing a application.
   * @typedef {Object} ApplicationEditData
   * @property {string} [name] The name of the app
   * @property {string} [description] The description of the app
   * @property {?(BufferResolvable|Base64Resolvable)} [icon] The icon of the app
   * @property {?(BufferResolvable|Base64Resolvable)} [cover] The application's default rich presence invite
   * @property {boolean} [botPublic] When false only app owner can join the app's bot to guilds
   * @property {boolean} [botRequireCodeGrant] When true the app's bot will only join upon completion of the full oauth2 code grant flow
   * @property {?string} [TermsOfService] ToS URL
   * @property {?string} [PrivacyPolicy] Privacy policy URL
   * @property {number} [flags] The application's public flags
   * @property {Array<string>} [redirectURIs] Redirect URIs (OAuth2 only)
   * @property {Array<string>} [tags] Up to 5 tags describing the content and functionality of the application
   */
  /**
   * Edits this application.
   * @param {ApplicationEditData} data Edit data for the application
   * @returns {Promise<DeveloperPortalApplication>}
   */
  async edit(data) {
    const _data = {};
    if (data.name) _data.name = data.name;
    if (typeof data.icon !== 'undefined') {
      _data.icon = await DataResolver.resolveImage(data.icon);
    }
    if (data.description) _data.description = data.description;
    if (typeof data.cover !== 'undefined') {
      _data.cover = await DataResolver.resolveImage(data.cover);
    }
    if (data.botPublic) _data.bot_public = data.botPublic;
    if (data.botRequireCodeGrant) _data.bot_require_code_grant = data.botRequireCodeGrant;
    if (data.TermsOfService) _data.terms_of_service_url = data.TermsOfService;
    if (data.PrivacyPolicy) _data.privacy_policy_url = data.PrivacyPolicy;
    if (data.flags) _data.flags = data.flags;
    if (data.redirectURIs) _data.redirect_uris = data.redirectURIs;
    if (data.tags) _data.tags = data.tags;
    //
    const app = await this.client.api.applications[this.id].patch({ data: _data });
    this._patch(app);
    return this;
  }

  /**
   * Creates a new bot for this application.
   * @returns {Promise<DeveloperPortalApplication>}
   */
  async createBot() {
    if (this.bot) throw new Error('Application already has a bot.');
    await this.client.api.applications[this.id].bot.post();
    const app = await this.fetch();
    return app;
  }

  /**
   * Reset CLient Secret for this application.
   * @param {number} MFACode The MFA code (if required)
   * @returns {Promise<string>}
   */
  async resetClientSecret(MFACode) {
    const app = MFACode
      ? await this.client.api.applications[this.id].reset.post({
          data: {
            code: MFACode,
          },
        })
      : await this.client.api.applications[this.id].reset.post();
    return app.secret;
  }

  /**
   * Reset Bot Token for this application.
   * @param {number} MFACode The MFA code (if required)
   * @returns {Promise<string>}
   */
  async resetBotToken(MFACode) {
    const app = MFACode
      ? await this.client.api.applications[this.id].bot.reset.post({
          data: {
            code: MFACode,
          },
        })
      : await this.client.api.applications[this.id].bot.reset.post();
    return app.token;
  }

  /**
   * Deletes this application.
   * @param {number} MFACode The MFA code (if required)
   * @returns {Promise<void>}
   */
  delete(MFACode) {
    return this.client.developerPortal.deleteApplication(this.id, MFACode);
  }

  /**
   * Add new image to this application. (RPC)
   * @param {BufferResolvable|Base64Resolvable} image Image Resolvable
   * @param {string} name Name of the image
   * @returns {ApplicationAsset}
   */
  async addAsset(image, name) {
    const data = await DataResolver.resolveImage(image);
    const asset = await this.client.api.applications[this.id].assets.post({
      data: {
        type: 1,
        name,
        image: data,
      },
    });
    return {
      id: asset.id,
      name: asset.name,
      type: AssetTypes[asset.type - 1],
    };
  }

  /**
   * Delete an image from this application. (RPC)
   * @param {Snowflake} id ID of the image
   * @returns {Promise<undefined>}
   */
  async deleteAsset(id) {
    await this.client.api.applications[this.id].assets[id].delete();
    return undefined;
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
   * Data for creating or editing an application role connection metadata.
   * @typedef {Object} ApplicationRoleConnectionMetadataEditOptions
   * @property {string} name The name of the metadata field
   * @property {?Object<Locale, string>} [nameLocalizations] The name localizations for the metadata field
   * @property {string} description The description of the metadata field
   * @property {?Object<Locale, string>} [descriptionLocalizations] The description localizations for the metadata field
   * @property {string} key The dictionary key of the metadata field
   * @property {ApplicationRoleConnectionMetadataType} type The type of the metadata field
   */

  /**
   * Updates this application's role connection metadata records
   * @param {ApplicationRoleConnectionMetadataEditOptions[]} records The new role connection metadata records
   * @returns {Promise<ApplicationRoleConnectionMetadata[]>}
   */
  async editRoleConnectionMetadataRecords(records) {
    const newRecords = await this.client.api
      .applications(this.client.user.id)('role-connections')
      .metadata.put({
        data: records.map(record => ({
          type: typeof record.type === 'string' ? ApplicationRoleConnectionMetadataTypes[record.type] : record.type,
          key: record.key,
          name: record.name,
          name_localizations: record.nameLocalizations,
          description: record.description,
          description_localizations: record.descriptionLocalizations,
        })),
      });

    return newRecords.map(data => new ApplicationRoleConnectionMetadata(data));
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

module.exports = DeveloperPortalApplication;
