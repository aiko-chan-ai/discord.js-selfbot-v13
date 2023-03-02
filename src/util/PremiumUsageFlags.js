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
 * * `PREMIUM_DISCRIMINATOR`
 * * `ANIMATED_AVATAR`
 * * `PROFILE_BANNER`
 * @type {Object}
 */
PremiumUsageFlags.FLAGS = {
  PREMIUM_DISCRIMINATOR: 1 << 0,
  ANIMATED_AVATAR: 1 << 1,
  PROFILE_BANNER: 1 << 2,
};

module.exports = PremiumUsageFlags;
