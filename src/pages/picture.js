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
import { LocaleProvider, Pagination, Carousel, Tabs, Icon, Rate } from 'antd';
import zh_CN from 'antd/lib/locale-provider/zh_CN'
import 'antd/dist/antd.css';

const { TabPane } = Tabs;

import Layout from '../components/layout';
import api from '../libs/api';
import env from '../libs/env';

const admin_account = env.appAdminAccounts;
const isProduction = process.env.NODE_ENV === 'production';

import { fetchPicsNum, fetchPreviewPics } from '../hooks/picture';

//Picture number of one page
const pic_mar_num_one_page=4;
const pic_ent_num_one_page=8;
const tab_pic_num_one_page=8;

/*Picture category list and default value*/
const pics_category_list = ['hot', 'entertainment', 'marriage'];
const pics_category_default = pics_category_list[1];

const renderPaymentPicListCard = x => (
  <Grid key={x.link} item xs={12} sm={6} md={3} className="grid-item">
    <Card className="payment-pic-list">
      <CardContent>
        <Typography component="p" color="primary" className="payment-pic-list-title" gutterBottom>
          {x.title} - {x.worth} {x.token_sym}
        </Typography>
        <Typography href={x.link} component="a" variant="h6" color="inherit" gutterBottom>
          <img className="pic-list" src={x.pic_src} alt={x.title} height="225" width="225" />
        </Typography>
        <Typography component="p" color="primary" className="payment-pic-list-description" gutterBottom>
          {x.owner}：{x.description}
        </Typography>
      </CardContent>
    </Card>
  </Grid>
);

const renderHotPicListCard = x => (
  <Grid key={x.link} item xs={12} sm={6} md={3} className="grid-item">
    <Card className="payment-pic-list">
      <CardContent>
        <Typography component="p" color="primary" className="payment-pic-list-title" gutterBottom>
          {x.title} - {x.worth} {x.token_sym}
        </Typography>
        <Typography href={x.link} component="a" variant="h6" color="inherit" gutterBottom>
          <img className="pic-list" src={x.pic_src} alt={x.title} height="225" width="225" />
        </Typography>
        <Typography component="p" color="primary" className="payment-pic-list-description" gutterBottom>
          {/*<span style={{ color: '#FF0033' }}>热门指数：{x.hot_index}</span> <br/>*/}
          <Rate disabled allowHalf={true} count={6} value={x.star_level} style={{ fontSize: '14px', color: '#FF0000' }}/> <br/>
          {x.owner}：{x.description}
        </Typography>
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
      session: null,
      category: pics_category_default,
      currPage: 1,
      tab_pics: null,
      tab_pics_total: null,
      pics_ent: null,
      pics_ent_total: null,
      pics_mar: null,
      pics_mar_total: null,
    };
    
    this.onPicsCategoryChange = this.onPicsCategoryChange.bind(this);
    this.onTabUpload = this.onTabUpload.bind(this);
    this.onTabPicsPageChange = this.onTabPicsPageChange.bind(this);
    this.onEntPicsPageChange = this.onEntPicsPageChange.bind(this);
    this.onMarPicsPageChange = this.onMarPicsPageChange.bind(this);
  }
  
  /*Fetch App data*/
  async fetchAppData(){
    try {
      const { status, data} = await api.get('/api/did/session_user_only');
      this.setState({session: data});
    } catch (err) {
      console.log('fetchAppData err', err);
    }
    return {};
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
  
  async fetchTabPics(strCategory, pageNumber){
    try {
      console.log('fetchTabPics, strCategory=', strCategory, 'pageNumber=', pageNumber);
      fetchPicsNum('approved', strCategory).then((v)=>{
        console.log('tab_pics_total update to', v);
        this.setState({tab_pics_total: v});
      });
      
      var pic_num_one_page = tab_pic_num_one_page;
      
      fetchPreviewPics(strCategory, (pageNumber-1)*pic_num_one_page, pic_num_one_page).then((v)=>{
        this.setState({tab_pics: v});
      });
    } catch (err) {
      console.log('fetchTabPics err=', err);
    }
    return {};
  }
  
  /*component mount process*/
  componentDidMount() {
    window.document.oncontextmenu = function(){ 
      //disable rigth click menu
      return false;
    }
    
    /*parse location hash to object*/
    /*location hash example: #category=entertainment&page=2 */
    const location_hash = window.location.hash.slice(1);
    var hashObj = {};
    if(typeof(location_hash) != "undefined" && location_hash && location_hash.length > 0) {
      const hashArr = location_hash.split('&');
      //console.log('hashArr=', hashArr);
      for(var i in hashArr){
        var hashData = hashArr[i].toString().split('=');
        if(hashData.length > 1){
          hashObj[hashData[0]] = (hashData[1].split('?'))[0];
        }else{
          hashObj[hashData[0]] = '';
        }
      }
      if(JSON.stringify(hashObj) != "{}"){
        console.log('hashObj=', hashObj);
      }
    }
    if(hashObj != null 
      && JSON.stringify(hashObj) != "{}"
      && (typeof(hashObj.category) != "undefined")
      && (typeof(hashObj.page) != "undefined")
      && hashObj.category != ''
      && -1 != pics_category_list.indexOf(hashObj.category)
      && hashObj.page != ''){
      this.setState({
        category: hashObj.category,
        currPage: parseInt(hashObj.page, 10)
       },()=>{
        console.log('componentDidMount location category=', this.state.category, 'currPage=', this.state.currPage);
        this.fetchAppData();
        this.fetchTabPics(this.state.category, this.state.currPage);
      });
    }else{
      console.log('componentDidMount default category=', this.state.category, 'currPage=', this.state.currPage);
      this.fetchAppData();
      this.fetchTabPics(this.state.category, this.state.currPage);
    }
  }
  
  /*component unmount process*/
  componentWillUnmount() {
  }
  
  onPicsCategoryChange = value => {
    console.log('onPicsCategoryChange value=', value);
    
    this.setState({
      category: value,
      currPage: 1,
      tab_pics: null,
      tab_pics_total: null
    },()=>{
      const location_hash = '#category='+this.state.category+'&page='+String(this.state.currPage);
      window.location.hash = location_hash;
      this.fetchTabPics(this.state.category, this.state.currPage);
    });
  }
 
  onTabPicsPageChange(pageNumber) {
    console.log('onTabPicsPageChange Page: ', pageNumber);
    this.setState({currPage: pageNumber},()=>{
      const location_hash = '#category='+this.state.category+'&page='+String(this.state.currPage);
      window.location.hash = location_hash;
      this.fetchTabPics(this.state.category, this.state.currPage);
    });
  }
  
  onEntPicsPageChange(pageNumber) {
    console.log('onEntPicsPageChange Page: ', pageNumber);
    this.fetchPics('entertainment', pageNumber);
  }
  
  onMarPicsPageChange(pageNumber) {
    console.log('onMarPicsPageChange Page: ', pageNumber);
    this.fetchPics('marriage', pageNumber);
  }
  
  onEntUpload() {
    window.location.href = '/upload?asset_type=entertainment';
  };
  
  onMarUpload() {
    window.location.href = '/upload?asset_type=marriage';
  };
  
  onTabUpload() {
    switch(this.state.category){
      case 'entertainment':
        window.location.href = '/upload?asset_type=entertainment';
        break;
      case 'marriage':
        window.location.href = '/upload?asset_type=marriage';
        break;
      default:
        window.location.href = '/upload?asset_type=entertainment';
        break;
    }
  };
  
  render() {
    const session = this.state.session;
    const {category, tab_pics, tab_pics_total, currPage} = this.state;
    
    if (!session || tab_pics_total === null) {
      return (
        <Layout title="ABT图片">
          <Main>
            <CircularProgress />
          </Main>
        </Layout>
      );
    }
    
    const { user } = session;
    
    //console.log('tab_pics=', tab_pics);
    console.log('tab_pics_total=', tab_pics_total);
    console.log('currPage=', currPage);
    
    /*
    var show_upload_permistion = false;
    if(isProduction){
      if( user && (-1 != admin_account.indexOf(user.did)) ){
        switch(category){
          case pics_category_list[0]:
            show_upload_permistion = false;
          break;
          default:
            show_upload_permistion = true;
            break;
        }
      }else{
        show_upload_permistion = false;
      }
    }else{
      show_upload_permistion = true;
    }
    */
    var show_upload_permistion = true;
    
    /*
    var show_hot_permistion = false;
    if(isProduction){
      if( user && (-1 != admin_account.indexOf(user.did)) ){
        show_hot_permistion = true;
      }else{
        show_hot_permistion = false;
      }
    }else{
      show_hot_permistion = true;
    }
    */
    var show_hot_permistion = true;
    
    return (
      <Layout title="ABT图片">
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
          {
          <div className="section-header">
            <Typography component="p" variant="h6" color="textSecondary" className="nav-left">
              使用<a href="https://abtwallet.io/zh/" target="_blank">ABT钱包</a>支付查看
            </Typography>
            {show_upload_permistion && (
              <Button color={category===pics_category_list[2]?"secondary":"primary"} variant="contained" onClick={this.onTabUpload} className="nav-right">
                上传
              </Button>
            )}
          </div>
          }
          <Tabs defaultActiveKey={category} 
            onChange={this.onPicsCategoryChange}
            tabPosition="top"
            tabBarGutter={10}
            className="antd-tabs"
          >
            { show_hot_permistion && (<TabPane tab={<span style={{ fontSize: '20px', color: '#0' }}><Icon type="fire" theme="twoTone" twoToneColor="#FF0000" />热门</span>} key={pics_category_list[0]}>
            </TabPane>)}
            <TabPane tab={<span style={{ fontSize: '20px', color: '#0' }}>私藏</span>} key={pics_category_list[1]}>
            </TabPane>
            <TabPane tab={<span style={{ fontSize: '20px', color: '#0' }}>征婚</span>} key={pics_category_list[2]}>
            </TabPane>
          </Tabs>
          {
          <section className="section">
            <Grid container spacing={6} className="grid-cards">
              {tab_pics?
                (category==='hot'?tab_pics.map(x => renderHotPicListCard(x)):tab_pics.map(x => renderPaymentPicListCard(x)))
                :''}
            </Grid>
            <LocaleProvider locale={zh_CN}>
              <div className="pagination">
                <Pagination showQuickJumper defaultCurrent={currPage} defaultPageSize={tab_pic_num_one_page} current={currPage} total={tab_pics_total} onChange={this.onTabPicsPageChange} />
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
  
  .antd-tabs{
    margin-bottom: 10px;
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    
   .nav-left {
      font-size: 1.0rem;
      font-family: "Roboto", "Helvetica", "Arial", sans-serif;
      font-weight: 500;
      margin-right: 10px;
    }
    
    .nav-right {
      font-size: 1.0rem;
      font-family: "Roboto", "Helvetica", "Arial", sans-serif;
      font-weight: 500;
      margin-left: 10px;
    }
    margin-bottom: 10px;
  }
  
  .section {
    margin-bottom: 50px;
    .section__header {
      margin-bottom: 20px;
    }
    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }

  .grid-cards {
    margin-bottom: 10px;
    .grid-item {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .payment-pic-list {
    height: 320px;
    width: 260px;
    
    .payment-pic-list-title{
      font-size: 1.0rem;
      font-family: Helvetica, 'Hiragino Sans GB', 'Microsoft Yahei', '微软雅黑', Arial, sans-serif;
      font-weight: 100;
      color: #000000;
    }
    
    .payment-pic-list-description{
      font-size: 1.0rem;
      font-family: Helvetica, 'Hiragino Sans GB', 'Microsoft Yahei', '微软雅黑', Arial, sans-serif;
      font-weight: 100;
      color: #3CB371;
    }
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
