'use strict';

const BitField = require('./BitField');

/**
 * Data structure that makes it easy to interact with an {@link PurchasedFlags#flags} bitfield.
 * @extends {BitField}
 */
class PurchasedFlags extends BitField {}

/**
 * @name PurchasedFlags
 * @kind constructor
 * @memberof PurchasedFlags
 * @param {BitFieldResolvable} [bits=0] Bit(s) to read from
 */

/**
 * Numeric the Discord purchased flags. All available properties:
 * * `NITRO_CLASSIC`
 * * `NITRO`
 * * `GUILD_BOOST`
 * * `NITRO_BASIC`
 * @type {Object}
 */
PurchasedFlags.FLAGS = {
  NITRO_CLASSIC: 1 << 0,
  NITRO: 1 << 1,
  GUILD_BOOST: 1 << 2,
  NITRO_BASIC: 1 << 3,
};

module.exports = PurchasedFlags;
