'use strict';

const CachedManager = require('./CachedManager');
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
   * The cache of Sessions
   * @type {Collection<string, Session>}
   * @name SessionManager#cache
   */

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
          this.cache.clear();
          for (const session of allData) {
            this._add(new Session(this.client, session), true, { id: session.id_hash });
          }
          resolve(this);
        })
        .catch(reject);
    });
  }

  /**
   * Logout all client (remote).
   * @returns {Promise<void>}
   */
  logoutAllDevices() {
    return this.client.api.auth.sessions.logout({
      data: {
        session_id_hashes: this.cache.map(session => session.id),
      },
    });
  }
}

module.exports = SessionManager;
