const GameMaster = artifacts.require("GameMaster");

module.exports = function(deployer) {
  deployer.deploy(GameMaster);
};
