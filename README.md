# app-versioner
Versioning helper for static assets

## Example usage
Configure SCSS variables for build path and environment in `_vars.scss` before you do a Sass build.
```
const AppVersioner = require('./app-versioner/dist/app-versioner').AppVersioner;

const IS_PROD = process.env.NODE_ENV === "production";
var appVersioner = new AppVersioner("/dev-environment/", "/prod-environment/", IS_PROD);

appVersioner.setScssBuildPath("app/scss/_vars.scss"); // $build-path: "/dev-environment/1-0-1/";
appVersioner.setScssEnv("app/scss/_vars.scss"); // $environment: "dev";
```

If you don't wish to include the versioning in the scss variable (maybe your dev environment doesn't really need it), you can pass `false` in 2nd parameter
```
appVersioner.setScssBuildPath("app/scss/_vars.scss", false); // $build-path: "/dev-environment/";
```

You can get the versioned path for your sass build like this ("bld" is short for "build directory" and accepts an string parameter)
```
var cssDir = appVersioner.bld("css");
```

If you need more control, you can choose to include the versioned folder or not like this
```
var includeVersioning = process.env.NODE_ENV === "production";
var cssDir = appVersioner.getBuildPath(includeVersioning) + "css"; // "/dev-environment/1-0-1/css/"
```

Or copy files after your production or development versioned folder like this
```
appVersioner.copyToBuildPath("app.css");
```

Or copy entire folders (pass true to 2nd parameter if you want to include the last folder - in this example "/js/" would be included in the output)
```
appVersioner.copyToBuildPath("dist/js/", true);
```