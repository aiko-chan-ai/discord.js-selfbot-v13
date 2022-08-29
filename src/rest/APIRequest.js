'use strict';

const Buffer = require('node:buffer').Buffer;
const https = require('node:https');
const { setTimeout } = require('node:timers');
const FormData = require('form-data');
const JSONBig = require('json-bigint');
const fetch = require('node-fetch');
const proxy = require('proxy-agent');

let agent = null;

class APIRequest {
  constructor(rest, method, path, options) {
    this.rest = rest;
    this.client = rest.client;
    this.method = method;
    this.route = options.route;
    this.options = options;
    this.retries = 0;

    /* Remove
    const { userAgentSuffix } = this.client.options;
    this.fullUserAgent = `${randomUA()}${userAgentSuffix.length ? `, ${userAgentSuffix.join(', ')}` : ''}`;
    */

    let queryString = '';
    if (options.query) {
      const query = Object.entries(options.query)
        .filter(([, value]) => value !== null && typeof value !== 'undefined')
        .flatMap(([key, value]) => (Array.isArray(value) ? value.map(v => [key, v]) : [[key, value]]));
      queryString = new URLSearchParams(query).toString();
    }
    this.path = `${path}${queryString && `?${queryString}`}`;
  }

  make() {
    agent ??=
      typeof this.client.options.proxy === 'string' && this.client.options.proxy.length > 0
        ? new proxy(this.client.options.proxy)
        : new https.Agent({ ...this.client.options.http.agent, keepAlive: true });

    const API =
      this.options.versioned === false
        ? this.client.options.http.api
        : `${this.client.options.http.api}/v${this.client.options.http.version}`;
    const url = API + this.path;

    let headers = {
      ...this.client.options.http.headers,
      Accept: '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
      'Sec-Ch-Ua': `"Not A;Brand";v="99", "Chromium";v="${
        this.client.options.ws.properties.browser_version.split('.')[0]
      }", "Google Chrome";v="${this.client.options.ws.properties.browser_version.split('.')[0]}`,
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      'X-Debug-Options': 'bugReporterEnabled',
      'X-Super-Properties': `${Buffer.from(JSONBig.stringify(this.client.options.ws.properties), 'ascii').toString(
        'base64',
      )}`,
      'X-Discord-Locale': 'en-US',
      'User-Agent': this.client.options.http.headers['User-Agent'],
    };

    /* Remove
    this.client.options.http.headers['User-Agent'] = this.fullUserAgent;
    */

    if (this.options.auth !== false) headers.Authorization = this.rest.getAuth();
    if (this.options.reason) headers['X-Audit-Log-Reason'] = encodeURIComponent(this.options.reason);
    if (this.options.headers) headers = Object.assign(headers, this.options.headers);

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
      } else if (typeof this.options.body !== 'undefined') {
        if (this.options.dontUsePayloadJSON) {
          for (const [key, value] of Object.entries(this.options.body)) body.append(key, value);
        } else {
          body.append('payload_json', JSON.stringify(this.options.body));
        }
      }
      headers = Object.assign(headers, body.getHeaders());
      // eslint-disable-next-line eqeqeq
    } else if (this.options.data != null) {
      body = this.options.data ? JSON.stringify(this.options.data) : undefined;
      headers['Content-Type'] = 'application/json';
    } else if (this.options.body != null) {
      body = new FormData();
      body.append('payload_json', JSON.stringify(this.options.body));
      headers = Object.assign(headers, body.getHeaders());
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
