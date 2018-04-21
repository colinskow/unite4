import { Injectable } from '@angular/core';
import Web3 from 'web3';
// This works around a default import bug in Web3
import * as Web3Constructor from 'web3';
import { Unit } from 'web3/types';

declare const web3: Web3;

@Injectable()
export class Web3Service {

  web3: Web3;

  constructor() {
    if (typeof web3 !== 'undefined') {
        this.web3 = new (<any>Web3Constructor)(web3.currentProvider);
    } else {
      this.web3 = new (<any>Web3Constructor)(new (<any>Web3Constructor).providers.HttpProvider('http://localhost:7545'));
    }
    // this.web3 = new (<any>Web3Constructor)(new (<any>Web3Constructor).providers.HttpProvider('http://localhost:7545'));
  }

  getAccounts() {
    return this.web3.eth.getAccounts();
  }

  toWei(amount: number, unit: Unit = 'ether') {
    return this.web3.utils.toWei(amount, unit);
  }
}
