import { Component, EventEmitter, Input, Output } from '@angular/core';
import { GameState } from '../services/unite4';

@Component({
  selector: 'u4-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent {

  @Input() state: GameState;
  @Input() account: string;
  @Input() busy: boolean;
  @Input() canCallTimeout: boolean;

  @Output() join = new EventEmitter<void>();
  @Output() proposeDraw = new EventEmitter<void>();
  @Output() resign = new EventEmitter<void>();
  @Output() callTimeout = new EventEmitter<void>();
  @Output() withdraw = new EventEmitter<void>();
  @Output() makeMove = new EventEmitter<number>();

  constructor() { }

  sendMakeMove(col: number) {
    if (this._canMakeMove()) {
      this.makeMove.emit(col);
    }
  }

  _getMyPosition() {
    if (this.state.turn === 1 && this.account === this.state.p1) {
      return 1;
    }
    if (this.state.turn === 2 && this.account === this.state.p2) {
      return 2;
    }
    return 0;
  }

  _isMyTurn() {
    return this._getMyPosition() === this.state.turn;
  }

  _canJoin() {
    return !this.state.p1 || !this.state.p2;
  }

  _canProposeDraw() {
    return this.state.winner === 0;
  }

  _canResign() {
    return this.state.winner === 0 && this.state.turn > 0;
  }

  _canCallTimeout() {
    return !this._isMyTurn() && this.canCallTimeout;
  }

  _canWithdraw() {
    const position = this._getMyPosition();
    return position > 0 && this.state.winner > 0 && this.state.turn > 0;
  }

  _canMakeMove() {
    return this._isMyTurn() && this.state.winner === 0;
  }
}
