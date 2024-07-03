'use strict';

const { Events } = require('../../../util/Constants');

module.exports = (client, { d: data }) => {
  /**
   * @typedef {Object} RelationshipUpdateObject
   * @property {RelationshipType} type The type of relationship
   * @property {Date} since When the user requested a relationship
   * @property {string | null} nickname The nickname of the user in this relationship (1-32 characters)
   */
  /**
   * Emitted when a relationship is updated, relevant to the current user (e.g. friend nickname changed).
   * <info>This is not sent when the type of a relationship changes; see {@link Client#relationshipAdd} and {@link Client#relationshipRemove} for that.</info>
   * @event Client#relationshipUpdate
   * @param {Snowflake} user The userID that was updated
   * @param {RelationshipUpdateObject} oldData Old data
   * @param {RelationshipUpdateObject} newData New data
   */
  const oldType = client.relationships.cache.get(data.id);
  const oldSince = client.relationships.sinceCache.get(data.id);
  const oldNickname = client.relationships.friendNicknames.get(data.id);
  // Update
  if (data.type) client.relationships.cache.set(data.id, data.type);
  if (data.nickname) client.relationships.friendNicknames.set(data.id, data.nickname);
  if (data.since) client.relationships.sinceCache.set(data.id, new Date(data.since || 0));
  client.emit(
    Events.RELATIONSHIP_UPDATE,
    data.id,
    {
      type: oldType,
      nickname: oldNickname,
      since: oldSince,
    },
    {
      type: data.type,
      nickname: data.nickname,
      since: new Date(data.since || 0),
    },
  );
};
