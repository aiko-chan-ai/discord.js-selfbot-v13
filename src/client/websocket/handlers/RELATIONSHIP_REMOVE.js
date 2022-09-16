'use strict';

const { Events, RelationshipTypes } = require('../../../util/Constants');

module.exports = (client, { d: data }) => {
  client.relationships.cache.delete(data.id);
  client.user.friendNicknames.delete(data.id);
  /**
   * Emitted whenever a relationship is delete.
   * @event Client#relationshipRemove
   * @param {Snowflake} user The userID that was updated
   * @param {RelationshipTypes} type The type of the old relationship
   */
  client.emit(Events.RELATIONSHIP_REMOVE, data.id, RelationshipTypes[data.type]);
};
