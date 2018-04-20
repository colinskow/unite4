import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Subject } from 'rxjs/Subject';
import { Subscription } from 'rxjs/Subscription';
import { Contract, EventEmitter, EventLog } from 'web3/types';
import { createListener } from './utils';
import { Web3Service } from './web3.service';
import * as unite4Artifact from '../../../build/contracts/Unite4.json';
import { listeners } from 'cluster';

export interface PositionEvent {
  player: string;
  position: number;
}

export interface PlayerEvent {
  player: string;
}

export interface TimedOutEvent {
  loser: string;
}

export interface MoveMadeEvent {
  col: number;
  next_turn: number;
}

export interface WithdrewEvent {
  player: string;
  amount: number;
}

export interface GameState {
  p1: string;
  p2: string;
  bet: number;
  p1_balance: number;
  p2_balance: number;
  p1_draw_proposed: boolean;
  p2_draw_proposed: boolean;
  time_limit: number;
  last_move_timestamp: number;
  board: number[][];
  turn: number;
  winner: number;
}

export interface GameEvents {
  Joined: Subject<PositionEvent>;
  DrawProposed: Subject<PositionEvent>;
  Draw: Subject<{}>;
  Winner: Subject<PositionEvent>;
  Resigned: Subject<PlayerEvent>;
  TimedOut: Subject<TimedOutEvent>;
  MoveMade: Subject<MoveMadeEvent>;
  Withdrew: Subject<WithdrewEvent>;
}

export class Unite4 {
  game: Contract;

  state: GameState = {
    p1: null,
    p2: null,
    bet: 0,
    p1_balance: 0,
    p2_balance: 0,
    p1_draw_proposed: false,
    p2_draw_proposed: false,
    time_limit: 0,
    last_move_timestamp: 0,
    board: Array(6).fill(0).map(() => Array(7).fill(0)),
    turn: 0,
    winner: 0
  };

  events$: GameEvents = {
    Joined: new Subject(),
    DrawProposed: new Subject(),
    Draw: new Subject(),
    Winner: new Subject(),
    Resigned: new Subject(),
    TimedOut: new Subject(),
    MoveMade: new Subject(),
    Withdrew: new Subject()
  };

  basicListenersActive = false;
  advancedListenersActive = false;
  private _subs: Subscription[] = [];
  private _listeners: EventEmitter[] = [];

  constructor(public address: string, private w3: Web3Service) {
    this.game = new w3.web3.eth.Contract((<any>unite4Artifact).abi, address);
  }

  basicListeners() {
    if (this.basicListenersActive) {
      return;
    }
    this.basicListenersActive = true;
    const promises = [];
    ['p1', 'p2', 'bet', 'time_limit', 'winner']
      .forEach(key => {
        const promise = this.game.methods[key]().call()
          .then(result => this.state = { ...this.state, [key]: result })
          .catch(err => console.log(err));
        promises.push(promise);
      });
    const sub1 = this.events$.Joined
      .subscribe(ev => {
        switch (ev.position) {
          case 1:
            this.state = { ...this.state, p1: ev.player };
            break;
          case 2:
            this.state = { ...this.state, p2: ev.player };
        }
      });
    const sub2 = this.events$.Draw.subscribe(ev => this.state = { ...this.state, winner: 3 });
    const sub3 = this.events$.Winner.subscribe(ev => this.state = { ...this.state, winner: ev.position });
    this._subs.push(sub1, sub2, sub3);
    createListener(this.game, 'Joined', this.events$.Joined, this._listeners);
    createListener(this.game, 'Draw', this.events$.Draw, this._listeners);
    createListener(this.game, 'Winner', this.events$.Joined, this._listeners);
    return Promise.all(promises);
  }

  advancedListeners() {
    if (this.advancedListenersActive) {
      return;
    }
    this.advancedListenersActive = true;
    const promises = [];
    [
      'p1_balance',
      'p2_balance',
      'p1_draw_proposed',
      'time_limit',
      'last_move_timestamp',
      'board',
      'turn'
    ]
      .forEach(key => {
        const promise = this.game.methods[key]().call()
          .then(result => this.state = { ...this.state, [key]: result })
          .catch(err => console.log(err));
          promises.push(promise);
      });
    const sub1 = this.events$.DrawProposed
      .subscribe(ev => {
        switch (ev.position) {
          case 1:
            this.state = { ...this.state, p1_draw_proposed: true };
            break;
          case 2:
          this.state = { ...this.state, p2_draw_proposed: true };
        }
      });
    const sub2 = this.events$.MoveMade
      .subscribe(ev => {
        this.game.methods.board().call()
          .then(board => {
            this.state = { ...this.state, board };
            this.state = { ...this.state, turn: ev.next_turn };
          })
          .catch(err => console.log(err));
        this.game.methods.last_move_timestamp().call()
          .then(timestamp => this.state = { ...this.state, last_move_timestamp: timestamp })
          .catch(err => console.log(err));
      });
    const sub3 = this.events$.Withdrew
      .subscribe(ev => {
        this.game.methods.p1_balance().call()
          .then(balance => this.state = { ...this.state, p1_balance: balance })
          .catch(err => console.error(err));
        this.game.methods.p2_balance().call()
          .then(balance => this.state = { ...this.state, p2_balance: balance })
          .catch(err => console.error(err));
      });
    this._subs.push(sub1, sub2, sub3);
    createListener(this.game, 'DrawProposed', this.events$.DrawProposed, this._listeners);
    createListener(this.game, 'Resigned', this.events$.Resigned, this._listeners);
    createListener(this.game, 'TimedOut', this.events$.TimedOut, this._listeners);
    createListener(this.game, 'MoveMade', this.events$.MoveMade, this._listeners);
    createListener(this.game, 'Withdrew', this.events$.Withdrew, this._listeners);
    return Promise.all(promises);
  }

  checkWinner() {
    return this.game.methods.checkWinner().call();
  }

  join(account: string, value: number) {
    if (value >= this.state.bet && (!this.state.p1 || !this.state.p2)) {
      return this.game.methods.join().send({ from: account, value });
    }
    throw new Error('Cannot join: insufficient deposit or game full.');
  }

  proposeDraw(account: string) {
    if (this.state.winner !== 0) {
      throw new Error('Game is already over.');
    }
    return this.game.methods.proposeDraw().send({ from: account });
  }

  resign(account: string) {
    if (this.state.winner !== 0 || this.state.turn === 0) {
      throw new Error('Cannot resign.');
    }
    return this.game.methods.resign().send({ from: account });
  }

  callTimeout(account: string) {
    const nowSeconds = Date.now() / 1000;
    const canCallTimeout = this.state.last_move_timestamp + this.state.time_limit < Date.now();
    if (this.state.winner !== 0 || this.state.turn === 0 || !canCallTimeout) {
      throw new Error('Cannot call timeout.');
    }
    return this.game.methods.callTimeout().send({ from: account });
  }

  withdraw(account: string) {
    if (this.state.winner === 0 && this.state.turn > 0) {
      throw new Error('Cannot withrdraw.');
    }
    return this.game.methods.withdraw().send({ from: account });
  }

  makeMove(account: string, col: number) {
    const myPosition = this.state.p1 === account ? 1
      : this.state.p2 === account ? 2 : 0;
    if (myPosition === 0 || this.state.winner > 0 || myPosition !== this.state.turn) {
      throw new Error('Cannot make move.');
    }
    return this.game.methods.makeMove().send({ from: account });
  }

  disconnect() {
    this.basicListenersActive = false;
    this.advancedListenersActive = false;
    this._listeners.forEach(listener => {
      (<any>listener).removeAllListeners();
    });
    this._subs.forEach(sub => {
      sub.unsubscribe();
    });
  }
}
