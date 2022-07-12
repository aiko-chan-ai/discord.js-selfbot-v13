'use strict';
const { Events } = require('../../../util/Constants');

module.exports = (client, { d: data }) => {
  /**
   * Emitted whenever client user send interaction and success
   * @event Client#interactionSuccess
   * @param {InteractionResponseBody} data data
   */
  client.emit(Events.INTERACTION_SUCCESS, data);
  client.emit('interactionResponse', {
    status: true,
    metadata: data,
  });
};
