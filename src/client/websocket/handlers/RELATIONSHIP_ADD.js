'use strict';

const { Events } = require('../../../util/Constants');

module.exports = (client, { d: data }) => {
  if (data.user) {
    client.users._add(data.user);
  }
  client.relationships.cache.set(data.id, data.type);
  client.relationships.friendNicknames.set(data.id, data.nickname);
  client.relationships.sinceCache.set(data.id, new Date(data.since || 0));
  /**
   * Emitted when a relationship is created, relevant to the current user.
   * @event Client#relationshipAdd
   * @param {Snowflake} user Target userId
   * @param {boolean} shouldNotify Whether the client should notify the user of this relationship's creation
   */
  client.emit(Events.RELATIONSHIP_ADD, data.id, Boolean(data.should_notify));
};
