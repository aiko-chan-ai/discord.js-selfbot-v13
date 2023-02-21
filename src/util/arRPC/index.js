'use strict';

const { EventEmitter } = require('node:events');
const ProcessServer = require('./process/index.js');
const IPCServer = require('./transports/ipc.js');
const WSServer = require('./transports/websocket.js');
const { RichPresence } = require('../../structures/RichPresence.js');
const { NitroType } = require('../Constants.js');

// eslint-disable-next-line no-useless-escape
const checkUrl = url => /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/.test(url);

let socketId = 0;
module.exports = class RPCServer extends EventEmitter {
  constructor(client, debug = false) {
    super();
    Object.defineProperty(this, 'client', { value: client });
    return (async () => {
      this.debug = debug;
      this.onConnection = this.onConnection.bind(this);
      this.onMessage = this.onMessage.bind(this);
      this.onClose = this.onClose.bind(this);

      const handlers = {
        connection: this.onConnection,
        message: this.onMessage,
        close: this.onClose,
      };

      this.ipc = await new IPCServer(handlers, this.debug);
      this.ws = await new WSServer(handlers, this.debug);
      this.process = await new ProcessServer(handlers, this.debug);

      return this;
    })();
  }

  onConnection(socket) {
    socket.send({
      cmd: 'DISPATCH',
      evt: 'READY',

      data: {
        v: 1,
        // Needed otherwise some stuff errors out parsing json strictly
        user: {
          // Mock user data using arRPC app/bot
          id: this.client?.user?.id ?? '1045800378228281345',
          username: this.client?.user?.username ?? 'arRPC',
          discriminator: this.client?.user?.discriminator ?? '0000',
          avatar: this.client?.user?.avatar,
          flags: this.client?.user?.flags?.bitfield ?? 0,
          premium_type: this.client?.user?.nitroType ? NitroType[this.client?.user?.nitroType] : 0,
        },
        config: {
          api_endpoint: '//discord.com/api',
          cdn_host: 'cdn.discordapp.com',
          environment: 'production',
        },
      },
    });

    socket.socketId = socketId++;

    this.emit('connection', socket);
  }

  onClose(socket) {
    this.emit('activity', {
      activity: null,
      pid: socket.lastPid,
      socketId: socket.socketId.toString(),
    });

    this.emit('close', socket);
  }

  async onMessage(socket, { cmd, args, nonce }) {
    this.emit('message', { socket, cmd, args, nonce });

    switch (cmd) {
      case 'SET_ACTIVITY':
        if (!socket.clientInfo || !socket.clientAssets) {
          // https://discord.com/api/v9/oauth2/applications/:id/rpc
          socket.clientInfo = await this.client.api.oauth2.applications(socket.clientId).rpc.get();
          socket.clientAssets = await this.client.api.oauth2.applications(socket.clientId).assets.get();
        }
        // eslint-disable-next-line no-case-declarations
        const { activity, pid } = args; // Translate given parameters into what discord dispatch expects

        if (!activity) {
          return this.emit('activity', {
            activity: null,
            pid,
            socketId: socket.socketId.toString(),
          });
        }
        // eslint-disable-next-line no-case-declarations
        const { buttons, timestamps, instance, assets } = activity;

        socket.lastPid = pid ?? socket.lastPid;

        // eslint-disable-next-line no-case-declarations
        const metadata = {};
        // eslint-disable-next-line no-case-declarations
        const extra = {};
        if (buttons) {
          // Map buttons into expected metadata
          metadata.button_urls = buttons.map(x => x.url);
          extra.buttons = buttons.map(x => x.label);
        }

        if (assets?.large_image) {
          if (checkUrl(assets.large_image)) {
            assets.large_image = assets.large_image
              .replace('https://cdn.discordapp.com/', 'mp:')
              .replace('http://cdn.discordapp.com/', 'mp:')
              .replace('https://media.discordapp.net/', 'mp:')
              .replace('http://media.discordapp.net/', 'mp:');
            if (!assets.large_image.startsWith('mp:')) {
              // Fetch
              const data = await RichPresence.getExternal(this.client, socket.clientId, assets.large_image);
              assets.large_image = data[0].external_asset_path;
            }
          }
          if (/^[0-9]{17,19}$/.test(assets.large_image)) {
            // ID Assets
          }
          if (
            assets.large_image.startsWith('mp:') ||
            assets.large_image.startsWith('youtube:') ||
            assets.large_image.startsWith('spotify:')
          ) {
            // Image
          }
          if (assets.large_image.startsWith('external/')) {
            assets.large_image = `mp:${assets.large_image}`;
          } else {
            const l = socket.clientAssets.find(o => o.name == assets.large_image);
            if (l) assets.large_image = l.id;
          }
        }

        if (assets?.small_image) {
          if (checkUrl(assets.small_image)) {
            assets.small_image = assets.small_image
              .replace('https://cdn.discordapp.com/', 'mp:')
              .replace('http://cdn.discordapp.com/', 'mp:')
              .replace('https://media.discordapp.net/', 'mp:')
              .replace('http://media.discordapp.net/', 'mp:');
            if (!assets.small_image.startsWith('mp:')) {
              // Fetch
              const data = await RichPresence.getExternal(this.client, socket.clientId, assets.small_image);
              assets.small_image = data[0].external_asset_path;
            }
          }
          if (/^[0-9]{17,19}$/.test(assets.small_image)) {
            // ID Assets
          }
          if (
            assets.small_image.startsWith('mp:') ||
            assets.small_image.startsWith('youtube:') ||
            assets.small_image.startsWith('spotify:')
          ) {
            // Image
          }
          if (assets.small_image.startsWith('external/')) {
            assets.small_image = `mp:${assets.small_image}`;
          } else {
            const l = socket.clientAssets.find(o => o.name == assets.small_image);
            if (l) assets.small_image = l.id;
          }
        }

        if (timestamps) {
          for (const x in timestamps) {
            // Translate s -> ms timestamps
            if (Date.now().toString().length - timestamps[x].toString().length > 2) {
              timestamps[x] = Math.floor(1000 * timestamps[x]);
            }
          }
        }

        this.emit('activity', {
          activity: {
            application_id: socket.clientId,
            type: 0,
            name: socket.clientInfo.name,
            metadata,
            assets,
            flags: instance ? 1 << 0 : 0,
            ...activity,
            ...extra,
          },
          pid,
          socketId: socket.socketId.toString(),
        });

        socket.send?.({
          cmd,
          data: null,
          evt: null,
          nonce,
        });

        break;

      case 'GUILD_TEMPLATE_BROWSER':
      case 'INVITE_BROWSER':
        // eslint-disable-next-line no-case-declarations
        const { code } = args;
        socket.send({
          cmd,
          data: {
            code,
          },
          nonce,
        });

        this.emit(cmd === 'INVITE_BROWSER' ? 'invite' : 'guild-template', code);
        break;

      case 'DEEP_LINK':
        this.emit('link', args.params);
        break;
    }
    return 0;
  }
};
