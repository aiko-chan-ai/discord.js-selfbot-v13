'use strict';

const CachedManager = require('./CachedManager');
const { Error } = require('../errors/DJSError');
const Session = require('../structures/Session');
/**
 * Manages API methods for users and stores their cache.
 * @extends {CachedManager}
 */
class SessionManager extends CachedManager {
  constructor(client, iterable) {
    super(client, Session, iterable);
  }
  /**
   * Fetch all sessions of the client.
   * @returns {Promise<SessionManager>}
   */
  fetch() {
    return new Promise((resolve, reject) => {
      this.client.api.auth.sessions
        .get()
        .then(data => {
          const allData = data.user_sessions;
          for (const session of allData) {
            this._add(new Session(this.client, session), true, { id: session.id_hash });
          }
          resolve(this);
        })
        .catch(reject);
    });
  }

  /**
   * Logout the client (remote).
   * @param {string} password User's password
   * @param {string | null} mfaCode MFA code (if 2FA is enabled)
   * @returns {Promise<undefined>}
   */
  logoutAllDevices(password, mfaCode) {
    password = password || this.client.password;
    if (!password || typeof password !== 'string') throw new Error('REQUIRE_PASSWORD');
    return this.client.api.auth.sessions.logout({
      data: {
        session_id_hashes: this.cache.map(session => session.id),
        password,
        code: typeof mfaCode === 'string' ? mfaCode : undefined,
      },
    });
  }
}

module.exports = SessionManager;
