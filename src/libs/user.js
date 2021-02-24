/* eslint-disable no-underscore-dangle */

export function getUserDidFragment(userDid){
  if (typeof(userDid) == "undefined" || !userDid || userDid.length == 0) {
    return '';
  }
  
  const did_len = userDid.length;
  const did_fragment = userDid.substring(0,4) + '*' + userDid.substring(did_len-4,did_len);
  //console.log('getUserDidFragment did_fragment=',did_fragment);
  
  return did_fragment;
};
