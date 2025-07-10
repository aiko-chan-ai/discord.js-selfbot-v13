'use strict';

const Buffer = require('node:buffer').Buffer;
const { setTimeout } = require('node:timers');
const { FormData, buildConnector, Client, ProxyAgent } = require('undici');
const { ciphers } = require('../util/Constants');
const Util = require('../util/Util');

let agent = null;

class APIRequest {
  constructor(rest, method, path, options) {
    this.rest = rest;
    this.client = rest.client;
    this.method = method;
    this.route = options.route;
    this.options = options;
    this.retries = 0;

    this.fullUserAgent = this.client.options.http.headers['User-Agent'];

    this.client.options.ws.properties.browser_user_agent = this.fullUserAgent;

    let queryString = '';
    if (options.query) {
      const query = Object.entries(options.query)
        .filter(([, value]) => value !== null && typeof value !== 'undefined')
        .flatMap(([key, value]) => (Array.isArray(value) ? value.map(v => [key, v]) : [[key, value]]));
      queryString = new URLSearchParams(query).toString();
    }
    this.path = `${path}${queryString && `?${queryString}`}`;
  }

  make(captchaKey, captchaRqToken) {
    if (!agent) {
      const r_ = Util.checkUndiciProxyAgent(this.client.options.http.agent);
      if (!r_) {
        agent = new Client('https://discord.com', {
          connect: buildConnector({ ciphers: ciphers.join(':') }),
        });
      } else {
        agent = new ProxyAgent({
          ...r_,
          ciphers: ciphers.join(':'),
        });
      }
    }

    const API =
      this.options.versioned === false
        ? this.client.options.http.api
        : `${this.client.options.http.api}/v${this.client.options.http.version}`;
    const url = API + this.path;

    let headers = {
      accept: '*/*',
      'accept-language': 'en-US',
      priority: 'u=1, i',
      referer: 'https://discord.com/channels/@me',
      'sec-ch-ua': '"Not:A-Brand";v="24", "Chromium";v="134"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      'x-discord-locale': 'en-US',
      'x-discord-timezone': Intl.DateTimeFormat().resolvedOptions().timeZone,
      'x-super-properties': `${Buffer.from(JSON.stringify(this.client.options.ws.properties), 'ascii').toString(
        'base64',
      )}`,
      origin: 'https://discord.com',
      'x-debug-options': 'bugReporterEnabled',
      ...this.client.options.http.headers,
      'User-Agent': this.fullUserAgent,
    };

    if (this.options.auth !== false) headers.Authorization = this.rest.getAuth();
    if (this.options.reason) headers['X-Audit-Log-Reason'] = encodeURIComponent(this.options.reason);
    if (this.options.headers) headers = Object.assign(headers, this.options.headers);

    // Delete all headers if undefined
    for (const [key, value] of Object.entries(headers)) {
      if (value === undefined) delete headers[key];
    }
    if (this.options.webhook === true) {
      headers = {
        'User-Agent': this.client.options.http.headers['User-Agent'],
      };
    }

    // Some options
    if (this.options.DiscordContext) {
      headers['X-Context-Properties'] = Buffer.from(JSON.stringify(this.options.DiscordContext), 'utf8').toString(
        'base64',
      );
    }

    if (this.options.mfaToken) {
      headers['X-Discord-Mfa-Authorization'] = this.options.mfaToken;
    }

    // Captcha
    if (captchaKey && typeof captchaKey == 'string') headers['X-Captcha-Key'] = captchaKey;
    if (captchaRqToken && typeof captchaRqToken == 'string') headers['X-Captcha-Rqtoken'] = captchaRqToken;

    let body;
    if (this.options.files?.length) {
      body = new FormData();
      for (const [index, file] of this.options.files.entries()) {
        // Why undici#FormData doesn't support file stream?
        // Hacky way to support file stream
        if (file?.file) {
          body.set(file.key ?? `files[${index}]`, {
            [Symbol.toStringTag]: 'File',
            name: file.name,
            stream: () => file.file,
          });
        }
      }
      if (typeof this.options.data !== 'undefined') {
        if (this.options.dontUsePayloadJSON) {
          for (const [key, value] of Object.entries(this.options.data)) body.append(key, value);
        } else {
          body.append('payload_json', JSON.stringify(this.options.data));
        }
      }
      // eslint-disable-next-line eqeqeq
    } else if (this.options.data != null) {
      if (this.options.usePayloadJSON) {
        body = new FormData();
        body.append('payload_json', JSON.stringify(this.options.data));
      } else {
        body = JSON.stringify(this.options.data);
        headers['Content-Type'] = 'application/json';
      }
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.client.options.restRequestTimeout).unref();
    return this.rest
      .fetch(url, {
        method: this.method.toUpperCase(), // Undici doesn't normalize "patch" into "PATCH" (which surprisingly follows the spec).
        headers,
        body,
        signal: controller.signal,
        redirect: 'follow',
        dispatcher: agent,
        credentials: 'include',
      })
      .finally(() => clearTimeout(timeout));
  }
}

module.exports = APIRequest;
