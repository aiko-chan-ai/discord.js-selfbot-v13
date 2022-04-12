'use strict';

const { Events } = require('../../../util/Constants');

module.exports = (client, { d: data }) => {
	data.user ? client.users._add(data.user) : null;
	client.relationships.cache.set(data.id, data.type);
	/**
	 * Emitted whenever a relationship is updated.
	 * @event Client#relationshipUpdate
	 * @param {UserID} user The userID that was updated
	 * @param {Number} type The new relationship type
	 */
	client.emit(Events.RELATIONSHIP_ADD, data.id, data.type);
};
