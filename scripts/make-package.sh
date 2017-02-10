#!/usr/bin/env bash

rm -r ./dist/*
tar -cvzf dist/deploy.tar.gz --exclude "node_modules" --exclude "data" --exclude "test" --exclude ".git" --exclude ".idea" .