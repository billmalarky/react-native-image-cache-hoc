
// Define globals for eslint.
/* global describe it require */

// Load dependencies
import should from 'should'; // eslint-disable-line no-unused-vars
import { mockData } from './mockData';
import imageCacheHoc from '../lib/imageCacheHoc';
import { Image } from 'react-native';

describe('CacheableImage', function() {

  it('HOC options validation should work as expected.', () => {

    // Check validation is catching bad option input.
    try {
      imageCacheHoc(Image, {
        validProtocols: 'string'
      });
    } catch (error) {
      error.should.deepEqual(new Error('validProtocols option must be an array of protocol strings.'));
    }

    try {
      imageCacheHoc(Image, {
        fileHostWhitelist: 'string'
      });
    } catch (error) {
      error.should.deepEqual(new Error('fileHostWhitelist option must be an array of host strings.'));
    }

    try {
      imageCacheHoc(Image, {
        cachePruneTriggerLimit: 'string'
      });
    } catch (error) {
      error.should.deepEqual(new Error('cachePruneTriggerLimit option must be an integer.'));
    }

    try {
      imageCacheHoc(Image, {
        fileDirName: 1
      });
    } catch (error) {
      error.should.deepEqual(new Error('fileDirName option must be string'));
    }

    try {
      imageCacheHoc(Image, {
        defaultPlaceholder: 5478329
      });
    } catch (error) {
      error.should.deepEqual(new Error('defaultPlaceholder option object must include "component" and "props" properties (props can be an empty object)'));
    }

    const validOptions = {
      validProtocols: ['http', 'https'],
      fileHostWhitelist: ['i.redd.it', 'localhost'],
      cachePruneTriggerLimit: 1024 * 1024 * 10,
      fileDirName: 'test-dir',
      defaultPlaceholder: {
        component: Image,
        props: {}
      }
    };

    // Valid options shouldn't throw an error
    const CacheableImage = imageCacheHoc(Image, validOptions);

    // Check options are set correctly on component
    const cacheableImage = new CacheableImage(mockData.mockCacheableImageProps);

    cacheableImage.options.should.have.properties(validOptions);

  });

  it('Component property type validation should exist.', () => {

    const CacheableImage = imageCacheHoc(Image);

    Object.keys(CacheableImage.propTypes).should.deepEqual([
      'fileHostWhitelist',
      'source',
      'permanent',
      'style',
      'placeholder'
    ]);

  });

  it('#cacheFile static method should work as expected for cache dir files.', () => {

    // RNFetchBlob Mocks
    const RNFetchBlob = require('react-native-fetch-blob');

    // Mock that file does not exist on local fs.
    RNFetchBlob.fs.exists
      .mockReturnValue(false);

    // Mock fetch result
    RNFetchBlob.fetch
      .mockReturnValue({
        path: () => {
          return '/this/is/path/to/file.jpg';
        }
      });

    const CacheableImage = imageCacheHoc(Image);

    return CacheableImage.cacheFile('https://i.redd.it/rc29s4bz61uz.png')
      .then(result => {

        result.should.deepEqual({
          url: 'https://i.redd.it/rc29s4bz61uz.png',
          cacheType: 'cache',
          localFilePath: '/this/is/path/to/file.jpg'
        });

      });

  });

  it('#cacheFile static method should work as expected for permanent dir files.', () => {

    // RNFetchBlob Mocks
    const RNFetchBlob = require('react-native-fetch-blob');

    // Mock that file does not exist on local fs.
    RNFetchBlob.fs.exists
      .mockReturnValue(false);

    // Mock fetch result
    RNFetchBlob.fetch
      .mockReturnValue({
        path: () => {
          return '/this/is/path/to/file.jpg';
        }
      });

    const CacheableImage = imageCacheHoc(Image);

    return CacheableImage.cacheFile('https://i.redd.it/rc29s4bz61uz.png', true)
      .then(result => {

        result.should.deepEqual({
          url: 'https://i.redd.it/rc29s4bz61uz.png',
          cacheType: 'permanent',
          localFilePath: '/this/is/path/to/file.jpg'
        });

      });

  });

  it('#flush static method should work as expected.', () => {

    // RNFetchBlob Mocks
    const RNFetchBlob = require('react-native-fetch-blob');

    // Mock unlink to always be true.
    RNFetchBlob.fs.unlink
      .mockReturnValue(true);

    const CacheableImage = imageCacheHoc(Image);

    return CacheableImage.flush()
      .then(result => {

        result.should.deepEqual({
          permanentDirFlushed: true,
          cacheDirFlushed: true
        });

      });

  });

  it('#constructor should initialize class object properties correctly.', () => {

    const CacheableImage = imageCacheHoc(Image);

    const cacheableImage = new CacheableImage(mockData.mockCacheableImageProps);

    // Ensure defaults set correctly
    cacheableImage.props.should.have.properties(mockData.mockCacheableImageProps);
    cacheableImage.state.should.have.properties({
      localFilePath: null
    });
    cacheableImage.options.should.have.properties({
      validProtocols: [ 'https' ],
      fileHostWhitelist: [],
      cachePruneTriggerLimit: 15728640,
      fileDirName: null,
      defaultPlaceholder: null
    });
    cacheableImage.fileSystem.should.have.properties({
      os: 'ios',
      cachePruneTriggerLimit: 15728640,
      baseFilePath: mockData.basePath + '/react-native-image-cache-hoc/'
    });

  });

  it('#_validateImageComponent should validate bad component props correctly.', () => {

    // Verify source uri prop only accepts web accessible urls.

    const CacheableImage = imageCacheHoc(Image);

    try {

      const cacheableImage = new CacheableImage({ // eslint-disable-line no-unused-vars
        source: {
          uri: './local-file.jpg'
        }
      });

      throw new Error('Invalid source uri prop was accepted.');
    } catch (error) {
      error.should.deepEqual(new Error('Invalid source prop. <CacheableImage> props.source.uri should be a web accessible url with a valid protocol and host. NOTE: Default valid protocol is https, default valid hosts are *.'));
    }

    // Verify source uri prop only accepts web accessible urls from whitelist if whitelist set.

    const CacheableImageWithOpts = imageCacheHoc(Image, {
      fileHostWhitelist: [ 'i.redd.it' ]
    });

    try {

      const cacheableImageWithOpts = new CacheableImageWithOpts({ // eslint-disable-line no-unused-vars
        source: {
          uri: 'https://www.google.com/logos/doodles/2017/day-of-the-dead-2017-6241959625621504-l.png'
        }
      });

      throw new Error('Invalid source uri prop was accepted.');
    } catch (error) {
      error.should.deepEqual(new Error('Invalid source prop. <CacheableImage> props.source.uri should be a web accessible url with a valid protocol and host. NOTE: Default valid protocol is https, default valid hosts are *.'));
    }

    // Verify source uri prop only accepts web accessible urls from correct protocols if protocol list set.

    const CacheableImageWithProtocolOpts = imageCacheHoc(Image, {
      validProtocols: [ 'http' ]
    });

    try {

      const cacheableImageWithProtocolOpts = new CacheableImageWithProtocolOpts({ // eslint-disable-line no-unused-vars
        source: {
          uri: 'https://www.google.com/logos/doodles/2017/day-of-the-dead-2017-6241959625621504-l.png'
        }
      });

      throw new Error('Invalid source uri prop was accepted.');
    } catch (error) {
      error.should.deepEqual(new Error('Invalid source prop. <CacheableImage> props.source.uri should be a web accessible url with a valid protocol and host. NOTE: Default valid protocol is https, default valid hosts are *.'));
    }

  });

  it('#render with valid props does not throw an error.', () => {

    const CacheableImage = imageCacheHoc(Image);

    const cacheableImage = new CacheableImage(mockData.mockCacheableImageProps);

    cacheableImage.render();

    cacheableImage.state.localFilePath = './test.jpg';

    cacheableImage.render();

  });

});