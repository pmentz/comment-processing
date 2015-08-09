'use strict';

var stream = require('stream');
var util = require('util');

var Transform = stream.Transform;

var CommentProcessingTransform = function CommentProcessingTransform(configuration) {
  if (!configuration) {
    throw new Error('Missing configuration for comment-processing');
  }
  if (!configuration.defaultInstruction) {
    throw new Error('Missing configuration of defaultInstruction for comment-processing');
  }
  if (!(this instanceof CommentProcessingTransform)) {
    return new CommentProcessingTransform(configuration);
  }
  this.defaultInstruction = configuration.defaultInstruction();
  this.instructions = configuration.instructions || {};

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
      return current.instruction.start(line, instructionName, match[4], match.index);
    }
  } else if (scope === 'end' && current.instructionName === instructionName) {
    line = current.instruction.end(line);
    current.instructionName = null;
    current.instruction = this.defaultInstruction;
    return line;
  }
  return current.instruction.process(line);
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

module.exports = CommentProcessingTransform;
