/*jshint mocha: true */
/*jshint expr: true */
'use strict';

var expect = require('chai').expect;
var testee = require('../index');
var fs = require('fs');
var path = require('path');
var rimraf = require('rimraf');

describe('comment-processings', function() {
  before(function() {
    this.sampleDir = path.join(__dirname, 'sample');
    this.expectedDir = path.join(__dirname, 'expected');
    this.outputDir = path.join(__dirname, 'output');

    rimraf.sync(this.outputDir);
    fs.mkdir(this.outputDir);
  });

  it('exists', function() {
    expect(testee).to.be.ok;
  });

  it('creates a Transform', function() {
    expect(testee()).to.be.an.instanceOf(require('stream').Transform);
  });

  it('provides a drop instruction', function() {
    expect(testee.DropInstruction()).to.be.ok;
  });

  it('provides an aggregation instruction', function() {
    expect(testee.AggregateInstruction()).to.be.ok;
  });

  it('provides a min instruction', function() {
    expect(testee.MinInstruction()).to.be.ok;
  });

  describe('transformation', function() {
    before(function() {
      // Runs before all tests in this block
    });

    after(function() {
      // Runs after all tests in this block
    });

    beforeEach(function() {
      // Runs before each test in this block
    });

    afterEach(function() {
      // Runs after each test in this block
    });

    it('does not change files with no instructions', function(done) {
      var outputFilename = path.join(this.outputDir, 'noInstructions.html');
      var inputFilename = path.join(this.sampleDir, 'valid.html');

      var writer = fs.createWriteStream(outputFilename);
      writer.on('finish', function() {
        expect(fs.readFileSync(outputFilename, 'utf-8')).to.equal(fs.readFileSync(inputFilename, 'utf-8'));
        done();
      });
      fs.createReadStream(inputFilename).pipe(testee()).pipe(writer);
    });

    it('removes lines with drop instruction', function(done) {
      var outputFilename = path.join(this.outputDir, 'dropInstruction.html');
      var inputFilename = path.join(this.sampleDir, 'valid.html');
      var expectedFilename = path.join(this.expectedDir, 'dropInstruction.html');

      var writer = fs.createWriteStream(outputFilename);
      writer.on('finish', function() {
        expect(fs.readFileSync(outputFilename, 'utf-8')).to.equal(fs.readFileSync(expectedFilename, 'utf-8'));
        done();
      });
      fs.createReadStream(inputFilename).pipe(testee({drop: testee.DropInstruction()})).pipe(writer);
    });

    it('use min-suffixes with min instruction', function(done) {
      var outputFilename = path.join(this.outputDir, 'minInstruction.html');
      var inputFilename = path.join(this.sampleDir, 'valid.html');
      var expectedFilename = path.join(this.expectedDir, 'minInstruction.html');

      var writer = fs.createWriteStream(outputFilename);
      writer.on('finish', function() {
        expect(fs.readFileSync(outputFilename, 'utf-8')).to.equal(fs.readFileSync(expectedFilename, 'utf-8'));
        done();
      });
      fs.createReadStream(inputFilename).pipe(testee({min: testee.MinInstruction()})).pipe(writer);
    });

    it('aggregates files and references them with aggregate instruction', function(done) {
      var outputFilename = path.join(this.outputDir, 'aggregateInstruction.html');
      var inputFilename = path.join(this.sampleDir, 'valid.html');
      var expectedFilename = path.join(this.expectedDir, 'aggregateInstruction.html');

      var doneCount = 2;
      var finished = function() {
        if (--doneCount === 0) {
          done();
        }
      };

      var writer = fs.createWriteStream(outputFilename);
      writer.on('finish', function() {
        expect(fs.readFileSync(outputFilename, 'utf-8')).to.equal(fs.readFileSync(expectedFilename, 'utf-8'));
        finished();
      });
      fs.createReadStream(inputFilename).pipe(testee({aggregate: testee.AggregateInstruction(function(files) {
        expect(files).to.deep.equal(['script/one.js', 'script/two.js']);
        finished();
      })})).pipe(writer);
    });

    it('handles the absence of a callback for the aggregate instruction', function(done) {
      var outputFilename = path.join(this.outputDir, 'aggregateInstruction_noCallback.html');
      var inputFilename = path.join(this.sampleDir, 'valid.html');

      var writer = fs.createWriteStream(outputFilename);
      writer.on('finish', function() {
        done();
      });
      fs.createReadStream(inputFilename).pipe(testee({aggregate: testee.AggregateInstruction()})).pipe(writer);
    });

    it('applies multiple instructions', function(done) {
      var outputFilename = path.join(this.outputDir, 'multipleInstructions.html');
      var inputFilename = path.join(this.sampleDir, 'valid.html');
      var expectedFilename = path.join(this.expectedDir, 'multipleInstructions.html');

      var writer = fs.createWriteStream(outputFilename);
      writer.on('finish', function() {
        expect(fs.readFileSync(outputFilename, 'utf-8')).to.equal(fs.readFileSync(expectedFilename, 'utf-8'));
        done();
      });
      fs.createReadStream(inputFilename).pipe(testee({drop: testee.DropInstruction(),
                                                       min: testee.MinInstruction(),
                                                 aggregate: testee.AggregateInstruction()})).pipe(writer);
    });
  });
});
