'use strict';

const libs = {
  sodium: sodium => ({
    crypto_aead_xchacha20poly1305_ietf_encrypt: (plaintext, additionalData, nonce, key) =>
      sodium.api.crypto_aead_xchacha20poly1305_ietf_encrypt(plaintext, additionalData, null, nonce, key),
    crypto_aead_xchacha20poly1305_ietf_decrypt: (plaintext, additionalData, nonce, key) =>
      sodium.api.crypto_aead_xchacha20poly1305_ietf_decrypt(plaintext, additionalData, null, nonce, key),
  }),
  'libsodium-wrappers': sodium => ({
    crypto_aead_xchacha20poly1305_ietf_encrypt: (plaintext, additionalData, nonce, key) =>
      sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(plaintext, additionalData, null, nonce, key),
    crypto_aead_xchacha20poly1305_ietf_decrypt: (plaintext, additionalData, nonce, key) =>
      sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(null, plaintext, additionalData, nonce, key),
  }),
  '@stablelib/xchacha20poly1305': stablelib => ({
    crypto_aead_xchacha20poly1305_ietf_encrypt(cipherText, additionalData, nonce, key) {
      const crypto = new stablelib.XChaCha20Poly1305(key);
      return crypto.seal(nonce, cipherText, additionalData);
    },
    crypto_aead_xchacha20poly1305_ietf_decrypt(plaintext, additionalData, nonce, key) {
      const crypto = new stablelib.XChaCha20Poly1305(key);
      return crypto.open(nonce, plaintext, additionalData);
    },
  }),
};

function NoLib() {
  throw new Error(
    'Cannot play audio as no valid encryption package is installed.\n- Install sodium, libsodium-wrappers, or @stablelib/xchacha20poly1305.',
  );
}

exports.methods = {
  crypto_aead_xchacha20poly1305_ietf_encrypt: NoLib,
  crypto_aead_xchacha20poly1305_ietf_decrypt: NoLib,
};

async function importModule(name, usingImport = false) {
  try {
    if (usingImport) {
      return await import(name);
    } else {
      return require(name);
    }
  } catch (e) {
    if (e.code == 'ERR_REQUIRE_ESM') {
      return importModule(name, true);
    } else {
      throw e;
    }
  }
}

(async () => {
  for (const libName of Object.keys(libs)) {
    try {
      const lib = await importModule(libName);
      if (libName === 'libsodium-wrappers' && lib.ready) await lib.ready; // eslint-disable-line no-await-in-loop
      exports.methods = libs[libName](lib);
      break;
    } catch {} // eslint-disable-line no-empty
  }
})();
