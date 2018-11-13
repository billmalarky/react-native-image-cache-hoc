# React Native Image Cache HOC

[![Build Status](https://travis-ci.org/billmalarky/react-native-image-cache-hoc.svg?branch=master)](https://travis-ci.org/billmalarky/react-native-image-cache-hoc)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/billmalarky/react-native-image-cache-hoc/blob/master/LICENSE)
[![ESLint](https://img.shields.io/badge/eslint-ok-green.svg)](https://github.com/billmalarky/react-native-image-cache-hoc/blob/master/.eslintrc.js)
[![Coverage Status](https://coveralls.io/repos/github/billmalarky/react-native-image-cache-hoc/badge.svg?branch=master)](https://coveralls.io/github/billmalarky/react-native-image-cache-hoc?branch=master)

React Native Higher Order Component that adds advanced caching functionality to the react native Image component.

## Features

* **Drop in Replacement** for native \<Image\> component.
* **Automatically Cache** remote image files to local filesystem to increase performance.
* **Automatically Persist** remote image files to local filesystem _forever_ with a simple component prop flag.

## Installation

```bash
$ npm install --save react-native-image-cache-hoc
```

Or

```bash
$ yarn add react-native-image-cache-hoc
```

Then, because this package has a depedency on [rn-fetch-blob](https://github.com/joltup/rn-fetch-blob) you will need to link this native package by running:

```bash
$ react-native link rn-fetch-blob
```

Linking rn-fetch-blob **should only be done once**, reinstalling node_modules with npm or yarn does not require running the above command again.

To troubleshoot linking, refer to [the rn-fetch-blob installation instructions](https://github.com/joltup/rn-fetch-blob#user-content-installation).

## Usage

React Native Image Cache HOC creates an advanced image component, \<CacheableImage\>, that is a drop in replacement for the standard \<Image\> component. 

**Differences between the advanced image component and standard image component API are as follows:**

1. **Modified "source" Prop:** The advanced component "source" prop only accepts a web accessible url (there's no reason to use this library to render files that already exist on the local filesystem), and it does NOT accept an array of urls.
2. **New "permanent" Prop:** The new, optional (defaults to False), "permanent" prop determines if the image file should be stored forever on the local filesystem instead of written to a temperary cache that is subject to occasional pruning.
3. **New  "placeholder" Prop:** The new, optional (defaults to standard Image component), "placeholder" prop determines component to render while remote image file is downloading.

**TL;DR: To cache image files for performance, simply use \<CacheableImage\> as a drop in replacement for \<Image\>. To store files permanently add a permanent={true} prop to \<CacheableImage\>.**

```js

import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image
} from 'react-native';

import imageCacheHoc from 'react-native-image-cache-hoc';

/**
* Pass the native <Image> component into imageCacheHoc() to create the advanced image component <CacheableImage>.
* 
* imageCacheHoc() takes an options object as the second parameter (refer to options section of README.md)
*/
const CacheableImage = imageCacheHoc(Image, {
  fileHostWhitelist: ['i.redd.it']
});

export default class App extends Component<{}> {
  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.welcome}>Welcome to React Native!</Text>
        <CacheableImage style={styles.image} source={{uri: 'https://i.redd.it/rc29s4bz61uz.png'}} permanent={false} />
      </View>
  );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  image: {
    width:150,
    height: 204
  }
});

```

## Options

React Native Image Cache HOC accepts an options object in order to tweak standard functionality.

```js
imageCacheHoc(Image, {
  
  // Allow http urls. 
  // Defaults to https only.
  validProtocols: ['http', 'https'],
  
  // Use domain host whitelist. 
  // Defaults to allowing urls from all domain hosts.
  fileHostWhitelist: ['localhost', 'i.redd.it'],
  
  // Namespace the directory that stores files to avoid collisions with other app libraries. 
  // Defaults to 'react-native-image-cache-hoc'.
  fileDirName: 'example-app-files-namespace',
  
  // Max size of file cache in bytes before pruning occurs. 
  // Note that cache size can exceed this limit, 
  // but sequential writes to the cache will trigger cache pruning 
  // which will delete cached files until total cache size is below this limit before writing.
  // Defaults to 15 MB.
  cachePruneTriggerLimit: 1024 * 1024 * 10,
  
  // Default placeholder component to render while remote image file is downloading. 
  // Can be overridden with placeholder prop like <CacheableImage placeholder={placeHolderObject} />. 
  //
  // Placeholder Object is structed like:
  // const placeHolderObject = {
  //   component: ReactComponentToUseHere,
  //    props: {
  //      examplePropLikeStyle: componentStylePropValue,
  //      anotherExamplePropLikeSource: componentSourcePropValue
  //   }
  // };
  //
  // Defaults to <Image> component with style prop passed through.
  defaultPlaceholder: {
    component: ActivityIndicator,
    props: {
      style: activityIndicatorStyle
    }
  }
  
});
```

## Using Loading Placeholders

React Native Image Cache HOC allows you to easily supply any component to be used as a placeholder while the remote image file is downloading. While the default placeholder should be great for many use cases, you can easily use your own to match the style of the rest of your app.

```js

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  image: {
    width:150,
    height: 204
  },
  activityIndicatorStyle: {
    width: 150,
    height: 204,
    backgroundColor: '#dc143c'
  }
});

// This placeholder object will be used as a placeholder component for all instances of <CacheableImage> 
// unless individual <CacheableImage> uses "placeholder" prop to override this default.
const defaultPlaceholderObject = {
  component: ActivityIndicator,
  props: {
    style: styles.activityIndicatorStyle
  }
};

// We will use this placeholder object to override the default placeholder.
const propOverridePlaceholderObject = {
  component: Image,
  props: {
    style: styles.image,
    source: {require('./localPlaceholderImage.png')}
  }
};

const CacheableImage = imageCacheHoc(Image, {
  defaultPlaceholder: defaultPlaceholderObject
});

export default class App extends Component<{}> {
  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.welcome}>Welcome to React Native!</Text>
        <CacheableImage style={styles.image} source={{uri: 'https://i.redd.it/rc29s4bz61uz.png'}} />
        <CacheableImage style={styles.image} source={{uri: 'https://i.redd.it/hhhim0kc5swz.jpg'}} placeholder={propOverridePlaceholderObject} />
        <CacheableImage style={styles.image} source={{uri: 'https://i.redd.it/17ymhqwgbswz.jpg'}} />
      </View>
  );
  }
}
```

## Static Methods

The CacheableImage class returned by React Native Image Cache HOC includes a couple of static methods for convenience.

**CacheableImage.cacheFile(url, permanent)**

Use this method if you need to download a file to the local filesystem prior to rendering \<CacheableImage\> for some reason (perhaps to pre-warm the local cache). If calling this method repeatedly to cache a long list of files, be sure to use a queue and limit concurrency so your app performance does not suffer.

```js
import imageCacheHoc from 'react-native-image-cache-hoc';
const CacheableImage = imageCacheHoc(Image);
CacheableImage.cacheFile('https://i.redd.it/17ymhqwgbswz.jpg')
  .then( localFileInfo => {
    console.log(localFileInfo);
    // The https://i.redd.it/17ymhqwgbswz.jpg remote file is now saved to local fs. 
    // Since permanent was not set, this file is subject to cache pruning.
  });

CacheableImage.cacheFile('https://i.redd.it/hhhim0kc5swz.jpg', true)
  .then( localFileInfo => {
    console.log(localFileInfo);
    // The https://i.redd.it/hhhim0kc5swz.jpg remote file is now saved to local fs permanently.
  });
```

**CacheableImage.flush()**

Delete all locally stored image files created by react-native-image-cache-hoc (cache AND permanent). Calling this method will cause a performance hit on your app until the local files are rebuilt.

```js
import imageCacheHoc from 'react-native-image-cache-hoc';
const CacheableImage = imageCacheHoc(Image);
CacheableImage.flush()
  .then( flushResults => {
    console.log(flushResults);
    // All local filles created by 'react-native-image-cache-hoc' are now destroyed. 
    // They will be rebuilt by future <CacheableImage> renders.
  });
```

## Jest Test Support

React Native Image Cache HOC must be run in a native environment to work correctly. As a result it will create issues in your jest tests unless you mock it. Since this module is an HOC that adds additional functionality to the standard \<Image\> component, it can be easily mocked with a function that returns the standard \<Image\> component.

**Add the following to your jest mocks:**

```js
jest.mock('react-native-image-cache-hoc', () => {

  const mockComponent = require('react-native/jest/mockComponent');
  const MockCacheableImage = mockComponent('Image');
  
  // Add mock static methods
  // To see how to use jest.fn() to return mock data in your tests see the following:
  // https://facebook.github.io/jest/docs/en/mock-function-api.html
  MockCacheableImage.cacheFile = jest.fn(); 
  MockCacheableImage.flush = jest.fn();

  return function() {
    return MockCacheableImage;
  }

});
```


## Warning

iOS only allows requests to https urls. If you need to load image files using http you will need to make additional react native config changes.

> By default, iOS will block any request that's not encrypted using SSL. If you need to fetch from a cleartext URL (one that begins with http) you will first need to add an App Transport Security exception. If you know ahead of time what domains you will need access to, it is more secure to add exceptions just for those domains; if the domains are not known until runtime you can disable ATS completely. Note however that from January 2017, Apple's App Store review will require reasonable justification for disabling ATS.

https://facebook.github.io/react-native/docs/network.html