import GitHub from './github';
import RestClient from '../client/rest';
import prompts from 'prompts';

const GH_NAME_PATTERN = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

export default class GitHubPrompt extends GitHub {
  
  constructor(client: RestClient, options: {loginName?: string, loginPass?: string, maxAttempts?: number} = {}) {
    super(client, options);
    if (this.loginPass && !this.loginName) {
      throw Error('Set default password without default username');
    }
    this.maxAttempts = Math.max(1, +(options.maxAttempts || 3));
  }

  async getCredentials() {
    const name = this.loginName || (await prompts({
      type: 'text',
      name: 'value',
      message: 'GitHub username',
      validate: (v: string) => v.match(GH_NAME_PATTERN) ? true : 'Invalid name',
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
}
