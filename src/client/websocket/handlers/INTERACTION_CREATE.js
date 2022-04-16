'use strict';
const { Events } = require('../../../util/Constants');

module.exports = (client, packet) => {
  if (client.user.bot) client.actions.InteractionCreate.handle(packet.d);
  else client.emit(Events.INTERACTION_CREATE, packet.d);
};
