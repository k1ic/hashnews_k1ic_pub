import React, { useEffect } from 'react';
import styled from 'styled-components';
import useAsync from 'react-use/lib/useAsync';
import useToggle from 'react-use/lib/useToggle';
import qs from 'querystring';
import { fromUnitToToken } from '@arcblock/forge-util';

import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import Grid from '@material-ui/core/Grid';
import Auth from '@arcblock/did-react/lib/Auth';
import Avatar from '@arcblock/did-react/lib/Avatar';
import 'antd/dist/antd.css';

import Layout from '../components/layout';
import useForUpdateSession from '../hooks/session';
import api from '../libs/api';
//import AssetPicList from '../libs/asset_pic';
import {fetchPayedPics} from '../hooks/picture';

import { onAuthError } from '../libs/auth';
import env from '../libs/env';

const sleep = timeout => new Promise(resolve => setTimeout(resolve, timeout));

const admin_account = env.appAdminAccounts;
const isProduction = process.env.NODE_ENV === 'production';
//const isProduction = 0;

// payment pending flag
var PaymentPendingFlag = 0;
function getPaymentPendingFlag() {
  return PaymentPendingFlag;
}
function setPaymentPendigFlag(flag) {
  PaymentPendingFlag = flag;
}

var asset_did = "";

async function fetchStatus() {
  console.log('fetchStatus asset_did=', asset_did);
  const [{ data: payment }, { data: session }, {data: picture}] = await Promise.all([api.get(`/api/payments?module=picture&asset_did=${asset_did}`), 
    api.get('/api/did/session'), 
    api.get(`/api/getpics?cmd=GetPicsForPayShow0x012bbc9ebd79c1898c6fc19cefef6d2ad7a82f44&asset_did=${asset_did}`)]);
  return { payment, session, picture};
}

const onPaymentClose = async result => {
  setPaymentPendigFlag(0);
  window.location.href = '/';
};

const onPaymentError = async result => {
  setPaymentPendigFlag(0);
  window.location.href = '/';
};

const onPaymentSuccess = async result => {
  /*wait payment to chain*/
  await sleep(3000);
  
  /*reload window*/
  setPaymentPendigFlag(0);
  window.location.reload();
};

export default function PaymentPage(props) {
  asset_did = props.asset_did;
  console.log('asset_did=', asset_did);
  const state = useAsync(fetchStatus);
  const [open, toggle] = useToggle(false);
  var fValueToPay;
  var fValuePayed;
  var strValueToPay;
  var strValuePayed;
  var temp = null;
  
  if (state.loading || !state.value) {
    return (
      <Layout title="Payment">
        <Main>
          <CircularProgress />
        </Main>
      </Layout>
    );
  }

  if (state.error) {
    return (
      <Layout title="Payment">
        <Main>{state.error.message}</Main>
      </Layout>
    );
  }

  if (!state.value.session.user) {
    window.location.href = '/?openLogin=true';
    setPaymentPendigFlag(0);
    return null;
  }

  const {
    payment,
    session: { user, token },
    picture,
  } = state.value;

  //const pic_to_pay = AssetPicList.filter(function (e) { 
  //  return e.asset_did === asset_did;
  //});
  if (!picture) {
    window.location.href = '/';
    setPaymentPendigFlag(0);
    return null;
  }
  const pic_to_pay = picture.filter(function (e) { 
    return e.asset_did === asset_did;
  });
  
  if (!pic_to_pay || pic_to_pay.length === 0){
    window.location.href = '/';
    setPaymentPendigFlag(0);
    return null;
  }
  fValueToPay = parseFloat(pic_to_pay[0].worth);
  
  if(state.value.payment && state.value.payment.length >= 1) {
    const payment_data = state.value.payment;
    fValuePayed = 0;
    if (payment_data) {
      payment_data.map(function( e ) {
        fValuePayed = fValuePayed + parseFloat(fromUnitToToken(e.tx.itxJson.value, token.decimal));
      });
    }
    strValuePayed = String(fValuePayed);
  }else{
    fValuePayed = 0;
    strValuePayed = null; 
  }

  if(fValueToPay > fValuePayed){
    fValueToPay = fValueToPay - fValuePayed;
    fValueToPay = fValueToPay.toFixed(6);
    strValueToPay = String(fValueToPay);
  }else{
    fValueToPay = 0;
    strValueToPay = null;
    setPaymentPendigFlag(0);
  }

  //asset owner and super admin don't need to pay in production release
  if (isProduction && (user.did == pic_to_pay[0].owner_did || -1 != admin_account.indexOf(user.did))){
    fValueToPay = 0;
    strValueToPay = null;
    setPaymentPendigFlag(0);
  }

  //picture file to display
  const pic_to_preview = "/static/images/20190930094558.jpg";
  const pic_to_show = (fValueToPay > 0) ? pic_to_preview : pic_to_pay[0].hd_src;

  //payment parameter
  const toPay = strValueToPay;
  const dapp = 'picture';
  const para_obj = {asset_did: asset_did};
  const para = JSON.stringify(para_obj);

  window.document.oncontextmenu = function(){ 
    //disable rigth click menu
    return false;
  }

  setTimeout(() => {
    try {
      if (fValueToPay > 0 && getPaymentPendingFlag() == 0){
        setPaymentPendigFlag(1);
        toggle(true);
      }
    } catch (err) {
      // Do nothing
    }
  }, 100);
 
  return (
    <Layout title="Payment">
      <Main symbol={token.symbol}>
        <div className="picture-title">
          {pic_to_pay[0].owner} - {pic_to_pay[0].title} - {pic_to_pay[0].worth} {pic_to_pay[0].token_sym} <br/>
        </div>
        <div className={`picture ${(fValueToPay > 0) ? '' : 'picture--unlocked'}`}>
          <img src={pic_to_show} alt={pic_to_pay[0].title} />
        </div>
        <div className="picture-desc">
          {pic_to_pay[0].description}
        </div>
      </Main>
      {open && (
        <Auth
          responsive
          action="payment"
          locale="zh"
          checkFn={api.get}
          onError={onPaymentError}
          onClose={onPaymentClose}
          onSuccess={onPaymentSuccess}
          extraParams={ "zh", { toPay, dapp, para } }
          messages={{
            title: '支付需求',
            scan: `该内容需支付 ${toPay} ${token.symbol}`,
            confirm: '在ABT钱包中确认',
            success: '支付成功!',
          }}
        />
      )}
    </Layout>
  );
}

PaymentPage.getInitialProps = async function ({pathname, query, asPath, req}) {
    //console.log('pathname=', pathname);
    //console.log('query=', query);
    console.log('query.asset_did=', query.asset_did);
    console.log('query._t_=', query._t_);
    //console.log('asPath=', asPath);
    //console.log('req=', req);
    //console.log('req.url=', req.url);
    
    const wback_ts = query._t_;
    if(typeof(wback_ts) != "undefined" && wback_ts && wback_ts.length > 0){
      console.log('getInitialProps wait tx to chain start');
      await sleep(3000);
      console.log('getInitialProps wait tx to chain ended');
    }

    return {
      asset_did: query.asset_did,
      wback_ts: wback_ts,
    }
}

const Main = styled.main`
  margin: 10px 0;  

  .picture-title {
    margin: 20px 0 0;
    margin-bottom: 20px;
    pointer-event:none;-webkit-user-select:none;-moz-user-select:none;user-select:none;
    color: #000000;
    font-size: 20px;
    width:100%;
    height: auto;
    white-space: pre-wrap;
    word-wrap: break-word;
    word-break: break-all;
  }
  
  .picture-desc {
    margin: 20px 0 0;
    margin-bottom: 10px;
    pointer-event:none;-webkit-user-select:none;-moz-user-select:none;user-select:none;
    color: #3CB371;
    font-size: 20px;
    width:100%;
    height: auto;
    white-space: pre-wrap;
    word-wrap: break-word;
    word-break: break-all;
  }

  .picture {
    pointer-event:none;-webkit-user-select:none;-moz-user-select:none;user-select:none;
    position: relative;
    filter: blur(30px);
    
    &:after {
      color: #dd2233;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans',
        'Helvetica Neue', sans-serif;
      content: '';
      font-size: 30px;
      line-height: 0px;
      border-radius: 0px;
      padding: 0px;
      font-weight: bold;
      position: absolute;
      text-transform: uppercase;
      animation: blink 800ms ease;
      border: 0px solid #dd2233;
      -moz-background-size:contain|cover;
      -webkit-background-size:contain|cover;
      -o--background-size:contain|cover;
      background-size:contain|cover;
      top: 0%;
      left: 0%;
      width:100%;
      height: 100%;
    }
  }

  .picture img {
    -moz-background-size:contain|cover;
    -webkit-background-size:contain|cover;
    -o--background-size:contain|cover;
    background-size:contain|cover;
    width:100%;
    height: auto;
  }

  .picture--unlocked {
    filter: none;

    &:after {
    }
  }

`;
