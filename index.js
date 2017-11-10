/**
 * Bootstrap.
 *
 * @module imageCacheHoc
 */

'use strict';

import imageCacheHoc from './lib/imageCacheHoc';
import FileSystemFactory, { FileSystem } from './lib/FileSystem';

export default imageCacheHoc;
export { FileSystemFactory, FileSystem }; // Allow access to FS logic for advanced users.