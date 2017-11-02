
// Define globals for eslint.
/* global describe it */

// Load dependencies
import should from 'should'; // eslint-disable-line no-unused-vars
import { mockData } from './mockData';
import imageCacheHoc from '../lib/imageCacheHoc';
import { Image } from 'react-native';

describe('CacheableImage', function() {

  it('Component property type validation should exist.', () => {

    const CacheableImage = imageCacheHoc(Image);

    Object.keys(CacheableImage.propTypes).should.deepEqual([
      'fileHostWhitelist',
      'source',
      'permanent',
      'style'
    ]);

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
      fileDirName: null
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
      error.should.deepEqual(new Error('Invalid source prop. <CacheableImage> props.source.uri should be a web accessible url.'));
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
      error.should.deepEqual(new Error('Invalid source prop. <CacheableImage> props.source.uri should be a web accessible url.'));
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
      error.should.deepEqual(new Error('Invalid source prop. <CacheableImage> props.source.uri should be a web accessible url.'));
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