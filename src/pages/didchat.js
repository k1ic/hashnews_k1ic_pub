/* eslint-disable react/jsx-one-expression-per-line */
import React, { Component } from 'react';
import styled from 'styled-components';
import useAsyncFn from 'react-use/lib/useAsyncFn';
import useToggle from 'react-use/lib/useToggle';
import { fromUnitToToken } from '@arcblock/forge-util';
import Avatar from '@arcblock/did-react/lib/Avatar';
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
  List,
  Select,
  Tabs,
  Switch
} from "antd";
import zh_CN from 'antd/lib/locale-provider/zh_CN'
import reqwest from 'reqwest';
import 'antd/dist/antd.css';
import Auth from '@arcblock/did-react/lib/Auth';

import Layout from '../components/layout';
import useSession from '../hooks/session';
import forge from '../libs/sdk';
import api from '../libs/api';
import env from '../libs/env';
import { forgeTxValueSecureConvert, HashString } from '../libs/crypto';
import { getCurrentTime } from '../libs/time';
import { getUserDidFragment } from '../libs/user';

const sleep = timeout => new Promise(resolve => setTimeout(resolve, timeout));

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;

const isProduction = process.env.NODE_ENV === 'production';

var chat_content_max_length = 200;
const list_items_per_page = 20;

/*news type default value*/
const chat_group_default = 'abt';

class App extends Component {  
  static async getInitialProps({pathname, query, asPath, req}) {
    //console.log('getInitialProps pathname=', pathname);
    console.log('getInitialProps query=', query);
    //console.log('getInitialProps asPath=', asPath);
    //console.log('getInitialProps req=', req);
    return {};
  }
  
  constructor(props) {
    super(props);
    //console.log('did chat props=', props);
    
    /*initial state*/
    this.state = {
      session: null,
      intervalIsSet: false,
      group: chat_group_default,
      content_to_send: '',
      show_mode: 'all',
      chats_list: [],
      sending: false,
      loading: false,
    };
  }
  
  /*Fetch App data*/
  async fetchAppData(){
    try {
      const { status, data} = await api.get('/api/did/session');
      this.setState({
        session: data
      },()=>{
        this.fetchChats();
      });
    } catch (err) {
    }
    return {};
  }
  
  /*Fetch chats content */
  fetchChats = (params = {}) => {
    var udid = '';
    if(this.state.loading === true){
      console.log('fetchChats is loading');
      return;
    }
    
    console.log('Start fetchChats');
    
    this.setState({
      loading: true
    });
      
    var udid_to_show = '';
    if(this.state.session && this.state.session.user){
      udid = this.state.session.user.did;
      if(this.state.show_mode === 'mine'){
        udid_to_show = this.state.session.user.did;
      }
    }
    
    reqwest({
      url: '/api/didchatget',
      method: 'get',
      data: {
        group: this.state.group,
        udid_to_show: udid_to_show,
        ...params,
      },
      type: 'json',
    }).then(data => {
      
      console.log('End fetchChats');
      
      this.setState({
        chats_list: data,
        loading: false
      });
    });
  };
  
  /*component mount process*/
  componentDidMount() {    
    //console.log('componentDidMount hash=', window.location.hash.slice(1));
    const location_hash = window.location.hash.slice(1);
    if(typeof(location_hash) != "undefined" && location_hash && location_hash.length > 0) {
      const hashArr = location_hash.split('?');
      this.setState({group: hashArr[0]},()=>{
        console.log('componentDidMount group=', this.state.group);        
        this.fetchAppData();
      });
    }else{
      this.fetchAppData();
    }
    
    if (! this.state.intervalIsSet) {
      let interval = setInterval(this.fetchChats, 5000);
      this.setState({ intervalIsSet: interval});
    }
  }
  
  /*component unmount process*/
  componentWillUnmount() {
    if (this.state.intervalIsSet) {
      clearInterval(this.state.intervalIsSet);
      this.setState({ intervalIsSet: null});
    }
  }
  
  handleGroupChange = value => {
    console.log('handleGroupChange value=', value);
    
    this.setState({
      group: value,
      chats_list: []
    },()=>{
       window.location.hash = `#${value}`;
      this.fetchChats();
    });
  }
  
  onShowModeChange = checked => {
    var show_mode = '';
    if(checked){
      show_mode = 'all';
    }else{
      show_mode = 'mine';
    }
    this.setState({show_mode: show_mode},()=>{
      console.log('show mode change to', this.state.show_mode);
      this.fetchChats();
    });
  }
  
  onChatContentToSendChange = ({ target: { value } }) => {
    //console.log('onChatContentToSendChange value='+value+' length='+value.length);
    this.setState({ content_to_send: value });
  };
  
  /*Send chat content handler*/
  handleSendChatContent = () => {
    const { session, group, content_to_send } = this.state;
    const { user, token } = session;
    
    console.log('handleChatContentSend');
    
    if(content_to_send.length > 0){ 
      const formData = new FormData();
        
      formData.append('user', JSON.stringify(user));
      formData.append('group', group);
      formData.append('content', content_to_send);
      
      this.setState({
        sending: true,
      });
      
      reqwest({
        url: '/api/didchatadd',
        method: 'post',
        processData: false,
        data: formData,
        success: (result) => {
          //console.log('add chat success with response=', result.response);
          this.fetchChats();
          this.setState({
            content_to_send: '',
            sending: false,
          });
        },
        error: (result) => {
          console.log('add chat error with response=', result.response);
          Modal.error({title: '发送失败'});
          this.setState({
            sending: false,
          });
        },
      });
    }
  };

  render() {
    const { session, group, content_to_send, sending } = this.state;
    //console.log('render session=', session);
    //console.log('render props=', this.props);
    
    if (!session) {
      return (
        <Layout title="DID Chat">
          <Main>
            <CircularProgress />
          </Main>
        </Layout>
      );
    }
    
    const { user, token } = session;
    //console.log('render session.user=', user);
    //console.log('render session.token=', token);
    
    /*send permission*/
    var send_permission = false;
    if(user){
      send_permission = true;
    }else{
      send_permission = false;
    }
    
    return (
      <Layout title="DID Chat">
        <Main>
          <Typography component="p" variant="h5" className="section-description" color="textSecondary">
            DID自主身份聊天
            <Switch checked={this.state.show_mode === 'all'?true:false} onChange={this.onShowModeChange} disabled={user == null} size="small" className="antd-showmode-switch"/>
            {this.state.show_mode === 'all'?'全部':'我的'}
          </Typography>
          <div style={{ margin: '24px 0' }} />
          <Tabs defaultActiveKey={group} 
            onChange={this.handleGroupChange}
            tabBarStyle={{background:'#fff'}}
            tabPosition="top"
            tabBarGutter={10}
          >
            <TabPane tab={<span style={{ fontSize: '14px', color: '#0' }}>ABT</span>} key="abt">
            </TabPane>
            <TabPane tab="其他" key="others">
            </TabPane>
          </Tabs>
          {send_permission && (<TextArea
            value={content_to_send}
            onChange={this.onChatContentToSendChange}
            placeholder={"请输入...("+chat_content_max_length+"字以内)"}
            autoSize={{ minRows: 1, maxRows: 10 }}
            maxLength={chat_content_max_length}
          />)}
          {send_permission && (<div style={{ margin: '15px 0' }} /> )}
          <div align="right">
          {send_permission && (<Button
            key="submit"
            type="primary"
            size="large"
            onClick={this.handleSendChatContent}
            disabled={content_to_send === ''}
            loading={sending}
            className="antd-button-send"
          >
            发送
          </Button> )}
          </div>
          {send_permission && <div style={{ margin: '24px 0' }} /> }
          <LocaleProvider locale={zh_CN}>
            <List
              itemLayout="vertical"
              size="large"
              pagination={{
                onChange: page => {
                  console.log(page);
                },
                pageSize: list_items_per_page,
              }}
              dataSource={this.state.chats_list?this.state.chats_list:[]}
              footer={null}
              renderItem={item => (
                <List.Item
                  key={item.hash}
                  actions={[]}
                  extra={null}
                  className="antd-list-item"
                >
                  <List.Item.Meta
                    avatar={item.uavatar.length>0?<img src={item.uavatar} height="40" width="40"/>:<Avatar size={40} did={item.udid} />}
                    title={<p className="antd-list-item-meta-title">{item.uname}@{item.time}</p>}
                    description={<p className="antd-list-item-meta-description">{item.content}</p>}
                  />
                </List.Item>
              )}
            />
          </LocaleProvider>
        </Main>
      </Layout>
    );
  }
}

const Main = styled.main`
  margin: 20px 0 0;
  
  .section-header {
    margin-bottom: 20px;
  }
  
  .section-description {
    font-size: 1.0rem;
    font-family: "Roboto", "Helvetica", "Arial", sans-serif;
    font-weight: 200;
    color: #000000;
    //margin-bottom: 20px;
    .antd-showmode-switch {
      margin-left: 10px;
      margin-right: 5px;
    }
  }
  
  .antd-select{
    font-size: 0.8rem;
    font-family: "Roboto", "Helvetica", "Arial", sans-serif;
    font-weight: 200;
    color: #000000;
  }
  
  .antd-button-send{
    height: 25px;
  }
  
  .antd-list-item{
    font-size: 1.0rem;
    font-family: Helvetica, 'Hiragino Sans GB', 'Microsoft Yahei', '微软雅黑', Arial, sans-serif;
    font-weight: 300;
    color: #000000;
    white-space: pre-wrap;
    word-wrap: break-word;
    word-break: break-all;
  }
  
  .antd-list-item-meta-title{
    font-size: 0.8rem;
    font-family: Helvetica, 'Hiragino Sans GB', 'Microsoft Yahei', '微软雅黑', Arial, sans-serif;
    font-weight: 300;
    color: #3CB371;
  }
  
  .antd-list-item-meta-description{
    font-size: 1.0rem;
    font-family: Helvetica, 'Hiragino Sans GB', 'Microsoft Yahei', '微软雅黑', Arial, sans-serif;
    font-weight: 300;
    color: #000000;
    white-space: pre-wrap;
    word-wrap: break-word;
    word-break: break-all;
  }
  
  .antd-list-action-icon-text{
    .antd-list-action-icon-text-balance{
      font-size: 0.6rem;
      font-family: "Roboto", "Helvetica", "Arial", sans-serif;
      font-weight: 200;
      color: #FF6600;
    }
  }
  
  .antd-list-comment-list-text{
      font-size: 0.8rem;
      font-family: Helvetica, 'Hiragino Sans GB', 'Microsoft Yahei', '微软雅黑', Arial, sans-serif;
      font-weight: 100;
      color: #000000;
      white-space: pre-wrap;
      word-wrap: break-word;
      word-break: break-all;
      background-color: #F5F5F5;
   }
  
  .web {
    .ant-modal-content {
      position: relative;
      background-color: #00000000 !important;
      border: 0;
      border-radius: 4px;
      background-clip: padding-box;
      box-shadow: 0 0 0 rgba(0, 0, 0, 0) !important;
    }

    .ant-modal-body {
      padding: 0 !important;
      font-size: 0 !important;
      line-height: 1 !important;
    }
  }

`;

export default App;