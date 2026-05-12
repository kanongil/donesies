import { Server } from '@hapi/hapi';

import * as Donesies from "../";
import * as Lab from '@hapi/lab';

const { expect } = Lab.types;

const server = new Server();

await server.register(Donesies);
await server.register({ plugin: Donesies });

server.route({
    method: 'GET',
    path: '/',
    handler(request, h) {

        expect.type<AbortSignal>(request.signal);
        return 'ok';
    }
});

