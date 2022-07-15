'use strict';
const { Events } = require('../../../util/Constants');
module.exports = (client, packet) => {
  /**
   * Emitted whenever delete a call
   * @event Client#callDelete
   * @param {Snowflake} channelId DM / Group DM channel ID
   */
  client.emit(Events.CALL_DELETE, packet.d.channel_id);
};
