[![Build Status](https://travis-ci.org/pmentz/comment-processing.svg)](https://travis-ci.org/pmentz/comment-processing) [![Coverage Status](https://coveralls.io/repos/pmentz/comment-processing/badge.svg?service=github&branch=master)](https://coveralls.io/github/pmentz/comment-processing?branch=master)
[![Dependency Status](https://david-dm.org/pmentz/comment-processing.svg)](https://david-dm.org/pmentz/comment-processing) [![devDependency Status](https://david-dm.org/pmentz/comment-processing/dev-status.svg)](https://david-dm.org/pmentz/comment-processing#info=devDependencies)

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

## API

### commentProcessing([config])

Create a `stream.Transform` instance for transforming the input with `config` being an object registering processings
under a name.

```javascript
var commentProcessing = require('comment-processing');
var fs = require('fs');

var config = {instructions: {drop: commentProcessing.DropInstruction()}};

fs.createReadStream(inputFilename)
  .pipe(commentProcessing(config))
  .pipe(fs.createWriteStream(outputFilename));
```

This example will parse for comments with the name drop (drop:start and drop:end) and will remove all between them
(including the comments itselfs). See below for provided instructions.

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
commentProcessing.AggregateInstruction(function(sourceFiles, targetFile) {
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

commentProcessings.AggregateInstruction(function(sourceFiles, targetFile) {
  var uglified = uglify.minify(sourceFiles);
  mkdir(path.dirname(targetFile)).then(function() {
    fs.writeFile(targetFile, uglified.code);
  })
});
```

## License

MIT

[npm]:http://npmjs.org/