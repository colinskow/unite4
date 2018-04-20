import { Component } from '@angular/core';
import { GameMasterService } from '../services/game-master.service';

@Component({
  selector: 'u4-tabs',
  templateUrl: './tabs.component.html',
  styleUrls: ['./tabs.component.css']
})
export class TabsComponent {

  constructor(private gm: GameMasterService) { }

  getTabs() {
    return this.gm.getTabs();
  }

}
