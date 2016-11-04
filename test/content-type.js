"use strict";

/**
 * @Route("GET /content-type")
 * @ContentType("application/test")
 */
class ContentTypeRoute {
  process() {
    return new Buffer('test');
  }
}

module.exports = ContentTypeRoute;
