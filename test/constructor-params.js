"use strict";

/**
 * @Route("GET /constructor-params")
 */
class ConstructorParamsRoute {
  constructor(request, params) {
    this.foo = params.foo;
    this.request = request;
  }

  process() {
    return {
      foo: this.foo,
      path: this.request.path
    };
  }
}

module.exports = ConstructorParamsRoute;
