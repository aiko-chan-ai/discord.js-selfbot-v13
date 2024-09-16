'use strict';

const libs = {
  sodium: sodium => ({
    /** @deprecated */
    open: sodium.api.crypto_secretbox_open_easy,
    /** @deprecated */
    close: sodium.api.crypto_secretbox_easy,
    random: n => sodium.randombytes_buf(n),
    crypto_aead_xchacha20poly1305_ietf_encrypt: (plaintext, additionalData, nonce, key) =>
      sodium.api.crypto_aead_xchacha20poly1305_ietf_encrypt(plaintext, additionalData, null, nonce, key),
    crypto_aead_xchacha20poly1305_ietf_decrypt: (plaintext, additionalData, nonce, key) =>
      sodium.api.crypto_aead_xchacha20poly1305_ietf_decrypt(plaintext, additionalData, null, nonce, key),
  }),
  'libsodium-wrappers': sodium => ({
    /** @deprecated */
    open: sodium.crypto_secretbox_open_easy,
    /** @deprecated */
    close: sodium.crypto_secretbox_easy,
    random: n => sodium.randombytes_buf(n),
    crypto_aead_xchacha20poly1305_ietf_encrypt: (plaintext, additionalData, nonce, key) =>
      sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(plaintext, additionalData, null, nonce, key),
    crypto_aead_xchacha20poly1305_ietf_decrypt: (plaintext, additionalData, nonce, key) =>
      sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(null, plaintext, additionalData, nonce, key),
  }),
};

function NoLib() {
  throw new Error(
    'Cannot play audio as no valid encryption package is installed.\n- Install sodium or libsodium-wrappers.',
  );
}

exports.methods = {
  open: NoLib,
  close: NoLib,
  random: NoLib,
  crypto_aead_xchacha20poly1305_ietf_encrypt: NoLib,
  crypto_aead_xchacha20poly1305_ietf_decrypt: NoLib,
};

(async () => {
  for (const libName of Object.keys(libs)) {
    try {
      const lib = require(libName);
      if (libName === 'libsodium-wrappers' && lib.ready) await lib.ready; // eslint-disable-line no-await-in-loop
      exports.methods = libs[libName](lib);
      break;
    } catch {} // eslint-disable-line no-empty
  }
})();
