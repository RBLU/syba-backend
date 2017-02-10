#!/usr/bin/env bash

scp ./dist/deploy.tar.gz syba@retohome.youpers.org:/home/syba
ssh syba@retohome.youpers.org 'bash -s' scripts/install-remote.sh