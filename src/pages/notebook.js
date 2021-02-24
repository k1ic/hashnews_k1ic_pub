/* eslint-disable react/jsx-one-expression-per-line */
import React, { Component } from 'react';
import styled from 'styled-components';
import useAsyncFn from 'react-use/lib/useAsyncFn';
import useToggle from 'react-use/lib/useToggle';
import { fromUnitToToken } from '@arcblock/forge-util';
import Typography from '@material-ui/core/Typography';
import CircularProgress from '@material-ui/core/CircularProgress';
import {
  Button,
  Input,
  List,
  Avatar,
  Card,
} from 'antd';
import Auth from '@arcblock/did-react/lib/Auth';

import Layout from '../components/layout';
import useSession from '../hooks/session';
import forge from '../libs/sdk';
import api from '../libs/api';

class App extends Component {  
  static async getInitialProps({pathname, query, asPath, req}) {
    console.log('getInitialProps query=', query);
    return {
      asset_did: query.asset_did,
    }
  }
  
  constructor(props) {
    super(props);
    
    /*initial state*/
    this.state = {
      session: null,
      data: [],
      id: 0,
      message: null,
      intervalIsSet: false,
      idToDelete: null,
      idToUpdate: null,
      objectToUpdate: null
    };
  }
  
  /*Fetch session*/
  async fetchSession(){
    try {
      const { status, data} = await api.get('/api/did/session');
      this.setState({session: data});
    } catch (err) {
    }
    return {};
  }
  /*Get data from database*/
  getDataFromDb = () => {
    //console.log('getDataFromDb');
    this.setState({data: [
      {id: '0', message: 'Hello World!', createdAt: '2019-10-20T21:30:00'},
      {id: '1', message: '世界你好!', createdAt: '2019-10-20T21:40:00'},
    ]});
  }
  
  /*component mount process*/
  componentDidMount() {
    this.getDataFromDb();
    this.fetchSession();
    if (! this.state.intervalIsSet) {
      let interval = setInterval(this.getDataFromDb, 1000);
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
  
  putDataToDB = message => {
    console.log('putDataToDB message=', message);
  }
  
  render() {
    const data = this.state.data;
    const session = this.state.session;
    console.log('render data=', data);
    console.log('render session=', session);
    console.log('render props.asset_did=', this.props.asset_did);
    
    if (!session) {
      return (
        <Layout title="Notebook">
          <Main>
            <CircularProgress />
          </Main>
        </Layout>
      );
    }
    
    if (!session.user) {
      //window.location.href = '/?openLogin=true';
      //return null;
    }
    
    return (
      <Layout title="Notebook">
        <Main>
          <div style={{ width: 990, margin: 20 }}>
           <List
              itemLayout="horizontal"
              dataSource={data}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    title={<span>{`创建时间: ${item.createdAt}`}</span>}
                    description={`${item.id}: ${item.message}`}
                  />
                </List.Item>
              )}
            />
            <Card
              title='新增笔记'
              style={{ padding: 10, margin: 10}}>
              <Input
                onChange={e => this.setState({ message: e.target.value })}
                placeholder='请输入笔记内容'
                style={{ width: 200 }} />
              <Button
                type="primary"
                style={{ margin: 20}}
                onClick={()=>this.putDataToDB(this.state.message)}
              >添加</Button> 
            </Card>
          </div>
        </Main>
      </Layout>
    );
  }
}

const Main = styled.main`
  margin: 20px 0 0;

  .page-header {
    margin-bottom: 20px;
  }

  .page-description {
    margin-bottom: 10px;
  }

`;

export default App;