/* eslint-disable no-console */
require('dotenv').config();
const multibase = require('multibase');
const ForgeSDK = require('@arcblock/forge-sdk');
const Mcrypto = require('@arcblock/mcrypto');
const { fromJSON, fromRandom, fromSecretKey, fromAddress, WalletType  } = require('@arcblock/forge-wallet');
const { fromTokenToUnit, fromUnitToToken } = require('@arcblock/forge-util');
const { wallet, newsflashWallet, type } = require('../api/libs/auth');
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

(async () => {
  try {
    var res = null;
    var accountState = null;
    var accountBalance = null;
    var transferHash = null;
    
    const { state } = await ForgeSDK.getForgeState(
      {},
      { ignoreFields: ['state.protocols', /\.txConfig$/, /\.gas$/] }
    );
    
    /* Transfer some abt to issuer account on asset chain*/
    if(env.chainName === 'xenon'){
      const issuer_sk = '0x8eda2938de698bc6f316ca6bdd491ac41e9b1c82e64fd13db8438eee692f722e1d176e5176e0086e76fa04a89cc80f329428ab3f23b96d8681971ba87480246d';
      const issuer = fromSecretKey(issuer_sk, WalletType({ role: Mcrypto.types.RoleType.ROLE_ACCOUNT }));
      
      res = await getAccoutState(issuer.toAddress());
      if(res && res.getAccountState && res.getAccountState.state){
        accountState = res.getAccountState.state;
        console.log('issuer accountState=', accountState);
        accountBalance = parseFloat(fromUnitToToken(accountState.balance, state.token.decimal));
        console.log('issuer accountBalance=', accountBalance);
        if(accountBalance > 0){
          let transferValue = 0.000001;
          
          /*Transfer to abtworld default account*/
          /*
          transferHash = await ForgeSDK.sendTransferTx({
            tx: {
              itx: {
                to: wallet.address,
                value: fromTokenToUnit(transferValue, state.token.decimal),
              },
            },
            wallet: issuer,
          });
          console.log('Issuer account to abtworld account transferHash=', transferHash);
          */
          
          /*Transfer to hashnews account*/
          /*
          transferHash = await ForgeSDK.sendTransferTx({
            tx: {
              itx: {
                to: newsflashWallet.address,
                value: fromTokenToUnit(transferValue, state.token.decimal),
              },
            },
            wallet: issuer,
          });
          console.log('Issuer account to hashnews account transferHash=', transferHash);
          */
          
          /*Transfer to app owner account*/
          /*
          transferValue = 0.8;
          transferHash = await ForgeSDK.sendTransferTx({
            tx: {
              itx: {
                to: env.appOwnerAccount,
                value: fromTokenToUnit(transferValue, state.token.decimal),
              },
            },
            wallet: issuer,
          });
          console.log('Issuer account to app owner account transferHash=', transferHash);
          */
        }
      }
    }
    
    
    /* default app account */
    res = await getAccoutState(wallet.address);
    
    //console.log('default app getAccoutState res=', res);
    //console.log('default app getAccoutState state=', state);
    
    if(res && res.getAccountState && res.getAccountState.state){
      accountState = res.getAccountState.state;
      console.log('default app accountState=', accountState);
      accountBalance = parseFloat(fromUnitToToken(accountState.balance, state.token.decimal));
      console.log('default app accountBalance=', accountBalance);
      
      accountBalance = accountBalance.toFixed(6);
      if(accountBalance > 0){
        /*
        let transferValue = accountBalance;
        //let transferValue = 0.000001;
        transferHash = await ForgeSDK.sendTransferTx({
          tx: {
            itx: {
              to: process.env.APP_OWNER_ACCOUNT,
              value: fromTokenToUnit(transferValue, state.token.decimal),
            },
          },
          wallet: appWallet,
        });
        console.log('default app transferHash=', transferHash);
        */
      }else{
        console.log('Default app account balance is empty');
      }
    }
    
    /* newsflash app account */
    res = await getAccoutState(newsflashWallet.address);
    
    //console.log('newsflash app getAccoutState res=', res);
    //console.log('newsflash app getAccoutState state=', state);
    
    if(res && res.getAccountState && res.getAccountState.state){
      accountState = res.getAccountState.state;
      console.log('newsflash app accountState=', accountState);
      accountBalance = parseFloat(fromUnitToToken(accountState.balance, state.token.decimal));
      console.log('newsflash app accountBalance=', accountBalance);
      
      accountBalance = accountBalance.toFixed(6);
      if(accountBalance > 0){
        /*
        transferHash = await ForgeSDK.sendTransferTx({
          tx: {
            itx: {
              to: process.env.APP_OWNER_ACCOUNT,
              value: fromTokenToUnit(accountBalance, state.token.decimal),
            },
          },
          wallet: newsflashAppWallet,
        });
        console.log('newsflash app transferHash=', transferHash);
        */
      }else{
        console.log('newsflash app account balance is empty');
      }
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    console.error(err.errors);
    process.exit(1);
  }
})();
