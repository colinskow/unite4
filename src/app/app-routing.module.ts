import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { GameListComponent } from './game-list/game-list.component';
import { GameContainerComponent } from './game-container/game-container.component';

const routes: Routes = [
  { path: '', component: GameListComponent },
  { path: 'game/:address', component: GameContainerComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
