fission env create --name bunjs --image fission-bun-environment:latest --poolsize 1 --builder fission-bun-builder:latest --version 2

fission pkg create --code ./examples/hello.ts --name bun-hello --env bunjs
fission fn create --env bunjs --name bun-hello --pkg bun-hello
fission fn test --name bun-hello
fission fn delete --name bun-hello
fission pkg delete --name bun-hello

fission env delete --name bunjs
