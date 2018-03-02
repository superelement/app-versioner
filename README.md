# app-versioner
Versioning helper for static assets

## Example usage
Configure SCSS variables for build path and environment in `_vars.scss` before you do a Sass build.
```
const AppVersioner = require('./app-versioner/dist/app-versioner').AppVersioner;

const IS_PROD = process.env.NODE_ENV === "production";
var appVersioner = new AppVersioner("/dev-environment/", "/prod-environment/", IS_PROD);

appVersioner.setScssBuildPath("app/scss/_vars.scss");
appVersioner.setScssEnv("app/scss/_vars.scss");
```

You can get the versioned path for your sass build like this ("bld" is short for "build directory" and accepts an string parameter)
```
var cssDir = appVersioner.bld("css");
```

If you need more control, you can choose to include the versioned folder or not like this
```
var includeVersioning = process.env.NODE_ENV === "production";
var cssDir = appVersioner.getBuildPath(includeVersioning) + "css";
```

Or copy files after your production or development versioned folder like this
```
appVersioner.copyToBuildPath("app.css");
```