'use strict';
const { Events } = require('../../../util/Constants');
module.exports = (client, { d: data }) => {
  const guild = client.guilds.cache.get(data.guild_id);
  guild?.settings._patch(data);
  /**
   * Emitted whenever guild settings are updated
   * @event Client#userGuildSettingsUpdate
   * @param {Guild} guild Guild
   */
  return client.emit(Events.USER_GUILD_SETTINGS_UPDATE, guild);
};
