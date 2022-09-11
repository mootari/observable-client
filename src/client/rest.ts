import request from 'superagent';
import crypto from 'crypto';
import {Request, SuperAgentStatic} from 'superagent';
import {CookieAccessInfo} from 'cookiejar'

export type RequestMethod = 'get' | 'post' | 'delete';
export type RequestData = object | string;

export default class RestClient {
  API_URL: string;
  SITE_URL: string;
  accessInfo: CookieAccessInfo;
  agent: SuperAgentStatic & Request;
  
  constructor(options: {
    siteUrl?: string,
    apiUrl?: string,
    accessInfo?: CookieAccessInfo
  } = {}) {
    const {
      siteUrl = 'https://observablehq.com',
      apiUrl = 'https://api.observablehq.com',
      // Cookie jar access info.
      accessInfo = {
        domain: '.observablehq.com',
        path: '/',
        secure: true,
      } as CookieAccessInfo
    } = options;
    this.SITE_URL = siteUrl;
    this.API_URL = apiUrl;
    this.accessInfo = accessInfo;
    this.agent = request.agent().withCredentials();
  }
  
  async get(route: string, data: RequestData | null = null) {
    return this.request('get', route, data);
  }
  
  async post(route: string, data: RequestData | null = null) {
    return this.request('post', route, data);
  }
  
  async delete(route: string) {
    return this.request('delete', route);
  }
  
  async request(method: RequestMethod, route: string, data: RequestData | null = null) {
    const path = this.API_URL + '/' + route.replace(/^\//, '');
    const m = method.toLowerCase();
    if (!(m === 'get' || m === 'post' || m === 'delete')) {
      throw Error(`Invalid request method "${method}"`);
    }
    
    this.ensureToken();
    const req = this.agent[m](path).set({ Origin: this.SITE_URL });
    if (data !== null) {
      if (m === 'get') req.query(data);
      else if (m === 'post') req.send(data);
      else throw Error(`Request method "${method}" does not allow data.`);
    }
    return req;
  }
  /**
  * Checks for a valid session.
  */
  async isAuthorized(): Promise<boolean> {
    return !!(this.getSession() && (await this.request('get', '/user')));
  }
  /**
  * Returns CSRF token value.
  */
  getToken() {
    const { value } = this.agent.jar.getCookie('T', this.accessInfo) || {};
    return value || null;
  }
  /**
  * Returns session value.
  */
  getSession() {
    return this.agent.jar.getCookie('S', this.accessInfo)?.value ?? null;
  }
  /**
  * Ensures that a CSRF token has been generated.
  */
  ensureToken(regenerate = false) {
    if (!regenerate && this.getToken())
    return;
    const { domain, path, secure } = this.accessInfo;
    const token = Array.from(
      crypto.randomFillSync(new Uint8Array(16)),
      (e: number) => e.toString(16).padStart(2, '0')
    ).join('');
    
    const expires = new Date(Date.now() + 1728e5).toUTCString();
    const cookie = `T=${token}; Domain=${domain}; Path=${path}; Expires=${expires}; ${secure ? 'Secure' : ''}`;
    this.agent.jar.setCookie(cookie, domain, path);
  }
}
