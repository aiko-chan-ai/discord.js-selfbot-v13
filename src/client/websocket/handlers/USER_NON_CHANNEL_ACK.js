'use strict';

const { Collection } = require('@discordjs/collection');
const { Events, ReadStateTypes } = require('../../../util/Constants');
const ReadState = require('../../../structures/ReadState');

module.exports = (client, { d: data }) => {
  const readStateType = ReadStateTypes[data.ack_type];
  if (readStateType !== 0 && !readStateType) return;
  
  let readStates = client.readStates.cache.get(readStateType);

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
    client.readStates.cache.set(readStateType, readStates);
  }

  /**
   * Emitted when a user feature is acked.
   * @event Client#userFeatureAck
   * @param {?ReadState} before Old read state
   * @param {ReadState} after New read state
   */
  client.emit(Events.USER_FEATURE_ACK, before, after);
};
