pragma solidity ^0.4.21;

import { GameMaster } from "./GameMaster.sol";

contract Unite4 {
    GameMaster game_master;
    address p1; // red
    address p2; // yellow
    uint256 bet;
    uint256 p1_balance;
    uint256 p2_balance;
    bool p1_draw_proposed = false;
    bool p2_draw_proposed = false;
    uint time_limit;
    uint last_move_timestamp;
    uint8[6][7] board;
    uint8 turn;
    uint8 winner;

    uint8[6][] fwdDiags = [[0, 0], [1, 0], [2, 0], [0, 1], [0, 1], [0, 2]];
    uint8[6][] revDiags = [[5, 0], [4, 0], [3, 0], [5, 1], [5, 2], [5, 3]];

    event Joined(address player, uint8 position);
    event DrawProposed(address player, uint8 position);
    event Draw();
    event Winner(address player, uint8 position);
    event Resigned(address player);
    event TimedOut(address loser);
    event MoveMade(uint8 col, uint8 next_turn);
    event Withdrew(address player, uint256 amount);

    function Unite4(address _player, bool _first, uint _bet, uint _time_limit) public payable {
        require(msg.value >= _bet);
        require(_time_limit >= 5 minutes);
        game_master = GameMaster(msg.sender);
        if (_first) {
            p1 = _player;
            p1_balance = msg.value;
        } else {
            p2 = _player;
            p2_balance = msg.value;
        }
        bet = _bet;
        time_limit = _time_limit;
    }

    function join() public payable returns (bool success) {
        // The amount sent must be >= bet and one game slot must be empty 
        require(msg.value >= bet && (p1 == address(0) || p2 == address(0)));
        turn = 1;
        if (p1 == address(0)) {
            p1 = msg.sender;
            p1_balance = msg.value;
            emit Joined(msg.sender, 1);
        } else {
            p2 = msg.sender;
            p2_balance = msg.value;
            emit Joined(msg.sender, 2);
        }
        last_move_timestamp = block.timestamp;
        return true;
    }

    function proposeDraw() public returns (bool success) {
        require(winner == 0);
        if (msg.sender == p1) {
            p1_draw_proposed = true;
            emit DrawProposed(msg.sender, 1);
        } else if (msg.sender == p2) {
            p2_draw_proposed = true;
            emit DrawProposed(msg.sender, 2);
        }
        if (p1_draw_proposed && p2_draw_proposed) {
            winner = 3;
            _handleEndgame();
        }
        return true;
    }

    function resign() public  returns (bool success) {
        require(winner == 0 && turn > 0);
        if (msg.sender == p1) {
            winner = 2;
            _handleEndgame();
        } else if (msg.sender == p2) {
            winner = 1;
            _handleEndgame();
        }
        emit Resigned(msg.sender);
        return true;
    }

    function callTimeout() public  returns (bool success) {
        // The game must have started, not be over, and a move must be overdue
        require(winner == 0 && turn > 0 && block.timestamp > last_move_timestamp + time_limit);
        if (msg.sender == p1 && turn == 2) {
            winner = 1;
            _handleEndgame();
            emit TimedOut(p2);
        } else if (msg.sender == p2 && turn == 1) {
            winner = 2;
            _handleEndgame();
            emit TimedOut(p1);
        }
        return true;
    }

    function withdraw() public returns (bool success) {
        // The game must be over or have not yet started
        require(winner > 0 || turn == 0);
        uint256 amount = 0;
        if (msg.sender == p1) {
            amount = p1_balance;
            p1_balance = 0;
        } else if (msg.sender == p2) {
            amount = p2_balance;
            p2_balance = 0;
        }
        msg.sender.transfer(amount);
        // If there are no more player funds left in the contract, destroy it
        if (p1_balance == 0 && p2_balance == 0) {
            selfdestruct(address(game_master));
        }
        return true;
    }

    function makeMove(uint8 _col) public returns (bool success) {
        // Make sure the game isn't over
        require(winner == 0);
        // Make sure it is the caller's turn
        require((turn == 1 && msg.sender == p1) || (turn == 2 && msg.sender == p2));
        for (uint8 i = 5; i >= 0; i--) {
            if (board[i][_col] == 0) {
                board[i][_col] = turn;
                winner = checkWinner();
                if (winner > 0) {
                    _handleEndgame();
                    emit MoveMade(_col, 0);
                } else {
                    turn = turn == 1 ? 2 : 1;
                    last_move_timestamp = block.timestamp;
                    emit MoveMade(_col, turn);
                }
                return true;
            }
        }
        return false;
    }

    function checkWinner() public view returns (uint8 result) {
        uint8 red; // p1
        uint8 yellow; // p2
        uint8 empty;
        uint8 r; // row
        uint8 c; // col
        uint8 d; // diag
        // Check rows
        for (r = 0; r < 6; r++) {
            red = 0;
            yellow = 0;
            for (c = 0; c < 7; c++) {
                (result, red, yellow, empty) = _checkPiece(board[r][c], red, yellow, empty);
                if (result > 1) {
                    return result;
                }
            }
        }
        // Check columns
        for (c = 0; c < 7; c++) {
            red = 0;
            yellow = 0;
            for (r = 0; r < 7; r++) {
                (result, red, yellow, empty) = _checkPiece(board[r][c], red, yellow, empty);
                if (result > 1) {
                    return result;
                }
            }
        }
        // Forward diagonals
        for (d = 0; d < 6; d++) {
            r = fwdDiags[d][0];
            c = fwdDiags[d][1];
            red = 0;
            yellow = 0;
            while (r < 6 && c < 7) {
                (result, red, yellow, empty) = _checkPiece(board[r][c], red, yellow, empty);
                if (result > 1) {
                    return result;
                }
                r++;
                c++;
            }
        }
        // Reverse diagonals
        for (d = 0; d < 6; d++) {
            r = revDiags[d][0];
            c = revDiags[d][1];
            red = 0;
            yellow = 0;
            while (r >= 0 && c < 7) {
                (result, red, yellow, empty) = _checkPiece(board[r][c], red, yellow, empty);
                if (result > 1) {
                    return result;
                }
            }
            r--;
            c++;
        }
        // If the board is full, game is a draw, otherwise continue playing
        return empty > 0 ? 0 : 3;
    }

    function _checkPiece(
        uint8 _piece, uint8 _red, uint8 _yellow, uint8 _empty
    ) internal pure returns (uint8 result, uint8 red, uint8 yellow, uint8 empty) {
        red = _red;
        yellow = _yellow;
        empty = _empty;
        if (_piece == 1) {
            yellow = 0;
            red++;
        } else if (_piece == 2) {
            red = 0;
            yellow++;
        } else {
            empty++;
            red = 0;
            yellow = 0;
        }
        result = red == 4 ? 1 : yellow == 4 ? 2 : 0;
        return (result, red, yellow, empty);
    }

    function _handleEndgame() internal {
        require(winner > 0);
        if (winner == 1) {
            p2_balance -= bet;
            p1_balance += bet;
            emit Winner(p1, 1);
        } else if (winner == 2) {
            p1_balance -= bet;
            p2_balance += bet;
            emit Winner(p2, 2);
        } else {
            emit Draw();
        }
        game_master.reportResult(p1, p2, winner);
    }
}
