'use strict';

const { Events, RelationshipTypes } = require('../../../util/Constants');

module.exports = (client, { d: data }) => {
  if (data.user) {
    client.users._add(data.user);
  }
  client.relationships.cache.set(data.id, data.type);
  /**
   * Emitted whenever a relationship is updated.
   * @event Client#relationshipAdd
   * @param {Snowflake} user The userID that was updated
   * @param {RelationshipTypes} type The new relationship type
   */
  client.emit(Events.RELATIONSHIP_ADD, data.id, RelationshipTypes[data.type]);
};
