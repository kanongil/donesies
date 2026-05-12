import { Plugin } from '@hapi/hapi';

export interface DonesiesRegistrationOptions {}

export const plugin: Plugin<DonesiesRegistrationOptions> & {
    pkg: {
        name: 'donesies',
        version: string
    }
};

// Extend hapi typings

declare module '@hapi/hapi' {

    interface Request {
        /** Triggers once the request is closed. */
        readonly signal: AbortSignal;
    }
}
