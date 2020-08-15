'use strict';

const request = require('superagent');
const crypto = require('crypto');

module.exports = class RestClient {
  constructor(options = {}) {
    const {
      siteUrl = 'https://observablehq.com',
      apiUrl = 'https://api.observablehq.com',
      // Cookie jar access info.
      accessInfo = {
        domain: '.observablehq.com',
        path: '/',
        secure: true,
      }
    } = options;

    this.SITE_URL = siteUrl;
    this.API_URL = apiUrl;
    this.accessInfo = accessInfo;
    this.agent = request.agent().withCredentials();
  }

  async get(route, data = null) {
    return this.request('get', route, data);
  }

  async post(route, data = null) {
    return this.request('post', route, data);
  }

  async delete(route) {
    return this.request('delete', route);
  }

  async request(method, route, data = null) {
    const m = method.toLowerCase();
    const path = this.API_URL + '/' + route.replace(/^\//, '');
    if(!m.match(/^(get|post|delete)$/)) throw Error(`Invalid request method "${method}"`);

    this.ensureToken();
    const req = this.agent[m](path).set({Origin: this.SITE_URL});

    if(data !== null) {
      if(m === 'get') req.query(data);
      else if(m === 'post') req.send(data);
      else throw Error(`Request method "${method}" does not allow data.`);
    }

    return req;
  }

  /**
   * Checks for a valid session.
   *
   * @returns {Promise<boolean>}
   */
  async isAuthorized() {
    return !!(this.getSession() && await this.request('get', '/user'));
  }

  /**
   * Returns CSRF token value.
   */
  getToken() {
    const {value} = this.agent.jar.getCookie('T', this.accessInfo) || {};
    return value || null;
  }

  /**
   * Returns session value.
   */
  getSession() {
    const {value} = this.agent.jar.getCookie('S', this.accessInfo) || {};
    return value || null;
  }

  /**
   * Ensures that a CSRF token has been generated.
   *
   * @param regenerate
   */
  ensureToken(regenerate = false) {
    if (!regenerate && this.getToken()) return;

    const {domain, path, secure} = this.accessInfo;
    const n = 16;
    const token = Array.from(crypto.randomFillSync(new Uint8Array(n)), e => e.toString(16).padStart(2, '0')).join('');
    const expires = new Date(Date.now() + 1728e5).toUTCString();
    const cookie = `T=${token}; Domain=${domain}; Path=${path}; Expires=${expires}; ${secure ? 'Secure' : ''}`;
    this.agent.jar.setCookie(cookie, domain, path);
  }

};
