﻿/* eslint-disable react/jsx-one-expression-per-line */
import React, { Component } from 'react';
import styled from 'styled-components';
import useAsyncFn from 'react-use/lib/useAsyncFn';
import useToggle from 'react-use/lib/useToggle';
import { fromUnitToToken } from '@arcblock/forge-util';
import CircularProgress from '@material-ui/core/CircularProgress';
import { LocaleProvider, Upload, Icon, Modal, Button, message, Typography, Input, Tooltip } from 'antd';
import zh_CN from 'antd/lib/locale-provider/zh_CN';
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

class App extends Component {
  static async getInitialProps({ pathname, query, asPath, req }) {
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
  async fetchAppData() {
    try {
      const { status, data } = await api.get('/api/did/session');
      this.setState({ session: data });
    } catch (err) {}
    return {};
  }

  /*component mount process*/
  componentDidMount() {
    //this.fetchAppData();
    window.location.href = '/';
  }

  /*component unmount process*/
  componentWillUnmount() {}

  render() {
    return (
      <Layout title="梦阳快讯">
        <Main>
          <LocaleProvider locale={zh_CN}>
            <div className="clearfix"></div>
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
