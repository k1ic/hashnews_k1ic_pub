#!/bin/bash
cp -f /home/ftp/public/payment.tar.gz ./src/static/images/
cd ./src/static/images/
sudo rm -rf payment
sudo tar -xzvf payment.tar.gz
sudo chmod 777 -R payment
sudo rm -f payment.tar.gz
cd ../../../
cp -f /home/ftp/public/asset_pic.js ./src/libs/
sudo chmod 777 ./src/libs/asset_pic.js
rm -f /home/ftp/public/payment.tar.gz
rm -f /home/ftp/public/asset_pic.js

