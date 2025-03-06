'use strict';

const { Collection } = require('@discordjs/collection');
const { Events } = require('../../../util/Constants');
const { ReadState } = require('../../../structures/ReadState');

module.exports = (client, { d: data }) => {
  let readStates = client.readStates.get('CHANNEL');

  const lastViewed = data.last_viewed === 0 || data.last_viewed ? data.last_viewed : undefined;

  let before = null, after = null;
  if (readStates) {
    after = readStates.get(data.channel_id) ?? null;
    if (after) {
      before = after._copy();
      after.lastAckedId = data.channel_id;
      if (lastViewed !== undefined) after.lastViewed = lastViewed;
      if (data.mention_count !== undefined) after.mentionCount = data.mentionCount;
    } else {
      after = new ReadState(client, {
        id: data.channel_id,
        last_acked_id: data.message_id,
        mention_count: data.mention_count,
        last_viewed: lastViewed,
        read_state_type: 0,
      });
      readStates.set(after.id, after);
    }
  } else {
    after = new ReadState(client, {
      id: data.channel_id,
      last_acked_id: data.message_id,
      mention_count: data.mention_count,
      last_viewed: lastViewed,
      read_state_type: 0,
    });

    readStates = new Collection();
    readStates.set(after.id, after);
    client.readStates.cache.set('CHANNEL', readStates);
  }

  /**
   * Emitted when a message is acked.
   * @event Client#messageAck
   * @param {?ReadState} before Old read state
   * @param {ReadState} after New read state
   */
  client.emit(Events.MESSAGE_ACK, before, after);
};
