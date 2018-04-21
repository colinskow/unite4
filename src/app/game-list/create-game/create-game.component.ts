import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { GameMasterService } from '../../services/game-master.service';

@Component({
  selector: 'u4-create-game',
  templateUrl: './create-game.component.html',
  styleUrls: ['./create-game.component.css']
})
export class CreateGameComponent {

  busy = false;
  error = '';
  account: string;
  bet = '0';
  first = true;
  timeLimit = 1440;

  constructor(private activeModal: NgbActiveModal, private gm: GameMasterService) {
    const accounts = this.getRegisteredAccounts();
    if (!accounts || !accounts.length) {
      this.account = '';
    } else {
      this.account = accounts[0].account;
    }
  }

  createGame() {
    this.busy = true;
    this.error = '';
    this.gm.createGame(this.account, this.bet, this.first, this.timeLimit)
      .then(() => {
        this.busy = false;
        this.activeModal.close();
      })
      .catch(err => {
        this.busy = false;
        this.error = err.message;
        console.error(err);
      });
  }

  getRegisteredAccounts() {
    return this.gm.getRegisteredAccounts();
  }

  close() {
    this.activeModal.close();
  }

}
