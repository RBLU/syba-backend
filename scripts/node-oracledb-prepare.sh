#!/usr/bin/env bash
set -e

TEST_CACHE_FILE=/home/ubuntu/.oracle/instantclient/libclntsh.so

if [ -f  ${TEST_CACHE_FILE} ]; then
    echo oracle instant client: using cached version
else
    mkdir -p ~/.oracle
    cd ~/.oracle
    wget https://hc.youpers.com/assets/instantclient-basiclite-linux.x64-12.1.0.2.0.zip
    wget https://hc.youpers.com/assets/instantclient-sdk-linux.x64-12.1.0.2.0.zip
    unzip instantclient-basiclite-linux.x64-12.1.0.2.0.zip
    unzip instantclient-sdk-linux.x64-12.1.0.2.0.zip
    mv instantclient_12_1 instantclient
    ln -s instantclient/libocci.so.12.1 instantclient/libocci.so
    ln -s instantclient/libclntsh.so.12.1 instantclient/libclntsh.so
fi