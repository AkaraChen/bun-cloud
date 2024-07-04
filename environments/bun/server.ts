import path from "node:path";
import { parseArgs } from "node:util";
import Bun from "bun";

const { port } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
        port: {
            type: "string",
            default: "8888",
        },
    },
}).values;

let userfunc: (request: Request) => Promise<Response> | Response;

const loadFunction = async (
    modulepath: string,
    funcname: string
): Promise<typeof userfunc> => {
    // Read and load the code. It's placed there securely by the fission runtime.
    try {
        // support v1 codepath and v2 entrypoint like 'foo', '', 'index.hello'
        const module = await import(modulepath);
        const userFunction = module[funcname || "default"];
        return userFunction;
    } catch (e) {
        console.error(`user code load error: ${e}`);
        throw e;
    }
};

const server = Bun.serve({
    port: Number.parseInt(port!),
    development: process.env.NODE_ENV === "development",
    async fetch(request) {
        const { pathname } = new URL(request.url);
        switch (pathname) {
            case "/specialize/v2": {
                if (typeof userfunc === "function") {
                    throw new Error("Not a generic container.");
                }
                const body = (await request.json()) as {
                    functionName: string;
                    filepaths: string;
                };
                const entrypoint = body.functionName
                    ? body.functionName.split(".")
                    : [];
                const modulepath = path.join(
                    body.filepaths,
                    entrypoint[0] || ""
                );
                const result = await loadFunction(modulepath, entrypoint[1]);
                if (typeof result === "function") {
                    userfunc = result;
                    return Response.json(null, { status: 202 });
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
                "Content-Type": "text/html",
            },
        });
    },
});

console.log(`Server listening: ${server.port}`);
