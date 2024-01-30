'use strict';

const BitField = require('./BitField');

/**
 * Data structure that makes it easy to interact with an {@link InviteFlags#flags} bitfield.
 * @extends {BitField}
 */
class InviteFlags extends BitField {}

/**
 * @name InviteFlags
 * @kind constructor
 * @memberof InviteFlags
 * @param {BitFieldResolvable} [bits=0] Bit(s) to read from
 */

/**
 * Numeric the Discord invite flags. All available properties:
 * * `GUEST`
 * * `VIEWED`
 * @type {Object}
 */
InviteFlags.FLAGS = {
  GUEST: 1 << 0,
  VIEWED: 1 << 1,
};

module.exports = InviteFlags;
