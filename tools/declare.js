/* eslint-disable no-console */
require('dotenv').config();
const mongoose = require('mongoose');

// eslint-disable-next-line import/no-extraneous-dependencies
const ForgeSDK = require('@arcblock/forge-sdk');
const Mcrypto = require('@arcblock/mcrypto');
const { fromJSON, fromRandom, fromSecretKey, WalletType } = require('@arcblock/forge-wallet');
const { wallet, newsflashWallet } = require('../api/libs/auth');
const env = require('../api/libs/env');
const { getDatachainList, forgeChainConnect } = require('../api/routes/datachains');

const appWallet = fromJSON(wallet);
const newsflashAppWallet = fromJSON(newsflashWallet);

const sleep = timeout => new Promise(resolve => setTimeout(resolve, timeout));

async function getAccoutState(accoutAddr, connId){
  var res = null;
  //console.log('getAccoutState accoutAddr=', accoutAddr, 'connId=', connId);
  
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
    }`, 
    { conn: connId }
  ); 
  return res;
}

(async () => {
  try {
    var res = null;
    
    if (!process.env.MONGO_URI) {
      throw new Error('Cannot start application without process.env.MONGO_URI');
    }else{
      console.log('MONGO_URI=', process.env.MONGO_URI);
    }
    
    // Connect to database
    let isConnectedBefore = false;
    mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, autoReconnect: true });
    mongoose.connection.on('error', console.error.bind(console, 'MongoDB connection error:'));
    mongoose.connection.on('disconnected', () => {
      console.log('Lost MongoDB connection...');
      if (!isConnectedBefore) {
        mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, autoReconnect: true });
      }
    });
    mongoose.connection.on('connected', () => {
      isConnectedBefore = true;
      console.log('Connection established to MongoDB');
    });
    mongoose.connection.on('reconnected', () => {
      console.log('Reconnected to MongoDB');
    });
    
    // wait database conection
    while(1){
      if(isConnectedBefore){
        console.log('Database connected');
        break;
      }else{
        console.log('Database connecting...');
        await sleep(1000);
      }
    }
    
    /*declare account on app default chain*/
    if(env.chainName === 'xenon'){
      /*1. Asset chain need restricted declare with another account multi-sing
        2. The account need some ABT on account
        3. Example: https://github.com/ArcBlock/forge-js/blob/master/forge/graphql-client/examples/declare_restricted.js
       */
      console.log('Asset chain accout restricted declare',  env.chainHost);
      const issuer_sk = '0x8eda2938de698bc6f316ca6bdd491ac41e9b1c82e64fd13db8438eee692f722e1d176e5176e0086e76fa04a89cc80f329428ab3f23b96d8681971ba87480246d';
      const issuer = fromSecretKey(issuer_sk, WalletType({ role: Mcrypto.types.RoleType.ROLE_ACCOUNT }));
      console.log(issuer.toJSON());
      const endpoint = env.chainHost.replace('/api', '');
      console.log('issuer', `${endpoint}/node/explorer/accounts/${issuer.toAddress()}`);
      
      // Sign and then send: sendDeclareTx - default
      var tx1;
      var tx2;
      res = await getAccoutState(wallet.address, env.chainId);
      if(!res || !res.getAccountState || !res.getAccountState.state){
        console.log('abtworld account not exist on default chain',  env.chainHost);
        
        tx1 = await ForgeSDK.prepareDeclare({
          issuer: issuer.toAddress(),
          moniker: 'abtworld',
          wallet: appWallet,
        });
        tx2 = await ForgeSDK.finalizeDeclare({
          tx: tx1,
          wallet: issuer,
        });
        res = await ForgeSDK.sendDeclareTx({ tx: tx2, wallet: issuer });
        console.log('appWallet', `${endpoint}/node/explorer/accounts/${appWallet.toAddress()}`);
        console.log('tx', `${endpoint}/node/explorer/txs/${res}`);
      }else{
        console.log('abtworld account already on default chain',  env.chainHost);
      }
      
      // Sign and then send: sendDeclareTx - hashnews
      res = await getAccoutState(newsflashWallet.address, env.chainId);
      if(!res || !res.getAccountState || !res.getAccountState.state){
        console.log('hashnews account not exist on default chain',  env.chainHost);

        tx1 = await ForgeSDK.prepareDeclare({
          issuer: issuer.toAddress(),
          moniker: 'hashnews',
          wallet: newsflashAppWallet,
        });
        tx2 = await ForgeSDK.finalizeDeclare({
          tx: tx1,
          wallet: issuer,
        });
        res = await ForgeSDK.sendDeclareTx({ tx: tx2, wallet: issuer });
     
        console.log('newsflashAppWallet', `${endpoint}/node/explorer/accounts/${newsflashAppWallet.toAddress()}`);
        console.log('tx', `${endpoint}/node/explorer/txs/${res}`);
      }else{
        console.log('hashnews account already on default chain',  env.chainHost);
      }      
    }else{
      res = await getAccoutState(wallet.address, env.chainId);
      if(!res || !res.getAccountState || !res.getAccountState.state){
        console.log('abtworld account not exist on default chain',  env.chainHost);
      
        res = await ForgeSDK.sendDeclareTx({
            tx: {
              itx: {
                moniker: 'abtworld',
              },
            },
            wallet: appWallet,
          },
          { conn: env.chainId }
        );
      
        console.log('abtworld account declared on default chain',  env.chainHost);
      }else{
        console.log('abtworld account already on default chain',  env.chainHost);
      }
      res = await getAccoutState(newsflashWallet.address, env.chainId);
      if(!res || !res.getAccountState || !res.getAccountState.state){
        console.log('hashnews account not exist on default chain',  env.chainHost);
        res = await ForgeSDK.sendDeclareTx({
            tx: {
              itx: {
                moniker: 'hashnews',
              },
            },
            wallet: newsflashAppWallet,
          },
          { conn: env.chainId }
        );

        console.log('hashnews account declared on default chain',  env.chainHost);
      }else{
        console.log('hashnews account already on default chain',  env.chainHost);
      }
    }
    
    /*declare accout on app data chain.*/
    var dataChainList = await getDatachainList();
    /*filter out some chain node which need restricted declare */
    dataChainList = dataChainList.filter(function (e) {
      return (e.name != 'xenon');
    });
    for(var i=0;i<dataChainList.length;i++){
      /*connect to chain*/
      await forgeChainConnect(dataChainList[i].chain_id);
      
      /*declare default account*/
      res = await getAccoutState(wallet.address, dataChainList[i].chain_id);
      if(!res || !res.getAccountState || !res.getAccountState.state){
        res = await ForgeSDK.sendDeclareTx({
            tx: {
              itx: {
                moniker: 'abtworld',
              },
            },
            wallet: appWallet,
          },
          { conn: dataChainList[i].chain_id}
        );

        console.log('abtworld account declared on',  dataChainList[i].chain_host);
      }else{
        console.log('abtworld account already on',  dataChainList[i].chain_host);
      }
      
      /*declare hashnews account*/
      res = await getAccoutState(newsflashWallet.address, dataChainList[i].chain_id);
      if(!res || !res.getAccountState || !res.getAccountState.state){
        res = await ForgeSDK.sendDeclareTx({
            tx: {
              itx: {
                moniker: 'hashnews',
              },
            },
            wallet: newsflashAppWallet,
          },
          { conn: dataChainList[i].chain_id}
        );

        console.log('hashnews account declared on',  dataChainList[i].chain_host);
      }else{
        console.log('hashnews account already on',  dataChainList[i].chain_host);
      }
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    console.error(err.errors);
    process.exit(1);
  }
})();
