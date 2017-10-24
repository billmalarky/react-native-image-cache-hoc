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
import FileSystemFactory, { FileSystem } from '../lib/FileSystem';
import traverse from 'traverse';
import validator from 'validator';
import uuid from 'react-native-uuid';

export default function imageCacheHoc(Image, options = {}) {

  return class extends React.Component {

    constructor(props) {
      super(props);

      // Set initial state
      this.state = {
        localFilePath: null
      };

      // Assign component unique ID for cache locking.
      this.componentId = uuid.v4();

      // Set default options
      this.options = {
        validProtocols: options.validProtocols || ['http', 'https'],
        fileHostWhitelist: options.fileHostWhitelist || [],
        cachePruneTriggerLimit: options.cachePruneTriggerLimit || 1024 * 1024 * 15, // Maximum size of image file cache in bytes before pruning occurs. Defaults to 15 MB.
        fileDirName: options.fileDirName || null // Namespace local file writing to this directory. Defaults to 'react-native-image-cache-hoc'.
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
        validatorUrlOptions.host_whitelist = this.props.fileHostWhitelist;
      }

      // Validate source prop to be a valid web accessible url.
      if (
        !traverse(this.props).get(['source', 'uri'])
        || !validator.isURL(traverse(this.props).get(['source', 'uri']), validatorUrlOptions)
      ) {
        throw new Error('Invalid source prop. \<CacheableImage\> props.source.uri should be a web accessible url.');
        return false;
      } else {
        return true;
      }

    }

    // Async calls to local FS or network should occur here.
    // See: https://reactjs.org/docs/react-component.html#componentdidmount
    componentDidMount() {
      let fileName = this.fileSystem.getFileNameFromUrl(traverse(this.props).get(['source', 'uri']));

      // Add a cache lock to file with this name (prevents concurrent <CacheableImage> components from pruning a file with this name from cache).
      FileSystem.lockCacheFile(fileName, this.componentId);

      let permanentFileExists = this.fileSystem.exists('permanent/' + fileName);
      let cacheFileExists = this.fileSystem.exists('cache/' + fileName);

      Promise.all([permanentFileExists, cacheFileExists])
        .then( result => {

          if (result[0]) {
            this.setState({ localFilePath: this.fileSystem.baseFilePath + 'permanent/' + fileName });
          } else if (result[1]) {
            this.setState({ localFilePath: this.fileSystem.baseFilePath + 'cache/' + fileName });
          } else {

            let permanent = this.props.permanent ? true : false;

            this.fileSystem.fetchFile(this.props.source.uri, permanent)
              .then( filePath => {
                this.setState({ localFilePath: filePath });
              });

          }

        });

    }

    componentWillUnmount() {

      // Remove component cache lock on associated image file on component teardown.
      let fileName = this.fileSystem.getFileNameFromUrl(traverse(this.props).get(['source', 'uri']));
      FileSystem.unlockCacheFile(fileName, this.componentId);

    }

    render() {

      // If media loaded, render full image component, else render placeholder.
      if (this.state.localFilePath) {

        // Extract props proprietary to this HOC before passing props through.
        let { permanent, ...filteredProps } = this.props;

        let props = Object.assign({}, filteredProps, { uri: this.state.localFilePath });
        return (<Image {...props} />);
      } else {
        return (<Image style={this.props.style ? this.props.style : undefined} />);
      }

    }

  }

}