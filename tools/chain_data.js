/* eslint-disable no-console */
require('dotenv').config();
const multibase = require('multibase');
const ForgeSDK = require('@arcblock/forge-sdk');
const { fromJSON } = require('@arcblock/forge-wallet');
const { fromTokenToUnit, fromUnitToToken } = require('@arcblock/forge-util');
const { fromAddress } = require('@arcblock/forge-wallet');
const { fromSecretKey, WalletType } = require('@arcblock/forge-wallet');
const { wallet, newsflashWallet, type } = require('../api/libs/auth');
const { Base64ImageDataToFile } = require('../api/libs/image');
const env = require('../api/libs/env');
const sleep = timeout => new Promise(resolve => setTimeout(resolve, timeout));

const appWallet = fromJSON(wallet);
const newsflashAppWallet = fromJSON(newsflashWallet);

async function getAccoutState(accoutAddr){
  var res = null;
  console.log('getAccoutState accoutAddr=', accoutAddr);
  
  res = await ForgeSDK.doRawQuery(`{
    getAccountState(address: "${accoutAddr}") {
      code
      state {
        address
        balance
        moniker
        pk
      }
    }
  }`); 
  return res;
}

async function getForgeState(){
  var res = null;
  var state = null;
  console.log('getForgeState');
  
  res = await ForgeSDK.doRawQuery(`{
    getForgeState {
      state {
        token {
          icon
          symbol
          decimal
          description
          inflationRate
          initialSupply
          name
          totalSupply
          unit
        }
      }
      code
    }
  }`);
  
  if(res && res.getForgeState && res.getForgeState.code === 'OK' && res.getForgeState.state){
    state = res.getForgeState.state;
  }
   
  return state;
}

(async () => {
  try {
    const forgeState = await getForgeState();
    if (typeof(forgeState.token.icon) != "undefined" && forgeState.token.icon && forgeState.token.icon.length > 0) {
      Base64ImageDataToFile(forgeState.token.icon, __dirname+'/../src/static/images/hashnews/'+forgeState.token.symbol+'.png');
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    console.error(err.errors);
    process.exit(1);
  }
})();
