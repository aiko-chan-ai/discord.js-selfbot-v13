'use strict';

const { Events } = require('../../../util/Constants');

module.exports = (client, { d: data }) => {
  if (data.guild_id === null) {
    const before = client.guildSettings._copy();
    client.guildSettings._patch(data);
  
    /**
     * Emitted when guild settings are updated.
     * @event Client#guildSettingsUpdate
     * @param {GuildSettingManager} before The guild setting
     * @param {GuildSettingManager} after The guild setting
     */
    client.emit(Events.USER_GUILD_SETTINGS_UPDATE, before, client.guildSettings);
  } else {
    let guild = client.guilds.cache.get(data.guild_id);
    if (!guild) return;
    
    const before = client.guildSettings._copy();
    guild.settings._patch(data);

    client.emit(Events.USER_GUILD_SETTINGS_UPDATE, before, guild.settings);
  }
};
