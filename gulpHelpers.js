// this will have all of a copy of the normal fs methods as well
const fs = require('fs.extra');
const path = require('path');
const argv = require('yargs').argv;
const MANIFEST = 'package.json';
const exec = require('child_process').exec;
const through = require('through2');
const _ = require('lodash');
const gutil = require('gulp-util');

const MODULE_PATH = './modules';
const BUILD_PATH = './build/dist';
const DEV_PATH = './build/dev';


// get only subdirectories that contain package.json with 'main' property
function isModuleDirectory(filePath) {
  try {
    const manifestPath = path.join(filePath, MANIFEST);
    if (fs.statSync(manifestPath).isFile()) {
      const module = require(manifestPath);
      return module && module.main;
    }
  }
  catch (error) {}
}

module.exports = {
  toCapitalCase: function (str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  jsonifyHTML: function (str) {
    console.log(arguments);
    return str.replace(/\n/g, '')
        .replace(/<\//g, '<\\/')
        .replace(/\/>/g, '\\/>');
  },
  getArgModules() {
    var moduleFile = 'modules.json';
//      console.dir(moduleFile);
      
    var modules = JSON.parse(fs.readFileSync(moduleFile, 'utf8'));

    return modules;
  },
  getModules: _.memoize(function(externalModules) {
    externalModules = externalModules || [];
    var internalModules;
    try {
      var absoluteModulePath = path.join(__dirname, MODULE_PATH);
      internalModules = fs.readdirSync(absoluteModulePath)
        .filter(file => (/^[^\.]+(\.js)?$/).test(file))
        .reduce((memo, file) => {
          var moduleName = file.split(new RegExp('[.\\' + path.sep + ']'))[0];
          var modulePath = path.join(absoluteModulePath, file);
          if (fs.lstatSync(modulePath).isDirectory()) {
            modulePath = path.join(modulePath, "index.js")
          }
          memo[modulePath] = moduleName;
          return memo;
        }, {});
    } catch(err) {
      internalModules = {};
    }
    return Object.assign(externalModules.reduce((memo, module) => {
      try {
        var modulePath = require.resolve(module);
        memo[modulePath] = module;
      } catch(err) {
        // do something
      }
      return memo;
    }, internalModules));
  }),

  getBuiltModules: function(dev, externalModules) {
    var modules = this.getModuleNames(externalModules);
    if(Array.isArray(externalModules)) {
      modules = _.intersection(modules, externalModules);
    }
    //  console.dir(modules)
   //   console.dir(`build modules: ${modules.map(name => path.join(__dirname, dev ? DEV_PATH : BUILD_PATH, name + '.js'))}`)
    return modules.map(name => path.join(__dirname, dev ? DEV_PATH : BUILD_PATH, name + '.js'));
  },

  getBuiltPrebidCoreFile: function(dev) {
    return path.join(__dirname, dev ? DEV_PATH : BUILD_PATH, 'prebid-core' + '.js');
  },

  getModulePaths: function(externalModules) {
    var modules = this.getModules(externalModules);
    return Object.keys(modules);
  },

  getModuleNames: function(externalModules) {
    return _.values(this.getModules(externalModules));
  },

  nameModules: function(externalModules) {
    var modules = this.getModules(externalModules);
    return through.obj(function(file, enc, done) {
      file.named = modules[file.path] ? modules[file.path] : 'prebid';
      this.push(file);
      done();
    })
  },
}