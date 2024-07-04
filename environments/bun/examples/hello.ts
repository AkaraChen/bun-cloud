export default async function hello(): Promise<Response> {
    return Response.json({ hello: 'world' });
}
