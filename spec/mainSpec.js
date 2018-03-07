const fs = require('fs-extra');
const AV = require('../dist/app-versioner').AppVersioner;
const TEST_RES = './test-resources/';
const TEST_RES_TEMP = './test-resources/temp/';
const FAKE_PKG1 = `${TEST_RES}fake-package-1.json`;
const FAKE_PKG2 = `${TEST_RES}fake-package-2.json`;

afterEach(() => {
    fs.removeSync(TEST_RES_TEMP);
});

describe("package.json manipulation", () => {

    it("should use 'getPackage' to load the 'fake-package-1.json'", () => {
        const fakePkg1 = AV.getPackage(FAKE_PKG1);
        expect( fakePkg1.version ).toBe( '1.0.0' );
    });

    it("should use 'getJson' to load a sample json file", () => {
        const sample = AV.getJson(`${TEST_RES}sample.json`);
        expect( sample.description ).toBeTruthy();
    });

    it("should use 'getVersion' to load the current version from 'fake-package-1.json'", () => {
        const fakePkg1Version = AV.getVersion(FAKE_PKG1);
        expect( fakePkg1Version ).toBe( '1.0.0' );
    });

    it("should use 'bumpVersion' to increment version", () => {
        const fakePkg1Version = AV.bumpVersion("patch", FAKE_PKG1, TEST_RES_TEMP + "bumpVersion-fake-package-1.json");
        expect( fakePkg1Version ).toBe( '1.0.1' );
    });
});


describe("utils", () => {

    it("should use 'regSlash' to escape '?' and '*' characters with double preceeding slashes", () => {

        expect( AV.regSlash("a?b") ).toBe('a\\?b');
        expect( AV.regSlash("a*b") ).toBe('a\\*b');
    });

    it("should remove the trailing slash from a url when there is one", () => {
        expect( AV.removeTrailingSlash("/a/b/") ).toBe("/a/b");
        expect( AV.removeTrailingSlash("/a/b") ).toBe("/a/b");
    });
});

describe("path retrieval", () => {
    const DEV_BUILD_PATH = "/dist/";
    const PROD_BUILD_PATH = "/production-location/";
    const DEV_SCSS = TEST_RES + "dev.scss";
    var inst;

    beforeEach(() => {
        inst = new AV(DEV_BUILD_PATH, PROD_BUILD_PATH, false, FAKE_PKG2);
    });

    it("should use 'getHyphenedVersion' to get a hyphenated version after new instance created", () => {
        expect( inst.getHyphenedVersion(false, FAKE_PKG2) ).toBe("2-0-0");
    });

    it("should use 'getBuildPath' to get the 'dev' path", () => {
        expect( inst.getBuildPath(true, false, FAKE_PKG2) ).toBe( DEV_BUILD_PATH + "2-0-0/" );
    });

    it("should use 'setScssBuildPath' to set the build path as an AUTOMATIC variable in a scss file, adding comments in AUTOMATICALLY because they are not there already", () => {
        let outputPath = TEST_RES_TEMP + "setScssBuildPath1-dev.scss";
        
        inst.setScssBuildPath(DEV_SCSS, true, outputPath, FAKE_PKG2);

        expect( fs.existsSync(outputPath) ).toBe(true);

        let scssContents = fs.readFileSync(outputPath).toString();
        expect( scssContents.indexOf('$build-path: "/dist/2-0-0/";') ).not.toEqual(-1);
        expect( scssContents.indexOf('//APP_VERSIONER_BUILD_PATH_START') ).not.toEqual(-1);
        expect( scssContents.indexOf('//APP_VERSIONER_BUILD_PATH_END') ).not.toEqual(-1);
    });

    it("should use 'setScssBuildPath' to set the build path as a CUSTOM variable in a scss file, using CUSTOM comments and adding them AUTOMATICALLY if they are not already there", () => {
        let outputPath = TEST_RES_TEMP + "setScssBuildPath2-dev.scss";
        
        inst.setScssBuildPath(DEV_SCSS, true, outputPath, FAKE_PKG2, '$myBuild', "//BUILD_PATH_START", "//BUILD_PATH_END");

        expect( fs.existsSync(outputPath) ).toBe(true);

        let scssContents = fs.readFileSync(outputPath).toString();
        expect( scssContents.indexOf('$myBuild: "/dist/2-0-0/";') ).not.toEqual(-1);
        expect( scssContents.indexOf('//BUILD_PATH_START') ).not.toEqual(-1);
        expect( scssContents.indexOf('//BUILD_PATH_END') ).not.toEqual(-1);
    });

    it("should use 'setScssBuildPath' to set the build path as an AUTOMATIC variable in a scss file WITHOUT versioning", () => {
        let outputPath = TEST_RES_TEMP + "setScssBuildPath1-dev.scss";
        const includeVersioning = false;
        inst.setScssBuildPath(DEV_SCSS, includeVersioning, outputPath, FAKE_PKG2);

        expect( fs.existsSync(outputPath) ).toBe(true);

        let scssContents = fs.readFileSync(outputPath).toString();
        expect( scssContents.indexOf('$build-path: "/dist/";') ).not.toEqual(-1);
    });



    it("should use 'setScssEnv' to set the environment as an AUTOMATIC variable in a scss file, adding comments in AUTOMATICALLY because they are not there already", () => {
        let outputPath = TEST_RES_TEMP + "setScssEnv1-dev.scss";
        
        inst.setScssEnv(DEV_SCSS, outputPath, FAKE_PKG2);

        expect( fs.existsSync(outputPath) ).toBe(true);

        let scssContents = fs.readFileSync(outputPath).toString();
        expect( scssContents.indexOf('$environment: "dev";') ).not.toEqual(-1);
        expect( scssContents.indexOf('//APP_VERSIONER_ENVIRONMENT_START') ).not.toEqual(-1);
        expect( scssContents.indexOf('//APP_VERSIONER_ENVIRONMENT_END') ).not.toEqual(-1);
    });

    it("should use 'setScssEnv' to set the environment as a CUSTOM variable in a scss file, using CUSTOM comments and adding them AUTOMATICALLY if they are not already there", () => {
        let outputPath = TEST_RES_TEMP + "setScssEnv2-dev.scss";
        
        inst.setScssEnv(DEV_SCSS, outputPath, FAKE_PKG2, '$myVar', "//ENVIRONMENT_START", "//ENVIRONMENT_END");

        expect( fs.existsSync(outputPath) ).toBe(true);

        let scssContents = fs.readFileSync(outputPath).toString();
        expect( scssContents.indexOf('$myVar: "dev";') ).not.toEqual(-1);
        expect( scssContents.indexOf('//ENVIRONMENT_START') ).not.toEqual(-1);
        expect( scssContents.indexOf('//ENVIRONMENT_END') ).not.toEqual(-1);
    });

    it("should use 'copyToBuildPath' to copy a folder into the versioned output build directory", () => {
        let includeSrcDir = true;

        inst.copyToBuildPath(TEST_RES + "stuff1", includeSrcDir, true, TEST_RES_TEMP, FAKE_PKG2);
        expect(fs.existsSync(TEST_RES_TEMP+"dist/2-0-0/stuff1")).toBe(true);

        // now test with a trailing slash
        inst.copyToBuildPath(TEST_RES + "stuff2/", includeSrcDir, true, TEST_RES_TEMP, FAKE_PKG2);
        expect(fs.existsSync(TEST_RES_TEMP+"dist/2-0-0/stuff2")).toBe(true);
    });

    it("should use 'copyToBuildPath' to copy a folder into the versioned output build directory, but copy only the contents of the 'src' directory", () => {
        let includeSrcDir = false;
        inst.copyToBuildPath(TEST_RES + "stuff1", includeSrcDir, true, TEST_RES_TEMP, FAKE_PKG2);
        expect(fs.existsSync(TEST_RES_TEMP+"dist/2-0-0/file1.css")).toBe(true);
    });

    it("should use 'copyToBuildPath' to copy a single file into the versioned output build directory", () => {

        inst.copyToBuildPath(TEST_RES + "stuff1/file1.css", true, true, TEST_RES_TEMP, FAKE_PKG2);
        expect(fs.existsSync(TEST_RES_TEMP+"dist/2-0-0/file1.css")).toBe(true);
    });

});
