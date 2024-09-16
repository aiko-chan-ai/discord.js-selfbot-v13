'use strict';

const EventEmitter = require('events');
const { Buffer } = require('node:buffer');
const crypto = require('node:crypto');
const { setTimeout } = require('node:timers');
const Speaking = require('../../../util/Speaking');
const secretbox = require('../util/Secretbox');
const { SILENCE_FRAME } = require('../util/Silence');

// The delay between packets when a user is considered to have stopped speaking
// https://github.com/discordjs/discord.js/issues/3524#issuecomment-540373200
const DISCORD_SPEAKING_DELAY = 250;

const HEADER_EXTENSION_BYTE = Buffer.from([0xbe, 0xde]);
const UNPADDED_NONCE_LENGTH = 4;
const AUTH_TAG_LENGTH = 16;

class Readable extends require('stream').Readable {
  _read() {} // eslint-disable-line no-empty-function
}

class PacketHandler extends EventEmitter {
  constructor(receiver) {
    super();
    this.receiver = receiver;
    this.nonce = null;
    this.streams = new Map();
    this.videoStreams = new Map(); // Placeholder
    this.speakingTimeouts = new Map();
  }

  resetNonce() {
    this.nonce =
      this.receiver.connection.authentication.mode === 'aead_aes256_gcm_rtpsize' ? Buffer.alloc(12) : Buffer.alloc(24);
  }

  get connection() {
    return this.receiver.connection;
  }

  _stoppedSpeaking(userId) {
    const streamInfo = this.streams.get(userId);
    if (streamInfo && streamInfo.end === 'silence') {
      this.streams.delete(userId);
      streamInfo.stream.push(null);
    }
  }

  makeStream(user, end) {
    if (this.streams.has(user)) return this.streams.get(user).stream;
    const stream = new Readable();
    stream.on('end', () => this.streams.delete(user));
    this.streams.set(user, { stream, end });
    return stream;
  }

  makeTestVideoStream(user) {
    if (this.videoStreams.has(user)) return this.videoStreams.get(user);
    const stream = new Readable();
    stream.on('end', () => this.videoStreams.delete(user));
    this.videoStreams.set(user, stream);
    return stream;
  }

  parseBuffer(buffer) {
    const { secret_key, mode } = this.receiver.connection.authentication;
    // Open packet
    if (!secret_key) return new Error('secret_key cannot be null or undefined');
    if (!this.nonce) {
      this.resetNonce();
    }
    // Copy the last 4 bytes of unpadded nonce to the padding of (12 - 4) or (24 - 4) bytes
    buffer.copy(this.nonce, 0, buffer.length - UNPADDED_NONCE_LENGTH);

    let headerSize = 12;
    const first = buffer.readUint8();
    if ((first >> 4) & 0x01) headerSize += 4;

    // The unencrypted RTP header contains 12 bytes, HEADER_EXTENSION and the extension size
    const header = buffer.slice(0, headerSize);

    // Encrypted contains the extension, if any, the opus packet, and the auth tag
    const encrypted = buffer.slice(headerSize, buffer.length - AUTH_TAG_LENGTH - UNPADDED_NONCE_LENGTH);
    const authTag = buffer.slice(
      buffer.length - AUTH_TAG_LENGTH - UNPADDED_NONCE_LENGTH,
      buffer.length - UNPADDED_NONCE_LENGTH,
    );

    let packet;
    switch (mode) {
      case 'aead_aes256_gcm_rtpsize': {
        const decipheriv = crypto.createDecipheriv('aes-256-gcm', secret_key, this.nonce);
        decipheriv.setAAD(header);
        decipheriv.setAuthTag(authTag);

        packet = Buffer.concat([decipheriv.update(encrypted), decipheriv.final()]);
        break;
      }
      case 'aead_xchacha20_poly1305_rtpsize': {
        // Combined mode expects authtag in the encrypted message
        packet = secretbox.methods.crypto_aead_xchacha20poly1305_ietf_decrypt(
          Buffer.concat([encrypted, authTag]),
          header,
          this.nonce,
          secret_key,
        );

        packet = Buffer.from(packet);
        break;
      }
      default: {
        throw new RangeError(`Unsupported decryption method: ${mode}`);
      }
    }

    // Strip RTP Header Extensions (one-byte only)
    if (packet[0] === 0xbe && packet[1] === 0xde) {
      const headerExtensionLength = packet.readUInt16BE(2);
      packet = packet.subarray(4 + 4 * headerExtensionLength);
    } else if (buffer.slice(12, 14).compare(HEADER_EXTENSION_BYTE) === 0) {
      // Strip decrypted RTP Header Extension if present
      const headerExtensionLength = buffer.slice(14).readUInt16BE();
      packet = packet.subarray(4 * headerExtensionLength);
    }

    // Ex VP8
    // <Buffer 90 80 80 00 30 b7 01 9d 01 2a 80 07 38 04 0b c7 08 85 85 88 99 84 88 3f 82 00 06 16 04 f7 06 81 64 9f 6b db 9b 27 38 7b 27 38 7b 27 38 7b 27 38 7b 27 ... 1154 more bytes>
    // 90 80: payloadDescriptorBuf (90 80 if first frame | 80 80 else)
    // 80 00: pictureIdBuf
    // n bytes: chunk raw (Ivf splitter)

    return packet;
  }

  push(buffer) {
    const ssrc = buffer.readUInt32BE(8);
    const userStat = this.connection.ssrcMap.get(ssrc) || this.connection.ssrcMap.get(ssrc - 1); // Maybe video_ssrc ?

    if (!userStat) return;

    let opusPacket;
    const streamInfo = this.streams.get(userStat.userId);
    const videoStreamInfo = this.videoStreams.get(userStat.userId);

    // If the user is in video, we need to check if the packet is just silence
    if (userStat.hasVideo) {
      opusPacket = this.parseBuffer(buffer);
      if (opusPacket instanceof Error) {
        // Only emit an error if we were actively receiving packets from this user
        if (streamInfo || videoStreamInfo) {
          this.emit('error', opusPacket);
        }
        return;
      }
      if (SILENCE_FRAME.equals(opusPacket)) {
        // If this is a silence frame, pretend we never received it
        return;
      }
    }

    let speakingTimeout = this.speakingTimeouts.get(ssrc);
    // Only for voice... idk
    if (this.connection.ssrcMap.has(ssrc)) {
      if (typeof speakingTimeout === 'undefined') {
        // Ensure at least the speaking bit is set.
        // As the object is by reference, it's only needed once per client re-connect.
        if (userStat.speaking === 0) {
          userStat.speaking = Speaking.FLAGS.SPEAKING;
        }
        this.connection.onSpeaking({ user_id: userStat.userId, ssrc: ssrc, speaking: userStat.speaking });
        speakingTimeout = setTimeout(() => {
          try {
            this.connection.onSpeaking({ user_id: userStat.userId, ssrc: ssrc, speaking: 0 });
            clearTimeout(speakingTimeout);
            this.speakingTimeouts.delete(ssrc);
          } catch {
            // Connection already closed, ignore
          }
        }, DISCORD_SPEAKING_DELAY).unref();
        this.speakingTimeouts.set(ssrc, speakingTimeout);
      } else {
        speakingTimeout.refresh();
      }
    }

    if (streamInfo) {
      const { stream } = streamInfo;
      if (!opusPacket) {
        opusPacket = this.parseBuffer(buffer);
        if (opusPacket instanceof Error) {
          this.emit('error', opusPacket);
          return;
        }
      }
      stream.push(opusPacket);
      if (opusPacket === null) {
        // ! null marks EOF for stream
        stream.destroy();
      }
    }

    if (videoStreamInfo) {
      const stream = videoStreamInfo;
      if (!opusPacket) {
        opusPacket = this.parseBuffer(buffer);
        if (opusPacket instanceof Error) {
          this.emit('error', opusPacket);
          return;
        }
      }
      stream.push(opusPacket); // VP8 ? idk
    }
  }
}

module.exports = PacketHandler;
