/* eslint-disable no-underscore-dangle */
const crypto = require('crypto');
const CryptoJS = require('crypto-js');
const fs = require('fs');

const sleep = timeout => new Promise(resolve => setTimeout(resolve, timeout));

const hashnews_enc_key = '2e7c179599057f5810b081b9f0d01cefae07332e';

function aesEncrypt(str, key){
  var iv = key;
  key = CryptoJS.enc.Utf8.parse(key);
  iv = CryptoJS.enc.Utf8.parse(iv);
  
  var encrypted = CryptoJS.AES.encrypt(str, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });
  
  encrypted = encrypted.toString();
  
  return encrypted;
}

function aesDecrypt(encrypted, key){
  var iv = key;
  key = CryptoJS.enc.Utf8.parse(key);
  iv = CryptoJS.enc.Utf8.parse(iv);
  
  var decrypted = CryptoJS.AES.decrypt(encrypted, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });
  decrypted = CryptoJS.enc.Utf8.stringify(decrypted);
  
  return decrypted;
}

function HashString(strHashType, strHashIn){
  const HashObj = crypto.createHash(strHashType);
  if(!HashObj){
    console.log('invalid hash obj');
    return null;
  }
  HashObj.update(strHashIn);
  const strHashOut = HashObj.digest('hex');
  
  //console.log(strHashType+' hash in='+strHashIn+' out='+strHashOut);
  return strHashOut;
}

function HashFile(strHashType, strFileName){
  if(!fs.existsSync(strFileName)){
    console.log('HashFile file '+strFileName+' not exist!');
    return null;
  }
  
  const buffer = fs.readFileSync(strFileName);
  const HashObj = crypto.createHash(strHashType);
  if(!HashObj){
    console.log('invalid hash obj');
    return null;
  }
  HashObj.update(buffer);
  const strHashOut = HashObj.digest('hex');
  
  return strHashOut;
}

//const md5Test = HashString('md5',Date());
//console.log('md5Test='+md5Test);
//const sha1Test = HashString('sha1', Date());
//console.log('sha1Test='+sha1Test);
//const sha1FileTest = HashFile('sha1', '../../src/static/images/payment/animal/robert/bark/f9c86d8761cc58a906f3c64e9e6aea14576e3b84.jpg');
//console.log('sha1FileTest='+sha1FileTest);

module.exports = {
  hashnews_enc_key,
  aesEncrypt,
  aesDecrypt,
  HashString,
  HashFile,
};
