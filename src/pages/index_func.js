/* eslint-disable react/jsx-one-expression-per-line */
import React from 'react';
import styled from 'styled-components';

import Typography from '@material-ui/core/Typography';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CircularProgress from '@material-ui/core/CircularProgress';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import CodeBlock from '@arcblock/ux/lib/CodeBlock';

import Layout from '../components/layout';
import env from '../libs/env';

//import AssetPicList from '../libs/asset_pic';
import usePreviewPics from '../hooks/picture';

const graphqlDemos = [
  {
    title: 'Application State',
    subtitle: 'Example 1',
    description: 'Use GraphQLClient to get current application state on chain',
    link: '/application',
  },
  {
    title: 'Chain State',
    subtitle: 'Example 2',
    description: 'Use GraphQLClient to read current chain info and display it as json',
    link: '/chain',
  },
  {
    title: 'Block and Transactions',
    subtitle: 'Example 3',
    description: 'Query blocks and transactions from the forge powered chain',
    link: '/blocks',
  },
];

const walletDemos = [
  {
    title: '签到',
    subtitle: 'Example 2',
    description: 'Help user to get some free tokens on the blockchain to test our application',
    link: '/profile',
  },
  {
    title: '支付',
    subtitle: 'Example 3',
    description: 'Allow user to pay for an secret document with crypto token, and records payment info in database.',
    link: '/payment',
  },
];

const renderExampleCard = x => (
  <Grid key={x.title} item xs={12} sm={6}>
    <Card className="demo">
      <CardContent>
        <Typography href={x.link} component="a" variant="h4" className="card-title"  gutterBottom>
          {x.title}
        </Typography>
      </CardContent>
    </Card>
  </Grid>
);

const DemoDappList = [
  {
    title: 'TBA',
    link: 'https://abtwallet.io/zh/profile',
    chain_node: 'https://zinc.abtnetwork.io/',
    logo: '/static/images/tba.png',
    login_code: '/static/images/tba_login.png',
    checkin_code: '/static/images/tba_checkin.png',
    owner: 'ArcBlock',
  },
  {
    title: 'BTC测试币',
    link: 'http://47.104.90.84:3030/profile',
    chain_node: 'http://47.104.90.84:8210',
    logo: '/static/images/btc.png',
    login_code: '/static/images/btc_login.png',
    checkin_code: '/static/images/btc_checkin.png',
    owner: '大米蜂',
  },
  {
    title: 'ETH测试币',
    link: 'http://120.25.152.172:3030/profile',
    chain_node: 'http://120.25.152.172:8210',
    logo: '/static/images/eth.png',
    login_code: '/static/images/eth_login.png',
    checkin_code: '/static/images/eth_checkin.png',
    owner: 'loooong',
  },
  {
    title: 'LTC测试币',
    link: 'http://120.24.5.229:3030/profile',
    chain_node: 'http://120.24.5.229:8210',
    logo: '/static/images/ltc.png',
    login_code: '/static/images/ltc_login.png',
    checkin_code: '/static/images/ltc_checkin.png',
    owner: 'onion',
  },
  {
    title: 'EOS测试币',
    link: 'http://47.92.151.143:3030/profile',
    chain_node: 'http://47.92.151.143:8210',
    logo: '/static/images/eos.png',
    login_code: '/static/images/eos_login.png',
    checkin_code: '/static/images/eos_checkin.png',
    owner: 'niss.W',
  },
];

const renderDemoDappLoginListCard = x => (
  <Grid key={x.title} item xs={12} sm={6} md={3}>
    <Card className="demo-dapp-list">
      <CardContent>
        <Typography href={x.link} component="a" variant="h6" color="textPrimary" target="_blank" gutterBottom>
          {x.title}
        </Typography>
        <Typography component="p" variant="h6" color="inherit" gutterBottom>
          <img className="qr-code" src={x.login_code} alt={x.title} />
        </Typography>
        <Typography href={x.chain_node} component="a" variant="h6" color="textPrimary" target="_blank" gutterBottom>
          浏览器
        </Typography>
      </CardContent>
    </Card>
  </Grid>
);

const renderDemoDappCheckinListCard = x => (
  <Grid key={x.title} item xs={12} sm={6} md={3}>
    <Card className="demo-dapp-list">
      <CardContent>
        <Typography href={x.link} component="a" variant="h6" color="textPrimary" target="_blank" gutterBottom>
          {x.title}
        </Typography>
        <Typography component="p" variant="h6" color="inherit" gutterBottom>
          <img className="qr-code" src={x.checkin_code} alt={x.title} />
        </Typography>
        <Typography href={x.chain_node} component="a" variant="h6" color="textPrimary" target="_blank" gutterBottom>
          链节点
        </Typography>
      </CardContent>
    </Card>
  </Grid>
);

const renderPaymentPicListCard = x => (
  <Grid key={x.title} item xs={12} sm={6} md={3}>
    <Card className="payment-pic-list">
      <CardContent>
        <Typography component="p" color="primary" gutterBottom>
          {x.title} - {x.worth} {x.token_sym}
        </Typography>
        <Typography href={x.link} component="a" variant="h6" color="inherit" gutterBottom>
          <img className="pic-list" src={x.blur_src} alt={x.title} />
        </Typography>
        <Typography component="p" color="primary" gutterBottom>
          {x.owner}：{x.description}
        </Typography>
      </CardContent>
    </Card>
  </Grid>
);

const renderTBAWoolListCard = x => (
  <Grid key={x.title} item xs={6} sm={3} md={2} lg={1}>
    <Card className="tba-wool-list">
      <CardContent>
        <Typography component="p" color="primary" gutterBottom>
          {x.title}
        </Typography>
        <Button color="secondary" variant="contained" onClick={() => window.location.href = `${x.checkin}`}>
          签到
        </Button>
      </CardContent>
    </Card>
  </Grid>
);

export default function IndexPage() {
  const picture = usePreviewPics();

  if (picture.loading) {
    return (
      <Layout title="Home">
        <Main>
          <CircularProgress />
        </Main>
      </Layout>
    );
  }

  if (picture.error) {
    return (
      <Layout title="Home">
        <Main>{picture.error.message}</Main>
      </Layout>
    );
  }
  
  const AssetPicList = picture.value;
  
  //init TBA wool list
  var TBAWoolList=new Array();
  for(var i=0;i<12;i++) {
    TBAWoolList[i]={};
    TBAWoolList[i]['title'] = `羊毛${i+1}号`;
    TBAWoolList[i]['login'] = `http://abtworld.cn:${3030+i}/?openLogin=true`;
    //console.log("TBAWoolList[", i, "][login]=", TBAWoolList[i].login);
    TBAWoolList[i]['checkin'] = `http://abtworld.cn:${3030+i}/checkin`;
    //console.log("TBAWoolList[", i, "][checkin]=", TBAWoolList[i].checkin);
  }

  return (
    <Layout title="Home">
      <Main>
      <section className="section">
        <Typography component="h3" variant="h5" className="section__header" color="textPrimary" gutterBottom>
          薅羊毛
        </Typography>
        <Typography component="p" variant="h6" className="page-description" color="textSecondary">
          羊毛党的福利，一个钱包每天可以撸300TBA
        </Typography>
        <Grid container spacing={6} className="section__body demos">
          {TBAWoolList.map(x => renderTBAWoolListCard(x))}
        </Grid>
      </section>
      <section className="section">
        <Typography component="h3" variant="h5" className="section__header" color="textPrimary" gutterBottom>
          付费资源
        </Typography>
        <Typography component="p" variant="h6" className="page-description" color="textSecondary">
          <a href="https://abtwallet.io/zh/" target="_blank">ABT钱包</a>扫码支付后查看高清图片
        </Typography>
        <Grid container spacing={6} className="section__body demos">
          {AssetPicList?AssetPicList.map(x => renderPaymentPicListCard(x)):''}
        </Grid>
      </section>
      </Main>
    </Layout>
  );
}

const Main = styled.main`
  margin: 20px 0 0;

  a {
    color: ${props => props.theme.colors.green};
    text-decoration: none;
  }

  .page-header {
    margin-bottom: 20px;
  }

  .page-description {
    margin-bottom: 30px;
  }

  .section {
    margin-bottom: 50px;
    .section__header {
      margin-bottom: 20px;
    }
  }

  .demos {
    .demo {
      height: 80px;
      .card-title {
         display: flex;
         align-items: center;
         justify-content: center;
       }
    }
  }

  .demo-dapp-list {
    height: 320px;
    width: 260px;
  }

  .payment-pic-list {
    height: 320px;
    width: 260px;
  }

  .tba-wool-list {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: flex-center;
    height: 100px;
    width: 100px;
  }

  .qr-code {
    heigh: 225px;
    width: 225px;
    margin-right: 1px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .pic-list {
    heigh: 225px;
    width: 225px;
    margin-right: 1px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

`;
