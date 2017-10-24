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

Then, because this package has a depedency on [react-native-fetch-blob](https://github.com/wkh237/react-native-fetch-blob) you will need to link native packages by simply running:

```bash
$ react-native link
```

To troubleshoot native package linking, refer to [the react-native-fetch-blob installation instructions](https://github.com/wkh237/react-native-fetch-blob#user-content-installation).

## Usage

