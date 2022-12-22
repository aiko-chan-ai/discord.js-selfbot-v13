'use strict';

const BitField = require('./BitField');

/**
 * Data structure that makes it easy to interact with an {@link PremiumUsageFlags#flags} bitfield.
 * @extends {BitField}
 */
class PremiumUsageFlags extends BitField {}

/**
 * @name PremiumUsageFlags
 * @kind constructor
 * @memberof PremiumUsageFlags
 * @param {BitFieldResolvable} [bits=0] Bit(s) to read from
 */

/**
 * Numeric the Discord premium usage flags. All available properties:
 * * `ANIMATED_AVATAR`
 * * `BANNER`
 * * `CUSTOM_DISCRIMINATOR`
 * @type {Object}
 */
PremiumUsageFlags.FLAGS = {
  ANIMATED_AVATAR: 1 << 1,
  BANNER: 1 << 2,
};

module.exports = PremiumUsageFlags;
