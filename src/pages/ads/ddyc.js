/* eslint-disable react/jsx-one-expression-per-line */
import React, { Component } from 'react';
import styled from 'styled-components';
import useAsyncFn from 'react-use/lib/useAsyncFn';
import useToggle from 'react-use/lib/useToggle';
import { fromUnitToToken } from '@arcblock/forge-util';
import CircularProgress from '@material-ui/core/CircularProgress';
import { LocaleProvider, Upload, Icon, Modal, Button, message, Typography, Input, Tooltip } from "antd";
import zh_CN from 'antd/lib/locale-provider/zh_CN'
import reqwest from 'reqwest';
import 'antd/dist/antd.css';
import Auth from '@arcblock/did-react/lib/Auth';

import Layout from '../../components/layout';
import useSession from '../../hooks/session';
import forge from '../../libs/sdk';
import api from '../../libs/api';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

const isProduction = process.env.NODE_ENV === 'production';

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
  
  /*component mount process*/
  componentDidMount() {
  }
  
  /*component unmount process*/
  componentWillUnmount() {
  }
  
  render() {
    
    return (
      <Layout title="ddyc">
        <Main>
          <div className="picture">
            <img src="/static/images/ads/ddyc.jpg" alt="ddyc" />
          </div>
        </Main>
      </Layout>
    );
  }
}

const Main = styled.main`
  margin: 10px 0 0;
  
  .picture img {
    -moz-background-size:contain|cover;
    -webkit-background-size:contain|cover;
    -o--background-size:contain|cover;
    background-size:contain|cover;
    width:100%;
    height: auto;
  }
  
`;

export default App;