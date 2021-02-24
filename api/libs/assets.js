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
const { Datachain, Newsflash } = require('../models');
const { forgeChainConnect } = require('../routes/datachains');
const {
  hashnews_enc_key,
  aesEncrypt,
  aesDecrypt
} = require('./crypto');

const env = require('./env');

const sleep = timeout => new Promise(resolve => setTimeout(resolve, timeout));

const appWallet = fromJSON(wallet);
const newsflashAppWallet = fromJSON(newsflashWallet);

//const appWallet = fromSecretKey(process.env.APP_SK, type);
//const newsflashAppWallet = fromSecretKey(process.env.APP_NEWSFLASH_SK, type);

//const appWallet = ForgeSDK.Wallet.fromJSON(wallet);
//const newsflashAppWallet = ForgeSDK.Wallet.fromJSON(newsflashWallet);

const getNewsFlash = async cdid => {
  var doc = await Newsflash.findOne({ content_did: cdid });
  return doc;
};

const genNewsFlashAsset = async (cdid, connId) => {
  const news = await getNewsFlash(cdid);
  if(!news){
    return null;
  }
  var newsflash_tx_memo = {};
  var para_obj = null;
  var news_content = news.news_content;
  if(news.news_type === 'test2' || news.news_type === 'articles'){
    news_content = aesEncrypt(news.news_content, hashnews_enc_key);
  }
  
  newsflash_tx_memo['module'] = 'newsflash';
  para_obj = {
   type: news.news_type, 
   uname: news.author_name, 
   udid: news.author_did, 
   title: news.news_title, 
   content: news_content,
   origin:  news.news_origin,
   dapp_name: news.news_create_from_name,
   dapp_link: news.news_create_from_link,
   uavatar: news.author_avatar, 
   images: news.news_images};
  newsflash_tx_memo['para'] = para_obj;
  
  //console.log('genNewsFlashAsset newsflash_tx_memo=', JSON.stringify(newsflash_tx_memo));
  console.log('genNewsFlashAsset newsflash_tx_memo.length=', JSON.stringify(newsflash_tx_memo).length);

  const asset = {
    moniker: `资讯${cdid}`,
    readonly: true,
    transferrable: true,
    issuer: newsflashAppWallet.toAddress(),
    parent: '',
    data: {
      typeUrl: 'json',
      value: newsflash_tx_memo,
    },
  };

  asset.address = ForgeSDK.Util.toAssetAddress(asset, 
    newsflashAppWallet.toAddress(), 
    { conn: connId }
  );
  console.log('genNewsFlashAsset new asset.address=', asset.address);

  news.asset_did = asset.address;
  await news.save();

  return asset;
};

const waitAndGetAssetTxHash = async (hash, connId) => {
  var res = null;
  var i = 0;
  if (typeof(hash) == "undefined" || !hash || hash.length == 0) {
    return null;
  }
  
  try {
    for(i=0;i<150;i++){
      res = await ForgeSDK.doRawQuery(`{
          getTx(hash: "${hash}") {
            code
            info {
              tx {
                from
                itxJson
              }
            }
          }
        }`, 
        { conn: connId }
      );
      if(res && res.getTx && res.getTx.code === 'OK' && res.getTx.info){
        break;
      }else{
        await sleep(100);
      }
    }
    console.log('waitAndGetAssetTxHash counter', i);    
  } catch (err) {
    console.error('waitAndGetAssetTxHash error', err);
  }
  
  return res;
}

/*create newsflash asset on chain*/
const createNewsflahAsset = async (cdid, connId) => {
  var result = false;
  var hash = null;
  
  //connect to chain
  await forgeChainConnect(connId);
  
  const asset = await genNewsFlashAsset(cdid, connId);
  //console.log('asset=', asset);
  if(asset){
    // Create asset if not exists
    var { state } = await ForgeSDK.getAssetState(
      { address: asset.address }, 
      { conn: connId }
    );
    if (state) {
      console.log('asset exist', asset.address);
      //console.log('asset state=', state);
      result = false;
    } else {
      //console.log('asset not exist', asset.address);
      //console.log('newsflashAppWallet = ', newsflashAppWallet);
      //console.log('newsflashAppWallet.toAddress() = ', newsflashAppWallet.toAddress());
        
      hash = await ForgeSDK.sendCreateAssetTx(
        { tx: { itx: asset }, wallet: newsflashAppWallet}, 
        { conn: connId }
      );
      //console.log('asset created', { hash });

      /*wait asset created*/
      const res = await waitAndGetAssetTxHash(hash, connId);
      if(res && res.getTx && res.getTx.code === 'OK' && res.getTx.info){
        //const tx_memo = JSON.parse(res.getTx.info.tx.itxJson.data.value);
        //console.log('tx_memo = ', tx_memo);
      }
      var { state } = await ForgeSDK.getAssetState(
        { address: asset.address }, 
        { conn: connId }
      );
      
      //console.log('asset created hash=', hash, 'state=', state);
      console.log('asset created hash=', hash);
      result = true;
    } 
  }else{
    console.log('invalid asset object');
    result = false;
  }
  
  return hash;
}

const getAssetGenesisHash = async (asset_addr, connId) => {
  var res = null;
  var hash = null;
  
  //connect to chain
  await forgeChainConnect(connId);
  
  //console.log('getAssetGenesisHash asset_addr=', asset_addr);
  
  res = await ForgeSDK.doRawQuery(`{
      getAssetState(address: "${asset_addr}") {
        code
        state {
          context {
            genesisTx {
              hash
            }
          }
        }
      }
    }`,
    { conn: connId }
  ); 
  
  if(res && res.getAssetState 
    && res.getAssetState.code === 'OK' 
    && res.getAssetState.state
    && res.getAssetState.state.context
    && res.getAssetState.state.context.genesisTx
    && res.getAssetState.state.context.genesisTx.hash
    && res.getAssetState.state.context.genesisTx.hash.length > 0){
    hash = res.getAssetState.state.context.genesisTx.hash;
  }
  
  return hash;
}

const getAssetMoniker = async (asset_addr, connId) => {
  var res = null;
  var moniker = null;
  
  //connect to chain
  await forgeChainConnect(connId);
  
  //console.log('getAssetMoniker asset_addr=', asset_addr);
  
  res = await ForgeSDK.doRawQuery(`{
      getAssetState(address: "${asset_addr}") {
        code
        state {
          moniker
        }
      }
    }`,
    { conn: connId }
  ); 
  
  if(res && res.getAssetState 
    && res.getAssetState.code === 'OK' 
    && res.getAssetState.state){
    moniker = res.getAssetState.state.moniker;
  }
  
  return moniker;
}


const listAssets= async (ower_did, pages, connId) => {
  var res = null;
  var assets = null;
  
  console.log('listAssets ower_did=', ower_did, 'pages=', pages, 'connId=', connId);
  
  //connect to chain
  await forgeChainConnect(connId);
  
  res = await ForgeSDK.doRawQuery(`{
      listAssets(ownerAddress: "${ower_did}", paging: {size: ${pages}}) {
        assets {
          genesisTime
          data {
            typeUrl
            value
          }
          address
        }
        code
      }
    }`,
    { conn: connId }
  ); 
  
  if(res && res.listAssets && res.listAssets.code === 'OK' && res.listAssets.assets && res.listAssets.assets.length > 0){
    assets = res.listAssets.assets;
  }
  
  return assets;
}

module.exports = {
  createNewsflahAsset,
  getAssetGenesisHash,
  getAssetMoniker,
  listAssets,
};
