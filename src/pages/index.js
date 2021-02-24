/* eslint-disable react/jsx-one-expression-per-line */
import React, { Component } from 'react';
import qs from 'querystring';
import styled from 'styled-components';
import useAsyncFn from 'react-use/lib/useAsyncFn';
import useToggle from 'react-use/lib/useToggle';
import { fromUnitToToken } from '@arcblock/forge-util';
import Avatar from '@arcblock/did-react/lib/Avatar';
//import DidLogo from '@arcblock/did-react/lib/Logo';
import CircularProgress from '@material-ui/core/CircularProgress';
import {
  LocaleProvider,
  Upload,
  Icon,
  Pagination,
  Modal,
  Button,
  message,
  Typography,
  Input,
  Tooltip,
  List,
  Select,
  Tabs,
  Menu,
  Switch,
  Checkbox,
  Divider,
  Slider,
  Affix,
  BackTop,
  InputNumber,
  Row,
  Col,
} from 'antd';
import zh_CN from 'antd/lib/locale-provider/zh_CN';
import reqwest from 'reqwest';
import 'antd/dist/antd.css';
import Auth from '@arcblock/did-react/lib/Auth';
//import moment from 'moment';
import * as QrCode from 'qrcode.react';
import * as html2canvas from 'html2canvas';
import AutoLinkText from 'react-autolink-text2';

import Layout from '../components/layout';
import useSession from '../hooks/session';
import forge from '../libs/sdk';
import api from '../libs/api';
import env from '../libs/env';
import dappsites from '../libs/dappsites';
import { decimalConvert } from '../libs/util';
import { forgeTxValueSecureConvert, HashString } from '../libs/crypto';
import { getCurrentTime } from '../libs/time';
import { getUserDidFragment } from '../libs/user';

const sleep = timeout => new Promise(resolve => setTimeout(resolve, timeout));

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { Option } = Select;
const { SubMenu } = Menu;

const isProduction = process.env.NODE_ENV === 'production';
const admin_account = env.appAdminAccounts;

/*news parameter*/
const news_to_chain_mode = 'indirect';
const news_title_max_length = 100;
var news_content_max_length = 0;
const list_items_per_page = 10;
const news_comment_max_length = 100;
const paytip_comment_max_length = 20;

/*news type default value*/
const news_type_default = 'chains';

/*news fetch mode
 *1.chainnode
 *2.localdb
 */
const news_fetch_mode = 'localdb';

/*news list show mode
 *1.more
 *2.page
 */
const news_list_show_mode = 'page';

/*pay valye*/
const toPayEachChar = 0.0001;

/*news weights*/
const news_weights_value_min = 1;
const news_weights_value_max = 1000000;
const news_weights_value_step = 1;
const news_weights_level_important = 1000;

/*minner numbers*/
const newsSendCfgWinWidth = 300;
const news_comment_minner_number_default = 10;
const news_like_minner_number_default = 10;
const news_forward_minner_number_default = 5;
var news_comment_minner_number_min = news_comment_minner_number_default;
var news_comment_minner_number_max = news_comment_minner_number_default;
var news_like_minner_number_min = news_like_minner_number_default;
var news_like_minner_number_max = news_like_minner_number_default;
var news_forward_minner_number_min = news_forward_minner_number_default;
var news_forward_minner_number_max = news_forward_minner_number_default;

/*slogan*/
const hashnews_slogan = '去中心化资讯平台，多站点分布式运营！';

/*poster window width*/
const posterWinWidth = 320;
var share_news_pic_data = '';

/*user slogan*/
const share_news_user_slogan_len_max = 24;
const share_news_user_slogan_dialog_width = 320;

/*flash news sub menu*/
const flash_news_sub_menu = [
  {
    key: 'chains',
    value: '快讯',
  },
];
//const flash_news_sub_menu = [
//  {
//    key: 'chains',
//    value: '快讯',
//  },
//  {
//    key: 'ads',
//    value: '广告',
//  },
//  {
//    key: 'memos',
//    value: '备忘',
//  },
//  {
//    key: 'amas',
//    value: '问答',
//  },
//  {
//    key: 'soups',
//    value: '鸡汤',
//  },
//];

/*send permistion list*/
const ama_send_perm_udid = ['z1ZLeHSJfan2WB1vSnG7CS8whxBagCoHiHo'];

function getBase64(img, callback) {
  const reader = new FileReader();
  reader.addEventListener('load', () => callback(reader.result));
  reader.readAsDataURL(img);
}

function dataURLtoFile(dataUrl, fileName) {
  var arr = dataUrl.split(',');
  var mime = arr[0].match(/:(.*?);/)[1];
  var bstr = atob(arr[1]);
  var n = bstr.length;
  var u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  //转换成file对象
  return new File([u8arr], fileName, { type: mime });

  //转换成成blob对象
  //return new Blob([u8arr],{type:mime});
}

function formatNumber(value) {
  value += '';
  const list = value.split('.');
  const prefix = list[0].charAt(0) === '-' ? '-' : '';
  let num = prefix ? list[0].slice(1) : list[0];
  let result = '';
  while (num.length > 3) {
    result = `,${num.slice(-3)}${result}`;
    num = num.slice(0, num.length - 3);
  }
  if (num) {
    result = num + result;
  }
  return `${prefix}${result}${list[1] ? `.${list[1]}` : ''}`;
}

class NumericInput extends React.Component {
  onChange = e => {
    const { value } = e.target;
    const reg = /^-?(0|[1-9][0-9]*)(\.[0-9]*)?$/;
    if ((!isNaN(value) && reg.test(value)) || value === '' || value === '-') {
      this.props.onChange(value);
    }
  };

  // '.' at the end or only '-' in the input box.
  onBlur = () => {
    const { value, onBlur, onChange } = this.props;
    if (value.charAt(value.length - 1) === '.' || value === '-') {
      onChange(value.slice(0, -1));
    }
    if (onBlur) {
      onBlur();
    }
  };

  render() {
    const { value } = this.props;
    const title = value ? (
      <span className="numeric-input-title">{value !== '-' ? formatNumber(value) : '-'}</span>
    ) : (
      'Input a number'
    );
    return (
      <Tooltip trigger={['focus']} title={title} placement="topLeft" overlayClassName="numeric-input">
        <Input {...this.props} onChange={this.onChange} onBlur={this.onBlur} placeholder="如: 0.0008" maxLength={8} />
      </Tooltip>
    );
  }
}

const limit0Decimals = value => {
  const reg = /^(\-)*(\d+)\.().*$/;
  //console.log(value);
  if (typeof value === 'string') {
    return !isNaN(Number(value)) ? value.replace(reg, '$1') : '';
  } else if (typeof value === 'number') {
    return !isNaN(value) ? String(value).replace(reg, '$1') : '';
  } else {
    return '';
  }
};

const limit1Decimals = value => {
  const reg = /^(\-)*(\d+)\.(\d).*$/;
  //console.log(value);
  if (typeof value === 'string') {
    return !isNaN(Number(value)) ? value.replace(reg, '$1.$2') : '';
  } else if (typeof value === 'number') {
    return !isNaN(value) ? String(value).replace(reg, '$1.$2') : '';
  } else {
    return '';
  }
};

const limit2Decimals = value => {
  const reg = /^(\-)*(\d+)\.(\d\d).*$/;
  //console.log(value);
  if (typeof value === 'string') {
    return !isNaN(Number(value)) ? value.replace(reg, '$1$2.$3') : '';
  } else if (typeof value === 'number') {
    return !isNaN(value) ? String(value).replace(reg, '$1$2.$3') : '';
  } else {
    return '';
  }
};

const renderCommentList = (x, token) => (
  <span className="antd-list-comment-list-item-text">
    <a
      href={env.chainHost.replace('/api', '/node/explorer/accounts/') + x.udid}
      target="_blank"
      style={{ fontSize: '14px', fontWeight: 500, color: '#676D91' }}>
      {x.uname}
    </a>
    <span style={{ fontSize: '12px', fontWeight: 500, color: '#888888' }}> - {x.time}</span>
    <br />
    <span
      style={{ fontSize: '14px', color: '#0', whiteSpace: 'pre-wrap', wordWrap: 'break-word', wordBreak: 'normal' }}>
      <AutoLinkText text={x.comment} linkProps={{ target: '_blank' }} />
    </span>
    {x.mbalance > 0 ? (
      <span style={{ fontSize: '10px', color: '#FF6600' }}>
        {' '}
        +{x.mbalance} {token.symbol}
      </span>
    ) : (
      ''
    )}
    <br />
  </span>
);

const renderPaytipList = (x, token) => (
  <span className="antd-list-comment-list-item-text">
    <a
      href={env.chainHost.replace('/api', '/node/explorer/accounts/') + x.udid}
      target="_blank"
      style={{ fontSize: '14px', color: '#3CB371' }}>
      {x.uname}
    </a>
    <span style={{ fontSize: '12px', color: '#888888' }}> - {x.time}</span>
    <br />
    {x.comment && x.comment.length > 0 && (
      <span
        style={{ fontSize: '14px', color: '#0', whiteSpace: 'pre-wrap', wordWrap: 'break-word', wordBreak: 'normal' }}>
        {x.comment} -{' '}
      </span>
    )}
    <span
      style={{ fontSize: '14px', color: '#0', whiteSpace: 'pre-wrap', wordWrap: 'break-word', wordBreak: 'normal' }}>
      打赏{' '}
    </span>
    <span style={{ fontSize: '14px', color: '#FF6600' }}>
      {x.mbalance} {token.symbol}
    </span>
    <br />
  </span>
);

class App extends Component {
  static async getInitialProps({ pathname, query, asPath, req }) {
    //console.log('getInitialProps pathname=', pathname);
    console.log('getInitialProps query=', query);
    //console.log('getInitialProps asPath=', asPath);
    //console.log('getInitialProps req=', req);
    return {};
  }

  constructor(props) {
    super(props);
    //console.log('newsflash props=', props);

    /*initial state*/
    this.state = {
      session: null,
      intervalIsSet: false,
      news_type: news_type_default,
      news_article_worth: 0,
      news_title_to_send: '',
      news_content_to_send: '',
      news_content_origin: '原创',
      news_image_file_list: [],
      news_image_url: null,
      news_image_preview_visible: false,
      news_image_preview_image: '',
      sendAffixOffsetTop: 0,
      toPay: 0,
      send_news_dialog_visible: false,
      news_to_send_weight: 1,
      news_comment_minner_number: news_comment_minner_number_default,
      news_like_minner_number: news_like_minner_number_default,
      news_forward_minner_number: news_forward_minner_number_default,
      news_to_send_cfg_visible: false,
      news_title_enabled: false,
      asset_did: '',
      show_mode: 'all',
      sending: false,
      asset_sending: false,
      paytip_sending: false,
      datachains_list: [],
      datachain_node_name_to_view: 'all',
      datachain_node_name_to_send: 'default',
      dapp_site_name_to_view: dappsites[0].name,
      newsflash_list: [],
      newsflash_total_num: 0,
      loading: false,
      page_number: 1,
      more_to_load: true,
      minning: false,
      comment_input_visible: false,
      comment_to_send: '',
      share_news_user_slogan_content: '不只是资讯，更让每一次分享，传递价值，倡导真实！',
      share_news_user_slogan_input_visible: false,
      gen_share_news_visible: false,
      share_news_pic_visible: false,
      shared_btn_disabled: true,
      flash_news_sub_menu_title: '快讯',
      paytip_input_visible: false,
      paytip_input_value: '',
      paytip_comment: '',
      paytip_target_did: '',
    };

    this.datachainsToViewSlecterChildren = [];
    this.datachainsToSendSlecterChildren = [];
    this.dappSitesNameToViewSlecterChildren = [];
    for (var i = 0; i < dappsites.length; i++) {
      if (dappsites[i].state === 'online') {
        this.dappSitesNameToViewSlecterChildren.push(
          <Select.Option key={dappsites[i].name} value={dappsites[i].name}>
            {dappsites[i].name}
          </Select.Option>
        );
      }
    }
    this.comment_asset_did = '';
    this.share_asset_did = '';
    this.paytip_asset_did = '';
    this.share_news_items = [];
    this.winW = 0;
    this.winH = 0;
    this.sendNewsDialogWinWidth = 0;
    this.commentInpuTopOffset = 0;
    this.shareNewsPicUserCancel = false;
    this.shareNewsPicTimeout = null;
    this.newsToPayCalcTimeout = null;
    this.onListItemActionClick = this.onListItemActionClick.bind(this);
    this.onNewsPaginationChange = this.onNewsPaginationChange.bind(this);
  }

  /*Fetch App data*/
  async fetchAppData() {
    try {
      const { status, data } = await api.get('/api/did/session');
      this.setState(
        {
          session: data,
        },
        () => {
          this.fetchDatachainsList();
          if (news_list_show_mode === 'page') {
            this.fetchNewsFlash({}, 'total_num');
          }
          this.fetchNewsFlash();
        }
      );
    } catch (err) {}
    return {};
  }

  /*Fetch data chains list*/
  fetchDatachainsList = () => {
    reqwest({
      url: '/api/datachainsget',
      method: 'get',
      data: {
        cmd: 'getChainNodes',
        data_chain_name: 'all',
      },
      type: 'json',
    }).then(data => {
      this.datachainsToSendSlecterChildren = [];
      this.datachainsToViewSlecterChildren = [];
      this.datachainsToSendSlecterChildren.push(
        <Select.Option key="default" value="default">
          默认
        </Select.Option>
      );
      this.datachainsToViewSlecterChildren.push(
        <Select.Option key="all" value="all">
          所有
        </Select.Option>
      );
      if (data && data.length > 0) {
        /*1.ABT AssetChain xenon filter data chain
          2.TBP chain version is too low, Temp filter out data chain
         */
        data = data.filter(function(e) {
          return e.name != 'xenon' && e.name != 'tpb';
        });

        for (var i = 0; i < data.length; i++) {
          var chainNameToShow = data[i].name.substring(0, 1).toUpperCase() + data[i].name.substring(1);
          this.datachainsToSendSlecterChildren.push(
            <Select.Option key={data[i].name} value={data[i].name}>
              {chainNameToShow}
            </Select.Option>
          );
          this.datachainsToViewSlecterChildren.push(
            <Select.Option key={data[i].name} value={data[i].name}>
              {chainNameToShow}
            </Select.Option>
          );
        }
        this.setState(
          {
            datachains_list: data,
          },
          () => {
            //console.log('fetchDatachainsList chainnodes ', this.state.datachains_list);
          }
        );
      }
    });
  };

  /*Fetch news flash */
  fetchNewsFlash = (params = {}, get_mode = 'list') => {
    const { news_type } = this.state;

    var udid = '';
    if (this.state.loading === true) {
      console.log('fetchNewsFlash is loading');
      return;
    }

    console.log('Start fetchNewsFlash');

    this.setState({
      loading: true,
    });

    var udid_to_show = '';
    if (this.state.session && this.state.session.user) {
      udid = this.state.session.user.did;
      if (this.state.show_mode === 'mine') {
        udid_to_show = this.state.session.user.did;
      }
    }

    if (get_mode === 'list') {
      var api_url = '/api/payments';
      if (news_fetch_mode === 'localdb') {
        api_url = '/api/newsflashget';
      }

      reqwest({
        url: api_url,
        method: 'get',
        data: {
          cmd: 'getNewsList',
          dapp_site_name: this.state.dapp_site_name_to_view,
          data_chain_name: this.state.datachain_node_name_to_view,
          module: 'newsflash',
          news_type: this.state.news_type,
          udid: udid,
          udid_to_show: udid_to_show,
          page: this.state.page_number,
          count: list_items_per_page,
          ...params,
        },
        type: 'json',
      }).then(data => {
        console.log('End fetchNewsFlash');
        //if(data && data.length > 0){
        //  console.log(data.slice(0, 9));
        //}

        if (news_list_show_mode === 'more') {
          let newsflash_list = this.state.newsflash_list;
          if (data && data.length > 0) {
            if (newsflash_list && newsflash_list.length > 0) {
              newsflash_list = newsflash_list.concat(data);
            } else {
              newsflash_list = data;
            }
          }
          let more_to_load = false;
          if (data && data.length >= list_items_per_page) {
            more_to_load = true;
          }

          this.setState({
            newsflash_list: newsflash_list,
            more_to_load: more_to_load,
            loading: false,
          });
        } else {
          /*paging mode*/
          let newsflash_list = this.state.newsflash_list;
          if (data && data.length > 0) {
            newsflash_list = data;
          }

          this.setState({
            newsflash_list: newsflash_list,
            loading: false,
          });
        }
      });
    } else {
      /*get total num*/

      reqwest({
        url: '/api/newsflashget',
        method: 'get',
        data: {
          cmd: 'getNewsTotalNum',
          dapp_site_name: this.state.dapp_site_name_to_view,
          data_chain_name: this.state.datachain_node_name_to_view,
          module: 'newsflash',
          news_type: this.state.news_type,
          udid: udid,
          udid_to_show: udid_to_show,
          ...params,
        },
        type: 'json',
      }).then(data => {
        console.log('End fetchNewsFlash, totalNum=', data);
        this.setState({
          newsflash_total_num: data,
          loading: false,
        });
      });
    }
  };

  /*News pagination change*/
  onNewsPaginationChange(pageNumber) {
    console.log('onNewsPaginationChange Page: ', pageNumber);
    this.setState(
      {
        newsflash_list: [],
        loading: false,
        page_number: pageNumber,
      },
      () => {
        const location_hash = '#type=' + this.state.news_type + '&page=' + String(this.state.page_number);
        window.location.hash = location_hash;
        //document.getElementById('HashNewsList').scrollIntoView();
        document.body.scrollIntoView();
        this.fetchNewsFlash();
      }
    );
  }

  /*Load more news flash */
  onLoadMore = () => {
    this.setState(
      {
        page_number: this.state.page_number + 1,
      },
      () => {
        this.fetchNewsFlash();
      }
    );
  };

  onLoadMoreBack = () => {
    this.setState(
      {
        newsflash_list: [],
        loading: false,
        more_to_load: true,
        page_number: 1,
      },
      () => {
        this.fetchNewsFlash();
      }
    );
  };

  scrollHandler = event => {
    let scrollTop = event.srcElement.body.scrollTop;
    //console.log('handleScroll', scrollTop); //滚动条距离页面的高度
    this.winW = window.innerWidth; //浏览器窗口的内部宽度
    this.winH = window.innerHeight; //浏览器窗口的内部高度
    this.sendNewsDialogWinWidth = this.winW > 20 ? this.winW - 10 : this.winW;
    this.commentInpuTopOffset = this.winH / 2;
    if (this.commentInpuTopOffset == 0) {
      this.commentInpuTopOffset = 20;
    }
    this.setState(
      {
        sendAffixOffsetTop: this.winH > 100 ? this.winH - 100 : 10,
      },
      () => {}
    );
  };

  resizeHandler = event => {
    this.winW = window.innerWidth; //浏览器窗口的内部宽度
    this.winH = window.innerHeight; //浏览器窗口的内部高度
    this.sendNewsDialogWinWidth = this.winW > 20 ? this.winW - 10 : this.winW;
    this.commentInpuTopOffset = this.winH / 2;
    if (this.commentInpuTopOffset == 0) {
      this.commentInpuTopOffset = 20;
    }
    this.setState(
      {
        sendAffixOffsetTop: this.winH > 100 ? this.winH - 100 : 10,
      },
      () => {}
    );
  };

  /*component mount process*/
  componentDidMount() {
    this.winW = window.innerWidth; //浏览器窗口的内部宽度
    this.winH = window.innerHeight; //浏览器窗口的内部高度
    this.sendNewsDialogWinWidth = this.winW > 20 ? this.winW - 10 : this.winW;
    this.commentInpuTopOffset = this.winH / 2;
    if (this.commentInpuTopOffset == 0) {
      this.commentInpuTopOffset = 20;
    }
    window.addEventListener('scroll', this.scrollHandler);
    window.addEventListener('resize', this.resizeHandler);
    this.setState(
      {
        sendAffixOffsetTop: this.winH > 100 ? this.winH - 100 : 10,
      },
      () => {}
    );

    //console.log('componentDidMount hash=', window.location.hash.slice(1));
    const location_hash = window.location.hash.slice(1);
    if (typeof location_hash != 'undefined' && location_hash && location_hash.length > 0) {
      const hashArr = location_hash.split('?');
      const params = qs.parse(hashArr[0]);
      var news_type = this.state.news_type;
      var page_number = this.state.page_number;
      if (params.type) {
        news_type = params.type;
      }
      if (params.page) {
        page_number = parseInt(params.page, 10);
      }

      this.setState(
        {
          news_type: news_type,
          page_number: page_number,
        },
        () => {
          console.log('componentDidMount news_type=', this.state.news_type);

          //let sub_menu_title = '快讯';
          //for(var i=0;i<flash_news_sub_menu.length;i++){
          //  if(this.state.news_type === flash_news_sub_menu[i].key){
          //    sub_menu_title = flash_news_sub_menu[i].value;
          //    break;
          //  }
          //}
          //this.setState({
          //  flash_news_sub_menu_title: sub_menu_title
          //},()=>{
          //});

          /*update state value*/
          if (this.state.news_type == 'test2' || this.state.news_type == 'articles') {
            this.setState(
              {
                news_title_enabled: false,
              },
              () => {}
            );
          }

          /*fetch app data*/
          this.fetchAppData();
        }
      );
    } else {
      this.fetchAppData();
    }

    if (!this.state.intervalIsSet) {
      //let interval = setInterval(this.fetchNewsFlash, 30000);
      //this.setState({ intervalIsSet: interval});
    }
  }

  /*component unmount process*/
  componentWillUnmount() {
    if (this.state.intervalIsSet) {
      clearInterval(this.state.intervalIsSet);
      this.setState({ intervalIsSet: null });
    }
    window.removeEventListener('scroll', this.scrollHandler);
    window.removeEventListener('resize', this.resizeHandler);
  }

  updateToPayValue = () => {
    const { news_type, news_title_enabled, news_title_to_send, news_content_to_send, news_to_send_weight } = this.state;

    var toPay = 0;
    var newsLength = 0;
    if (news_title_enabled && news_title_to_send) {
      newsLength += news_title_to_send.length;
    }
    if (news_content_to_send) {
      newsLength += news_content_to_send.length;
    }

    if (news_type != 'test2' && news_type != 'articles' && newsLength > 0) {
      toPay = forgeTxValueSecureConvert(toPayEachChar * news_to_send_weight * newsLength);
    }

    this.setState({
      toPay: toPay,
    });
  };

  handleNewsTypeMenuChange = e => {
    let menu_key = e.key;
    console.log('handleNewsTypeMenuChange key=', menu_key);

    //let sub_menu_title = '快讯';
    //for(var i=0;i<flash_news_sub_menu.length;i++){
    //  if(menu_key === flash_news_sub_menu[i].key){
    //    sub_menu_title = flash_news_sub_menu[i].value;
    //    break;
    //  }
    //}

    if (this.state.news_type != menu_key) {
      if (menu_key === 'test2' || menu_key === 'articles') {
        this.setState(
          {
            news_type: menu_key,
            //flash_news_sub_menu_title: sub_menu_title,
            newsflash_list: [],
            newsflash_total_num: 0,
            loading: false,
            more_to_load: true,
            page_number: 1,
            news_title_enabled: false,
          },
          () => {
            this.updateToPayValue();
            const location_hash = '#type=' + menu_key + '&page=' + String(this.state.page_number);
            window.location.hash = location_hash;
            if (news_list_show_mode === 'page') {
              this.fetchNewsFlash({}, 'total_num');
            }
            this.fetchNewsFlash();
          }
        );
      } else {
        this.setState(
          {
            news_type: menu_key,
            //flash_news_sub_menu_title: sub_menu_title,
            newsflash_list: [],
            newsflash_total_num: 0,
            loading: false,
            more_to_load: true,
            page_number: 1,
            news_title_enabled: false,
          },
          () => {
            this.updateToPayValue();
            const location_hash = '#type=' + menu_key + '&page=' + String(this.state.page_number);
            window.location.hash = location_hash;
            if (news_list_show_mode === 'page') {
              this.fetchNewsFlash({}, 'total_num');
            }
            this.fetchNewsFlash();
          }
        );
      }
    }
  };

  handleFlashNewsSubMenuTitleClick = () => {
    if (
      this.state.news_type === 'hot' ||
      this.state.news_type === 'articles' ||
      this.state.news_type === 'test' ||
      this.state.news_type === 'test2'
    ) {
      let news_type = 'chains';
      this.setState(
        {
          news_type: news_type,
          newsflash_list: [],
          newsflash_total_num: 0,
          loading: false,
          more_to_load: true,
          page_number: 1,
          news_title_enabled: false,
        },
        () => {
          this.updateToPayValue();
          const location_hash = '#type=' + news_type + '&page=' + String(this.state.page_number);
          window.location.hash = location_hash;
          if (news_list_show_mode === 'page') {
            this.fetchNewsFlash({}, 'total_num');
          }
          this.fetchNewsFlash();
        }
      );
    }
  };

  handleNewsTypeChange = value => {
    console.log('handleNewsTypeChange value=', value);

    if (value === 'test2' || value === 'articles') {
      this.setState(
        {
          news_type: value,
          newsflash_list: [],
          newsflash_total_num: 0,
          loading: false,
          more_to_load: true,
          page_number: 1,
          news_title_enabled: false,
        },
        () => {
          this.updateToPayValue();
          const location_hash = '#type=' + value + '&page=' + String(this.state.page_number);
          window.location.hash = location_hash;
          if (news_list_show_mode === 'page') {
            this.fetchNewsFlash({}, 'total_num');
          }
          this.fetchNewsFlash();
        }
      );
    } else {
      this.setState(
        {
          news_type: value,
          newsflash_list: [],
          newsflash_total_num: 0,
          loading: false,
          more_to_load: true,
          page_number: 1,
          news_title_enabled: false,
        },
        () => {
          this.updateToPayValue();
          const location_hash = '#type=' + value + '&page=' + String(this.state.page_number);
          window.location.hash = location_hash;
          if (news_list_show_mode === 'page') {
            this.fetchNewsFlash({}, 'total_num');
          }
          this.fetchNewsFlash();
        }
      );
    }
  };

  onDappSiteNameToViewChange = value => {
    console.log('onDappSiteNameToViewChange value=', value);
    this.setState(
      {
        dapp_site_name_to_view: value,
        newsflash_list: [],
        newsflash_total_num: 0,
        loading: false,
        more_to_load: true,
        page_number: 1,
      },
      () => {
        if (news_list_show_mode === 'page') {
          this.fetchNewsFlash({}, 'total_num');
        }
        this.fetchNewsFlash();
      }
    );
  };

  onDatachainNodeToViewChange = value => {
    console.log('onDatachainNodeToViewChange value=', value);
    this.setState(
      {
        datachain_node_name_to_view: value,
        newsflash_list: [],
        newsflash_total_num: 0,
        loading: false,
        more_to_load: true,
        page_number: 1,
      },
      () => {
        if (news_list_show_mode === 'page') {
          this.fetchNewsFlash({}, 'total_num');
        }
        this.fetchNewsFlash();
      }
    );
  };

  onDatachainNodeToSendChange = value => {
    console.log('onDatachainNodeToSendChange value=', value);
    this.setState(
      {
        datachain_node_name_to_send: value,
      },
      () => {}
    );
  };

  onNewsOriginTypeChange = value => {
    console.log('onNewsOriginTypeChange value=', value);
    this.setState({ news_content_origin: value });
  };

  onShowModeChange = checked => {
    var show_mode = '';
    if (checked) {
      show_mode = 'all';
    } else {
      show_mode = 'mine';
    }
    this.setState(
      {
        newsflash_list: [],
        newsflash_total_num: 0,
        loading: false,
        more_to_load: true,
        page_number: 1,
        show_mode: show_mode,
      },
      () => {
        console.log('show mode change to', this.state.show_mode);
        if (news_list_show_mode === 'page') {
          this.fetchNewsFlash({}, 'total_num');
        }
        this.fetchNewsFlash();
      }
    );
  };

  onOpenSendNewsDialogButtonClick = async () => {
    const { session } = this.state;
    const { user, token } = session;

    if (isProduction && !user) {
      window.location.href = '/?openLogin=true';
      return null;
    }

    document.body.scrollIntoView(); /*scroll to top*/
    await sleep(100);
    this.setState(
      {
        send_news_dialog_visible: true,
      },
      () => {
        let inputArea = this.refs.newsContentTextArea;
        inputArea.focus();
      }
    );
  };

  handleSendNewsDialogOk = e => {
    console.log('handleSendNewsDialogOk');

    this.setState(
      {
        send_news_dialog_visible: false,
      },
      () => {}
    );
  };

  handleSendNewsDialogCancel = e => {
    console.log('handleSendNewsDialogCancel');

    this.setState(
      {
        send_news_dialog_visible: false,
      },
      () => {}
    );
  };

  onNewsflashWeightChange = value => {
    if (typeof value === 'number' && value <= news_weights_value_max && value >= news_weights_value_min) {
      console.log('onNewsflashWeightChange: ', value);

      /*update minner number max*/
      news_comment_minner_number_max = Math.floor(news_comment_minner_number_default * value);
      news_like_minner_number_max = Math.floor(news_like_minner_number_default * value);
      news_forward_minner_number_max = Math.floor(news_forward_minner_number_default * value);

      this.setState(
        {
          news_to_send_weight: value,
        },
        () => {
          this.updateToPayValue();
        }
      );
    }
  };

  onNewsTitleCheckBoxChange = e => {
    //console.log(`checked = ${e.target.checked}`);
    this.setState(
      {
        news_title_to_send: '',
        news_title_enabled: e.target.checked,
      },
      () => {}
    );
  };

  onNewsTitleToSendChange = ({ target: { value } }) => {
    //console.log('onNewsTitleToSendChange value='+value+' length='+value.length);

    this.setState(
      {
        news_title_to_send: value,
      },
      () => {}
    );

    if (this.newsToPayCalcTimeout) {
      clearTimeout(this.newsToPayCalcTimeout);
      this.newsToPayCalcTimeout = null;
    }

    this.newsToPayCalcTimeout = setTimeout(() => {
      this.updateToPayValue();
      this.newsToPayCalcTimeout = null;
    }, 1000);
  };

  onNewsContentToSendChange = ({ target: { value } }) => {
    //console.log('onNewsContentToSendChange value='+value+' length='+value.length);

    this.setState(
      {
        news_content_to_send: value,
      },
      () => {}
    );

    if (this.newsToPayCalcTimeout) {
      clearTimeout(this.newsToPayCalcTimeout);
      this.newsToPayCalcTimeout = null;
    }

    this.newsToPayCalcTimeout = setTimeout(() => {
      this.updateToPayValue();
      this.newsToPayCalcTimeout = null;
    }, 1000);
  };

  onNewsArticleWorthChange = value => {
    this.setState({ news_article_worth: value });
  };

  onNewsImageUploadChange = ({ fileList }) => {
    console.log('onNewsImageUploadChange fileList.length=', fileList.length);

    /*filter out invalid picture*/
    for (var i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
      if (!isJpgOrPng) {
        Modal.error({ title: '只能添加JPG/PNG图片!', maskClosable: 'true' });

        const index = fileList.indexOf(file);
        const newFileList = fileList.slice();
        newFileList.splice(index, 1);
        fileList = newFileList;
      } else {
        const isLt1M = file.size / 1024 / 1024 < 1;
        if (!isLt1M) {
          Modal.error({ title: '图片大小需小于1MB!', maskClosable: 'true' });

          const index = fileList.indexOf(file);
          const newFileList = fileList.slice();
          newFileList.splice(index, 1);
          fileList = newFileList;
        }
      }
    }

    if (fileList && fileList.length >= 1) {
      getBase64(fileList[0].originFileObj, image =>
        this.setState({
          news_image_url: image,
        })
      );
    }

    this.setState({
      news_image_file_list: fileList,
    });
  };

  onNewsImagePreviewCancel = () => this.setState({ news_image_preview_visible: false });

  onNewsImagePreview = file => {
    this.setState({
      news_image_preview_image: file.url || file.thumbUrl,
      news_image_preview_visible: true,
    });
  };

  onCommentToSendChange = ({ target: { value } }) => {
    //console.log('onCommentToSendChange value='+value+' length='+value.length);
    this.setState({ comment_to_send: value });
  };

  /*send news button handler*/
  onSendNews = () => {
    this.handleSendNews();
  };

  onNewsSendCommentMinnerNumberCfgChange = value => {
    if (
      typeof value === 'number' &&
      value <= news_comment_minner_number_max &&
      value >= news_comment_minner_number_min
    ) {
      console.log('onNewsSendCommentMinnerNumberCfgChange: ', value);

      this.setState(
        {
          news_comment_minner_number: value,
        },
        () => {}
      );
    }
  };

  onNewsSendLikeMinnerNumberCfgChange = value => {
    if (typeof value === 'number' && value <= news_like_minner_number_max && value >= news_like_minner_number_min) {
      console.log('onNewsSendLikeMinnerNumberCfgChange: ', value);

      this.setState(
        {
          news_like_minner_number: value,
        },
        () => {}
      );
    }
  };

  onNewsSendForwardMinnerNumberCfgChange = value => {
    if (
      typeof value === 'number' &&
      value <= news_forward_minner_number_max &&
      value >= news_forward_minner_number_min
    ) {
      console.log('onNewsSendForwardMinnerNumberCfgChange: ', value);

      this.setState(
        {
          news_forward_minner_number: value,
        },
        () => {}
      );
    }
  };

  handleNewsSendCfgOk = e => {
    console.log('handleNewsSendCfgOk');

    this.setState(
      {
        news_to_send_cfg_visible: false,
      },
      () => {
        this.handleSendNews();
      }
    );
  };

  handleNewsSendCfgCancel = e => {
    console.log('handleNewsSendCfgCancel');

    this.setState(
      {
        news_to_send_cfg_visible: false,
      },
      () => {}
    );
  };

  /*Send news handler*/
  handleSendNews = () => {
    console.log('handleSendNews');

    /*Update to pay value*/
    this.updateToPayValue();

    const {
      session,
      datachain_node_name_to_send,
      news_type,
      news_article_worth,
      news_title_enabled,
      news_title_to_send,
      news_content_to_send,
      news_content_origin,
      news_image_url,
      news_to_send_weight,
      news_comment_minner_number,
      news_like_minner_number,
      news_forward_minner_number,
    } = this.state;
    const { user, token } = session;

    if (news_content_to_send.length > 0) {
      const asset_did = HashString('sha1', news_content_to_send);
      console.log('asset_did=', asset_did);

      if (news_to_chain_mode === 'direct') {
        this.setState({
          asset_did: asset_did,
          sending: true,
        });
      } else {
        const formData = new FormData();

        formData.append('user', JSON.stringify(user));
        if (news_type === 'test2' || news_type === 'articles') {
          formData.append('cmd', 'create_asset_on_chain');
          this.setState({
            asset_sending: true,
          });
        } else {
          formData.append('cmd', 'add');
        }
        formData.append('data_chain_name', datachain_node_name_to_send);
        formData.append('asset_did', asset_did);
        formData.append('news_type', news_type);
        if (news_title_enabled) {
          formData.append('news_title', news_title_to_send);
        } else {
          formData.append('news_title', '');
        }
        formData.append('news_content', news_content_to_send);
        formData.append('news_origin', news_content_origin);
        if (news_type === 'test2' || news_type === 'articles') {
          formData.append('news_article_worth', news_article_worth);
        }
        if (news_image_url) {
          formData.append('news_image_url', JSON.stringify(news_image_url));
        }
        formData.append('news_weights', news_to_send_weight);
        formData.append('comment_minner_number', news_comment_minner_number);
        formData.append('like_minner_number', news_like_minner_number);
        formData.append('forward_minner_number', news_forward_minner_number);

        reqwest({
          url: '/api/newsflashset',
          method: 'post',
          processData: false,
          data: formData,
          success: result => {
            //console.log('add newsflash success with response=', result.response);
            if (news_type === 'test2' || news_type === 'articles') {
              this.setState({
                send_news_dialog_visible: false,
                news_article_worth: '',
                news_title_to_send: '',
                news_content_to_send: '',
                news_image_file_list: [],
                news_image_url: null,
                toPay: 0,
                asset_sending: false,
              });

              setTimeout(() => {
                try {
                  this.setState(
                    {
                      newsflash_list: [],
                      newsflash_total_num: 0,
                      loading: false,
                      more_to_load: true,
                      page_number: 1,
                    },
                    () => {
                      if (news_list_show_mode === 'page') {
                        this.fetchNewsFlash({}, 'total_num');
                      }
                      this.fetchNewsFlash();
                    }
                  );
                } catch (err) {
                  // Do nothing
                }
              }, 5000);

              Modal.success({ title: '发布成功', maskClosable: 'true' });
            } else {
              this.setState({
                asset_did: asset_did,
                sending: true,
              });
            }
          },
          error: result => {
            console.log('add newsflash error with response=', result.response);
            if (news_type === 'test2' || news_type === 'articles') {
              this.setState({
                asset_sending: false,
              });
            }

            Modal.error({ title: '发布失败', maskClosable: 'true' });
          },
        });
      }
    }
  };

  newsflashListItemFind = asset_did => {
    const { newsflash_list } = this.state;
    var newsflashItem = null;

    if (!newsflash_list || newsflash_list.length == 0) {
      return null;
    }

    newsflashItem = newsflash_list.find(function(x) {
      return x.asset_did === asset_did;
    });

    return newsflashItem;
  };

  newsflashListItemLikeStatusGet = (item, userDid) => {
    var likeStatus = false;
    var like_list_item = null;

    if (item && item.like_list && item.like_list.length > 0) {
      like_list_item = item.like_list.find(function(x) {
        return x.udid === userDid;
      });
      if (like_list_item) {
        likeStatus = true;
      }
    }

    return likeStatus;
  };

  newsflashListItemForwardStatusGet = (item, userDid) => {
    var forwardStatus = false;
    var forward_list_item = null;

    if (item && item.forward_list && item.forward_list.length > 0) {
      forward_list_item = item.forward_list.find(function(x) {
        return x.udid === userDid;
      });
      if (forward_list_item) {
        forwardStatus = true;
      }
    }

    return forwardStatus;
  };

  genShareNewsPoster = async () => {
    this.setState(
      {
        gen_share_news_visible: true,
      },
      async () => {
        share_news_pic_data = '';

        await sleep(1000);

        //document.getElementById('shareNewsListItemContent').style.whiteSpace = 'pre-wrap';
        //document.getElementById('shareNewsListItemContent').style.wordWrap = 'break-word';
        //document.getElementById('shareNewsListItemContent').style.wordBreak = 'break-all';

        var shareContent = document.getElementById('shareNewsContent');
        //shareContent.style.position = 'fixed';

        var canvas = document.createElement('canvas'); //创建一个canvas节点
        var scale = 4; //定义任意放大倍数 支持小数
        var width = shareContent.offsetWidth; //获取dom 宽度
        var height = shareContent.offsetHeight; //获取dom 高度
        canvas.width = width * scale; //定义canvas 宽度 * 缩放
        canvas.height = height * scale; //定义canvas高度 *缩放
        //canvas.getContext("2d").scale(scale,scale); //获取context,设置scale
        var opts = {
          scale: scale,
          canvas: canvas, //自定义 canvas
          logging: false,
          width: width, //dom 原始宽度
          height: height, //dom 原始高度
          dpi: window.devicePixelRatio * 8,
          letterRendering: true,
          useCORS: true,
          scrollX: 0,
          scrollY: 0,
        };

        html2canvas(document.getElementById('shareNewsContent'), opts).then(function(canvas) {
          share_news_pic_data = canvas.toDataURL('image/jpg');
        });
      }
    );

    /*wait share news pic ready*/
    var wait_counter = 0;
    while (share_news_pic_data.length == 0) {
      await sleep(1);
      wait_counter++;
      if (wait_counter > 15000) {
        break;
      }
    }
    console.log('share news pic ready counter=', wait_counter);
    if (share_news_pic_data.length > 0) {
      if (navigator && navigator.share) {
        this.setState(
          {
            gen_share_news_visible: false,
          },
          () => {
            let posterImageFile = dataURLtoFile(share_news_pic_data, 'HNPoster.jpg');
            let shareFilesArray = [posterImageFile];

            navigator
              .share({
                files: shareFilesArray,
              })
              .then(() => {})
              .catch(error => {
                console.log('Error sharing:', error);
              });

            if (this.shareNewsPicTimeout) {
              clearTimeout(this.shareNewsPicTimeout);
              this.shareNewsPicTimeout = null;
            }
            this.shareNewsPicTimeout = setTimeout(() => {
              this.shareNewsFulfilledProc();
            }, 8000);
          }
        );
      } else {
        this.setState(
          {
            gen_share_news_visible: false,
            share_news_pic_visible: true,
            shared_btn_disabled: true,
          },
          () => {
            let posterImage = document.getElementById('shareNewsPic');
            posterImage.src = share_news_pic_data;
          }
        );
      }
    } else {
      this.setState(
        {
          gen_share_news_visible: false,
        },
        () => {}
      );
      consolg.log('share news failure');
    }
  };

  onListItemActionClick = async (action_type, asset_did) => {
    const { session, newsflash_list } = this.state;
    const { user, token } = session;
    var newsflashItem = this.newsflashListItemFind(asset_did);

    console.log('onListItemActionClick action_type=', action_type, 'asset_did=', asset_did);

    if (!newsflashItem) {
      console.log('onListItemActionClick invalid newsflash item');
      return null;
    }

    if (isProduction && !user && action_type != 'share') {
      window.location.href = '/?openLogin=true';
      return null;
    }

    /*Disable auto refresh*/
    if (this.state.intervalIsSet) {
      clearInterval(this.state.intervalIsSet);
      this.setState({ intervalIsSet: null });
    }

    switch (action_type) {
      case 'like':
        /*verify if already liked*/
        if (this.newsflashListItemLikeStatusGet(newsflashItem, user.did)) {
          Modal.success({ title: '已赞过', maskClosable: 'true' });
        } else {
          newsflashItem.like_cnt += 1;
          const like_list_item = {
            udid: user.did,
            mbalance: 0,
          };
          newsflashItem.like_list.push(like_list_item);
          newsflashItem.like_status = true;

          /*send like minning request*/
          this.setState({
            minning: true,
          });

          const formData = new FormData();
          formData.append('user', JSON.stringify(user));
          formData.append('cmd', 'give_like');
          formData.append('asset_did', asset_did);

          reqwest({
            url: '/api/newsflashset',
            method: 'post',
            processData: false,
            data: formData,
            success: result => {
              console.log('like minning success with response=', result.response);
              if (parseFloat(result.response) > 0) {
                newsflashItem.like_min_rem -= parseFloat(result.response);
                newsflashItem.like_min_rem = forgeTxValueSecureConvert(newsflashItem.like_min_rem);
                const modal_content = '获得' + result.response + token.symbol + '，请到ABT钱包中查看!';
                Modal.success({ title: modal_content, maskClosable: 'true' });
              } else {
                console.log('like minning poll is empty');
              }
              this.setState({
                minning: false,
              });
            },
            error: result => {
              console.log('like minning error with response=', result.response);
              this.setState({
                minning: false,
              });
            },
          });
        }
        break;
      case 'comment':
        this.comment_asset_did = asset_did;
        this.setState({
          comment_input_visible: true,
        });
        break;
      case 'share':
        this.shareNewsPicUserCancel = false;
        this.share_asset_did = asset_did;
        this.share_news_items[0] = newsflashItem;

        /*
        this.setState({
          share_news_user_slogan_input_visible: true
        }, async ()=>{
        });
        */

        this.setState(
          {
            gen_share_news_visible: true,
          },
          async () => {
            await this.genShareNewsPoster();
          }
        );
        break;
      case 'paytip':
        this.paytip_asset_did = asset_did;
        if (user && user.did === newsflashItem.sender) {
          Modal.error({ title: '不能打赏给自己！', maskClosable: 'true' });
        } else {
          this.setState(
            {
              paytip_input_visible: true,
            },
            async () => {}
          );
        }
        break;
      default:
        break;
    }
  };

  IconText = ({
    type,
    text,
    token_symbol,
    show_extra_info,
    balance,
    minner_num,
    action_type,
    like_status,
    asset_did,
  }) => (
    <span>
      {/*<img className="list-item-action-img" src="/static/images/hashnews/ABT.png" alt="ABT" height="25" width="25" />*/}
      <a
        onClick={e => {
          this.onListItemActionClick(action_type, asset_did);
        }}>
        {action_type == 'like' && like_status == true ? (
          <Icon
            type={type}
            theme="twoTone"
            twoToneColor="#0000FF"
            style={{ fontSize: '16px', marginLeft: 0, marginRight: 4 }}
          />
        ) : (
          <Icon type={type} style={{ fontSize: '16px', marginLeft: 0, marginRight: 8 }} />
        )}
        <span>{text}</span>
      </a>
      {show_extra_info && <br />}
      {show_extra_info && <span style={{ fontSize: '9px', color: '#FF6600' }}>₳ {balance}</span>}
      {/*show_extra_info && (<span style={{ fontSize: '9px', color: '#FF6600' }}>{token_symbol}</span>)*/}
      {/*show_extra_info && (<span style={{ fontSize: '9px', color: '#FF6600' }}>({minner_num}个)</span>)*/}
    </span>
  );

  IconTextForShare = ({
    type,
    text,
    token_symbol,
    total_min_rem,
    balance,
    minner_num,
    action_type,
    like_status,
    asset_did,
  }) => (
    <span>
      {/*<img className="list-item-action-img" src="/static/images/hashnews/ABT.png" alt="ABT" height="25" width="25" />*/}
      <a
        onClick={e => {
          this.onListItemActionClick(action_type, asset_did);
        }}>
        {action_type == 'like' && like_status == true ? (
          <Icon
            type={type}
            theme="twoTone"
            twoToneColor="#0000FF"
            style={{ fontSize: '16px', marginLeft: 0, marginRight: 4 }}
          />
        ) : (
          <Icon type={type} style={{ fontSize: '16px', marginLeft: 0, marginRight: 8 }} />
        )}
        <span>{text}</span>
      </a>
      {total_min_rem > 0 && <br />}
      {total_min_rem > 0 && <span style={{ fontSize: '9px', color: '#FF6600' }}>{balance}</span>}
      {total_min_rem > 0 && <span style={{ fontSize: '9px', color: '#FF6600' }}> {token_symbol}</span>}
      {total_min_rem > 0 && <span style={{ fontSize: '9px', color: '#FF6600' }}>({minner_num}个)</span>}
    </span>
  );

  CommentList = ({ asset_did, comment_cnt, comment_list, token }) => (
    <Paragraph className="antd-list-comment-list-text" ellipsis={{ rows: 8, expandable: true }}>
      {comment_list.map(x => renderCommentList(x, token))}
    </Paragraph>
  );

  PaytipList = ({ asset_did, paytip_cnt, paytip_list, token }) => (
    <Paragraph className="antd-list-comment-list-text" ellipsis={{ rows: 6, expandable: true }}>
      {paytip_list.map(x => renderPaytipList(x, token))}
    </Paragraph>
  );

  handleCommentInputOk = e => {
    const { session, newsflash_list, comment_to_send } = this.state;
    const { user, token } = session;
    var newsflashItem = this.newsflashListItemFind(this.comment_asset_did);

    if (!newsflashItem) {
      console.log('handleCommentInputOk invalid newsflash item');
      return null;
    }

    //verify input parameter
    if (!this.comment_asset_did || this.comment_asset_did.length == 0) {
      console.log('handleCommentInputOk invalid comment_asset_did');
      return null;
    }
    if (!comment_to_send || comment_to_send.length == 0) {
      console.log('handleCommentInputOk comment_to_send is empy');
      return null;
    }

    console.log('handleCommentInputOk, asset_did=', this.comment_asset_did);
    console.log('comment_to_send.length=', comment_to_send.length);
    //console.log('comment_to_send=', comment_to_send);

    var current_time = getCurrentTime();
    //console.log('current_time=', current_time);

    const uname_with_did = user.name + '(' + getUserDidFragment(user.did) + ')';
    var comment_list_item = {
      uname: uname_with_did,
      udid: user.did,
      time: current_time,
      comment: comment_to_send,
      mbalance: 0,
    };

    /*send comment minning request*/
    this.setState({
      minning: true,
    });

    const formData = new FormData();
    formData.append('user', JSON.stringify(user));
    formData.append('cmd', 'add_comment');
    formData.append('asset_did', this.comment_asset_did);
    formData.append('comment', comment_to_send);

    reqwest({
      url: '/api/newsflashset',
      method: 'post',
      processData: false,
      data: formData,
      success: result => {
        console.log('add comment minning success with response=', result.response);
        if (parseFloat(result.response) > 0) {
          newsflashItem.comment_min_rem -= parseFloat(result.response);
          newsflashItem.comment_min_rem = forgeTxValueSecureConvert(newsflashItem.comment_min_rem);
          const modal_content = '获得' + result.response + token.symbol + '，请到ABT钱包中查看!';
          Modal.success({ title: modal_content, maskClosable: 'true' });
        } else {
          console.log('comment minning poll is empty');
        }

        newsflashItem.comment_cnt += 1;
        comment_list_item.mbalance = parseFloat(result.response);
        //newsflashItem.comment_list.push(comment_list_item); /*Add to tail*/
        newsflashItem.comment_list.unshift(comment_list_item); /*Add to head*/

        this.setState({
          minning: false,
        });
      },
      error: result => {
        console.log('comment minning error with response=', result.response);
        Modal.error({ title: '评论失败', maskClosable: 'true' });
        this.setState({
          minning: false,
        });
      },
    });

    this.setState(
      {
        comment_to_send: '',
        comment_input_visible: false,
      },
      () => {
        this.comment_asset_did = '';
      }
    );
  };

  handleCommentInputCancel = e => {
    console.log('handleCommentInputCancel, asset_did=', this.comment_asset_did);

    this.setState(
      {
        comment_input_visible: false,
      },
      () => {
        this.comment_asset_did = '';
      }
    );
  };

  handleShareNewsPicContextMenu = e => {
    //console.log('handleShareNewsPicContextMenu, e=', e);
    if (this.shareNewsPicTimeout) {
      clearTimeout(this.shareNewsPicTimeout);
      this.shareNewsPicTimeout = null;
    }

    this.shareNewsPicTimeout = setTimeout(() => {
      this.setState(
        {
          shared_btn_disabled: false,
        },
        () => {}
      );
    }, 8000);
  };

  onShareNewsUserSloganChange = ({ target: { value } }) => {
    //console.log('onShareNewsUserSloganChange value='+value+' length='+value.length);

    this.setState(
      {
        share_news_user_slogan_content: value,
      },
      () => {}
    );
  };

  handleShareNewsUserSloganInputOk = e => {
    console.log('handleShareNewsUserSloganInputOk, asset_did=', this.share_asset_did);

    this.setState(
      {
        share_news_user_slogan_input_visible: false,
      },
      () => {
        this.setState(
          {
            gen_share_news_visible: true,
          },
          async () => {
            await this.genShareNewsPoster();
          }
        );
      }
    );
  };

  handleShareNewsUserSloganInputCancel = e => {
    console.log('handleShareNewsUserSloganInputCancel, asset_did=', this.share_asset_did);

    this.setState(
      {
        share_news_user_slogan_input_visible: false,
      },
      () => {
        this.setState(
          {
            gen_share_news_visible: true,
          },
          async () => {
            await this.genShareNewsPoster();
          }
        );
      }
    );
  };

  handleGenShareNewsOk = e => {
    console.log('handleGenShareNewsOk, asset_did=', this.share_asset_did);

    this.setState(
      {
        gen_share_news_visible: false,
      },
      () => {}
    );
  };

  handleGenShareNewsCancel = e => {
    console.log('handleGenShareNewsCancel, asset_did=', this.share_asset_did);

    this.setState(
      {
        gen_share_news_visible: false,
      },
      () => {
        this.share_asset_did = '';
      }
    );
  };

  shareNewsFulfilledProc = () => {
    const { session } = this.state;
    const { user, token } = session;

    if (this.shareNewsPicUserCancel === false) {
      var newsflashItem = this.newsflashListItemFind(this.share_asset_did);
      if (newsflashItem && user) {
        newsflashItem.forward_cnt += 1;
        const forward_list_item = {
          udid: user.did,
          mbalance: 0,
        };
        newsflashItem.forward_list.push(forward_list_item);

        /*send forward minning request*/
        this.setState({
          minning: true,
        });

        const formData = new FormData();
        formData.append('user', JSON.stringify(user));
        formData.append('cmd', 'forward');
        formData.append('asset_did', this.share_asset_did);

        reqwest({
          url: '/api/newsflashset',
          method: 'post',
          processData: false,
          data: formData,
          success: result => {
            console.log('forward minning success with response=', result.response);
            if (parseFloat(result.response) > 0) {
              newsflashItem.forward_min_rem -= parseFloat(result.response);
              newsflashItem.forward_min_rem = forgeTxValueSecureConvert(newsflashItem.forward_min_rem);
              //const modal_content = '获得'+result.response+token.symbol+"，请到ABT钱包中查看!";
              //Modal.success({title: modal_content, maskClosable: 'true'});
            } else {
              console.log('forward minning poll is empty or already minned');
            }
            this.setState({
              minning: false,
            });
          },
          error: result => {
            console.log('forward minning error with response=', result.response);
            this.setState({
              minning: false,
            });
          },
        });
      } else {
        console.log('handleShareNewsPicOk unknown news item or not login.');
      }
    }

    this.setState(
      {
        share_news_pic_visible: false,
        shared_btn_disabled: true,
      },
      () => {
        share_news_pic_data = '';
        this.share_asset_did = '';
      }
    );
  };

  handleShareNewsPicOk = async e => {
    console.log('handleShareNewsPicOk share_news_pic_data.length=', share_news_pic_data.length);

    if (navigator && navigator.share) {
      let posterImageFile = dataURLtoFile(share_news_pic_data, 'HNPoster.jpg');
      let shareFilesArray = [posterImageFile];

      /*
      try {
        await navigator.share({
          text: hashnews_slogan, 
          files: shareFilesArray
        });
        console.log("Data was shared successfully");
        this.shareNewsFulfilledProc();
      } catch (err) {
        console.error("Share failed!");
      }
      */

      /*
      navigator.share({
        text: hashnews_slogan,
        files: shareFilesArray
      })
      .then(() => {
        this.shareNewsFulfilledProc();
      })
      .catch((error) => {
        console.log('Error sharing:', error);
      });
      */

      navigator
        .share({
          files: shareFilesArray,
        })
        .then(() => {})
        .catch(error => {
          console.log('Error sharing:', error);
        });

      this.setState(
        {
          share_news_pic_visible: false,
        },
        () => {}
      );

      if (this.shareNewsPicTimeout) {
        clearTimeout(this.shareNewsPicTimeout);
        this.shareNewsPicTimeout = null;
      }
      this.shareNewsPicTimeout = setTimeout(() => {
        this.shareNewsFulfilledProc();
      }, 8000);
    } else {
      this.shareNewsFulfilledProc();
    }
  };

  handleShareNewsPicCancel = e => {
    console.log('handleShareNewsPicCancel share_news_pic_data.length=', share_news_pic_data.length);

    this.shareNewsPicUserCancel = true;

    this.setState(
      {
        share_news_pic_visible: false,
        shared_btn_disabled: true,
      },
      () => {
        share_news_pic_data = '';
        this.share_asset_did = '';
      }
    );
  };

  handlePaytipDialogOk = e => {
    const { session, newsflash_list, paytip_input_value } = this.state;
    const { user, token } = session;
    var newsflashItem = this.newsflashListItemFind(this.paytip_asset_did);

    if (!newsflashItem) {
      console.log('handlePaytipDialogOk invalid newsflash item');
      return null;
    }

    //verify input parameter
    if (!this.paytip_asset_did || this.paytip_asset_did.length == 0) {
      console.log('handlePaytipDialogOk invalid asset_did');
      return null;
    }
    if (paytip_input_value === '' || parseFloat(paytip_input_value) <= 0) {
      console.log('handlePaytipDialogOk paytip_input_value is zero');
      return null;
    }

    console.log('handlePaytipDialogOk, asset_did=', this.paytip_asset_did);
    console.log('paytip_input_value=', paytip_input_value);

    this.setState(
      {
        paytip_input_visible: false,
        paytip_target_did: newsflashItem.sender,
        paytip_sending: true,
      },
      () => {}
    );
  };

  handlePaytipDialogCancel = e => {
    console.log('handlePaytipDialogCancel, asset_did=', this.paytip_asset_did);

    this.setState(
      {
        paytip_input_visible: false,
      },
      () => {
        this.paytip_asset_did = '';
      }
    );
  };

  onPaytipValueChange = value => {
    this.setState({ paytip_input_value: value });
  };

  onPaytipCommentChange = ({ target: { value } }) => {
    //console.log('onPaytipCommentChange value='+value+' length='+value.length);
    this.setState({ paytip_comment: value });
  };

  onPaymentClose = async result => {
    console.log('onPaymentClose');
    this.setState({
      sending: false,
      paytip_sending: false,
    });
  };

  onPaytipPaymentClose = async result => {
    console.log('onPaytipPaymentClose');
    this.setState({
      sending: false,
      paytip_sending: false,
    });
    window.location.reload();
  };

  onPaymentError = async result => {
    console.log('onPaymentError');
    this.setState({
      sending: false,
      paytip_sending: false,
    });
    window.location.reload();
  };

  onPaymentSuccess = async result => {
    console.log('onPaymentSuccess');
    this.setState({
      send_news_dialog_visible: false,
      news_title_to_send: '',
      news_content_to_send: '',
      news_image_file_list: [],
      news_image_url: null,
      toPay: 0,
      sending: false,
      paytip_sending: false,
    });

    setTimeout(() => {
      window.location.reload();
    }, 8000);
  };

  render() {
    const {
      session,
      news_type,
      news_article_worth,
      news_to_send_weight,
      news_title_to_send,
      news_content_to_send,
      news_image_file_list,
      news_image_url,
      news_image_preview_visible,
      news_image_preview_image,
      sendAffixOffsetTop,
      comment_to_send,
      toPay,
      sending,
      asset_sending,
      paytip_sending,
      datachains_list,
      newsflash_list,
      more_to_load,
      loading,
    } = this.state;
    //console.log('render session=', session);
    //console.log('render props=', this.props);

    const loadMore =
      more_to_load && !loading ? (
        <div
          style={{
            textAlign: 'center',
            marginTop: 12,
            height: 32,
            lineHeight: '32px',
          }}>
          <Button onClick={this.onLoadMore} style={{ fontSize: '16px', color: '#0000FF', marginRight: 20 }}>
            <Icon type="caret-down" />
            更多
          </Button>
          <Button onClick={this.onLoadMoreBack} style={{ fontSize: '16px', color: '#009933' }}>
            <Icon type="caret-up" />
            返回
          </Button>
        </div>
      ) : newsflash_list.length > 0 ? (
        <div
          style={{
            textAlign: 'center',
            marginTop: 12,
            height: 32,
            lineHeight: '32px',
          }}>
          <Button onClick={this.onLoadMoreBack} style={{ fontSize: '16px', color: '#009933' }}>
            <Icon type="caret-up" />
            返回
          </Button>
        </div>
      ) : null;

    if (!session) {
      return (
        <Layout title={env.appName}>
          <Main>
            <CircularProgress />
          </Main>
        </Layout>
      );
    }

    //if ( isProduction && !session.user) {
    //  console.log('render user not exist');
    //  window.location.href = '/?openLogin=true';
    //  return null;
    //}

    if (news_type === 'test2' || news_type === 'articles') {
      news_content_max_length = 5000;
    } else {
      news_content_max_length = 1000;
    }

    const { user, token } = session;
    //console.log('render session.user=', user);
    //console.log('render session.token=', token);

    const dapp = 'newsflash';
    let para_obj = {};
    let para = '';
    let tipValue = 0;
    let tipAddr = '';

    if (sending) {
      para_obj = { asset_did: this.state.asset_did };
      para = JSON.stringify(para_obj);
    } else if (paytip_sending) {
      if (user) {
        para_obj = {
          action: 'pay_tip',
          asset_did: this.paytip_asset_did,
          payer_uname: user.name,
          comment: this.state.paytip_comment,
        };
      } else {
        para_obj = {
          action: 'pay_tip',
          asset_did: this.paytip_asset_did,
          payer_uname: 'unknown',
          comment: this.state.paytip_comment,
        };
      }
      para = JSON.stringify(para_obj);
      tipValue = parseFloat(this.state.paytip_input_value);
      tipAddr = this.state.paytip_target_did;
    }

    //if(this.state.newsflash_list && this.state.newsflash_list.length > 0){
    //console.log('render newsflash_list=', this.state.newsflash_list);
    //console.log('render newsflash_list.length=', this.state.newsflash_list.length);
    //}

    /*send permission*/
    var send_permission = false;
    if (user && user.perm_publish === true) {
      switch (news_type) {
        case 'hot':
          send_permission = false;
          break;
        default:
          send_permission = true;
          break;
      }
    }

    const newsImageUploadprops = {
      onRemove: file => {
        this.setState(({ news_image_file_list }) => {
          const index = news_image_file_list.indexOf(file);
          const newFileList = news_image_file_list.slice();
          newFileList.splice(index, 1);
          return {
            news_image_file_list: newFileList,
          };
        });
        this.setState({
          news_image_url: null,
        });
      },
      beforeUpload: file => {
        return false;
      },
      fileList: this.state.news_image_file_list,
      listType: 'picture-card',
      onPreview: this.onNewsImagePreview,
      onChange: this.onNewsImageUploadChange,
    };

    const newsImageUploadButton = (
      <div>
        <Icon type="plus" />
        <div className="ant-upload-text">添加配图</div>
      </div>
    );

    return (
      <Layout title={env.appName}>
        <Main>
          <link
            rel="stylesheet"
            type="text/css"
            href="https://cdn.jsdelivr.net/npm/@arcblock/did-logo@latest/style.css"
          />
          <div>
            <div style={{ fontSize: '15px', color: '#000000' }}>{hashnews_slogan}</div>
            <div style={{ margin: '15px 0' }} />
            {/*<Text style={{ fontSize: '15px', color: '#000000', marginRight: 10 }}>链节点</Text>
            <Select value={this.state.datachain_node_name_to_view} style={{ fontSize: '15px', color: '#000000', width: 120, marginRight: 15 }} onChange={this.onDatachainNodeToViewChange} className="antd-select">
              {this.datachainsToViewSlecterChildren}
            </Select>*/}
            <Text style={{ fontSize: '15px', color: '#000000', marginRight: 10 }}>站点</Text>
            <Select
              value={this.state.dapp_site_name_to_view}
              style={{ fontSize: '15px', color: '#000000', width: 150, marginRight: 15 }}
              onChange={this.onDappSiteNameToViewChange}
              className="antd-select">
              {this.dappSitesNameToViewSlecterChildren}
            </Select>
            <Switch
              checked={this.state.show_mode === 'all' ? true : false}
              onChange={this.onShowModeChange}
              disabled={user == null || this.state.dapp_site_name_to_view != env.appName}
              size="small"
              className="antd-showmode-switch"
            />
            {this.state.show_mode === 'all' ? '全部' : '我的'}
            <div style={{ margin: '15px 0' }} />
          </div>

          {/*<div style={{ margin: '24px 0' }} />*/}
          {/*<Text style={{ margin: '0 10px 0 0' }} className="antd-select">类型</Text>
          <Select defaultValue="chains" style={{ width: 100 }} onChange={this.handleNewsTypeChange} className="antd-select">
            <Option value="chains">区块链</Option>
            <Option value="ads">广告</Option>
            <Option value="soups">鸡汤</Option>
          </Select>*/}
          <Menu onClick={this.handleNewsTypeMenuChange} selectedKeys={news_type} mode="horizontal">
            <Menu.Item key="hot">
              <span style={{ fontSize: '15px', fontWeight: 600 }}>热门</span>
            </Menu.Item>
            <Menu.Item key="chains">
              <span style={{ fontSize: '15px' }}>快讯</span>
            </Menu.Item>
            <Menu.Item key="articles">
              <span style={{ fontSize: '15px' }}>图文</span>
            </Menu.Item>
          </Menu>
          {/*<Tabs defaultActiveKey={news_type} 
            onChange={this.handleNewsTypeChange}
            tabBarStyle={{background:'#fff'}}
            tabPosition="top"
            tabBarGutter={8}
            animated={false}
          >
            <TabPane tab={<span style={{ fontSize: '15px', fontWeight: 600}}>热门</span>} key="hot">
            </TabPane>
            <TabPane tab={<span style={{ fontSize: '14px' }}>快讯</span>} key="chains">
            </TabPane>
            <TabPane tab={<span style={{ fontSize: '14px' }}>文章</span>} key="articles">
            </TabPane>
            <TabPane tab={<span style={{ fontSize: '14px' }}>广告</span>} key="ads">
            </TabPane>
            <TabPane tab={<span style={{ fontSize: '14px' }}>鸡汤</span>} key="soups">
            </TabPane>
            <TabPane tab={<span style={{ fontSize: '14px' }}>AMA</span>} key="amas">
            </TabPane>
            <TabPane tab={<span style={{ fontSize: '14px' }}>备忘</span>} key="memos">
            </TabPane>
            {!isProduction && <TabPane tab="测试" key="test">
              </TabPane>
            }
            {!isProduction && <TabPane tab="测试2" key="test2">
              </TabPane>
            }
          </Tabs>*/}
          <BackTop style={{ bottom: '60px', right: '120px' }} />
          {send_permission && (
            <div style={{ float: 'right' }}>
              <Affix offsetTop={sendAffixOffsetTop}>
                <Button type="link" onClick={this.onOpenSendNewsDialogButtonClick}>
                  <Icon type="message" theme="filled" style={{ fontSize: '40px', color: '#2194FF' }} />
                  <br />
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#339966' }}>发布</span>
                </Button>
              </Affix>
            </div>
          )}
          <LocaleProvider locale={zh_CN}>
            {this.state.send_news_dialog_visible === false && (
              <div id="HashNewsList">
                <List
                  itemLayout="vertical"
                  size="large"
                  loadMore={news_list_show_mode === 'more' ? loadMore : null}
                  dataSource={this.state.newsflash_list ? this.state.newsflash_list : []}
                  footer={null}
                  renderItem={item => (
                    <List.Item
                      key={item.hash}
                      actions={
                        item.news_type != 'test2' && item.news_type != 'articles_1'
                          ? [
                              <this.IconText
                                type="like-o"
                                text={item.like_cnt}
                                action_type="like"
                                balance={decimalConvert(item.like_min_rem, 4, 'ceil')}
                                token_symbol={token.symbol}
                                like_status={item.like_status}
                                show_extra_info={item.total_min_rem > 0 || item.total_paytip_balance > 0}
                                minner_num={item.like_min_rem_number}
                                asset_did={item.asset_did}
                                key={'list-item-like' + item.hash}
                              />,
                              <this.IconText
                                type="message"
                                text={item.comment_cnt}
                                action_type="comment"
                                balance={decimalConvert(item.comment_min_rem, 4, 'ceil')}
                                token_symbol={token.symbol}
                                like_status={item.like_status}
                                show_extra_info={item.total_min_rem > 0 || item.total_paytip_balance > 0}
                                minner_num={item.comment_min_rem_number}
                                asset_did={item.asset_did}
                                key={'list-item-message' + item.hash}
                              />,
                              <this.IconText
                                type="share-alt"
                                text={item.forward_cnt}
                                action_type="share"
                                balance={decimalConvert(item.forward_min_rem, 4, 'ceil')}
                                token_symbol={token.symbol}
                                like_status={item.like_status}
                                show_extra_info={item.total_min_rem > 0 || item.total_paytip_balance > 0}
                                minner_num={item.forward_min_rem_number}
                                asset_did={item.asset_did}
                                key={'list-item-share' + item.hash}
                              />,
                              <this.IconText
                                type="pay-circle"
                                text={item.paytip_cnt}
                                action_type="paytip"
                                balance={decimalConvert(item.total_paytip_balance, 6, 'ceil')}
                                token_symbol={token.symbol}
                                like_status={item.like_status}
                                show_extra_info={item.total_min_rem > 0 || item.total_paytip_balance > 0}
                                minner_num={0}
                                asset_did={item.asset_did}
                                key={'list-item-paytip' + item.hash}
                              />,
                            ]
                          : []
                      }
                      extra={null}
                      className="antd-list-item">
                      <div>
                        <span style={{ float: 'left', marginRight: 10 }}>
                          {item.uavatar.length > 0 ? (
                            <img src={item.uavatar} height="65" width="65" style={{ borderRadius: '50%' }} />
                          ) : (
                            <Avatar size={65} did={item.sender} style={{ borderRadius: '50%' }} />
                          )}
                        </span>
                        <span style={{ fontSize: '15px', color: '#000000', marginRight: 0 }}>{item.uname}</span>
                        {item.news_type != 'test2' && item.news_type != 'articles' && item.weights > 1 && (
                          <span style={{ fontSize: '10px', color: '#FF0000', marginRight: 0 }}>
                            {' '}
                            权重:{item.weights}
                          </span>
                        )}
                        {(item.news_type === 'test2' || item.news_type === 'articles') && (
                          <span style={{ fontSize: '10px', color: '#FF0000', marginRight: 0 }}>
                            {' '}
                            {item.news_article_worth} {token.symbol}
                          </span>
                        )}
                        <br />
                        {/*<img src="/static/images/abtwallet/drawable-xhdpi-v4/public_card_did_icon2.png" width="25" style={{ backgroundColor: '#466BF7', marginRight: 0 }}/>*/}
                        <i class="icon-did-abt-logo" style={{ fontSize: '15px', color: '#000000' }}></i>
                        <a href={item.sender_href} target="_blank" style={{ fontSize: '15px', color: '#000000' }}>
                          {' '}
                          {getUserDidFragment(item.sender)}
                        </a>{' '}
                        <br />
                        <a href={item.href} target="_blank" style={{ fontSize: '11px', color: '#000000' }}>
                          {item.data_chain_nodes[0].name.substring(0, 1).toUpperCase() +
                            item.data_chain_nodes[0].name.substring(1)}{' '}
                          - 哈希@{item.time}{' '}
                        </a>{' '}
                        <a
                          href={item.news_create_from_link}
                          target="_blank"
                          style={{ fontSize: '11px', color: '#4169E1' }}>
                          来自 {item.news_create_from_name}
                        </a>{' '}
                        <br />
                      </div>

                      {item.news_type != 'test2' && item.news_type != 'articles' && (
                        <div id={item.asset_did}>
                          {item.news_title.length > 0 && (
                            <span style={{ fontSize: '17px', fontWeight: 600, color: '#000000' }}>
                              {item.news_title}
                            </span>
                          )}
                          {item.news_title.length > 0 && <br />}
                          {item.news_title.length > 0 && <br />}
                          {item.news_content.length > 2000 ? (
                            item.weights >= news_weights_level_important ? (
                              <Paragraph
                                ellipsis={{ rows: 6, expandable: true }}
                                style={{ fontSize: '16px', color: '#FF0000' }}>
                                {item.news_content}
                              </Paragraph>
                            ) : (
                              <Paragraph
                                ellipsis={{ rows: 6, expandable: true }}
                                style={{ fontSize: '16px', color: '#000000' }}>
                                {item.news_content}
                              </Paragraph>
                            )
                          ) : item.weights >= news_weights_level_important ? (
                            <span style={{ fontSize: '16px', color: '#FF0000' }}>
                              <AutoLinkText text={item.news_content} linkProps={{ target: '_blank' }} />
                            </span>
                          ) : (
                            <span style={{ fontSize: '16px', color: '#000000' }}>
                              <AutoLinkText text={item.news_content} linkProps={{ target: '_blank' }} />
                            </span>
                          )}
                        </div>
                      )}

                      {(item.news_type === 'test2' || item.news_type === 'articles') && (
                        <div
                          id={item.asset_did}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                          <a
                            href={
                              item.news_content.length > 300
                                ? `/article?asset_did=${item.asset_did}`
                                : 'javascript:volid(0);'
                            }
                            style={{ width: '100%' }}>
                            <img
                              src={item.news_images[0]}
                              alt="HashNews"
                              width="156"
                              height="100"
                              style={{ float: 'left', marginRight: 10, borderRadius: '10px' }}
                            />
                            <span style={{ fontSize: '17px', fontWeight: 500, color: '#000000' }}>
                              {item.news_title}
                            </span>{' '}
                            <br />
                            <span style={{ fontSize: '13px', color: '#888888' }}>
                              {item.news_content.length > 300
                                ? item.news_content.slice(0, 300) + '...'
                                : item.news_content}
                            </span>{' '}
                            <br />
                          </a>
                        </div>
                      )}

                      {item.news_origin.length > 0 && (
                        <div>
                          <br />
                          <span style={{ fontSize: '10px', color: '#888888' }}>来源：{item.news_origin}</span>
                        </div>
                      )}
                      {(item.comment_list.length > 0 || item.paytip_list.length > 0) && (
                        <div>
                          <br />
                          {item.comment_list.length > 0 && (
                            <this.CommentList
                              asset_did={item.asset_did}
                              comment_cnt={item.comment_cnt}
                              comment_list={item.comment_list}
                              token={token}
                            />
                          )}
                          {item.paytip_list.length > 0 && (
                            <this.PaytipList
                              asset_did={item.asset_did}
                              paytip_cnt={item.paytip_cnt}
                              paytip_list={item.paytip_list}
                              token={token}
                            />
                          )}
                        </div>
                      )}
                    </List.Item>
                  )}
                />
                {news_list_show_mode === 'page' && (
                  <div className="pagination">
                    <Pagination
                      showQuickJumper
                      defaultCurrent={this.state.page_number}
                      defaultPageSize={list_items_per_page}
                      current={this.state.page_number}
                      total={this.state.newsflash_total_num}
                      onChange={this.onNewsPaginationChange}
                    />
                  </div>
                )}
              </div>
            )}
            <Modal
              title={this.state.news_type === 'articles' ? '发图文' : '发快讯'}
              closable={false}
              visible={this.state.send_news_dialog_visible}
              okText="发布"
              footer={null}
              onOk={this.handleSendNewsDialogOk}
              onCancel={this.handleSendNewsDialogCancel}
              okButtonProps={{ disabled: false }}
              destroyOnClose={true}
              forceRender={true}
              width={this.sendNewsDialogWinWidth}>
              <div style={{ margin: '10px 0' }}>
                <Text style={{ fontSize: '15px', color: '#000000', marginRight: 10 }}>内容来源</Text>
                <Select
                  value={this.state.news_content_origin}
                  style={{ fontSize: '15px', color: '#000000', width: 120 }}
                  onChange={this.onNewsOriginTypeChange}
                  className="antd-select">
                  <Option value="原创">原创</Option>
                  <Option value="翻译">翻译</Option>
                  <Option value="ABT技术社区">ABT技术社区</Option>
                  <Option value="微信">微信</Option>
                  <Option value="微博">微博</Option>
                  <Option value="币乎">币乎</Option>
                  <Option value="币世界">币世界</Option>
                  <Option value="MyToken">MyToken</Option>
                  <Option value="TokenPocket">TokenPocket</Option>
                  <Option value="其他">其他</Option>
                </Select>
              </div>
              {(news_type === 'test2' || news_type === 'articles') && (
                <div style={{ margin: '10px 0' }}>
                  <div style={{ float: 'left', marginTop: 3, marginRight: 10 }}>
                    <Text style={{ fontSize: '15px', color: '#000000' }}>图文定价</Text>
                  </div>
                  <div>
                    <NumericInput
                      style={{ width: 120 }}
                      defaultValue={0}
                      value={news_article_worth}
                      onChange={this.onNewsArticleWorthChange}
                    />
                    <span style={{ fontSize: '15px', color: '#000000', marginLeft: 10 }}>{token.symbol}</span>
                  </div>
                </div>
              )}
              {(news_type === 'test2' || news_type === 'articles') && (
                <div style={{ margin: '10px 0' }}>
                  <Upload {...newsImageUploadprops}>
                    {news_image_file_list.length >= 1 ? null : newsImageUploadButton}
                  </Upload>
                </div>
              )}
              {(news_type == 'chains' || news_type == 'articles') && (
                <div style={{ margin: '10px 0' }}>
                  <span style={{ fontSize: '15px', color: '#000000', marginRight: 10 }}>添加标题</span>
                  <Checkbox
                    checked={this.state.news_title_enabled}
                    onChange={this.onNewsTitleCheckBoxChange}></Checkbox>
                </div>
              )}
              {this.state.news_title_enabled && (news_type === 'chains' || news_type === 'articles') && (
                <div style={{ margin: '10px 0' }}>
                  <TextArea
                    value={news_title_to_send}
                    onChange={this.onNewsTitleToSendChange}
                    placeholder={'请输入标题...(' + news_title_max_length + '字以内)'}
                    autoSize={{ minRows: 1, maxRows: 3 }}
                    maxLength={news_title_max_length}
                  />
                </div>
              )}
              <div style={{ margin: '5px 0' }}>
                <TextArea
                  ref="newsContentTextArea"
                  value={news_content_to_send}
                  onChange={this.onNewsContentToSendChange}
                  placeholder={'请输入内容...(' + news_content_max_length + '字以内，多于6字即可)'}
                  autoSize={{ minRows: 3, maxRows: 10 }}
                  maxLength={news_content_max_length}
                />
              </div>
              <Divider dashed orientation="left">
                可选
              </Divider>
              <Text style={{ fontSize: '15px', color: '#000000', marginRight: 10 }}>存储位置</Text>
              <Select
                value={this.state.datachain_node_name_to_send}
                style={{ fontSize: '15px', color: '#000000', width: 120 }}
                onChange={this.onDatachainNodeToSendChange}
                className="antd-select">
                {this.datachainsToSendSlecterChildren}
              </Select>
              {news_type != 'test2' && news_type != 'articles' && (
                <div style={{ margin: '10px 0' }}>
                  {/*<Slider 
                    defaultValue={this.state.news_to_send_weight} 
                    value={typeof this.state.news_to_send_weight === 'number' ? this.state.news_to_send_weight : 1}
                    min={news_weights_value_min}
                    max={news_weights_value_max}
                    step={news_weights_value_step}
                    onChange={this.onNewsflashWeightChange}
                  />*/}
                  <span style={{ fontSize: '15px', color: '#000000' }}>资讯权重</span>
                  <InputNumber
                    min={news_weights_value_min}
                    max={news_weights_value_max}
                    step={news_weights_value_step}
                    formatter={limit2Decimals}
                    parser={limit2Decimals}
                    style={{ marginLeft: 10, marginRight: 10 }}
                    value={this.state.news_to_send_weight}
                    onChange={this.onNewsflashWeightChange}
                  />
                  <span style={{ fontSize: '15px', color: '#000000' }}>倍</span>
                  <br />
                </div>
              )}
              {news_type != 'test2' && news_type != 'articles' && news_to_send_weight > 1 && (
                <div>
                  <span style={{ fontSize: '15px', color: '#000000' }}>点赞挖矿</span>
                  <InputNumber
                    min={news_like_minner_number_min}
                    max={news_like_minner_number_max}
                    step={1}
                    formatter={limit0Decimals}
                    parser={limit0Decimals}
                    style={{ marginLeft: 10, marginRight: 10 }}
                    value={this.state.news_like_minner_number}
                    onChange={this.onNewsSendLikeMinnerNumberCfgChange}
                  />
                  <span style={{ fontSize: '15px', color: '#000000' }}>个</span>
                  <br />
                  <span style={{ fontSize: '15px', color: '#000000' }}>评论挖矿</span>
                  <InputNumber
                    min={news_comment_minner_number_min}
                    max={news_comment_minner_number_max}
                    step={1}
                    formatter={limit0Decimals}
                    parser={limit0Decimals}
                    style={{ marginLeft: 10, marginRight: 10 }}
                    value={this.state.news_comment_minner_number}
                    onChange={this.onNewsSendCommentMinnerNumberCfgChange}
                  />
                  <span style={{ fontSize: '15px', color: '#000000' }}>个</span>
                  <br />
                  <span style={{ fontSize: '15px', color: '#000000' }}>分享挖矿</span>
                  <InputNumber
                    min={news_forward_minner_number_min}
                    max={news_forward_minner_number_max}
                    step={1}
                    formatter={limit0Decimals}
                    parser={limit0Decimals}
                    style={{ marginLeft: 10, marginRight: 10 }}
                    value={this.state.news_forward_minner_number}
                    onChange={this.onNewsSendForwardMinnerNumberCfgChange}
                  />
                  <span style={{ fontSize: '15px', color: '#000000' }}>个</span>
                </div>
              )}
              <Divider dashed />
              <div align="right" style={{ margin: '10px 0' }}>
                <Button
                  key="submit-cancel"
                  onClick={this.handleSendNewsDialogCancel}
                  style={{ marginRight: 10, fontSize: '15px' }}
                  className="antd-button-cancel">
                  取消
                </Button>
                {news_type === 'test2' || news_type === 'articles' ? (
                  <Button
                    key="submit-ok"
                    type="primary"
                    onClick={this.onSendNews}
                    disabled={
                      (news_title_to_send === '' && news_content_to_send === '') ||
                      (news_content_to_send && news_content_to_send.length < 6) ||
                      news_image_url === null
                      //|| (news_article_worth === '')
                      //    (news_title_to_send === '' || (news_title_to_send && news_title_to_send.length < 6))
                      // || (news_content_to_send === '' || (news_content_to_send && news_content_to_send.length < 500)
                      // || (news_article_worth === '')
                      // || (news_image_url === null))
                    }
                    loading={asset_sending}
                    style={{ fontSize: '15px' }}
                    className="antd-button-send">
                    发布
                  </Button>
                ) : (
                  <Button
                    key="submit-ok"
                    type="primary"
                    onClick={this.onSendNews}
                    disabled={news_content_to_send === '' || (news_content_to_send && news_content_to_send.length < 6)}
                    loading={sending}
                    style={{ fontSize: '15px' }}
                    className="antd-button-send">
                    发布({toPay}
                    {token.symbol})
                  </Button>
                )}
              </div>
            </Modal>
            <Modal visible={news_image_preview_visible} footer={null} onCancel={this.onNewsImagePreviewCancel}>
              <img alt="picture" style={{ width: '100%' }} src={news_image_preview_image} />
            </Modal>
            <Modal
              title="发布参数配置"
              closable={false}
              visible={this.state.news_to_send_cfg_visible}
              okText="确认"
              onOk={this.handleNewsSendCfgOk}
              onCancel={this.handleNewsSendCfgCancel}
              okButtonProps={{ disabled: false }}
              destroyOnClose={true}
              forceRender={true}
              width={newsSendCfgWinWidth}>
              <span style={{ fontSize: '15px', color: '#000000' }}>点赞挖矿个数</span>
              <InputNumber
                min={news_like_minner_number_min}
                max={news_like_minner_number_max}
                step={1}
                formatter={limit0Decimals}
                parser={limit0Decimals}
                style={{ marginLeft: 10, marginRight: 10 }}
                value={this.state.news_like_minner_number}
                onChange={this.onNewsSendLikeMinnerNumberCfgChange}
              />
              <span style={{ fontSize: '15px', color: '#000000' }}>个</span>
              <br />
              <span style={{ fontSize: '15px', color: '#000000' }}>评论挖矿个数</span>
              <InputNumber
                min={news_comment_minner_number_min}
                max={news_comment_minner_number_max}
                step={1}
                formatter={limit0Decimals}
                parser={limit0Decimals}
                style={{ marginLeft: 10, marginRight: 10 }}
                value={this.state.news_comment_minner_number}
                onChange={this.onNewsSendCommentMinnerNumberCfgChange}
              />
              <span style={{ fontSize: '15px', color: '#000000' }}>个</span>
              <br />
              <span style={{ fontSize: '15px', color: '#000000' }}>分享挖矿个数</span>
              <InputNumber
                min={news_forward_minner_number_min}
                max={news_forward_minner_number_max}
                step={1}
                formatter={limit0Decimals}
                parser={limit0Decimals}
                style={{ marginLeft: 10, marginRight: 10 }}
                value={this.state.news_forward_minner_number}
                onChange={this.onNewsSendForwardMinnerNumberCfgChange}
              />
              <span style={{ fontSize: '15px', color: '#000000' }}>个</span>
            </Modal>
            <Modal
              style={{ top: this.commentInpuTopOffset }}
              title={null}
              closable={false}
              visible={this.state.comment_input_visible}
              onOk={this.handleCommentInputOk}
              okText="发送"
              onCancel={this.handleCommentInputCancel}
              okButtonProps={{
                disabled: !comment_to_send || comment_to_send.length < 3 || (user && user.perm_comment === false),
              }}
              destroyOnClose={true}
              wrapClassName={'web'}>
              <TextArea
                value={comment_to_send}
                onChange={this.onCommentToSendChange}
                placeholder={'写评论...'}
                autoSize={{ minRows: 2, maxRows: 5 }}
                maxLength={news_comment_max_length}
              />
            </Modal>
            <Modal
              title="喊出你的口号"
              closable={false}
              visible={this.state.share_news_user_slogan_input_visible}
              okText="确认"
              onOk={this.handleShareNewsUserSloganInputOk}
              onCancel={this.handleShareNewsUserSloganInputCancel}
              okButtonProps={{ disabled: false }}
              cancelButtonProps={{ disabled: true }}
              destroyOnClose={true}
              forceRender={true}
              width={share_news_user_slogan_dialog_width}
              footer={[
                <Button key="submit" type="primary" onClick={this.handleShareNewsUserSloganInputOk}>
                  确认
                </Button>,
              ]}>
              <TextArea
                value={this.state.share_news_user_slogan_content}
                onChange={this.onShareNewsUserSloganChange}
                placeholder={''}
                autoSize={{ minRows: 2, maxRows: 3 }}
                maxLength={share_news_user_slogan_len_max}
              />
            </Modal>
            <Modal
              style={{ top: 80 }}
              title={null}
              closable={false}
              footer={null}
              visible={this.state.gen_share_news_visible}
              okText="生成"
              onOk={this.handleGenShareNewsOk}
              onCancel={this.handleGenShareNewsCancel}
              destroyOnClose={true}
              forceRender={true}
              width={posterWinWidth}>
              <div id="shareNewsContent">
                <div style={{ backgroundColor: '#3079D0' }}>
                  <img src="/static/images/hashnews/banner.png" alt="HashNews" width={posterWinWidth - 40} />
                </div>
                <List
                  style={{ marginLeft: 10, marginRight: 10 }}
                  itemLayout="vertical"
                  size="large"
                  pagination={null}
                  dataSource={this.share_news_items}
                  footer={null}
                  renderItem={item => (
                    <List.Item
                      key={'share' + item.hash}
                      actions={[
                        <this.IconTextForShare
                          type="like-o"
                          text={item.like_cnt}
                          action_type="like"
                          like_status={item.like_status}
                          token_symbol={token.symbol}
                          total_min_rem={item.total_min_rem}
                          balance={decimalConvert(item.like_min_rem, 4, 'ceil')}
                          minner_num={item.like_min_rem_number}
                          asset_did={item.asset_did}
                          key={'list-item-like-share' + item.hash}
                        />,
                        <this.IconTextForShare
                          type="message"
                          text={item.comment_cnt}
                          action_type="comment"
                          like_status={item.like_status}
                          token_symbol={token.symbol}
                          total_min_rem={item.total_min_rem}
                          balance={decimalConvert(item.comment_min_rem, 4, 'ceil')}
                          minner_num={item.comment_min_rem_number}
                          asset_did={item.asset_did}
                          key={'list-item-message-share' + item.hash}
                        />,
                      ]}
                      extra={null}
                      className="antd-list-item">
                      <span style={{ float: 'left', marginRight: 10 }}>
                        {item.uavatar.length > 0 ? (
                          <img src={item.uavatar} height="60" width="60" style={{ borderRadius: '50%' }} />
                        ) : (
                          <Avatar size={60} did={item.sender} style={{ borderRadius: '50%' }} />
                        )}
                      </span>
                      <span style={{ fontSize: '12px', fontVariant: 'normal', color: '#000000', marginRight: 0 }}>
                        {item.uname}
                      </span>
                      {item.weights > 1 && (
                        <span style={{ fontSize: '9px', color: '#FF0000', marginRight: 0 }}> 权重:{item.weights}</span>
                      )}
                      <br />
                      {/*<img src="/static/images/abtwallet/drawable-xhdpi-v4/public_card_did_icon2.png" width="25" style={{ backgroundColor: '#466BF7', marginRight: 0 }}/>*/}
                      <i class="icon-did-abt-logo" style={{ fontSize: '12px', color: '#000000' }}></i>
                      <span style={{ fontSize: '12px', fontVariant: 'normal', color: '#000000' }}>
                        {' '}
                        {getUserDidFragment(item.sender)}
                      </span>{' '}
                      <br />
                      <a
                        href={item.href}
                        target="_blank"
                        style={{ fontSize: '11px', fontVariant: 'normal', color: '#000000' }}>
                        {item.data_chain_nodes[0].name.substring(0, 1).toUpperCase() +
                          item.data_chain_nodes[0].name.substring(1)}{' '}
                        - 20{item.time}
                      </a>
                      <div>
                        <br />
                        {item.news_title.length > 0 && (
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#000000' }}>{item.news_title}</span>
                        )}
                        {item.news_title.length > 0 && <br />}
                        {item.news_title.length > 0 && <br />}
                        {item.weights >= news_weights_level_important ? (
                          <span
                            id="shareNewsListItemContent"
                            style={{
                              fontSize: '11px',
                              whiteSpace: 'pre-wrap',
                              wordWrap: 'break-word',
                              wordBreak: 'break-all',
                              fontVariant: 'normal',
                              letterSpacing: '1px',
                              wordSpacing: '1px',
                              color: '#FF0000',
                            }}>
                            {item.news_content}
                          </span>
                        ) : (
                          <span
                            id="shareNewsListItemContent"
                            style={{
                              fontSize: '11px',
                              whiteSpace: 'pre-wrap',
                              wordWrap: 'break-word',
                              wordBreak: 'break-all',
                              fontVariant: 'normal',
                              letterSpacing: '1px',
                              wordSpacing: '1px',
                              color: '#000000',
                            }}>
                            {item.news_content}
                          </span>
                        )}
                      </div>
                    </List.Item>
                  )}
                />
                <hr
                  style={{
                    height: '1px',
                    border: 'none',
                    borderTop: '1px solid #A9A9A9',
                    marginTop: 0,
                    marginBottom: 10,
                  }}
                />
                <div
                  style={{
                    marginLeft: 10,
                    marginRight: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                  }}>
                  <div style={{ width: '100%' }}>
                    <QrCode
                      value={env.baseUrl}
                      size={60}
                      level={'M'}
                      id="HashNewsQrCode"
                      style={{ float: 'left', marginRight: 10 }}
                    />
                    <div style={{ fontSize: '13px', fontVariant: 'normal', color: '#000000', marginLeft: 0 }}>
                      ArcBlock DID身份发布
                    </div>
                    <div style={{ fontSize: '13px', fontVariant: 'normal', fontWeight: 600, color: '#000000' }}>
                      {this.state.share_news_user_slogan_content}
                    </div>
                  </div>
                </div>
                <br />
              </div>
            </Modal>
            <Modal
              style={{ top: 10 }}
              title={navigator && navigator.share ? '点击分享按钮' : '长按图片进行分享'}
              closable={false}
              visible={this.state.share_news_pic_visible}
              okText={navigator && navigator.share ? '分享' : '已分享'}
              onOk={this.handleShareNewsPicOk}
              onCancel={this.handleShareNewsPicCancel}
              okButtonProps={{ disabled: navigator && navigator.share ? false : this.state.shared_btn_disabled }}
              destroyOnClose={true}
              forceRender={true}
              width={posterWinWidth}>
              <div>
                <img
                  src="/static/blank.jpg"
                  id="shareNewsPic"
                  alt="HashNews"
                  width={posterWinWidth - 40}
                  onContextMenu={this.handleShareNewsPicContextMenu}
                />
              </div>
            </Modal>
            <Modal
              title="打赏配置"
              title={null}
              closable={false}
              visible={this.state.paytip_input_visible}
              okText="确定"
              onOk={this.handlePaytipDialogOk}
              onCancel={this.handlePaytipDialogCancel}
              okButtonProps={{
                disabled: this.state.paytip_input_value === '' || parseFloat(this.state.paytip_input_value) <= 0,
              }}
              destroyOnClose={true}
              forceRender={true}>
              <div style={{ float: 'left', marginTop: 3, marginRight: 10 }}>
                <Text style={{ fontSize: '15px', color: '#000000' }}>打赏</Text>
              </div>
              <div>
                <NumericInput
                  style={{ width: 120 }}
                  value={this.state.paytip_input_value}
                  onChange={this.onPaytipValueChange}
                />
                <span style={{ fontSize: '15px', color: '#000000', marginLeft: 10 }}>{token.symbol}</span>
              </div>
              <div style={{ margin: '5px 0' }} />
              <Text style={{ fontSize: '15px', color: '#000000' }}>备注</Text>
              <TextArea
                value={this.state.paytip_comment}
                onChange={this.onPaytipCommentChange}
                placeholder={'可选(' + paytip_comment_max_length + '字以内)'}
                autoSize={{ minRows: 1, maxRows: 3 }}
                maxLength={paytip_comment_max_length}
              />
            </Modal>
          </LocaleProvider>
        </Main>
        {sending && (
          <Auth
            responsive
            action="payment_nf"
            locale="zh"
            checkFn={api.get}
            onError={this.onPaymentError}
            onClose={this.onPaymentClose}
            onSuccess={this.onPaymentSuccess}
            extraParams={('zh', { toPay, dapp, para })}
            messages={{
              title: '支付需求',
              scan: `该快讯需支付 ${toPay} ${token.symbol}`,
              confirm: '在ABT钱包中确认',
              success: '支付成功!',
            }}
          />
        )}
        {paytip_sending && (
          <Auth
            responsive
            action="paytip"
            locale="zh"
            checkFn={api.get}
            onError={this.onPaymentError}
            onClose={this.onPaytipPaymentClose}
            onSuccess={this.onPaymentSuccess}
            extraParams={('zh', { tipValue, tipAddr, dapp, para })}
            messages={{
              title: '打赏支付',
              scan: `打赏需支付 ${tipValue} ${token.symbol}`,
              confirm: '在ABT钱包中确认',
              success: '支付成功!',
            }}
          />
        )}
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
    font-size: 1rem;
    font-family: 'Roboto', 'Helvetica', 'Arial', sans-serif;
    font-weight: 200;
    color: #000000;
    //margin-bottom: 20px;
    .antd-showmode-switch {
      margin-left: 10px;
      margin-right: 5px;
    }
  }

  .antd-select {
    font-size: 0.8rem;
    font-family: 'Roboto', 'Helvetica', 'Arial', sans-serif;
    font-weight: 200;
    color: #000000;
  }

  .antd-button-send {
    height: 20px;
  }

  .antd-button-cancel {
    height: 20px;
  }

  .antd-list-item {
    font-size: 1rem;
    font-family: Helvetica, 'Hiragino Sans GB', 'Microsoft Yahei', '微软雅黑', Arial, sans-serif;
    font-weight: 300;
    color: #000000;
    white-space: pre-wrap;
    word-wrap: break-word;
    word-break: break-all;
  }

  .antd-list-item-meta-title {
    font-size: 0.8rem;
    font-family: 'Roboto', 'Helvetica', 'Arial', sans-serif;
    font-weight: 500;
    color: #3cb371;
  }

  .antd-list-item-meta-description {
    font-size: 0.8rem;
    font-family: 'Roboto', 'Helvetica', 'Arial', sans-serif;
    font-weight: 200;
    color: #0000ff;
  }

  .antd-list-comment-list-text {
    font-size: 0.8rem;
    font-family: Helvetica, 'Hiragino Sans GB', 'Microsoft Yahei', '微软雅黑', Arial, sans-serif;
    font-weight: 100;
    color: #000000;
    white-space: pre-wrap;
    word-wrap: break-word;
    word-break: break-all;
    background-color: #f5f5f5;
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

  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
  }
`;

export default App;
