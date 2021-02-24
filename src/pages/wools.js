/* eslint-disable react/jsx-one-expression-per-line */
import React, { Component } from 'react';
import styled from 'styled-components';

import Typography from '@material-ui/core/Typography';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CircularProgress from '@material-ui/core/CircularProgress';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import CodeBlock from '@arcblock/ux/lib/CodeBlock';
import { LocaleProvider, Pagination } from 'antd';
import zh_CN from 'antd/lib/locale-provider/zh_CN'
import 'antd/dist/antd.css';

import Layout from '../components/layout';
import env from '../libs/env';

import { fetchPicsNum, fetchPreviewPics } from '../hooks/picture';

//Picture number of one page
const pic_num_one_page=8;

const renderTBAWoolListCard = x => (
  <Grid key={x.title} item xs={6} sm={4} md={3} lg={2} className="grid-item">
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

class App extends Component {
  static async getInitialProps({pathname, query, asPath, req}) {
    console.log('getInitialProps query=', query);
    return {};
  }
  
  constructor(props) {
    super(props);
    
    /*initial state*/
    this.state = {
      pictures: [],
      pic_total_num: null,
    };
    
    this.onPageChange = this.onPageChange.bind(this);
  }
  
  /*Fetch Data*/
  async fetchData(pageNumber){
    try {
      console.log('fetchData, pageNumber=', pageNumber);
      fetchPicsNum('approved').then((v)=>{
        this.setState({pic_total_num: v});
      });
      
      fetchPreviewPics((pageNumber-1)*pic_num_one_page, pic_num_one_page).then((v)=>{
        this.setState({pictures: v});
      });
    } catch (err) {
    }
    return {};
  }
  
  /*component mount process*/
  componentDidMount() {
    //this.fetchData(1);
  }
  
  /*component unmount process*/
  componentWillUnmount() {
  }
  
  onPageChange(pageNumber) {
    console.log('Page: ', pageNumber);
    this.fetchData(pageNumber);
  }
  
  render() {    
    //init TBA wool list
    var TBAWoolList=new Array();
    for(var i=1;i<13;i++) {
      TBAWoolList[i]={};
      TBAWoolList[i]['title'] = `羊毛${i}号`;
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
            <Grid container spacing={6} className="grid-cards">
              {TBAWoolList.map(x => renderTBAWoolListCard(x))}
            </Grid>
          </section>
        </Main>
      </Layout>
    );
  }
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

  .grid-cards {
    .grid-item {
      display: flex;
      align-items: center;
      justify-content: center;
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

export default App;
