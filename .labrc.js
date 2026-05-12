'use strict';

const Http = require('http');

module.exports = {
    'coverage-predicates': {
        'has-req-signal': ('signal' in Http.IncomingMessage.prototype)
    }
};
