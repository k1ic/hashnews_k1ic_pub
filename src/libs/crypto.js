/* eslint-disable no-underscore-dangle */
import crypto from 'crypto';

const forgeTxDPointMaxNum = 6; /*The max decimal point is 6. The fromTokenToUnit API will failure when max then 6*/
const forgeTxDPointMaxPow = Math.pow(10, forgeTxDPointMaxNum);

export function forgeTxValueSecureConvert(value){
  /*convert the tx value base on max decimal pointer*/
  return Math.floor((value)*forgeTxDPointMaxPow)/forgeTxDPointMaxPow; /*round down*/
}

/*
 *strHashType
 *1.md5
 *2.sha1
 */
export function HashString(strHashType, strHashIn){
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
