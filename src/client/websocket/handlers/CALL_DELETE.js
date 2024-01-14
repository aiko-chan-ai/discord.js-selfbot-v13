'use strict';
const CallState = require('../../../structures/CallState');
const { Events } = require('../../../util/Constants');
module.exports = (client, packet) => {
  /**
   * Emitted whenever delete a call
   * @event Client#callDelete
   * @param {Call} call Call
   */
  client.emit(Events.CALL_DELETE, new CallState(client, packet.d));
};
