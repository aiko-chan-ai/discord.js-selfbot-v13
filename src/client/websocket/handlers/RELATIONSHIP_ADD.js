'use strict';

const { Events, Relationship } = require('../../../util/Constants');

module.exports = (client, { d: data }) => {
  if (data.user) {
    client.users._add(data.user);
  }
  client.relationships.cache.set(data.id, data.type);
  /**
   * Emitted whenever a relationship is updated.
   * @event Client#relationshipAdd
   * @param {UserId} user The userID that was updated
   * @param {RelationshipType} type The new relationship type
   */
  client.emit(Events.RELATIONSHIP_ADD, data.id, Relationship[data.type]);
};
