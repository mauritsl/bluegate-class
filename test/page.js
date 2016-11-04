"use strict";

/**
 * @Route("GET /page/<id:int>")
 */
class PageRoute {
  process(id) {
    return {page: id};
  }
}

module.exports = PageRoute;
