'use strict';
const crypto = require('crypto');
const { ActivityTypes } = require('../util/Constants');
const { resolvePartialEmoji } = require('../util/Util');

// eslint-disable-next-line
const getUUID = () =>
  ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, a => (a ^ ((Math.random() * 16) >> (a / 4))).toString(16));
// Function check url valid (ok copilot)
// eslint-disable-next-line
const checkUrl = url => /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/.test(url);

class CustomStatus {
  /**
   * @typedef {Object} CustomStatusOptions
   * @property {string} [state] The state to be displayed
   * @property {EmojiIdentifierResolvable} [emoji] The emoji to be displayed
   */

  /**
   * @param {CustomStatus|CustomStatusOptions} [data={}] CustomStatus to clone or raw data
   */
  constructor(data = {}) {
    this.name = 'Custom Status';
    /**
     * The emoji to be displayed
     * @type {?EmojiIdentifierResolvable}
     */
    this.emoji = null;
    this.type = ActivityTypes.CUSTOM;
    /**
     * The state to be displayed
     * @type {?string}
     */
    this.state = null;
    this.setup(data);
  }
  /**
   * Sets the status from a JSON object
   * @param {CustomStatus|CustomStatusOptions} data CustomStatus to clone or raw data
   * @private
   */
  setup(data) {
    this.emoji = data.emoji ? resolvePartialEmoji(data.emoji) : null;
    this.state = data.state;
  }
  /**
   * Set the emoji of this activity
   * @param {EmojiIdentifierResolvable} emoji The emoji to be displayed
   * @returns {CustomStatus}
   */
  setEmoji(emoji) {
    this.emoji = resolvePartialEmoji(emoji);
    return this;
  }
  /**
   * Set state of this activity
   * @param {string | null} state The state to be displayed
   * @returns {CustomStatus}
   */
  setState(state) {
    this.state = state;
    return this;
  }

  /**
   * Returns an object that can be used to set the status
   * @returns {CustomStatus}
   */
  toJSON() {
    if (!this.emoji & !this.state) throw new Error('CustomStatus must have at least one of emoji or state');
    return {
      name: this.name,
      emoji: this.emoji,
      type: this.type,
      state: this.state,
    };
  }
}

class RichPresence {
  /**
   * @param {Client} client Discord client
   * @param {RichPresence} [data={}] RichPresence to clone or raw data
   */
  constructor(client, data = {}) {
    Object.defineProperty(this, 'client', { value: client });
    /**
     * The activity's name
     * @type {string}
     */
    this.name = null;
    /**
     * The activity status's type
     * @type {ActivityType}
     */
    this.type = ActivityTypes.PLAYING;
    /**
     * If the activity is being streamed, a link to the stream
     * @type {?string}
     */
    this.url = null;
    /**
     * The id of the application associated with this activity
     * @type {?Snowflake}
     */
    this.application_id = null;
    /**
     * State of the activity
     * @type {?string}
     */
    this.state = null;
    /**
     * Details about the activity
     * @type {?string}
     */
    this.details = null;
    /**
     * Party of the activity
     * @type {?ActivityParty}
     */
    this.party = null;
    /**
     * Timestamps for the activity
     * @type {?ActivityTimestamps}
     */
    this.timestamps = null;
    /**
     * Assets for rich presence
     * @type {?RichPresenceAssets}
     */
    this.assets = null;
    /**
     * The labels of the buttons of this rich presence
     * @type {string[]}
     */
    this.buttons = null;
    this.setup(data);
  }
  /**
   * Sets the status from a JSON object
   * @param {RichPresence} data data
   * @private
   */
  setup(data) {
    this.name = data.name;
    this.type = typeof data.type != 'number' ? ActivityTypes[data.type?.toUpperCase()] : data.type;
    this.application_id = data.application_id;
    this.url = data.url;
    this.state = data.state;
    this.details = data.details;
    this.party = data.party;
    this.timestamps = data.timestamps;
    this.created_at = data.created_at;
    this.secrets = data.secrets;
    this.assets = data.assets;
    this.buttons = data.buttons;
    this.metadata = data.metadata;
  }
  /**
   * Set the large image of this activity
   * @param {?Snowflake} image The large image asset's id
   * @returns {RichPresence}
   */
  setAssetsLargeImage(image) {
    // Gif support
    if (
      typeof image == 'string' &&
      (image.startsWith('https://') || image.startsWith('http://')) &&
      image.includes('external') &&
      image.includes('discord')
    ) {
      image = `mp:external${image.split('external')[1]}`;
    }
    if (!(this.assets instanceof Object)) this.assets = {};
    this.assets.large_image = image;
    return this;
  }
  /**
   * Set the small image of this activity
   * @param {?Snowflake} image The small image asset's id
   * @returns {RichPresence}
   */
  setAssetsSmallImage(image) {
    // Gif support
    if (
      typeof image == 'string' &&
      (image.startsWith('https://') || image.startsWith('http://')) &&
      image.includes('external') &&
      image.includes('discord')
    ) {
      image = `mp:external${image.split('external')[1]}`;
    }
    if (!(this.assets instanceof Object)) this.assets = {};
    this.assets.small_image = image;
    return this;
  }
  /**
   * Hover text for the large image
   * @param {string} text Assets text
   * @returns {RichPresence}
   */
  setAssetsLargeText(text) {
    if (typeof this.assets !== 'object') this.assets = {};
    this.assets.large_text = text;
    return this;
  }
  /**
   * Hover text for the small image
   * @param {string} text Assets text
   * @returns {RichPresence}
   */
  setAssetsSmallText(text) {
    if (typeof this.assets !== 'object') this.assets = {};
    this.assets.small_text = text;
    return this;
  }
  /**
   * Set the name of the activity
   * @param {?string} name The activity's name
   * @returns {RichPresence}
   */
  setName(name) {
    this.name = name;
    return this;
  }
  /**
   * If the activity is being streamed, a link to the stream
   * @param {?string} url URL of the stream
   * @returns {RichPresence}
   */
  setURL(url) {
    if (typeof url == 'string' && !checkUrl(url)) throw new Error('URL must be a valid URL');
    if (typeof url != 'string') url = null;
    this.url = url;
    return this;
  }
  /**
   * The activity status's type
   * @param {?ActivityTypes} type The type of activity
   * @returns {RichPresence}
   */
  setType(type) {
    this.type = ActivityTypes[type?.toUpperCase()];
    if (typeof this.type == 'string') this.type = ActivityTypes[this.type];
    if (typeof this.type != 'number') throw new Error('Type must be a valid ActivityType');
    return this;
  }
  /**
   * Set the application id of this activity
   * @param {?Snowflake} id Bot's id
   * @returns {RichPresence}
   */
  setApplicationId(id) {
    this.application_id = id;
    return this;
  }
  /**
   * Set the state of the activity
   * @param {?string} state The state of the activity
   * @returns {RichPresence}
   */
  setState(state) {
    this.state = state;
    return this;
  }
  /**
   * Set the details of the activity
   * @param {?string} details The details of the activity
   * @returns {RichPresence}
   */
  setDetails(details) {
    this.details = details;
    return this;
  }
  /**
   * @typedef {Object} RichParty
   * @property {string} id The id of the party
   * @property {number} max The maximum number of members in the party
   * @property {number} current The current number of members in the party
   */
  /**
   * Set the party of this activity
   * @param {?RichParty} party The party to be displayed
   * @returns {RichPresence}
   */
  setParty(party) {
    if (typeof party == 'object') {
      if (!party.max || typeof party.max != 'number') throw new Error('Party must have max number');
      if (!party.current || typeof party.current != 'number') throw new Error('Party must have current');
      if (party.current > party.max) throw new Error('Party current must be less than max number');
      if (!party.id || typeof party.id != 'string') party.id = getUUID();
      this.party = {
        size: [party.current, party.max],
        id: party.id,
      };
    } else {
      this.party = null;
    }
    return this;
  }
  /**
   * Sets the start timestamp of the activity
   * @param {?number} timestamp The timestamp of the start of the activity
   * @returns {RichPresence}
   */
  setStartTimestamp(timestamp) {
    if (!this.timestamps) this.timestamps = {};
    this.timestamps.start = timestamp;
    return this;
  }
  /**
   * Sets the end timestamp of the activity
   * @param {?number} timestamp The timestamp of the end of the activity
   * @returns {RichPresence}
   */
  setEndTimestamp(timestamp) {
    if (!this.timestamps) this.timestamps = {};
    this.timestamps.end = timestamp;
    return this;
  }
  /**
   * @typedef {object} RichButton
   * @property {string} name The name of the button
   * @property {string} url The url of the button
   */
  /**
   * Set the buttons of the rich presence
   * @param  {...?RichButton} button A list of buttons to set
   * @returns {RichPresence}
   */
  setButtons(...button) {
    if (button.length == 0) {
      this.buttons = null;
      delete this.metadata;
      return this;
    } else if (button.length > 2) {
      throw new Error('RichPresence can only have up to 2 buttons');
    }
    this.buttons = [];
    this.metadata = {
      button_urls: [],
    };
    button.flat(2).forEach(b => {
      if (b.name && b.url) {
        this.buttons.push(b.name);
        if (!checkUrl(b.url)) throw new Error('Button url must be a valid url');
        this.metadata.button_urls.push(b.url);
      } else {
        throw new Error('Button must have name and url');
      }
    });
    return this;
  }
  /**
   * Add a button to the rich presence
   * @param {string} name The name of the button
   * @param {string} url The url of the button
   * @returns {RichPresence}
   */
  addButton(name, url) {
    if (!name || !url) {
      throw new Error('Button must have name and url');
    }
    if (typeof name !== 'string') throw new Error('Button name must be a string');
    if (!checkUrl(url)) throw new Error('Button url must be a valid url');
    if (!this.buttons) {
      this.buttons = [];
      this.metadata = {
        button_urls: [],
      };
    }
    this.buttons.push(name);
    this.metadata.button_urls.push(url);
    return this;
  }
  /**
   * Convert the rich presence to a JSON object
   * @returns {RichPresence}
   */
  toJSON() {
    return {
      name: this.name,
      type: this.type,
      application_id: this.application_id,
      url: this.url,
      state: this.state,
      details: this.details,
      party: this.party,
      timestamps: this.timestamps,
      secrets: this.secrets,
      assets: this.assets,
      buttons: this.buttons,
      metadata: this.metadata,
    };
  }
}

/**
 * @extends {RichPresence}
 */
class SpotifyRPC extends RichPresence {
  /**
   * Create a new RichPresence (Spotify style)
   * @param {Client} client Discord Client
   * @param {SpotifyRPC} options Options for the Spotify RPC
   */
  constructor(client, options = {}) {
    if (!client) throw new Error('Client must be set');
    super(client, options);
    this.setup(options);
  }
  /**
   * Sets the status from a JSON object
   * @param {SpotifyRPC} options data
   * @private
   */
  setup(options) {
    this.party = {
      id: `spotify:${this.client.user.id}`,
    };
    /**
     * The Spotify song's id
     * @type {?string}
     */
    this.sync_id = options.sync_id;
    /**
     * The activity's id
     * @type {string}
     */
    this.id = 'spotify:1';
    /**
     * Creation date of the activity
     * @type {number}
     */
    this.created_at = Date.now();
    /**
     * Flags that describe the activity
     * @type {ActivityFlags}
     */
    this.flags = 48; // Sync + Play (ActivityFlags)
    /**
     * The game's or Spotify session's id
     * @type {?string}
     */
    this.session_id = this.client.session_id;

    this.secrets = {
      join: crypto.randomBytes(20).toString('hex'), // SHA1 / SHA128
      spectate: crypto.randomBytes(20).toString('hex'),
      match: crypto.randomBytes(20).toString('hex'),
    };
  }
  /**
   * Set the large image of this activity
   * @param {?string} image Spotify song's image ID
   * @returns {SpotifyRPC}
   */
  setAssetsLargeImage(image) {
    if (image.startsWith('spotify:')) image = image.replace('spotify:', '');
    if (!(this.assets instanceof Object)) {
      this.assets = {
        large_image: `spotify:${image}`,
      };
    } else {
      this.assets.large_image = `spotify:${image}`;
    }
    return this;
  }
  /**
   * Set the small image of this activity
   * @param {?string} image Spotify song's image ID
   * @returns {RichPresence}
   */
  setAssetsSmallImage(image) {
    if (image.startsWith('spotify:')) image = image.replace('spotify:', '');
    if (!(this.assets instanceof Object)) {
      this.assets = {
        small_image: `spotify:${image}`,
      };
    } else {
      this.assets.small_image = `spotify:${image}`;
    }
    return this;
  }
  /**
   * Set Spotify song id to sync with
   * @param {string} id Song id
   * @returns {SpotifyRPC}
   */
  setSongId(id) {
    this.sync_id = id;
    return this;
  }

  /**
   * Convert the rich presence to a JSON object
   * @returns {SpotifyRPC}
   */
  toJSON() {
    if (!this.sync_id) throw new Error('Song id is required');
    return {
      name: 'Spotify',
      type: ActivityTypes.LISTENING,
      application_id: this.application_id,
      url: this.url,
      state: this.state,
      details: this.details,
      party: this.party,
      timestamps: this.timestamps,
      secrets: this.secrets,
      assets: this.assets,
      session_id: this.session_id,
      sync_id: this.sync_id,
      flags: this.flags,
      id: this.id,
      created_at: this.created_at,
      metadata: this.metadata,
    };
  }
}

module.exports = {
  CustomStatus,
  RichPresence,
  SpotifyRPC,
  getUUID,
};
