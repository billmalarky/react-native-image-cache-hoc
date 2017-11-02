
// Define globals for eslint.
/* global describe it */
/* global expect */

// Load dependencies
import should from 'should'; // eslint-disable-line no-unused-vars
import React from 'react';
import 'react-native';
import imageCacheHOC from '../lib/imageCacheHoc';
import {
  StyleSheet,
  View,
  Text,
  Image
} from 'react-native';
import { mockData } from './mockData';

// Note: test renderer must be required after react-native.
import renderer from 'react-test-renderer';

// Ensure component can mount successfully.
describe('CacheableImage', function() {

  it('renders correctly', () => {

    const CacheableImage = imageCacheHOC(Image);

    const styles = StyleSheet.create({
      container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
      },
      welcome: {
        fontSize: 20,
        textAlign: 'center',
        margin: 10
      },
      image: {
        width:150,
        height: 204
      }
    });

    const tree = renderer.create(
      <View style={styles.container}>
        <Text style={styles.welcome}>Test CacheableImage Component</Text>
        <CacheableImage style={styles.image} source={{uri: mockData.externalImageResource}} permanent={false} />
      </View>
    );
    expect(tree).toMatchSnapshot(); //If UI changes, this snapshot must be updated. See comment below.

    /**
     The next time you run the tests, the rendered output will be compared to the previously created snapshot.
     The snapshot should be committed along code changes. When a snapshot test fails, you need to inspect whether it is an intended or unintended change.
     If the change is expected you can invoke Jest with npm test -- -u to overwrite the existing snapshot.
     */

  });

});