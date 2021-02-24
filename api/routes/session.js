const ForgeSDK = require('@arcblock/forge-sdk');
const env = require('../libs/env');

const tba_token = {
  decimal: 16,
  symbol: 'TBA'
};

const abt_token = {
  decimal: 18,
  symbol: 'ABT'
};

async function forgeTokenStateGet(){
  var token = null;
  if(env.chainHost === 'https://zinc.abtnetwork.io/api'){
    token = tba_token;
  }else if(env.chainHost === 'https://xenon.network.arcblockio.cn/api'){
    token = abt_token;
  }else{
    const query_res = await ForgeSDK.doRawQuery(`{
      getForgeState {
        code
        state {
          token {
            symbol
            decimal
          }
        }
      }
    }`);
    token = query_res.getForgeState.state.token;
  }
  
  return token;
}

module.exports = {
  init(app) {
    app.get('/api/did/session', async (req, res) => {
      console.log('api.get.session')
      const token = await forgeTokenStateGet();
      res.json({ user: req.user, token: token });
    });
    
    app.get('/api/did/session_user_only', async (req, res) => {
      console.log('api.get.session_user_only')
      res.json({ user: req.user, token: '' });
    });

    app.post('/api/did/logout', (req, res) => {
      req.user = null;
      res.json({ user: null });
    });
  },
  
  forgeTokenStateGet,
};
