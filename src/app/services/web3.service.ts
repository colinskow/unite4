import { Injectable } from '@angular/core';
import Web3 from 'web3';
import { Unit } from 'web3/types';

declare const web3: Web3;

@Injectable()
export class Web3Service {

  web3: Web3;

  constructor() {
    if (typeof web3 !== 'undefined') {
        this.web3 = new Web3(web3.currentProvider);
    } else {
        this.web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
    }
    this.web3.eth.defaultAccount = web3.eth.accounts[0];
  }

  getAccounts() {
    return this.web3.eth.getAccounts();
  }

  toWei(amount: number, unit: Unit = 'ether') {
    return this.web3.utils.toWei(amount, unit);
  }
}
