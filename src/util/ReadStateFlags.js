'use strict';

const BitField = require('./BitField');

/**
 * Data structure that makes it easy to interact with a {@link ReadState#flags} bitfield.
 * @extends {BitField}
 */
class ReadStateFlags extends BitField {}

/**
 * @name ReadStateFlags
 * @kind constructor
 * @memberof ReadStateFlags
 * @param {BitFieldResolvable} [bits=0] Bit(s) to read from
 */

/**
 * Bitfield of the packed bits
 * @type {number}
 * @name ReadStateFlags#bitfield
 */

/**
 * Numeric read state flags. All available properties:
 * * `GUILD_CHANNEL`
 * * `THREAD`
 * @type {Object}
 */
ReadStateFlags.FLAGS = {
  GUILD_CHANNEL: 1 << 0,
  THREAD: 1 << 1,
};

module.exports = ReadStateFlags;
