'use strict';
const { Events } = require('../../../util/Constants');

module.exports = (client, { d: data }) => {
  for (const command of data.application_commands) {
    const user = client.users.cache.get(command.application_id);
    if (!user || !user.bot) continue;
    user.application?.commands?._add(command, true);
  }
  client.emit(Events.GUILD_APPLICATION_COMMANDS_UPDATE, data);
};
