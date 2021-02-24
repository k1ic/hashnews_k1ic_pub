/* eslint-disable no-console */
const moment = require('moment');
const ForgeSDK = require('@arcblock/forge-sdk');
const { toAddress } = require('@arcblock/did');
const { wallet } = require('../libs/auth');
const { 
  forgeTxValueSecureConvert,
  fetchForgeTransactions,
  fetchForgeTransactionsV2,
  fetchForgeTransactionsV3
} = require('../libs/transactions');
const env = require('../libs/env');
const { HashString } = require('../libs/crypto');
const { getNewsByAssetDid } = require('./newsflash');
const { getAssetGenesisHash } = require('../libs/assets');
const {
  getUserDidFragment
} = require('../libs/user');
const {
  newsflashDocLikeStatusGet
} = require('./newsflash');

module.exports = {
  init(app) {
    app.get('/api/payments', async (req, res) => {
      try {
        if(req.query){
          console.log('api.payments params=', req.query);
          const dapp_module = req.query.module;
          var module_para = null;
          
          switch(dapp_module){
            case 'picture':
              if(req.user){
                module_para = {user_did: req.user.did, asset_did: req.query.asset_did};
              }
              break;
            case 'article':
              module_para = {user_did: req.query.user_did, asset_did: req.query.asset_did};
              break;
            case 'newsflash':
              module_para = {news_type: req.query.news_type, udid: req.query.udid, udid_to_show: req.query.udid_to_show};
              break;
            default:
              break;
          }
            
          var tx = [];
          var final_tx = [];
          switch(dapp_module){
            case 'picture':
            case 'article':
              final_tx = await fetchForgeTransactions(dapp_module, module_para);
              break;
            case 'newsflash':
              /*on chain asset style v3 newsflash*/
              tx = await fetchForgeTransactionsV3(dapp_module, module_para, env.chainId);
              final_tx = await Promise.all(tx.map( async (e) => {
                var temp_tx = {};
                var memo = null;
                var hash = '';
                var author_did = '';
                
                try {
                  memo = JSON.parse(e.data.value);
                } catch (err) {
                }
                var local_time = moment(e.genesisTime).local().format('YY/MM/DD HH:mm:ss');
                //console.log('UTC=',e.genesisTime, 'local time=', local);
                
                temp_tx['loading'] = false;
                var doc = await getNewsByAssetDid(e.address);
                if(doc){
                  temp_tx['weights'] = doc.news_weights;
                  if(doc.state === 'chained'){
                    temp_tx['state'] = 'allowed';
                  }else{
                    temp_tx['state'] = 'prohibited';
                  }
                  hash = doc.news_hash;
                }else{
                  temp_tx['weights'] = 1;
                  temp_tx['state'] = 'allowed';
                  if(!hash || hash.length == 0){
                    hash = await getAssetGenesisHash(e.address, env.assetChainId);
                  }
                }
                
                if(memo){
                  author_did = (typeof(memo.para.udid) != "undefined")?memo.para.udid:'';
                }
                
                temp_tx['time'] = local_time;
                temp_tx['sender'] = author_did;
                temp_tx['hash'] = hash;
                temp_tx['href'] = env.chainHost.replace('/api', '/node/explorer/txs/')+hash;
                if(memo){
                  temp_tx['news_title'] = (typeof(memo.para.title) != "undefined")?memo.para.title:'';
                  temp_tx['news_content'] = (typeof(memo.para.content) != "undefined")?memo.para.content:'';
                  temp_tx['asset_did'] = e.address;
                  temp_tx['uname'] = (typeof(memo.para.uname) != "undefined")?memo.para.uname:'匿名';
                  temp_tx['uavatar'] = (typeof(memo.para.uavatar) != "undefined")?memo.para.uavatar:'';
                }else{
                  temp_tx['news_title'] = '';
                  temp_tx['news_content'] = '';
                  temp_tx['asset_did'] = e.address;
                  temp_tx['uname'] = '匿名';
                  temp_tx['uavatar'] = '';
                }
                if(author_did && author_did.length > 0){
                  var did_len = author_did.length;
                  temp_tx['title'] = temp_tx['uname']+'('+getUserDidFragment(author_did)+')';
                }else{
                  temp_tx['title'] = temp_tx['uname']
                }
                
                if(doc){
                  temp_tx['comment_min_rem'] = forgeTxValueSecureConvert(doc.remain_comment_minner_balance);
                  temp_tx['like_min_rem'] = forgeTxValueSecureConvert(doc.remain_like_minner_balance);
                  temp_tx['forward_min_rem'] = forgeTxValueSecureConvert(doc.remain_forward_minner_balance);
                  temp_tx['comment_cnt'] = doc.comment_counter;
                  temp_tx['like_cnt'] = doc.like_counter;
                  temp_tx['forward_cnt'] = doc.forward_counter;
                  temp_tx['comment_list'] = doc.comment_list;
                  temp_tx['like_list'] = doc.like_list;
                  temp_tx['forward_list'] = doc.forward_list;
                  if(module_para.udid && module_para.udid.length > 0){
                    temp_tx['like_status'] = newsflashDocLikeStatusGet(doc, module_para.udid);
                  }else{
                    temp_tx['like_status'] = false;
                  }
                }else{
                  temp_tx['comment_min_rem'] = 0;
                  temp_tx['like_min_rem'] = 0;
                  temp_tx['forward_min_rem'] = 0;
                  temp_tx['comment_cnt'] = 0;
                  temp_tx['like_cnt'] = 0;
                  temp_tx['forward_cnt'] = 0;
                  temp_tx['comment_list'] = [];
                  temp_tx['like_list'] = [];
                  temp_tx['forward_list'] = [];
                  temp_tx['like_status'] = false;
                }

                return temp_tx;
              }));
              
              //console.log('on chain asset style - final_tx=', final_tx);
              console.log('on chain asset style - final_tx.length=', final_tx.length);
              
              final_tx = final_tx.filter(function (e) { 
                return e.state === 'allowed';
              });
              //console.log('on chain asset style - after filter final_tx=', final_tx);
              console.log('on chain asset style - after filter final_tx.length=', final_tx.length);
            
              /*new style v2 newsflash*/
              tx = await fetchForgeTransactionsV2(dapp_module, module_para);
              var tx_style_v2 = await Promise.all(tx.map( async (e) => {
                var temp_tx = {};
                var memo = null;
                var asset_did = '';
                var author_did = '';
                
                try {
                  memo = JSON.parse(e.tx.itxJson.data.value);
                } catch (err) {
                }
                var local_time = moment(e.time).local().format('YY/MM/DD HH:mm:ss');
                //console.log('UTC=',e.time, 'local time=', local);
                
                temp_tx['loading'] = false;
                var doc = null;
                if(memo && typeof(memo.para.content) != "undefined"){
                  asset_did = HashString('sha1', memo.para.content);
                  //console.log('asset_did=',asset_did);
                  doc = await getNewsByAssetDid(asset_did);
                  if(doc && doc.state === 'chained'){
                    temp_tx['weights'] = doc.news_weights;
                    author_did = doc.author_did;
                    temp_tx['state'] = 'allowed';
                  }else{
                    temp_tx['weights'] = 1;
                    temp_tx['state'] = 'prohibited';
                  }
                }else{
                  temp_tx['weights'] = 1;
                  temp_tx['state'] = 'prohibited';
                }
                
                temp_tx['time'] = local_time;
                temp_tx['sender'] = author_did;
                temp_tx['hash'] = e.hash;
                temp_tx['href'] = env.chainHost.replace('/api', '/node/explorer/txs/')+e.hash;
                if(memo){
                  temp_tx['news_title'] = '';
                  temp_tx['news_content'] = (typeof(memo.para.content) != "undefined")?memo.para.content:'';
                  temp_tx['asset_did'] = asset_did;
                  temp_tx['uname'] = (typeof(memo.para.uname) != "undefined")?memo.para.uname:'匿名';
                  temp_tx['uavatar'] = '';
                }else{
                  temp_tx['news_title'] = '';
                  temp_tx['news_content'] = '';
                  temp_tx['asset_did'] = asset_did;
                  temp_tx['uname'] = '匿名';
                  temp_tx['uavatar'] = '';
                }
                if(author_did && author_did.length > 0){
                  var did_len = author_did.length;
                  temp_tx['title'] = temp_tx['uname'] + " - " + author_did.substring(0,4) + '***' + author_did.substring(did_len-4,did_len);
                }else{
                  temp_tx['title'] = temp_tx['uname']
                }
                
                if(doc){
                  temp_tx['comment_min_rem'] = forgeTxValueSecureConvert(doc.remain_comment_minner_balance);
                  temp_tx['like_min_rem'] = forgeTxValueSecureConvert(doc.remain_like_minner_balance);
                  temp_tx['forward_min_rem'] = forgeTxValueSecureConvert(doc.remain_forward_minner_balance);
                  temp_tx['comment_cnt'] = doc.comment_counter;
                  temp_tx['like_cnt'] = doc.like_counter;
                  temp_tx['forward_cnt'] = doc.forward_counter;
                  temp_tx['comment_list'] = doc.comment_list;
                  temp_tx['like_list'] = doc.like_list;
                  temp_tx['forward_list'] = doc.forward_list;
                  if(module_para.udid && module_para.udid.length > 0){
                    temp_tx['like_status'] = newsflashDocLikeStatusGet(doc, module_para.udid);
                  }else{
                    temp_tx['like_status'] = false;
                  }
                }else{
                  temp_tx['comment_min_rem'] = 0;
                  temp_tx['like_min_rem'] = 0;
                  temp_tx['forward_min_rem'] = 0;
                  temp_tx['comment_cnt'] = 0;
                  temp_tx['like_cnt'] = 0;
                  temp_tx['forward_cnt'] = 0;
                  temp_tx['comment_list'] = [];
                  temp_tx['like_list'] = [];
                  temp_tx['forward_list'] = [];
                  temp_tx['like_status'] = false;
                }
                
                return temp_tx;
              }));
              
              //console.log('style v2 - final_tx=', final_tx);
              console.log('style v2 - final_tx.length=', final_tx.length);
              
              tx_style_v2 = tx_style_v2.filter(function (e) { 
                return e.state === 'allowed';
              });
              //console.log('style v2 - after filter tx_style_v2=', tx_style_v2);
              console.log('style v2 - after filter tx_style_v2.length=', tx_style_v2.length);
              
              /*append v2 tx to final tx tail*/
              final_tx = final_tx.concat(tx_style_v2);
                
              /*old style newsflash */
              tx = await fetchForgeTransactions(dapp_module, module_para);
              var tx_style_v1 = tx.map(function( e ) {
                var temp_tx = {};
                var memo = null;
                try {
                  memo = JSON.parse(e.tx.itxJson.data.value);
                } catch (err) {
                }
                var local_time = moment(e.time).local().format('YY/MM/DD HH:mm:ss');
                //console.log('UTC=',e.time, 'local time=', local);
                temp_tx['loading'] = false;
                temp_tx['weights'] = 1;
                temp_tx['state'] = 'allowed';
                temp_tx['time'] = local_time;
                temp_tx['sender'] = e.sender;
                temp_tx['hash'] = e.hash;
                temp_tx['href'] = env.chainHost.replace('/api', '/node/explorer/txs/')+e.hash;
                if(memo){
                  temp_tx['news_title'] = '';
                  temp_tx['news_content'] = (typeof(memo.para.content) != "undefined")?memo.para.content:'';
                  temp_tx['asset_did'] = (typeof(memo.para.content) != "undefined")?HashString('sha1', memo.para.content):'';
                  temp_tx['uname'] = (typeof(memo.para.uname) != "undefined")?memo.para.uname:'匿名';
                  temp_tx['uavatar'] = '';
                }else{
                  temp_tx['news_title'] = '';
                  temp_tx['news_content'] = '';
                  temp_tx['asset_did'] = '';
                  temp_tx['uname'] = '匿名';
                  temp_tx['uavatar'] = '';
                }
                
                var did_len = e.sender.length;
                temp_tx['title'] = temp_tx['uname'] + " - " + e.sender.substring(0,4) + '***' + e.sender.substring(did_len-4,did_len);
                
                var doc = null;
                if(doc){
                  temp_tx['comment_min_rem'] = forgeTxValueSecureConvert(doc.remain_comment_minner_balance);
                  temp_tx['like_min_rem'] = forgeTxValueSecureConvert(doc.remain_like_minner_balance);
                  temp_tx['forward_min_rem'] = forgeTxValueSecureConvert(doc.remain_forward_minner_balance);
                  temp_tx['comment_cnt'] = doc.comment_counter;
                  temp_tx['like_cnt'] = doc.like_counter;
                  temp_tx['forward_cnt'] = doc.forward_counter;
                  temp_tx['comment_list'] = doc.comment_list;
                  temp_tx['like_list'] = doc.like_list;
                  temp_tx['forward_list'] = doc.forward_list;
                  if(module_para.udid && module_para.udid.length > 0){
                    temp_tx['like_status'] = newsflashDocLikeStatusGet(doc, module_para.udid);
                  }else{
                    temp_tx['like_status'] = false;
                  }
                }else{
                  temp_tx['comment_min_rem'] = 0;
                  temp_tx['like_min_rem'] = 0;
                  temp_tx['forward_min_rem'] = 0;
                  temp_tx['comment_cnt'] = 0;
                  temp_tx['like_cnt'] = 0;
                  temp_tx['forward_cnt'] = 0;
                  temp_tx['comment_list'] = [];
                  temp_tx['like_list'] = [];
                  temp_tx['forward_list'] = [];
                  temp_tx['like_status'] = false;
                }
                
                return temp_tx;
              });
              
              /*append tx style v1 to final tx tail*/
              final_tx = final_tx.concat(tx_style_v1);
              
              /*filter the final tx by udid_to_show*/
              const udid_to_show = module_para.udid_to_show;
              if(typeof(udid_to_show) != "undefined" && udid_to_show && udid_to_show.length > 0){
                final_tx = final_tx.filter(function (e) {
                  return (e.sender === udid_to_show);
                });
              }
              
              break;
            default:
              final_tx = tx;
              break;
          }
          
          if(final_tx && final_tx.length > 0){
            //console.log('api.payments.ok - final_tx', final_tx);
            console.log('api.payments.ok - final_tx.length', final_tx.length);
            final_tx = final_tx.slice(0, 499);
            //console.log('api.payments.ok - final_tx after slice', final_tx);
            console.log('api.payments.ok - final_tx.length after slice', final_tx.length);
            res.json(final_tx);
            return;
          }
        }
        
        console.log('api.payments.ok - empty tx');
        res.json(null);
      } catch (err) {
        console.error('api.payments.error', err);
        res.json(null);
      }
    });
  },
};
