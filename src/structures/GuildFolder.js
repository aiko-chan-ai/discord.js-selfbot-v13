'use strict';

const Base = require('./Base');

/**
 * Guild Folder.
 * @abstract
 */
class GuildFolder extends Base {
  constructor(client, data) {
    super(client);
    this._patch(data);
  }
  _patch(data) {
    if ('id' in data) {
      /**
       * The guild folder's id
       * @type {Snowflake}
       */
      this.id = data.id;
    }

    if ('name' in data) {
      /**
       * The guild folder's name
       * @type {string}
       */
      this.name = data.name;
    }

    if ('color' in data) {
      /**
       * The base 10 color of the folder
       * @type {number}
       */
      this.color = data.color;
    }

    if ('guild_ids' in data) {
      /**
       * The guild folder's guild ids
       * @type {Snowflake[]}
       */
      this.guild_ids = data.guild_ids;
    }
  }
  /**
   * The hexadecimal version of the folder color, with a leading hashtag
   * @type {string}
   * @readonly
   */
  get hexColor() {
    return `#${this.color.toString(16).padStart(6, '0')}`;
  }

  /**
   * Guilds in the folder
   * @type {Collection<Snowflake, Guild>}
   * @readonly
   */
  get guilds() {
    return this.client.guilds.cache.filter(guild => this.guild_ids.includes(guild.id));
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      color: this.color,
      guild_ids: this.guild_ids,
    };
  }
}

module.exports = GuildFolder;
