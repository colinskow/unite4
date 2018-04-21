import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { GameMasterService } from '../../services/game-master.service';

@Component({
  selector: 'u4-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {

  account: string;
  username = '';
  busy = false;
  error = '';

  constructor(private activeModal: NgbActiveModal, private gm: GameMasterService) {
    this.account = this.getAccounts()[0] || '';
  }

  getAccounts() {
    return this.gm.getAccounts();
  }

  register() {
    if (this.username.length < 4) {
      this.error = 'Username must be at least 4 characters';
      return;
    }
    this.busy = true;
    this.gm.register(this.account, this.username)
      .then((res) => {
        this.busy = false;
        this.close();
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
