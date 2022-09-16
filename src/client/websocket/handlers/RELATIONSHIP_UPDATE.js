'use strict';

const { Events, RelationshipTypes } = require('../../../util/Constants');

module.exports = (client, { d: data }) => {
  client.relationships.cache.set(data.id, data.type);
  /**
   * Emitted whenever a relationship is updated.
   * @event Client#relationshipUpdate
   * @param {Snowflake} user The userID that was updated
   * @param {RelationshipTypes} type The new relationship type
   * @param {Object} data The raw data
   */
  if ('nickname' in data) {
    client.user.friendNicknames.set(data.id, data.nickname);
  }
  client.emit(Events.RELATIONSHIP_UPDATE, data.id, RelationshipTypes[data.type], data);
};
