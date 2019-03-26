'use strict';

module.exports = class GitHub {
  constructor(client, options = {}) {
    const {clientId, loginName, loginPass} = options;

    if(typeof clientId !== 'string' || !clientId.match(/[a-f0-9]{20}/)) {
      throw Error('Invalid Github client ID');
    }

    this.client = client;
    this.clientId = clientId;
    this.loginName = loginName;
    this.loginPass = loginPass;
    this.maxAttempts = 1;
  }

  async authorize() {
    const {agent, SITE_URL, API_URL} = this.client;
    await this.client.ensureToken();
    const redirectPath = '/';

    let step = await agent.get('https://github.com/login/oauth/authorize').query({
      client_id: this.clientId,
      state: this.client.getToken(),
      redirect_uri: `${API_URL}/github/oauth?path=${encodeURIComponent(redirectPath)}`,
    });

    if(!this.matchUrl(step, 'https://github.com/login')) {
      throw Error('Unexpected entry point');
    }

    let attempts = this.maxAttempts;
    while(this.matchUrl(step, 'https://github.com/login')) {
      if(attempts-- <= 0) throw Error('Too many attempts');

      const [name, pass] = await this.getCredentials();
      step = await agent.post('https://github.com/session')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
          authenticity_token: this.extractAuthToken(step.text),
          login: name,
          password: pass,
        });
    }

    attempts = this.maxAttempts;
    while(this.matchUrl(step, 'https://github.com/sessions/two-factor')) {
      if(attempts-- <= 0) throw Error('Too many attempts');

      step = await agent.post(step.request.url)
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
          authenticity_token: this.extractAuthToken(step.text),
          otp: await this.get2FAToken(),
        });
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

  extractAuthToken(text) {
    const m = text.match(/ name="authenticity_token" value="([^"]+)"/);
    return m ? m[1] : null;
  }

  matchUrl(response, path) {
    return response.request.url.split('?', 2)[0] === path;
  }
};
