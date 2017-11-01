/**
 *
 * Mocked objects for testing.
 *
 */

/* global jest */

jest.mock('react-native-fetch-blob', () => {
  return {
    fs: {
      dirs: {
        CacheDir: 'test'
      }
    },
    DocumentDir: () => {},
    polyfill: () => {},
  };
});