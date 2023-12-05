#!/bin/bash

MONGO_DATABASE="mahjong"
APP_NAME="mahjong"

MONGO_HOST="127.0.0.1"
MONGO_PORT="27017"
TIMESTAMP=`date +%F-%H%M`
MONGODUMP_PATH="/usr/bin/mongodump"
BACKUPS_DIR="/root/backup/$APP_NAME-$TIMESTAMP"

collection_list="players gms clubmembers clubs globals gmplans"
for collection in $collection_list; do
	echo $collection
  	out_dir=${BACKUPS_DIR}
	mkdir -p ${out_dir}
  	${MONGODUMP_PATH} -u ulong_remote -p ulong_remote --collection $collection --db $MONGO_DATABASE --out ${out_dir}
done
