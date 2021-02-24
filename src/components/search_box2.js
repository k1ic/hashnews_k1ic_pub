import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import get from 'lodash/get';

import { withRouter } from 'react-router-dom';
import IconFa from '@arcblock/ux/lib/Icon';
import {
  Select,
  Icon
} from "antd";
import AsyncComponent from '@arcblock/ux/lib/Async';

import forge from '../libs/forge';
import { getExplorerUrl } from '../libs/util';
import env from '../libs/env';

const { Option } = Select;
const AsyncSelect = AsyncComponent(() => import('react-select/lib/Async'));

class SearchBox extends React.Component {
  state = {
    searching: false,
    data: [],
    value: undefined,
    disabled: false,
  };
  
  placeholder = {
    en: 'account/asset/swap/hash...',
    zh: '账户/资产/跨链/哈希...'
  };
  
  timeout = null;
  
  onSearchHandler = async (value) => {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    
    if(value && value.length > 0 && value != this.state.value){
      this.setState({ value });
      this.timeout = setTimeout(this.searchTimoutHandler, 2000);
    }
  }
  
  searchTimoutHandler = async () => {
    const searchKeyword = this.state.value;
    if (searchKeyword && searchKeyword.length > 0) {
      this.setState({ data: [] });
      const data = await this.doSearch(searchKeyword);
      this.setState({ data });
    }
  };

  onChangeHanlder = value => {
    window.open(value,'_blank');
    //this.setState({ value });
  };
  
  onBlurHanlder = () => {
    console.log('onBlurHanlder');
  }

  render() {
    const options = this.state.data.map(d => <Option key={d.value}>{d.label}</Option>);
    return (
      <Select
        showSearch
        loading={this.state.searching}
        disabled={this.state.searching}
        value={this.state.value}
        placeholder={this.placeholder.en}
        style={this.props.style}
        defaultActiveFirstOption={true}
        showArrow={true}
        filterOption={true}
        onSearch={this.onSearchHandler}
        onChange={this.onChangeHanlder}
        onBlur={this.onBlurHanlder}
        notFoundContent={null}
      >
        {options}
      </Select>
    );
  }

  doSearch = async keyword => {
    const possibleTypes = {
      account: {
        query: `{ getAccountState(address: "${keyword}") { state { address } } }`,
        label: (v, chain_name=env.assetChainName) => `${chain_name} account: ${v}`,
        value: (v, chain_host=env.assetChainHost) => getExplorerUrl(`/accounts/${v}`, chain_host),
        path: 'getAccountState.state.address',
      },
      asset: {
        query: `{ getAssetState(address: "${keyword}") { state { address } } }`,
        label: (v, chain_name=env.assetChainName) => `${chain_name} asset: ${v}`,
        value: (v, chain_host=env.assetChainHost) => getExplorerUrl(`/assets/${v}`, chain_host),
        path: 'getAssetState.state.address',
      },
      swap: {
        query: `{ getSwapState(address: "${keyword}") { state { address } } }`,
        label: (v, chain_name=env.assetChainName) => `${chain_name} swap: ${v}`,
        value: (v, chain_host=env.assetChainHost) => getExplorerUrl(`/swap/${v}`, chain_host),
        path: 'getSwapState.state.address',
      },
      tx: {
        query: `{ getTx(hash: "${keyword}") { info { hash } } }`,
        label: (v, chain_name=env.assetChainName) => `${chain_name} transaction: ${v}`,
        value: (v, chain_host=env.assetChainHost) => getExplorerUrl(`/txs/${v}`, chain_host),
        path: 'getTx.info.hash',
      },
      block: {
        query: `{ getBlock(height: ${keyword}) { block { height } } }`,
        label: (v, chain_name=env.assetChainName) => `${chain_name} block: ${v}`,
        value: (v, chain_host=env.assetChainHost) => getExplorerUrl(`/blocks/${v}`, chain_host),
        path: 'getBlock.block.height',
      },
      delegate: {
        query: `{ getDelegateState(address: "${keyword}") { state { address } } }`,
        label: (v, chain_name=env.assetChainName) => `${chain_name} delegation: ${v}`,
        value: (v, chain_host=env.assetChainHost) => getExplorerUrl(`/delegate/${v}`, chain_host),
        path: 'getDelegateState.state.address',
      },
      contract: {
        query: `{ getProtocolState(address: "${keyword}") { state { address } } }`,
        label: (v, chain_name=env.assetChainName) => `${chain_name} Smart Contract: ${v}`,
        value: (v, chain_host=env.assetChainHost) => getExplorerUrl(`/contracts/${v}`, chain_host),
        path: 'getProtocolState.state.address',
      },
    };

    this.setState({ 
      searching: true,
    });
    const options = [];
    const keys = Object.keys(possibleTypes);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      // eslint-disable-next-line
      await this.loadSuggest(key, possibleTypes[key], options);
      if(options.length > 0){
        break;
      }
    }

    this.setState({ searching: false });
    
    console.log('doSearch done');
    
    return options;
  };

  loadSuggest = async (type, spec, options) => {
    try {
      //console.log('loadSuggest chains=', this.props.chains );
      const { query, label, value, path } = spec;
      const chains_list = this.props.chains;
      if(chains_list && chains_list.length > 0){
        for(var i=0;i<chains_list.length;i++){
          const res = await forge().doRawQuery(query, chains_list[i].name);
          var v = null;
          if(res){
            v = get(res, path);
          }

          if (v) {
            options.push({ value: value(v, chains_list[i].chain_host), label: label(v, chains_list[i].name) });
          }
        }
      }else{
        const res = await forge().doRawQuery(query);
        var v = null;
        if(res){
          v = get(res, path);
        }

        if (v) {
          options.push({ value: value(v), label: label(v) });
        }
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.error(type, err);
      }
    }
  };
}

SearchBox.propTypes = {
  history: PropTypes.object.isRequired,
};

export default SearchBox;
