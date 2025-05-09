/// <reference types="jest" />

import { MediaType } from './shared-types';

describe('sharedTypes', () => {
  it('should have movie media type', () => {
    expect(MediaType.MOVIE).toEqual('movie');
  });
});
