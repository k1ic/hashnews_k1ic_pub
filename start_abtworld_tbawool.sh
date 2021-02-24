#!/bin/bash
# start abtworld
sudo killall node
yarn start

# disable port redirect
# sudo iptables -t nat -D PREROUTING 1
# sudo iptables -t nat -D PREROUTING 2
# sudo iptables -t nat -D PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 3030

# start nginx
sudo killall nginx
sudo cp -f ./nginx/nginx.conf /usr/local/nginx/conf/
sudo /usr/local/nginx/sbin/nginx -c /usr/local/nginx/conf/nginx.conf

#start tbawool
#cd ~/tbawool
#for((i=1;i<=12;i++));
#do
#let tbawoolport=3030;
#let tbawoolport+=$i;
#echo $tbawoolport
#cd tbawool${tbawoolport}
#pwd
#yarn start
#cd ../
#done
#cd ~/charging-block
#yarn start
#cd ~/abtworld

#start dapp data sync backgroud task
#sudo killall dapp_sync.sh
#sudo nohup sh ./dapp_sync.sh > /dev/null 2>&1 &
sudo nohup node tools/dapp_db_sync.js > ~/abtworld/dapp_sync.log 2>&1 &
#./dapp_sync.sh
