#!/usr/bin/env bash

export OCI_HOME=/home/syba/oracleclient/instantclient
export OCI_LIB_DIR=$OCI_HOME
export OCI_INC_DIR=$OCI_HOME/sdk/include
export OCI_INCLUDE_DIR=$OCI_HOME/sdk/include
export LD_LIBRARY_PATH=$OCI_HOME:$LD_LIBRARY_PATH

cd /home/syba
pm2 delete all
pm2 kill
rm -rf syba-backend
mkdir syba-backend
mv deploy.tar.gz syba-backend
cd syba-backend
tar xzf deploy.tar.gz
npm install
pm2 start process.yml