import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'u4-static-game',
  templateUrl: './static-game.component.html',
  styleUrls: ['./static-game.component.css']
})
export class AppComponent implements OnInit {
  board = Array(6).fill(0).map(() => Array(7).fill(0));
  turn = 1;
  fwdDiags = [[0, 0], [1, 0], [2, 0], [0, 1], [0, 1], [0, 2]];
  revDiags = [[5, 0], [4, 0], [3, 0], [5, 1], [5, 2], [5, 3]];
  winner = 0;

  ngOnInit() {}

  makeMove(col) {
    if (col < 0 || col > 6 || this.winner) {
      return;
    }
    for (let i = 5; i >= 0; i--) {
      if (this.board[i][col] === 0) {
        this.board[i][col] = this.turn;
        this.winner = this.checkWinner();
        return this.changeTurn();
      }
    }
  }

  changeTurn() {
    this.turn = this.turn === 1 ? 2 : 1;
  }

  checkWinner() {
    // Rows
    let red;
    let yellow;
    let empty = 0;
    const check = (row, col) => {
      switch (this.board[row][col]) {
        case 1:
          yellow = 0;
          red++;
          break;
        case 2:
          red = 0;
          yellow++;
          break;
        default:
          empty++;
          red = 0;
          yellow = 0;
      }
      if (red === 4) {
        return 1;
      }
      if (yellow === 4) {
        return 2;
      }
    };
    for (let r = 0; r < 6; r++) {
      red = 0;
      yellow = 0;
      for (let c = 0; c < 7; c++) {
        const result = check (r, c);
        if (result) {
          return result;
        }
      }
    }
    // Columns
    for (let c = 0; c < 7; c++) {
      red = 0;
      yellow = 0;
      for (let r = 0; r < 6; r++) {
        const result = check (r, c);
        if (result) {
          return result;
        }
      }
    }
    // Forward Diagonals
    for (let d = 0; d < this.fwdDiags.length; d++) {
      let r = this.fwdDiags[d][0];
      let c = this.fwdDiags[d][1];
      red = 0;
      yellow = 0;
      while (r < 6 && c < 7) {
        const result = check (r, c);
        if (result) {
          return result;
        }
        r++;
        c++;
      }
    }
    // Backward Diagonals
    for (let d = 0; d < this.revDiags.length; d++) {
      let r = this.revDiags[d][0];
      let c = this.revDiags[d][1];
      red = 0;
      yellow = 0;
      while (r >= 0 && c < 7) {
        const result = check (r, c);
        if (result) {
          return result;
        }
        r--;
        c++;
      }
    }
    return empty > 0 ? 0 : 3;
  }
}
