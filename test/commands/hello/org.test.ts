import { expect } from 'chai';

describe('easysources plugin', () => {
  it('should have the plugin loaded', () => {
    // Basic sanity test - verify the module can be imported
    const index = require('../../../src/index');
    expect(index).to.not.be.undefined;
  });
});
