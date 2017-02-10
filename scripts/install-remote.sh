#!/usr/bin/env bash

cd /home/syba
pm2 stop all
rm -r syba-backend
mkdir syba-backend
mv deploy.tar.gz syba-backend
cd syba-backend
tar xzf deploy.tar.gz
npm install
pm2 start app.js