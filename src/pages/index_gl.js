/* eslint-disable react/jsx-one-expression-per-line */
import React, { Component } from 'react';

import { makeStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/styles';
import GridList from '@material-ui/core/GridList';
import GridListTile from '@material-ui/core/GridListTile';
import GridListTileBar from '@material-ui/core/GridListTileBar';
import ListSubheader from '@material-ui/core/ListSubheader';
import IconButton from '@material-ui/core/IconButton';
import InfoIcon from '@material-ui/icons/Info';

import styled from 'styled-components';
import Typography from '@material-ui/core/Typography';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CircularProgress from '@material-ui/core/CircularProgress';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import CodeBlock from '@arcblock/ux/lib/CodeBlock';
import { LocaleProvider, Pagination, Carousel } from 'antd';
import zh_CN from 'antd/lib/locale-provider/zh_CN'
import 'antd/dist/antd.css';

import Layout from '../components/layout';
import env from '../libs/env';

import { fetchPicsNum, fetchPreviewPics } from '../hooks/picture';

const styles = {
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.54)',
  },
  gridList: {
    width: 800,
    height: 200,
  },
  icon: {
    color: 'rgba(255, 255, 255, 0.54)',
  },
};


//Picture number of one page
const pic_mar_num_one_page=4;
const pic_ent_num_one_page=8;

const renderPaymentPicListCard = x => (
  <Grid key={x.title} item xs={12} sm={6} md={3} className="grid-item">
    <Card className="payment-pic-list">
      <CardContent>
        <Typography component="p" color="primary" gutterBottom>
          {x.title} - {x.worth} {x.token_sym}
        </Typography>
        <Typography href={x.link} component="a" variant="h6" color="inherit" gutterBottom>
          <img className="pic-list" src={x.pic_src} alt={x.title} />
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

class App extends Component {
  static async getInitialProps({pathname, query, asPath, req}) {
    console.log('getInitialProps query=', query);
    return {};
  }
  
  constructor(props) {
    super(props);
    
    /*initial state*/
    this.state = {
      pics_ent: null,
      pics_mar: null,
      pics_ent_total: null,
      pics_mar_total: null,
    };
    
    this.onEntPicsPageChange = this.onEntPicsPageChange.bind(this);
    this.onMarPicsPageChange = this.onMarPicsPageChange.bind(this);
  }
  
  /*Fetch Pics*/
  async fetchPics(strCategory, pageNumber){
    try {
      console.log('fetchPics, strCategory=', strCategory, 'pageNumber=', pageNumber);
      fetchPicsNum('approved', strCategory).then((v)=>{
        if(strCategory === 'entertainment'){
          console.log('pics_ent_total update to', v);
          this.setState({pics_ent_total: v});
        }else if(strCategory === 'marriage'){
          console.log('pics_mar_total update to', v);
          this.setState({pics_mar_total: v});
        }
      });
      
      var pic_num_one_page = pic_ent_num_one_page;
      if(strCategory === 'entertainment'){
        pic_num_one_page = pic_ent_num_one_page;
      }else if(strCategory === 'marriage'){
        pic_num_one_page = pic_mar_num_one_page;
      }
      
      fetchPreviewPics(strCategory, (pageNumber-1)*pic_num_one_page, pic_num_one_page).then((v)=>{
        if(strCategory === 'entertainment'){
          this.setState({pics_ent: v});
        }else if(strCategory === 'marriage'){
          this.setState({pics_mar: v});
        }
      });
    } catch (err) {
      console.log('fetchPics err=', err);
    }
    return {};
  }
  
  /*component mount process*/
  componentDidMount() {
    this.fetchPics('entertainment', 1);
    this.fetchPics('marriage', 1);
  }
  
  /*component unmount process*/
  componentWillUnmount() {
  }
  
  onEntPicsPageChange(pageNumber) {
    console.log('onEntPicsPageChange Page: ', pageNumber);
    this.fetchPics('entertainment', pageNumber);
  }
  
  onMarPicsPageChange(pageNumber) {
    console.log('onMarPicsPageChange Page: ', pageNumber);
    this.fetchPics('marriage', pageNumber);
  }
  
  render() {
    const {pics_ent, pics_mar, pics_ent_total, pics_mar_total} = this.state;
    const { classes } = this.props;
    
    if (pics_ent_total === null || pics_mar_total === null) {
      return (
        <Layout title="Home">
          <Main>
            <CircularProgress />
          </Main>
        </Layout>
      );
    }
    
    //console.log('pics_ent=', pics_ent);
    console.log('pics_ent_total=', pics_ent_total);
    //console.log('pics_mar=', pics_mar);
    console.log('pics_mar_total=', pics_mar_total);
    
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
          {/*
          <Carousel autoplay>
            <div>
              <h3>1</h3>
            </div>
            <div>
              <h3>2</h3>
            </div>
            <div>
              <h3>3</h3>
            </div>
            <div>
              <h3>4</h3>
            </div>
          </Carousel>
          */}
          <Typography component="h3" variant="h5" className="section__header" color="secondary" gutterBottom>
            征婚
          </Typography>
          <Typography component="p" variant="h6" className="page-description" color="textSecondary">
            <a href="https://abtwallet.io/zh/" target="_blank">ABT钱包</a>扫码支付后查看详细资料
          </Typography>
          <div className={classes.root}>
            <GridList cellHeight={'auto'} cols={4} spacing={20} className={classes.gridList}>
              {!pics_mar?'':pics_mar.map(pic => (
                <GridListTile key={pic.pic_src}>
                  <img src={pic.pic_src} alt={pic.title} />
                  <GridListTileBar
                    title={pic.title}
                    subtitle={<span>by: {pic.owner}</span>}
                    actionIcon={
                      <IconButton aria-label={`info about ${pic.title}`} className={classes.icon}>
                        <InfoIcon />
                      </IconButton>
                    }
                  />
                </GridListTile>
              ))}
            </GridList>
          </div>
          
          {
          <section className="section">
            <Typography component="h3" variant="h5" className="section__header" color="secondary" gutterBottom>
              征婚
            </Typography>
            <Typography component="p" variant="h6" className="page-description" color="textSecondary">
              <a href="https://abtwallet.io/zh/" target="_blank">ABT钱包</a>扫码支付后查看详细资料
            </Typography>
            <Grid container spacing={6} className="grid-cards">
              {pics_mar?pics_mar.map(x => renderPaymentPicListCard(x)):''}
            </Grid>
            <LocaleProvider locale={zh_CN}>
              <div style={{ margin: 20 }}>
                <Pagination showQuickJumper defaultCurrent={1} defaultPageSize={pic_mar_num_one_page} total={pics_mar_total} onChange={this.onMarPicsPageChange} />
              </div>
            </LocaleProvider>
          </section>
          }
          {
          <section className="section">
            <Typography component="h3" variant="h5" className="section__header" color="textSecondary" gutterBottom>
              私藏
            </Typography>
            <Typography component="p" variant="h6" className="page-description" color="textSecondary">
              <a href="https://abtwallet.io/zh/" target="_blank">ABT钱包</a>扫码支付后查看高清图片
            </Typography>
            <Grid container spacing={6} className="grid-cards">
              {pics_ent?pics_ent.map(x => renderPaymentPicListCard(x)):''}
            </Grid>
            <LocaleProvider locale={zh_CN}>
              <div style={{ margin: 20 }}>
                <Pagination showQuickJumper defaultCurrent={1} defaultPageSize={pic_ent_num_one_page} total={pics_ent_total} onChange={this.onEntPicsPageChange} />
              </div>
            </LocaleProvider>
          </section>
          }
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

App.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(App);
