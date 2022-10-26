'use strict';
const { Events } = require('../../../util/Constants');
module.exports = (client, packet) => {
  /**
   * Emitted whenever a recipient is removed from a group DM.
   * @event Client#channelRecipientRemove
   * @param {PartialGroupDMChannel} channel Group DM channel
   * @param {User} user User
   */
  const channel = client.channels.cache.get(packet.d.channel_id);
  if (!channel) return;
  if (!channel._recipients) channel._recipients = [];
  channel._recipients = channel._recipients.filter(r => r !== packet.d.user.id);
  const user = client.users._add(packet.d.user);
  client.emit(Events.CHANNEL_RECIPIENT_REMOVE, channel, user);
};
