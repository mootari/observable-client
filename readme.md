# Observable Client

A set of tools to communicate with observablehq.com:
- Offers a REST client that mimics both unauthenticated and authenticated client requests.
- Provides non-interactive and interactive wrappers to authenticate against GitHub, with support for 2FA.

## Install

```
npm install mootari/observable-client
```

## Authentication

### GitHub

Authentication against GitHub requires you to provide Observable's client ID. To obtain the ID follow these steps:
1. Open a private window (or log out of GitHub)
2. Visit [observablehq.com](https://beta.observablehq.com/).
3. Click "Sign in" and select "Sign in with GitHub".
4. From the URL you were redirected to copy the part after `?client_id=`, up to (but excluding) the next `&`.

The client ID should be 20 characters long and only contain the characters 0-9 and a-f.  

#### Example

```js
const {RestClient, AuthGithubPrompt} = require('observable-client');

const client = new RestClient;
(async () => {
  await new AuthGithubPrompt(client, {
    clientId: '0123456789abcdef0123',
    loginName: 'username',
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
