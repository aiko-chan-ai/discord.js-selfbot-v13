'use strict';
module.exports = class CaptchaSolver {
  constructor(service, key) {
    this.service = '';
    this.solver = undefined;
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
          this.solver = new lib.Solver(key);
          this.solve = siteKey =>
            new Promise((resolve, reject) => {
              this.solver
                .hcaptcha(siteKey, 'discord.com')
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
      case 'nopecha': {
        if (!key || typeof key !== 'string') throw new Error('NopeCHA key is not provided');
        try {
          const { Configuration, NopeCHAApi } = require('nopecha');
          const configuration = new Configuration({
            apiKey: key,
          });
          this.service = 'nopecha';
          this.solver = new NopeCHAApi(configuration);
          this.solve = siteKey =>
            new Promise((resolve, reject) => {
              this.solver
                .solveToken({
                  type: 'hcaptcha',
                  sitekey: siteKey,
                  url: 'https://discord.com',
                })
                .then(res => {
                  resolve(res);
                })
                .catch(reject);
            });
          break;
        } catch (e) {
          throw this._missingModule('nopecha');
        }
      }
    }
  }
  solve() {}
};
