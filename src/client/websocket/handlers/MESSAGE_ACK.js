'use strict';

const { Events } = require('../../../util/Constants');

module.exports = (client, { d: data }) => {
  const channel = client.channels.cache.get(data.channel_id);
  /**
   * Emitted whenever message is acknowledged (mark read / unread)
   * @event Client#messageAck
   * @param {TextChannel} channel Channel
   * @param {Snowflake} message_id Message ID
   * @param {boolean} isRead Whether the message is read
   * @param {Object} raw Raw data
   */
  client.emit(Events.MESSAGE_ACK, channel, data.message_id, !data.manual, data);
};
