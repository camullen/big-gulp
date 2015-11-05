# big gulp
Opinionated gulp build environment for front-end web development that uses browserify, babel, and browser-sync to create a streamlined development process with minimal (or no) additional configuration required

Shout out to [Wes Bos](https://github.com/wesbos) for the original [gulpfile](https://github.com/wesbos/React-For-Beginners-Starter-Files/blob/master/01%20-%20Introduction%20-%20Start%20Here/gulpfile.js)

## Getting Started
big gulp has only __one__ hard dependendy, gulp. Yep. That's it. All other requirements are lazily installed automatically.

1. Run `npm install gulp --save-dev`
2. Replace the boilerplate code in the `/src` folder with your code (or use the example code - requires react & react-dom modules)
3. Run `gulp`

Your files will be compiled and saved to the `/dist` folder, and a browser-sync session will start displaying your live app. Any changes you make to your code will cause a re-compilation and a reload of the app.

If there are compilation errors after running the script initially, gulp-notify will give you a pop up notification telling you of the compliation errors.

big gulp takes care of a few things for you:
- __JavaScript__
  - Uses browserify for modularization
  - Uses babel (and its plugins / presets) to transpile your code into ES5
  - Applies sourcemaps (and knows which gulp plugins are sourcemaps compatible)
  - Uglifies your code
  - Also allows you to customize the compilation process (see __Customizing__ below)
- __CSS__
  - Copies CSS files to the dist directory and live reloads any changes made to src
  - Compilation *(TO COME)*
- __HTML__
  - Copies HTML files to the dist directory and live reloads any changes made to src
  - Compilation *(TO COME)*
- __Images__
  - Copies Image files to the dist directory and live reloads any changes made to src
  - Compression / processing *(TO COME)*

## Customizing
big gulp utilizes gulp-config.yml for its configuration. See below for the documentation:

```yaml
development: &defaults
  # Options for the directory structure of your project
  directoryStructure:

    # The folder location of the compiled scripts and assets
    distributionRoot: ./dist 
    
    # The source folder for scripts and assets    
    sourceRoot: ./src 

    # The relative location of all JavaScript / CoffeeScript source files
    #   e.g. If your files live at './src/scripts', this option should be 'scripts'
    scriptsFolder: js 

    # The relative location of all style source files
    #   e.g. If your files live at './src/scripts', this option should be 'scripts'
    stylesFolder: css

    # The relative location of all image source files
    #   e.g. If your files live at './src/image', this option should be 'scripts'
    imagesFolder: images

  # Options for handling compiliation of javascript
  scriptOptions:

    # Browserify options
    browserify:

      # The relative location of the main 'entry point' of your app
      #  - This specifies where browserify will start to read its dependency graph
      #    and include files in your finalized javascript file
      #
      #  e.g. If the entry point in your app is './src/js/main.js', this option 
      #       should be main.js
      entryFile: app.js

      # A list of transforms to pass to browserify
      #  - The babelify transform is required and configured for you (see below)
      #  - Gulp will attempt to install any missing transform modules, but should not be
      #    relied upon
      #  - Others must be included in your npm package (otherwise build will fail)
      #  - See https://github.com/substack/node-browserify/wiki/list-of-transforms
      #    for a list of available transforms
      transform:
        - babelify

    # Babelify options
    babelify:

      # A list of babelify presets to use. See http://babeljs.io/docs/plugins/ for more details
      # Gulp will attempt to install any missing presets, but should not be relied upon
      presets:
        - es2015
        - react

    # Include sourcemaps
    sourcemaps: true

    # Gulp plugins configuration
    #  - Will attempt to auto-install all of these plugins
    #  - Will run plugins in order (except those that are sourcemaps compatible - those get run last)
    #  - Options can be passed like so:
    #     
    #     plugins:
    #         -module-with-no-options
    #         module-with-configuration-options:
    #           optionA: valueA
    #           optionB: valueB
    #             
    plugins:
      - gulp-uglify
```
## Environments
Big gulp allows you to specify different build options for different environments (development, test, production). To run big gulp for a particular environment run:
`gulp --env ENVIRONMENT_GOES_HERE`

Alternatively, you can set the environment through the `NODE_ENV` environment variable
  


