/*jshint mocha: true */
/*jshint expr: true */
'use strict';

var expect = require('chai').expect;
var Processing = require('../../lib/processing');
var instructions = require('../../lib/instructions');
var fs = require('fs');
var mkdirp = require('mkdirp');
var path = require('path');
var rimraf = require('rimraf');
var stream = require('stream');

describe('processing', function() {
  before(function() {
    this.sampleDir = path.join(__dirname, '..', 'resources', 'sample');
    this.expectedDir = path.join(__dirname, '..', 'resources', 'expected');
    this.outputDir = path.join(__dirname, '..', 'resources', 'output', 'processing');

    rimraf.sync(this.outputDir);
    mkdirp.sync(this.outputDir);
  });

  it('is a Transform', function() {
    expect(new Processing({defaultInstruction: instructions.IdentityInstruction}))
        .to.be.an.instanceOf(stream.Transform);
  });

  it('handles Ctor used as factory', function() {
    /* jshint newcap: false */
    expect(Processing({defaultInstruction: instructions.IdentityInstruction})).to.be.an.instanceOf(stream.Transform);
  });

  it('fails with no configuration', function() {
    expect(function() {new Processing();}).to.throw('Missing configuration for comment-processing');
  });

  it('fails with no default instruction', function() {
    expect(function() {new Processing({});})
        .to.throw('Missing configuration of defaultInstruction for comment-processing');
  });

  it('runs without instructions', function(done) {
    var outputFilename = path.join(this.outputDir, 'withoutInstructions.html');
    var inputFilename = path.join(this.sampleDir, 'valid.html');
    var expectedFilename = inputFilename;

    var testee = new Processing({defaultInstruction: instructions.IdentityInstruction});

    var writer = fs.createWriteStream(outputFilename);
    writer.on('finish', function() {
      expect(fs.readFileSync(outputFilename, 'utf-8')).to.equal(fs.readFileSync(expectedFilename, 'utf-8'));
      done();
    });
    fs.createReadStream(inputFilename).pipe(testee).pipe(writer);
  });

  it('uses the configured instructions', function(done) {
    var outputFilename = path.join(this.outputDir, 'withInstructions.html');
    var inputFilename = path.join(this.sampleDir, 'valid.html');
    var expectedFilename = path.join(this.expectedDir, 'withInstructions.html');

    var testee = new Processing({defaultInstruction: instructions.IdentityInstruction,
                                       instructions: {drop: instructions.DropInstruction,
                                                       min: instructions.MinInstruction,
                                                 aggregate: instructions.AggregateInstruction}});

    var writer = fs.createWriteStream(outputFilename);
    writer.on('finish', function() {
      expect(fs.readFileSync(outputFilename, 'utf-8')).to.equal(fs.readFileSync(expectedFilename, 'utf-8'));
      done();
    });
    fs.createReadStream(inputFilename).pipe(testee).pipe(writer);
  });
});

