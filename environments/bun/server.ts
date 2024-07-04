import path from "node:path";
import util from "node:util";
import Bun from "bun";

const { port } = util.parseArgs({
    args: Bun.argv.slice(2),
    options: {
        port: {
            type: "string",
            default: "8888",
        },
    },
}).values;

let userfunc: (request: Request) => Promise<Response> | Response;

const loadFunction = (
    modulepath: string,
    funcname: string
): typeof userfunc => {
    const module = require(modulepath);
    const userFunction = module[funcname || "default"];
    if (typeof userFunction !== "function") {
        throw new Error(
            `Function ${funcname} not found in module ${modulepath}`
        );
    }
    console.log(`user code loaded: ${modulepath}.${funcname}`);
    return userFunction;
};

const server = Bun.serve({
    port: Number.parseInt(port!),
    development: process.env.NODE_ENV === "development",
    async fetch(request) {
        const { pathname } = new URL(request.url);
        if (pathname === "/v2/specialize") {
            if (typeof userfunc === "function") {
                throw new Error("Not a generic container.");
            }
            const body = (await request.json()) as {
                functionName: string;
                filepath: string;
            };
            const entrypoint = body.functionName
                ? body.functionName.split(".")
                : [];
            const modulepath = path.join(body.filepath, entrypoint[0] || "");
            const result = loadFunction(modulepath, entrypoint[1]);
            if (typeof result === "function") {
                userfunc = result;
                return Response.json(null, { status: 202 });
            }
            return Response.json(result, { status: 500 });
        }
        return userfunc(request);
    },
    error(error) {
        return new Response(`<pre>${error}\n${error.stack}</pre>`, {
            headers: {
                "Content-Type": "text/html",
            },
        });
    },
});

console.log(`Server listening port ${server.port}`);
