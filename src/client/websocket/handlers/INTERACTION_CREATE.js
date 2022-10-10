'use strict';
const { Events } = require('../../../util/Constants');

/**
 * @typedef {Object} InteractionResponseBody
 * @property {Snowflake} id Interaction ID
 * @property {Snowflake} nonce nonce in POST /interactions
 */

module.exports = (client, packet) => {
  if (client.user.bot) {
    client.actions.InteractionCreate.handle(packet.d);
  } else {
    client.emit(Events.INTERACTION_CREATE, packet.d);
  }
};
