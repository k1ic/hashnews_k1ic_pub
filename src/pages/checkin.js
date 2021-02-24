/* eslint-disable react/jsx-one-expression-per-line */
import React from 'react';
import styled from 'styled-components';
import useAsyncFn from 'react-use/lib/useAsyncFn';
import useToggle from 'react-use/lib/useToggle';
import { fromUnitToToken } from '@arcblock/forge-util';

import Grid from '@material-ui/core/Grid';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import Auth from '@arcblock/did-react/lib/Auth';
import Avatar from '@arcblock/did-react/lib/Avatar';

import Layout from '../components/layout';
import useSession from '../hooks/session';
import forge from '../libs/sdk';
import api from '../libs/api';
import { removeToken, onAuthError } from '../libs/auth';

var CheckinPendingFlag = 0;

const onCheckinError = async result => {
  CheckinPendingFlag = 0;
  window.location.href = 'http://abtworld.cn/wools';
};

const onCheckinClose = async result => {
  CheckinPendingFlag = 0;
  window.location.href = 'http://abtworld.cn/wools';
};

const onCheckinSuccess = async result => {
  CheckinPendingFlag = 0;
  window.location.href = 'http://abtworld.cn/wools';
};

export default function CheckinPage(props) {
  const wback_ts = props.wback_ts;
  const session = useSession();
  const [isOpen, setOpen] = useToggle(false);

  if (session.loading || !session.value) {
    return (
      <Layout title="Checkin">
        <Main>
          <CircularProgress />
        </Main>
      </Layout>
    );
  }

  if (typeof(wback_ts) != "undefined"){
    console.log('CheckinPage wback_ts=', wback_ts);
    CheckinPendingFlag = 0;
    window.location.href = 'http://abtworld.cn/wools';
    return null;
  }

  if (session.error) {
    return (
      <Layout title="Checkin">
        <Main>{session.error.message}</Main>
      </Layout>
    );
  }

  const { user, token } = session.value;

  setTimeout(() => {
    try {
      if (!isOpen && CheckinPendingFlag == 0) {
      	CheckinPendingFlag = 1;
        setOpen(true);
      }
    } catch (err) {
      // Do nothing
    }
  }, 100);
  
  return (
    <Layout title="Checkin">
      <Main>
        <Grid container spacing={6}>
          <Grid item xs={12} md={3} className="avatar">
            <Button color="primary" variant="contained" onClick={() => setOpen(true)} style={{ marginTop: '30px' }}>
              签到
            </Button>
          </Grid>
        </Grid>
      </Main>
      {isOpen && (
        <Auth
          responsive
          action="checkin"
          locale="zh"
          checkFn={api.get}
          onError={onCheckinError}
          onClose={onCheckinClose}
          onSuccess={onCheckinSuccess}
          messages={{
            title: `扫码签到`,
            scan: `签到获取官方 ${token.symbol} 代币`,
            confirm: '在ABT钱包中确认',
            success: `签到成功!`,
          }}
        />
      )}
    </Layout>
  );
}

CheckinPage.getInitialProps = async function ({pathname, query, asPath, req}) {
    //console.log('pathname=', pathname);
    //console.log('query=', query);
    console.log('query._t_=', query._t_);
    //console.log('asPath=', asPath);
    //console.log('req=', req);
    //console.log('req.url=', req.url);

    return {
      wback_ts: query._t_,
    }
}

const Main = styled.main`
  margin: 80px 0;
  display: flex;

  .avatar {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-center;

    svg {
      margin-bottom: 40px;
    }
  }

  .meta {
    display: flex;
    flex-grow: 1;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
  }

  .meta-item {
    padding-left: 0;
  }
`;
