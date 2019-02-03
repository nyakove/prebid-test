'use strict';

var _ = require('lodash');
var argv = require('yargs').argv;
var gulp = require('gulp');
var gutil = require('gulp-util');
var webpack = require('webpack');
var webpackStream = require('webpack-stream');
var uglify = require('gulp-uglify');
var gulpClean = require('gulp-clean');
var webpackConfig = require('./webpack.conf');
var helpers = require('./gulpHelpers');
var concat = require('gulp-concat');
var header = require('gulp-header');
var footer = require('gulp-footer');
var replace = require('gulp-replace');
var optimizejs = require('gulp-optimize-js');
var gulpif = require('gulp-if');
var sourcemaps = require('gulp-sourcemaps');
var through = require('through2');

var prebid = require('./package.json');
var date = (new Date()).toISOString().substring(0, 10);
var dateString = 'Updated : ' + date;
var banner = '/* <%= prebid.name %> v<%= prebid.version %>\n' + dateString + ' */\n';
var analyticsDirectory = '../analytics';

// these modules must be explicitly listed in --modules to be included in the build, won't be part of "all" modules
var explicitModules = [
  'pre1api'
];

// all the following functions are task functions
function bundleToStdout() {
    nodeBundle().then(file => console.log(file));
}
bundleToStdout.displayName = 'bundle-to-stdout';

function clean() {
    return gulp.src(['build'], {
            read: false,
            allowEmpty: true
        })
        .pipe(gulpClean());
}

function makeWebpackPkg() {
    var cloned = _.cloneDeep(webpackConfig);

    delete cloned.devtool;

    var externalModules = helpers.getArgModules();
//    console.dir('externalModules: ' + externalModules);

    const moduleSources = helpers.getModulePaths(externalModules);
 //   console.dir('moduleSources: ' + moduleSources);

    return gulp.src([].concat(moduleSources, 'src/prebid.js'))
        .pipe(helpers.nameModules(externalModules))
        .pipe(webpackStream(cloned, webpack))
        .pipe(uglify())
        .pipe(gulpif(file => file.basename === 'prebid-core.js', header(banner, {
            prebid: prebid
        })))
        .pipe(optimizejs())
        .pipe(gulp.dest('build/dist'));
}

function gulpBundle(dev) {
    return bundle(dev).pipe(gulp.dest('build/' + (dev ? 'dev' : 'dist')));
}

function nodeBundle(modules) {
    return new Promise((resolve, reject) => {
        bundle(false, modules)
            .on('error', (err) => {
                reject(err);
            })
            .pipe(through.obj(function (file, enc, done) {
                resolve(file.contents.toString(enc));
                done();
            }));
    });
}

function bundle(dev, moduleArr) {
    var modules = moduleArr || helpers.getArgModules();
    var allModules = helpers.getModuleNames(modules);

    if (modules.length === 0) {
        modules = allModules.filter(module => explicitModules.indexOf(module) === -1);
    } else {
        var diff = _.difference(modules, allModules);
        if (diff.length !== 0) {
            throw new gutil.PluginError({
                plugin: 'bundle',
                message: 'invalid modules: ' + diff.join(', ')
            });
        }
    }

    var entries = [helpers.getBuiltPrebidCoreFile(dev)].concat(helpers.getBuiltModules(dev, modules));
  //  console.dir('entries: ' + entries);

    var outputFileName = `${date}_prebid.js`;
    
    gutil.log('Concatenating files:\n', entries);
    gutil.log('Appending ' + prebid.globalVarName + '.processQueue();');
    gutil.log('Generating bundle:', outputFileName);

    return gulp.src(
            entries
        )
        .pipe(gulpif(dev, sourcemaps.init({
            loadMaps: true
        })))
        .pipe(concat(outputFileName))
        .pipe(gulpif(!argv.manualEnable, footer('\n<%= global %>.processQueue();', {
            global: prebid.globalVarName
        })))
        .pipe(gulpif(dev, sourcemaps.write('.')));
}


gulp.task(clean);

gulp.task('build-bundle-prod', gulp.series(makeWebpackPkg, gulpBundle.bind(null, false)));

gulp.task('build', gulp.series(clean, 'build-bundle-prod'));

gulp.task('default', gulp.series(clean, makeWebpackPkg));


// other tasks
gulp.task(bundleToStdout);
//gulp.task('bundle', gulpBundle.bind(null, false)); // used for just concatenating pre-built files with no build step

module.exports = nodeBundle;
