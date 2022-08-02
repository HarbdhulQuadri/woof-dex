import EventEmitter from 'eventemitter3';
import { PublicKey, Transaction } from '@solana/web3.js';
import { notify } from '../../utils/notifications';
import { DEFAULT_PUBLIC_KEY, WalletAdapter } from '../types';

type Coin98Event = 'disconnect' | 'connect';
type Coin98RequestMethod =
  | 'connect'
  | 'disconnect'
  | 'signTransaction'
  | 'signAllTransactions';

interface Coin98Provider {
  publicKey?: PublicKey;
  isConnected?: boolean;
  autoApprove?: boolean;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  on: (event: Coin98Event, handler: (args: any) => void) => void;
  request: (method: Coin98RequestMethod, params: any) => Promise<any>;
  listeners: (event: Coin98Event) => (() => void)[];}
  
export class Coin98WalletAdapter
  extends EventEmitter
  implements WalletAdapter {
  constructor() {
    super();
    this.connect = this.connect.bind(this);
  }

  private get _provider(): Coin98Provider | undefined {
    if ((window as any)?.solana?.isCoin98) {
      return (window as any).solana;
    }
    return undefined;
  }

  private _handleConnect = (...args) => {
    this.emit('connect', ...args);
  }

  private _handleDisconnect = (...args) => {
    this.emit('disconnect', ...args);
  }

  get connected() {
    return this._provider?.isConnected || false;
  }

  get autoApprove() {
    return this._provider?.autoApprove || false;
  }

  async signAllTransactions(
    transactions: Transaction[],
  ): Promise<Transaction[]> {
    if (!this._provider) {
      return transactions;
    }

    return this._provider.signAllTransactions(transactions);
  }

  get publicKey() {
    return this._provider?.publicKey || DEFAULT_PUBLIC_KEY;
  }

  async signTransaction(transaction: Transaction) {
    if (!this._provider) {
      return transaction;
    }

    return this._provider.signTransaction(transaction);
  }

  connect() {
    if (!this._provider) {
      window.open('https://www.coin98.com/', '_blank');
      notify({
        message: 'Connection Error',
        description: 'Please install Coin98 wallet',
      });
      return;
    }
    if (!this._provider.listeners('connect').length) {
      this._provider?.on('connect', this._handleConnect);
    }
    if (!this._provider.listeners('disconnect').length) {
      this._provider?.on('disconnect', this._handleDisconnect);
    }
    return this._provider?.connect();
  }

  disconnect() {
    if (this._provider) {
      this._provider.disconnect();
    }
  }
}
