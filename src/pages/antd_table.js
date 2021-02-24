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

const admin_account = env.appAdminAccounts;
const isProduction = process.env.NODE_ENV === 'production';

class App extends Component {
    columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      render: name => `${name.first} ${name.last}`,
      width: '20%',
    },
    {
      title: 'Gender',
      dataIndex: 'gender',
      key: 'gender',
      filters: [{ text: 'Male', value: 'male' }, { text: 'Female', value: 'female' }],
      width: '10%',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: '30%',
    },
    {
      title: 'Picture',
      dataIndex: 'picture',
      key: 'picture',
      width: '20%',
      render: (picture) => <img src={picture.large} alt="hd" height="50" width="50" onClick={() => {this.handlePreview(picture.large)}} style={{cursor: 'pointer'}}/>
    },
    {
      title: 'Action',
      dataIndex: 'login',
      key: 'action',
      render: login => (
        <span>
          <Button type="primary" size="small" onClick={() => {this.handleApprove(login.uuid)}}>同意</Button>
          <Divider type="vertical" />
          <Button type="danger" size="small" onClick={() => {this.handleReject(login.uuid)}}>拒绝</Button>
        </span>
      ),
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
    };
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
  
  fetch = (params = {}) => {
    console.log('params:', params);
    this.setState({ loading: true });
    reqwest({
      url: 'https://randomuser.me/api',
      method: 'get',
      data: {
        results: 10,
        ...params,
      },
      type: 'json',
    }).then(data => {
      const pagination = { ...this.state.pagination };
      // Read total count from server
      // pagination.total = data.totalCount;
      pagination.total = 200;
      
      //console.log('pagination='+JSON.stringify(pagination));
      console.log('data='+JSON.stringify(data.results));
      
      this.setState({
        loading: false,
        data: data.results,
        pagination,
      });
    });
  };
  
  /*component mount process*/
  componentDidMount() {
    this.fetchAppData();
    this.fetch();
  }
  
  /*component unmount process*/
  componentWillUnmount() {
  }
  
  handleTableChange = (pagination, filters, sorter) => {
    console.log('pagination='+JSON.stringify(pagination));
    console.log('filters='+JSON.stringify(filters));
    console.log('sorter='+JSON.stringify(sorter));
    
    const pager = { ...this.state.pagination };
    pager.current = pagination.current;
    this.setState({
      pagination: pager,
    });
    this.fetch({
      results: pagination.pageSize,
      page: pagination.current,
      sortField: sorter.field,
      sortOrder: sorter.order,
      ...filters,
    });
  };
  
  handleApprove = uuid => {
    console.log('handleApprove uuid=', uuid);
  }
  
  handleReject = uuid => {
    console.log('handleReject uuid=', uuid);
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
        <Layout title="Admin">
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
    
    /*verify user*/
    if ( isProduction && session.user ) {
      if(-1 == admin_account.indexOf(user.did)){
        console.log('render invalide user.did=', user.did);
        window.location.href = '/';
        return null;
      }
    }
    
    
    const { previewVisible,previewView, previewImage } = this.state;
    //console.log('pagination='+JSON.stringify(this.state.pagination));
    //console.log('record='+JSON.stringify(this.state.record));
    
    return (
      <Layout title="Admin">
        <Main>
          <LocaleProvider locale={zh_CN}>
            <Table
              columns={this.columns}
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