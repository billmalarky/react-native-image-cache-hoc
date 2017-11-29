
// Define globals for eslint.
/* global describe it require */

// Load dependencies
import should from 'should'; // eslint-disable-line no-unused-vars
import FileSystemFactory, { FileSystem } from '../lib/FileSystem';
import pathLib from 'path';
import { mockData } from './mockData';

describe('lib/FileSystem', function() {

  // Test static class properties and methods
  it('FileSystem class cache locking logic should work as expected.', () => {

    // Cache lock should default to empty
    FileSystem.cacheLock.should.deepEqual({});

    // Adding files to cache lock should work as expected.
    FileSystem.lockCacheFile('test-file-name.jpg', 'arbitrary-uuid-1');
    FileSystem.lockCacheFile('test-file-name.jpg', 'arbitrary-uuid-2');
    FileSystem.cacheLock.should.deepEqual({
      'test-file-name.jpg': {
        'arbitrary-uuid-1': true,
        'arbitrary-uuid-2': true
      }
    });

    // Unlocking cache files should work as expected.
    FileSystem.unlockCacheFile('test-file-name.jpg', 'arbitrary-uuid-1');
    FileSystem.unlockCacheFile('test-file-name.jpg', 'arbitrary-uuid-2');
    FileSystem.cacheLock.should.deepEqual({});

  });

  it('#constructor should initialize object properties correctly.', () => {

    const fileSystem = FileSystemFactory();

    fileSystem.should.have.properties({
      os: 'ios',
      cachePruneTriggerLimit: 15728640,
      baseFilePath: mockData.basePath + '/react-native-image-cache-hoc/'
    });

  });

  it('#_setBaseFilePath should set a base filepath correctly.', () => {

    const fileSystem = FileSystemFactory();

    fileSystem._setBaseFilePath('test-file-dir-name').should.equal(mockData.basePath + '/test-file-dir-name/');

  });

  it('#_validatePath should validate the file path is safe.', () => {

    const fileSystem = FileSystemFactory();

    let badPath = '../../../../badpath';

    try {
      fileSystem._validatePath(badPath);
    } catch (error) {
      let resolvedPath = pathLib.resolve(mockData.basePath + '/react-native-image-cache-hoc/' + badPath);
      error.should.deepEqual(new Error(resolvedPath + ' is not a valid file path.'));
    }

    let goodPath = 'safe/path';

    fileSystem._validatePath(goodPath).should.be.true();

  });

  it('#exists mocked as true.', () => {

    const RNFetchBlob = require('react-native-fetch-blob');
    RNFetchBlob.fs.exists
      .mockReturnValue(true);

    const fileSystem = FileSystemFactory();

    fileSystem.exists('abitrary-file.jpg').should.be.true();

  });

  it('#getFileNameFromUrl should create a sha1 filename from a PNG/JPG/GIF/BMP url.', () => {

    const fileSystem = FileSystemFactory();

    let pngFilename = fileSystem.getFileNameFromUrl('https://img.wennermedia.com/5333a62d-07db-432a-92e2-198cafa38a14-326adb1a-d8ed-4a5d-b37e-5c88883e1989.png');

    pngFilename.should.equal('cd7d2199cd8e088cdfd9c99fc6359666adc36289.png');

    let gifFilename = fileSystem.getFileNameFromUrl('https://upload.wikimedia.org/wikipedia/commons/2/2c/Rotating_earth_%28large%29.gif');

    gifFilename.should.equal('c048132247cd28c7879ab36d78a8f45194640006.gif');

    let jpgFilename = fileSystem.getFileNameFromUrl('https://cdn2.hubspot.net/hub/42284/file-14233687-jpg/images/test_in_red.jpg');

    jpgFilename.should.equal('6adf4569ecc3bf8c378bb4d47b1995cd85c5a13c.jpg');

    let bmpFilename = fileSystem.getFileNameFromUrl('https://cdn-learn.adafruit.com/assets/assets/000/010/147/original/tiger.bmp');

    bmpFilename.should.equal('282fb62d2caff367aff828ce21e79575733605c8.bmp');

  });

  it('#getFileNameFromUrl should handle urls with same pathname but different query strings or fragments as individual files.', () => {

    const fileSystem = FileSystemFactory();

    const pngFilename = fileSystem.getFileNameFromUrl('https://img.wennermedia.com/5333a62d-07db-432a-92e2-198cafa38a14-326adb1a-d8ed-4a5d-b37e-5c88883e1989.png?exampleparam=one&anotherparam=2#this-is-a-fragment');

    pngFilename.should.equal('9eea25bf871c2333648080180f6b616a91ce1b09.png');

    const pngFilenameTwo = fileSystem.getFileNameFromUrl('https://img.wennermedia.com/5333a62d-07db-432a-92e2-198cafa38a14-326adb1a-d8ed-4a5d-b37e-5c88883e1989.png?exampleparam=DIFFERENT&anotherparam=2#this-is-a-fragment-two');

    pngFilenameTwo.should.equal('09091b8880ddb982968a0fe28abed5034f9a43b8.png');

  });

  it('#getLocalFilePathFromUrl should return local filepath if it exists on local fs in permanent dir.', () => {

    const RNFetchBlob = require('react-native-fetch-blob');
    RNFetchBlob.fs.exists
      .mockReturnValueOnce(true) // mock exist in local permanent dir
      .mockReturnValue(true);

    const fileSystem = FileSystemFactory();

    return fileSystem.getLocalFilePathFromUrl('https://img.wennermedia.com/5333a62d-07db-432a-92e2-198cafa38a14-326adb1a-d8ed-4a5d-b37e-5c88883e1989.png')
      .then( localFilePath => {
        localFilePath.should.equal(mockData.basePath + '/react-native-image-cache-hoc/permanent/cd7d2199cd8e088cdfd9c99fc6359666adc36289.png');
      });

  });

  it('#getLocalFilePathFromUrl should return local filepath if it exists on local fs in cache dir.', () => {

    const RNFetchBlob = require('react-native-fetch-blob');
    RNFetchBlob.fs.exists
      .mockReturnValueOnce(false) // mock not exist in local permanent dir
      .mockReturnValueOnce(true) // mock exist in local cache dir
      .mockReturnValue(true);

    const fileSystem = FileSystemFactory();

    return fileSystem.getLocalFilePathFromUrl('https://img.wennermedia.com/5333a62d-07db-432a-92e2-198cafa38a14-326adb1a-d8ed-4a5d-b37e-5c88883e1989.png')
      .then( localFilePath => {
        localFilePath.should.equal(mockData.basePath + '/react-native-image-cache-hoc/cache/cd7d2199cd8e088cdfd9c99fc6359666adc36289.png');
      });

  });

  it('#getLocalFilePathFromUrl should download file and write to disk (default to cache dir) if it does not exist on local fs.', () => {

    const RNFetchBlob = require('react-native-fetch-blob');
    RNFetchBlob.fs.exists
      .mockReturnValueOnce(false) // mock not exist in local permanent dir
      .mockReturnValueOnce(false) // mock not exist in local cache dir
      .mockReturnValueOnce(false) // mock does not exist to get past clobber
      .mockReturnValue(true);

    RNFetchBlob.fetch
      .mockReturnValue({
        path: () => {
          return '/this/is/path/to/file.jpg';
        }
      });

    const fileSystem = FileSystemFactory();

    return fileSystem.getLocalFilePathFromUrl('https://img.wennermedia.com/5333a62d-07db-432a-92e2-198cafa38a14-326adb1a-d8ed-4a5d-b37e-5c88883e1989.png')
      .then( localFilePath => {
        localFilePath.should.equal('/this/is/path/to/file.jpg');
      });

  });

  it('#fetchFile should validate path.', () => {

    const fileSystem = FileSystemFactory();

    let badFileName = '../../../../bad-filename.jpg';

    return fileSystem.fetchFile('https://google.com/arbitrary.jpg', true, badFileName)
      .then(() => {
        throw new Error('Bad file name was not caught.');
      })
      .catch((error) => {
        let resolvedPath = pathLib.resolve(mockData.basePath + '/react-native-image-cache-hoc/permanent/' + badFileName);
        error.should.deepEqual(new Error(resolvedPath + ' is not a valid file path.'));
      });

  });

  it('#fetchFile clobber safeguard should work.', () => {

    const fileSystem = FileSystemFactory();

    const RNFetchBlob = require('react-native-fetch-blob');
    RNFetchBlob.fetch
      .mockReturnValue({
        path: () => {
          return '/this/is/path/to/file.jpg';
        }
      });

    // fileSystem.exists() is mocked to always return true, so error should always be thrown unless clobber is set to true.
    return fileSystem.fetchFile('https://img.wennermedia.com/5333a62d-07db-432a-92e2-198cafa38a14-326adb1a-d8ed-4a5d-b37e-5c88883e1989.png')
      .then(() => {
        throw new Error('Clobber logic failed, a file was overwritten.');
      })
      .catch((error) => {
        error.should.deepEqual(new Error('A file already exists at '+ mockData.basePath +'/react-native-image-cache-hoc/cache/cd7d2199cd8e088cdfd9c99fc6359666adc36289.png and clobber is set to false.'));
      });

  });

  it('#fetchFile prune logic should not be called on permanent writes.', () => {

    const fileSystem = FileSystemFactory();

    const RNFetchBlob = require('react-native-fetch-blob');
    RNFetchBlob.fetch
      .mockReturnValue({
        path: () => {
          return '/this/is/path/to/file.jpg';
        }
      });

    let pruneCacheHit = false;

    // Mock fileSystem.pruneCache() to determine if it is called correctly.
    fileSystem.pruneCache = () => {
      pruneCacheHit = true;
    };

    // fileSystem.exists() is mocked to always return true, so error should always be thrown unless clobber is set to true.
    return fileSystem.fetchFile('https://img.wennermedia.com/5333a62d-07db-432a-92e2-198cafa38a14-326adb1a-d8ed-4a5d-b37e-5c88883e1989.png', true, null, true)
      .then(() => {
        pruneCacheHit.should.be.false();
      });

  });

  it('#fetchFile prune logic should be called on cache writes.', () => {

    const fileSystem = FileSystemFactory();

    const RNFetchBlob = require('react-native-fetch-blob');
    RNFetchBlob.fetch
      .mockReturnValue({
        path: () => {
          return '/this/is/path/to/file.jpg';
        }
      });

    let pruneCacheHit = false;

    // Mock fileSystem.pruneCache() to determine if it is called correctly.
    fileSystem.pruneCache = () => {
      pruneCacheHit = true;
    };

    // fileSystem.exists() is mocked to always return true, so error should always be thrown unless clobber is set to true.
    return fileSystem.fetchFile('https://img.wennermedia.com/5333a62d-07db-432a-92e2-198cafa38a14-326adb1a-d8ed-4a5d-b37e-5c88883e1989.png', false, null, true)
      .then(() => {
        pruneCacheHit.should.be.true();
      });

  });

  it('#fetchFile should work as expected.', () => {

    const fileSystem = FileSystemFactory();

    const RNFetchBlob = require('react-native-fetch-blob');
    RNFetchBlob.fetch
      .mockReturnValue({
        path: () => {
          return '/this/is/path/to/file.jpg';
        }
      });

    // Mock fileSystem.pruneCache().
    fileSystem.pruneCache = () => {};

    // fileSystem.exists() is mocked to always return true, so error should always be thrown unless clobber is set to true.
    return fileSystem.fetchFile('https://img.wennermedia.com/5333a62d-07db-432a-92e2-198cafa38a14-326adb1a-d8ed-4a5d-b37e-5c88883e1989.png', false, null, true)
      .then((result) => {

        result.should.deepEqual({
          path: '/this/is/path/to/file.jpg',
          fileName: 'cd7d2199cd8e088cdfd9c99fc6359666adc36289.png'
        });

      });

  });

  it('#pruneCache should not throw errors.', () => {

    const fileSystem = FileSystemFactory();

    return fileSystem.pruneCache();

  });

  it('#unlink should only accept valid paths.', () => {

    const fileSystem = FileSystemFactory();

    const badFileName = '/../../../../../bad-file-name.jpg';

    return fileSystem.unlink(badFileName)
      .then(() => {
        throw new Error('Bad file path was accepted.');
      })
      .catch((error) => {
        let resolvedPath = pathLib.resolve(mockData.basePath + badFileName);

        error.should.deepEqual(new Error(resolvedPath + ' is not a valid file path.'));
      });

  });

  it('#unlink should work as expected for valid paths.', () => {

    // RNFetchBlob Mocks
    const RNFetchBlob = require('react-native-fetch-blob');

    // Mock unlink to be true.
    RNFetchBlob.fs.unlink
      .mockReturnValueOnce(true);

    const fileSystem = FileSystemFactory();

    const validPath = '/permanent/valid.jpg';

    return fileSystem.unlink(validPath)
      .then( result => {
        result.should.be.true();
      });

  });

});