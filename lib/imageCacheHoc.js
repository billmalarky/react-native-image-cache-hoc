/**
 *
 * This HOC adds the following functionality to react native <Image> components:
 *
 * - File caching. Images will be downloaded to a cache on the local file system.
 *   Cache is maintained until cache size meets a certain threshold at which point the oldest
 *   cached files are purged to make room for fresh files.
 *
 *  - File persistence. Images will be stored indefinitely on local file system.
 *    Required for images that are related to issues that have been downloaded for offline use.
 *
 * More info: https://facebook.github.io/react/docs/higher-order-components.html
 *
 */

// Load dependencies.
import React from 'react';
import { Platform, ViewPropTypes } from 'react-native';
import PropTypes from 'prop-types';
import FileSystemFactory, { FileSystem } from '../lib/FileSystem';
import traverse from 'traverse';
import validator from 'validator';
import uuid from 'react-native-uuid';

export default function imageCacheHoc(Image, options = {}) {

  // Validate options
  if (options.validProtocols && !Array.isArray(options.validProtocols)) { throw new Error('validProtocols option must be an array of protocol strings.'); }
  if (options.fileHostWhitelist && !Array.isArray(options.fileHostWhitelist)) { throw new Error('fileHostWhitelist option must be an array of host strings.'); }
  if (options.cachePruneTriggerLimit && !Number.isInteger(options.cachePruneTriggerLimit) ) { throw new Error('cachePruneTriggerLimit option must be an integer.'); }
  if (options.fileDirName && typeof options.fileDirName !== 'string') { throw new Error('fileDirName option must be string'); }
  if (options.defaultPlaceholder && (!options.defaultPlaceholder.component || !options.defaultPlaceholder.props)) { throw new Error('defaultPlaceholder option object must include "component" and "props" properties (props can be an empty object)'); }

  return class extends React.PureComponent {

    static propTypes = {
      fileHostWhitelist: PropTypes.array,
      source: PropTypes.object.isRequired,
      permanent: PropTypes.bool,
      style: ViewPropTypes.style,
      placeholder: PropTypes.shape({
        component: PropTypes.func,
        props: PropTypes.object
      })
    };

    /**
     *
     * Manually cache a file.
     * Can be used to pre-warm caches.
     * If calling this method repeatedly to cache a long list of files,
     * be sure to use a queue and limit concurrency so your app performance does not suffer.
     *
     * @param url {String} - url of file to download.
     * @param permanent {Boolean} - whether the file should be saved to the tmp or permanent cache directory.
     * @returns {Promise} promise that resolves to an object that contains cached file info.
     */
    static async cacheFile(url, permanent = false) {

      const fileSystem = FileSystemFactory();
      const localFilePath = await fileSystem.getLocalFilePathFromUrl(url, permanent);

      return {
        url: url,
        cacheType: (permanent ? 'permanent' : 'cache'),
        localFilePath
      };

    }

    /**
     *
     * Delete all locally stored image files created by react-native-image-cache-hoc (cache AND permanent).
     * Calling this method will cause a performance hit on your app until the local files are rebuilt.
     *
     * @returns {Promise} promise that resolves to an object that contains the flush results.
     */
    static async flush() {

      const fileSystem = FileSystemFactory();
      const results = await Promise.all([fileSystem.unlink('permanent'), fileSystem.unlink('cache')]);

      return {
        permanentDirFlushed: results[0],
        cacheDirFlushed: results[1]
      };

    }

    constructor(props) {
      super(props);

      // Set initial state
      this.state = {
        localFilePath: null
      };

      // Assign component unique ID for cache locking.
      this.componentId = uuid.v4();

      // Track component mount status to avoid calling setState() on unmounted component.
      this._isMounted = false;

      // Set default options
      this.options = {
        validProtocols: options.validProtocols || ['https'],
        fileHostWhitelist: options.fileHostWhitelist || [],
        cachePruneTriggerLimit: options.cachePruneTriggerLimit || 1024 * 1024 * 15, // Maximum size of image file cache in bytes before pruning occurs. Defaults to 15 MB.
        fileDirName: options.fileDirName || null, // Namespace local file writing to this directory. Defaults to 'react-native-image-cache-hoc'.
        defaultPlaceholder: options.defaultPlaceholder || null, // Default placeholder component to render while remote image file is downloading. Can be overridden with placeholder prop. Defaults to <Image> component with style prop passed through.
      };

      // Init file system lib
      this.fileSystem = FileSystemFactory(this.options.cachePruneTriggerLimit, this.options.fileDirName);

      // Validate input
      this._validateImageComponent();

    }

    _validateImageComponent() {

      // Define validator options
      let validatorUrlOptions = { protocols: this.options.validProtocols, require_protocol: true };
      if (this.options.fileHostWhitelist.length) {
        validatorUrlOptions.host_whitelist = this.options.fileHostWhitelist;
      }

      // Validate source prop to be a valid web accessible url.
      if (
        !traverse(this.props).get(['source', 'uri'])
        || !validator.isURL(traverse(this.props).get(['source', 'uri']), validatorUrlOptions)
      ) {
        throw new Error('Invalid source prop. <CacheableImage> props.source.uri should be a web accessible url with a valid protocol and host. NOTE: Default valid protocol is https, default valid hosts are *.');
      } else {
        return true;
      }

    }

    // Async calls to local FS or network should occur here.
    // See: https://reactjs.org/docs/react-component.html#componentdidmount
    async componentDidMount() {

      // Track component mount status to avoid calling setState() on unmounted component.
      this._isMounted = true;

      // Set url from source prop
      const url = traverse(this.props).get(['source', 'uri']);
      const headers = traverse(this.props).get(['source', 'headers']);

      // Add a cache lock to file with this name (prevents concurrent <CacheableImage> components from pruning a file with this name from cache).
      const fileName = await this.fileSystem.getFileNameFromUrl(url, headers);
      FileSystem.lockCacheFile(fileName, this.componentId);

      // Init the image cache logic
      await this._loadImage(url, headers);

    }

    /**
     *
     * Enables caching logic to work if component source prop is updated (that is, the image url changes without mounting a new component).
     * See: https://github.com/billmalarky/react-native-image-cache-hoc/pull/15
     *
     * @param nextProps {Object} - Props that will be passed to component.
     */
    async componentWillReceiveProps(nextProps) {

      // Set urls from source prop data
      const url = traverse(this.props).get(['source', 'uri']);
      const headers = traverse(this.props).get(['source', 'headers']);
      const nextUrl = traverse(nextProps).get(['source', 'uri']);
      const nextHeaders = traverse(nextProps).get(['source', 'headers']);

      // Do nothing if url has not changed.
      if (url === nextUrl) return;

      // Remove component cache lock on old image file, and add cache lock to new image file.
      const fileName = await this.fileSystem.getFileNameFromUrl(url, headers);
      const nextFileName = await this.fileSystem.getFileNameFromUrl(nextUrl, headers);

      FileSystem.unlockCacheFile(fileName, this.componentId);
      FileSystem.lockCacheFile(nextFileName, this.componentId);

      // Init the image cache logic
      await this._loadImage(nextUrl, nextHeaders);

    }

    /**
     *
     * Executes the image download/cache logic and calls setState() with to re-render
     * component using local file path on completion.
     *
     * @param url {String} - The remote image url.
     * @private
     */
    async _loadImage(url, headers) {

      // Check local fs for file, fallback to network and write file to disk if local file not found.
      const permanent = this.props.permanent ? true : false;
      let localFilePath = null;
      try {
        localFilePath = await this.fileSystem.getLocalFilePathFromUrl(url, permanent, headers);
      } catch (error) {
        console.warn(error); // eslint-disable-line no-console
      }

      // Check component is still mounted to avoid calling setState() on components that were quickly
      // mounted then unmounted before componentDidMount() finishes.
      // See: https://github.com/billmalarky/react-native-image-cache-hoc/issues/6#issuecomment-354490597
      if (this._isMounted && localFilePath) {
        this.setState({ localFilePath });
      }

    }

    async componentWillUnmount() {

      // Track component mount status to avoid calling setState() on unmounted component.
      this._isMounted = false;

      // Remove component cache lock on associated image file on component teardown.
      let fileName = await this.fileSystem.getFileNameFromUrl(traverse(this.props).get(['source', 'uri']), traverse(this.props).get(['source', 'headers']));
      FileSystem.unlockCacheFile(fileName, this.componentId);

    }

    render() {

      // If media loaded, render full image component, else render placeholder.
      if (this.state.localFilePath) {

        // Build platform specific file resource uri.
        const localFileUri = (Platform.OS == 'ios') ? this.state.localFilePath : 'file://' + this.state.localFilePath; // Android requires the traditional 3 prefixed slashes file:/// in a localhost absolute file uri.

        // Extract props proprietary to this HOC before passing props through.
        let { permanent, ...filteredProps } = this.props; // eslint-disable-line no-unused-vars

        let props = Object.assign({}, filteredProps, { source: { uri: localFileUri } });
        return (<Image {...props} />);
      } else {

        if (this.props.placeholder) {
          return (<this.props.placeholder.component {...this.props.placeholder.props} />);
        } else if (this.options.defaultPlaceholder) {
          return (<this.options.defaultPlaceholder.component {...this.options.defaultPlaceholder.props} />);
        } else {
          return (<Image style={this.props.style ? this.props.style : undefined} />);
        }

      }

    }

  };

}
