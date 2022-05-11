'use strict';
const { Events } = require('../../../util/Constants');

module.exports = (client, { d: data }) => {
  if (!data.application_commands[0]) return;
  for (const command of data.application_commands) {
    const user = client.users.cache.get(command.application_id);
    if (!user) continue;
    user.applications._add(command, true);
  }
  client.emit(
    Events.GUILD_APPLICATION_COMMANDS_UPDATE,
    client.users.cache.get(data.application_commands[0].application_id).applications.cache,
  );
};
