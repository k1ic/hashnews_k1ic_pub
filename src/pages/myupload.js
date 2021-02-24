/* eslint-disable react/jsx-one-expression-per-line */
import React, { Component } from 'react';
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
  Table,
  Pagination,
  Divider,
  Tag
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

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

const isProduction = process.env.NODE_ENV === 'production';

class App extends Component {
    columns = [
    {
      title: '类型',
      dataIndex: 'category',
      key: 'category',
      render: category => {
        switch(category){
          case 'entertainment':
            return '私藏';
            break;
          case 'marriage':
            return '征婚';
            break;
          case 'makefriends':
            return '交友';
            break;
          default:
            return '未知';
            break;
        }
      },
      width: '10%',
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: '15%',
    },
    {
      title: '定价',
      dataIndex: 'worth',
      key: 'worth',
      width: '10%',
    },
    {
      title: '图片',
      dataIndex: 'hd_src',
      key: 'hd_src',
      width: '20%',
      render: (hd_src) => <img src={hd_src} alt="hd" height="50" width="50" onClick={() => {this.handlePreview(hd_src)}} style={{cursor: 'pointer'}}/>
    },
    {
      title: '链接',
      dataIndex: 'link',
      key: 'link',
      width: '15%',
      render: (link) => <a href={link}>链接</a>
    },
    {
      title: '状态',
      dataIndex: 'state',
      key: 'state',
      filters: [{ text: '提交', value: 'commited' }, { text: '同意', value: 'approved' }, { text: '拒绝', value: 'rejected' }],
      render: state => {
        switch(state){
          case 'commited':
            return '提交';
            break;
          case 'approved':
            return '同意';
            break;
          case 'rejected':
            return '拒绝';
            break;
          default:
            return '未知';
            break;
        }
      },
    },
  ];

  static async getInitialProps({pathname, query, asPath, req}) {
    console.log('getInitialProps query=', query);
    return {};
  }
  
  constructor(props) {
    super(props);
    
    /*initial state*/
    this.state = {
      session: null,
      previewVisible: false,
      previewView: true,
      previewImage: "",
      data: [],
      pagination: {},
      loading: false,
      updating: false,
    };
  }
  
  /*Fetch App data*/
  async fetchAppData(){
    try {
      const { status, data} = await api.get('/api/did/session');
      this.setState({session: data});
      this.fetchPics();
    } catch (err) {
    }
    return {};
  }
  
  fetchPics = (params = {}) => {
    const session = this.state.session;
    let owner_did = null;
    
    if(Object.keys(params).length == 0){
      console.log('params is null, load defaults');
      params['results'] = 10;             /*每页10条记录*/
      params['page'] = 1;                 /*第1页*/
      params['sortField'] = 'createdAt';
      params['sortOrder'] = 'descend';
      params['state'] = ['approved'];
      console.log('params:', params);
    }else{
      console.log('params:', params);
    }
    
    if(session && session.user){
      owner_did = session.user.did;
    }
    
    this.setState({ loading: true });
    reqwest({
      url: '/api/getpics',
      method: 'get',
      data: {
        cmd: 'GetOwnerPicsByFilter0xf66fa9a105ba0da2419c25208e79a6589af51db9',
        owner_did: owner_did,
        results: 10,
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
      
      //console.log('pagination='+JSON.stringify(pagination));
      //console.log('data='+JSON.stringify(data.results));
      
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
  
  /*
  *pagination example
  *{"current":1,"pageSize":10,"total":200}
  *filters example
  *{"gender": ["male"]}
  *sorter example
  *{"column":{"title":"Name","dataIndex":"name","key":"name","sorter":true,"width":"20%"},"order":"ascend","field":"name","columnKey":"name"}
  *{"column":{"title":"Name","dataIndex":"name","key":"name","sorter":true,"width":"20%"},"order":"descend","field":"name","columnKey":"name"}
  */
  handleTableChange = (pagination, filters, sorter) => {
    if(Object.keys(sorter).length == 0){
      sorter['field'] = 'createdAt';
      sorter['order'] = 'descend';
    }
    
    if(Object.keys(filters).length == 0){
      filters['state'] = ['approved'];
    }
    
    console.log('pagination='+JSON.stringify(pagination));
    console.log('filters='+JSON.stringify(filters));
    console.log('sorter='+JSON.stringify(sorter));
    
    const pager = { ...this.state.pagination };
    pager.current = pagination.current;
    this.setState({
      pagination: pager,
    });
    
    this.fetchPics({
      results: pagination.pageSize,
      page: pagination.current,
      sortField: sorter.field,
      sortOrder: sorter.order,
      ...filters,
    });
  };
  
  /*asset manager handler*/
  handleAssetManager = (asset_did, action) => {
    const { session } = this.state;
    const { user, token } = session;
    const formData = new FormData();

    formData.append('user', JSON.stringify(user));
    formData.append('action', action);
    formData.append('asset_did', asset_did);
    
    this.setState({
      updating: true,
    });
    
    // You can use any AJAX library you like
    reqwest({
      url: '/api/managepics',
      method: 'post',
      processData: false,
      data: formData,
      success: () => {
        this.setState({
          updating: false,
        });
        Modal.success({title: '处理成功'});
        this.fetchPics();
      },
      error: () => {
        this.setState({
          updating: false,
        });
        Modal.error({title: '处理失败'});
      },
    });
  }
  
  handleApprove = asset_did => {
    console.log('handleApprove asset_did=', asset_did);
    this.handleAssetManager(asset_did, 'approve');
  }
  
  handleReject = asset_did => {
    console.log('handleReject asset_did=', asset_did);
    this.handleAssetManager(asset_did, 'reject');
  }
  
  handleDelete = asset_did => {
    console.log('handleDelete asset_did=', asset_did);
    this.handleAssetManager(asset_did, 'delete');
  }
  
  handlePreviewCancel = () => this.setState({ previewVisible: false });
 
  handlePreview = file_url => {
    this.setState({
      previewImage: file_url,
      previewVisible: true
    });
  };
  
  render() {
    const session = this.state.session;
    //console.log('render session=', session);
    //console.log('render props=', this.props);
    
    if (!session) {
      return (
        <Layout title="myUpload">
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
    
    
    const { previewVisible,previewView, previewImage } = this.state;
    //console.log('pagination='+JSON.stringify(this.state.pagination));
    //console.log('record='+JSON.stringify(this.state.record));
    
    return (
      <Layout title="myUpload">
        <Main>
          <LocaleProvider locale={zh_CN}>
            <Table
              columns={this.columns}
              rowKey={record => record.asset_did}
              dataSource={this.state.data}
              pagination={this.state.pagination}
              loading={this.state.loading}
              onChange={this.handleTableChange}
            />
            <Modal
              visible={previewVisible}
              footer={null}
              onCancel={this.handlePreviewCancel}
            >
              <img alt="picture" style={{ width: "100%" }} src={previewImage} />
            </Modal>
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