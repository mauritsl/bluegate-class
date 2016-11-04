"use strict";

var AnnotationBase = require('./base');

class Post extends AnnotationBase {
  /**
   * Validate value type.
   */
  validateType(value, type, defaultValue) {
    var types = {
      'alpha': /^[a-z]+$/i,
      'alphanum': /^[a-z0-9]+$/i,
      'bool': /^(?:1|0|true|false)$/i,
      'float': /^\-?[0-9\\.]+$/,
      'int': /^[1-9][0-9]*$/,
      'path': /^.*$/,
      'signed': /^\-?[0-9]+$/,
      'string': /^.*$/,
      'unsigned': /^[0-9]+$/,
      'uuid': /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    };

    if (typeof value === 'undefined' || !String(value).match(types[type])) {
      return defaultValue;
    }

    // Numeric types are casted to a number, bool as bool and others are passed as strings.
    if (['int', 'signed', 'unsigned', 'float'].indexOf(type) >= 0) {
      value = parseFloat(value);
    }
    if (type === 'bool') {
      value = value === '1' || value === 'true';
    }
    if (type === 'uuid') {
      // Uuid's are always passed in lowercase for consistency.
      value = value.toLowerCase();
    }
    return value;
  }

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
        if (self.value !== null && typeof options.type === 'undefined') {
          throw new Error('The Post annotation must have a type option.');
        }
        if (self.value === null && typeof options.alias === 'undefined') {
          throw new Error('The Post annotation must have an alias option when using for full post data.');
        }
        var name = self.value;
        if (typeof options.alias === 'string') {
          name = options.alias;
        }
        var value;
        if (self.value !== null && typeof this.body === 'object') {
          value = self.validateType(this.body[self.value], options.type, options['default']);
        }
        if (self.value === null) {
          value = this.body;
        }
        this.setParameter(name, value);
      }
    }
  }
}

module.exports = Post;
