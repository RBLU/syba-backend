#!/usr/bin/env bash
set -e


if [ -f  ~/.oracle/instantclient/libclntsh.so ]; then
    echo oracle instant client: using cached version
else
    mkdir -p ~/.oracle
    cd ~/.oracle
    wget https://hc.youpers.com/assets/instantclient-basiclite-linux.x64-12.1.0.2.0.zip
    wget https://hc.youpers.com/assets/instantclient-sdk-linux.x64-12.1.0.2.0.zip
    unzip instantclient-basiclite-linux.x64-12.1.0.2.0.zip
    unzip instantclient-sdk-linux.x64-12.1.0.2.0.zip
    mv instantclient_12_1 instantclient
    cp ~/.oracle/instantclient/libocci.so.12.1 ~/.oracle/instantclient/libocci.so
    cp ~/.oracle/instantclient/libclntsh.so.12.1 ~/.oracle/instantclient/libclntsh.so
fi