export default async function hello(request: Request): Promise<Response> {
    const { name = 'world' } = await request.json();
    return Response.json({ hello: name });
}
