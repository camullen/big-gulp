/*
 * gulpfile.js
 */


var exec = require('child_process').execSync;

/*
 * Dependencies
 *  - Allows gulp to require dependencies not yet installed by npm
 */
var Dependencies = {

  requireInstall : function(moduleName) {
    try {
      return require(moduleName)
    } catch (e) {
      if(e.code === 'MODULE_NOT_FOUND') {
        this.install(moduleName);
        return require(moduleName);
      } else {
        throw e;
      }
    }
  },
  install : function(moduleName) {
    console.log('Installing ', moduleName, ' ...');
    exec(`npm install ${moduleName} --save-dev`, {stdio:[0,1,2]});
  }
};


// Utility dependencies
var gulp = Dependencies.requireInstall('gulp');
var gutil = Dependencies.requireInstall('gulp-util');
var notify = Dependencies.requireInstall('gulp-notify');
var yaml = Dependencies.requireInstall('js-yaml');
var fs = Dependencies.requireInstall('fs');
var minimist = Dependencies.requireInstall('minimist');

// Core dependencies
var watchify = Dependencies.requireInstall('watchify');
var browserify = Dependencies.requireInstall('browserify');
var babelify = Dependencies.requireInstall('babelify');
var source = Dependencies.requireInstall('vinyl-source-stream');
var buffer = Dependencies.requireInstall('vinyl-buffer');
var browserSync = Dependencies.requireInstall('browser-sync').create();

//Optional dependencies
var sourcemaps = Dependencies.requireInstall('gulp-sourcemaps')
//var uglify = Dependencies.requireInstall('gulp-uglify');


/*
 * Environment configuration
 *   - should be either: 'development', 'production', or 'test'
 *   - environment defaults to the environment variable NODE_ENV
 *   - falls back to 'development'
 *   - can be specified as a command line option with --env 'environment'
 *     e.g. gulp --env production
 */

function getEnvironment() {
  var knownOptions = {
    string: 'env',
    default: { env: process.env.NODE_ENV || 'development' }
  }
  var options = minimist(process.argv.slice(2), knownOptions)
  return options.env
}

var environment = getEnvironment();

/*
 * Configuration loading
 *   - Loads envirionment settings from gulp-config.yml
 */

function loadOptions(environment) {
  var doc = yaml.safeLoad(fs.readFileSync('./gulp-config.yml', 'utf8'));
  return doc[environment]
}

const OPTS = loadOptions(environment);
const DIR_OPTS = OPTS.directoryStructure;
const SCRIPT_OPTS = OPTS.scriptOptions;




/*
 * Build the babelify transform for browserify with the selected presets
 */
function babelifyTransform() {
  var presets = SCRIPT_OPTS.babelify.presets;
  // Attempt to install presets
  presets.forEach((preset) => {
    Dependencies.requireInstall(`babel-preset-${preset}`)
  });
  return babelify.configure({
    presets: presets
  });
}

/*
 * Build the browserify transforms array with the selected transforms
 */
function browserifyTransforms() {
  // Loop over transform opts and require them into an array
  return SCRIPT_OPTS.browserify.transform.map((transformKey) => {
    if(transformKey === 'babelify') return babelifyTransform()
    return Dependencies.requireInstall(transformKey)
  });
}

/*
 * Build the browserify bundle
 */
function browserifyBundler(entryPath) {
  return browserify({
    entries: entryPath,
    debug: true,
    transform: browserifyTransforms()
  });
}

/*
 * List of sourcemaps compatible plugins
 */
var sourcemapsCompatible = new Set(['gulp-concat', 'gulp-group-concat', 'gulp-rename', 'gulp-babel', 'gulp-amd-optimizer', 'amd-optimize', 'gulp-cjsx', 'gulp-coffee', 'gulp-dereserve', 'gulp-es6-module-transpiler', 'gulp-esnext', 'gulp-espower', 'gulp-gorilla', 'gulp-jspm', 'gulp-ng-annotate', 'gulp-pure-cjs', 'gulp-strip-ng-log', 'gulp-sweetjs', 'gulp-traceur', 'gulp-transform-js-ast', 'gulp-type', 'gulp-uglify', 'gulp-cirru-script', 'gulp-typescript', 'gulp-react', 'gulp-regenerator', 'gulp-requirejs-optimize', 'gulp-wrap-js']);

function runPlugin(bundler, module, options) {
  var plugin = Dependencies.requireInstall(module);
  gutil.log(`Running ${module}`);
  if(options) return bundler.pipe(plugin(options));
  return bundler.pipe(plugin());
}

function getPluginInfo(plugin){
  info = {}
  if(typeof plugin === 'object'){
    info.module = Object.keys(plugin)[0];
    info.options = plugin[info.module];
  } else {
    info.module = plugin;
  }
  return info;
}

/*
 * Customize the bundle and run user-defined plugins
 */
function customizeBundle(bundler) {
  var withSrcMaps = []

  // Run non sourcemaps compatible plugins
  SCRIPT_OPTS.plugins.forEach((plugin) => {
    var info = getPluginInfo(plugin);

    // If sourcemaps enabled, defer running compatible plugins until
    // sourcemaps initiated
    if(sourcemapsCompatible.has(info.module) && SCRIPT_OPTS.sourcemaps){
      withSrcMaps.push(info);
      return;
    }

    bundler = runPlugin(bundler, info.module, info.options);
  });

  // If sourcemaps enabled run sourcemaps compatible plugins
  if(SCRIPT_OPTS.sourcemaps) {
    gutil.log('Running sourcemaps');
    bundler = bundler.pipe(sourcemaps.init({loadMaps: true}));
    withSrcMaps.forEach((pluginInfo) =>{
      bundler = runPlugin(bundler, pluginInfo.module, info.options);
    });
    bundler = bundler.pipe(sourcemaps.write());
  }   
  
  return bundler;
}

/*
 * handle errors from the build script
 */
function handleErrors() {
  var args = Array.prototype.slice.call(arguments);
  notify.onError({
    title: 'Compile Error',
    message: '<%= error.message %>'
  }).apply(this, args);
  this.emit('end'); // Keep gulp from hanging on this task
}

/*
 * buildScript(watch)
 * The main function that builds the script files based upon supplied options
 * If watch is true, sets up watchify to watch for changes to the javascript source
 * tree
 */
function buildScript(watch) {
  var entryPoint = SCRIPT_OPTS.browserify.entryFile; 
  var baseBundler = browserifyBundler(`${DIR_OPTS.sourceRoot}/${DIR_OPTS.scriptsFolder}/${entryPoint}`);

  var bundler = watch ? watchify(baseBundler) : baseBundler;

  function rebundle() {
    var preTasks = bundler.bundle()
      .on('error', handleErrors)
      .pipe(source(entryPoint))
      .pipe(buffer());

    return customizeBundle(preTasks)
      .pipe(gulp.dest(`${DIR_OPTS.distributionRoot}/${DIR_OPTS.scriptsFolder}`))
      .pipe(browserSync.stream());
  }

  bundler.on('update', function(){
    rebundle();
    gutil.log('Rebundle...');
  });
  
  return rebundle();
}

/*
 * Compile JS using function above to distribution directory
 */
gulp.task('scripts', function() { 
  buildScript(false);
});


/*
 * Copy HTML to distribution directory
 */
gulp.task('html', function() {
  gulp.src(`${DIR_OPTS.sourceRoot}/**/*.html`)
    .pipe(gulp.dest(DIR_OPTS.distributionRoot))
    .pipe(browserSync.stream());
});


/*
 * Compile CSS
 */
gulp.task('styles', function() {
  gulp.src(`${DIR_OPTS.sourceRoot}/${DIR_OPTS.stylesFolder}/*.css`)
    // insert other transforms here
    .pipe(gulp.dest(`${DIR_OPTS.distributionRoot}/${DIR_OPTS.stylesFolder}`))
    .pipe(browserSync.stream());
});


/*
 * Move images to distribution directory
 */
gulp.task('images', function() {
  gulp.src(`${DIR_OPTS.sourceRoot}/${DIR_OPTS.imagesFolder}/**`)
    .pipe(gulp.dest(`${DIR_OPTS.distributionRoot}/${DIR_OPTS.imagesFolder}`))
    .pipe(browserSync.stream());
});


/*
 * Start browser-sync
 */
gulp.task('browser-sync', function() {
  browserSync.init({
    server: {
      baseDir: DIR_OPTS.distributionRoot
    }
  });
});


gulp.task('default', ['html', 'scripts', 'styles', 'images', 'browser-sync'], function() {
  gulp.watch(`${DIR_OPTS.sourceRoot}/**/*.html`, ['html']); // gulp watch for html changes
  gulp.watch(`${DIR_OPTS.sourceRoot}/${DIR_OPTS.stylesFolder}/**/*`, ['styles']); // gulp watch for css changes
  gulp.watch(`${DIR_OPTS.sourceRoot}/${DIR_OPTS.imagesFolder}/**/*`, ['images']); // gulp watch for css changes
  return buildScript(true); // gulp watch for js changes
});