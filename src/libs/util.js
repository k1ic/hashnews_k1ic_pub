/* eslint-disable no-underscore-dangle */
require('dotenv').config();
import env from './env';

export function getExplorerUrl(pathname, chainHost=env.assetChainHost){
  const exp_url = chainHost.replace('/api', '/node/explorer'+pathname);
  return exp_url;
};

export function decimalConvert(value, decNumKeep, mathType = 'round'){
  let pow = Math.pow(10, decNumKeep);
  let targetValue = value;
  switch(mathType){
    case 'ceil':
      /*��������������*/
      targetValue = Math.ceil((value)*pow)/pow;
      break;
    case 'floor':
      /*��������������*/
      targetValue = Math.floor((value)*pow)/pow;
      break;
    case 'round':
      /*����������������*/
      targetValue = Math.round((value)*pow)/pow;
      break;
    default:
      targetValue = Math.round((value)*pow)/pow;
      break;
  }
  
  return targetValue;
}
