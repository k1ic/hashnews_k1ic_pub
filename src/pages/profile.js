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
import 'antd/dist/antd.css';

import Layout from '../components/layout';
import useSession from '../hooks/session';
import forge from '../libs/sdk';
import api from '../libs/api';
import { removeToken, onAuthError } from '../libs/auth';
import env from '../libs/env';

const admin_account = env.appAdminAccounts;

export default function ProfilePage() {
  const session = useSession();
  const [isFetched, setFetched] = useToggle(false);
  const [isOpen, setOpen] = useToggle(false);
  const [balance, fetchBalance] = useAsyncFn(async () => {
    if (session.value && session.value.user) {
      const address = session.value.user.did.replace(/^did:abt:/, '');
      const { state: account } = await forge.getAccountState({ address }, { ignoreFields: [] });
      return account;
    }

    return null;
  }, [session.value]);

  const onLogout = () => {
    removeToken();
    window.location.href = '/';
  };
  
  const onMyPayed = () => {
    window.location.href = '/mypayed';
  };
  
  const onMyUploads = () => {
    window.location.href = '/myupload';
  };
  
  const onUpload = () => {
    window.location.href = '/upload';
  };
  
  const onAdmin = () => {
    window.location.href = '/admin';
  };

  if (session.loading || !session.value) {
    return (
      <Layout title="Profile">
        <Main>
          <CircularProgress />
        </Main>
      </Layout>
    );
  }

  if (session.error) {
    return (
      <Layout title="Profile">
        <Main>{session.error.message}</Main>
      </Layout>
    );
  }

  if (!session.value.user) {
    window.location.href = '/?openLogin=true';
    return null;
  }

  if (!isFetched) {
    setTimeout(() => {
      setFetched(true);
      fetchBalance();
    }, 100);
  }

  const { user, token } = session.value;

  return (
    <Layout title="Profile">
      <Main>
        <Grid container spacing={6}>
          <Grid item xs={12} md={3} className="avatar">
            <div align="center">
              {user.avatar.length > 0?<img src={user.avatar} height="240" width="240" style={{ borderRadius: '50%' }}/>:<Avatar size={240} did={user.did} style={{ borderRadius: '50%' }}/>}
            </div>
            <Button color="secondary" variant="outlined" onClick={onLogout} style={{ marginTop: '30px' }}>
              退出
            </Button>
            {/*balance.value && (
              <Button color="primary" variant="contained" onClick={() => setOpen()} style={{ marginTop: '30px' }}>
                签到
              </Button>
            )*/}
            {/*<Button color="primary" variant="contained" onClick={onMyPayed} style={{ marginTop: '30px' }}>
              已付列表
            </Button>*/}
            {/*<Button color="primary" variant="outlined" onClick={onMyUploads} style={{ marginTop: '30px' }}>
              已传列表
            </Button>*/}
            {/*(-1 != admin_account.indexOf(user.did)) && (
              <Button color="primary" variant="contained" onClick={onAdmin} style={{ marginTop: '30px' }}>
                后台管理
              </Button>
            )*/}
          </Grid>
          <Grid item xs={12} md={9} className="meta">
            <Typography component="h3" variant="h4">
              我的资料
            </Typography>
            <List>
              <ListItem className="meta-item">
                <ListItemText primary={user.did} secondary="DID" />
              </ListItem>
              <ListItem className="meta-item">
                <ListItemText primary={user.name || '-'} secondary="姓名" />
              </ListItem>
              <ListItem className="meta-item">
                <ListItemText primary={user.email || '-'} secondary="邮箱" />
              </ListItem>
              <ListItem className="meta-item">
                <ListItemText primary={user.mobile || '-'} secondary="电话" />
              </ListItem>
              <ListItem className="meta-item">
                <ListItemText
                  primary={
                    balance.value ? (
                      `${fromUnitToToken(balance.value.balance, token.decimal)} ${token.symbol}`
                    ) : (
                      <CircularProgress size={18} />
                    )
                  }
                  secondary="余额"
                />
              </ListItem>
            </List>
          </Grid>
        </Grid>
      </Main>
      {isOpen && (
        <Auth
          responsive
          action="checkin"
          locale="zh"
          checkFn={api.get}
          onError={onAuthError}
          onClose={() => setOpen()}
          onSuccess={() => window.location.reload()}
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

const Main = styled.main`
  margin: 30px 0;
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
