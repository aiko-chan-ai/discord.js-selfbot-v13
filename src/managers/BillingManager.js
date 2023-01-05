'use strict';

const { Collection } = require('@discordjs/collection');
const BaseManager = require('./BaseManager');
const GuildBoost = require('../structures/GuildBoost');

/**
 * Manages the API methods of a data model.
 * @extends {CachedManager}
 */
class BillingManager extends BaseManager {
  constructor(client) {
    super(client);
    /**
     * All the payment sources of the client
     * @type {Collection<Snowflake, Object>}
     */
    this.paymentSources = new Collection();
    /**
     * All the guild boosts of the client
     * @type {Collection<Snowflake, GuildBoost>}
     */
    this.guildBoosts = new Collection();
    /**
     * The current subscription of the client
     * @type {Collection<Snowflake, Object>}
     */
    this.currentSubscription = new Collection();
  }

  /**
   * Fetches all the payment sources of the client
   * @returns {Collection<Snowflake, Object>}
   */
  async fetchPaymentSources() {
    // https://discord.com/api/v9/users/@me/billing/payment-sources
    const d = await this.client.api.users('@me').billing['payment-sources'].get();
    // ! TODO: Create a PaymentSource class
    this.paymentSources = new Collection(d.map(s => [s.id, s]));
    return this.paymentSources;
  }

  /**
   * Fetches all the guild boosts of the client
   * @returns {Collection<Snowflake, GuildBoost>}
   */
  async fetchGuildBoosts() {
    // https://discord.com/api/v9/users/@me/guilds/premium/subscription-slots
    const d = await this.client.api.users('@me').guilds.premium['subscription-slots'].get();
    this.guildBoosts = new Collection(d.map(s => [s.id, new GuildBoost(this.client, s)]));
    return this.guildBoosts;
  }

  /**
   * Fetches the current subscription of the client
   * @returns {Collection<Snowflake, Object>}
   */
  async fetchCurrentSubscription() {
    // https://discord.com/api/v9/users/@me/billing/subscriptions
    const d = await this.client.api.users('@me').billing.subscriptions.get();
    this.currentSubscription = new Collection(d.map(s => [s.id, s]));
    return this.currentSubscription;
  }
}

module.exports = BillingManager;
