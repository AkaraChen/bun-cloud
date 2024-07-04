docker build -t akarachan/fission-bun-environment:latest .
docker build -t akarachan/fission-bun-builder:latest ./builder
docker push akarachan/fission-bun-environment:latest
docker push akarachan/fission-bun-builder:latest
