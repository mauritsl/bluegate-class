"use strict";

var AnnotationBase = require('./base');

class ContentType extends AnnotationBase {
  /**
   * Get required callbacks.
   */
  getCallbacks(routeClass) {
    var callbacks = {};
    var value = this.value;
    ['process', 'error'].forEach(stage => {
      if (typeof routeClass.prototype[stage] === 'function') {
        callbacks[stage] = function() {
          this.mime = value;
        };
      }
    });
    return callbacks;
  }
}

module.exports = ContentType;
