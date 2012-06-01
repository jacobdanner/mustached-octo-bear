jQuery Rondell
=============

This is a [jQuery](http://www.jquery.com) plugin for displaying galeries and other content.

See the [documentation page](http://sebobo.github.com/jquery.rondell/) for a live demo and examples.


Installation
------------

### Prequisites

 * [jQuery](http://www.jquery.com) - 1.5.2 or better
 * [Modernizr](http://www.modernizr.com) - This library tests the browser for feature support and adds classes to the body tag. We use this for css fallbacks in our themes.
 
Both are also provided in the `lib` folder. 

If you don't want to use the `Modernizr` library you can remove the `.cssgradients`, `.borderradius`, `.rgba` and `.boxshadow` classes in `css/jquery-rondell.css`.

### Required files

Copy `lib/jquery-rondell.js` to your javascript folder.
Copy `css/jquery-rondell.css` to your css folder.


Usage
-----

If you like demos more than a boring documentation see the `index.html` file and play with it.

The plugin can be called with jQuery in different ways.
    
### Standard call with default settings:

    $('.myElement').rondell();
    
Where `myElement` is the class of the items you want to display as rondell.

#### Rondell content

If `myElement` is an image, it is directly used and the title will be used as text overlay when hoverd.

### Options

See the [documentation page](http://projects.sebastianhelzle.net/jquery.rondell/) for the options.

Editing
-------

Read this chapter if you want to modify or extend the rondell.

The plugin is written in [coffeescript](http://jashkenas.github.com/coffee-script/) and the css with [sass](http://sass-lang.com/).
The sources are provided in the `src` folder.  

So you can either work with the compiled `.js` and `.css` files in your project or use the coffeescript and sass files.

I have provided a `Cakefile` which starts the two watcher daemons, when your editing .scss and .coffee files.
This requires node.js and coffeescript installed on your computer.

Feedback
--------

Please send me an [email](sebastian@helzle.net) with any feedback you have or contact me on twitter @sebobo.

Contributing
------------

Contribute!
