#!/bin/bash
#sudo apt install mongodb
#sudo apt install graphicsmagick
yarn

#install patches
sudo cp -f ./patch/highlight/atom-one-dark.css ./node_modules/highlight.js/styles/
sudo cp -f ./patch/html2canvas/html2canvas.js ./node_modules/html2canvas/dist/

#install arcblock forge v1.0.13 for chain_node v1.0.0
#sudo rm -rf ./node_modules/@arcblock
#cd ../
#sudo cp -f ./abtworld/patch/arcblock/v1.0.13/abtworld_arcblock_node_modules_v1.0.13.tar.gz .
#sudo tar -xzf abtworld_arcblock_node_modules_v1.0.13.tar.gz
#sudo rm -f abtworld_arcblock_node_modules_v1.0.13.tar.gz
#cd abtworld

#chmod
sudo chmod 777 -R ./node_modules
