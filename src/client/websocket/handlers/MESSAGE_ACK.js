'use strict';

const { Collection } = require('@discordjs/collection');
const { Events } = require('../../../util/Constants');
const { ReadState } = require('../../../structures/ReadState');

module.exports = (client, { d: data }) => {
  let readStates = client.readStates.get(0);

  let before = null, after = null;
  if (readStates) {
    after = readStates.get(data.channel_id) ?? null;
    if (after) {
      before = after._copy();
      after.lastAckedId = data.channel_id;
    } else {
      after = new ReadState(client, {
        id: data.channel_id,
        last_acked_id: data.message_id,
        badge_count: 0,
        read_state_type: 0,
      });
      readStates.set(after.id, after);
    }
  } else {
    after = new ReadState(client, {
      id: data.channel_id,
      last_acked_id: data.message_id,
      badge_count: 0,
      read_state_type: 0,
    });

    readStates = new Collection();
    readStates.set(after.id, after);
    client.readStates.set(0, readStates);
  }

  /**
   * Emitted when a message is acked.
   * @event Client#messageAck
   * @param {?ReadState} before Old read state
   * @param {ReadState} after New read state
   */
  client.emit(Events.MESSAGE_ACK, before, after);
};
