"use strict";

var path = require('path');

var _ = require('lodash');
var globby = require('globby');
var Annotations = require('ecmas-annotations');

var registry = new Annotations.Registry();
registry.registerAnnotation(path.join(__dirname, '/annotations/route.js'));
registry.registerAnnotation(path.join(__dirname, '/annotations/content-type.js'));
registry.registerAnnotation(path.join(__dirname, '/annotations/query.js'));
registry.registerAnnotation(path.join(__dirname, '/annotations/header.js'));
registry.registerAnnotation(path.join(__dirname, '/annotations/cookie.js'));
registry.registerAnnotation(path.join(__dirname, '/annotations/post.js'));

var reader = new Annotations.Reader(registry);

// Get parameters for function.
var getParameters = function(fn) {
  var code = fn.toString();
  var params = code.match(/^[a-z0-9]+[\s]*\(([^)]*)\)/im)[1].split(',').map(str => str.trim());
  return params[0] === '' ? [] : params;
};

// List of stages in BlueGate request flow.
var stages = [
  'initialize',
  'authentication',
  'authorisation',
  'prevalidation',
  'preprocess',
  'postvalidation',
  'process',
  'postprocess',
  'after',
  'error',
  'aftererror'
];

module.exports = function(app, options) {
  options = _.defaults(options, {
    files: path.join(process.cwd(), 'routes/**.js'),
    parameters: {}
  });

  // Loop though all route files.
  globby.sync(options.files).forEach(file => {
    var path;
    var routeClass = require(file);

    // Parse class annotations.
    reader.parse(file, Annotations.Reader.ES6);

    // Sort annotations in routes and other annotations.
    var routes = [];
    var annotations = [];
    reader.definitionAnnotations.forEach(annotation => {
      var info = {
        type: annotation.constructor.name,
        value: annotation.value,
        options: _.omit(annotation, ['value', 'className', 'filePath', 'directoryPath', 'target']),
        instance: annotation
      };
      if (info.type === 'Route') {
        routes.push(info);
      }
      else {
        annotations.push(info);
      }
    });

    // Register routes in BlueGate app.
    routes.forEach(route => {
      path = route.value;
      const annotationOptions = route.options;

      app.initialize(path, function(_class_instances) {
        if (typeof _class_instances === 'undefined') {
          _class_instances = {};
          this.setParameter('_class_instances', _class_instances);
        }
        var routeInstance = new routeClass(this, options.parameters);
        _class_instances[file] = routeInstance;
      });

      app.initialize(path, function() {
        for (let key in annotationOptions) {
          this.setParameter(key, annotationOptions[key]);
        }
      });

      // Register callbacks for stages.
      stages.forEach(stage => {
        if (typeof routeClass.prototype[stage] === 'function') {
          let originalArgs = getParameters(routeClass.prototype[stage]);
          let args = _.clone(originalArgs);
          args.push('_class_instances');
          originalArgs = originalArgs.join(',');
          args = args.join(',');
          let fn;
          var code = 'fn = function(' + args + '){ return _class_instances[' + JSON.stringify(file) + '].' + stage + '(' + originalArgs + '); }';
          eval(code);
          app[stage](path, fn);
        }
      });

      // Register callbacks for other annotations.
      annotations.forEach(annotation => {
        var callbacks = annotation.instance.getCallbacks(routeClass);
        for (var key in callbacks) {
          app[key](path, callbacks[key]);
        }
      })

    });
  });
};
