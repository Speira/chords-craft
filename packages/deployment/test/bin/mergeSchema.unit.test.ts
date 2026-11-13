import { CONTEXTS_PATHS, contextsSchemas, mergeSchemas } from '../../bin/mergeSchemas';

describe('bin/mergeSchemas', () => {
  it('reads a schema for every context', () => {
    expect(contextsSchemas).toHaveLength(CONTEXTS_PATHS.length);
  });

  it('merges the root types of several contexts into one', () => {
    const merged = mergeSchemas([
      'type Query { a: Int }',
      'type Query { b: Int }\ntype Mutation { c: Int }',
    ]);

    expect(merged.match(/type Query/g)).toHaveLength(1);
    expect(merged.match(/type Mutation/g)).toHaveLength(1);
    expect(merged).toContain('a: Int');
    expect(merged).toContain('b: Int');
  });
});
