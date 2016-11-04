"use strict";

var AnnotationBase = require('./base');

class Cookie extends AnnotationBase {
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
        if (typeof options.type === 'undefined') {
          throw new Error('The Cookie annotation must have a type option.');
        }
        var name = self.value;
        if (typeof options.alias === 'string') {
          name = options.alias;
        }

        // Use the type option instead of strings.
        // Strings are confusing when not used in paths, as they cannot contain slashes.
        options.type = options.type === 'string' ? 'path' : options.type;

        var value = this.getCookie(self.value, options.type, options['default']);
        this.setParameter(name, value);
      }
    }
  }
}

module.exports = Cookie;
