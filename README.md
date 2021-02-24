![abtworld](http://abtworld.cn/static/images/logo.png)

[![Netlify Status](https://api.netlify.com/api/v1/badges/e0c63e91-97b5-45df-95d1-1bad86153559/deploy-status)](https://app.netlify.com/sites/forge-next-starter/deploys)

> Brings tons of thousands react libraries/components to dApps that run on [forge](https://www.arcblock.io/en/forge-sdk) powered blockchain.

[Live preview](https://forge-next-starter.netlify.com/)

![](./docs/starter-home.png)

## Runtime Requirements

- Following ArcBlock Doc to install runtime dependency: https://docs.arcblock.io/forge/latest/install/ubuntu.html 

## Usage

### Just use this abtworld public repo

> **Note: You need to config `.env` manually.**

```terminal
git clone https://github.com/helloabt/abtworld-pub.git
cd abtworld-pub
yarn
vim .env (config APP_SK/APP_ID/BASE_URL/APP_OWNER_ACCOUNT)
yarn build
yarn start
```

## Configuration

dApp configuration file stored in `.env`, example configure as:

```text
# server only
MONGO_URI="mongodb://127.0.0.1:27017/abtworld"
APP_TOKEN_SECRET="48ef26ff97ca003c7863255258edcd31ccda7d7f"
APP_TOKEN_TTL="1d"
# Wallet private key
# forge wallet:create
# parameter: ROLE_APPLICATION, type: {role: 'ROLE_APPLICATION',pk: 'ED25519',hash: 'SHA3',address: 'BASE58'}
APP_SK="0x2c73992856a3000670a7c187b5cacadc0958df16ff0daa1683d00f76c8ec35984b1cc15b3d5b0c36ec2460ca03428de532df6693a40b08f82c65c8ee9fcd2bb0"
APP_PORT="3030"
# The wallet DID address to auto receive the fee
APP_OWNER_ACCOUNT="z1XKKV5TykX467ZXNo3FuTURaq6eTF8tMQM"

# both client and server
CHAIN_ID="zinc-2019-05-17"
CHAIN_HOST="https://zinc.abtnetwork.io/api"
APP_NAME="ABT World"
APP_DESCRIPTION="DApps on ArcBlock"
# Wallet public address(Corresponding to the wallet private key)
APP_ID="zNKiCPNbtdHnzVN2uMrHbxumzSQuudmuzKNR"
# The pub ip need change to your server public IP
BASE_URL="http://<pub ip>:3030"
```

> Caution: `.env` contains very sensitive info such as Application wallet secret key, PLEASE DO NOT COMMIT `.env` FILE

## FAQ

### How to upgrade `@arcblock/*` dependencies?

Simple, just update `package.json`, then `yarn`, be sure to test the starter after upgrading.

### How to deploy my application?

Checkout [Deployment.md](./docs/deployment.md)

### What APIs are supported by `GraphQLClient`?

Checkout the following screenshot or just run the starter and open browser console.

![](./docs/api-list.png)

## LICENSE

Copyright 2019 ~ ArcBlock & abtworld.cn

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
