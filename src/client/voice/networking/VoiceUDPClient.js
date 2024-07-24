'use strict';

const udp = require('dgram');
const EventEmitter = require('events');
const { isIPv4 } = require('net');
const { Buffer } = require('node:buffer');
const { Error } = require('../../../errors');
const { VoiceOpcodes } = require('../../../util/Constants');

/**
 * Represents a UDP client for a Voice Connection.
 * @extends {EventEmitter}
 * @private
 */
class VoiceConnectionUDPClient extends EventEmitter {
  constructor(voiceConnection) {
    super();

    /**
     * The voice connection that this UDP client serves
     * @type {VoiceConnection}
     */
    this.voiceConnection = voiceConnection;

    /**
     * The UDP socket
     * @type {?Socket}
     */
    this.socket = null;

    /**
     * The address of the Discord voice server
     * @type {?string}
     */
    this.discordAddress = null;

    /**
     * The local IP address
     * @type {?string}
     */
    this.localAddress = null;

    /**
     * The local port
     * @type {?string}
     */
    this.localPort = null;

    this.voiceConnection.on('closing', this.shutdown.bind(this));
  }

  shutdown() {
    this.emit('debug', `[UDP] shutdown requested`);
    if (this.socket) {
      this.socket.removeAllListeners('message');
      try {
        this.socket.close();
      } finally {
        this.socket = null;
      }
    }
  }

  /**
   * The port of the Discord voice server
   * @type {number}
   * @readonly
   */
  get discordPort() {
    return this.voiceConnection.authentication.port;
  }

  /**
   * Send a packet to the UDP client.
   * @param {Object} packet The packet to send
   * @returns {Promise<Object>}
   */
  send(packet) {
    return new Promise((resolve, reject) => {
      if (!this.socket) throw new Error('UDP_SEND_FAIL');
      if (!this.discordAddress || !this.discordPort) throw new Error('UDP_ADDRESS_MALFORMED');
      this.socket.send(packet, 0, packet.length, this.discordPort, this.discordAddress, error => {
        if (error) {
          this.emit('debug', `[UDP] >> ERROR: ${error}`);
          reject(error);
        } else {
          resolve(packet);
        }
      });
    });
  }

  async createUDPSocket(address) {
    this.discordAddress = address;
    const socket = (this.socket = udp.createSocket('udp4'));
    socket.on('error', e => {
      this.emit('debug', `[UDP] Error: ${e}`);
      this.emit('error', e);
    });
    socket.on('close', () => {
      this.emit('debug', '[UDP] socket closed');
    });
    this.emit('debug', `[UDP] created socket`);
    socket.once('message', message => {
      this.emit('debug', `[UDP] message: [${[...message]}] (${message})`);
      if (message.readUInt16BE(0) !== 2) {
        throw new Error('UDP_WRONG_HANDSHAKE');
      }
      // Stop if the sockets have been deleted because the connection has been closed already
      if (!this.voiceConnection.sockets.ws) return;

      const packet = parseLocalPacket(message);
      if (packet.error) {
        this.emit('debug', `[UDP] ERROR: ${packet.error}`);
        this.emit('error', packet.error);
        return;
      }

      this.emit('debug', `[UDP] Parse local packet: ${packet.address}:${packet.port}`);

      this.localAddress = packet.address;
      this.localPort = packet.port;

      this.voiceConnection.sockets.ws.sendPacket({
        op: VoiceOpcodes.SELECT_PROTOCOL,
        d: {
          protocol: 'udp',
          codecs: [
            {
              name: 'opus',
              type: 'audio',
              priority: 1000,
              payload_type: 120,
            },
            {
              name: this.voiceConnection.videoCodec,
              type: 'video',
              priority: 1000,
              payload_type: 101,
              rtx_payload_type: 102,
              encode: true,
              decode: true,
            },
          ],
          data: {
            address: packet.address,
            port: packet.port,
            mode: this.voiceConnection.authentication.mode,
          },
        },
      });

      // Write = false
      Object.defineProperty(this.voiceConnection, 'videoCodec', {
        value: this.voiceConnection.videoCodec,
        writable: false,
      });

      this.emit('debug', `[UDP] << ${JSON.stringify(packet)}`);

      socket.on('message', buffer => this.voiceConnection.receiver.packets.push(buffer));
    });

    const blankMessage = Buffer.alloc(74);
    blankMessage.writeUInt16BE(1, 0);
    blankMessage.writeUInt16BE(70, 2);
    blankMessage.writeUInt32BE(this.voiceConnection.authentication.ssrc, 4);
    this.emit('debug', `Sending IP discovery packet: [${[...blankMessage]}]`);
    await this.send(blankMessage);
    this.emit('debug', `Successfully sent IP discovery packet`);
  }
}

function parseLocalPacket(message) {
  try {
    const packet = Buffer.from(message);
    const address = packet.subarray(8, packet.indexOf(0, 8)).toString('utf8');
    if (!isIPv4(address)) {
      throw new Error('UDP_ADDRESS_MALFORMED');
    }
    const port = packet.readUInt16BE(packet.length - 2);
    return { address, port };
  } catch (error) {
    return { error };
  }
}

module.exports = VoiceConnectionUDPClient;
