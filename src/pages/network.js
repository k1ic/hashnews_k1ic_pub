/* eslint-disable react/jsx-one-expression-per-line */
import React, { Component } from 'react';
import { Route, Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import qs from 'querystring';
import styled from 'styled-components';
import useAsyncFn from 'react-use/lib/useAsyncFn';
import useToggle from 'react-use/lib/useToggle';
import { fromUnitToToken } from '@arcblock/forge-util';
import CircularProgress from '@material-ui/core/CircularProgress';
import {
  LocaleProvider, 
  Upload,
  Icon,
  Modal,
  Button,
  message,
  Typography,
  Input,
  Tooltip,
  Tabs,
  Table,
  Descriptions
} from "antd";
import zh_CN from 'antd/lib/locale-provider/zh_CN'
import reqwest from 'reqwest';
import 'antd/dist/antd.css';
import Auth from '@arcblock/did-react/lib/Auth';

import Layout from '../components/layout';
import SearchBox from '../components/search_box2';
import useSession from '../hooks/session';
import theme from '../libs/theme';
import forge from '../libs/sdk';
import api from '../libs/api';
import { getUserDidFragment } from '../libs/user';
import env from '../libs/env';

const history = createMemoryHistory();
const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;

const isProduction = process.env.NODE_ENV === 'production';

const chain_asset_page_size=10;
const chain_account_page_size=20;

const renderTabPaneList = (x) => (
  <TabPane tab={x.name.substring(0,1).toUpperCase()+x.name.substring(1)} key={x.name}>
  </TabPane>
);

const AssetsColumns = [
  {
    title: 'Moniker',
    dataIndex: 'moniker',
    key: 'moniker',
    render: (text, record) => (
      <a href={record.asset_link} target="_blank">{text}</a>
    ),
  },
  {
    title: 'Hash',
    dataIndex: 'hash_link',
    key: 'hash_link',
    render: link => <a href={link} target="_blank">哈希</a>,
  },
  {
    title: 'Time',
    dataIndex: 'time',
    key: 'time',
  },
];


const AccountsColumns = [
  {
    title: 'Rank',
    key: 'Rank',
    render: (text, record, index) => (
      <span>{index+1}</span>
    ),
  },
  /*
  {
    title: 'Moniker',
    dataIndex: 'moniker',
    key: 'moniker',
    render: (text, record) => (
      <a href={record.account_link} target="_blank">{text}</a>
    ),
  },
  */
  {
    title: 'Account',
    dataIndex: 'address',
    key: 'address',
    render: (text, record) => (
      <a href={record.account_link} target="_blank">{getUserDidFragment(text)}</a>
    ),
  },
  {
    title: 'Balance',
    dataIndex: 'balance',
    key: 'balance',
  },
  /*
  {
    title: 'Assets',
    dataIndex: 'numAssets',
    key: 'numAssets',
  },
  {
    title: 'Txs',
    dataIndex: 'numTxs',
    key: 'numTxs',
  },
  */
];


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
      datachains_list: [],
      chain_name: 'xenon',
      chain_token_symbol: '',
      chain_node_info: null,
      chain_assets: [],
      chain_accounts: [],
      chain_assets_page_cursor: '',
      chain_assets_page_next: true,
      chain_assets_page_total: 0,
      chain_accounts_page_cursor: '',
      chain_accounts_page_next: true,
      chain_accounts_page_total: 0,
      nodeinfo_loading: false,
      assets_loading: false,
      accounts_loading: false,
    };
  }
  
  /*Fetch data chains list*/
  async fetchDatachains(){
    reqwest({
      url: '/api/datachainsget',
      method: 'get',
      data: {
        cmd: 'getChainNodes',
        data_chain_name: 'all',
      },
      type: 'json',
    }).then(data => {
      if(data && data.length > 0){
      
        data = data.filter(function (e) {
          if(env.chainName != 'xenon'){
            //return e.name != 'xenon';
            return true;
          }else{
            return true;
          }
        });
          
        this.setState({
          datachains_list: data,
        }, ()=>{
          this.fetchNodeInfo();
          this.fetchAssets(true);
          this.fetchAccounts(true);
        });
      }
    });
  }
  
  /*Fetch node info*/
  async fetchNodeInfo(){
    this.setState({
      nodeinfo_loading: true
    });
    
    reqwest({
      url: '/api/datachainsget',
      method: 'get',
      data: {
        cmd: 'getNodeInfo',
        chainName: this.state.chain_name,
      },
      type: 'json',
    }).then(data => {
      if(data){
        this.setState({
          nodeinfo_loading: false,
          chain_node_info: data,
        }, ()=>{
          console.log('fetchNodeInfo chain_node_info='+ JSON.stringify(this.state.chain_node_info));
        });
      }
    });
  }
  
  /*Fetch assets*/
  async fetchAssets(bInitial){
    this.setState({
      assets_loading: true
    });
    
    reqwest({
      url: '/api/datachainsget',
      method: 'get',
      data: {
        cmd: 'listAssets',
        chainName: this.state.chain_name,
        pagingCursor: bInitial?'':this.state.chain_assets_page_cursor,
        pagingSize: chain_asset_page_size,
      },
      type: 'json',
    }).then(data => {
      if(data){
        this.setState({
          assets_loading: false,
          chain_assets_page_cursor: data.page.cursor,
          chain_assets_page_next: data.page.next,
          chain_assets_page_total: data.page.total,
        }, ()=>{
          console.log('fetchAssets cursor='+this.state.chain_assets_page_cursor+' next='+this.state.chain_assets_page_next+' total='+this.state.chain_assets_page_total);
        });
        
        if(bInitial){
          this.setState({
            chain_assets: data.assets,
          }, ()=>{
            console.log('fetchAssets init chain_assets.length='+this.state.chain_assets.length);
            //console.log('fetchAssets init chain_assets='+this.state.chain_assets);
          });
        }else{
          let chain_assets = this.state.chain_assets;
          if(chain_assets && chain_assets.length > 0){
            chain_assets = chain_assets.concat(data.assets);
          }else{
            chain_assets = data.assets;
          }
          this.setState({
            chain_assets: chain_assets,
          }, ()=>{
            console.log('fetchAssets more chain_assets.length='+this.state.chain_assets.length);
            //console.log('fetchAssets more chain_assets='+this.state.chain_assets);
          });
        }
      }
    });
  }
  
  /*Fetch top accounts*/
  async fetchAccounts(bInitial){
    this.setState({
      accounts_loading: true
    });
    
    reqwest({
      url: '/api/datachainsget',
      method: 'get',
      data: {
        cmd: 'listTopsAccouts',
        chainName: this.state.chain_name,
        pagingCursor: bInitial?'':this.state.chain_accounts_page_cursor,
        pagingSize: chain_account_page_size,
      },
      type: 'json',
    }).then(data => {
      if(data){
        this.setState({
          accounts_loading: false,
          chain_token_symbol: data.token.symbol,
          chain_accounts_page_cursor: data.page.cursor,
          chain_accounts_page_next: data.page.next,
          chain_accounts_page_total: data.page.total,
        }, ()=>{
          console.log('fetchAccounts cursor='+this.state.chain_accounts_page_cursor+' next='+this.state.chain_accounts_page_next+' total='+this.state.chain_accounts_page_total);
        });
        
        if(bInitial){
          this.setState({
            chain_accounts: data.accounts,
          }, ()=>{
            console.log('fetchAccounts init chain_accounts.length='+this.state.chain_accounts.length);
            //console.log('fetchAccounts init chain_accounts='+this.state.chain_accounts);
          });
        }else{
          let chain_accounts = this.state.chain_accounts;
          if(chain_accounts && chain_accounts.length > 0){
            chain_accounts = chain_accounts.concat(data.accounts);
          }else{
            chain_accounts = data.accounts;
          }
          this.setState({
            chain_accounts: chain_accounts,
          }, ()=>{
            console.log('fetchAccounts more chain_accounts.length='+this.state.chain_accounts.length);
            //console.log('fetchAccounts more chain_accounts='+this.state.chain_accounts);
          });
        }
      }
    });
  }
  
  /*Fetch App data*/
  async fetchAppData(){
    try {
      const { status, data} = await api.get('/api/did/session');
      this.setState({session: data});
    } catch (err) {
    }
    return {};
  }
  
  /*component mount process*/
  componentDidMount() {
    const location_hash = window.location.hash.slice(1);
    if(typeof(location_hash) != "undefined" && location_hash && location_hash.length > 0) {
      const hashArr = location_hash.split('?');
      const params = qs.parse(hashArr[0]);
      if(params.name){
        this.setState({
          chain_name: params.name
        },()=>{
          console.log('componentDidMount chain_name=', this.state.chain_name);        
          this.fetchDatachains();
        });
      }else{
        this.fetchDatachains();
      }
    }else{
      this.fetchDatachains();
    }
  }
  
  /*component unmount process*/
  componentWillUnmount() {
  }
  
  handleChainNameChange = value => {    
    console.log('handleChainNameChange value=', value);
    
    this.setState({
      chain_name: value,
      chain_token_symbol: '',
      chain_node_info: null,
      chain_assets: [],
      chain_accounts: [],
      chain_assets_page_cursor: '',
      chain_assets_page_next: true,
      chain_assets_page_total: 0,
      chain_accounts_page_cursor: '',
      chain_accounts_page_next: true,
      chain_accounts_page_total: 0,
    }, ()=>{
      window.location.hash = `#name=${value}`;
      this.fetchNodeInfo();
      this.fetchAssets(true);
      this.fetchAccounts(true);
    });
  }
  
  /*Assets Load more */
  onAssetsLoadMore = () => {
    this.fetchAssets(false);
  };
  
  onAssetsLoadMoreBack = () => {
    this.fetchAssets(true);
  };
  
  /*Top accounts load more */
  onAccountsLoadMore = () => {
    this.fetchAccounts(false);
  };
  
  onAccountsLoadMoreBack = () => {
    this.fetchAccounts(true);
  };
  
  render() {
    const {
      datachains_list, 
      chain_name,
      chain_token_symbol,
      chain_node_info,
      chain_assets,
      chain_accounts,
    } = this.state;
    return (
      <Layout title="ABT链网">
        <Main>
          <div>
            <div style={{ float: 'left', width: '20%', fontSize: '16px', color: '#000000', marginTop: 5, marginRight: 0}}>
              全网搜索
            </div>
            <div>
              <SearchBox history={history} theme={theme} chains={datachains_list} style={{ width: '80%' }}/>
            </div>
            {/*<div>
              <Router history={history}>
                <SearchBox history={history} theme={theme} chains={datachains_list}/>
              </Router>
            </div>*/}
          </div>
          <div style={{ margin: '10px 0' }}/>
          <Tabs activeKey={chain_name} 
            onChange={this.handleChainNameChange}
            type="card"
            tabBarStyle={{background:'#fff'}}
            tabPosition="top"
            tabBarGutter={0}
            animated={false}
          >
            {datachains_list.map(x => renderTabPaneList(x))}
          </Tabs>
          {(chain_node_info != null) && (
            <div style={{ margin: '10px 0' }}>
              <Descriptions
                title={<div align='center'>Node Info</div>}
                size={'small'}
                bordered
                column={{ xxl: 4, xl: 3, lg: 3, md: 3, sm: 2, xs: 1 }}
              >
                <Descriptions.Item label="Host"><a href={chain_node_info.chainHost} target="_blank" style={{ fontSize: '18px', fontWeight: 600 }}>{chain_node_info.chainName}</a></Descriptions.Item>
                <Descriptions.Item label="ID"><span style={{ fontSize: '15px', fontWeight: 600, color: '#000000' }}>{chain_node_info.chainId}</span></Descriptions.Item>
                <Descriptions.Item label="Version"><span style={{ fontSize: '15px', fontWeight: 600, color: '#000000' }}>{chain_node_info.version}</span></Descriptions.Item>
                <Descriptions.Item label="Symbol"><span style={{ fontSize: '15px', fontWeight: 600, color: '#000000' }}>{chain_node_info.tokenSymbol}</span></Descriptions.Item>
                <Descriptions.Item label="TotalSupply"><span style={{ fontSize: '15px', fontWeight: 600, color: '#000000' }}>{chain_node_info.tokenTotalSupply}</span></Descriptions.Item>
                <Descriptions.Item label="Decimal"><span style={{ fontSize: '15px', fontWeight: 600, color: '#000000' }}>{chain_node_info.tokenDecimal}</span></Descriptions.Item>
                <Descriptions.Item label="AssetSize"><span style={{ fontSize: '15px', fontWeight: 600, color: '#000000' }}>{chain_node_info.maxAssetSize}</span></Descriptions.Item>
                <Descriptions.Item label="MinStake"><span style={{ fontSize: '15px', fontWeight: 600, color: '#000000' }}>{chain_node_info.minimumStake}</span></Descriptions.Item>
                <Descriptions.Item label="Accounts"><span style={{ fontSize: '15px', fontWeight: 600, color: '#000000' }}>{chain_node_info.numAccounts}</span></Descriptions.Item>
                <Descriptions.Item label="Assets"><span style={{ fontSize: '15px', fontWeight: 600, color: '#000000' }}>{chain_node_info.numAssets}</span></Descriptions.Item>
                <Descriptions.Item label="TotalTxs"><a href={chain_node_info.chainHost+'/node/explorer/txs'} target="_blank" style={{ fontSize: '15px', fontWeight: 600 }}>{chain_node_info.totalTxs}</a></Descriptions.Item>
                <Descriptions.Item label="Blocks"><a href={chain_node_info.chainHost+'/node/explorer/blocks'} target="_blank" style={{ fontSize: '15px', fontWeight: 600 }}>{chain_node_info.blockHeight}</a></Descriptions.Item>
                <Descriptions.Item label="Stakes"><span style={{ fontSize: '15px', fontWeight: 600, color: '#000000' }}>{chain_node_info.numStakes}</span></Descriptions.Item>
                <Descriptions.Item label="Validators"><span style={{ fontSize: '15px', fontWeight: 600, color: '#000000' }}>{chain_node_info.numValidators}</span></Descriptions.Item>
                <Descriptions.Item label="Peers"><a href={chain_node_info.chainHost+'/node/peers'} target="_blank" style={{ fontSize: '15px', fontWeight: 600 }}>{chain_node_info.nPeers}</a></Descriptions.Item>
              </Descriptions>
            </div>
          )}
          {(chain_assets && chain_assets.length > 0) && (
            <div style={{ margin: '20px 0' }}>
              <Table 
                columns={AssetsColumns} 
                dataSource={chain_assets} 
                pagination={false}
                loading={this.state.assets_loading}
                size={'small'}
                title={()=>
                  <div align="center">
                    <Typography component="h2" variant="h5" color="primary" style={{ fontSize: '16px'}}>
                      Assets
                    </Typography>
                    {/*<div>
                      Asset number: {this.state.chain_assets_page_total}
                    </div>*/}
                  </div>
                }
                footer={() => 
                  <div align="center">
                    <Button onClick={this.onAssetsLoadMore} disabled={this.state.chain_assets_page_next == false} loading={this.state.assets_loading} style={{ fontSize: '13px', color: '#0000FF', marginRight: 20 }}><Icon type="caret-down" />更多</Button>
                    <Button onClick={this.onAssetsLoadMoreBack} loading={this.state.assets_loading} style={{ fontSize: '13px', color: '#009933' }}><Icon type="caret-up" />返回</Button>
                  </div>
                }
              />
            </div>
          )}
          
          {(chain_accounts && chain_accounts.length > 0) && (
            <div style={{ margin: '20px 0' }}>
              <Table 
                columns={AccountsColumns} 
                dataSource={chain_accounts} 
                pagination={false}
                loading={this.state.accounts_loading}
                size={'small'}
                title={()=>
                  <div align="center">
                    <Typography component="h2" variant="h5" color="primary" style={{ fontSize: '16px'}}>
                      Top {this.state.chain_token_symbol} Accounts
                    </Typography>
                    {/*<div>
                      Account number: {this.state.chain_accounts_page_total}
                    </div>*/}
                  </div>
                }
                footer={() => 
                  <div align="center">
                    <Button onClick={this.onAccountsLoadMore} disabled={this.state.chain_accounts_page_next == false} loading={this.state.accounts_loading} style={{ fontSize: '13px', color: '#0000FF', marginRight: 20 }}><Icon type="caret-down" />更多</Button>
                    <Button onClick={this.onAccountsLoadMoreBack} loading={this.state.accounts_loading} style={{ fontSize: '13px', color: '#009933' }}><Icon type="caret-up" />返回</Button>
                  </div>
                }
              />
            </div>
          )}
          
          <LocaleProvider locale={zh_CN}>
            <div className="clearfix">
            </div>
          </LocaleProvider>
        </Main>
      </Layout>
    );
  }
}

const Main = styled.main`
  margin: 20px 0 0;
  
  .nav-left {
    display: flex;
    align-items: center;
    justify-content: flex-start;
  }
  
  .nav-right {
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }
  
`;

export default App;