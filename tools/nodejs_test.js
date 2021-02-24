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
const {
  getDateByDeltaYear,
  getDateByDeltaMonth,
  getDateByDeltaDay,
  getDateByDeltaHour,
  dateDiffInDay,
  dateDiffInHour,
} = require('../api/libs/time');

const {
  hashnews_enc_key,
  aesEncrypt,
  aesDecrypt
} = require('../api/libs/crypto');

const sleep = timeout => new Promise(resolve => setTimeout(resolve, timeout));

const encDecKey = '2e7c179599057f5810b081b9f0d01cefae07332e';
const strToEncrypt = '第一季度（1 月 – 3 月）\nTelos 主网交易速度及活跃度在 DPOS 链中位居第二。二月中旬，Telos 一周平均每天能够处理 360 万笔交易，仅次于 EOS（3,340万）。\n第二季度（4 月- 6 月）\n1.出席伦敦区块链世博会\n2.出席阿姆斯特丹欧洲区块链世博会\n第三季度（7 月 – 9 月）\n1.董事会成员 Suvi Rinkinen 被选为 Telos 基金会首任 CEO。\n2.Telos 与科技金融公司 Carbon 达成合作，发行对标美元的稳定币 TLOSD。TLOSD 能够充当 Telos 与法币世界的桥梁，推动 Telos 在开发者与普通用户中的应用。\n3.8 月，新闻网站 CoinDesk 在盘点从 EOS 分叉出来的区块链的文章中引用了 Telos 白皮书作者 Douglas Horn 的发言。在文章中提到的几个项目中，CoinDesk 记者 David Floyd 指出：“ Telos 是 EOSIO 区块链中势头最强，支持度最高的。有不少 Telos 团队成员参加了 EOS 的启动，现在在建设 Telos 的同时，还在继续支持 EOS 网络。”\n第四季度（10 月 – 12 月）\n1. dMail 启动，dMail 是一款通讯应用，能够为 Telos 网络提供邮件服务。\n2.瑞士初创企业 Havuta 宣布将在 Telos 网络上部署。 Havuta 是一款移动端应用，能够帮助 NGO 收集其援助项目的相关数据。\n3.出席硅谷区块链世博会\n4.出席英国剑桥大学区块链商业会议\n5.出席苏黎世圣加仑大学区块链圆桌会\n6.Telos 基金会在咨询公司 decrypted 的帮助下启动全新品牌。新品牌涵盖全新 logo，设计元素，以及全球 Telos 社区的聚集地 telos.net 网站。第一季度（1 月 – 3 月）\nTelos 主网交易速度及活跃度在 DPOS 链中位居第二。二月中旬，Telos 一周平均每天能够处理 360 万笔交易，仅次于 EOS（3,340万）。\n第二季度（4 月- 6 月）\n1.出席伦敦区块链世博会\n2.出席阿姆斯特丹欧洲区块链世博会\n第三季度（7 月 – 9 月）\n1.董事会成员 Suvi Rinkinen 被选为 Telos 基金会首任 CEO。\n2.Telos 与科技金融公司 Carbon 达成合作，发行对标美元的稳定币 TLOSD。TLOSD 能够充当 Telos 与法币世界的桥梁，推动 Telos 在开发者与普通用户中的应用。\n3.8 月，新闻网站 CoinDesk 在盘点从 EOS 分叉出来的区块链的文章中引用了 Telos 白皮书作者 Douglas Horn 的发言。在文章中提到的几个项目中，CoinDesk 记者 David Floyd 指出：“ Telos 是 EOSIO 区块链中势头最强，支持度最高的。有不少 Telos 团队成员参加了 EOS 的启动，现在在建设 Telos 的同时，还在继续支持 EOS 网络。”\n第四季度（10 月 – 12 月）\n1. dMail 启动，dMail 是一款通讯应用，能够为 Telos 网络提供邮件服务。\n2.瑞士初创企业 Havuta 宣布将在 Telos 网络上部署。 Havuta 是一款移动端应用，能够帮助 NGO 收集其援助项目的相关数据。\n3.出席硅谷区块链世博会\n4.出席英国剑桥大学区块链商业会议\n5.出席苏黎世圣加仑大学区块链圆桌会\n6.Telos 基金会在咨询公司 decrypted 的帮助下启动全新品牌。新品牌涵盖全新 logo，设计元素，以及全球 Telos 社区的聚集地 telos.net 网站。';


(async () => {
  try {
    const ttl = Number("365");
    console.log('ttl=', ttl);
    
    var time = null;
    time = getDateByDeltaYear(0);
    console.log('current time=',time);
    time = getDateByDeltaYear(-2);
    console.log('2 year before time=',time);
    time = getDateByDeltaYear(2);
    console.log('2 year after time=',time);
    time = getDateByDeltaMonth(-2);
    console.log('2 month before time=',time);
    time = getDateByDeltaMonth(2);
    console.log('2 month after time=',time);
    time = getDateByDeltaDay(-2);
    console.log('2 day before time=',time);
    time = getDateByDeltaDay(2);
    console.log('2 day after time=',time);
    time = getDateByDeltaHour(-2);
    console.log('2 hour before time=',time);
    time = getDateByDeltaHour(2);
    console.log('2 hour after time=',time);
    
    var days = 0;
    days = dateDiffInDay(new Date(), getDateByDeltaYear(-2));
    console.log('day diff in days=', days);
    days = dateDiffInDay(new Date(), getDateByDeltaMonth(-2));
    console.log('day diff in days=', days);
    days = dateDiffInDay(new Date(), getDateByDeltaDay(-2));
    console.log('day diff in days=', days);
    
    var hours = 0;
    hours = dateDiffInHour(new Date(), getDateByDeltaDay(-2));
    console.log('day diff in hours=', hours);
    hours = dateDiffInHour(new Date(), getDateByDeltaHour(-2));
    console.log('day diff in hours=', hours);
    
    const encrypted = aesEncrypt(strToEncrypt, hashnews_enc_key);
    console.log('aesEncrypt strToEncrypt.len=', strToEncrypt.length, 'encrypted.len=', encrypted.length);
    //console.log('aesEncrypt encrypted=', encrypted);
    const decrypted = aesDecrypt(encrypted, hashnews_enc_key);
    console.log('aesDecrypt decrypted.len=', decrypted.length);
    console.log('aesDecrypt decrypted=', decrypted);
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    console.error(err.errors);
    process.exit(1);
  }
})();

