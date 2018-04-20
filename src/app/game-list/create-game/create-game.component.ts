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
  bet = 0;
  first = true;
  timeLimit = 1440;

  constructor(private activeModal: NgbActiveModal, private gm: GameMasterService) { }

  createGame() {
    this.busy = true;
    this.error = '';
    this.gm.createGame(this.bet, this.first, this.timeLimit)
      .then(() => {
        this.busy = false;
        this.activeModal.close();
      })
      .catch(err => {
        this.busy = false;
        this.error = err.message;
      });
  }

  close() {
    this.activeModal.close();
  }

}
