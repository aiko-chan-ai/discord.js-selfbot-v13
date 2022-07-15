'use strict';
const { Events } = require('../../../util/Constants');
module.exports = (client, packet) => {
  for (const voice of packet.d.voice_states) {
    client.actions.VoiceStateUpdate.handle(voice);
  }
  /**
   * Emitted whenever received a call
   * @event Client#callCreate
   * @param {Snowflake} channelId DM / Group DM channel ID
   * @param {string} region Voice server region
   * @param {?Snowflake[]} ringing List of user ID who is ringing
   */
  client.emit(Events.CALL_CREATE, packet.d.channel_id, packet.d.region, packet.d.ringing);
};
