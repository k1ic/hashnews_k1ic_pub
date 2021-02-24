import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import get from 'lodash/get';

import { withRouter } from 'react-router-dom';
import IconFa from '@arcblock/ux/lib/Icon';
import {  
  Icon
} from "antd";
import AsyncComponent from '@arcblock/ux/lib/Async';

import forge from '../libs/forge';
import { getExplorerUrl } from '../libs/util';
import env from '../libs/env';

const AsyncSelect = AsyncComponent(() => import('react-select/lib/Async'));

class SearchBox extends React.Component {
  state = {
    searching: false,
  };

  placeholder = {
    en: 'account/asset/swap/hash...',
    zh: '账户/资产/跨链/哈希...'
  };

  render() {
    const { history, ...rest } = this.props;
    return (
      <Container {...rest}>
        <AsyncSelect
          cacheOptions
          isLoading={this.state.searching}
          className="react-select-container"
          classNamePrefix="react-select"
          placeholder={this.placeholder.en}
          noOptionsMessage={this.noOptionsMessage}
          loadOptions={this.onLoadOptions}
          onChange={this.onSelectSearch}
        />
        {/*<Icon type="search" style={{ fontSize: '22px' }} className="search-icon" />*/}
      </Container>
    );
  }

  // prettier-ignore
  noOptionsMessage = ({ inputValue }) => (inputValue ? (this.state.searching?'Loading':'Oops, nothing match found') : this.placeholder.en);

  onSelectSearch = ({ value }, { action }) => {
    //console.log('onSelectSearch', action, value);
    if (action === 'select-option' && value) {
      //this.props.history.push(value);
      window.open(value,'_blank');
    }
  };
  
  onLoadOptions = async keyword => {
    console.log('onLoadOptions keyword=', keyword);
    if(keyword && keyword.length > 0){
      if(this.state.searching){
        return [];
      }else{
        return await this.doSearch(keyword);
      }
    }else{
      return [];
    }
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

const Container = styled.div`
  flex-grow: 1;
  flex-shrink: 0;
  margin-left: 20px;
  position: relative;
  max-width: 480px;

  .search-icon {
    position: absolute;
    right: 16px;
    top: 8px;
  }

  .react-select__control {
    border-radius: 20px;
    padding-left: 8px;
    background-color: ${props => props.theme.palette.background.default};
    .react-select__indicators {
      display: none;
    }
    .react-select__placeholder {
      color: ${props => props.theme.typography.color.gray};
    }
    .react-select__input,
    .react-select__single-value {
      color: ${props => props.theme.typography.color.main};
    }
  }

  .react-select__control--is-focused {
    border-color: ${props => props.theme.typography.color.main};
    box-shadow: 0 0 0 0 transparent;

    &:hover {
      border-color: ${props => props.theme.typography.color.main};
    }
  }

  .react-select__menu {
    background-color: ${props => props.theme.palette.background.default};
    color: ${props => props.theme.typography.color.main};
    text-align: left;

    .react-select__option,
    .react-select__option--is-disabled {
      text-align: left;
    }

    .react-select__option--is-focused,
    .react-select__control--is-selected {
      background-color: ${props => props.theme.palette.primary.main};
    }
  }
`;

export default withRouter(SearchBox);
