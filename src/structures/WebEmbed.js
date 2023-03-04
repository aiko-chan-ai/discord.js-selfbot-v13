'use strict';
const axios = require('axios');
const baseURL = 'https://webembed-sb.onrender.com/embed?';
const hiddenCharter =
  '||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||';
const { RangeError } = require('../errors');
const Util = require('../util/Util');

/**
 * Send Embedlink to Discord
 * Need to change WebEmbed API server (because heroku is no longer free)
 */
class WebEmbed {
  /**
   * @param {WebEmbed} [data={}] Raw data
   */
  constructor(data = {}) {
    /**
     * A `Partial` object is a representation of any existing object.
     * This object contains between 0 and all of the original objects parameters.
     * This is true regardless of whether the parameters are optional in the base object.
     * @typedef {Object} Partial
     */

    /**
     * Represents the possible options for a WebEmbed
     * @typedef {Object} WebEmbedOptions
     * @property {string} [title] The title of this embed
     * @property {string} [description] The description of this embed
     * @property {string} [url] The URL of this embed
     * @property {ColorResolvable} [color] The color of this embed
     * @property {Partial<WebEmbedAuthor>} [author] The author of this embed
     * @property {Partial<WebEmbedThumbnail>} [thumbnail] The thumbnail of this embed
     * @property {Partial<WebEmbedImage>} [image] The image of this embed
     * @property {Partial<WebEmbedVideo>} [video] The video of this embed
     * @property {Partial<WebEmbedFooter>} [footer] The footer of this embed
     * @property {Partial<WebEmbedProvider>} [provider] The provider of this embed
     */

    // eslint-disable-next-line valid-jsdoc
    /**
     * @param {WebEmbed|WebEmbedOptions|APIEmbed} [data={}] WebEmbed to clone or raw embed data
     */
    this._setup(data);
    /**
     * Shorten the link
     * @type {?boolean}
     */
    this.shorten = data.shorten ?? true;

    /**
     * Hidden Embed link
     * @type {?boolean}
     */
    this.hidden = data.hidden ?? false;

    /**
     * Using Custom WebEmbed server ?
     * @type {?string} https://webembed-sb.onrender.com/embed?
     * @see https://github.com/aiko-chan-ai/WebEmbed
     */
    this.baseURL = data.baseURL ?? baseURL;

    /**
     * Shorten API
     * @type {?string} https://webembed-sb.onrender.com/short?url=
     * @see https://github.com/aiko-chan-ai/WebEmbed
     */
    this.shortenAPI = data.shortenAPI;
  }
  /**
   * @private
   * @param {Object} data The data for the embed
   */
  _setup(data) {
    /**
     * Type image of this embed
     * @type {?thumbnail | image}
     */
    this.imageType = 'thumbnail';
    /**
     * The title of this embed
     * @type {?string}
     */
    this.title = data.title ?? null;

    /**
     * The description of this embed
     * @type {?string}
     */
    this.description = data.description ?? null;

    /**
     * The URL of this embed
     * @type {?string}
     */
    this.url = data.url ?? null;

    /**
     * The color of this embed
     * @type {?number}
     */
    this.color = 'color' in data ? Util.resolveColor(data.color) : null;

    /**
     * Represents the image of a WebEmbed
     * @typedef {Object} WebEmbedImage
     * @property {string} url URL for this image
     * @property {string} proxyURL ProxyURL for this image
     * @property {number} height Height of this image
     * @property {number} width Width of this image
     */

    /**
     * The image of this embed, if there is one
     * @type {?WebEmbedImage}
     */
    this.image = data.image
      ? {
          url: data.image.url,
          proxyURL: data.image.proxyURL ?? data.image.proxy_url,
          height: data.image.height,
          width: data.image.width,
        }
      : null;

    /**
     * The thumbnail of this embed (if there is one)
     * @type {?WebEmbedThumbnail}
     */
    this.thumbnail = data.thumbnail
      ? {
          url: data.thumbnail.url,
          proxyURL: data.thumbnail.proxyURL ?? data.thumbnail.proxy_url,
          height: data.thumbnail.height,
          width: data.thumbnail.width,
        }
      : null;

    /**
     * Represents the video of a WebEmbed
     * @typedef {Object} WebEmbedVideo
     * @property {string} url URL of this video
     * @property {string} proxyURL ProxyURL for this video
     * @property {number} height Height of this video
     * @property {number} width Width of this video
     */

    /**
     * The video of this embed (if there is one)
     * @type {?WebEmbedVideo}
     * @readonly
     */
    this.video = data.video
      ? {
          url: data.video.url,
          proxyURL: data.video.proxyURL ?? data.video.proxy_url,
          height: data.video.height,
          width: data.video.width,
        }
      : null;

    /**
     * Represents the author field of a WebEmbed
     * @typedef {Object} WebEmbedAuthor
     * @property {string} name The name of this author
     * @property {string} url URL of this author
     */

    /**
     * The author of this embed (if there is one)
     * @type {?WebEmbedAuthor}
     */
    this.author = data.author
      ? {
          name: data.author.name,
          url: data.author.url,
        }
      : null;

    /**
     * Represents the provider of a WebEmbed
     * @typedef {Object} WebEmbedProvider
     * @property {string} name The name of this provider
     * @property {string} url URL of this provider
     */

    /**
     * The provider of this embed (if there is one)
     * @type {?WebEmbedProvider}
     */
    this.provider = data.provider
      ? {
          name: data.provider.name,
          url: data.provider.name,
        }
      : null;
  }
  /**
   * The options to provide for setting an author for a {@link WebEmbed}.
   * @typedef {Object} EmbedAuthorData
   * @property {string} name The name of this author.
   */

  /**
   * Sets the author of this embed.
   * @param {string|EmbedAuthorData|null} options The options to provide for the author.
   * Provide `null` to remove the author data.
   * @returns {WebEmbed}
   */
  setAuthor(options) {
    if (options === null) {
      this.author = {};
      return this;
    }
    const { name, url } = options;
    this.author = {
      name: Util.verifyString(name, RangeError, 'EMBED_AUTHOR_NAME'),
      url,
    };
    return this;
  }

  /**
   * The options to provide for setting an provider for a {@link WebEmbed}.
   * @typedef {Object} EmbedProviderData
   * @property {string} name The name of this provider.
   */

  /**
   * Sets the provider of this embed.
   * @param {string|EmbedProviderData|null} options The options to provide for the provider.
   * Provide `null` to remove the provider data.
   * @returns {WebEmbed}
   */
  setProvider(options) {
    if (options === null) {
      this.provider = {};
      return this;
    }
    const { name, url } = options;
    this.provider = {
      name: Util.verifyString(name, RangeError, 'EMBED_PROVIDER_NAME'),
      url,
    };
    return this;
  }

  /**
   * Sets the color of this embed.
   * @param {ColorResolvable} color The color of the embed
   * @returns {WebEmbed}
   */
  setColor(color) {
    this.color = Util.resolveColor(color);
    return this;
  }

  /**
   * Sets the description of this embed.
   * @param {string} description The description (Limit 350 characters)
   * @returns {WebEmbed}
   */
  setDescription(description) {
    this.description = Util.verifyString(description, RangeError, 'EMBED_DESCRIPTION');
    return this;
  }

  /**
   * Sets the image of this embed.
   * @param {string} url The URL of the image
   * @returns {WebEmbed}
   */
  setImage(url) {
    if (this.thumbnail && this.thumbnail.url) {
      console.warn('You can only set image or thumbnail per embed.');
      this.thumbnail.url = null;
    }
    this.imageType = 'image';
    this.image = { url };
    return this;
  }

  /**
   * Sets the thumbnail of this embed.
   * @param {string} url The URL of the image
   * @returns {WebEmbed}
   */
  setThumbnail(url) {
    if (this.image && this.image.url) {
      console.warn('You can only set image or thumbnail per embed.');
      this.image.url = null;
    }
    this.imageType = 'thumbnail';
    this.thumbnail = { url };
    return this;
  }

  /**
   * Sets the video of this embed.
   * @param {string} url The URL of the video
   * @returns {WebEmbed}
   */
  setVideo(url) {
    this.video = { url };
    return this;
  }

  /**
   * Sets the title of this embed.
   * @param {string} title The title
   * @returns {WebEmbed}
   */
  setTitle(title) {
    this.title = Util.verifyString(title, RangeError, 'EMBED_TITLE');
    return this;
  }

  /**
   * Sets the URL of this embed.
   * @param {string} url The URL
   * @returns {WebEmbed}
   */
  setURL(url) {
    this.url = url;
    return this;
  }

  /**
   * Return Message Content + Embed (if hidden, pls check content length because it has 1000+ length)
   * @returns {string} Message Content
   */
  async toMessage() {
    const arrayQuery = [`image_type=${this.imageType}`];
    if (this.title) {
      arrayQuery.push(`title=${encodeURIComponent(this.title)}`);
    }
    if (this.description) {
      arrayQuery.push(`description=${encodeURIComponent(this.description)}`);
    }
    if (this.url) {
      arrayQuery.push(`url=${encodeURIComponent(this.url)}`);
    }
    if (this.color) {
      arrayQuery.push(`color=${encodeURIComponent(`#${this.color.toString(16)}`)}`);
    }
    if (this.image?.url) {
      arrayQuery.push(`image=${encodeURIComponent(this.image.url)}`);
    }
    if (this.video?.url) {
      arrayQuery.push(`video=${encodeURIComponent(this.video.url)}`);
    }
    if (this.author) {
      if (this.author.name) {
        arrayQuery.push(`author_name=${encodeURIComponent(this.author.name)}`);
      }
      if (this.author.url) {
        arrayQuery.push(`author_url=${encodeURIComponent(this.author.url)}`);
      }
    }
    if (this.provider) {
      if (this.provider.name) {
        arrayQuery.push(`provider_name=${encodeURIComponent(this.provider.name)}`);
      }
      if (this.provider.url) {
        arrayQuery.push(`provider_url=${encodeURIComponent(this.provider.url)}`);
      }
    }
    if (this.thumbnail?.url) {
      arrayQuery.push(`image=${encodeURIComponent(this.thumbnail.url)}`);
    }
    const fullURL = `${this.baseURL}${arrayQuery.join('&')}`;
    if (this.shorten) {
      const url = await this.constructor.getShorten(fullURL, this);
      if (!url) console.log('Cannot shorten URL in WebEmbed');
      return this.hidden ? `${hiddenCharter} ${url || fullURL}` : url || fullURL;
    } else {
      return this.hidden ? `${hiddenCharter} ${fullURL}` : fullURL;
    }
  }

  static async getShorten(url, embed) {
    const APIurl = ['https://tinyurl.com/api-create.php?url='];
    const shorten = `${
      embed.shortenAPI && typeof embed.shortenAPI == 'string'
        ? embed.shortenAPI
        : APIurl[Math.floor(Math.random() * APIurl.length)]
    }${encodeURIComponent(url)}`;
    try {
      const res = await axios.get(`${shorten}`);
      if (typeof res.data === 'string') return res.data;
      else if (typeof res.data === 'object') return res.data.shorten;
      else throw new Error('Unknown error');
    } catch {
      return undefined;
    }
  }
}

module.exports = WebEmbed;
module.exports.hiddenEmbed = hiddenCharter;
