'use strict';
const { Events } = require('../../../util/Constants');
module.exports = (client, packet) => {
  /**
   * Emitted whenever a recipient is added from a group DM.
   * @event Client#channelRecipientAdd
   * @param {PartialGroupDMChannel} channel Group DM channel
   * @param {User} user User
   */
  const channel = client.channels.cache.get(packet.d.channel_id);
  if (!channel) return;
  if (!channel._recipients) channel._recipients = [];
  channel._recipients.push(packet.d.user);
  const user = client.users._add(packet.d.user);
  client.emit(Events.CHANNEL_RECIPIENT_ADD, channel, user);
};
