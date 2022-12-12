'use strict';

const { Presence } = require('./Presence');
const { TypeError } = require('../errors');
const { Opcodes, ActivityTypes } = require('../util/Constants');

/**
 * Represents the client's presence.
 * @extends {Presence}
 */
class ClientPresence extends Presence {
  constructor(client, data = {}) {
    super(client, Object.assign(data, { status: data.status ?? 'online', user: { id: null } }));
  }

  /**
   * Sets the client's presence
   * @param {PresenceData} presence The data to set the presence to
   * @returns {ClientPresence}
   */
  set(presence) {
    const packet = this._parse(presence);
    // Parse with custom class
    this._patch(packet, true);
    if (typeof presence.shardId === 'undefined') {
      this.client.ws.broadcast({ op: Opcodes.STATUS_UPDATE, d: packet });
    } else if (Array.isArray(presence.shardId)) {
      for (const shardId of presence.shardId) {
        this.client.ws.shards.get(shardId).send({ op: Opcodes.STATUS_UPDATE, d: packet });
      }
    } else {
      this.client.ws.shards.get(presence.shardId).send({ op: Opcodes.STATUS_UPDATE, d: packet });
    }
    // Parse with default class
    // this._patch(packet, false);
    return this;
  }

  /**
   * Parses presence data into a packet ready to be sent to Discord
   * @param {PresenceData} presence The data to parse
   * @returns {APIPresence}
   * @private
   */
  _parse({ status, since, afk, activities }) {
    const data = {
      activities: [],
      afk: typeof afk === 'boolean' ? afk : false,
      since: 0,
      status: status ?? this.status,
    };
    if (activities?.length) {
      for (const [i, activity] of activities.entries()) {
        if (![ActivityTypes.CUSTOM, 'CUSTOM'].includes(activity.type) && typeof activity.name !== 'string') {
          throw new TypeError('INVALID_TYPE', `activities[${i}].name`, 'string');
        }
        activity.type ??= 0;
        data.activities.push(
          Object.assign(activity, {
            type: typeof activity.type === 'number' ? activity.type : ActivityTypes[activity.type],
          }),
        );
      }
    } else if (!activities && (status || afk || since) && this.activities.length) {
      data.activities.push(
        ...this.activities.map(a =>
          Object.assign(a, {
            type: typeof a.type === 'number' ? a.type : ActivityTypes[a.type],
          }),
        ),
      );
    }

    return data;
  }
}

module.exports = ClientPresence;

/* eslint-disable max-len */
/**
 * @external APIPresence
 * @see {@link https://discord.com/developers/docs/rich-presence/how-to#updating-presence-update-presence-payload-fields}
 */
