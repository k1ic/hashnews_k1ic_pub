#!/bin/bash

while [ 1 ]
do
  echo 'start data sync'
  node tools/dapp_db_sync.js
  echo 'end data sync'
  sleep 120
done

#node tools/dapp_db_sync.js > ~/abtworld/dapp_sync.log 2>&1 &
