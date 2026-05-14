import { CONTEXTS_PATHS, contextsSchemas } from "../../bin/mergeSchemas";

test("deployment - bin/mergeSchema", () => {
  it("schemas should be defined", () => {
    const length = CONTEXTS_PATHS.length;
    expect(contextsSchemas.length).toEqual(length);
  });
});
