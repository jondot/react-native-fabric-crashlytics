
# react-native-fabric-crashlytics

Reports javascript exceptions in React Native to the Crashlytics server, using the react-native-fabric library.

## Usage

To use, add this code to your index.ios.js and index.android.js (or some library included by both).

```
// Already assumes that Fabric is initialized/configured properly in the iOS and Android app startup code.
import crashlytics from 'react-native-fabric-crashlytics';
crashlytics.init();
```

# Source Maps and Mangled Stack Traces

If you're shipping release builds of your app (by default, you are), you'll see stack
traces that don't make sense and lead you to nowhere, because they are referring to the
minified code bundle and not the source tree you're used to during development (see [here](https://github.com/mikelambert/react-native-fabric-crashlytics/issues/1) for more).

The way we amend that, is to generate source maps along with the minified bundle using
an already-existing flag in the react-native CLI. And locating original pieces of code,
matching these to the proper frames in each stack trace with the help of a source mapper.

To use that, you'll need to prepare two things:

1. Using a custom build step for your app, or using your build tooling (shell script, make, etc.), make
sure the following happens:

```
$NODE_BINARY "$REACT_NATIVE_DIR/local-cli/cli.js" bundle \
  --entry-file index.ios.js \
  --platform ios \
  --dev $DEV \
  --reset-cache true \
  --bundle-output "$DEST/main.jsbundle" \
  --assets-dest "$DEST" \
  --sourcemap-output "$DEST/sourcemap.js"
```
In this example (taken from packager itself), you have a few shell variables to play with; but you
can just hard-code your own. Just note the last line with the `--sourcemap-output` for now.

Next, we'll need to tell our library where to locate and how to read our `sourcemap.js`. For
iOS, this is it:

```javascript
import RNFS from 'react-native-fs'

function crashload(){
  const path = `${RNFS.MainBundlePath}/sourcemap.js`
  RNFS.readFile(path, 'utf8').then((contents)=>{
    crashlytics.init(JSON.parse(contents))
  }).catch(err=>crashlytics.init())
}
crashload()
```

And we'll need to signal Xcode to include such a file, so you'll need to create the same
"missing" file as `main.jsbundle` in your Xcode project and name it `sourcemap.js`.

For Android you will need to call `RNFS.readFileAssets('sourcemap.js')` instead of `RNFS.readFile`

To use `RNFS`, you will need to install and link [`react-native-fs`](https://github.com/johanneslumpe/react-native-fs),
if you don't already have that in your project.

When a sourcemap is given to `init` it will detect it and activate the source mapper, and then on you'll
get stack traces in Crashlytics that indicate line/column positions and file names that relate to your development
source tree.


