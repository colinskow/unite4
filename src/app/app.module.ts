import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { Web3Service } from './services/web3.service';
import { GameMasterService } from './services/game-master.service';
import { GameComponent } from './game/game.component';
import { GameContainerComponent } from './game-container/game-container.component';
import { GameListComponent } from './game-list/game-list.component';
import { TabsComponent } from './tabs/tabs.component';
import { CreateGameComponent } from './game-list/create-game/create-game.component';

@NgModule({
  declarations: [
    AppComponent,
    GameComponent,
    GameContainerComponent,
    GameListComponent,
    TabsComponent,
    CreateGameComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    AppRoutingModule,
    NgbModule.forRoot()
  ],
  providers: [Web3Service, GameMasterService],
  bootstrap: [AppComponent]
})
export class AppModule { }
