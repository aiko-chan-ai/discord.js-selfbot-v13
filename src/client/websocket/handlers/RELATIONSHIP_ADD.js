'use strict';

const { Events } = require('../../../util/Constants');

module.exports = (client, { d: data }) => {
  if (data.user) {
    client.users._add(data.user);
  }
  client.relationships.cache.set(data.id, data.type);
  /**
   * Emitted whenever a relationship is updated.
   * @event Client#relationshipAdd
   * @param {UserId} user The userID that was updated
   * @param {Number} type The new relationship type
   */
  client.emit(Events.RELATIONSHIP_ADD, data.id, data.type);
};
