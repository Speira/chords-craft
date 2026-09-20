import { CONTEXTS_PATHS, contextsSchemas } from '../../bin/mergeSchemas';

it('deployment - bin/mergeSchema', () => {
  it('schemas should be defined', () => {
    const length = CONTEXTS_PATHS.length;
    expect(contextsSchemas.length).toEqual(length);
  });
});
