module.exports = {
  chainName: process.env.REACT_APP_CHAIN_NAME || process.env.GATSBY_CHAIN_NAME || process.env.CHAIN_NAME || process.env.chainName,
  chainId: process.env.REACT_APP_CHAIN_ID || process.env.GATSBY_CHAIN_ID || process.env.CHAIN_ID || process.env.chainId,
  chainHost:
    process.env.REACT_APP_CHAIN_HOST ||
    process.env.GATSBY_CHAIN_HOST ||
    process.env.CHAIN_HOST ||
    process.env.chainHost,
  assetChainName: process.env.REACT_ASSET_CHAIN_NAME || process.env.GATSBY_ASSET_CHAIN_NAME || process.env.ASSET_CHAIN_NAME || process.env.assetChainName,
  assetChainId: process.env.REACT_ASSET_CHAIN_ID || process.env.GATSBY_ASSET_CHAIN_ID || process.env.ASSET_CHAIN_ID || process.env.assetChainId,
  assetChainHost:
    process.env.REACT_ASSET_CHAIN_HOST ||
    process.env.GATSBY_ASSET_CHAIN_HOST ||
    process.env.ASSET_CHAIN_HOST ||
    process.env.assetChainHost,
  appId: process.env.REACT_APP_APP_ID || process.env.GATSBY_APP_ID || process.env.APP_ID || process.env.appId,
  appOwnerAccount: process.env.APP_OWNER_ACCOUNT || process.env.appOwnerAccount,
  appAdminAccounts: process.env.APP_ADMIN_ACCOUNTS  || process.env.appAdminAccounts,
  appName: process.env.REACT_APP_APP_NAME || process.env.GATSBY_APP_NAME || process.env.APP_NAME || process.env.appName,
  appDescription:
    process.env.REACT_APP_APP_DESCRIPTION ||
    process.env.GATSBY_APP_DESCRIPTION ||
    process.env.APP_DESCRIPTION ||
    process.env.appDescription,
  appInfoLink: process.env.REACT_APP_INFO_LINK || process.env.GATSBY_APP_INFO_LINK || process.env.APP_INFO_LINK || process.env.appInfoLink,
  baseUrl: process.env.REACT_APP_BASE_URL || process.env.GATSBY_BASE_URL || process.env.BASE_URL || process.env.baseUrl,
  apiPrefix:
    process.env.REACT_APP_API_PREFIX ||
    process.env.GATSBY_API_PREFIX ||
    process.env.FN_API_PREFIX ||
    process.env.API_PREFIX ||
    process.env.apiPrefix,
};
