'use strict';

const Base = require('./Base');

/**
 * @typedef {Object} SessionClientInfo
 * @property {string} location Location of the client (using IP address)
 * @property {string} platform Platform of the client
 * @property {string} os Operating system of the client
 */

/**
 * Represents a Client OAuth2 Application Team.
 * @extends {Base}
 */
class Session extends Base {
  constructor(client, data) {
    super(client);
    this._patch(data);
  }

  _patch(data) {
    if ('id_hash' in data) {
      /**
       * The session hash id
       * @type {string}
       */
      this.id = data.id_hash;
    }
    if ('approx_last_used_time' in data) {
      this.approxLastUsedTime = data.approx_last_used_time;
    }
    if ('client_info' in data) {
      /**
       * The client info
       * @type {SessionClientInfo}
       */
      this.clientInfo = data.client_info;
    }
  }

  /**
   * The timestamp the client was last used at.
   * @type {number}
   * @readonly
   */
  get createdTimestamp() {
    return this.createdAt.getTime();
  }

  /**
   * The time the client was last used at.
   * @type {Date}
   * @readonly
   */
  get createdAt() {
    return new Date(this.approxLastUsedTime);
  }

  /**
   * Logout the client (remote).
   * @param {string | null} mfaCode MFA code (if 2FA is enabled)
   * @returns {Promise<undefined>}
   */
  logout(mfaCode) {
    if (typeof this.client.password !== 'string') throw new Error('REQUIRE_PASSWORD', 'You must provide a password.');
    return this.client.api.auth.sessions.logout({
      data: {
        session_id_hashes: [this.id],
        password: this.client.password,
        code: typeof mfaCode === 'string' ? mfaCode : undefined,
      },
    });
  }

  toJSON() {
    return super.toJSON();
  }
}

module.exports = Session;
