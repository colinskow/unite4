import { Injectable } from '@angular/core';
import { combineLatest } from 'rxjs/observable/combineLatest';
import { Subject } from 'rxjs/Subject';
import { Subscription } from 'rxjs/Subscription';
import { Contract, EventEmitter } from 'web3/types';
import { Unite4 } from './unite4';
import { Web3Service } from './web3.service';
import { createListener } from './utils';
import * as gameMasterArtifact from '../../../build/contracts/GameMaster.json';

export interface PlayerInfo {
  username: string;
  win_count: number;
  loss_count: number;
}

export interface GameCreatedEvent {
  game_contract: string;
  creator: string;
  bet: number;
  first: boolean;
  time_limit: number;
}

export interface UserRegisteredEvent {
  player: string;
  username: string;
}

export interface GameClosedEvent {
  game_contract: string;
}

export interface GameOverEvent {
  game_contract: string;
  player1: string;
  player2: string;
  result: number;
}

export interface TabState {
  address: string;
  p1_username: string;
  p2_username: string;
  myGame: boolean;
  myTurn: boolean;
}

export interface GameMasterState {
  usernames: { [player: string]: string };
  wins: { [player: string]: number };
  losses: { [player: string]: number };
  game_state: { [game: string]: number };
  games: string[];
}

export interface GameMasterEvents {
  GameCreated: Subject<GameCreatedEvent>;
  UserRegistered: Subject<UserRegisteredEvent>;
  GameClosed: Subject<GameClosedEvent>;
  GameOver: Subject<GameClosedEvent>;
}

export interface GameListing {
  address: string;
  p1: string;
  p1_username: string;
  p2: string;
  p2_username: string;
  bet: number;
  time_limit: number;
  joinable: boolean;
  status: string;
}

@Injectable()
export class GameMasterService {

  gameMaster: Contract;

  state: GameMasterState = {
    usernames: {},
    wins: {},
    losses: {},
    game_state: {},
    games: []
  };

  events$: GameMasterEvents = {
    GameCreated: new Subject(),
    UserRegistered: new Subject(),
    GameClosed: new Subject(),
    GameOver: new Subject()
  };

  gameContracts: { [address: string]: Unite4 } = {};
  accounts: string[];
  tabs: string[];

  private _subs: Subscription[] = [];
  private _listeners: EventEmitter[] = [];

  constructor(private w3: Web3Service) {
    const abi = (<any>gameMasterArtifact).abi;
    const addr = (<any>gameMasterArtifact).networks[5777].address;
    this.gameMaster = new w3.web3.eth.Contract(abi, addr);
    this.accounts = [this.w3.web3.eth.defaultAccount];
    this.w3.web3.eth.getAccounts()
      .then(accounts => this.accounts = accounts)
      .catch(err => console.error(err));
  }

  setupListeners() {
    ['usernames', 'wins', 'losses', 'game_state', 'games']
      .forEach(key => {
        this.gameMaster.methods[key]().call()
          .then(result => this.state = { ...this.state, [key]: result })
          .catch(err => console.log(err));
      });
    this.state.games.forEach(address => this.onGameCreated(address));
    const sub1 = this.events$.GameCreated
      .subscribe((ev: GameCreatedEvent) => {
        this.state = {
          ...this.state,
          games: [...this.state.games, ev.game_contract],
          game_state: { ...this.state.game_state, [ev.game_contract]: 1 }
        };
        this.onGameCreated(ev.game_contract);
      });
    const sub2 = this.events$.UserRegistered
      .subscribe((ev: UserRegisteredEvent) => {
        this.state = {
          ...this.state,
          usernames: { ...this.state.usernames, [ev.player]: ev.username },
          wins: { ...this.state.wins, [ev.player]: 0 },
          losses: { ...this.state.losses, [ev.player]: 0 }
        };
      });
    const sub3 = this.events$.GameClosed
      .subscribe((ev: GameClosedEvent) => {
        this.state = {
          ...this.state,
          game_state: { ...this.state.game_state, [ev.game_contract]: 2 }
        };
      });
    const sub4 = this.events$.GameOver
      .subscribe((ev: GameOverEvent) => {
        this.state = {
          ...this.state,
          game_state: { ...this.state.game_state, [ev.game_contract]: null }
        };
        if (ev.result < 3) {
          let winner;
          let loser;
          if (ev.result === 1) {
            winner = 1;
            loser = 2;
          } else {
            winner = 2;
            loser = 1;
          }
          this.state.wins = { ...this.state.wins, [winner]: this.state.wins[winner] + 1 };
          this.state.losses = { ...this.state.losses, [loser]: this.state.losses[loser] + 1 };
        }
      });
    this._subs.push(sub1, sub2, sub3, sub4);
    createListener(this.gameMaster, 'GameCreated', this.events$.GameCreated, this._listeners);
    createListener(this.gameMaster, 'UserRegistered', this.events$.UserRegistered, this._listeners);
    createListener(this.gameMaster, 'GameClosed', this.events$.GameClosed, this._listeners);
    createListener(this.gameMaster, 'GameOver', this.events$.GameOver, this._listeners);
  }

  onGameCreated(address: string) {
    this.gameContracts[address] = new Unite4(address, this.w3);
    this.gameContracts[address].basicListeners();
  }

  getGameState(address: string) {
    return this.gameContracts[address].state;
  }

  register(name: string) {
    return this.gameMaster.methods.register(name).send();
  }

  createGame(bet: number, first: boolean, timeLimit: number) {
    const betWei = this.w3.toWei(bet, 'ether');
    return this.gameMaster.methods.createGame(betWei, first, timeLimit).send();
  }

  joinGame(address: string, account: string) {
    const game = this.getGame(address);
    if (!game) {
      throw new Error('Invalid game');
    }
    return game.join(account, game.state.bet);
  }

  getGame(address: string) {
    return this.gameContracts[address];
  }

  listGames(): GameListing[] {
    return this.state.games.map(address => {
      const game = this.getGame(address);
      const { p1, p2, bet, winner, time_limit } = game.state;
      const p1_username = this.state.usernames[p1];
      const p2_username = this.state.usernames[p2];
      const joinable = !p1 || !p2;
      let status;
      if (joinable) {
        status = 'Waiting for competitor';
      } else {
        switch (winner) {
          case 1:
            status = p1_username + ' won';
            break;
          case 2:
            status = p2_username + ' won';
            break;
          case 3:
            status = 'Draw';
            break;
          default:
            status = 'In progress';
        }
      }
      return {
        address, p1, p1_username, p2, p2_username, bet, time_limit, joinable, status
      };
    });
  }

  isMyGame(game: Unite4) {
    if (!this.accounts || !this.accounts.length) {
      return false;
    }
    const { p1, p2 } = game.state;
    if (this.accounts.includes(p1) || this.accounts.includes(p2)) {
      return true;
    }
    return false;
  }

  isMyTurn(game: Unite4) {
    if (!this.accounts || !this.accounts.length || game.state.turn === 0) {
      return false;
    }
    const { p1, p2, turn } = game.state;
    if ((turn === 1 && this.accounts.includes(p1)) || ( turn === 2 && this.accounts.includes(p2))) {
      return true;
    }
    return false;
  }

  getAccounts() {
    return this.accounts;
  }

  getTabs() {
    const myGames = this.state.games
      .map(addr => this.getTabInfo(addr))
      .filter(tab => !!tab);
    const viewedGames = this.state.games
      .map(addr => this.getTabInfo(addr))
      .filter(tab => !!tab)
      .filter(tab => !tab.myGame);
    return [...myGames, ...viewedGames];
  }

  getTabInfo(address: string): TabState {
    const game = this.getGame(address);
    if (!game) {
      return null;
    }
    return {
      address,
      p1_username: this.state.usernames[game.state.p1] || '?',
      p2_username: this.state.usernames[game.state.p2] || '?',
      myGame: this.isMyGame(game),
      myTurn: this.isMyTurn(game)
    };
  }

  disconnect() {
    this._listeners.forEach(listener => {
      (<any>listener).removeAllListeners();
    });
    this._subs.forEach(sub => {
      sub.unsubscribe();
    });
  }

}
