'use strict';

var instructions = require('./lib/instructions');
var processing = require('./lib/processing');

module.exports = function(config) {
  if (!config) {
    config = {};
  }
  if (!config.defaultInstruction) {
    config.defaultInstruction = instructions.IdentityInstruction;
  }
  if (!config.instructions) {
    config.instructions = {};
  }
  return processing(config);
};
module.exports.DropInstruction = function() {
  return instructions.DropInstruction;
};
module.exports.MinInstruction = function() {
  return instructions.MinInstruction;
};
module.exports.IdentityInstruction = function() {
  return instructions.IdentityInstruction;
};
module.exports.AggregateInstruction = function(callback) {
  return function() {
    return new instructions.AggregateInstruction(callback);
  };
};
