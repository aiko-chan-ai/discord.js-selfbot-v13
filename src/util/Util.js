'use strict';

const { Agent } = require('node:http');
const { parse } = require('node:path');
const process = require('node:process');
const { setTimeout } = require('node:timers');
const { Collection } = require('@discordjs/collection');
const { fetch } = require('undici');
const { Colors, Events } = require('./Constants');
const { Error: DiscordError, RangeError, TypeError } = require('../errors');
const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const isObject = d => typeof d === 'object' && d !== null;

let deprecationEmittedForSplitMessage = false;
let deprecationEmittedForRemoveMentions = false;
let deprecationEmittedForResolveAutoArchiveMaxLimit = false;

const TextSortableGroupTypes = ['GUILD_TEXT', 'GUILD_ANNOUCMENT', 'GUILD_FORUM'];
const VoiceSortableGroupTypes = ['GUILD_VOICE', 'GUILD_STAGE_VOICE'];
const CategorySortableGroupTypes = ['GUILD_CATEGORY'];

const payloadTypes = [
  {
    name: 'opus',
    type: 'audio',
    priority: 1000,
    payload_type: 120,
  },
  {
    name: 'AV1',
    type: 'video',
    priority: 1000,
    payload_type: 101,
    rtx_payload_type: 102,
    encode: false,
    decode: false,
  },
  {
    name: 'H265',
    type: 'video',
    priority: 2000,
    payload_type: 103,
    rtx_payload_type: 104,
    encode: false,
    decode: false,
  },
  {
    name: 'H264',
    type: 'video',
    priority: 3000,
    payload_type: 105,
    rtx_payload_type: 106,
    encode: true,
    decode: true,
  },
  {
    name: 'VP8',
    type: 'video',
    priority: 4000,
    payload_type: 107,
    rtx_payload_type: 108,
    encode: true,
    decode: false,
  },
  {
    name: 'VP9',
    type: 'video',
    priority: 5000,
    payload_type: 109,
    rtx_payload_type: 110,
    encode: false,
    decode: false,
  },
];

/**
 * Contains various general-purpose utility methods.
 */
class Util extends null {
  /**
   * Flatten an object. Any properties that are collections will get converted to an array of keys.
   * @param {Object} obj The object to flatten.
   * @param {...Object<string, boolean|string>} [props] Specific properties to include/exclude.
   * @returns {Object}
   */
  static flatten(obj, ...props) {
    if (!isObject(obj)) return obj;

    const objProps = Object.keys(obj)
      .filter(k => !k.startsWith('_'))
      .map(k => ({ [k]: true }));

    props = objProps.length ? Object.assign(...objProps, ...props) : Object.assign({}, ...props);

    const out = {};

    for (let [prop, newProp] of Object.entries(props)) {
      if (!newProp) continue;
      newProp = newProp === true ? prop : newProp;

      const element = obj[prop];
      const elemIsObj = isObject(element);
      const valueOf = elemIsObj && typeof element.valueOf === 'function' ? element.valueOf() : null;
      const hasToJSON = elemIsObj && typeof element.toJSON === 'function';

      // If it's a Collection, make the array of keys
      if (element instanceof Collection) out[newProp] = Array.from(element.keys());
      // If the valueOf is a Collection, use its array of keys
      else if (valueOf instanceof Collection) out[newProp] = Array.from(valueOf.keys());
      // If it's an array, call toJSON function on each element if present, otherwise flatten each element
      else if (Array.isArray(element)) out[newProp] = element.map(e => e.toJSON?.() ?? Util.flatten(e));
      // If it's an object with a primitive `valueOf`, use that value
      else if (typeof valueOf !== 'object') out[newProp] = valueOf;
      // If it's an object with a toJSON function, use the return value of it
      else if (hasToJSON) out[newProp] = element.toJSON();
      // If element is an object, use the flattened version of it
      else if (typeof element === 'object') out[newProp] = Util.flatten(element);
      // If it's a primitive
      else if (!elemIsObj) out[newProp] = element;
    }

    return out;
  }

  /**
   * Options for splitting a message.
   * @typedef {Object} SplitOptions
   * @property {number} [maxLength=2000] Maximum character length per message piece
   * @property {string|string[]|RegExp|RegExp[]} [char='\n'] Character(s) or Regex(es) to split the message with,
   * an array can be used to split multiple times
   * @property {string} [prepend=''] Text to prepend to every piece except the first
   * @property {string} [append=''] Text to append to every piece except the last
   */

  /**
   * Splits a string into multiple chunks at a designated character that do not exceed a specific length.
   * @param {string} text Content to split
   * @param {SplitOptions} [options] Options controlling the behavior of the split
   * @deprecated This will be removed in the next major version.
   * @returns {string[]}
   */
  static splitMessage(text, { maxLength = 2_000, char = '\n', prepend = '', append = '' } = {}) {
    if (!deprecationEmittedForSplitMessage) {
      process.emitWarning(
        'The Util.splitMessage method is deprecated and will be removed in the next major version.',
        'DeprecationWarning',
      );

      deprecationEmittedForSplitMessage = true;
    }

    text = Util.verifyString(text);
    if (text.length <= maxLength) return [text];
    let splitText = [text];
    if (Array.isArray(char)) {
      while (char.length > 0 && splitText.some(elem => elem.length > maxLength)) {
        const currentChar = char.shift();
        if (currentChar instanceof RegExp) {
          splitText = splitText.flatMap(chunk => chunk.match(currentChar));
        } else {
          splitText = splitText.flatMap(chunk => chunk.split(currentChar));
        }
      }
    } else {
      splitText = text.split(char);
    }
    if (splitText.some(elem => elem.length > maxLength)) throw new RangeError('SPLIT_MAX_LEN');
    const messages = [];
    let msg = '';
    for (const chunk of splitText) {
      if (msg && (msg + char + chunk + append).length > maxLength) {
        messages.push(msg + append);
        msg = prepend;
      }
      msg += (msg && msg !== prepend ? char : '') + chunk;
    }
    return messages.concat(msg).filter(m => m);
  }

  /**
   * Options used to escape markdown.
   * @typedef {Object} EscapeMarkdownOptions
   * @property {boolean} [codeBlock=true] Whether to escape code blocks
   * @property {boolean} [inlineCode=true] Whether to escape inline code
   * @property {boolean} [bold=true] Whether to escape bolds
   * @property {boolean} [italic=true] Whether to escape italics
   * @property {boolean} [underline=true] Whether to escape underlines
   * @property {boolean} [strikethrough=true] Whether to escape strikethroughs
   * @property {boolean} [spoiler=true] Whether to escape spoilers
   * @property {boolean} [codeBlockContent=true] Whether to escape text inside code blocks
   * @property {boolean} [inlineCodeContent=true] Whether to escape text inside inline code
   * @property {boolean} [escape=true] Whether to escape escape characters
   * @property {boolean} [heading=false] Whether to escape headings
   * @property {boolean} [bulletedList=false] Whether to escape bulleted lists
   * @property {boolean} [numberedList=false] Whether to escape numbered lists
   * @property {boolean} [maskedLink=false] Whether to escape masked links
   */

  /**
   * Escapes any Discord-flavour markdown in a string.
   * @param {string} text Content to escape
   * @param {EscapeMarkdownOptions} [options={}] Options for escaping the markdown
   * @returns {string}
   */
  static escapeMarkdown(
    text,
    {
      codeBlock = true,
      inlineCode = true,
      bold = true,
      italic = true,
      underline = true,
      strikethrough = true,
      spoiler = true,
      codeBlockContent = true,
      inlineCodeContent = true,
      escape = true,
      heading = false,
      bulletedList = false,
      numberedList = false,
      maskedLink = false,
    } = {},
  ) {
    if (!codeBlockContent) {
      return text
        .split('```')
        .map((subString, index, array) => {
          if (index % 2 && index !== array.length - 1) return subString;
          return Util.escapeMarkdown(subString, {
            inlineCode,
            bold,
            italic,
            underline,
            strikethrough,
            spoiler,
            inlineCodeContent,
            escape,
            heading,
            bulletedList,
            numberedList,
            maskedLink,
          });
        })
        .join(codeBlock ? '\\`\\`\\`' : '```');
    }
    if (!inlineCodeContent) {
      return text
        .split(/(?<=^|[^`])`(?=[^`]|$)/g)
        .map((subString, index, array) => {
          if (index % 2 && index !== array.length - 1) return subString;
          return Util.escapeMarkdown(subString, {
            codeBlock,
            bold,
            italic,
            underline,
            strikethrough,
            spoiler,
            escape,
            heading,
            bulletedList,
            numberedList,
            maskedLink,
          });
        })
        .join(inlineCode ? '\\`' : '`');
    }
    if (escape) text = Util.escapeEscape(text);
    if (inlineCode) text = Util.escapeInlineCode(text);
    if (codeBlock) text = Util.escapeCodeBlock(text);
    if (italic) text = Util.escapeItalic(text);
    if (bold) text = Util.escapeBold(text);
    if (underline) text = Util.escapeUnderline(text);
    if (strikethrough) text = Util.escapeStrikethrough(text);
    if (spoiler) text = Util.escapeSpoiler(text);
    if (heading) text = Util.escapeHeading(text);
    if (bulletedList) text = Util.escapeBulletedList(text);
    if (numberedList) text = Util.escapeNumberedList(text);
    if (maskedLink) text = Util.escapeMaskedLink(text);
    return text;
  }

  /**
   * Escapes code block markdown in a string.
   * @param {string} text Content to escape
   * @returns {string}
   */
  static escapeCodeBlock(text) {
    return text.replaceAll('```', '\\`\\`\\`');
  }

  /**
   * Escapes inline code markdown in a string.
   * @param {string} text Content to escape
   * @returns {string}
   */
  static escapeInlineCode(text) {
    return text.replace(/(?<=^|[^`])``?(?=[^`]|$)/g, match => (match.length === 2 ? '\\`\\`' : '\\`'));
  }

  /**
   * Escapes italic markdown in a string.
   * @param {string} text Content to escape
   * @returns {string}
   */
  static escapeItalic(text) {
    let i = 0;
    text = text.replace(/(?<=^|[^*])\*([^*]|\*\*|$)/g, (_, match) => {
      if (match === '**') return ++i % 2 ? `\\*${match}` : `${match}\\*`;
      return `\\*${match}`;
    });
    i = 0;
    return text.replace(/(?<=^|[^_])_([^_]|__|$)/g, (_, match) => {
      if (match === '__') return ++i % 2 ? `\\_${match}` : `${match}\\_`;
      return `\\_${match}`;
    });
  }

  /**
   * Escapes bold markdown in a string.
   * @param {string} text Content to escape
   * @returns {string}
   */
  static escapeBold(text) {
    let i = 0;
    return text.replace(/\*\*(\*)?/g, (_, match) => {
      if (match) return ++i % 2 ? `${match}\\*\\*` : `\\*\\*${match}`;
      return '\\*\\*';
    });
  }

  /**
   * Escapes underline markdown in a string.
   * @param {string} text Content to escape
   * @returns {string}
   */
  static escapeUnderline(text) {
    let i = 0;
    return text.replace(/__(_)?/g, (_, match) => {
      if (match) return ++i % 2 ? `${match}\\_\\_` : `\\_\\_${match}`;
      return '\\_\\_';
    });
  }

  /**
   * Escapes strikethrough markdown in a string.
   * @param {string} text Content to escape
   * @returns {string}
   */
  static escapeStrikethrough(text) {
    return text.replaceAll('~~', '\\~\\~');
  }

  /**
   * Escapes spoiler markdown in a string.
   * @param {string} text Content to escape
   * @returns {string}
   */
  static escapeSpoiler(text) {
    return text.replaceAll('||', '\\|\\|');
  }

  /**
   * Escapes escape characters in a string.
   * @param {string} text Content to escape
   * @returns {string}
   */
  static escapeEscape(text) {
    return text.replaceAll('\\', '\\\\');
  }

  /**
   * Escapes heading characters in a string.
   * @param {string} text Content to escape
   * @returns {string}
   */
  static escapeHeading(text) {
    return text.replaceAll(/^( {0,2}[*-] +)?(#{1,3} )/gm, '$1\\$2');
  }

  /**
   * Escapes bulleted list characters in a string.
   * @param {string} text Content to escape
   * @returns {string}
   */
  static escapeBulletedList(text) {
    return text.replaceAll(/^( *)[*-]( +)/gm, '$1\\-$2');
  }

  /**
   * Escapes numbered list characters in a string.
   * @param {string} text Content to escape
   * @returns {string}
   */
  static escapeNumberedList(text) {
    return text.replaceAll(/^( *\d+)\./gm, '$1\\.');
  }

  /**
   * Escapes masked link characters in a string.
   * @param {string} text Content to escape
   * @returns {string}
   */
  static escapeMaskedLink(text) {
    return text.replaceAll(/\[.+\]\(.+\)/gm, '\\$&');
  }

  /**
   * @typedef {Object} FetchRecommendedShardsOptions
   * @property {number} [guildsPerShard=1000] Number of guilds assigned per shard
   * @property {number} [multipleOf=1] The multiple the shard count should round up to. (16 for large bot sharding)
   */

  static fetchRecommendedShards() {
    throw new DiscordError('INVALID_USER_API');
  }

  /**
   * Parses emoji info out of a string. The string must be one of:
   * * A UTF-8 emoji (no id)
   * * A URL-encoded UTF-8 emoji (no id)
   * * A Discord custom emoji (`<:name:id>` or `<a:name:id>`)
   * @param {string} text Emoji string to parse
   * @returns {APIEmoji} Object with `animated`, `name`, and `id` properties
   * @private
   */
  static parseEmoji(text) {
    if (text.includes('%')) text = decodeURIComponent(text);
    if (!text.includes(':')) return { animated: false, name: text, id: null };
    const match = text.match(/<?(?:(a):)?(\w{2,32}):(\d{17,19})?>?/);
    return match && { animated: Boolean(match[1]), name: match[2], id: match[3] ?? null };
  }

  /**
   * Resolves a partial emoji object from an {@link EmojiIdentifierResolvable}, without checking a Client.
   * @param {EmojiIdentifierResolvable} emoji Emoji identifier to resolve
   * @returns {?RawEmoji}
   * @private
   */
  static resolvePartialEmoji(emoji) {
    if (!emoji) return null;
    if (typeof emoji === 'string') return /^\d{17,19}$/.test(emoji) ? { id: emoji } : Util.parseEmoji(emoji);
    const { id, name, animated } = emoji;
    if (!id && !name) return null;
    return { id, name, animated: Boolean(animated) };
  }

  /**
   * Shallow-copies an object with its class/prototype intact.
   * @param {Object} obj Object to clone
   * @returns {Object}
   * @private
   */
  static cloneObject(obj) {
    return Object.assign(Object.create(obj), obj);
  }

  /**
   * Sets default properties on an object that aren't already specified.
   * @param {Object} def Default properties
   * @param {Object} given Object to assign defaults to
   * @returns {Object}
   * @private
   */
  static mergeDefault(def, given) {
    if (!given) return def;
    for (const key in def) {
      if (!has(given, key) || given[key] === undefined) {
        given[key] = def[key];
      } else if (given[key] === Object(given[key])) {
        given[key] = Util.mergeDefault(def[key], given[key]);
      }
    }

    return given;
  }

  /**
   * Options used to make an error object.
   * @typedef {Object} MakeErrorOptions
   * @property {string} name Error type
   * @property {string} message Message for the error
   * @property {string} stack Stack for the error
   */

  /**
   * Makes an Error from a plain info object.
   * @param {MakeErrorOptions} obj Error info
   * @returns {Error}
   * @private
   */
  static makeError(obj) {
    const err = new Error(obj.message);
    err.name = obj.name;
    err.stack = obj.stack;
    return err;
  }

  /**
   * Makes a plain error info object from an Error.
   * @param {Error} err Error to get info from
   * @returns {MakeErrorOptions}
   * @private
   */
  static makePlainError(err) {
    return {
      name: err.name,
      message: err.message,
      stack: err.stack,
    };
  }

  /**
   * Moves an element in an array *in place*.
   * @param {Array<*>} array Array to modify
   * @param {*} element Element to move
   * @param {number} newIndex Index or offset to move the element to
   * @param {boolean} [offset=false] Move the element by an offset amount rather than to a set index
   * @returns {number}
   * @private
   */
  static moveElementInArray(array, element, newIndex, offset = false) {
    const index = array.indexOf(element);
    newIndex = (offset ? index : 0) + newIndex;
    if (newIndex > -1 && newIndex < array.length) {
      const removedElement = array.splice(index, 1)[0];
      array.splice(newIndex, 0, removedElement);
    }
    return array.indexOf(element);
  }

  /**
   * Verifies the provided data is a string, otherwise throws provided error.
   * @param {string} data The string resolvable to resolve
   * @param {Function} [error] The Error constructor to instantiate. Defaults to Error
   * @param {string} [errorMessage] The error message to throw with. Defaults to "Expected string, got <data> instead."
   * @param {boolean} [allowEmpty=true] Whether an empty string should be allowed
   * @returns {string}
   */
  static verifyString(
    data,
    error = Error,
    errorMessage = `Expected a string, got ${data} instead.`,
    allowEmpty = true,
  ) {
    if (typeof data !== 'string') throw new error(errorMessage);
    if (!allowEmpty && data.length === 0) throw new error(errorMessage);
    return data;
  }

  /**
   * Can be a number, hex string, a {@link Color}, or an RGB array like:
   * ```js
   * [255, 0, 255] // purple
   * ```
   * @typedef {string|Color|number|number[]} ColorResolvable
   */

  /**
   * Resolves a ColorResolvable into a color number.
   * @param {ColorResolvable} color Color to resolve
   * @returns {number} A color
   */
  static resolveColor(color) {
    if (typeof color === 'string') {
      if (color === 'RANDOM') return Math.floor(Math.random() * (0xffffff + 1));
      if (color === 'DEFAULT') return 0;
      color = Colors[color] ?? parseInt(color.replace('#', ''), 16);
    } else if (Array.isArray(color)) {
      color = (color[0] << 16) + (color[1] << 8) + color[2];
    }

    if (color < 0 || color > 0xffffff) throw new RangeError('COLOR_RANGE');
    else if (Number.isNaN(color)) throw new TypeError('COLOR_CONVERT');

    return color;
  }

  /**
   * Sorts by Discord's position and id.
   * @param {Collection} collection Collection of objects to sort
   * @returns {Collection}
   */
  static discordSort(collection) {
    const isGuildChannel = collection.first() instanceof GuildChannel;
    return collection.toSorted(
      isGuildChannel
        ? (a, b) => a.rawPosition - b.rawPosition || Number(BigInt(a.id) - BigInt(b.id))
        : (a, b) => a.rawPosition - b.rawPosition || Number(BigInt(b.id) - BigInt(a.id)),
    );
  }

  /**
   * Sets the position of a Channel or Role.
   * @param {Channel|Role} item Object to set the position of
   * @param {number} position New position for the object
   * @param {boolean} relative Whether `position` is relative to its current position
   * @param {Collection<string, Channel|Role>} sorted A collection of the objects sorted properly
   * @param {APIRouter} route Route to call PATCH on
   * @param {string} [reason] Reason for the change
   * @returns {Promise<Channel[]|Role[]>} Updated item list, with `id` and `position` properties
   * @private
   */
  static async setPosition(item, position, relative, sorted, route, reason) {
    let updatedItems = [...sorted.values()];
    Util.moveElementInArray(updatedItems, item, position, relative);
    updatedItems = updatedItems.map((r, i) => ({ id: r.id, position: i }));
    await route.patch({ data: updatedItems, reason });
    return updatedItems;
  }

  /**
   * Alternative to Node's `path.basename`, removing query string after the extension if it exists.
   * @param {string} path Path to get the basename of
   * @param {string} [ext] File extension to remove
   * @returns {string} Basename of the path
   * @private
   */
  static basename(path, ext) {
    const res = parse(path);
    return ext && res.ext.startsWith(ext) ? res.name : res.base.split('?')[0];
  }

  /**
   * Breaks user, role and everyone/here mentions by adding a zero width space after every @ character
   * @param {string} str The string to sanitize
   * @returns {string}
   * @deprecated Use {@link BaseMessageOptions#allowedMentions} instead.
   */
  static removeMentions(str) {
    if (!deprecationEmittedForRemoveMentions) {
      process.emitWarning(
        'The Util.removeMentions method is deprecated. Use MessageOptions#allowedMentions instead.',
        'DeprecationWarning',
      );

      deprecationEmittedForRemoveMentions = true;
    }

    return Util._removeMentions(str);
  }

  static _removeMentions(str) {
    return str.replaceAll('@', '@\u200b');
  }

  /**
   * The content to have all mentions replaced by the equivalent text.
   * <warn>When {@link Util.removeMentions} is removed, this method will no longer sanitize mentions.
   * Use {@link BaseMessageOptions#allowedMentions} instead to prevent mentions when sending a message.</warn>
   * @param {string} str The string to be converted
   * @param {TextBasedChannels} channel The channel the string was sent in
   * @returns {string}
   */
  static cleanContent(str, channel) {
    str = str
      .replace(/<@!?[0-9]+>/g, input => {
        const id = input.replace(/<|!|>|@/g, '');
        if (channel.type === 'DM') {
          const user = channel.client.users.cache.get(id);
          return user ? Util._removeMentions(`@${user.username}`) : input;
        }

        const member = channel.guild?.members.cache.get(id);
        if (member) {
          return Util._removeMentions(`@${member.displayName}`);
        } else {
          const user = channel.client.users.cache.get(id);
          return user ? Util._removeMentions(`@${user.username}`) : input;
        }
      })
      .replace(/<#[0-9]+>/g, input => {
        const mentionedChannel = channel.client.channels.cache.get(input.replace(/<|#|>/g, ''));
        return mentionedChannel ? `#${mentionedChannel.name}` : input;
      })
      .replace(/<@&[0-9]+>/g, input => {
        if (channel.type === 'DM') return input;
        const role = channel.guild.roles.cache.get(input.replace(/<|@|>|&/g, ''));
        return role ? `@${role.name}` : input;
      });
    return str;
  }

  /**
   * The content to put in a code block with all code block fences replaced by the equivalent backticks.
   * @param {string} text The string to be converted
   * @returns {string}
   */
  static cleanCodeBlockContent(text) {
    return text.replaceAll('```', '`\u200b``');
  }

  /**
   * Creates a sweep filter that sweeps archived threads
   * @param {number} [lifetime=14400] How long a thread has to be archived to be valid for sweeping
   * @deprecated When not using with `makeCache` use `Sweepers.archivedThreadSweepFilter` instead
   * @returns {SweepFilter}
   */
  static archivedThreadSweepFilter(lifetime = 14400) {
    const filter = require('./Sweepers').archivedThreadSweepFilter(lifetime);
    filter.isDefault = true;
    return filter;
  }

  /**
   * Resolves the maximum time a guild's thread channels should automatically archive in case of no recent activity.
   * @param {Guild} guild The guild to resolve this limit from.
   * @deprecated This will be removed in the next major version.
   * @returns {number}
   */
  static resolveAutoArchiveMaxLimit() {
    if (!deprecationEmittedForResolveAutoArchiveMaxLimit) {
      process.emitWarning(
        // eslint-disable-next-line max-len
        "The Util.resolveAutoArchiveMaxLimit method and the 'MAX' option are deprecated and will be removed in the next major version.",
        'DeprecationWarning',
      );
      deprecationEmittedForResolveAutoArchiveMaxLimit = true;
    }
    return 10080;
  }

  /**
   * Transforms an API guild forum tag to camel-cased guild forum tag.
   * @param {APIGuildForumTag} tag The tag to transform
   * @returns {GuildForumTag}
   * @ignore
   */
  static transformAPIGuildForumTag(tag) {
    return {
      id: tag.id,
      name: tag.name,
      moderated: tag.moderated,
      emoji:
        tag.emoji_id ?? tag.emoji_name
          ? {
              id: tag.emoji_id,
              name: tag.emoji_name,
            }
          : null,
    };
  }

  /**
   * Transforms a camel-cased guild forum tag to an API guild forum tag.
   * @param {GuildForumTag} tag The tag to transform
   * @returns {APIGuildForumTag}
   * @ignore
   */
  static transformGuildForumTag(tag) {
    return {
      id: tag.id,
      name: tag.name,
      moderated: tag.moderated,
      emoji_id: tag.emoji?.id ?? null,
      emoji_name: tag.emoji?.name ?? null,
    };
  }

  /**
   * Transforms an API guild forum default reaction object to a
   * camel-cased guild forum default reaction object.
   * @param {APIGuildForumDefaultReactionEmoji} defaultReaction The default reaction to transform
   * @returns {DefaultReactionEmoji}
   * @ignore
   */
  static transformAPIGuildDefaultReaction(defaultReaction) {
    return {
      id: defaultReaction.emoji_id,
      name: defaultReaction.emoji_name,
    };
  }

  /**
   * Transforms a camel-cased guild forum default reaction object to an
   * API guild forum default reaction object.
   * @param {DefaultReactionEmoji} defaultReaction The default reaction to transform
   * @returns {APIGuildForumDefaultReactionEmoji}
   * @ignore
   */
  static transformGuildDefaultReaction(defaultReaction) {
    return {
      emoji_id: defaultReaction.id,
      emoji_name: defaultReaction.name,
    };
  }

  /**
   * Transforms a guild scheduled event recurrence rule object to a snake-cased variant.
   * @param {GuildScheduledEventRecurrenceRuleOptions} recurrenceRule The recurrence rule to transform
   * @returns {APIGuildScheduledEventRecurrenceRule}
   * @ignore
   */
  static transformGuildScheduledEventRecurrenceRule(recurrenceRule) {
    return {
      start: new Date(recurrenceRule.startAt).toISOString(),
      frequency: recurrenceRule.frequency,
      interval: recurrenceRule.interval,
      by_weekday: recurrenceRule.byWeekday,
      by_n_weekday: recurrenceRule.byNWeekday,
      by_month: recurrenceRule.byMonth,
      by_month_day: recurrenceRule.byMonthDay,
    };
  }

  /**
   * Transforms API incidents data to a camel-cased variant.
   * @param {APIIncidentsData} data The incidents data to transform
   * @returns {IncidentActions}
   * @ignore
   */
  static transformAPIIncidentsData(data) {
    return {
      invitesDisabledUntil: data.invites_disabled_until ? new Date(data.invites_disabled_until) : null,
      dmsDisabledUntil: data.dms_disabled_until ? new Date(data.dms_disabled_until) : null,
      dmSpamDetectedAt: data.dm_spam_detected_at ? new Date(data.dm_spam_detected_at) : null,
      raidDetectedAt: data.raid_detected_at ? new Date(data.raid_detected_at) : null,
    };
  }

  /**
   * Gets an array of the channel types that can be moved in the channel group. For example, a GuildText channel would
   * return an array containing the types that can be ordered within the text channels (always at the top), and a voice
   * channel would return an array containing the types that can be ordered within the voice channels (always at the
   * bottom).
   * @param {ChannelType} type The type of the channel
   * @returns {ChannelType[]}
   * @ignore
   */
  static getSortableGroupTypes(type) {
    switch (type) {
      case 'GUILD_TEXT':
      case 'GUILD_ANNOUNCEMENT':
      case 'GUILD_FORUM':
        return TextSortableGroupTypes;
      case 'GUILD_VOICE':
      case 'GUILD_STAGE_VOICE':
        return VoiceSortableGroupTypes;
      case 'GUILD_CATEGORY':
        return CategorySortableGroupTypes;
      default:
        return [type];
    }
  }

  /**
   * Calculates the default avatar index for a given user id.
   * @param {Snowflake} userId - The user id to calculate the default avatar index for
   * @returns {number}
   */
  static calculateUserDefaultAvatarIndex(userId) {
    return Number(BigInt(userId) >> 22n) % 6;
  }

  static async getUploadURL(client, channelId, files) {
    if (!files.length) return [];
    files = files.map((file, i) => ({
      filename: file.name,
      // 25MB = 26_214_400bytes
      file_size: Math.floor((26_214_400 / 10) * Math.random()),
      id: `${i}`,
    }));
    const { attachments } = await client.api.channels[channelId].attachments.post({
      data: {
        files,
      },
    });
    return attachments;
  }

  static uploadFile(data, url) {
    return new Promise((resolve, reject) => {
      fetch(url, {
        method: 'PUT',
        body: data,
        duplex: 'half', // Node.js v20
      })
        .then(res => {
          if (res.ok) {
            resolve(res);
          } else {
            reject(res);
          }
        })
        .catch(reject);
    });
  }

  /**
   * Lazily evaluates a callback function (yea it's v14 :yay:)
   * @param {Function} cb The callback to lazily evaluate
   * @returns {Function}
   * @example
   * const User = lazy(() => require('./User'));
   * const user = new (User())(client, data);
   */
  static lazy(cb) {
    let defaultValue;
    return () => (defaultValue ??= cb());
  }

  /**
   * Hacking check object instanceof Proxy-agent
   * @param {Object} object any
   * @returns {boolean}
   */
  static verifyProxyAgent(object) {
    return typeof object == 'object' && object.httpAgent instanceof Agent && object.httpsAgent instanceof Agent;
  }

  static checkUndiciProxyAgent(data) {
    if (typeof data === 'string') {
      return {
        uri: data,
      };
    }
    if (data instanceof URL) {
      return {
        uri: data.toString(),
      };
    }
    if (typeof data === 'object' && typeof data.uri === 'string') return data;
    return false;
  }

  static createPromiseInteraction(client, nonce, timeoutMs = 5_000, isHandlerDeferUpdate = false, parent) {
    return new Promise((resolve, reject) => {
      // Waiting for MsgCreate / ModalCreate
      let dataFromInteractionSuccess;
      let dataFromNormalEvent;
      const handler = data => {
        // UnhandledPacket
        if (isHandlerDeferUpdate && data.d?.nonce == nonce && data.t == 'INTERACTION_SUCCESS') {
          // Interaction#deferUpdate
          client.removeListener(Events.MESSAGE_CREATE, handler);
          client.removeListener(Events.UNHANDLED_PACKET, handler);
          client.removeListener(Events.INTERACTION_MODAL_CREATE, handler);
          dataFromInteractionSuccess = parent;
        }
        if (data.nonce !== nonce) return;
        clearTimeout(timeout);
        client.removeListener(Events.MESSAGE_CREATE, handler);
        client.removeListener(Events.INTERACTION_MODAL_CREATE, handler);
        if (isHandlerDeferUpdate) client.removeListener(Events.UNHANDLED_PACKET, handler);
        client.decrementMaxListeners();
        dataFromNormalEvent = data;
        resolve(data);
      };
      const timeout = setTimeout(() => {
        if (dataFromInteractionSuccess || dataFromNormalEvent) {
          resolve(dataFromNormalEvent || dataFromInteractionSuccess);
          return;
        }
        client.removeListener(Events.MESSAGE_CREATE, handler);
        client.removeListener(Events.INTERACTION_MODAL_CREATE, handler);
        if (isHandlerDeferUpdate) client.removeListener(Events.UNHANDLED_PACKET, handler);
        client.decrementMaxListeners();
        reject(new DiscordError('INTERACTION_FAILED'));
      }, timeoutMs).unref();
      client.incrementMaxListeners();
      client.on(Events.MESSAGE_CREATE, handler);
      client.on(Events.INTERACTION_MODAL_CREATE, handler);
      if (isHandlerDeferUpdate) client.on(Events.UNHANDLED_PACKET, handler);
    });
  }

  static clearNullOrUndefinedObject(object) {
    const data = {};
    const keys = Object.keys(object);

    for (const key of keys) {
      const value = object[key];
      if (value === undefined || value === null || (Array.isArray(value) && value.length === 0)) {
        continue;
      } else if (!Array.isArray(value) && typeof value === 'object') {
        const cleanedValue = Util.clearNullOrUndefinedObject(value);
        if (cleanedValue !== undefined) {
          data[key] = cleanedValue;
        }
      } else {
        data[key] = value;
      }
    }

    return Object.keys(data).length > 0 ? data : undefined;
  }

  static getAllPayloadType() {
    return payloadTypes;
  }

  /**
   * Get the payload type of the codec
   * @param {'opus' | 'H264' | 'H265' | 'VP8' | 'VP9' | 'AV1'} codecName - Codec name
   * @returns {number}
   */
  static getPayloadType(codecName) {
    return payloadTypes.find(p => p.name === codecName).payload_type;
  }

  static getSDPCodecName(portUdpH264, portUdpH265, portUdpOpus) {
    const payloadTypeH264 = Util.getPayloadType('H264');
    const payloadTypeH265 = Util.getPayloadType('H265');
    const payloadTypeOpus = Util.getPayloadType('opus');
    let sdpData = `v=0
o=- 0 0 IN IP4 0.0.0.0
s=-
c=IN IP4 0.0.0.0
t=0 0
a=tool:libavformat 61.1.100
m=video ${portUdpH264} RTP/AVP ${payloadTypeH264}
c=IN IP4 127.0.0.1
b=AS:1000
a=rtpmap:${payloadTypeH264} H264/90000
a=fmtp:${payloadTypeH264} profile-level-id=42e01f;sprop-parameter-sets=Z0IAH6tAoAt2AtwEBAaQeJEV,aM4JyA==;packetization-mode=1
${
  portUdpH265
    ? `m=video ${portUdpH265} RTP/AVP ${payloadTypeH265}
c=IN IP4 127.0.0.1
b=AS:1000
a=rtpmap:${payloadTypeH265} H265/90000`
    : ''
}
m=audio ${portUdpOpus} RTP/AVP ${payloadTypeOpus}
c=IN IP4 127.0.0.1
b=AS:96
a=rtpmap:${payloadTypeOpus} opus/48000/2
a=fmtp:${payloadTypeOpus} minptime=10;useinbandfec=1
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level
a=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time
a=extmap:3 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01
a=extmap:4 urn:ietf:params:rtp-hdrext:sdes:mid
a=extmap:5 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay
a=extmap:6 http://www.webrtc.org/experiments/rtp-hdrext/video-content-type
a=extmap:7 http://www.webrtc.org/experiments/rtp-hdrext/video-timing
a=extmap:8 http://www.webrtc.org/experiments/rtp-hdrext/color-space
a=extmap:10 urn:ietf:params:rtp-hdrext:sdes:rtp-stream-id
a=extmap:11 urn:ietf:params:rtp-hdrext:sdes:repaired-rtp-stream-id
a=extmap:13 urn:3gpp:video-orientation
a=extmap:14 urn:ietf:params:rtp-hdrext:toffset
`;
    return sdpData;
  }
}

module.exports = Util;

// Fixes Circular
const GuildChannel = require('../structures/GuildChannel');
