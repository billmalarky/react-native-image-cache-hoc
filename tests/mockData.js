/**
 *
 * Store dummy data in external module so it can be required into jest.mock() scope.
 *
 * More info: https://github.com/facebook/jest/issues/2567
 *
 */
export const mockData = {
  basePath: '/base/file/path',
  mockCacheableImageProps: {
    source: {
      uri: 'https://i.redd.it/rc29s4bz61uz.png'
    },
    permanent: false
  }
};