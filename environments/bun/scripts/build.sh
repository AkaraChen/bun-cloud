eval $(minikube docker-env)
docker image rm fission-bun-environment:latest
docker build -t fission-bun-environment:latest .
docker image rm fission-bun-builder:latest
docker build -t fission-bun-builder:latest ./builder
