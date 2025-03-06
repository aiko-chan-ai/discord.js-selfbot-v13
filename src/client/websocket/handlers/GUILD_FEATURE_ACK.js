'use strict';

const { Collection } = require('@discordjs/collection');
const { Events } = require('../../../util/Constants');
const { ReadState } = require('../../../structures/ReadState');

module.exports = (client, { d: data }) => {
  let readStates = client.readStates.get(data.ack_type);

  let before = null, after = null;
  if (readStates) {
    after = readStates.get(data.resource_id) ?? null;
    if (after) {
      before = after._copy();
      after.lastAckedId = data.entity_id;
    } else {
      after = new ReadState(client, {
        id: data.resource_id,
        last_acked_id: data.entity_id,
        badge_count: 0,
        read_state_type: data.ack_type,
      });
      readStates.set(after.id, after);
    }
  } else {
    after = new ReadState(client, {
      id: data.resource_id,
      last_acked_id: data.entity_id,
      badge_count: 0,
      read_state_type: data.ack_type,
    });

    readStates = new Collection();
    readStates.set(after.id, after);
    client.readStates.set(data.ack_type, readStates);
  }

  /**
   * Emitted when a guild feature is acked.
   * @event Client#guildFeatureAck
   * @param {?ReadState} before Old read state
   * @param {ReadState} after New read state
   */
  client.emit(Events.GUILD_FEATURE_ACK, before, after);
};
