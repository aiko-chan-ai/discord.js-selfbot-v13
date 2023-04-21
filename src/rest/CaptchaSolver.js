'use strict';

module.exports = class CaptchaSolver {
  constructor(service, key, defaultCaptchaSolver) {
    this.service = 'custom';
    this.solver = undefined;
    this.defaultCaptchaSolver = defaultCaptchaSolver;
    this.key = null;
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
              const postD = data.captcha_rqdata
                ? {
                    data: data.captcha_rqdata,
                    userAgent,
                  }
                : undefined;
              this.solver
                .hcaptcha(siteKey, 'https://discord.com/channels/@me', postD)
                .then(res => {
                  resolve(res.data);
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
