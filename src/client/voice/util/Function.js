'use strict';

const dgram = require('dgram');
const { setImmediate } = require('node:timers');

/**
 * @typedef {Object} InterfaceAddresses
 * @property {string} [udp4] - IPv4 address
 * @property {string} [udp6] - IPv6 address
 */

/**
 * Get the interface address for a given socket type.
 * @param {"udp4"|"udp6"} type - The socket type.
 * @param {InterfaceAddresses} [interfaceAddresses] - The interface addresses mapping.
 * @returns {string|undefined} The interface address if available.
 */
function interfaceAddress(type, interfaceAddresses) {
  return interfaceAddresses ? interfaceAddresses[type] : undefined;
}

/**
 * Get a random available port.
 * @param {"udp4"|"udp6"} [protocol="udp4"] - The socket type.
 * @param {InterfaceAddresses} [interfaceAddresses] - The interface addresses mapping.
 * @returns {Promise<number>} The assigned random port.
 */
async function randomPort(protocol = 'udp4', interfaceAddresses) {
  const socket = dgram.createSocket(protocol);

  setImmediate(() =>
    socket.bind({
      port: 0,
      address: interfaceAddress(protocol, interfaceAddresses),
    }),
  );

  await new Promise((resolve, reject) => {
    socket.once('error', reject);
    socket.once('listening', resolve);
  });

  const port = socket.address()?.port;
  await new Promise(resolve => socket.close(resolve));
  return port;
}

/**
 * Get multiple random available ports.
 * @param {number} num - Number of ports to find.
 * @param {"udp4"|"udp6"} [protocol="udp4"] - The socket type.
 * @param {InterfaceAddresses} [interfaceAddresses] - The interface addresses mapping.
 * @returns {Promise<number[]>} An array of assigned random ports.
 */
async function randomPorts(num, protocol = 'udp4', interfaceAddresses) {
  return Promise.all(Array.from({ length: num }).map(() => randomPort(protocol, interfaceAddresses)));
}

/**
 * Find an available port within a given range.
 * @param {number} min - The minimum port number.
 * @param {number} max - The maximum port number.
 * @param {"udp4"|"udp6"} [protocol="udp4"] - The socket type.
 * @param {InterfaceAddresses} [interfaceAddresses] - The interface addresses mapping.
 * @returns {Promise<number>} The available port within range.
 * @throws {Error} If no port is found within the range.
 */
async function findPort(min, max, protocol = 'udp4', interfaceAddresses) {
  let port;

  for (let i = min; i <= max; i++) {
    const socket = dgram.createSocket(protocol);

    setImmediate(() =>
      socket.bind({
        port: i,
        address: interfaceAddress(protocol, interfaceAddresses),
      }),
    );

    const error = await new Promise(resolve => {
      socket.once('error', resolve);
      socket.once('listening', () => resolve(null));
    });

    await new Promise(resolve => socket.close(resolve));

    if (error) continue;

    const addressInfo = socket.address();
    if (addressInfo && addressInfo.port >= min && addressInfo.port <= max) {
      port = addressInfo.port;
      break;
    }
  }

  if (!port) throw new Error('port not found');
  return port;
}

function parseStreamKey(key) {
  const Arr = key.split(':');
  const type = Arr[0];
  const guildId = type == 'guild' ? Arr[1] : null;
  const channelId = type == 'guild' ? Arr[2] : Arr[1];
  const userId = type == 'guild' ? Arr[3] : Arr[2];
  return { type, guildId, channelId, userId };
}

module.exports = {
  randomPort,
  randomPorts,
  findPort,
  interfaceAddress,
  parseStreamKey,
};
