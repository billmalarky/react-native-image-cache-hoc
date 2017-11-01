
// Define globals for eslint.
/* global describe it */

// Load dependencies
import should from 'should'; // eslint-disable-line no-unused-vars
import FileSystemFactory from '../lib/FileSystem';

describe('lib/FileSystem', function() {

  const fileSystem = FileSystemFactory();

  it('#getFileNameFromUrl should create a sha1 filename from a PNG/JPG/GIF url.', () => {

    let pngFilename = fileSystem.getFileNameFromUrl('https://img.wennermedia.com/5333a62d-07db-432a-92e2-198cafa38a14-326adb1a-d8ed-4a5d-b37e-5c88883e1989.png');

    pngFilename.should.equal('cd7d2199cd8e088cdfd9c99fc6359666adc36289.png');

    let gifFilename = fileSystem.getFileNameFromUrl('https://upload.wikimedia.org/wikipedia/commons/2/2c/Rotating_earth_%28large%29.gif');

    gifFilename.should.equal('c048132247cd28c7879ab36d78a8f45194640006.gif');

    let jpgFilename = fileSystem.getFileNameFromUrl('https://cdn2.hubspot.net/hub/42284/file-14233687-jpg/images/test_in_red.jpg');

    jpgFilename.should.equal('6adf4569ecc3bf8c378bb4d47b1995cd85c5a13c.jpg');

  });

});