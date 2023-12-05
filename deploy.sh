#!/usr/bin/env bash
alias= grep -B 1 `grep -o -E '(\d{1,3}\.){3,}(\d{1,3})' ecosystem.config.js` ~/.ssh/config
HOST=${alias-'UNKNOWN HOST'}

echo "发布新版到 $HOST ?"
read -p"Continue (y/n)?" choice
case "$choice" in
 y|Y ) echo "yes";;
 * ) exit -1 ;;
esac

pm2 deploy ecosystem.config.js  production update
