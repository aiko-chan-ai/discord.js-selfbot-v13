'use strict';
module.exports = class CaptchaSolver {
  constructor(service, key) {
    this.service = '';
    this.solver = undefined;
    this._setup(service, key);
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
          throw new Error('2captcha module not found, please install it with `npm i 2captcha`');
        }
      }
    }
  }
  solve() {}
};
