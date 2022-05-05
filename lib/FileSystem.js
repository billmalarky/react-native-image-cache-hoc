/**
 *
 * This library acts as an interface to abstract the OS file system and is platform independent.
 *
 * File paths passed into this library should be relative, as the base file path is different
 * across platforms, and therefore is automatically set by this library.
 *
 */

import { Platform } from 'react-native';
import pathLib from 'path';
import RNFetchBlob from 'rn-fetch-blob';
import sha1 from 'crypto-js/sha1';
import URL from 'url-parse';

export class FileSystem {

  /**
   * All FileSystem instances will reference the cacheLock singleton "dictionary" to provide cache file locking in order to prevent concurrency race condition bugs.
   *
   * cacheLock structure:
   *
   * cacheLock = {
   *   'filename.jpg': {
   *     'componentIdOne': true,
   *     'componentIdTwo': true
   *   }
   * }
   *
   * In the above example cache/filename.jpg cannot be deleted during cache pruning,
   * until both components release their locks on the dependant image file.
   *
   * One example (of many) of how a race condition could occur:
   *
   * 1st <CacheableImage> mounts and downloads image file into cache, calls render() (or not) etc.
   * 2nd <CacheableImage> mounts concurrently and during download runs pruneCache(), deleting 1st <CacheableImage>'s image file from cache.
   * 1st <CacheableImage> calls render() again at some point in the future, at this time it's image file no longer exists so the render fails.
   */
  static cacheLock = {};

  static lockCacheFile(fileName, componentId) {

    // If file is already locked, add additional component lock, else create initial file lock.
    if (FileSystem.cacheLock[fileName]) {
      FileSystem.cacheLock[fileName][componentId] = true;
    } else {
      let componentDict = {};
      componentDict[componentId] = true;
      FileSystem.cacheLock[fileName] = componentDict;
    }

  }

  static unlockCacheFile(fileName, componentId) {

    // Delete component lock on cache file
    if (FileSystem.cacheLock[fileName]) {
      delete FileSystem.cacheLock[fileName][componentId];
    }

    // If no further component locks remain on cache file, delete filename property from cacheLock dictionary.
    if (FileSystem.cacheLock[fileName] && Object.keys(FileSystem.cacheLock[fileName]).length === 0) {
      delete FileSystem.cacheLock[fileName];
    }

  }

  constructor(cachePruneTriggerLimit = null, fileDirName = null) {
    this.os = Platform.OS;
    this.cachePruneTriggerLimit = cachePruneTriggerLimit || 1024 * 1024 * 15; // Maximum size of image file cache in bytes before pruning occurs. Defaults to 15 MB.
    fileDirName = fileDirName || 'react-native-image-cache-hoc'; // Namespace local file writing to this folder.
    this.baseFilePath = this._setBaseFilePath(fileDirName);
  }

  /**
   *
   * Sets the base file directory depending on platform. Prefix is used to avoid local file collisions.
   *
   * Apple:
   * Apple requires non-user generated files to be stored in cache dir, they can be flagged to persist. https://developer.apple.com/icloud/documentation/data-storage/index.html
   * it appears reactNativeFetchBlob will flag these files to persist behind the scenes, so cache dir is safe on apple. See: https://www.npmjs.com/package/rn-fetch-blob#cache-file-management
   *
   * Android:
   * Android appears to purge cache dir files so we should use document dir to play it safe (even with reactNativeFetchBlob abstraction) : https://developer.android.com/guide/topics/data/data-storage.html
   *
   * @returns {String} baseFilePath - base path that files are written to in local fs.
   * @private
   */
  _setBaseFilePath(fileDirName = null) {
    let baseFilePath = (this.os == 'ios') ? RNFetchBlob.fs.dirs.CacheDir : RNFetchBlob.fs.dirs.DocumentDir;
    baseFilePath +=  '/' + fileDirName + '/';
    return baseFilePath;
  }

  /**
   *
   * Pseudo-chroot paths to the baseFilePath set in _setBaseFilePath().
   *
   * This method should be called on any passed in path to prevent writing to invalid directories.
   * IE passing in a path of '../../../../../home/should/not/write/here/file.png' to break out of
   * the base file path directory.
   *
   * @param path {String} - local fs path.
   * @param absolute {String} - whether or not the passed in path is absolute or relative. Defaults to relative since base path differs across platforms.
   * @returns {boolean} - Whether or not the file path is valid.
   * @throws error on bad filepath.
   * @private
   */
  _validatePath(path, absolute = false) {
    let resolvedPath = (absolute) ? pathLib.resolve(path) : pathLib.resolve(this.baseFilePath + path); // resolve turns any path into an absolute path (ie: /folder1/folder2/../example.js resolves to /folder1/example.js)

    if (resolvedPath.substr(0, this.baseFilePath.length) != this.baseFilePath) {
      throw new Error(resolvedPath + ' is not a valid file path.');
    } else {
      return true;
    }

  }

  /**
   *
   * Wrapper for https://github.com/joltup/rn-fetch-blob/wiki/File-System-Access-API#existspathstringpromise
   *
   * @param path - local relative file path.
   * @returns {Promise} - boolean promise for if file exists at path or not.
   */
  exists(path) {
    this._validatePath(path);
    return RNFetchBlob.fs.exists(pathLib.resolve(this.baseFilePath + path));
  }

  /**
   *
   * Creates a SHA1 hash filename from a url and normalizes extension.
   *
   * @param url {String} - An absolute url.
   * @throws error on invalid (non jpg, png, gif, bmp) url file type. NOTE file extension or content-type header does not guarantee file mime type. We are trusting that it is set correctly on the server side.
   * @returns fileName {string} - A SHA1 filename that is unique to the resource located at passed in URL and includes an appropriate extension.
   */
  async getFileNameFromUrl(url) {

    const urlParts = new URL(url);
    const urlExt = urlParts.pathname.split('.').pop();

    let extension = null;
    switch(urlExt) {
      case 'png':
      case 'PNG':
        extension = 'png';
        break;
      case 'gif':
      case 'GIF':
        extension = 'gif';
        break;
      case 'jpg':
      case 'JPG':
      case 'jpeg':
      case 'JPEG':
        extension = 'jpg';
        break;
      case 'BMP':
      case 'bmp':
        extension = 'bmp';
        break;
      default:
        extension = await this.getExtensionFromContentTypeHeader(url);
    }

    if (!extension) {
      throw new Error('Unable to determine remote image filetype.');
    }

    return sha1(url).toString() + '.' + extension;

  }

  /**
   *
   * Used to determine appropriate file extension for a remote file that doesn't include
   * an extension in the url. This method will attempt to determine extension using server
   * "Content-Type" response header.
   *
   * @param url {String} - An absolute url.
   * @returns extension {string} - A file extension appropriate for remote file.
   */
  async getExtensionFromContentTypeHeader(url) {

    let extension = null;
    let contentType = null;

    // Request "Content-type" header from server.
    try{

      const response = await fetch(url, {
        method: 'HEAD'
      });

      if (response.headers.get('content-type')) {
        const rawContentType = response.headers.get('content-type'); // headers are case-insensitive, fetch standard is all lower case.
        contentType = rawContentType.toLowerCase();
      }

    } catch (error) {
      console.warn(error); // eslint-disable-line no-console
    }

    // Use content type header to determine extension.
    switch(contentType) {
      case 'image/png':
        extension = 'png';
        break;
      case 'image/gif':
        extension = 'gif';
        break;
      case 'image/jpeg':
        extension = 'jpg';
        break;
      case 'image/bmp':
        extension = 'bmp';
        break;
      default:
        extension = null;
    }

    return extension;

  }

  /**
   *
   * Convenience method used to get the associated local file path of a web image that has been written to disk.
   * If the local file does not exist yet, the remote file is downloaded to local disk then the local filepath is returned.
   *
   * @param url {String} - url of file to download.
   * @param permanent {Boolean} - True persists the file locally indefinitely, false caches the file temporarily (until file is removed during cache pruning).
   * @returns {Promise} promise that resolves to the local file path of downloaded url file.
   */
  async getLocalFilePathFromUrl(url, permanent) {

    let filePath = null;

    let fileName = await this.getFileNameFromUrl(url);

    let permanentFileExists = this.exists('permanent/' + fileName);
    let cacheFileExists = this.exists('cache/' + fileName);

    let exists = await Promise.all([permanentFileExists, cacheFileExists]);

    if (exists[0]) {

      filePath = this.baseFilePath + 'permanent/' + fileName;

    } else if (exists[1]) {

      filePath = this.baseFilePath + 'cache/' + fileName;

    } else {

      let result = await this.fetchFile(url, permanent, null, true); // Clobber must be true to allow concurrent CacheableImage components with same source url (ie: bullet point images).
      filePath = result.path;

    }

    return filePath;

  }

  /**
   *
   * Used to download files to local filesystem.
   *
   * @param url {String} - url of file to download.
   * @param permanent {Boolean} - True persists the file locally indefinitely, false caches the file temporarily (until file is removed during cache pruning).
   * @param fileName {String} - defaults to a sha1 hash of the url param with extension of same filetype.
   * @param clobber {String} - whether or not to overwrite a file that already exists at path. defaults to false.
   * @returns {Promise} promise that resolves to an object that contains the local path of the downloaded file and the filename.
   */
  async fetchFile(url, permanent = false, fileName = null, clobber = false) {

    fileName = fileName || await this.getFileNameFromUrl(url);
    let path = this.baseFilePath + (permanent ? 'permanent' : 'cache') + '/' + fileName;
    this._validatePath(path, true);

    // Clobber logic
    let fileExistsAtPath = await this.exists((permanent ? 'permanent/' : 'cache/') + fileName);
    if (!clobber && fileExistsAtPath) {
      throw new Error('A file already exists at ' + path + ' and clobber is set to false.');
    }

    // Logic here prunes cache directory on "cache" writes to ensure cache doesn't get too large.
    if (!permanent) {
      await this.pruneCache();
    }

    // Hit network and download file to local disk.
    let result = null;
    const incompleteFilePath = path + '.incomplete';

    try {
      result = await RNFetchBlob
        .config({
          path: incompleteFilePath
        })
        .fetch('GET', url);

      if (result) {
        await RNFetchBlob.fs.mv(incompleteFilePath, path);
      }
    } catch(error) {

      // File must be manually removed on download error https://github.com/wkh237/react-native-fetch-blob/issues/331
      await RNFetchBlob.fs.unlink(incompleteFilePath);
      throw error;

    }

    return {
      path,
      fileName: pathLib.basename(path)
    };

  }

  /**
   * Used to remove files from cache directory if the cache grows too large.
   * This function will delete files from the cache until the total cache size
   * is less than FileSystem.cachePruneTriggerLimit setting.
   *
   * @returns {Promise}
   */
  async pruneCache() {

    // If cache directory does not exist yet there's no need for pruning.
    if (!await this.exists('cache')) {
      return;
    }

    // Get blobStatObjects.
    let lstat = await RNFetchBlob.fs.lstat(this.baseFilePath + 'cache');

    // Sort blobStatObjects in order of oldest to newest file.
    lstat.sort((a, b) => {
      return a.lastModified - b.lastModified;
    });

    let currentCacheSize = lstat.reduce((cacheSize, blobStatObject) => {
      return cacheSize + parseInt(blobStatObject.size);
    }, 0);

    // Prune cache if current cache size is too big.
    if (currentCacheSize > this.cachePruneTriggerLimit) {

      let overflowSize = currentCacheSize - this.cachePruneTriggerLimit;

      // Keep deleting cached files so long as the current cache size is larger than the size required to trigger cache pruning, or until
      // all cache files have been evaluated.
      while (overflowSize > 0 && lstat.length) {

        let blobStatObject = lstat.shift();

        // Only prune unlocked files from cache
        if (!FileSystem.cacheLock[blobStatObject.filename] && this._validatePath('cache/' + blobStatObject.filename)) {
          overflowSize = overflowSize - parseInt(blobStatObject.size);
          RNFetchBlob.fs.unlink(this.baseFilePath + 'cache/' + blobStatObject.filename);
        }

      }

    }

  }

  /**
   * Used to delete local files and directories
   *
   * @param path - local relative file path.
   * @returns {Promise} - boolean promise for if deletion was successful.
   */
  async unlink(path) {
    this._validatePath(path);

    try {
      await RNFetchBlob.fs.unlink(pathLib.resolve(this.baseFilePath + path));
      return true;
    } catch (error) {
      return false;
    }

  }

}

/**
 *  Export FileSystem factory for convenience.
 *
 * @returns {FileSystem}
 */
export default function FileSystemFactory(cachePruneTriggerLimit = null, fileDirName = null) {
  if (!(this instanceof FileSystem)) {
    return new FileSystem(cachePruneTriggerLimit, fileDirName);
  }
}
