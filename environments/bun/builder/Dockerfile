FROM fission/builder:latest

FROM oven/bun:1.1.17

COPY --from=0 /builder /builder
ADD build.sh /usr/local/bin/build
RUN chmod +x /usr/local/bin/build
