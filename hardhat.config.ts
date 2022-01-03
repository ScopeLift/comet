import 'dotenv/config';

import { HardhatUserConfig } from 'hardhat/types';
import { task } from 'hardhat/config';
import '@compound-finance/hardhat-import';
import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-etherscan';
import '@typechain/hardhat';
import 'solidity-coverage';
import 'hardhat-gas-reporter';

// Hardhat tasks
import './tasks/spider/task.ts';
import './tasks/scenario/task.ts';

task('accounts', 'Prints the list of accounts', async (taskArgs, hre) => {
  for (const account of await hre.ethers.getSigners())
    console.log(account.address);
});

/* note: boolean environment variables are imported as strings */
const {
  COINMARKETCAP_API_KEY,
  ETHERSCAN_KEY,
  SNOWTRACE_KEY,
  INFURA_KEY,
  MNEMONIC = '',
  REPORT_GAS = 'false',
  NETWORK,
} = process.env;

function throwIfMissing(envVariable, msg: string) {
  if (!envVariable) {
    throw new Error(msg);
  }
}

// required environment variables
throwIfMissing(
  ETHERSCAN_KEY,
  'Missing required environment variable: ETHERSCAN_KEY'
);
throwIfMissing(
  SNOWTRACE_KEY,
  'Missing required environment variable: SNOWTRACE_KEY'
);
throwIfMissing(INFURA_KEY, 'Missing required environment variable: INFURA_KEY');

// Networks
interface NetworkConfig {
  network: string;
  chainId: number;
  url?: string;
  gas?: number | 'auto';
  gasPrice?: number | 'auto';
}

const networkConfigs: NetworkConfig[] = [
  { network: 'mainnet', chainId: 1 },
  { network: 'ropsten', chainId: 3 },
  { network: 'rinkeby', chainId: 4 },
  { network: 'goerli', chainId: 5 },
  { network: 'kovan', chainId: 42 },
  {
    network: 'avalanche',
    chainId: 43114,
    url: 'https://api.avax.network/ext/bc/C/rpc',
  },
  {
    network: 'fuji',
    chainId: 43113,
    url: 'https://api.avax-test.network/ext/bc/C/rpc',
  },
];

function getDefaultProviderURL(network: string) {
  return `https://${network}.infura.io/v3/${INFURA_KEY}`;
}

function setupDefaultNetworkProviders(hardhatConfig: HardhatUserConfig) {
  for (const netConfig of networkConfigs) {
    hardhatConfig.networks[netConfig.network] = {
      chainId: netConfig.chainId,
      url: netConfig.url || getDefaultProviderURL(netConfig.network),
      gas: netConfig.gasPrice || 'auto',
      gasPrice: netConfig.gasPrice || 'auto',
      accounts: {
        mnemonic: MNEMONIC,
      },
    };
  }
}

// TODO: Use the multi API key config feature when it is published to npm by hardhat-etherscan.
// See https://hardhat.org/plugins/nomiclabs-hardhat-etherscan.html#multiple-api-keys-and-alternative-block-explorers
function getApiKey() {
  switch (NETWORK) {
    case 'mainnet':
    case 'rinkeby':
    case 'goerli':
    case 'ropsten':
      return ETHERSCAN_KEY;
    case 'avalanche':
    case 'fuji':
      return SNOWTRACE_KEY;
    default:
      return ETHERSCAN_KEY;
  }
}

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.4',
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    },
  },

  networks: {
    hardhat: {
      chainId: 1337,
      loggingEnabled: false,
      gas: 12000000,
      gasPrice: 'auto',
      blockGasLimit: 12000000,
      accounts: {
        mnemonic:
          'myth like bonus scare over problem client lizard pioneer submit female collect',
      },
    },
  },

  etherscan: {
    apiKey: getApiKey(),
  },

  gasReporter: {
    enabled: REPORT_GAS === 'true' ? true : false,
    currency: 'USD',
    coinmarketcap: COINMARKETCAP_API_KEY,
    gasPrice: 200, // gwei
  },

  typechain: {
    outDir: 'build/types',
    target: 'ethers-v5',
  },

  scenario: {
    bases: [
      {
        name: 'development',
      },
      {
        name: 'goerli',
        url: getDefaultProviderURL('goerli'),
      },
      {
        name: 'fuji',
        url: 'https://api.avax-test.network/ext/bc/C/rpc',
      },
    ],
  },
};

setupDefaultNetworkProviders(config);

export default config;
