pragma solidity ^0.4.21;

import { Unite4 } from "./Unite4.sol";

contract GameMaster {
    mapping (address => string) public usernames;
    mapping (address => uint) public wins;
    mapping (address => uint) public losses;
    mapping (address => uint8) public game_state; 
    Unite4[] public games;

    event GameCreated(
        address game_contract,
        address creator,
        uint256 bet,
        bool first,
        uint256 time_limit
    );
    event UserRegistered(address player, string username);
    event GameClosed(address game_contract);
    event GameOver(address game_contract, address player1, address player2, uint8 result);


    function register(string _name) public returns (bool success) {
        require(bytes(_name).length <= 32);
        usernames[msg.sender] = _name;
        emit UserRegistered(msg.sender, _name);
        return true;
    }

    function createGame(uint256 _bet, bool _first, uint256 _time_limit) public payable returns (Unite4) {
        require(msg.value >= _bet);
        require(bytes(usernames[msg.sender]).length > 0);
        Unite4 game_contract = (new Unite4).value(msg.value)(msg.sender, _first, _bet, _time_limit);
        games.push(game_contract);
        game_state[game_contract] = 1;
        emit GameCreated(address(game_contract), msg.sender, _bet, _first, _time_limit);
        return game_contract;
    }

    function markJoined() public returns (bool success) {
        require(game_state[msg.sender] == 1);
        game_state[msg.sender] = 2;
        emit GameClosed(msg.sender);
        return true;
    }

    function reportResult(address _p1, address _p2, uint8 _result) public returns (bool success) {
        // The game must be over
        require(_result > 0);
        // The sender of the message must be an active game
        require(game_state[msg.sender] == 2);
        if (_result == 1) {
            wins[_p1]++;
            losses[_p2]++;
        } else if (_result == 2) {
            wins[_p2]++;
            losses[_p1]++;
        }
        // remove game from the active list
        uint length = games.length;
        for (uint i = 0; i < length; i++) {
            if (games[i] == msg.sender) {
                games[i] = games[length - 1];
                games.length --;
            }
        }
        delete game_state[msg.sender];
        emit GameOver(msg.sender, _p1, _p2, _result);
        return true;
    }

    function getPlayerInfo(address player) public view
    returns (string username, uint win_count, uint loss_count) {
        username = usernames[player];
        win_count = wins[player];
        loss_count = losses[player];
    }
}
