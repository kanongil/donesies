# donesies

Add AbortSignal integration into Hapi.js.

![Node.js CI](https://github.com/kanongil/donesies/workflows/Node.js%20CI/badge.svg)

Lead Maintainer: [Gil Pedersen](https://github.com/kanongil)

## Setup and configuration

```js
const Donesies = require('donesies');

await server.register(Donesies);

server.route({
    method: 'get',
    path: '/path',
    handler(request, h) {

        const res = await fetch(aRemoteUrl, { signal: request.signal });
        return res.json();
    }
});
```

The plugin adds a `.signal` property to the `request` object, which will trigger with an `AbortError` when
the client request is closed. Either because the response was fully transmitted, or since it was prematurely
closed by the remote end, from a connection error, or from internal processing or timeout.

### Known issues

Currently times out when used with `server.inject()`ed requests. Awaiting fix in [hapijs/shot#152](https://github.com/hapijs/shot/pull/152).
