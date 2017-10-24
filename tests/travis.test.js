
// Define globals for eslint.
/* global describe it */
/* global expect */

// Load dependencies
import should from 'should'; // eslint-disable-line no-unused-vars
import React from 'react';
import 'react-native';
import { View, Text } from 'react-native';

// Note: test renderer must be required after react-native.
import renderer from 'react-test-renderer';

// Ensure Travis CI tests are working.
describe('Travis CI Test', function() {

  it('should execute a test.', () => {
    const expectedObject = {
      test: 'value'
    };

    expectedObject.should.deepEqual({
      test: 'value'
    });
  });

  it('renders correctly', () => {

    const tree = renderer.create(
      <View>
        <Text>Test</Text>
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