'use strict';

module.exports = (client, { d: data }) =>
  // Client.user.messageMentions.delete(data.channel_id);
  `${client}:${data}`;
