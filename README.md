[![Build Status](https://travis-ci.org/pmentz/comment-processing.svg)](https://travis-ci.org/pmentz/comment-processing) [![Dependency Status](https://david-dm.org/pmentz/comment-processing.svg)](https://david-dm.org/pmentz/comment-processing) [![devDependency Status](https://david-dm.org/pmentz/comment-processing/dev-status.svg)](https://david-dm.org/pmentz/comment-processing#info=devDependencies)

# comment-processing
Node module that transforms HTML/XML comments into processing instructions

## Abstract

Use HTML start- and end-comments for processing files during Node transforms. G.e. to remove parts that are only
required for development.

    <!-- drop:start -->
    <script src="livereload.js"></script>
    <!-- drop:end -->

Instructions *(like drop in this case)* are customizable.

## Installation

* You need to have [npm][npm] installed.  
* Use 
    * `npm install comment-processings` to retrieve the module or 
    * `npm install comment-processings -S` to save the dependency to your package.json.

## Description

Comment processings are added to HTML (or XML) using comments. One comments marks the start of a block, another comment
marks the end. You can provide processing instructions for the handling of the code in between those comments.

    <!-- processing:start -->
    .. some markup ..
    <!-- processing:end -->

You can provide further configuration for a processing, therefore you can add additional input to the start instruction.

    <!-- generate-file:start desired/filename.svg -->
    .. some markup ..
    <!-- generate-file:end -->

Be aware, that only one additional argument is allowed and it must not have whitespaces. You can provide multiple 
arguments, by using a separator, but not whitespaces.

    <!-- processing:start arg1,arg2,arg3 -->
    .. some markup ..
    <!-- processing:end -->

This module uses regular expressions to evaluate the content, to be able to output the file (except modified lines) as 
they where in first place. Using a parser and building an internal model would probably generate output that is
formatted differently or normalized. This is the reason why **you should place the instruction comments always on 
separate lines**.

    <!-- good:start -->
    .. some markup
    <!-- good:end -->

while

    <!-- bad:start --> .. some markup <!-- bad:end -->


## API

### commentProcessing([config])

Create a `stream.Transform` instance for transforming the input with `config` being an object registering processings
under a name.

    var commentProcessing = require('comment-processing');
    var fs = require('fs');

    var config = {drop: commentProcessing.DropInstruction()};

    fs.createReadStream(inputFilename)
      .pipe(commentProcessing(config))
      .pipe(fs.createWriteStream(outputFilename));

This example will parse for comments with the name drop (drop:start and drop:end) and will remove all between them
(including the comments itselfs). See below for provided instructions.

### commentProcessing.DropInstruction()

Returns an instance of an instruction that deletes the start and end comment, as well as everything in between.

### commentProcessing.MinInstruction()

Returns an instance of an instruction, that adds a .min to all references Javascript and CSS files in between.

    <!-- add-min:start -->
    <script src="components/bootstrap.js"></script>
    <link href="components/bootstrap.css">
    <!-- add-min:end -->

will be converted to 

    <script src="components/bootstrap.min.js"></script>
    <link href="components/bootstrap.min.css">

Note, that the comments themself are removed and only the filenames are adjusted. You can add any other attribute to the
tags and they will will stay untouched. Any line being a script src or link href will also stay be kept as they are.

### commentProcessing.AggregateInstruction([callback])

Returns an instance of an instruction which collects all script references in between. Therefore an alternate filename
has to be provided which will be used instead. This can be used to call a 3rd party module like uglify to concat all
files.

    <!-- concat:start script/application.js -->
    <script src="script/application.module.js"></script>
    <script src="script/application.controllers.js"></script>
    <script src="script/application.directives.js"></script>
    <!-- concat:end -->

will be converted to

    <script src="script/application.js"></script>

Before, when creating the aggregation instruction instance, you can define a callback to be called with the list of
files collected.

    commentProcessing.AggregateInstruction(function(files) {
      // do something with files, e.g. uglify
    }

Files will be an array containing the filenames. In this example it will look like

    ['script/application.module.js',
     'script/application.controllers.js',
     'script/application.directives.js']

## License

MIT

[npm]:http://npmjs.org/