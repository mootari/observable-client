'use strict';

const GitHub = require('./github');
const prompts = require('prompts');

module.exports = class GitHubPrompt extends GitHub {
  constructor(client, options = {}) {
    super(client, options);
    if(this.loginPass && !this.loginName) {
      throw Error('Set default password without default username');
    }
    this.maxAttempts = +options.maxAttempts || 3;
  }

  async getCredentials() {
    const name = this.loginName || (await prompts({
      type: 'text',
      name: 'value',
      message: 'GitHub username',
      validate: v => (v.match(/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i) ? true : 'Invalid name'),
    })).value;
    const pass = this.loginPass || (await prompts({
      type: 'text',
      name: 'value',
      style: 'password',
      message: 'GitHub password',
    })).value;

    return [name, pass];
  }

  async get2FAToken() {
    return (await prompts({
      type: 'text',
      name: 'value',
      message: 'GitHub 2FA Token',
    })).value;
  }

  async getDeviceVerificationCode() {
    return (await prompts({
      type: 'text',
      name: 'value',
      message: 'GitHub device verification code',
    })).value;
  }

};
