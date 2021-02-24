require('dotenv').config();
const mongoose = require('mongoose');
const ForgeSDK = require('@arcblock/forge-sdk');
const { fromJSON } = require('@arcblock/forge-wallet');
const { fromTokenToUnit, fromUnitToToken } = require('@arcblock/forge-util');
const { fromAddress } = require('@arcblock/forge-wallet');
const { fromSecretKey, WalletType } = require('@arcblock/forge-wallet');

const env = require('../api/libs/env');
const { Picture, Newsflash } = require('../api/models');
const { getDatachainList } = require('../api/routes/datachains');
const AssetPicList = require('../src/libs/asset_pic');
const { HashString, hashnews_enc_key, aesEncrypt, aesDecrypt } = require('../api/libs/crypto');
const {
  forgeTxValueSecureConvert,
  fetchForgeTransactions,
  fetchForgeTransactionsV2,
  fetchForgeTransactionsV3,
} = require('../api/libs/transactions');
const { listAssets } = require('../api/libs/assets');
const { utcToLocalTime } = require('../api/libs/time');
const { getUserDidFragment } = require('../api/libs/user');
const { wallet, newsflashWallet, type } = require('../api/libs/auth');
const { getAssetGenesisHash } = require('../api/libs/assets');

const newsflashAppWallet = fromJSON(newsflashWallet);
const sleep = timeout => new Promise(resolve => setTimeout(resolve, timeout));

const newsflashBlockAssetList = [
  'zjdyAw68PFnezMYDZYb5tS6Mx9SkXy4a6s1r',
  'zje1cH1SDVe8zkd8R8PzFjgXrkuw93RgdXze',
  'zjduEhpusean1TESEij891DgfvLSdmsgFca4',
  'zjdpgxPuyXFY9siTn8rNLBeCg43snz2Ncr9v',
  'zjdzA9n2L9hth3jwrne45BoAjRo6AvVeHwrN',
];

async function newsflashRemoveAssets() {
  for (var asset_did of newsflashBlockAssetList) {
    console.log('newsflashRemoveAssets check to remove ', asset_did);
    var doc = await Newsflash.findOne({ asset_did: asset_did });
    if (doc) {
      console.log('newsflashRemoveAssets removed doc.asset_did=', doc.asset_did);
      await doc.remove();
    } else {
      console.log('newsflashRemoveAssets asset_did', asset_did, 'not found');
    }
  }
}

async function newsflashCleanDeadNews() {
  var new_docs = [];
  var found = 0;

  Newsflash.find()
    .byState('commit')
    .exec(function(err, docs) {
      if (docs && docs.length > 0) {
        console.log('newsflashCleanDeadNews Found', docs.length, 'docs');
        new_docs = docs;
      } else {
        console.log('newsflashCleanDeadNews doc not found!');
      }
      found = 1;
    });

  /*wait found result*/
  var wait_counter = 0;
  while (!found) {
    await sleep(1);
    wait_counter++;
    if (wait_counter > 15000) {
      break;
    }
  }

  console.log('newsflashCleanDeadNews wait counter', wait_counter);

  if (new_docs.length > 0) {
    for (var i = 0; i < new_docs.length; i++) {
      console.log('newsflashCleanDeadNews clean doc asset_did', new_docs[i].asset_did);
      await new_docs[i].remove();
    }
  }

  return;
}

function newsflashAssetDidGen(cdid, tx_memo) {
  const asset = {
    moniker: `hash_news_${cdid}`,
    readonly: true,
    transferrable: true,
    issuer: newsflashAppWallet.toAddress(),
    parent: '',
    data: {
      typeUrl: 'json',
      value: tx_memo,
    },
  };

  asset.address = ForgeSDK.Util.toAssetAddress(asset, newsflashAppWallet.toAddress());

  return asset.address;
}

async function fetchForgeAssetTransactions(module, module_para, connId, asset_addr, asset_size) {
  var tx = [];
  var transactions = [];

  if (typeof module == 'undefined' || !module) {
    return [];
  }

  console.log('fetchForgeAssetTransactions module=', module, 'para=', module_para);

  switch (module) {
    case 'picture':
      tx = fetchForgeTransactions(module, module_para);
      break;
    case 'newsflash':
      if (typeof module_para == 'undefined' || !module_para) {
        return [];
      }
      const news_type = module_para.news_type;
      if (typeof news_type == 'undefined' || !news_type || news_type === 'undefined') {
        return [];
      }
      console.log('fetchForgeAssetTransactions newsflash type=', news_type);

      tx = await listAssets(asset_addr, asset_size, connId);
      //console.log('tx value', tx);
      //console.log('tx array number', tx.length);

      if (tx && tx.length >= 1) {
        console.log('fetchForgeAssetTransactions - tx.length', tx.length);

        const filter_tx = tx.filter(function(e) {
          if (e.data) {
            var memo = null;
            try {
              memo = JSON.parse(e.data.value);
            } catch (err) {}
            if (
              memo &&
              typeof memo.module != 'undefined' &&
              typeof memo.para != 'undefined' &&
              typeof memo.para.type != 'undefined'
            ) {
              if (news_type === 'all') {
                return memo.module === module;
              } else {
                return memo.module === module && memo.para.type === news_type;
              }
            } else {
              return 0;
            }
          } else {
            return 0;
          }
        });
        tx = filter_tx;

        //console.log('fetchForgeAssetTransactions -  newsflash filter tx', tx);
        console.log('fetchForgeAssetTransactions - newsflash filter tx.length', tx.length);
      }
      break;
    default:
      break;
  }

  return tx;
}

async function pictureDappDbSync() {
  console.log('pictureDappDbSync');
}

async function newsflashDappDbSync(asset_addr, asset_size) {
  console.log('newsflashDappDbSync');

  const dapp_module = 'newsflash';
  const module_para = { news_type: 'all' };
  var tx = [];

  /*clean dead news*/
  //await newsflashCleanDeadNews();

  /*V1 style newsflash*/
  //tx = await fetchForgeTransactions(dapp_module, module_para);
  //if(tx && tx.length > 0){
  //  await Promise.all(tx.map( async (e) => {
  //    try {
  //      var memo = JSON.parse(e.tx.itxJson.data.value);
  //      if(memo){
  //        const cdid = HashString('sha1', memo.para.content);
  //        const asset_did = newsflashAssetDidGen(cdid, memo);
  //        const asset_local_time = utcToLocalTime(e.time);
  //        var author_name = '';
  //        if(typeof(memo.para.uname) != "undefined" && memo.para.uname && memo.para.uname.length > 0){
  //          author_name = memo.para.uname;
  //        }else{
  //          author_name = '匿名';
  //        }
  //        var news_title = '';
  //        if(typeof(memo.para.title) != "undefined" && memo.para.title && memo.para.title.length > 0){
  //          news_title = memo.para.title;
  //        }else{
  //          news_title = '';
  //        }

  //console.log('newsflashDappDbSync V1 asset_did=', asset_did);
  //        var doc = await Newsflash.findOne({ news_content: memo.para.content });
  //        if(doc){
  //          console.log('newsflashDappDbSync V1 update doc item content=', doc.news_content.substring(0,10));

  /*update exist doc*/
  //          doc.asset_did = asset_did;
  //          doc.content_did = cdid;
  //          doc.author_did = e.sender;
  //          doc.author_name = author_name;
  //          doc.news_hash = e.hash;
  //          doc.news_time = asset_local_time;
  //          doc.news_type = memo.para.type;
  //          doc.news_title = news_title;
  //          doc.news_content = memo.para.content;
  //          doc.hash_href[0] = env.chainHost.replace('/api', '/node/explorer/txs/')+e.hash;
  //          doc.data_chain_nodes[0] = {name: env.chainName, chain_host: env.chainHost, chain_id: env.chainId};
  //          doc.markModified('data_chain_nodes');
  //          await doc.save();
  //        }else{
  /*create new doc*/
  //          var new_doc = new Newsflash({
  //            data_chain_nodes: [{name: env.chainName, chain_host: env.chainHost, chain_id: env.chainId}],
  //            asset_did: asset_did,
  //            content_did: cdid,
  //            author_did: e.sender,
  //            author_name: author_name,
  //            author_avatar: '',
  //            news_hash: e.hash,
  //            news_time: asset_local_time,
  //            news_type: memo.para.type,
  //            news_title: news_title,
  //            news_content: memo.para.content,
  //            hash_href: [env.chainHost.replace('/api', '/node/explorer/txs/')+e.hash],
  //            state: 'chained',
  //            minner_state: 'idle',
  //            createdAt: e.time,
  //          });
  //          await new_doc.save();
  //          console.log('newsflashDappDbSync V1 create new_doc.asset_did=', new_doc.asset_did);
  //        }
  //      }else{
  //        console.log('newsflashDappDbSync V1 empty memo');
  //      }
  //    } catch (err) {
  //      console.log('newsflashDappDbSync V1 err=', err);
  //    }
  //  }));
  //}else{
  //  console.log('newsflashDappDbSync V1 empty chain tx');
  //}

  /*V2 style newsflash*/
  //tx = await fetchForgeTransactionsV2(dapp_module, module_para);
  //if(tx && tx.length > 0){
  //  await Promise.all(tx.map( async (e) => {
  //    try {
  //      var memo = JSON.parse(e.tx.itxJson.data.value);
  //      if(memo){
  //        const cdid = HashString('sha1', memo.para.content);
  //        const asset_did = newsflashAssetDidGen(cdid, memo);
  //        const asset_local_time = utcToLocalTime(e.time);
  //        var author_name = '';
  //        if(typeof(memo.para.uname) != "undefined" && memo.para.uname && memo.para.uname.length > 0){
  //          author_name = memo.para.uname;
  //        }else{
  //          author_name = '匿名';
  //        }

  //console.log('newsflashDappDbSync V2 asset_did=', asset_did);
  //        var doc = await Newsflash.findOne({ news_content: memo.para.content });
  //        if(doc){
  //          console.log('newsflashDappDbSync V2 update doc item content=', doc.news_content.substring(0,10));

  /*update exist doc*/
  //          doc.asset_did = asset_did;
  //          doc.content_did = cdid;
  //          doc.author_did = e.sender;
  //          doc.author_name = author_name;
  //          doc.news_hash = e.hash;
  //          doc.news_time = asset_local_time;
  //          doc.news_type = memo.para.type;
  //          doc.news_content = memo.para.content;
  //          doc.hash_href[0] = env.chainHost.replace('/api', '/node/explorer/txs/')+e.hash;
  //          doc.data_chain_nodes[0] = {name: env.chainName, chain_host: env.chainHost, chain_id: env.chainId};
  //          doc.markModified('data_chain_nodes');
  //          await doc.save();
  //        }else{
  /*create new doc*/
  //          var new_doc = new Newsflash({
  //            data_chain_nodes: [{name: env.chainName, chain_host: env.chainHost, chain_id: env.chainId}],
  //            asset_did: asset_did,
  //            content_did: cdid,
  //            author_did: e.sender,
  //            author_name: author_name,
  //            author_avatar: '',
  //            news_hash: e.hash,
  //            news_time: asset_local_time,
  //            news_type: memo.para.type,
  //            news_content: memo.para.content,
  //            hash_href: [env.chainHost.replace('/api', '/node/explorer/txs/')+e.hash],
  //            state: 'chained',
  //            minner_state: 'idle',
  //            createdAt: e.time,
  //          });
  //          await new_doc.save();
  //          console.log('newsflashDappDbSync V2 create new_doc.asset_did=', new_doc.asset_did);
  //        }
  //      }else{
  //        console.log('newsflashDappDbSync V2 empty memo');
  //      }
  //    } catch (err) {
  //      console.log('newsflashDappDbSync V2 err=', err);
  //    }
  //  }));
  //}else{
  //  console.log('newsflashDappDbSync V2 empty chain tx');
  //}

  /*V3 default chain style newsflash*/
  //tx = await fetchForgeTransactionsV3(dapp_module, module_para, env.chainId);
  //if(tx && tx.length > 0){
  //  await Promise.all(tx.map( async (e) => {
  //    try {
  //      var memo = JSON.parse(e.data.value);
  //      if(memo){
  //        const cdid = HashString('sha1', memo.para.content);
  //        const asset_did = newsflashAssetDidGen(cdid, memo);
  //        const asset_local_time = utcToLocalTime(e.genesisTime);
  //        const asset_hash = await getAssetGenesisHash(e.address, env.chainId);

  //        var author_name = '';
  //        if(typeof(memo.para.uname) != "undefined" && memo.para.uname && memo.para.uname.length > 0){
  //          author_name = memo.para.uname;
  //        }else{
  //          author_name = '匿名';
  //        }

  //        var news_origin = '';
  //        if(typeof(memo.para.origin) != "undefined" && memo.para.origin && memo.para.origin.length > 0){
  //          news_origin = memo.para.origin;
  //        }

  //        var news_title = '';
  //        if(typeof(memo.para.title) != "undefined" && memo.para.title && memo.para.title.length > 0){
  //          news_title = memo.para.title;
  //        }

  //        var news_content = memo.para.content;
  //        if(memo.para.type === 'test2' || memo.para.type === 'articles'){
  //          try{
  //            news_content = aesDecrypt(memo.para.content, hashnews_enc_key);
  //          } catch (err) {
  //            news_content = memo.para.content;
  //          }
  //          if(!news_content || news_content.length === 0){
  //            news_content = memo.para.content;
  //          }
  //        }

  //console.log('newsflashDappDbSync V2 asset_did=', asset_did);
  //        var doc = await Newsflash.findOne({ news_content: memo.para.content });
  //        if(doc){
  //          console.log('newsflashDappDbSync V3 update doc item content=', doc.news_content.substring(0,10));

  //          /*update exist doc*/
  //          doc.asset_did = e.address;
  //          doc.content_did = cdid;
  //          doc.author_did = memo.para.udid;
  //          doc.author_name = author_name;
  //          doc.author_avatar = memo.para.uavatar;
  //          doc.news_hash = asset_hash;
  //          doc.news_time = asset_local_time;
  //          doc.news_type = memo.para.type;
  //          doc.news_title = news_title;
  //          doc.news_content = news_content;
  //          doc.news_origin = news_origin;
  //          doc.news_images = memo.para.images;
  //          doc.hash_href[0] = env.chainHost.replace('/api', '/node/explorer/txs/')+asset_hash;
  //          doc.data_chain_nodes[0] = {name: env.chainName, chain_host: env.chainHost, chain_id: env.chainId};
  //          doc.markModified('data_chain_nodes');
  //          await doc.save();
  //        }else{
  /*create new doc*/
  //          var new_doc = new Newsflash({
  //            data_chain_nodes: [{name: env.chainName, chain_host: env.chainHost, chain_id: env.chainId}],
  //            asset_did: e.address,
  //            content_did: cdid,
  //            author_did: memo.para.udid,
  //            author_name: author_name,
  //            author_avatar: memo.para.uavatar,
  //            news_hash: asset_hash,
  //            news_time: asset_local_time,
  //            news_type: memo.para.type,
  //            news_title: news_title,
  //            news_content: news_content,
  //            news_origin: news_origin,
  //            news_images: memo.para.images,
  //            hash_href: [env.chainHost.replace('/api', '/node/explorer/txs/')+asset_hash],
  //            state: 'chained',
  //            minner_state: 'idle',
  //            createdAt: e.genesisTime,
  //          });
  //          await new_doc.save();
  //          console.log('newsflashDappDbSync V3 create new_doc.asset_did=', new_doc.asset_did);
  //        }
  //      }else{
  //        console.log('newsflashDappDbSync V3 empty memo');
  //      }
  //    } catch (err) {
  //      console.log('newsflashDappDbSync V3 err=', err);
  //    }
  //  }));
  //}else{
  //  console.log('newsflashDappDbSync V3 empty chain tx');
  //}

  /*V3 data chain style newsflash*/
  const dataChainList = await getDatachainList();
  for (var i = 0; i < dataChainList.length; i++) {
    ForgeSDK.connect(dataChainList[i].chain_host, {
      chainId: dataChainList[i].chain_id,
      name: dataChainList[i].chain_id,
    });
    console.log(
      `connected to app ${dataChainList[i].name} data chain host:${dataChainList[i].chain_host} id: ${dataChainList[i].chain_id}`
    );

    tx = await fetchForgeAssetTransactions(dapp_module, module_para, dataChainList[i].chain_id, asset_addr, asset_size);
    if (tx && tx.length > 0) {
      await Promise.all(
        tx.map(async e => {
          try {
            var memo = JSON.parse(e.data.value);
            if (memo) {
              const cdid = HashString('sha1', memo.para.content);
              //const asset_did = newsflashAssetDidGen(cdid, memo);
              const asset_did = e.address;
              const asset_local_time = utcToLocalTime(e.genesisTime);
              const asset_hash = await getAssetGenesisHash(e.address, dataChainList[i].chain_id);

              var author_name = '';
              if (typeof memo.para.uname != 'undefined' && memo.para.uname && memo.para.uname.length > 0) {
                author_name = memo.para.uname;
              } else {
                author_name = '匿名';
              }

              var news_origin = '';
              if (typeof memo.para.origin != 'undefined' && memo.para.origin && memo.para.origin.length > 0) {
                news_origin = memo.para.origin;
              }

              var news_title = '';
              if (typeof memo.para.title != 'undefined' && memo.para.title && memo.para.title.length > 0) {
                news_title = memo.para.title;
              }

              var news_content = memo.para.content;
              if (memo.para.type === 'test2' || memo.para.type === 'articles') {
                try {
                  news_content = aesDecrypt(memo.para.content, hashnews_enc_key);
                } catch (err) {
                  news_content = memo.para.content;
                }
                if (!news_content || news_content.length === 0) {
                  news_content = memo.para.content;
                }
              }

              var news_create_from_name = env.appName;
              if (typeof memo.para.dapp_name != 'undefined' && memo.para.dapp_name && memo.para.dapp_name.length > 0) {
                news_create_from_name = memo.para.dapp_name;
              }
              var news_create_from_link = env.appInfoLink;
              if (typeof memo.para.dapp_link != 'undefined' && memo.para.dapp_link && memo.para.dapp_link.length > 0) {
                news_create_from_link = memo.para.dapp_link;
              }

              //console.log('newsflashDappDbSync V3 assetChain asset_did=', asset_did);
              let doc = await Newsflash.findOne({ news_content: memo.para.content });
              if (!doc) {
                let doc = await Newsflash.findOne({ asset_did: e.address });
                if (!doc) {
                  /*create new doc if not exist*/
                  var new_doc = new Newsflash({
                    data_chain_nodes: [
                      {
                        name: dataChainList[i].name,
                        chain_host: dataChainList[i].chain_host,
                        chain_id: dataChainList[i].chain_id,
                      },
                    ],
                    asset_did: e.address,
                    content_did: cdid,
                    author_did: memo.para.udid,
                    author_name: author_name,
                    author_avatar: memo.para.uavatar,
                    news_hash: asset_hash,
                    news_time: asset_local_time,
                    news_type: memo.para.type,
                    news_title: news_title,
                    news_content: news_content,
                    news_origin: news_origin,
                    news_images: memo.para.images,
                    news_create_from_name: news_create_from_name,
                    news_create_from_link: news_create_from_link,
                    hash_href: [dataChainList[i].chain_host.replace('/api', '/node/explorer/txs/') + asset_hash],
                    state: 'chained',
                    minner_state: 'idle',
                    createdAt: e.genesisTime,
                  });
                  await new_doc.save();
                  console.log('newsflashDappDbSync V3 assetChain create new_doc.asset_did=', new_doc.asset_did);
                }
              }
            } else {
              console.log('newsflashDappDbSync V3 assetChain empty memo');
            }
          } catch (err) {
            console.log('newsflashDappDbSync V3 assetChain err=', err);
          }
        })
      );
    } else {
      console.log('newsflashDappDbSync V3 assetChain empty chain tx');
    }
  }

  /*remove some assets*/
  await newsflashRemoveAssets();
}

(async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('Cannot start application without process.env.MONGO_URI');
    } else {
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
    while (1) {
      if (isConnectedBefore) {
        console.log('Database connected');
        break;
      } else {
        console.log('Database connecting...');
        await sleep(1000);
      }
    }

    // Sync hash news from chain to local DB
    //if(process.env.APP_NEWSFLASH_ACCOUNT === 'zNKgEWmLfWvPkmiwyqp3jgnc6L9DSCtxnd9t'){
    //  await newsflashDappDbSync('zNKe3wMokWJ1YYUcHUut1H9TUTAyfE6kuzJg', 100); //梦阳
    //}else if(process.env.APP_NEWSFLASH_ACCOUNT === 'zNKe3wMokWJ1YYUcHUut1H9TUTAyfE6kuzJg'){
    //  await newsflashDappDbSync('zNKgEWmLfWvPkmiwyqp3jgnc6L9DSCtxnd9t', 100); //大米蜂
    //}
    while (1) {
      try {
        if (process.env.APP_NEWSFLASH_ACCOUNT === 'zNKgEWmLfWvPkmiwyqp3jgnc6L9DSCtxnd9t') {
          await sleep(60 * 1000);
          newsflashDappDbSync('zNKe3wMokWJ1YYUcHUut1H9TUTAyfE6kuzJg', 50); //梦阳
          console.log('Sync meng yang news');
          await sleep(60 * 1000);
        } else if (process.env.APP_NEWSFLASH_ACCOUNT === 'zNKe3wMokWJ1YYUcHUut1H9TUTAyfE6kuzJg') {
          await sleep(60 * 1000);
          newsflashDappDbSync('zNKgEWmLfWvPkmiwyqp3jgnc6L9DSCtxnd9t', 50); //大米蜂
          console.log('Sync hash news');
          await sleep(60 * 1000);
        } else {
          await newsflashDappDbSync('zNKgEWmLfWvPkmiwyqp3jgnc6L9DSCtxnd9t', 1000); //大米蜂
          await newsflashDappDbSync('zNKe3wMokWJ1YYUcHUut1H9TUTAyfE6kuzJg', 1000); //梦阳
          break;
        }
      } catch (err) {
        console.log('Sync news error', err);
      }
    }

    mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error(err);
    console.error(err.errors);
    process.exit(1);
  }
})();
