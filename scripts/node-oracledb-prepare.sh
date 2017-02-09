#!/usr/bin/env bash
set -e

mkdir -p ~/.oracle
cd ~/.oracle
wget https://hc.youpers.com/assets/instantclient-basiclite-linux.x64-12.1.0.2.0.zip
wget https://hc.youpers.com/assets/instantclient-sdk-linux.x64-12.1.0.2.0.zip
unzip instantclient-basiclite-linux.x64-12.1.0.2.0.zip
unzip instantclient-sdk-linux.x64-12.1.0.2.0.zip
mv instantclient_12_1/ instantclient
mv instantclient/libocci.so.12.1 instantclient/libocci.so
mv instantclient/libclntsh.so.12.1 instantclient/libclntsh.so
