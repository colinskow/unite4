import { Component, OnDestroy } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { GameMasterService, GameListing } from '../services/game-master.service';
import { CreateGameComponent } from './create-game/create-game.component';
import { RegisterComponent } from './register/register.component';

@Component({
  selector: 'u4-game-list',
  templateUrl: './game-list.component.html',
  styleUrls: ['./game-list.component.css']
})
export class GameListComponent implements OnDestroy {

  createGameDialog = false;
  dialogBusy = false;
  error = '';
  joining: { [game: string]: boolean } = {};
  joined: { [game: string]: boolean } = {};

  constructor(private gm: GameMasterService, private modalService: NgbModal) {
    this.gm.setupListeners();
  }

  listGames() {
    return this.gm.listGames();
  }

  joinGame(address: string, account: string) {
    this.joining[address] = true;
    this.error = '';
    this.gm.joinGame(address, account)
      .then(() => {
        this.joining[address] = false;
        this.joined[address] = true;
      })
      .catch(err => {
        this.error = err.message;
        this.joining[address] = false;
      });
  }

  openCreateGame() {
    this.modalService.open(CreateGameComponent);
  }

  openRegister() {
    this.modalService.open(RegisterComponent);
  }

  ngOnDestroy() {
    this.gm.disconnect();
  }

}
