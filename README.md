# React Native Image Cache HOC

[![Build Status](https://travis-ci.org/billmalarky/react-native-image-cache-hoc.svg?branch=master)](https://travis-ci.org/billmalarky/react-native-image-cache-hoc)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/billmalarky/react-native-image-cache-hoc/blob/master/LICENSE)

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

Then, because this package has a depedency on [react-native-fetch-blob](https://github.com/wkh237/react-native-fetch-blob) you will need to link this native package by running:

```bash
$ react-native link react-native-fetch-blob
```

Linking react-native-fetch-blob **should only be done once**, reinstalling node_modules with npm or yarn does not require running the above command again.

To troubleshoot linking, refer to [the react-native-fetch-blob installation instructions](https://github.com/wkh237/react-native-fetch-blob#user-content-installation).

## Usage

TODO

## Warning

iOS only allows requests to https urls. If you need to load image files using http you will need to make additional react native config changes.

> By default, iOS will block any request that's not encrypted using SSL. If you need to fetch from a cleartext URL (one that begins with http) you will first need to add an App Transport Security exception. If you know ahead of time what domains you will need access to, it is more secure to add exceptions just for those domains; if the domains are not known until runtime you can disable ATS completely. Note however that from January 2017, Apple's App Store review will require reasonable justification for disabling ATS.

https://facebook.github.io/react-native/docs/network.html