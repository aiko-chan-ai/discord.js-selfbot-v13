'use strict';

const { Collection } = require('@discordjs/collection');
const BaseManager = require('./BaseManager');
const DeveloperPortalApplication = require('../structures/DeveloperPortalApplication');
const Team = require('../structures/Team');

/**
 * Manages API methods for users and stores their cache.
 * @extends {BaseManager}
 */
class DeveloperPortalManager extends BaseManager {
  constructor(client) {
    super(client);
    /**
     * A collection of all the applications the client has.
     * @type {Collection<Snowflake, DeveloperPortalApplication>}
     * @readonly
     */
    this.applications = new Collection();
    /**
     * A collection of all the teams the client has.
     * @type {Collection<Snowflake, Team>}
     * @readonly
     */
    this.teams = new Collection(); // Collection<Snowflake, Team>
  }
  /**
   * Fetches all the applications & teams the client has.
   * @returns {Promise<DeveloperPortalManager>}
   */
  async fetch() {
    const promise1 = this.client.api.applications.get({
      query: {
        with_team_applications: true,
      },
    });
    const promise2 = this.client.api.teams.get();
    const [applications, teams] = await Promise.all([promise1, promise2]);
    for (const team of teams) {
      this.teams.set(team.id, new Team(this.client, team));
    }
    for (const application of applications) {
      this.applications.set(application.id, new DeveloperPortalApplication(this.client, application));
    }
    return this;
  }

  /**
   * Creates a new application.
   * @param {string} name Name of the application
   * @param {?Snowflake | Team} teamId The team to create the application in
   * @returns {Promise<DeveloperPortalApplication>}
   */
  async createApplication(name, teamId = null) {
    teamId = teamId instanceof Team ? teamId.id : teamId;
    const application = await this.client.api.applications.post({
      data: {
        name,
        team_id: teamId,
      },
    });
    this.applications.set(application.id, new DeveloperPortalApplication(this.client, application));
    return this.applications.get(application.id);
  }

  /**
   * Deletes an application.
   * @param {Snowflake} id Application ID
   * @param {?number} MFACode 2FA code (if 2FA is enabled)
   * @returns {Promise<void>}
   */
  async deleteApplication(id, MFACode) {
    if (MFACode) {
      await this.client.api.applications[`${id}/delete`].post({
        query: {
          code: MFACode,
        },
      });
    } else {
      await this.client.api.applications[`${id}/delete`].post();
    }
    this.applications.delete(id);
    return undefined;
  }
}

module.exports = DeveloperPortalManager;
