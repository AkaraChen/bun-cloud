import path from 'node:path';
import { parseArgs } from 'node:util';
import Bun from 'bun';

interface Args {
    port: string;
}

const args = parseArgs({
    args: Bun.argv.slice(2),
    options: {
        port: {
            type: 'string',
            default: '8888',
        },
    },
});

const { port } = args.values as Args;

let userfunc: (request: Request) => Promise<Response> | Response;

const loadFunction = (
    modulepath: string,
    funcname: string,
): typeof userfunc | Error => {
    // Read and load the code. It's placed there securely by the fission runtime.
    try {
        const startTime = process.hrtime();
        // support v1 codepath and v2 entrypoint like 'foo', '', 'index.hello'
        const userFunction = funcname
            ? require(modulepath)[funcname]
            : require(modulepath);
        const elapsed = process.hrtime(startTime);
        console.log(
            `user code loaded in ${elapsed[0]}sec ${elapsed[1] / 1000000}ms`,
        );
        return userFunction;
    } catch (e) {
        console.error(`user code load error: ${e}`);
        return e as Error;
    }
};

const server = Bun.serve({
    port: Number.parseInt(port),
    development: process.env.NODE_ENV === 'development',
    async fetch(request) {
        const { pathname } = new URL(request.url);
        switch (pathname) {
            case '/specialize/v2': {
                if (typeof userfunc === 'function') {
                    throw new Error('Not a generic container.');
                }
                const body = (await request.json()) as {
                    functionName: string;
                    filepaths: string;
                };
                const entrypoint = body.functionName
                    ? body.functionName.split('.')
                    : [];
                const modulepath = path.join(
                    body.filepaths,
                    entrypoint[0] || '',
                );
                const result = loadFunction(modulepath, entrypoint[1]);
                if (typeof result === 'function') {
                    userfunc = result as (
                        request: Request,
                    ) => Promise<Response>;
                    return Response.json({}, { status: 202 });
                }
                return Response.json(result, { status: 500 });
            }
            default: {
                return await userfunc(request);
            }
        }
    },
    error(error) {
        return new Response(`<pre>${error}\n${error.stack}</pre>`, {
            headers: {
                'Content-Type': 'text/html',
            },
        });
    },
});

console.log(`Server listening: ${server.port}`);
