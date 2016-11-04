"use strict";

/**
 * @Route("GET /option-param")
 */
class OptionParamRoute {
  process(foo) {
    return {foo: foo};
  }
}

module.exports = OptionParamRoute;
