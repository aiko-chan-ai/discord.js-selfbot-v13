'use strict';
const { Events } = require('../../../util/Constants');

module.exports = (client, { d: data }) => {
  /**
   * Emitted whenever client user send interaction and error
   * @event Client#interactionFailure
   * @param {InteractionResponseBody} data data
   */
  client.emit(Events.INTERACTION_FAILURE, data);
  client.emit('interactionResponse', {
    status: false,
    metadata: data,
  });
};
