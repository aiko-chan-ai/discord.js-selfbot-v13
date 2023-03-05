'use strict';
const { setTimeout } = require('node:timers');
const axios = require('axios');
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
        this.service = 'capmonster';
        this.key = key;
        this.solve = (captchaData, userAgent) =>
          // https://github.com/aiko-chan-ai/discord.js-selfbot-v13/issues/548#issuecomment-1452091328
          // eslint-disable-next-line no-async-promise-executor
          new Promise(async (resolve, reject) => {
            try {
              const createTaskResponse = await axios.post(
                'https://api.capmonster.cloud/createTask',
                {
                  clientKey: this.key,
                  task: {
                    type: 'HCaptchaTask',
                    websiteURL: 'https://discord.com/channels/@me',
                    websiteKey: captchaData.captcha_sitekey,
                    data: captchaData.captcha_rqdata,
                    isInvisible: !!captchaData.captcha_rqdata,
                    userAgent: userAgent,
                  },
                },
                {
                  headers: {
                    'Content-Type': 'application/json',
                    'user-agent': userAgent,
                  },
                },
              );
              const taskId = createTaskResponse.data.taskId;
              let getResults = { status: 'processing' };
              while (getResults.status === 'processing') {
                const getResultsResponse = await axios.post('https://api.capmonster.cloud/getTaskResult', {
                  clientKey: this.key,
                  taskId,
                });
                getResults = getResultsResponse.data;
                await new Promise(resolve_ => setTimeout(resolve_, 1500).unref());
              }
              const solution = getResults.solution.gRecaptchaResponse;
              return resolve(await solution);
            } catch (e) {
              // !console.error(e);
              reject(new Error(`Capmonster error: ${e.message}`, e?.response?.data));
            }
            return true;
          });
        break;
      }
      default: {
        this.solve = this.defaultCaptchaSolver;
      }
    }
  }
  solve() {}
};
