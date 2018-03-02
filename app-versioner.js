const fs = require('fs-extra')
  , globby = require('globby')
  , semver = require("semver")
  , stripJsonComments = require('strip-json-comments')
  , slash = require('slash')
  , changeCase = require('change-case')
  
const NS = "AppVersioner";
const DEF_PKG_PATH = './package.json';


function removeTrainlingSlash(path) {
	if (path.substr(path.length - 1) === "/") path = path.substr(0, path.length - 1);
	return path;
}

export class AppVersioner {

  /**
   * Get the current project's package json info. Useful for things like getting current version of project.
   * @param {string} filePath - path to 'package.json'. Defaults to './package.json'
   * @return (object) Data object containing info from 'package.json' file.
   */
  static getPackage(filePath = DEF_PKG_PATH) {
    return JSON.parse(fs.readFileSync( filePath ));
  }

  /**
   * Reads a json file and strips comments out so it's legit
   * @param {string} filePath - path to 'package.json'. Defaults to './package.json'
   * @return (object) Data object containing info from json file.
   */
  static getJson(filePath) {
    return JSON.parse( stripJsonComments(fs.readFileSync(filePath).toString()) )
  }

  /**
   * Gets the current version of the app from package.json
   * @param {string} filePath - path to 'package.json'. Defaults to './package.json'
   * @return (string) - version from package.json
   */
  static getVersion(filePath = DEF_PKG_PATH) {
    return this.getPackage(filePath).version;
  }


  /**
   * Increment version of the app, writing back to the package.json
   * @param {string} versionType can be either "major", "minor" or "patch"
   * @param {string} filePath - path to 'package.json'. Defaults to './package.json'
   * @param {string} outputFilePath - optionally pass another output path. Probably will just be used for testing.
   */
  static bumpVersion(versionType = "patch", filePath = DEF_PKG_PATH, outputFilePath) {
    var pkg = this.getPackage(filePath)
    
    pkg.version = semver.inc(pkg.version, versionType);

    // saves the package.json file with bumped version for the theme in question
    fs.outputFileSync( outputFilePath || filePath, JSON.stringify(pkg, null, 2));

    return pkg.version;
  }

  /**
   * escapes common special characters in regexes
   * @param {string} str - regex to escape
   */
  static regSlash(str) {
    if (str.indexOf("?") !== -1) str = str.split("?").join("\\?");
    if (str.indexOf("*") !== -1) str = str.split("*").join("\\*");

    return str;
  }





  /**
   * @param {string} devBuildPath - path to your local dev directory
   * @param {string} prodBuildPath - path to your production ready directory
   * @param {boolean} isProd - true for production environment & false for development environment. Can be changed later.
   * @param {string} pkgPath - path to 'package.json'. Defaults to './package.json'
   */
  constructor(devBuildPath, prodBuildPath, isProd, pkgPath = DEF_PKG_PATH) {
    this.devBuildPath = devBuildPath;
    this.prodBuildPath = prodBuildPath;
    this.isProd = isProd;
    this.originalVersion = AppVersioner.getVersion(pkgPath);
  }


  /**
   * Just a convenience function for adding a path to the versioned build path
   * @param {*} path 
   */
  bld(path) {
    return this.getBuildPath() + (path || "");
  }

  /**
   * Set to true for production environment & false for development environment. This will affect your paths in other functions.
   * @param {boolean} isProd 
   */
  setEnvironment(isProd) {
    this.isProd = isProd;
  }

  /**
   * Returns whether or not you are in production mode
   */
  isProd() {
    //return true;
    return this.isProd;
  }

  /**
   * Returns version with hyphen separation instead of dots. Optionally return the original version before any version bumps were made.
   * @param {bool} useOriginalVersion - optionally use the original version before any version bumps were made. Defaults to false.
   * @param {string} pkgPath - path to 'package.json'. Defaults to './package.json'
   */
  getHyphenedVersion(useOriginalVersion = false, pkgPath = DEF_PKG_PATH) {
    let version = (useOriginalVersion ? this.originalVersion : AppVersioner.getVersion(pkgPath));
    return version.split(".").join("-");
  }

  /**
   * Gets the build path with or without versioning info. Optionally use original version, before any version changes.
   * @param {boolean} includeVersioning - whether to not to include versioned folder (eg "/dist/0-6-25/"). Defaults to true.
   * @param {bool} useOriginalVersion - optionally use the original version before any version bumps were made. Ignored if 'includeVersioning' is false. Defaults to false.
   * @param {string} pkgPath - path to 'package.json'. Defaults to './package.json'
   */
  getBuildPath(includeVersioning = true, useOriginalVersion = false, pkgPath = DEF_PKG_PATH) {
    let path = (this.isProd ? this.prodBuildPath : this.devBuildPath);
    if(includeVersioning) path += this.getHyphenedVersion(useOriginalVersion, pkgPath) + "/";
    return path;
  }


  /**
   * Adds a variable for the build path to a scss file between specified comments. These comments will be added to top of file if not found.
   * @param {string} scssPath - path to scss file to add variable to
   * @param {string} outputFilePath - alternative path. Should usually be null, so it saves over the original, but you may want to change it when testing.
   * @param {string} pkgPath - path to 'package.json'. Defaults to './package.json'
   * @param {string} varName - a valid scss variable name. Defaults to '$build-path'.
   * @param {string} startComment - a start comment. Defaults to '//APP_VERSIONER_BUILD_PATH_START'
   * @param {string} endComment - an end comment. Defaults to '//APP_VERSIONER_BUILD_PATH_END'
   */
  setScssBuildPath(scssPath, outputFilePath, pkgPath = DEF_PKG_PATH, varName = "$build-path", startComment = "//APP_VERSIONER_BUILD_PATH_START", endComment = "//APP_VERSIONER_BUILD_PATH_END") {
    
    let varContents = this.getBuildPath(true, false, pkgPath);
    this._setScssVariable(scssPath, varName, varContents, startComment, endComment, outputFilePath, pkgPath);
  }


  /**
   * Changes the SCSS environment variable to either development or production.
   * @param {string} scssPath - path to scss file to add variable to
   * @param {string} outputFilePath - alternative path. Should usually be null, so it saves over the original, but you may want to change it when testing.
   * @param {string} pkgPath - path to 'package.json'. Defaults to './package.json'
   * @param {string} varName - a valid scss variable name. Defaults to '$environment'.
   * @param {string} startComment - a start comment. Defaults to '//APP_VERSIONER_ENVIRONMENT_START'
   * @param {string} endComment - an end comment. Defaults to '//APP_VERSIONER_ENVIRONMENT_END'
   */
  setScssEnv(scssPath, outputFilePath, pkgPath = DEF_PKG_PATH, varName = "$environment", startComment = "//APP_VERSIONER_ENVIRONMENT_START", endComment = "//APP_VERSIONER_ENVIRONMENT_END") {
    let varContents = this.isProd ? 'prod' : 'dev';
    this._setScssVariable(scssPath, varName, varContents, startComment, endComment, outputFilePath, pkgPath);
  }


  /**
   * Copies a file for folder into the build directory. Defaults to include versioned folder in path.
   * @param {*} src - file or folder to copy
   * @param {boolean} includeVersioning - whether to not to include versioned folder (eg "/dist/0-6-25/"). Defaults to true.
   * @param {string} rootPath - optional root path for the output. Defaults to empty.
   * @param {string} pkgPath - path to 'package.json'. Defaults to './package.json'
   * @returns response from fs-extra 'copySync'
   */
  copyToBuildPath(src, includeVersioning = true, rootPath = "", pkgPath = DEF_PKG_PATH) {

    src = slash(src);

    var srcPath = "";
    // if the src is a file, ensures only the file name is used in output path
    if(fs.lstatSync(src).isFile()) {
      srcPath = src.indexOf("/") === -1 ? src : src.slice( src.lastIndexOf("/") + 1 );
    } else if(fs.lstatSync(src).isDirectory()) {
      console.log(src, "1")
      src = removeTrainlingSlash(src);
      console.log(src, "2")
      srcPath = src.slice( src.lastIndexOf("/") + 1 );
    }

    return fs.copySync(src, rootPath + this.getBuildPath(includeVersioning, false, pkgPath) + srcPath);
  }

  /**
   * Sets a variable in a SCSS file between specified comments
   * @param {string} scssPath - path to scss file to add variable to
   * @param {string} varName - a valid scss variable name. 
   * @param {*} varContents - contents of the variable.
   * @param {*} startComment - a valid scss comments (to go before variable)
   * @param {*} endComment - a valid scss comments (to go after variable)
   * @param {string} outputFilePath - alternative path. Should usually be null, so it saves over the original, but you may want to change it when testing.
   */
  _setScssVariable(scssPath, varName, varContents, startComment, endComment, outputFilePath) {

    let scssContents = fs.readFileSync(scssPath).toString()
      , envStr = varName + ': "' + varContents + '";'

    // if doesn't exists, adds comments to top of the file
    if(scssContents.indexOf(startComment) === -1 && scssContents.indexOf(endComment) === -1 ) {
      scssContents = startComment + "\n" + endComment + "\n\n" + scssContents;
    }

    // *? is much faster than *
    // \s and \S matches all characters including line breaks
    var rx = new RegExp( AppVersioner.regSlash(startComment) +"[\\s\\S]*?" + AppVersioner.regSlash(endComment), "g")
      , result = scssContents.replace( rx, startComment + "\n" + envStr +"\n" + endComment )

    fs.outputFileSync(outputFilePath || scssPath, result);
  }
  
}
