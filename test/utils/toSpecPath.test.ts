import * as assert from "assert";

import toSpecPath from "../../src/utils/toSpecPath";

suite("toSpecPath", () => {
  test("Converting shallow path", () => {
    assert.strictEqual(
      toSpecPath("app/controllers/test_controller.rb", "spec", ".", ["app"]),
      "./spec/controllers/test_controller_spec.rb"
    );
  });

  test("Converting deep path", () => {
    assert.strictEqual(
      "./spec/controllers/namespaces/admin/test_controller_spec.rb",
      toSpecPath("app/controllers/namespaces/admin/test_controller.rb", "spec", ".", ["app"])
    );
  });

  test("Converting shallow lib path", () => {
    assert.strictEqual(toSpecPath("lib/test.rb", "spec", ".", ["app", "lib"]), "./spec/lib/test_spec.rb");
  });

  test("Converting deep lib path", () => {
    assert.strictEqual(
      toSpecPath("lib/capistrano/tasks/test.rb", "spec", ".", ["app", "lib"]),
      "./spec/lib/capistrano/tasks/test_spec.rb"
    );
  });

  test("Converting spec path with . prefix should be no-op", () => {
    assert.strictEqual(
      toSpecPath("./spec/controllers/namespaces/admin/test_controller_spec.rb", "spec", ".", ["app"]),
      "./spec/controllers/namespaces/admin/test_controller_spec.rb"
    );
  });

  test("Converting spec path without ./ prefix should add ./", () => {
    assert.strictEqual(
      toSpecPath("spec/controllers/namespaces/admin/test_controller_spec.rb", "spec", ".", ["app"]),
      "./spec/controllers/namespaces/admin/test_controller_spec.rb"
    );
  });

  test("Converting nested rails root", () => {
    assert.strictEqual(
      toSpecPath("core/app/controllers/test_controller.rb", "spec", ".", ["app"]),
      "./core/spec/controllers/test_controller_spec.rb"
    );
  });

  test("Rails app is in subfolder", () => {
    assert.strictEqual(
      toSpecPath("app/controllers/test_controller.rb", "spec", "rails_app", ["app"]),
      "./rails_app/spec/controllers/test_controller_spec.rb"
    );
  });
});
