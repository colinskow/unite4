import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';
import { Unite4 } from '../services/unite4';
import { Web3Service } from '../services/web3.service';
import { GameMasterService } from '../services/game-master.service';

@Component({
  selector: 'u4-game-container',
  templateUrl: './game-container.component.html',
  styleUrls: ['./game-container.component.css']
})
export class GameContainerComponent implements OnDestroy {

  get gameAddress(): string {
    return this._gameAddress;
  }
  set gameAddress(addr: string) {
    this._gameAddress = addr;
    this.game = this.gm.getGame(addr);
    // Subscribe to events to check if timeout can be called
    const sub1 = this.game.events$.Joined
      .subscribe(() => {
        this.checkCallTimeout();
      });
    const sub2 = this.game.events$.MoveMade
      .subscribe(() => {
        this.checkCallTimeout();
      });
    this._subs.push(sub1, sub2);
    Promise.all([
      this.game.basicListeners(),
      this.game.advancedListeners(),
    ])
      .then(() => this.checkCallTimeout());
  }

  game: Unite4;
  busy = false;
  selectedAccount = '';
  error = '';
  canCallTimeout = false;

  private _gameAddress: string;
  private _timeout: any;
  private _subs: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private w3: Web3Service,
    private gm: GameMasterService
  ) {
    const sub = this.route.params.subscribe(params => this.gameAddress = params.address);
    this._subs.push(sub);
  }

  ngOnDestroy() {
    this._subs.forEach(sub => sub.unsubscribe());
  }

  getAccounts() {
    return this.gm.getAccounts();
  }

  getState() {
    return this.game.state;
  }

  filterAccounts(): string[] {
    const accounts = this.getAccounts();
    if (!accounts || accounts.length) {
      return [];
    }
    const { p1, p2, turn, winner } = this.getState();
    return accounts.filter(addr => {
      if (!p1 || !p2) {
        return true;
      }
      if (winner === 0) {
        if (turn === 1) {
          return addr === p1;
        }
        if (turn === 2) {
          return addr === p2;
        }
      }
      return addr === p1 || addr === p2;
    });
  }

  onJoin() {
    this.busy = true;
    return this.game.join(this.selectedAccount, this.getState().bet)
      .then(() => this.busy = false)
      .catch(err => this.error = err.message);
  }

  onProposeDraw() {
    this.busy = true;
    return this.game.proposeDraw(this.selectedAccount)
      .then(() => this.busy = false)
      .catch(err => this.error = err.message);
  }

  onResign() {
    this.busy = true;
    return this.game.resign(this.selectedAccount)
      .then(() => this.busy = false)
      .catch(err => this.error = err.message);
  }

  onCallTimeout() {
    this.busy = true;
    return this.game.callTimeout(this.selectedAccount)
      .then(() => this.busy = false)
      .catch(err => this.error = err.message);
  }

  onWithdraw() {
    this.busy = true;
    return this.game.withdraw(this.selectedAccount)
      .then(() => this.busy = false)
      .catch(err => this.error = err.message);
  }

  onMakeMove(col: number) {
    this.busy = true;
    return this.game.makeMove(this.selectedAccount, col)
      .then(() => this.busy = false)
      .catch(err => this.error = err.message);
  }

  checkCallTimeout() {
    this.canCallTimeout = false;
    if (this._timeout) {
      this.cancelTimeout();
    }
    const { p1, p2, turn, winner, last_move_timestamp, time_limit } = this.getState();
    // Make sure the game has begun and is not over
    if (turn === 0 || winner > 0) {
      return;
    }
    // Make sure it is the other player's turn
    if (turn === 1 && this.selectedAccount !== p2) {
      return;
    }
    if (turn === 2 && this.selectedAccount !== p1) {
      return;
    }
    const now = Date.now();
    const when = (last_move_timestamp + time_limit) * 1000;
    if (now >= when) {
      this.canCallTimeout = true;
    } else {
      this._timeout = setTimeout(() => {
        this.checkCallTimeout();
      }, when - now);
    }
  }

  cancelTimeout() {
    clearTimeout(this._timeout);
    this._timeout = null;
  }

}
