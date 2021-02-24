/* eslint-disable no-console */
require('dotenv').config();
const multibase = require('multibase');
const mongoose = require('mongoose');
const ForgeSDK = require('@arcblock/forge-sdk');
const { fromJSON } = require('@arcblock/forge-wallet');
const { fromTokenToUnit, fromUnitToToken } = require('@arcblock/forge-util');
const { fromAddress } = require('@arcblock/forge-wallet');
const { fromSecretKey, WalletType } = require('@arcblock/forge-wallet');

const { wallet, newsflashWallet, type } = require('./auth');
const env = require('./env');

const sleep = timeout => new Promise(resolve => setTimeout(resolve, timeout));

const getUserDidFragment = userDid => {
  if (typeof(userDid) == "undefined" || !userDid || userDid.length == 0) {
    return '';
  }
  
  const did_len = userDid.length;
  const did_fragment = userDid.substring(0,4) + '*' + userDid.substring(did_len-4,did_len);
  //console.log('getUserDidFragment did_fragment=',did_fragment);
  
  return did_fragment;
};

const getMonikerFragment = moniker => {
  if (typeof(moniker) == "undefined" || !moniker || moniker.length == 0) {
    return '';
  }
  
  const moniker_len = moniker.length;
  var moniker_fragment = '';
  if(moniker_len > 7){
    moniker_fragment = moniker.substring(0,3) + '*' + moniker.substring(moniker_len-3, moniker_len);
  }else{
    moniker_fragment = moniker;
  }
  
  return moniker_fragment;
};

module.exports = {
  getUserDidFragment,
  getMonikerFragment,
};
