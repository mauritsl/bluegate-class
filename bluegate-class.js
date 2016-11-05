"use strict";

const path = require('path');

const _ = require('lodash');
const globby = require('globby');
const Annotations = require('ecmas-annotations');

// Get parameters for function.
const getParameters = function(fn) {
  var code = fn.toString();
  var params = code.match(/^[a-z0-9]+[\s]*\(([^)]*)\)/im)[1].split(',').map(str => str.trim());
  return params[0] === '' ? [] : params;
};

// List of stages in BlueGate request flow.
const stages = [
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

// Register annotations in the application.
const addAnnotations = app => {
  if (typeof app._class_annotations === 'undefined') {
    app._class_annotations = [];
  }
  const pattern = [
    path.join(__dirname, '/annotations/*.js'),
    '!' + path.join(__dirname, '/annotations/base.js')
  ];
  globby.sync(pattern).forEach(file => {
    app._class_annotations.push(file);
  });
};

// Initialize Reader class to read annotations.
const createAnnotationReader = app => {
  var registry = new Annotations.Registry();
  app._class_annotations.forEach(file => {
    registry.registerAnnotation(file);
  });
  return new Annotations.Reader(registry);
};

const processAnnotations = (app, options) => {
  // Initialize the annotation reader.
  let reader = createAnnotationReader(app);

  // Loop though all route files.
  globby.sync(options.files).forEach(file => {
    let path;
    let routeClass = require(file);

    // Parse class annotations.
    reader.parse(file, Annotations.Reader.ES6);

    // Sort annotations in routes and other annotations.
    let routes = [];
    let annotations = [];
    reader.definitionAnnotations.forEach(annotation => {
      let info = {
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
        const routeInstance = new routeClass(this, options.parameters);
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
          const code = 'fn = function(' + args + '){ return _class_instances[' + JSON.stringify(file) + '].' + stage + '(' + originalArgs + '); }';
          eval(code);
          app[stage](path, fn);
        }
      });

      // Register callbacks for other annotations.
      annotations.forEach(annotation => {
        const callbacks = annotation.instance.getCallbacks(routeClass);
        for (let key in callbacks) {
          app[key](path, callbacks[key]);
        }
      });

    });
  });
};

// Main function for this module.
const classModule = (app, options) => {
  options = _.defaults(options, {
    files: path.join(process.cwd(), 'routes/**.js'),
    parameters: {}
  });

  // Add annotations provided by this module.
  addAnnotations(app);

  // Delay the processing of annotations, to allow other modules to register their own annotations.
  setImmediate(() => {
    processAnnotations(app, options);
  });
};

// Add the AnnotationBase class to the exports.
classModule.AnnotationBase = require(path.join(__dirname, 'annotations/base'));

module.exports = classModule;
