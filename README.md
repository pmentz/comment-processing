[![Build Status](https://travis-ci.org/pmentz/comment-processing.svg?branch=master)](https://travis-ci.org/pmentz/comment-processing) [![Coverage Status](https://coveralls.io/repos/pmentz/comment-processing/badge.svg?service=github&branch=master)](https://coveralls.io/github/pmentz/comment-processing?branch=master) [![Dependency Status](https://david-dm.org/pmentz/comment-processing.svg)](https://david-dm.org/pmentz/comment-processing) [![devDependency Status](https://david-dm.org/pmentz/comment-processing/dev-status.svg)](https://david-dm.org/pmentz/comment-processing#info=devDependencies) [![experimental][experimental-img]][stability-url]

# comment-processing
Node module that transforms HTML/XML comments into processing instructions

## Abstract

Use HTML start- and end-comments for processing files during Node transforms. G.e. to remove parts that are only
required for development.

```html
<!-- drop:start -->
<script src="livereload.js"></script>
<!-- drop:end -->
```

Instructions *(like drop in this case)* are customizable.

## Installation

* You need to have [npm][npm] installed.  
* Use 
    * `npm install comment-processings` to retrieve the module or 
    * `npm install comment-processings -S` to save the dependency to your package.json.
* *If you want to use the `transformFile` method and are using Node <= v0.10.0 you will need a
[Promise polyfill][es6-promise]*

## Description

Comment processings are added to HTML (or XML) using comments. One comments marks the start of a block, another comment
marks the end. You can provide processing instructions for the handling of the code in between those comments.

```html
<!-- processing:start -->
.. some markup ..
<!-- processing:end -->
```

You can provide further configuration for a processing, therefore you can add additional input to the start instruction.

```html
<!-- generate-file:start desired/filename.svg -->
.. some markup ..
<!-- generate-file:end -->
```

Be aware, that only one additional argument is allowed and it must not have whitespaces. You can provide multiple 
arguments, by using a separator, but not whitespaces.

```html
<!-- processing:start arg1,arg2,arg3 -->
.. some markup ..
<!-- processing:end -->
```

This module uses regular expressions to evaluate the content, to be able to output the file (except modified lines) as 
they where in first place. Using a parser and building an internal model would probably generate output that is
formatted differently or normalized. This is the reason why **you should place the instruction comments always on 
separate lines**.

```html
<!-- good:start -->
.. some markup
<!-- good:end -->
```

while

```html
<!-- bad:start --> .. some markup <!-- bad:end -->
```

## Examples

tbd

## API

* Creating a `stream.Transform`
  * commentProcessing(*[config]* )
  * commentProcessing.withInstructions(instructions)
  * commentProcessing.withDefaults(*[aggregateFn]*)
* Transform methods
  * transform.addInstruction(name, instruction)
  * transform.addInstructions(instructions)
  * transform.setInstructions(instructions)
  * transform.clearInstructions()
  * transform.removeInstruction(name)
  * transform.transformFile(inputFile, outputFile)
* Instructions
  * commentProcessing.IdentityInstruction()
  * commentProcessing.DropInstruction()
  * commentProcessing.MinInstruction()
  * commentProcessing.AggregateInstruction(*[callback]*)
    * commentProcessing.AggregateInstruction.factory(*[callback]*)
* Instruction interface
  * instruction.start(line, name, arg, index)
  * instruction.process(line)
  * instruction.end(line)

### commentProcessing([config])

Create a `stream.Transform` instance for transforming the input with `config` being an object registering processings
under a name.

```javascript
var commentProcessing = require('comment-processing');
var fs = require('fs');

var config = {instructions: {drop: commentProcessing.DropInstruction}};

fs.createReadStream(inputFilename)
  .pipe(commentProcessing(config))
  .pipe(fs.createWriteStream(outputFilename));
```

This example will parse for comments with the name drop (drop:start and drop:end) and will remove all between them
(including the comments itselfs). See below for provided instructions.

### commentProcessing.withInstructions(instructions)

Shortcut for `commentProcessing([config])`. Create a `stream.Transform` instance with a default configuration and the
usage of the instructions given.

```javascript
var commentProcessing = require('comment-processing');
var fs = require('fs');

fs.createReadStream(inputFilename)
  .pipe(commentProcessing.withInstructions({drop: commentProcessing.DropInstruction}))
  .pipe(fs.createWriteStream(outputFilename));
```

### commentProcessing.withDefaults([aggregateFn])

Shortcut for `commentProcessing([config])`. Create a `stream.Transform` instance with a default configuration and the
usage of all default instructions available with the following configuration:

* **drop**: DropInstruction
* **min**: MinInstruction
* **aggregate**: AggregateInstruction

```javascript
var commentProcessing = require('comment-processing');
var fs = require('fs');

fs.createReadStream(inputFilename)
  .pipe(commentProcessing.withDefaults(function(sourceFiles, targetFile) {
    // handle aggregate
  })).pipe(fs.createWriteStream(outputFilename));
```

### transform.addInstruction(name, instruction)

Adds another instruction to the transforms registry.

```javascript
var commentProcessing = require('comment-processing');
var processing = commentProcessing.withInstructions({drop: commentProcessing.DropInstruction});
processing.addInstruction('add-min', commentProcessing.MinInstruction);
```

In this case, the transform will handle *drop* and *add-min*.

### transform.addInstructions(instructions)

Adds more instructions to the transform.

```javascript
var commentProcessing = require('comment-processing');
var processing = commentProcessing.withInstructions({delete: commentProcessing.DropInstruction});
processing.addInstructions({drop: commentProcessing.DropInstruction, 
                            min: commentProcessing.MinInstruction});
```

In this case, the transform will handle *drop*, *min* and *delete*.

### transform.setInstructions(instructions)

Sets instructions to the transform. Previously configured instructions will be removed.

```javascript
var commentProcessing = require('comment-processing');
var processing = commentProcessing.withInstructions({delete: commentProcessing.DropInstruction});
processing.addInstructions({drop: commentProcessing.DropInstruction, 
                             min: commentProcessing.MinInstruction});
```

In this case, the transform will handle *drop* and *min*, but **not** *delete*.

### transform.clearInstructions()

Will remove all instructions from the transform.

### transform.removeInstruction(name)

Will remove the instruction with the given name. The removed instruction will be returned. If no instruction with the
given name was able, nothing happens.

### transform.transformFile(inputFile, outputFile)

Will read the given `inputFile`, process it and write it to the given `outputFile`. The method returns a promise, which
can be used to handle the file creation.

```javascript
var commentProcessing = require('comment-processing');

var processing = commentProcessing.withDefaults();
processing.transformFile('src/index.html', 'dist/index.html').then(function() {
  console.log('Finished transformation');
});
```

**This module does not provide any promise polyfill**. So it's up to you to decide which one to use e.g.
[es6-promise][].

### commentProcessing.DropInstruction()

Returns a factory method of an instruction that deletes the start and end comment, as well as everything in between.

### commentProcessing.MinInstruction()

Returns a factory method of an instruction, that adds a .min to all references Javascript and CSS files in between.

```html
<!-- add-min:start -->
<script src="components/bootstrap.js"></script>
<link href="components/bootstrap.css">
<!-- add-min:end -->
```

will be converted to 

```html
<script src="components/bootstrap.min.js"></script>
<link href="components/bootstrap.min.css">
```

Note, that the comments themself are removed and only the filenames are adjusted. You can add any other attribute to the
tags and they will will stay untouched. Any line being a script src or link href will also stay be kept as they are.

### commentProcessing.AggregateInstruction([callback])

Returns a factory method of an instruction which collects all script references in between. Therefore an alternate
filename has to be provided which will be used instead. This can be used to call a 3rd party module like uglify to
concat all files.

```html
<!-- concat:start script/application.js -->
<script src="script/application.module.js"></script>
<script src="script/application.controllers.js"></script>
<script src="script/application.directives.js"></script>
<!-- concat:end -->
```

will be converted to

```html
<script src="script/application.js"></script>
```

Before, when creating the aggregation instruction instance, you can define a callback to be called with the list of
files collected.

```javascript
commentProcessing.AggregateInstruction.factory(function(sourceFiles, targetFile) {
  // do something with sourceFiles, e.g. uglify
}
```

sourceFiles will be an array containing the filenames. In this example it will look like

```javascript
['script/application.module.js',
 'script/application.controllers.js',
 'script/application.directives.js']
 ```

You find an example implemtation for uglifying the files below. Keep in mind that it completely dismisses error
handling.

```javascript
var commentProcessings = require('commentProcessings');
var fs = require('fs');
var mkdir = require('mkdirp-promise');
var path = require('path');
var uglify = require('uglify-js')

commentProcessings.AggregateInstruction.factory(function(sourceFiles, targetFile) {
  var uglified = uglify.minify(sourceFiles);
  mkdir(path.dirname(targetFile)).then(function() {
    fs.writeFile(targetFile, uglified.code);
  })
});
```
#### commentProcessing.AggregateInstruction.factory(*[callback]*)

Creates a factory for AggregateInstructions. As the configuration of a processing needs a method to create instances of
the instructions and the AggregateInstruction may need a callback which should be uses when the instance is created, 
this method returns a function that will create well configured objects.

```javascript
var myProcessing = commentProcessing();
myProcessing.addInstruction('concat', 
    commentProcessing.AggregateInstruction.factory(function(sourceFiles, targetFile) {
      // concat the files
    });
```

### instruction.start(line, name, arg, index)

tbd

### instruction.process(line)

tbd

### instruction.end(line)

tbd

## License

MIT

[npm]:http://npmjs.org/

[experimental-img]: https://img.shields.io/badge/stability-1%20--%20experimental-orange.svg?style=flat-round
[stability-url]: https://iojs.org/api/documentation.html#documentation_stability_index
[es6-promise]: https://www.npmjs.com/package/es6-promise