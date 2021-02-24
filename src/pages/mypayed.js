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
import reqwest from 'reqwest';
import api from '../libs/api';

const isProduction = process.env.NODE_ENV === 'production';

function unique(arr) {
  return arr.filter(function(item, index, arr) {
    //当前元素，在原始数组中的第一个索引==当前索引值，否则返回当前元素
    return arr.indexOf(item, 0) === index;
  });
}

//Picture number of one page
const pic_num_one_page=8;

const renderMyPayedPicsCard = x => (
  <Grid key={x.title} item xs={12} sm={6} md={3} className="grid-item">
    <Card className="payment-pic-list">
      <CardContent>
        <Typography component="p" color="primary" gutterBottom>
          {x.title} - {x.worth} {x.token_sym}
        </Typography>
        <Typography href={x.link} component="a" variant="h6" color="inherit" gutterBottom>
          <img className="pic-list" src={x.hd_src} alt={x.title} height="225" width="225" />
        </Typography>
        <Typography component="p" color="primary" gutterBottom>
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
      data: [],
      pagination: {
        pageSize: pic_num_one_page,
        current: 1,
        total: 0
      },
      loading: false,
    };
    
    this.onPageChange = this.onPageChange.bind(this);
  }
  
  /*Fetch App data*/
  async fetchAppData(){
    try {
      const { status, data} = await api.get('/api/did/session');
      this.setState({session: data});
      if(data && data.user){
        this.fetchMyPayedPics();
      }
    } catch (err) {
    }
    return {};
  }
  
  /*Fetch my payed pics*/
  fetchMyPayedPics = (params = {}) => {
    const session = this.state.session;
    let user_did = null;
    
    if(Object.keys(params).length == 0){
      console.log('params is null, load defaults');
      params['results'] = pic_num_one_page;  /*每页记录条数*/
      params['page'] = 1;                    /*第1页*/
      console.log('params:', params);
    }else{
      console.log('params:', params);
    }
    
    if(session && session.user){
      user_did = session.user.did;
    }
    
    this.setState({ loading: true });
    reqwest({
      url: '/api/getpics',
      method: 'get',
      data: {
        cmd: 'GetMyPayedPics0x6bcf96c031676b17cf58dcdccefd439b909779fb',
        user_did: user_did,
        module: 'picture',
        results: pic_num_one_page,
        ...params,
      },
      type: 'json',
    }).then(data => {
      /*response object
       *totalCount: record number
       *results: picutre array
       */
      const pagination = { ...this.state.pagination };
      // Read total count from server
      pagination.total = data.totalCount;
      
      console.log('fetchMyPayedPics pagination='+JSON.stringify(pagination));
      //console.log('fetchMyPayedPics data='+JSON.stringify(data.results));
      
      this.setState({
        loading: false,
        data: data.results,
        pagination,
      });
    });
  };
  
  /*component mount process*/
  componentDidMount() {
    window.document.oncontextmenu = function(){ 
      //disable rigth click menu
      return false;
    }
    this.fetchAppData();
  }
  
  /*component unmount process*/
  componentWillUnmount() {
  }
  
  onPageChange(pageNumber) {
    console.log('Page: ', pageNumber);
    const pagination = { ...this.state.pagination };
    pagination.current = parseInt(pageNumber);
    
    this.fetchMyPayedPics({
      results: pagination.pageSize,
      page: pagination.current,
    });
  }
  
  render() {
    const session = this.state.session;
    //console.log('render session=', session);
    //console.log('render props=', this.props);
    
    if (!session) {
      return (
        <Layout title="myPayed">
          <Main>
            <CircularProgress />
          </Main>
        </Layout>
      );
    }
    
    if ( isProduction && !session.user) {
      console.log('render user not exist');
      window.location.href = '/?openLogin=true';
      return null;
    }
    
    const { user, token } = session;
    //console.log('render session.user=', user);
    //console.log('render session.token=', token);
    
    return (
      <Layout title="myPayed">
        <Main>
          <section className="section">
            <Typography component="h3" variant="h5" className="section__header" color="textPrimary" gutterBottom>
              已付列表
            </Typography>
            <Grid container spacing={6} className="grid-cards">
              {(this.state.data && this.state.data.length>0)?this.state.data.map(x => renderMyPayedPicsCard(x)):''}
            </Grid>
            <LocaleProvider locale={zh_CN}>
              <div className="pagination">
                <Pagination showQuickJumper defaultCurrent={1} defaultPageSize={pic_num_one_page} total={this.state.pagination.total} onChange={this.onPageChange} />
              </div>
            </LocaleProvider>
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
    .pagination {
      margin: 20px 0 0;
      display: flex;
      justify-content: center;
      align-items: center;
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