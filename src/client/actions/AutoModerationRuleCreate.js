'use strict';

const Action = require('./Action');
const { Events } = require('../../util/Constants');

class AutoModerationRuleCreateAction extends Action {
  handle(data) {
    const { client } = this;
    const guild = client.guilds.cache.get(data.guild_id);

    if (guild) {
      const autoModerationRule = guild.autoModerationRules._add(data);

      /**
       * Emitted whenever an auto moderation rule is created.
       * <info>This event requires the {@link Permissions.FLAGS.MANAGE_GUILD} permission.</info>
       * @event Client#autoModerationRuleCreate
       * @param {AutoModerationRule} autoModerationRule The created auto moderation rule
       * @deprecated This event is not received by user accounts.
       */
      client.emit(Events.AUTO_MODERATION_RULE_CREATE, autoModerationRule);
    }

    return {};
  }
}

module.exports = AutoModerationRuleCreateAction;
