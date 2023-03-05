'use strict';
const Call = require('../../../structures/Call');
const { Events } = require('../../../util/Constants');
module.exports = (client, packet) => {
  /**
   * Emitted whenever update a call
   * @event Client#callUpdate
   * @param {Call} call Call
   */
  client.emit(Events.CALL_UPDATE, new Call(client, packet.d));
};
