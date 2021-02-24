/* eslint-disable no-underscore-dangle */
require('dotenv').config();
import reqwest from 'reqwest';
import env from './env';

function doRawQuery(query, chainName=env.assetChainName){
  return new Promise((resolve, reject) => {
    reqwest({
      url: '/api/datachainsget',
      method: 'get',
      data: {
        cmd: 'doRawQuery',
        chainName: chainName,
        queryCmd: query,
      },
      type: 'json',
    }).then(data => {
    	/*
      if(data){
        console.log('doRawQuery data=', data);
      }else{
        console.log('doRawQuery empty data');
      }
      */
      resolve(data);
    });
  })
}

export default function forge(){
  return {
    doRawQuery: doRawQuery,
  };
}
