/* eslint-disable react/jsx-one-expression-per-line */
import React, { Component } from 'react';
import styled from 'styled-components';
import qs from 'querystring';
import useAsyncFn from 'react-use/lib/useAsyncFn';
import useToggle from 'react-use/lib/useToggle';
import { fromUnitToToken } from '@arcblock/forge-util';
import CircularProgress from '@material-ui/core/CircularProgress';
import { 
  LocaleProvider, 
  List,
  Menu,
  Upload, 
  Icon, 
  Modal, 
  Button, 
  message, 
  Typography, 
  Input, 
  Tooltip
} from "antd";

const { SubMenu } = Menu;

import zh_CN from 'antd/lib/locale-provider/zh_CN'
import reqwest from 'reqwest';
import 'antd/dist/antd.css';
import Auth from '@arcblock/did-react/lib/Auth';

import Layout from '../components/layout';
import useSession from '../hooks/session';
import forge from '../libs/sdk';
import api from '../libs/api';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

const isProduction = process.env.NODE_ENV === 'production';

const asset_items_one_page = 20;

/*https://opensea.io/rankings*/
const nft_category_info = [
  {
    category: 'All',
    contract_address: '',
  },
  {
    category: 'HyperDragons',
    contract_address: '0x7fdcd2a1e52f10c28cb7732f46393e297ecadda1',
  },
  {
    category: 'KnightStory',
    contract_address: '0x2fb5d7dda4f1f20f974a0fdd547c38674e8d940c',
  },
  {
    category: 'CryptoKitties',
    contract_address: '0x06012c8cf97bead5deae237070f9587f8e7a266d',
  },
  {
    category: 'ZedRun',
    contract_address: '0xff488fd296c38a24cccc60b43dd7254810dab64e',
  },
  {
    category: 'Decentraland',
    contract_address: '0xf87e31492faf9a91b02ee0deaad50d51d56d5d4d',
  },
  {
    category: 'UrbitId',
    contract_address: '0x6ac07b7c4601b5ce11de8dfe6335b871c7c4dd4d',
  },
  {
    category: 'UnstoppableDomains',
    contract_address: '0xd1e5b0ff1287aa9f9a268759062e4ab08b9dacbe',
  },
  {
    category: 'Colorglyphs',
    contract_address: '0x60f3680350f65beb2752788cb48abfce84a4759e',
  },
  {
    category: 'Clovers',
    contract_address: '0xb55c5cac5014c662fdbf21a2c59cd45403c482fd',
  },
  {
    category: 'Skeenee',
    contract_address: '0xf31d7d9e68562e2b7100e83b500e07ea5fbf9e08',
  },
  {
    category: 'CaesarsTriumph',
    contract_address: '0xe60d2325f996e197eedded8964227a0c6ca82d0f',
  },
  {
    category: 'Kudos',
    contract_address: '0x2aea4add166ebf38b63d09a75de1a7b94aa24163',
  },
  {
    category: 'ChainFaces',
    contract_address: '0x91047abf3cab8da5a9515c8750ab33b4f1560a7a',
  },
];

const renderNftCategoryMenu = x => (
  <Menu.Item key={x.category}>
    {x.category}
  </Menu.Item>
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
      asset_category: 'HyperDragons',
      asset_offset: 0,
      assets: [],
      pagination: {},
      loading: false,
      more_to_load: true,
    };
    
    this.fetchNftAssets = this.fetchNftAssets.bind(this);
  }
  
  /*Fetch App data*/
  fetchAppData = async () => {
    try {
      const { status, data} = await api.get('/api/did/session');
      this.setState({session: data});
    } catch (err) {
    }
    return {};
  }
  
  /*Fetch NTF Assets*/
  fetchNftAssets = async (load_more_state=false) => {
    const asset_category = this.state.asset_category;
    let nft_category_item = null;
    let nft_contract_address = 0x06012c8cf97bead5deae237070f9587f8e7a266d;
    
    this.setState({ loading: true });
    
    nft_category_item = nft_category_info.find( function(x){
      return x.category === asset_category;
    });
    if(nft_category_item){
      nft_contract_address = nft_category_item.contract_address;
    }
    
    /*API: https://docs.opensea.io/reference#getting-assets*/
    reqwest({
      url: 'https://api.opensea.io/api/v1/assets/',
      method: 'get',
      data: {
        asset_contract_address: nft_contract_address,
        offset: this.state.asset_offset,
        limit: asset_items_one_page,
        on_sale: true,
      },
      type: 'json',
    }).then(data => {
      const pagination = { ...this.state.pagination };
      let more_to_load = false;
      let nft_assets = this.state.assets;

      if(data && data.assets && data.assets.length > 0){
        console.log('data.assets.length='+JSON.stringify(data.assets.length));
        
        pagination.pageSize = asset_items_one_page;
        pagination.total = data.assets.length;
        if(data.assets.length >= asset_items_one_page){
          more_to_load = true;
        }
        if(load_more_state){
          nft_assets = nft_assets.concat(data.assets);
        }else{
          nft_assets = data.assets;
        }
      }
      
      console.log('pagination='+JSON.stringify(pagination));
      console.log('nft_assets.length='+JSON.stringify(nft_assets.length));
      
      this.setState({
        loading: false,
        assets: nft_assets,
        more_to_load: more_to_load,
        pagination,
      });
    });
  };
  
  handleMenuClick = e => {
    this.setState({
      asset_category: e.key,
      more_to_load: true,
      asset_offset: 0,
      assets: [],
      pagination: {},
    },()=>{
      console.log('handleMenuClick asset_category=', this.state.asset_category);
      window.location.hash = `#category=${e.key}`;
      this.fetchNftAssets();
    });
  };
  
  /*Assets Load more */
  onAssetsLoadMore = () => {
    const more_to_load = this.state.more_to_load;
    const asset_offset = this.state.asset_offset;
    
    if(more_to_load){
      this.setState({
        asset_offset: asset_offset+asset_items_one_page,
      },()=>{
        this.fetchNftAssets(true);
      });
    }
  };
  
  onAssetsLoadMoreBack = () => {
    this.setState({
      more_to_load: true,
      assets: [],
      asset_offset: 0,
    },()=>{
      this.fetchNftAssets();
    });
  };
  
  /*component mount process*/
  componentDidMount() {
    const location_hash = window.location.hash.slice(1);
    if(typeof(location_hash) != "undefined" && location_hash && location_hash.length > 0) {
      const hashArr = location_hash.split('?');
      const params = qs.parse(hashArr[0]);
      if(params.category){
        this.setState({
          asset_category: params.category
        },()=>{
          console.log('componentDidMount asset_category=', this.state.asset_category);        
          this.fetchNftAssets();
        });
      }else{
        this.fetchNftAssets();
      }
    }else{
      this.fetchNftAssets();
    }
  }
  
  /*component unmount process*/
  componentWillUnmount() {
  }
  
  render() {
    const assets = this.state.assets;
    if(!assets || assets.length == 0){
      return (
        <Layout title="NFT">
          <Main>
            <Menu onClick={this.handleMenuClick} selectedKeys={[this.state.asset_category]} mode="horizontal">
              {nft_category_info.map(x => renderNftCategoryMenu(x))}
            </Menu>
            <br/>
            <CircularProgress />
          </Main>
        </Layout>
      );
    }
     
    return (
      <Layout title="NFT">
        <Main>
          <LocaleProvider locale={zh_CN}>
            <Menu onClick={this.handleMenuClick} selectedKeys={[this.state.asset_category]} mode="horizontal">
              {nft_category_info.map(x => renderNftCategoryMenu(x))}
            </Menu>
            <List
              itemLayout="vertical"
              size="large"
              pagination={null}
              dataSource={this.state.assets}
              footer={null}
              renderItem={item => (
                <List.Item
                  key={item.permalink}
                  actions={null}
                  extra={null}
                >
                  <nft-card
                    tokenAddress={item.asset_contract.address}
                    tokenId={item.token_id}
                    width='100%'
                  >
                  </nft-card>
                </List.Item>
              )}
            />
            <div align="center">
              <Button onClick={this.onAssetsLoadMore} disabled={this.state.more_to_load == false} loading={this.state.loading} style={{ fontSize: '13px', color: '#0000FF', marginRight: 20 }}><Icon type="caret-down" />更多</Button>
              <Button onClick={this.onAssetsLoadMoreBack} loading={this.state.loading} style={{ fontSize: '13px', color: '#009933' }}><Icon type="caret-up" />返回</Button>
            </div>
          </LocaleProvider>
        </Main>
      </Layout>
    );
  }
}

const Main = styled.main`
  margin: 20px 0 0;
  
`;

export default App;