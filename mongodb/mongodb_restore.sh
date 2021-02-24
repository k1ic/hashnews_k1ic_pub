#!/bin/bash
#restore backgroud requirement(need grant when mongorestore with drop)
# 1. mongo
# 2. use admin
# 3. db.auth('admin', '123456')
# 4. db.grantRolesToUser( "admin" , [ { role: "restore", db: "admin" } ])
# restore manner
# 1. default (without drop): restore the doc with _id not included on db
# 2. drop: drop and create new doc
# mongo db cmd
# 1. remove doc:        db.pictures.remove({'asset_did':'7903c55df26dd063a45bc7639482bd7a860d6f6a'})
# 2. remove collection: db.pictures.drop()
# 3. remove db:         db.dropDatabase()

restore_dir=mongodb-backup-2020-03-17-09-53-37
if [ -f $restore_dir.tar.gz ]
then
  sudo tar -xzvf ${restore_dir}.tar.gz
  #sudo mongorestore -u admin -p 123456 ./$restore_dir
  #sudo mongorestore -u admin -p 123456 ./$restore_dir --drop
  sudo rm -rf $restore_dir
else
  echo ${restore_dir}.tar.gz not exist
fi
