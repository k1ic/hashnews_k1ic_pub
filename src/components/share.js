import React, { Component } from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import QRcode from "qrcode.react";

// Initialize a variables.
//let image = (document.images[0] || 0).src || '';
//let site = getMetaContentByName('site') || getMetaContentByName('Site') || document.title;
//let title = getMetaContentByName('title') || getMetaContentByName('Title') || document.title;
//let description = getMetaContentByName('description') || getMetaContentByName('Description') || '';
//let url = location.href;
//let origin = location.origin;

function getMetaContentByName(name) {
  return (document.getElementsByName(name)[0] || 0).content;
}
class Share extends Component {
  static defaultProps = {
    url: '',
    origin: '',
    title: '',
    description: '',
    disabled: [],
    summary: '',
    image: '',
    site: '',
    source: '',
    initialized: false,
    sites: ["qq", "wechat", "weibo", "qzone",  "google", "twitter",  "tencent",  "douban", "linkedin", "facebook"],
    wechatQrcodeSize: 150,
    wechatQrcodeLevel: 'Q'
  };
  static propTypes = {
    url: PropTypes.string,
    source: PropTypes.string,
    title: PropTypes.string,
    origin: PropTypes.string,
    description: PropTypes.string,
    image: PropTypes.string,
    sites: PropTypes.array,
    disabled: PropTypes.array,
    wechatQrcodeTitle: PropTypes.string,
    wechatQrcodeHelper:  PropTypes.string,
    initialized: PropTypes.bool,
    wechatQrcodeLevel: PropTypes.string,
    wechatQrcodeSize: PropTypes.number,
  }
  
  /*component mount process*/
  componentDidMount() {
    
  }
  
  componentWillUnmount() {
    
  }
  
  // getDataFormat() {
  //   const hyphenateRE = /([a-z\d])([A-Z])/g;
  //   return Object.keys(this.props).reduce((pre,cur) => {
  //     const key = "data-"+cur.replace(hyphenateRE, '$1-$2').toLowerCase();
  //     pre[key] = this.props[cur];
  //     return pre;      
  //   },{})
  // }
  getDataFormat() {
    // const hyphenateRE = /([a-z\d])([A-Z])/g;
    return Object.keys(this.props).reduce((pre,cur) => {
      pre[cur] = typeof this.props[cur] === 'string' ? encodeURIComponent(this.props[cur]) : this.props[cur];
      return pre;
    },{})
  }
  render() {
    // const setData = this.getDataFormat();
    var {url, sites, disabled, title, image, description, summary, source, wechatQrcodeSize, wechatQrcodeLevel,initialized} = this.getDataFormat();
    
    if(!url || url.length == 0){
      url = location.href;
      url = url.replace('=', '%3D');
    }
    if(!title || title.length == 0){
      title = getMetaContentByName('title') || getMetaContentByName('Title') || document.title;
    }
    if(!image || image.length == 0){
      image = (document.images[0] || 0).src || '';
    }
    if(!description || description.length == 0){
      description = getMetaContentByName('description') || getMetaContentByName('Description') || '';
    }
    if(!summary || summary.length == 0){
      summary = getMetaContentByName('description') || getMetaContentByName('Description') || '';
    }
    if(!source || source.length == 0){
      source = getMetaContentByName('site') || getMetaContentByName('Site') || document.title;
    }

    const templates = {
      qzone: `http://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url=${url}&title=${title}&desc=${description}&summary=${summary}&site=${source}`,
      qq: `http://connect.qq.com/widget/shareqq/index.html?url=${url}&title=${title}&source=${source}&desc=${description}`,
      tencent: `http://share.v.t.qq.com/index.php?c=share&a=index&title=${title}&url=${url}&pic=${image}`,
      weibo: `http://service.weibo.com/share/share.php?url=${url}&title=${title}&pic=${image}`,
      wechat: decodeURIComponent(url),
      douban: `http://shuo.douban.com/!service/share?href=${url}&name=${title}&text=${description}&image=${image}&starid=0&aid=0&style=11`,
      diandian: `http://www.diandian.com/share?lo=${url}&ti=${title}&type=link`,
      linkedin: `http://www.linkedin.com/shareArticle?mini=true&ro=true&title=${title}&url=${url}&summary=${summary}&source=${source}&armin=armin`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      twitter: `https://twitter.com/intent/tweet?text=${title}&url=${url}&via=${origin}`,
      google: `https://plus.google.com/share?url=${url}`
    };
    return (
      <Div>
        <div className="social-share">
        {
          initialized?
          this.props.children :
          sites.map((site) => {
            if(~disabled.indexOf(site)) return;
            if(site !== "wechat"){
              return (
                <a key={site} className={`social-share-icon2 icon2-${site}`} target='_blank' href={templates[site]}></a>
              )
            } else {
              return (
              <a key={site} className={`social-share-icon2 icon2-${site}`} target='_blank' href='javascript:void(0);'>
                <div className="wechat-qrcode">
                  <h4>微信扫一扫：分享</h4>
                  <QRcode value={templates[site]} size={wechatQrcodeSize} level={wechatQrcodeLevel}/>
                </div>  
              </a>)
            }
          })
        }
        </div>
      </Div>
    )
  }
}

const Div = styled.div`
  .social-share {
    font-family:"socialshare" !important;
    font-size:16px;
    font-style:normal;
    -webkit-font-smoothing: antialiased;
    -webkit-text-stroke-width: 0.2px;
    -moz-osx-font-smoothing: grayscale;
     * {
      font-family:"socialshare" !important;
    }
    .icon-tencent:before { content: "\f07a"; }
    .icon-qq:before { content: "\f11a"; }
    .icon-weibo:before { content: "\f12a"; }
    .icon-wechat:before { content: "\f09a"; }
    .icon-douban:before { content: "\f10a"; }
    .icon-heart:before { content: "\f20a"; }
    .icon-like:before { content: "\f00a"; }
    .icon-qzone:before { content: "\f08a"; }
    .icon-linkedin:before { content: "\f01a"; }
    .icon-diandian:before { content: "\f05a"; }
    .icon-facebook:before { content: "\f03a"; }
    .icon-google:before { content: "\f04a"; }
    .icon-twitter:before { content: "\f06a"; }

    a {
      position:relative;
      text-decoration:none;
      margin: 4px;
      display:inline-block;
      outline: none;
    }

    .social-share-icon {
      position:relative;
      display:inline-block;
      width: 32px;
      height: 32px;
      font-size: 20px;
      border-radius: 50%;
      line-height: 32px;
      border:1px solid #666;
      color: #666;
      text-align: center;
      vertical-align: middle;
      transition: background 0.6s ease-out 0s;

      &:hover{
        background: #666;
        color: #fff;
      }
    }

    .icon-weibo{
      color:#ff763b;border-color:#ff763b;
      &:hover{
        background:#ff763b;
      }
    }
    .icon-tencent{
      color:#56b6e7;border-color:#56b6e7;
      &:hover{
        background:#56b6e7;
      }
    }
    .icon-qq{
      color:#56b6e7;border-color:#56b6e7;
      &:hover{
        background:#56b6e7;
      }
    }
    .icon-qzone{
      color:#FDBE3D;border-color:#FDBE3D;
      &:hover{
        background:#FDBE3D;
      }
    }
    .icon-douban{
      color:#33b045;border-color:#33b045;
      &:hover{
        background:#33b045;
      }
    }
    .icon-linkedin{
      color:#0077B5;border-color:#0077B5;
      &:hover{
        background:#0077B5;
      }
    }
    .icon-facebook {
      color:#44619D;border-color:#44619D;
      &:hover{
        background:#44619D;
      }
    }
    .icon-google {
      color:#db4437;border-color:#db4437;
      &:hover{
        background:#db4437;
      }
    }
    .icon-twitter {
      color:#55acee;border-color:#55acee;
      &:hover{
        background:#55acee;
      }
    }
    .icon-diandian {
      color:#307DCA; border-color:#307DCA;
      &:hover{
        background:#307DCA;
      }
    }
    .icon-wechat{
      position:relative;color:#7bc549;border-color:#7bc549;
      &:hover{
        background:#7bc549;
      }
    }
    .icon-wechat .wechat-qrcode{display: none;border: 1px solid #eee;position:absolute;z-index:9;top:-205px;left:-84px;width:200px;height:192px;color:#666;font-size:12px;text-align:center;background-color:#fff;box-shadow:0 2px 10px #aaa;transition:all 200ms;-webkit-tansition:all 350ms;-moz-transition:all 350ms; }
    .icon-wechat .wechat-qrcode.bottom {
      top:40px;
      left:-84px;
      &:after {
        display:none;
      }
    }
    .icon-wechat .wechat-qrcode h4{font-weight:normal;height:26px;line-height:26px;font-size:12px; background-color:#f3f3f3; margin:0;padding:0;color: #777; }
    .icon-wechat .wechat-qrcode .qrcode{width:105px; margin:10px auto;}
    .icon-wechat .wechat-qrcode .qrcode table{margin:0!important;}
    .icon-wechat .wechat-qrcode .help p{font-weight:normal;line-height:16px;padding:0;margin:0;}
    .icon-wechat .wechat-qrcode:after{content:'';position:absolute;left:50%;margin-left:-6px;bottom:-13px;width:0;height:0;border-width:8px 6px 6px 6px;border-style:solid;border-color:#fff transparent transparent transparent}
    .icon-wechat:hover .wechat-qrcode{display: block;}
    
    
    .social-share-icon2 {
      position:relative;
      display:inline-block;
      width: 32px;
      height: 32px;
    }

    .icon2-weibo{
       background: transparent url(/static/images/icons/weibo.png) no-repeat center;
       background-size:40px 40px;
       &:hover{
         background: transparent url(/static/images/icons/weibo.png) no-repeat center;
         background-size:48px 48px;
       }
    }
    .icon2-tencent{
       background: transparent url(/static/images/icons/tencent.png) no-repeat center;
       background-size:32px 32px;
       &:hover{
         background: transparent url(/static/images/icons/tencent.png) no-repeat center;
         background-size:48px 48px;
       }
    }
    .icon2-qq{
       background: transparent url(/static/images/icons/qq.png) no-repeat center;
       background-size:32px 32px;
       &:hover{
         background: transparent url(/static/images/icons/qq.png) no-repeat center;
         background-size:48px 48px;
       }
    }
    .icon2-qzone{
      background: transparent url(/static/images/icons/qzone.png) no-repeat center;
      background-size:32px 32px;
      &:hover{
        background: transparent url(/static/images/icons/qzone.png) no-repeat center;
        background-size:48px 48px;
      }
    }
    .icon2-douban{
      background: transparent url(/static/images/icons/douban.png) no-repeat center;
      background-size:32px 32px;
      &:hover{
        background: transparent url(/static/images/icons/douban.png) no-repeat center;
        background-size:48px 48px;
      }
    }
    .icon2-linkedin{
      background: transparent url(/static/images/icons/linkedin.png) no-repeat center;
      background-size:32px 32px;
      &:hover{
        background: transparent url(/static/images/icons/linkedin.png) no-repeat center;
        background-size:48px 48px;
      }
    }
    .icon2-facebook {
      background: transparent url(/static/images/icons/facebook.png) no-repeat center;
      background-size:32px 32px;
      &:hover{
        background: transparent url(/static/images/icons/facebook.png) no-repeat center;
        background-size:48px 48px;
      }
    }
    .icon2-google {
      background: transparent url(/static/images/icons/google.png) no-repeat center;
      background-size:32px 32px;
      &:hover{
        background: transparent url(/static/images/icons/google.png) no-repeat center;
        background-size:48px 48px;
      }
    }
    .icon2-twitter {
      background: transparent url(/static/images/icons/twitter.png) no-repeat center;
      background-size:32px 32px;
      &:hover{
        background: transparent url(/static/images/icons/twitter.png) no-repeat center;
        background-size:48px 48px;
      }
    }
    .icon2-diandian {
      background: transparent url(/static/images/icons/diandian.png) no-repeat center;
      background-size:32px 32px;
      &:hover{
        background: transparent url(/static/images/icons/diandian.png) no-repeat center;
        background-size:48px 48px;
      }
    }
    .icon2-wechat{
      background: transparent url(/static/images/icons/wechat.png) no-repeat center;
      background-size:32px 32px;
      &:hover{
        background: transparent url(/static/images/icons/wechat.png) no-repeat center;
        background-size:40px 40px;
      }
    }
    .icon2-wechat .wechat-qrcode{display: none;border: 1px solid #eee;position:absolute;z-index:9;top:-205px;left:-84px;width:200px;height:192px;color:#666;font-size:12px;text-align:center;background-color:#fff;box-shadow:0 2px 10px #aaa;transition:all 200ms;-webkit-tansition:all 350ms;-moz-transition:all 350ms; }
    .icon2-wechat .wechat-qrcode.bottom {
      top:40px;
      left:-84px;
      &:after {
        display:none;
      }
    }
    .icon2-wechat .wechat-qrcode h4{font-weight:normal;height:26px;line-height:26px;font-size:12px; background-color:#f3f3f3; margin:0;padding:0;color: #777; }
    .icon2-wechat .wechat-qrcode .qrcode{width:105px; margin:10px auto;}
    .icon2-wechat .wechat-qrcode .qrcode table{margin:0!important;}
    .icon2-wechat .wechat-qrcode .help p{font-weight:normal;line-height:16px;padding:0;margin:0;}
    .icon2-wechat .wechat-qrcode:after{content:'';position:absolute;left:50%;margin-left:-6px;bottom:-13px;width:0;height:0;border-width:8px 6px 6px 6px;border-style:solid;border-color:#fff transparent transparent transparent}
    .icon2-wechat:hover .wechat-qrcode{display: block;}
  }
`;

export default Share;