'use strict';

const Http = require('node:http');


const internals = {
    abortControllers: new WeakMap()
};


/*$lab:coverage:off$ $not:has-req-signal$*/
internals.signalGetterNative = function () {

    const req = this.raw.req;
    const signal = req.signal;

    // We need to fallback in case this is an injection

    return signal ? signal : internals.signalGetterImpl.call(this);
};
/*$lab:coverage:on$*/


internals.signalGetterImpl = function () {

    const req = this.raw.req;

    let ac = internals.abortControllers.get(req);
    if (ac === undefined) {
        ac = new AbortController();

        if (req.destroyed) {
            ac.abort();
        }
        else {
            req.once('close', () => ac.abort());
        }

        internals.abortControllers.set(req, ac);
    }

    return ac.signal;
};


internals.register = function (server, options) {

    // Prepare

    let signalGetter = internals.signalGetterNative;

    const hasNative = (('signal' in Http.IncomingMessage.prototype));
    if (!hasNative) { /*$lab:coverage:ignore$ $not:has-req-signal$*/
        signalGetter = internals.signalGetterImpl;
    }

    // Add request integration

    server.decorate('request', 'signal', signalGetter);

    // Hack the request.signal() method into a getter

    Object.defineProperty(server._core.Request.prototype, 'signal', {
        configurable: true,
        get: signalGetter
    });
};


exports.plugin = {
    pkg: require('../package.json'),
    requirements: {
        hapi: '>=21.0.0'
    },
    once: true,
    register: internals.register
};
