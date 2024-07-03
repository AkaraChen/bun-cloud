FROM oven/bun:1.1.17

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json /usr/src/app/
RUN bun install
COPY server.ts /usr/src/app/server.ts

CMD [ "bun", "start" ]

EXPOSE 8888
