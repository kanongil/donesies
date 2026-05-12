'use strict';

const Http = require('http');
const Events = require('events');

const Donesies = require('..');
const Code = require('@hapi/code');
const Hapi = require('@hapi/hapi');
const Hoek = require('@hapi/hoek');
const Lab = require('@hapi/lab');


const { describe, it, before, after } = exports.lab = Lab.script();
const { expect } = Code;


describe('Donesies', () => {

    const reqSignalDesc = Object.getOwnPropertyDescriptor(Http.IncomingMessage.prototype, 'signal');

    const prepareServer = async (serverOptions = {}) => {

        const server = Hapi.server({
            host: '127.0.0.1',
            debug: false,
            ...serverOptions
        });

        await server.register(Donesies);

        return server;
    };

    it('can be registered', async () => {

        const server = Hapi.server();
        await server.register(Donesies);
    });

    it('handles multiple registrations', async () => {

        const server = Hapi.server();
        await server.register(Donesies);
        await server.register(Donesies);
    });

    describe('Request.signal', () => {

        before(() => {

            delete Http.IncomingMessage.prototype.signal;    // Ensure native implementation is not available while testing
        });

        after(() => {

            if (reqSignalDesc) {
                Object.defineProperty(Http.IncomingMessage.prototype, 'signal', reqSignalDesc);
            }
        });

        it('triggers AbortError after responding', async () => {

            const server = await prepareServer();
            const signal = Promise.withResolvers();

            server.route({
                method: 'GET',
                path: '/',
                handler: (request, h) => {

                    request.signal.onabort = () => signal.resolve(request.signal.reason);

                    return 'ok';
                }
            });

            const res = await server.inject('/');
            expect(res.statusCode).to.equal(200);

            const reason = await signal.promise;
            expect(reason).to.be.an.error(DOMException);
            expect(reason.name).to.equal('AbortError');
        });

        it('triggers AbortError when interrupted', async () => {

            const server = await prepareServer();
            const signal = Promise.withResolvers();

            server.route({
                method: 'GET',
                path: '/',
                handler: (request, h) => {

                    request.signal.onabort = () => signal.resolve(request.signal.reason);
                    request.raw.res.destroy();

                    return Hoek.wait(Infinity);
                }
            });

            const res = await server.inject('/');
            expect(res.statusCode).to.equal(499);

            const reason = await signal.promise;
            expect(reason).to.be.an.error(DOMException);
            expect(reason.name).to.equal('AbortError');
        });

        it('handles already signalled AbortError', async () => {

            const server = await prepareServer();

            server.route({
                method: 'GET',
                path: '/',
                handler: async (request, h) => {

                    request.raw.res.destroy();

                    await Hoek.wait(0);

                    request.signal.throwIfAborted();   // Expected to throw

                    return 'ok';
                }
            });

            const res = await server.inject('/');
            expect(res.statusCode).to.equal(499);
        });
    });

    describe('Request.signal (native)', { skip: !reqSignalDesc  }, () => {

        const nativeInject = async (server, path) => {

            await server.start();
            try {
                const req = Http.get(`${server.info.uri}/`, { agent: false }).end();

                const [res] = await Events.once(req, 'response');
                return res;
            }
            finally {
                server.stop();
            }
        };

        it('works with inject()', async () => {

            const server = await prepareServer();
            const signal = Promise.withResolvers();

            server.route({
                method: 'GET',
                path: '/',
                handler: (request, h) => {

                    request.signal.onabort = () => signal.resolve(request.signal.reason);

                    return 'ok';
                }
            });

            const res = await server.inject('/');
            expect(res.statusCode).to.equal(200);

            const reason = await signal.promise;
            expect(reason).to.be.an.error(DOMException);
            expect(reason.name).to.equal('AbortError');
        });

        it('works without inject()', async () => {

            const server = await prepareServer();
            const signal = Promise.withResolvers();

            server.route({
                method: 'GET',
                path: '/',
                handler: (request, h) => {

                    request.signal.onabort = () => signal.resolve(request.signal.reason);

                    return 'ok';
                }
            });

            const res = await nativeInject(server, '/');
            expect(res.statusCode).to.equal(200);

            const reason = await signal.promise;
            expect(reason).to.be.an.error(DOMException);
            expect(reason.name).to.equal('AbortError');
        });
    });
});
