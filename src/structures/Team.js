'use strict';

const { Collection } = require('@discordjs/collection');
const Base = require('./Base');
const TeamMember = require('./TeamMember');
const User = require('./User');
const { Error } = require('../errors');
const SnowflakeUtil = require('../util/SnowflakeUtil');

/**
 * Represents a Client OAuth2 Application Team.
 * @extends {Base}
 */
class Team extends Base {
  constructor(client, data) {
    super(client);
    this._patch(data);
  }

  _patch(data) {
    /**
     * The Team's id
     * @type {Snowflake}
     */
    this.id = data.id;

    if ('name' in data) {
      /**
       * The name of the Team
       * @type {string}
       */
      this.name = data.name;
    }

    if ('icon' in data) {
      /**
       * The Team's icon hash
       * @type {?string}
       */
      this.icon = data.icon;
    } else {
      this.icon ??= null;
    }

    if ('owner_user_id' in data) {
      /**
       * The Team's owner id
       * @type {?Snowflake}
       */
      this.ownerId = data.owner_user_id;
    } else {
      this.ownerId ??= null;
    }
    /**
     * The Team's members
     * @type {Collection<Snowflake, TeamMember>}
     */
    this.members = new Collection();

    for (const memberData of data.members) {
      const member = new TeamMember(this, memberData);
      this.members.set(member.id, member);
    }
  }

  /**
   * The owner of this team
   * @type {?TeamMember}
   * @readonly
   */
  get owner() {
    return this.members.get(this.ownerId) ?? null;
  }

  /**
   * The timestamp the team was created at
   * @type {number}
   * @readonly
   */
  get createdTimestamp() {
    return SnowflakeUtil.timestampFrom(this.id);
  }

  /**
   * The time the team was created at
   * @type {Date}
   * @readonly
   */
  get createdAt() {
    return new Date(this.createdTimestamp);
  }

  /**
   * A link to the team's icon.
   * @param {StaticImageURLOptions} [options={}] Options for the Image URL
   * @returns {?string}
   */
  iconURL({ format, size } = {}) {
    if (!this.icon) return null;
    return this.client.rest.cdn.TeamIcon(this.id, this.icon, { format, size });
  }

  /**
   * Invite a team member to the team
   * @param {User} user The user to invite to the team
   * @param {number} MFACode The mfa code
   * @returns {Promise<TeamMember>}
   */
  async inviteMember(user, MFACode) {
    if (!(user instanceof User)) return new Error('TEAM_MEMBER_FORMAT');
    const regex = /([0-9]{6})/g;

    const payload = {
      username: user.username,
      discriminator: user.discriminator,
    };
    if (MFACode && !regex.test(MFACode)) return new Error('MFA_INVALID');
    if (MFACode) payload.code = MFACode;

    const member = await this.client.api.teams(this.id).members.post({
      data: payload,
    });

    this.members.set(member.user.id, new TeamMember(this, member));
    return this.members.get(member.user.id);
  }

  /**
   * Remove a member from the team
   * @param {Snowflake} userID The ID of the user you want to remove
   * @returns {boolean}
   */
  async removeMember(userID) {
    await this.client.api.teams[this.id].members[userID].delete();
    return this.members.delete(userID);
  }

  /**
   * Delete this team
   * @param {number} MFACode The 2fa code
   * @returns {Promise<boolean>}
   */
  async delete(MFACode) {
    const regex = /([0-9]{6})/g;
    if (!regex.test(MFACode)) return new Error('MFA_INVALID');
    await this.client.api.teams[this.id].delete({ data: { code: MFACode } });
    return this.client.developerPortal.teams.delete(this.id);
  }

  /**
   * When concatenated with a string, this automatically returns the Team's name instead of the
   * Team object.
   * @returns {string}
   * @example
   * // Logs: Team name: My Team
   * console.log(`Team name: ${team}`);
   */
  toString() {
    return this.name;
  }

  toJSON() {
    return super.toJSON({ createdTimestamp: true });
  }
}

module.exports = Team;
