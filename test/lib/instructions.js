/*jshint mocha: true */
/*jshint expr: true */
'use strict';

var expect = require('chai').expect;
var instructions = require('../../lib/instructions');

describe('instructions', function() {
  before(function() {
    this.testee = instructions;
  });
  it('has DropInstruction', function() {
    expect(this.testee.DropInstruction).to.be.ok;
  });
  it('has MinInstruction', function() {
    expect(this.testee.MinInstruction).to.be.ok;
  });
  it('has IdentityInstruction', function() {
    expect(this.testee.IdentityInstruction).to.be.ok;
  });
  it('has AggregateInstruction', function() {
    expect(this.testee.AggregateInstruction).to.be.ok;
  });
  describe('IdentityInstruction', function() {
    before(function() {
      this.testee = new instructions.IdentityInstruction();
    });
    it('handles Ctor used as factory', function() {
      expect(instructions.IdentityInstruction()).to.be.an.instanceof(instructions.IdentityInstruction);
    });
    it('returns the input on start', function() {
      expect(this.testee.start('Start line')).to.equal('Start line');
    });
    it('returns the input on process', function() {
      expect(this.testee.process('Some line')).to.equal('Some line');
    });
    it('returns the input on end', function() {
      expect(this.testee.end('End line')).to.equal('End line');
    });
  });
  describe('DropInstruction', function() {
    before(function() {
      this.testee = new instructions.DropInstruction();
    });
    it('handles Ctor used as factory', function() {
      expect(instructions.DropInstruction()).to.be.an.instanceof(instructions.DropInstruction);
    });
    it('returns null on start', function() {
      expect(this.testee.start('Start line')).to.be.null;
    });
    it('returns null on process', function() {
      expect(this.testee.process('Some line')).to.be.null;
    });
    it('returns null on end', function() {
      expect(this.testee.end('End line')).to.be.null;
    });
  });
  describe('MinInstruction', function() {
    before(function() {
      this.testee = new instructions.MinInstruction();
    });
    it('handles Ctor used as factory', function() {
      expect(instructions.MinInstruction()).to.be.an.instanceof(instructions.MinInstruction);
    });
    it('returns null on start', function() {
      expect(this.testee.start('Start line')).to.be.null;
    });
    it('adds .min for scripts', function() {
      expect(this.testee.process('  <script src="foo/bar.js"></script>'))
                       .to.equal('  <script src="foo/bar.min.js"></script>');
    });
    it('adds .min for links', function() {
      expect(this.testee.process('<link rel="stylesheet" href="foo/bar.css">'))
                       .to.equal('<link rel="stylesheet" href="foo/bar.min.css">');
    });
    it('does not change others', function() {
      expect(this.testee.process('<script>console.log(\'foo/bar.js\');</script>'))
                       .to.equal('<script>console.log(\'foo/bar.js\');</script>');
    });
    it('returns null on end', function() {
      expect(this.testee.end('End line')).to.be.null;
    });
  });
  describe('AggregateInstruction', function() {
    before(function() {
      this.testee = new instructions.AggregateInstruction();
    });
    it('handles Ctor used as factory', function() {
      expect(instructions.AggregateInstruction()).to.be.an.instanceof(instructions.AggregateInstruction);
    });
    it('returns null on start', function() {
      expect(this.testee.start('Start line')).to.be.null;
    });
    it('returns null on process', function() {
      expect(this.testee.process('<script src="foo/bar.js"></script>')).to.be.null;
    });
    it('returns the arg name on end', function() {
      this.testee.start(null, null, 'foobar.js', 3);
      expect(this.testee.end('end line')).to.equal('   <script src="foobar.js"></script>');
    });
    it('calls the callback function on end', function(done) {
      this.testee = new instructions.AggregateInstruction(function(sourceFiles, targetFile) {
        expect(sourceFiles).to.deep.equal(['foo/bar.js', 'bar/foo.js']);
        expect(targetFile).to.equal('foobar.js');
        done();
      });
      this.testee.start(null, null, 'foobar.js', 2);
      this.testee.process('  <script src="foo/bar.js"></script>');
      this.testee.process('yada');
      this.testee.process('<script src="bar/foo.js"></script>');
      this.testee.end('end line');
    });
  });
});
