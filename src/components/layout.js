import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import qs from 'querystring';
import PropTypes from 'prop-types';
import AppBar from '@material-ui/core/AppBar';
import Container from '@material-ui/core/Container';
import styled from 'styled-components';
import Helmet from 'react-helmet';
import Head from 'next/head';

import Header from './header';
import Footer from './footer';

import env from '../libs/env';

import { setToken } from '../libs/auth';

export default function Layout({ title, children, contentOnly }) {
  // If a login token exist in url, set that token in storage
  useEffect(() => {
    const params = qs.parse(window.location.search.slice(1));
    if (params.loginToken) {
      //console.log('Save login token', params.loginToken);
      setToken(params.loginToken);

      const location = window.location;
      if (location) {
        delete params.loginToken;
        const redirectUrl = `${location.pathname}?${qs.stringify(params)}`;

        console.log('Redirect Url', redirectUrl);
        window.history.replaceState({}, window.title, redirectUrl);
      }
    }
  }, []);

  if (contentOnly) {
    return <Container>{children}</Container>;
  }

  return (
    <Div>
      {/*<Helmet title={`${title} - ${env.appName}`} />*/}
      <Helmet title={`${title}`} />
      <Head>
        <title>{`${title}`}</title>
        {/*<script src="https://unpkg.com/embeddable-nfts/dist/nft-card.min.js"></script>*/}
        {/*<!-- 安卓平台 chrome -->*/}
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="icon" sizes="192x192" href="/static/images/logo.png" />

        {/*<!-- ios平台 safari -->*/}
        <link rel="apple-touch-icon" href="/static/images/abtworld/abtworld-apple-touch-icon.png" />
        <link rel="apple-touch-icon-precomposed" href="/static/images/abtworld/abtworld-apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-title" content={`${title}`} />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />

        {/*<!-- win8以上 平台 磁贴 -->*/}
        <meta name="msapplication-TileImage" content="/static/images/logo.png" />
        <meta name="msapplication-TileColor" content="#0e90d2" />

        <meta property="og:site_name" content={`${title}`} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:image" content="/static/images/logo.png" />
        <meta property="og:image" content="/static/images/logo.png" />
        <meta property="og:url" content={`${env.baseUrl}`} />
        <meta name="twitter:url" content={`${env.baseUrl}`} />
        <meta property="og:title" content={`${title}`} />
        <meta name="twitter:title" content={`${title}`} />
        <meta property="og:description" content={`${title}`} />
        <meta name="twitter:description" content={`${title}`} />
      </Head>
      <AppBar position="static" color="default">
        <Container>
          <Header />
        </Container>
      </AppBar>
      <Container style={{ minHeight: '60vh' }}>{children}</Container>
      <Footer />
    </Div>
  );
}

Layout.propTypes = {
  title: PropTypes.string.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  children: PropTypes.any.isRequired,
  contentOnly: PropTypes.bool,
};

Layout.defaultProps = {
  contentOnly: false,
};

const Div = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #fbfbfb;
`;
