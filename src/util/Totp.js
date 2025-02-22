'use strict';

/** @typedef {"SHA-1" | "SHA-256" | "SHA-384" | "SHA-512"} TOTPAlgorithm */
/** @typedef {"hex" | "ascii"} TOTPEncoding */
/**
 * @description Options for TOTP generation
 * @typedef {Object} generateOptions
 * @property {number} [digits=6] - The number of digits in the OTP.
 * @property {TOTPAlgorithm} [algorithm="SHA-1"] - Algorithm used for hashing.
 * @property {TOTPEncoding} [encoding="hex"] - Encoding used for the OTP.
 * @property {number} [period=30] - The time period for OTP validity in seconds.
 * @property {number} [timestamp=Date.now()] - The current timestamp.
 */

class TOTP {
  // eslint-disable-next-line valid-jsdoc
  /**
   * Generates a Time-based One-Time Password (TOTP)
   * @public
   * @param {string} key - The secret key for TOTP
   * @param {generateOptions} options - Optional parameters for TOTP
   * @returns {Promise<{ otp: string, expires: number }>}
   */
  static async generate(key, options = {}) {
    const _options = {
      digits: 6,
      algorithm: 'SHA-1',
      encoding: 'hex',
      period: 30,
      timestamp: Date.now(),
      ...options,
    };
    const epochSeconds = Math.floor(_options.timestamp / 1000);
    const timeHex = this.dec2hex(Math.floor(epochSeconds / _options.period)).padStart(16, '0');

    const keyBuffer = _options.encoding === 'hex' ? this.base32ToBuffer(key) : this.asciiToBuffer(key);

    const hmacKey = await this.crypto.importKey(
      'raw',
      keyBuffer,
      { name: 'HMAC', hash: { name: _options.algorithm } },
      false,
      ['sign'],
    );
    const signature = await this.crypto.sign('HMAC', hmacKey, this.hex2buf(timeHex));

    const signatureHex = this.buf2hex(signature);
    const offset = this.hex2dec(signatureHex.slice(-1)) * 2;
    const masked = this.hex2dec(signatureHex.slice(offset, offset + 8)) & 0x7fffffff;
    const otp = masked.toString().slice(-_options.digits);

    const period = _options.period * 1000;
    const expires = Math.ceil((_options.timestamp + 1) / period) * period;

    return { otp, expires };
  }

  /**
   * Converta a hexadecimal string into a decimal number
   * @private
   * @param {string} hex - The hexadecimal string
   * @returns {number} The decimal representation
   */
  static hex2dec(hex) {
    return parseInt(hex, 16);
  }

  /**
   * Converts a decimal number into a hexadeciamal string
   * @private
   * @param {number} dec - The decimal number
   * @returns {string} The hex representation
   */
  static dec2hex(dec) {
    return (dec < 15.5 ? '0' : '') + Math.round(dec).toString(16);
  }

  /**
   * Converts a base32 encoded string to an ArrayBuffer
   * @private
   * @param {string} str - The base32 encoded string to convert.
   * @returns {ArrayBuffer} The ArrayBuffer representation of the base32 encoded string
   */
  static base32ToBuffer(str) {
    str = str.toUpperCase();
    let length = str.length;
    while (str.charCodeAt(length - 1) === 61) length--; // Remove padding

    const bufferSize = (length * 5) / 8;
    const buffer = new Uint8Array(bufferSize);
    let value = 0,
      bits = 0,
      index = 0;

    for (let i = 0; i < length; i++) {
      const charCode = this.base32[str.charCodeAt(i)];
      if (charCode === undefined) throw new Error('Invalid base32 character in key');
      value = (value << 5) | charCode;
      bits += 5;

      if (bits >= 8) buffer[index++] = value >>> (bits -= 8);
    }

    return buffer.buffer;
  }

  /**
   * Converts an ASCII string to an ArrayBuffer
   * @private
   * @param {string} str - The ASCII string to convert
   * @returns {ArrayBuffer} The ArrayBuffer representation of the string
   */
  static asciiToBuffer(str) {
    const buffer = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
      buffer[i] = str.charCodeAt(i);
    }
    return buffer.buffer;
  }

  /**
   * Converts a hexadecimal string to an ArrayBuffer
   * @private
   * @param {string} hex - The hexadecimal string to convert
   * @returns {ArrayBuffer} The ArrayBuffer representation of the string
   */
  static hex2buf(hex) {
    const buffer = new Uint8Array(hex.length / 2);

    for (let i = 0, j = 0; i < hex.length; i += 2, j++) buffer[j] = this.hex2dec(hex.slice(i, i + 2));

    return buffer.buffer;
  }

  /**
   * Converts an ArrayBuffer to a hexadecimal string
   * @private
   * @param {ArrayBuffer} buffer - The ArrayBuffer to convert
   * @returns {string} The hexadecimal string representation of the buffer
   */
  static buf2hex(buffer) {
    return [...new Uint8Array(buffer)].map(x => x.toString(16).padStart(2, '0')).join('');
  }

  /**
   * A precalculated mapping from base32 character codes to their corresponding index values for performance optimization
   * This mapping is used in the base32ToBuffer method to convert base32 encoded strings to their binary representation
   * @private
   * @readonly
   */
  static base32 = {
    50: 26,
    51: 27,
    52: 28,
    53: 29,
    54: 30,
    55: 31,
    65: 0,
    66: 1,
    67: 2,
    68: 3,
    69: 4,
    70: 5,
    71: 6,
    72: 7,
    73: 8,
    74: 9,
    75: 10,
    76: 11,
    77: 12,
    78: 13,
    79: 14,
    80: 15,
    81: 16,
    82: 17,
    83: 18,
    84: 19,
    85: 20,
    86: 21,
    87: 22,
    88: 23,
    89: 24,
    90: 25,
  };

  /**
   * @private
   * @static
   * @readonly
   */
  static crypto = (globalThis.crypto || require('crypto').webcrypto).subtle;
}

module.exports = TOTP;
