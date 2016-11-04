"use strict";

var Annotation = require('ecmas-annotations').Annotation;

class AnnotationBase extends Annotation {
  /**
   * Annotation to parse
   */
  static get targets() {
    return [Annotation.DEFINITION];
  }

  /**
   * Get annotation options.
   */
  get options() {
    var options = {};
    for (var key in this) {
      if (['value', 'className', 'filePath', 'directoryPath', 'target'].indexOf(key) < 0) {
        options[key] = this[key];
      }
    }
    return options;
  }
}

module.exports = AnnotationBase;
