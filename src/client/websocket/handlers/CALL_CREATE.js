'use strict';
const CallState = require('../../../structures/CallState');
const { Events } = require('../../../util/Constants');
module.exports = (client, packet) => {
  for (const voice of packet.d.voice_states) {
    client.actions.VoiceStateUpdate.handle(voice);
  }
  /**
   * Emitted whenever received a call
   * @event Client#callCreate
   * @param {CallState} call Call
   */
  client.emit(Events.CALL_CREATE, new CallState(client, packet.d));
};
