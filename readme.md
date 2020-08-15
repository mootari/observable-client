# Observable Client

A set of tools to communicate with observablehq.com:
- Offers a REST client that mimics both unauthenticated and authenticated client requests.
- Provides non-interactive and interactive wrappers to authenticate against GitHub, with support for 2FA.

## Install

```
npm install mootari/observable-client
```

#### Example

```js
const {RestClient, AuthGithubPrompt} = require('observable-client');

const client = new RestClient;
(async () => {
  await new AuthGithubPrompt(client, {
    loginName: 'username',
    loginPass: 'password', // Optional. Will be prompted if not provided here.
  }).authorize();

  console.log('authorized', (await client.get('/user')).body);
})();
```

## Roadmap
- Caching API for cookies
- API wrapper for documents
- API wrappers for collections and users
- Export/import tools
- WebSocket client for edits and comments
