"use strict";

var AnnotationBase = require('./base');

class Header extends AnnotationBase {
  /**
   * Get required callbacks.
   */
  getCallbacks(routeClass) {
    var self = this;
    return {
      initialize: function() {
        var options = self.options;
        if (typeof options['default'] === 'undefined') {
          options['default'] = null;
        }
        var name = self.value;
        if (typeof options.alias === 'string') {
          name = options.alias;
        }
        var value = this.headers[self.value.toLowerCase()];
        if (typeof value === 'undefined') {
          value = options['default'];
        }
        this.setParameter(name, value);
      }
    }
  }
}

module.exports = Header;
