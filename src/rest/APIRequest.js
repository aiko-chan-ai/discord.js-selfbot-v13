'use strict';

const Buffer = require('node:buffer').Buffer;
const https = require('node:https');
const { setTimeout } = require('node:timers');
const makeFetchCookie = require('fetch-cookie');
const FormData = require('form-data');
const fetchOriginal = require('node-fetch');
const { CookieJar } = require('tough-cookie');

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

    let queryString = '';
    if (options.query) {
      const query = Object.entries(options.query)
        .filter(([, value]) => value !== null && typeof value !== 'undefined')
        .flatMap(([key, value]) => (Array.isArray(value) ? value.map(v => [key, v]) : [[key, value]]));
      queryString = new URLSearchParams(query).toString();
    }
    this.path = `${path}${queryString && `?${queryString}`}`;
  }

  make(captchaKey = undefined, captchaRqtoken = undefined) {
    if (agent === null) {
      if (typeof this.client.options.proxy === 'string' && this.client.options.proxy.length > 0) {
        const proxy = require('proxy-agent');
        agent = new proxy.ProxyAgent(this.client.options.proxy);
      } else if (this.client.options.http.agent instanceof https.Agent) {
        agent = this.client.options.http.agent;
        agent.keepAlive = true;
      } else {
        agent = new https.Agent({ ...this.client.options.http.agent, keepAlive: true });
      }
    }

    const API =
      this.options.versioned === false
        ? this.client.options.http.api
        : `${this.client.options.http.api}/v${this.client.options.http.version}`;
    const url = API + this.path;

    let headers = {
      ...this.client.options.http.headers,
      authority: 'discord.com',
      accept: '*/*',
      'accept-language': 'en-US',
      'sec-ch-ua': `"Not?A_Brand";v="8", "Chromium";v="108"`,
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      'x-debug-options': 'bugReporterEnabled',
      'x-discord-locale': 'en-US',
      'x-discord-timezone': 'Asia/Saigon',
      'x-super-properties': `${Buffer.from(
        this.client.options.jsonTransformer(this.client.options.ws.properties),
        'ascii',
      ).toString('base64')}`,
      Referer: 'https://discord.com/channels/@me',
      origin: 'https://discord.com',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
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
    if (captchaKey && typeof captchaKey == 'string') {
      headers['x-captcha-key'] = captchaKey;
      if (captchaRqtoken) headers['x-captcha-rqtoken'] = captchaRqtoken;
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
      if (this.options.useFormDataPayloadJSON) {
        body = new FormData();
        body.append('payload_json', JSON.stringify(this.options.data));
        headers = Object.assign(headers, body.getHeaders());
      } else {
        body = JSON.stringify(this.options.data);
        headers['Content-Type'] = 'application/json';
      }
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.client.options.restRequestTimeout).unref();

    return fetch(url, {
      method: this.method,
      headers,
      agent,
      body,
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));
  }
}

module.exports = APIRequest;
