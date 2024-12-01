'use strict';

const Buffer = require('node:buffer').Buffer;
const https = require('node:https');
const { setTimeout } = require('node:timers');
const makeFetchCookie = require('fetch-cookie');
const { CookieJar } = require('tough-cookie');
const { fetch: fetchOriginal, FormData } = require('undici');
const { ciphers } = require('../util/Constants');
const Util = require('../util/Util');

const cookieJar = new CookieJar();
const fetch = makeFetchCookie(fetchOriginal, cookieJar);

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
      if (Util.verifyProxyAgent(this.client.options.http.agent)) {
        // Bad code
        for (const [k, v] of Object.entries({
          keepAlive: true,
          honorCipherOrder: true,
          secureProtocol: 'TLSv1_2_method',
          ciphers: ciphers.join(':'),
        })) {
          this.client.options.http.agent.httpsAgent[k] = v;
        }
        agent = this.client.options.http.agent;
      } else {
        agent = new https.Agent({
          ...this.client.options.http.agent,
          keepAlive: true,
          honorCipherOrder: true,
          secureProtocol: 'TLSv1_2_method',
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
      'sec-ch-ua': '"Not?A_Brand";v="8", "Chromium";v="108"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      'x-debug-options': 'bugReporterEnabled',
      'x-discord-locale': 'en-US',
      'x-discord-timezone': Intl.DateTimeFormat().resolvedOptions().timeZone,
      'x-super-properties': `${Buffer.from(JSON.stringify(this.client.options.ws.properties), 'ascii').toString(
        'base64',
      )}`,
      referer: 'https://discord.com/channels/@me',
      origin: 'https://discord.com',
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

    let body;
    if (this.options.files?.length) {
      body = new FormData();
      for (const [index, file] of this.options.files.entries()) {
        if (file?.file) body.append(file.key ?? `files[${index}]`, file.file, file.name);
      }
      if (typeof this.options.data !== 'undefined') {
        if (this.options.dontUsePayloadJSON) {
          for (const [key, value] of Object.entries(this.options.data)) body.append(key, value);
        } else {
          body.append('payload_json', JSON.stringify(this.options.data));
        }
      }
      headers = Object.assign(headers, body.getHeaders());
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

    // Captcha
    if (captchaKey && typeof captchaKey == 'string') headers['X-Captcha-Key'] = captchaKey;
    if (captchaRqToken && typeof captchaRqToken == 'string') headers['X-Captcha-Rqtoken'] = captchaRqToken;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.client.options.restRequestTimeout).unref();
    return fetch(url, {
      method: this.method.toUpperCase(), // Undici doesn't normalize "patch" into "PATCH" (which surprisingly follows the spec).
      headers,
      agent,
      body,
      signal: controller.signal,
      redirect: 'follow',
    }).finally(() => clearTimeout(timeout));
  }
}

module.exports = APIRequest;
