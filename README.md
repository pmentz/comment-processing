[![Build Status][buildstatus-img]][buildstatus-url] [![Coverage Status][coverage-img]][coverage-url] [![Dependency Status][dependency-img]][dependency-url] [![devDependency Status][devDependency-img]][devDependency-url] [![stable][stable-img]][stability-url]  
[![NPM][nodei-img]][nodei-url]

# comment-processing
Node module that transforms HTML/XML comments into processing instructions.

## Installation

* You need to have [npm][npm] installed.  
* Use 
    * `npm install comment-processing` to retrieve the module or 
    * `npm install comment-processing -S` to save the dependency to your package.json.
* *If you want to use the `transformFile` method and are using Node <= v0.10.0 you will need a
[Promise polyfill][es6-promise]*

## Guide
### Use comment-processing

I recognized common tasks to transform my development stage *index.html* into productive ones:
The first one is to simply remove parts of the markup, like the livereload script for example.  
Another one is to switch to the minimized versions of 3rd party scripts. In most cases this simply means to add a *.min*
extension to the javascript and css files. The last one is to collect all my javascript resources and then concat and 
minimize them into a single file.

This is why I wrote this module to do those transformations, it is possible to mark section with start- and end-comments
to trigger processing instructions. I got some prepared in this module, but basically the processing is extendable and
customizable.

So this is would be an *index.html* file during development:

```html
<!DOCTYPE html>
<html>
  <head>
    <script src="livereload.js"></script>

    <script src="components/foo.js"></script>
    <script src="components/bar.js"></script>
    <link rel="stylesheet" href="components/fb.css">
  </head>
  
  <body>

    <script src="script/one.js"></script>
    <script src="script/two.js"></script>
  </body>
</html>
```

while my productive one should look like:

```html
<!DOCTYPE html>
<html>
  <head>
    <script src="components/foo.min.js"></script>
    <script src="components/bar.min.js"></script>
    <link rel="stylesheet" href="components/fb.min.css">
  </head>
  
  <body>

    <script src="application.min.js"</script>
  </body>
</html>
```

First of all, I need to mark the relevant blocks for the instructions.

```html
<!DOCTYPE html>
<html>
  <head>
    <!-- drop:start -->
    <script src="livereload.js"></script>
    <!-- drop:end -->
    <!-- min:start -->
    <script src="components/foo.js"></script>
    <script src="components/bar.js"></script>
    <link rel="stylesheet" href="components/fb.css">
    <!-- min:end -->
  </head>
  
  <body>

    <!-- aggregate:start application.min.js -->
    <script src="script/one.js"></script>
    <script src="script/two.js"></script>
    <!-- aggregate:end -->
  </body>
</html>
```

I think it's pretty clear, how to mark the blocks. You will recognize one speciality in the *aggregate:start* comment,
because it also defines an additional argument for the aggregate instruction, the name of the file to generate.

So I have to do a transformation somehow, this is where comment-processing comes into play.

```javascript
var commentProcessing = require('comment-processing');
var fs = require('fs');

var processing = commentProcessing();

fs.createReadStream('src/index.html')
  .pipe(processing)
  .pipe(fs.createWriteStream('dist/index.html'));
```

This will read your source index file, transform it and write it out into our distribution index file. But the file
will look exactly the same than the index file, we have to do some configurations:

```javascript
var processing = commentProcessing();
processing.addInstruction('drop', commentProcessing.DropInstruction);
processing.addInstruction('min', commentProcessing.MinInstruction);
```

This will capture the first two cases. The DropInstruction will simply remove lines, the MinInstruction will add the
*.min* extension to javascript and css files. They are registered under a name, which means, that you can use custom 
names for the instructions. The second parameter is the actual instruction, this is a function, that will create an
instance.  
The AggregateInstruction is more complex, because it needs a callback that defines what to do with the files collected.
So the instruction itself only collects the names and writes a reference to the configured file, but it does not do any
thing with the files. **But hold on**, there are solutions on the way, but let's do it step-by-step. Let's configure our
aggregate:

```javascript
var fs = require('fs');
var mkdir = require('mkdirp-promise');
var path = require('path');
var uglify = require('uglify-js')

var processing = commentProcessing();
processing.addInstruction('aggregate',
    commentProcessing.AggregateInstruction.factory(function(sourceFiles, targetFile) {
      var uglified = uglify.minify(sourceFiles);
      mkdir(path.dirname(targetFile)).then(function() {
        fs.writeFile(targetFile, uglified.code);
      })
    }));
```

You see some additional dependencies we need for this one. Actually this is the reason why I did not provide thisinstruction in the first place, because the module would have dependency, which you may not need. But the instruction is available [as a separate module][uglify-instruction].

So let's put this all together:

```javascript
var commentProcessing = require('comment-processing');
var fs = require('fs');

var processing = commentProcessing.withInstructions({
  drop: commentProcessing.DropInstruction,
  min: commentProcessing.MinInstruction,
  aggregate: commentProcessing.AggregateInstruction.factory(function(soureFiles, targetFile) {
    ...
  })
});

fs.createReadStream('src/index.html')
  .pipe(processing)
  .pipe(fs.createWriteStream('dist/index.html'));
```

I think good defaults are important, this is why we can ease this up. First thing is the configuration of the
instructions: If you want to get all the instructions without the names reconfigured, there is a method for that:

```javascript
var processing = commentProcessing.withDefaults(function(sourceFiles, targetFile) {
  ...
})
```

So all you need is to define the callback, but you can also leave it out, if you don't use this instruction at all.

As the processing is a `stream.Transform`, it can be piped into streams, but if you simply want to create the index
file, you can use another shortcut:

```javascript
processing.transformFile('src/index.html', 'dist/index.html');
```

This method will return a Promise. Make sure your runtime does provide it, which means you should be using Node > v0.10
or you need a polyfill of your trust. If you got none, try [es6-promise][].

So to put it together:

```javascript
var commentProcessing = require('comment-processing');

commentProcessing.withDefaults(function(sourceFiles, targetFile) {
  ...
}).transformFile('src/index.html', 'dist/index.html');
```

### Tips

You can use the callback of the AggregateInstruction for a lot of stuff, but you can also just ignore this features and use it as a replace instruction.

```html
<!-- replace:start script/config.prod.js -->
<script src="script/config.dev.js"></script>
<!-- replace:end -->
```

```javascript
processing.addInstruction('replace', commentProcessing.AggregateInstruction);
```

### Write custom instruction

So this module provides some instructions and more instructions may available in separate modules. But sooner or later you will have the need for an instruction that is not available yet and that's the point where you want to implement one on your own.

The signature if instructions is quite simple, you have to provide an object with 3 methods and a function that creates such an object. One of the many ways to do so in Javascript is to create a constructor and implement its prototype.

So let's take the default example something, that turns everything into uppercase, whyever.

```html
<!-- upper:start -->
<p>Hello World</p>
<!-- upper:end -->
```

should be transformed into

```html
<P>HELLO WORLD</P>
```

to implement this, we could simply do the following

```javascript
var UpperInstruction = function UpperInstruction() {
  if (!(this instanceof UpperInstruction)) {
    return new UpperInstruction();
  }
};
UpperInstruction.prototype.start = function(line, name, arg, index) {
  return null;
};
UpperInstruction.prototype.process = function(line) {
  return line.toLowercase();
};
UpperInstruction.prototype.end = function(line) {
  return null;
};
```

The first one is the constructor, which can be used with `new` or as a function. Then there is the `start` method which is called with the contents of the start-comment, while end will be called with the contents of the end-comment. The process method will be called with every single line in between those two.

The purpose of the methods is to do what ever they need to do to do their business and to return what should be rendered into the outcome. If you return null, this line will be skipped.  
So in this case, we will skip the start- and end-comments and will do an uppercase on the lines in between.

There is already an instruction that is dropping code, it's the DropInstruction, extending this one, will reduce the code we have to write.

```javascript
var commentProcessing = require('comment-processing');
var util = require('util');

var UpperInstruction = function UpperInstruction() {
  if (!(this instanceof UpperInstruction)) {
    return new UpperInstruction();
  }
};
util.inherits(UpperInstruction, commentProcessing.DropInstruction);
UpperInstruction.prototype.process = function(line) {
  return line.toLowercase();
};
```

Finally we can register our custom instruction as any other instruction:

```javascript
var commentProcessing = require('comment-processing');

var processing = commentProcessing();
processing.addInstruction('upper', UpperInstruction);
```

Congrats, that is the basics. For more information, refer to the [instruction's API](#api).

## Design Decisions
### Dependencies
This module is implemented to be the basics of the comment processing, no dependencies are needed.  
Instruction that have further dependencies are provided as separate module, so will only got those dependencies if you
really need them.  
The promise polyfill is only needed for old Node versions, so I don't want to add this dependencies, to be not needed in
most cases. And on the other hand, there are a lot of polyfills for promises, so you should decide which one to use, not
me.

### Regular Expressions vs Parser
I decided to use Regular Expressions to find comments and not to use a Parser. This decision was made, because if I
would parse the file and transform the markup in memory, I would have to marshal the markup in memory, which would look
differently in the end. There would probably another indentation, some tags may be extended or normalized. But I want
the markup to be as good or bad as I wrote it, besides the transformations I configured, this is why I use Regular
Expressions to handle the lines of the file. 

But this on the other hand also causes some troubles, especially if the elements are not separated by line breaks. So
keep in mind:

```html
<!-- good:start -->
.. some good markup
<!-- good:end -->
```

while

```html
<!-- bad:start --> .. some bad markup <!-- bad:end -->
```

### Nesting

```html
<!-- outer:start -->
.. some markup
<!-- inner:start -->
.. some more markup
<!-- inner:end -->
<!-- outer:end -->
```

It was no actual design decision to not allow nesting of instructions, it was just to keep things simple. Maybe I will 
add this feature one day.

## API

* Creating a `stream.Transform`
  * [commentProcessing(*[config]*)](#commentprocessingconfig)
  * [commentProcessing.withInstructions(instructions)](#commentprocessingwithinstructionsinstructions)
  * [commentProcessing.withDefaults(*[aggregateFn]*)](#commentprocessingwithdefaultsaggregatefn)
* Transform methods
  * [transform.addInstruction(name, instruction)](#transformaddinstructionname-instruction)
  * [transform.addInstructions(instructions)](#transformaddinstructionsinstructions)
  * [transform.setInstructions(instructions)](#transformsetinstructionsinstructions)
  * [transform.clearInstructions()](#transformclearinstructions)
  * [transform.removeInstruction(name)](#transformremoveinstructionname)
  * [transform.transformFile(inputFile, outputFile)](#transformtransformfileinputfile-outputfile)
* Instructions
  * [commentProcessing.IdentityInstruction()](#commentprocessingidentityinstruction)
  * [commentProcessing.DropInstruction()](#commentprocessingdropinstruction)
  * [commentProcessing.MinInstruction()](#commentprocessingmininstruction)
  * [commentProcessing.AggregateInstruction(*[callback]*)](#commentprocessingaggregateinstructioncallback)
    * [commentProcessing.AggregateInstruction.factory(*[callback]*)](#commentprocessingaggregateinstructionfactorycallback)
* Instruction interface
  * [instruction.start(line, name, arg, index)](#instructionstartline-name-arg-index)
  * [instruction.process(line)](#instructionprocessline)
  * [instruction.end(line)](#instructionendline)

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

### commentProcessing.IdentityInstruction()

Returns a factory method of an instruction that just returns what it gets, so it does not change anything.

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

Called when a comment was found that matches the name this instruction was registered with. 

* `line` is the string containing the complete line this comment was found (until the next newline character).
* `name` is the actual name of the instruction, as it could be registered under several names. 
* `arg` is the argument that was given to the comment, like *theArgument* in

    ```html
    <!-- instructionName:start theArgument -->
    ```
    
* `index` is the position in `line` where the comment started. This can be used to ensure the indentation when creating output.

This method has to return the transformed output for this line. In most cases this will be `null` for no output.

### instruction.process(line)

Called for every line within the start and the end comment.

`line` will contain the complete line as a string. The method has to return the transformed output for this line. If you don't want an output for this line, you can return `null`.

### instruction.end(line)

Callen when the end comment was found.

`line` will contain the complete line with the end comment as a string. 

This method has to return the transformed output for this line. In most cases this will be `null` for no output.

## License

MIT

[npm]:http://npmjs.org/
[es6-promise]: https://www.npmjs.com/package/es6-promise
[uglify-instruction]: https://www.npmjs.com/package/uglify-instruction

[buildstatus-img]: https://travis-ci.org/pmentz/comment-processing.svg?branch=master
[buildstatus-url]: https://travis-ci.org/pmentz/comment-processing
[coverage-img]: https://coveralls.io/repos/pmentz/comment-processing/badge.svg?service=github&branch=master
[coverage-url]: https://coveralls.io/github/pmentz/comment-processing?branch=master
[dependency-img]: https://david-dm.org/pmentz/comment-processing.svg
[dependency-url]: https://david-dm.org/pmentz/comment-processing
[devDependency-img]: https://david-dm.org/pmentz/comment-processing/dev-status.svg
[devDependency-url]: https://david-dm.org/pmentz/comment-processing#info=devDependencies
[stable-img]: https://img.shields.io/badge/stability-2%20--%20stable-brightgreen.svg?style=flat-round
[stability-url]: https://iojs.org/api/documentation.html#documentation_stability_index
[nodei-img]: https://nodei.co/npm/comment-processing.png?compact=true
[nodei-url]: https://nodei.co/npm/comment-processing/

