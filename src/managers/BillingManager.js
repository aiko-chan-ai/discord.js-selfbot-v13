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
    const d = await this.client.api.users('@me').billing.subscriptions.get();
  
    const currentSubscription = d.map(subscription => {
      return {
        ...subscription,
        /**
         * Cancels the subscription
         * @returns {Promise<void>}
         */
        cancel: async () => {
          return void await this.client.api.users('@me').billing.subscriptions(subscription.id).patch({
            data: {
              payment_source_token: null,
              gateway_checkout_context: null,
              expected_invoice_price: {
                amount: 0,
                currency: subscription.currency
              },
              expected_renewal_price: {
                amount: 0,
                currency: subscription.currency
              },
              items: []
            },
            query: {
              location_stack: [
                "user settings",
                "subscription header", 
                "premium subscription cancellation modal"
              ]
            }
          });
        }
      };
    });
  
    this.currentSubscription = new Collection(currentSubscription.map(s => [s.id, s]));
    return this.currentSubscription;
  }
}

module.exports = BillingManager;