/**
 *
 * Mocked objects for testing.
 *
 */

/* global jest require */

/**
 * Override native modules with mocks where necessary.
 */
jest.mock('react-native', () => {

  let ReactNative = require.requireActual('react-native');

  ReactNative.Platform.OS = 'ios';

  return ReactNative;

});

jest.mock('react-native-fetch-blob', () => {

  const { mockData } = require('./mockData');

  // Define mock object before returning so it can reference itself to resolve method chains.
  let mockRNFetchBlob = {
    fs: {
      dirs: {
        CacheDir: mockData.basePath,
        DocumentDir: mockData.basePath
      },
      exists: () => { return true; },
      lstat: () => {

        let lstat = [
          {'size':'43663','path':mockData.basePath + '/cache/0fbbfec764c73ee5b4e3a0cb8861469bc9fc6c8c.jpg','filename':'0fbbfec764c73ee5b4e3a0cb8861469bc9fc6c8c.jpg','lastModified':1508878829000,'type':'file'},
          {'size':'88937','path':mockData.basePath + '/cache/6865fd0a65771b0044319f562873cc7b145abb4a.jpg','filename':'6865fd0a65771b0044319f562873cc7b145abb4a.jpg','lastModified':1508877930000,'type':'file'},
          {'size':'14133330','path':mockData.basePath + '/cache/b003269c377af6a2f53f59bc127a06c86f54312b.jpg','filename':'b003269c377af6a2f53f59bc127a06c86f54312b.jpg','lastModified':1508877698000,'type':'file'},
          {'size':'1684','path':mockData.basePath + '/cache/d1052b9f22c1f00f4d658224f4295307b97db69f.jpg','filename':'d1052b9f22c1f00f4d658224f4295307b97db69f.jpg','lastModified':1508877954000,'type':'file'},
          {'size':'65769','path':mockData.basePath + '/cache/faf4e58257d988ea6eab23aee5e5733bff9b2a9e.jpg','filename':'faf4e58257d988ea6eab23aee5e5733bff9b2a9e.jpg','lastModified':1509634852000,'type':'file'}
        ];

        return lstat;

      }
    }
  };

  mockRNFetchBlob.config = () => {
    return mockRNFetchBlob; // Must return reference to self to support method chaining.
  };

  mockRNFetchBlob.fetch = () => {
    return {
      path: () => {
        return '/this/is/path/to/file.jpg';
      }
    };
  };

  return mockRNFetchBlob;

});