'use strict';
const { Events } = require('../../../util/Constants');
module.exports = (client, packet) => {
  /**
   * Emitted whenever update a call
   * @event Client#callUpdate
   * @param {Snowflake} channelId DM / Group DM channel ID
   * @param {string} region Voice server region
   * @param {?Snowflake[]} ringing List of user ID who is ringing
   */
  client.emit(Events.CALL_UPDATE, packet.d.channel_id, packet.d.region, packet.d.ringing);
};
