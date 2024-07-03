#!/bin/sh
cd ${SRC_PKG}

bun install && cp -r ${SRC_PKG} ${DEPLOY_PKG}
