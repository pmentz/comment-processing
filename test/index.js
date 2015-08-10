/*jshint mocha: true */
/*jshint expr: true */
'use strict';

var expect = require('chai').expect;
var commentProcessing = require('../index');
var DoneCriteria = require('done-criteria');
var fs = require('fs');
var path = require('path');
var Processing = require('../lib/processing');
var mkdirp = require('mkdirp');
var rimraf = require('rimraf');

describe('comment-processings', function() {
  before(function() {
    this.sampleDir = path.join(__dirname, 'resources', 'sample');
    this.expectedDir = path.join(__dirname, 'resources', 'expected');
    this.outputDir = path.join(__dirname, 'resources', 'output', 'index');

    rimraf.sync(this.outputDir);
    mkdirp.sync(this.outputDir);
  });

  it('exists', function() {
    expect(commentProcessing).to.be.ok;
  });

  it('creates a Transform with default configuration but without instructions', function(done) {
    var outputFilename = path.join(this.outputDir, 'withoutInstructions.html');
    var inputFilename = path.join(this.sampleDir, 'valid.html');
    var expectedFilename = inputFilename;

    var testee = commentProcessing();
    expect(testee).to.be.an.instanceOf(Processing);

    var writer = fs.createWriteStream(outputFilename);
    writer.on('finish', function() {
      expect(fs.readFileSync(outputFilename, 'utf-8')).to.equal(fs.readFileSync(expectedFilename, 'utf-8'));
      done();
    });
    fs.createReadStream(inputFilename).pipe(testee).pipe(writer);
  });

  it('creates a Transform with given configuration of instructions', function(done) {
    var outputFilename = path.join(this.outputDir, 'ctor_withInstructions.html');
    var inputFilename = path.join(this.sampleDir, 'valid.html');
    var expectedFilename = path.join(this.expectedDir, 'withInstructions.html');

    var testee = commentProcessing({
      instructions: {
        drop: commentProcessing.DropInstruction(),
        min: commentProcessing.MinInstruction(),
        aggregate: commentProcessing.AggregateInstruction()
      }
    });

    var writer = fs.createWriteStream(outputFilename);
    writer.on('finish', function() {
      expect(fs.readFileSync(outputFilename, 'utf-8')).to.equal(fs.readFileSync(expectedFilename, 'utf-8'));
      done();
    });
    fs.createReadStream(inputFilename).pipe(testee).pipe(writer);
  });

  it('creates a Transform with given default instruction', function(done) {
    var outputFilename = path.join(this.outputDir, 'withDefaultInstruction.html');
    var inputFilename = path.join(this.sampleDir, 'valid.html');

    var testee = commentProcessing({
      defaultInstruction: commentProcessing.DropInstruction()
    });

    var writer = fs.createWriteStream(outputFilename);
    writer.on('finish', function() {
      expect(fs.readFileSync(outputFilename, 'utf-8')).to.equal('');
      done();
    });
    fs.createReadStream(inputFilename).pipe(testee).pipe(writer);
  });

  it('creates a Transform with the given instructions using `.withInstructions`', function(done) {
    var outputFilename = path.join(this.outputDir, 'withInstructions.html');
    var inputFilename = path.join(this.sampleDir, 'valid.html');
    var expectedFilename = path.join(this.expectedDir, 'withInstructions.html');

    var testee = commentProcessing.withInstructions({
      drop: commentProcessing.DropInstruction(),
      min: commentProcessing.MinInstruction(),
      aggregate: commentProcessing.AggregateInstruction()
    });

    var writer = fs.createWriteStream(outputFilename);
    writer.on('finish', function() {
      expect(fs.readFileSync(outputFilename, 'utf-8')).to.equal(fs.readFileSync(expectedFilename, 'utf-8'));
      done();
    });
    fs.createReadStream(inputFilename).pipe(testee).pipe(writer);
  });

  it('creates a Transform with default setup when calling `.withDefaults`', function(done) {
    var outputFilename = path.join(this.outputDir, 'withDefaults.html');
    var inputFilename = path.join(this.sampleDir, 'valid.html');
    var expectedFilename = path.join(this.expectedDir, 'withInstructions.html');

    var testee = commentProcessing.withDefaults();

    var writer = fs.createWriteStream(outputFilename);
    writer.on('finish', function() {
      expect(fs.readFileSync(outputFilename, 'utf-8')).to.equal(fs.readFileSync(expectedFilename, 'utf-8'));
      done();
    });
    fs.createReadStream(inputFilename).pipe(testee).pipe(writer);
  });

  it('creates a Transform with default setup when calling `.withDefaults` with a aggregate callback', function(done) {
    var outputFilename = path.join(this.outputDir, 'withDefaults_cb.html');
    var inputFilename = path.join(this.sampleDir, 'valid.html');
    var expectedFilename = path.join(this.expectedDir, 'withInstructions.html');

    var patience = new DoneCriteria(2, done);

    var testee = commentProcessing.withDefaults(function() {
      patience.done();
    });

    var writer = fs.createWriteStream(outputFilename);
    writer.on('finish', function() {
      expect(fs.readFileSync(outputFilename, 'utf-8')).to.equal(fs.readFileSync(expectedFilename, 'utf-8'));
      patience.done();
    });
    fs.createReadStream(inputFilename).pipe(testee).pipe(writer);
  });

  it('provides a identity instruction', function() {
    expect(commentProcessing.IdentityInstruction()).to.be.a('function');
  });

  it('provides a drop instruction', function() {
    expect(commentProcessing.DropInstruction()).to.be.a('function');
  });

  it('provides an aggregation instruction', function() {
    expect(commentProcessing.AggregateInstruction()).to.be.a('function');
  });

  it('provides a min instruction', function() {
    expect(commentProcessing.MinInstruction()).to.be.a('function');
  });
});