'use strict';

const proxyParser = proxy => {
  const protocolSplit = proxy.split('://');
  const protocol = protocolSplit.length === 1 ? null : protocolSplit[0];
  const rest = protocolSplit.length === 1 ? protocolSplit[0] : protocolSplit[1];
  const authSplit = rest.split('@');
  if (authSplit.length === 1) {
    const host = authSplit[0].split(':')[0];
    const port = Number(authSplit[0].split(':')[1]);
    const proxyConfig = {
      host,
      port,
    };
    if (protocol != null) {
      proxyConfig.protocol = protocol;
    }
    return proxyConfig;
  }
  const host = authSplit[1].split(':')[0];
  const port = Number(authSplit[1].split(':')[1]);
  const [username, password] = authSplit[0].split(':');
  const proxyConfig = {
    host,
    port,
    auth: {
      username,
      password,
    },
  };
  if (protocol != null) {
    proxyConfig.protocol = protocol;
  }
  return proxyConfig;
};

module.exports = class CaptchaSolver {
  constructor(service, key, defaultCaptchaSolver, proxyString = '') {
    this.service = 'custom';
    this.solver = undefined;
    this.defaultCaptchaSolver = defaultCaptchaSolver;
    this.key = null;
    this.proxy = proxyString.length ? proxyParser(proxyString) : null;
    this._setup(service, key);
  }
  _missingModule(name) {
    return new Error(`${name} module not found, please install it with \`npm i ${name}\``);
  }
  _setup(service, key) {
    switch (service) {
      case '2captcha': {
        if (!key || typeof key !== 'string') throw new Error('2captcha key is not provided');
        try {
          const lib = require('2captcha');
          this.service = '2captcha';
          this.key = key;
          this.solver = new lib.Solver(key);
          this.solve = (data, userAgent) =>
            new Promise((resolve, reject) => {
              const siteKey = data.captcha_sitekey;
              let postD = {
                invisible: 1,
                userAgent,
              };
              if (this.proxy !== null) {
                postD = {
                  ...postD,
                  proxytype: this.proxy.protocol?.toUpperCase(),
                  proxy: `${'auth' in this.proxy ? `${this.proxy.auth.username}:${this.proxy.auth.password}@` : ''}${
                    this.proxy.host
                  }:${this.proxy.port}`,
                };
              }
              if (data.captcha_rqdata) {
                postD = {
                  ...postD,
                  data: data.captcha_rqdata,
                };
              }
              this.solver
                .hcaptcha(siteKey, 'discord.com', postD)
                .then(res => {
                  if (typeof res.data == 'string') {
                    resolve(res.data);
                  } else {
                    reject(new Error('Unknown Response'));
                  }
                })
                .catch(reject);
            });
          break;
        } catch (e) {
          throw this._missingModule('2captcha');
        }
      }
      case 'capmonster': {
        if (!key || typeof key !== 'string') throw new Error('Capmonster key is not provided');
        try {
          const { HCaptchaTask } = require('node-capmonster');
          this.service = 'capmonster';
          this.key = key;
          const client = new HCaptchaTask(this.key);
          this.solve = (captchaData, userAgent) =>
            new Promise((resolve, reject) => {
              if (userAgent) client.setUserAgent(userAgent);
              if (this.proxy !== null) {
                client.setGlobalProxy(
                  this.proxy.protocol,
                  this.proxy.host,
                  this.proxy.port,
                  'auth' in this.proxy ? this.proxy.auth.username : undefined,
                  'auth' in this.proxy ? this.proxy.auth.password : undefined,
                );
              }
              client
                .createWithTask(
                  client.task({
                    websiteURL: 'https://discord.com/channels/@me',
                    websiteKey: captchaData.captcha_sitekey,
                    isInvisible: !!captchaData.captcha_rqdata,
                    data: captchaData.captcha_rqdata,
                  }),
                )
                .then(id => client.joinTaskResult(id))
                .then(result => resolve(result.gRecaptchaResponse))
                .catch(reject);
            });
        } catch (e) {
          throw this._missingModule('node-capmonster');
        }
        break;
      }
      default: {
        this.solve = this.defaultCaptchaSolver;
      }
    }
  }
  solve() {}
};
