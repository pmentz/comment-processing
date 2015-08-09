'use strict';

var stream = require('stream');
var util = require('util');

var IdentityInstruction = function IdentityInstruction() {
  if (!(this instanceof IdentityInstruction)) {
    return new IdentityInstruction();
  }
};
IdentityInstruction.prototype.start = function(line, name, arg, index) {
  return line;
};
IdentityInstruction.prototype.process = function(line) {
  return line;
};
IdentityInstruction.prototype.end = function(line) {
  return line;
};

var DropInstruction = function DropInstruction() {
  if (!(this instanceof DropInstruction)) {
    return new DropInstruction();
  }
};
util.inherits(DropInstruction, IdentityInstruction);
DropInstruction.prototype.start = function(line) {
  return null;
};
DropInstruction.prototype.process = function(line) {
  return null;
};
DropInstruction.prototype.end = function(line) {
  return null;
};

var MinInstruction = function MinInstruction() {
  if (!(this instanceof MinInstruction)) {
    return new MinInstruction();
  }
  this.jsPattern = /(<script[^>]+src="[^"]+)(\.js")/ig;
  this.cssPattern = /(<link[^>]+href="[^"]+)(\.css")/ig;
};
util.inherits(MinInstruction, DropInstruction);
MinInstruction.prototype.process = function(line) {
  return line.replace(this.jsPattern, function(match, beforeMin, afterMin) {
    return beforeMin + '.min' + afterMin;
  }).replace(this.cssPattern, function(match, beforeMin, afterMin) {
    return beforeMin + '.min' + afterMin;
  });
};

var AggregateInstruction = function AggregateInstruction(callback) {
  if (!(this instanceof AggregateInstruction)) {
    return new AggregateInstruction();
  }
  this.jsPattern = /<script[^>]+src="([^"]+)"/i;
  this.callback = callback;
};
util.inherits(AggregateInstruction, DropInstruction);
AggregateInstruction.prototype.start = function(line, name, arg, index) {
  this.sourceFiles = [];
  this.targetFile = arg;
  this.indent = index + 1;
  return null;
};
AggregateInstruction.prototype.process = function(line) {
  var match = null;
  if ((match = this.jsPattern.exec(line))) {
    this.sourceFiles.push(match[1]);
  }
  return null;
};
AggregateInstruction.prototype.end = function(line) {
  if (this.callback) {
    this.callback(this.sourceFiles, this.targetFile);
  }
  return new Array(this.indent).join(' ') + '<script src="' + this.targetFile + '"></script>';
};

var Transform = stream.Transform;

var CommentProcessingTransform = function CommentProcessingTransform(options) {
  this.defaultInstruction = new IdentityInstruction();
  this.instructions = options || {};

  Transform.call(this);
};
util.inherits(CommentProcessingTransform, Transform);

CommentProcessingTransform.prototype.__HTML_COMMENT = /<!-- *([^: >]+):([^ >]+) *( ([^ -]+))? *-->/;

CommentProcessingTransform.prototype.__handleComment = function(line, current, match) {
  var instructionName = match[1];
  var scope = match[2];

  if (scope === 'start') {
    var newInstruction = this.instructions[instructionName];
    if (newInstruction) {
      current.instructionName = instructionName;
      current.instruction = newInstruction();
      line = current.instruction.start(line, instructionName, match[4], match.index);
    }
  } else if (scope === 'end' && current.instructionName === instructionName) {
    line = current.instruction.end(line);
    current.instructionName = null;
    current.instruction = this.defaultInstruction;
  }
  return line;
};

CommentProcessingTransform.prototype._transform = function(chunk, enc, done) {
  var lines = chunk.toString().split('\n');

  var current = {
    instructionName: null,
    instruction: this.defaultInstruction
  };

  var newLine = '\n';
  var match = null;
  for (var index = 0, size = lines.length, line = null; index < size; index++) {
    line = lines[index];
    if ((match = this.__HTML_COMMENT.exec(line))) {
      line = this.__handleComment(line, current, match);
    } else {
      line = current.instruction.process(line);
    }

    if (index === lines.length - 1) {
      newLine = '';
    }
    if (line !== null) {
      this.push(line + newLine, 'utf8');
    }
  }
  done();
};

module.exports = function(config) {
  return new CommentProcessingTransform(config);
};
module.exports.DropInstruction = function() {
  return DropInstruction;
};
module.exports.MinInstruction = function() {
  return MinInstruction;
};
module.exports.AggregateInstruction = function(callback) {
  return function() {
    return new AggregateInstruction(callback);
  };
};
