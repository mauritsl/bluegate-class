"use strict";

/**
 * @Route("GET /annotation-param", template="test")
 */
class AnnotationParamRoute {
  process(template) {
    return {template: template};
  }
}

module.exports = AnnotationParamRoute;
