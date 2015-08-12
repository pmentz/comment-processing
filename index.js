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
module.exports.withInstructions = function(instructionObj) {
  return processing({
    defaultInstruction: instructions.IdentityInstruction,
    instructions: instructionObj
  });
};
module.exports.withDefaults = function(aggregateFn) {
  return processing({
    defaultInstruction: instructions.IdentityInstruction,
    instructions: {
      drop: module.exports.DropInstruction,
      min: module.exports.MinInstruction,
      aggregate: module.exports.AggregateInstruction.factory(aggregateFn)
    }
  });
};

module.exports.DropInstruction = instructions.DropInstruction;
module.exports.MinInstruction = instructions.MinInstruction;
module.exports.IdentityInstruction = instructions.IdentityInstruction;
module.exports.AggregateInstruction = instructions.AggregateInstruction;

module.exports.AggregateInstruction.factory = function(callback) {
  return function() {
    return new instructions.AggregateInstruction(callback);
  };
};
