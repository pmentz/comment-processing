'use strict';

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

module.exports = {
  IdentityInstruction: IdentityInstruction,
  DropInstruction: DropInstruction,
  MinInstruction: MinInstruction,
  AggregateInstruction: AggregateInstruction
};
