/* eslint-disable no-console */
require('dotenv').config();

const base64 = require('base64-url');
const ForgeSDK = require('@arcblock/forge-sdk');
const { fromJSON } = require('@arcblock/forge-wallet');
const { fromUnitToToken, fromTokenToUnit } = require('@arcblock/forge-util');
const { fromSecretKey, WalletType } = require('@arcblock/forge-wallet');
const { types } = require('@arcblock/mcrypto');

const { wallet } = require('../api/libs/auth');
const AssetPicList = require('../src/libs/asset_pic');
const env = require('../api/libs/env');

const sleep = timeout => new Promise(resolve => setTimeout(resolve, timeout));

const startTime = "2019-09-24 00:00:00";
var state;
var value;
var forge_token;
var app_account_balance = 0;
var app_account_rec_tx = null;
var assert_account_rec_tx = null;

async function getForgeState() {
  try {
    const res = await ForgeSDK.doRawQuery(`{
      getForgeState {
        state {
          token {
            decimal
            symbol
          }
        }
      }
    }`);

    if(res && res.getForgeState && res.getForgeState.state){
      return res.getForgeState.state;
    }
  } catch (err) {
    console.error(err);
    console.error(err.errors);
  }

  return null;
}

async function getAccountState(strAccount) {
  //console.log('getAccountState account', strAccount);
  try {
    const res = await ForgeSDK.doRawQuery(`{
      getAccountState(address: "${strAccount}") {
      		code
	    			state {
      			 address
		  					 balance
		  					 moniker
		  					 pk
     		 }
	  		 }
    }`);

			 //console.log('getAccountState result', res);
    if(res && res.getAccountState && res.getAccountState.state){
	  		 return res.getAccountState.state;
    }
  } catch (err) {
    console.error(err);
    console.error(err.errors);
  }

  return null;
}

async function getAppAccountRxTransactions() {
  try {
    const res = await ForgeSDK.doRawQuery(`{
      listTransactions(addressFilter: {direction: ONE_WAY, receiver: "${wallet.address}"}, typeFilter: {types: "transfer"}, paging: {size: 10000}, timeFilter: {startDateTime: "${startTime}"}) {
        code
        transactions {
          tx {
            itx {
              ... on TransferTx {
                value
                data {
                  value
                }
              }
            }
          }
        }
	     }
    }`);

    if(res && res.listTransactions) {
      return res.listTransactions;
    }
  } catch (err) {
    console.error(err);
    console.error(err.errors);
  }

  return null;
}

async function getAssetOwnerAccountRxTransactions(strOwnerAccount) {
	 if(!strOwnerAccount) {
    return null;
	 }
	 
  try {
    const res = await ForgeSDK.doRawQuery(`{
      listTransactions(addressFilter: {direction: ONE_WAY, sender: "${wallet.address}", receiver: "${strOwnerAccount}"}, typeFilter: {types: "transfer"}, paging: {size: 10000}, timeFilter: {startDateTime: "${startTime}"}) {
        code
        transactions {
          tx {
            itx {
              ... on TransferTx {
                value
                data {
                  value
                }
              }
            }
          }
        }
	     }
    }`);

    if(res && res.listTransactions){
      return res.listTransactions;
    }
  } catch (err) {
    console.error(err);
    console.error(err.errors);
  }

  return null;
}


console.log('app wallet:', wallet);
//console.log(AssetPicList);

if (env.chainHost) {
  console.log('Connect to chain host', env.chainHost);
  ForgeSDK.connect(env.chainHost, { chainId: env.chainId, name: env.chainId, default: true });
  if (env.assetChainHost) {
  	 console.log('Connect to asset chain host', env.assetChainHost);
    ForgeSDK.connect(env.assetChainHost, { chainId: env.assetChainId, name: env.assetChainId });
  }
}else{
  console.log('chainHost not define');
  process.exit(0);
}

(async () => {
  try {
    //forge state
	   state = await getForgeState();
    if(state){
      forge_token = state.token;
      console.log('forge token:', forge_token);
    }else{
      console.log('Invalid forge state');
      process.exit(0);
	   }
	
    while(true) {
				  //app account state
			   state = await getAccountState(wallet.address);
		    if(state){
		      app_account_balance = parseFloat(fromUnitToToken(state.balance, forge_token.decimal));
		      console.log('app account balance:', String(app_account_balance), forge_token.symbol, 'from', startTime);
		    }else{
		      console.log('Invalid app state');
		    }
		
	     //app account all receive tx
	     app_account_rec_tx = await getAppAccountRxTransactions();
	     if(app_account_rec_tx && app_account_rec_tx.code === 'OK' && app_account_rec_tx.transactions && app_account_rec_tx.transactions.length >= 1){
		      console.log('app account receive tx count:', app_account_rec_tx.transactions.length, 'from', startTime);
	     }else{
		      console.log('App account not receive tx');
        await sleep(5000);
		      continue;
	     }

      for (i = 0; i < AssetPicList.length; i++) {
	   	   //console.log('account:', AssetPicList[i].owner_did.replace(/^did:abt:/, ''));
		      //console.log('memo:', AssetPicList[i].asset_did);
		      console.log('loop counter:', i);

		      state = await getAccountState(AssetPicList[i].owner_did.replace(/^did:abt:/, ''));
		      if(state){
		 	      //console.log('address', state.address);
			       //console.log('pk', state.pk);
		      }else{
		        console.log('asset account not exist', AssetPicList[i].owner_did);
		        continue;
		      }

								//assert account receive tx from app account
		 	    assert_account_rec_tx = await getAssetOwnerAccountRxTransactions(AssetPicList[i].owner_did.replace(/^did:abt:/, ''));
		 	    if(!assert_account_rec_tx || assert_account_rec_tx.code != 'OK'){
		 	      console.log('asset account get tx failure', AssetPicList[i].owner_did);
		        continue;
		 	    }
		 	    if(assert_account_rec_tx.transactions && assert_account_rec_tx.transactions.length >= 1) {
									 console.log('asset account', AssetPicList[i].owner_did, 'receive tx count:', assert_account_rec_tx.transactions.length, 'from', startTime);
		 	    }
      }

	     await sleep(5000);
	   }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    console.error(err.errors);
    process.exit(1);
  }
})();

