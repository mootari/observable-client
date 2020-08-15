'use strict';

const cheerio = require('cheerio');

module.exports = class GitHub {
  constructor(client, options = {}) {
    const {loginName, loginPass} = options;

    this.client = client;
    this.loginName = loginName;
    this.loginPass = loginPass;
    this.maxAttempts = 1;
  }

  async authorize() {
    const {SITE_URL} = this.client;
    const redirectPath = '/';
    const submit = (url, data) => this.client.agent.post(url)
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send(data);

    // Observable: Login
    this.client.ensureToken();
    let step = await this.client.post('/login', {
      token: this.client.getToken(),
      path: redirectPath,
      login: this.loginName,
    });

    if(!this.matchUrl(step, 'https://github.com/login')) {
      throw Error('Unexpected entry point');
    }

    // Github: Enter credentials
    let attempts = this.maxAttempts;
    while(this.matchUrl(step, 'https://github.com/login')) {
      if(attempts-- <= 0) throw Error('Too many attempts');

      const [name, pass] = await this.getCredentials();
      const data = {
        ...this.getFormData(step),
        login: name,
        password: pass,
      };
      step = await submit('https://github.com/session', data);
    }

    // Github: Enter 2FA token
    attempts = this.maxAttempts;
    while(this.matchUrl(step, 'https://github.com/sessions/two-factor')) {
      if(attempts-- <= 0) throw Error('Too many attempts');

      const data = {
        ...this.getFormData(step),
        otp: await this.get2FAToken(),
      };
      step = await submit(step.request.url, data);
    }

    // Github: Enter device verification code
    attempts = this.maxAttempts;
    while(this.matchUrl(step, 'https://github.com/sessions/verified-device')) {
      if(attempts-- <= 0) throw Error('Too many attempts');

      const data = {
        ...this.getFormData(step),
        otp: await this.getDeviceVerificationCode(),
      };
      step = await submit('https://github.com/sessions/verified-device', data);
    }

    if(!this.matchUrl(step, SITE_URL + redirectPath)) {
      throw Error(`Unknown login state - ended up on "${step.request.url}"`);
    }

    return this.client.isAuthorized();
  }

  async getCredentials() {
    return [this.loginName, this.loginPass];
  }

  async get2FAToken() {
    throw Error('Non-interactive authenticator does not support 2FA');
  }

  async getDeviceVerificationCode() {
    // pattern="([0-9]{6})|([0-9a-fA-F]{5}-?[0-9a-fA-F]{5})"
    throw Error('Non-interactive authenticator does not support device verification');
  }

  getFormData(response) {
    const data = cheerio.load(response.text)('form').first().serializeArray();
    return Object.fromEntries(data.map(({name, value}) => [name, value]));
  }

  matchUrl(response, path) {
    return response.request.url.split('?', 2)[0] === path;
  }
};
