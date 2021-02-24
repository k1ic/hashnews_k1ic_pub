#!/bin/bash
cd ~/tbawool/tbawool
git pull
cd ~/tbawool
for((i=1;i<=12;i++));
do
let tbawoolport=3030;
let tbawoolport+=$i;
echo $tbawoolport
cd tbawool${tbawoolport}
pwd
cp -f ../tbawool/package.json ./
yarn
cp -f ../cmn_src/atom-one-dark.css ./node_modules/highlight.js/styles/
cp -rf ../tbawool/src ./
cp -rf ../tbawool/api ./
yarn build 
cd ../
done
