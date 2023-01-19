'use strict';

const Base = require('./Base');

/**
 * Represents a guild boost in a guild on Discord.
 * @extends {Base}
 */
class GuildBoost extends Base {
  constructor(client, data) {
    super(client);
    this._patch(data);
  }

  _patch(data) {
    if ('id' in data) {
      /**
       * The id of the guild boost
       * @type {Snowflake}
       */
      this.id = data.id;
    }
    if ('subscription_id' in data) {
      /**
       * The id of the subscription
       * @type {Snowflake}
       */
      this.subscriptionId = data.subscription_id;
    }
    if (typeof data.premium_guild_subscription === 'object' && data.premium_guild_subscription !== null) {
      /**
       * The premium guild subscription id
       * @type {?Snowflake}
       */
      this.premiumGuildSubscriptionId = data.premium_guild_subscription.id;
      /**
       * Guild id
       * @type {?Snowflake}
       */
      this.guildId = data.premium_guild_subscription.guild_id;
      /**
       * Ended ???
       * @type {?boolean}
       */
      this.ended = data.premium_guild_subscription.ended;
    }
    if ('canceled' in data) {
      /**
       * Whether the subscription is canceled
       * @type {boolean}
       */
      this.canceled = data.canceled;
    }
    if ('cooldown_ends_at' in data) {
      /**
       * The cooldown end date
       * @type {Date}
       */
      this.cooldownEndsAt = new Date(data.cooldown_ends_at);
    }
  }
  /**
   * The guild of the boost
   * @type {?Guild}
   * @readonly
   */
  get guilld() {
    return this.client.guilds.cache.get(this.guildId);
  }

  /**
   * Cancel the boost
   * @returns {Promise<GuildBoost>}
   */
  async unsubscribe() {
    // https://discord.com/api/v9/guilds/:id/premium/subscriptions/:id
    if (!this.guildId) throw new Error('BOOST_UNUSED');
    if (!this.premiumGuildSubscriptionId) throw new Error('BOOST_UNCACHED');
    await this.client.api.guilds(this.guildId).premium.subscriptions(this.premiumGuildSubscriptionId).delete();
    this.guildId = null;
    this.premiumGuildSubscriptionId = null;
    this.ended = null;
    return this;
  }

  /**
   * Use the boost
   * @param {GuildResolvable} guild The guild to use the boost on
   * @returns {Promise<GuildBoost>}
   */
  async subscribe(guild) {
    // https://discord.com/api/v9/guilds/:id/premium/subscriptions
    if (this.guildId || this.premiumGuildSubscriptionId) throw new Error('BOOST_USED');
    const id = this.client.guilds.resolveId(guild);
    if (!id) throw new Error('UNKNOWN_GUILD');
    const d = await this.client.api.guilds(id).premium.subscriptions.put({
      data: {
        user_premium_guild_subscription_slot_ids: [this.id],
      },
    });
    this._patch({
      premium_guild_subscription: d,
    });
    return this;
  }
}

module.exports = GuildBoost;
