/* eslint-env node, mocha */
"use strict";

// Run Redis before running test:
// docker run --name testredis -d -p 6379:6379 redis
// And clean up after test:
// docker stop testredis && docker rm testredis

var Promise = require('bluebird');
var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
var expect = chai.expect;
var path = require('path');
var uuid = require('uuid');

var BlueGate = require('bluegate');
var Needle = Promise.promisifyAll(require('needle'), {multiArgs: true});

describe('BlueGate class', function() {
  var app;
  var url = 'http://localhost:3000';

  before(function() {
    app = new BlueGate({
      log: false
    });
    require('./bluegate-class.js')(app, {
      files: path.join(__dirname, '/test/**.js'),
      parameters: {
        foo: 'bar'
      }
    });
    return app.listen(3000);
  });

  after(function() {
    return app.close();
  });

  it('can register simple path', function() {
    return Needle.getAsync(url + '/').then(function(response) {
      expect(response[0].statusCode).to.equal(200);
      expect(response[1]).to.equal('Frontpage');
    });
  });

  it('will provide request parameter to constructor', function() {
    return Needle.getAsync(url + '/constructor-params').then(function(response) {
      expect(response[0].statusCode).to.equal(200);
      expect(response[1]).to.have.property('path', '/constructor-params');
    });
  });

  it('will provide parameters from options to constructor', function() {
    return Needle.getAsync(url + '/constructor-params').then(function(response) {
      expect(response[0].statusCode).to.equal(200);
      expect(response[1]).to.have.property('foo', 'bar');
    });
  });

  it('can register paths with parameters', function() {
    return Needle.getAsync(url + '/page/123').then(function(response) {
      expect(response[0].statusCode).to.equal(200);
      expect(response[1]).to.have.property('page', 123);
    });
  });

  it('will register parameters from annotations', function() {
    return Needle.getAsync(url + '/annotation-param').then(function(response) {
      expect(response[0].statusCode).to.equal(200);
      expect(response[1]).to.have.property('template', 'test');
    });
  });

  describe('ContentType annotation', function() {
    it('will set mimetype', function() {
      return Needle.getAsync(url + '/content-type').then(function(response) {
        expect(response[0].headers['content-type']).to.equal('application/test');
      });
    });
  });

  describe('Query annotation', function() {
    it('will register query parameters found in annotations', function() {
      return Needle.getAsync(url + '/parameters?page=123').then(function(response) {
        expect(response[1]).to.have.property('page', 123);
      });
    });

    it('will use default value if value was not found', function() {
      return Needle.getAsync(url + '/parameters').then(function(response) {
        expect(response[1]).to.have.property('page', 1);
      });
    });

    it('will use default value if type is incorrect', function() {
      return Needle.getAsync(url + '/parameters?page=test').then(function(response) {
        expect(response[1]).to.have.property('page', 1);
      });
    });

    it('can use an alias', function() {
      return Needle.getAsync(url + '/parameters?start=10').then(function(response) {
        expect(response[1]).to.have.property('offset', 10);
      });
    });

    it('will raise an error when missing type option', function() {
      const Query = require('./annotations/query');
      const routeClass = class Route {};
      const annotation = new Query({
        value: 'test'
      });
      expect(function() {
        var scope = {
          getCookie: function() { },
          setParameter: function() { }
        };
        annotation.getCallbacks(routeClass).initialize.apply(scope);
      }).to.throw(Error);
    });
  });

  describe('Header annotation', function() {
    it('will register header parameters found in annotations', function() {
      var options = {
        headers: {
          'X-Test': 'testing...'
        }
      };
      return Needle.getAsync(url + '/parameters', options).then(function(response) {
        expect(response[1]).to.have.property('testHeader', 'testing...');
      });
    });
  });

  describe('Cookie annotation', function() {
    it('will register cookie parameters found in annotations', function() {
      var options = {
        headers: {
          'Cookie': 'session=abc123'
        }
      };
      return Needle.getAsync(url + '/parameters', options).then(function(response) {
        expect(response[1]).to.have.property('sessionId', 'abc123');
      });
    });

    it('will raise an error when missing type option', function() {
      const Cookie = require('./annotations/cookie');
      const routeClass = class Route {};
      const annotation = new Cookie({
        value: 'test'
      });
      expect(function() {
        var scope = {
          getCookie: function() { },
          setParameter: function() { }
        };
        annotation.getCallbacks(routeClass).initialize.apply(scope);
      }).to.throw(Error);
    });
  });

  describe('Post annotation', function() {
    it('will register post parameters found in annotations', function() {
      var data = {
        name: 'Alice'
      };
      return Needle.postAsync(url + '/parameters', data).then(function(response) {
        expect(response[1]).to.have.property('name', 'Alice');
      });
    });

    it('will use default value when type does not match', function() {
      var data = {
        num: 'invalid'
      };
      return Needle.postAsync(url + '/parameters', data).then(function(response) {
        expect(response[1]).to.have.property('number', null);
      });
    });

    it('will cast value to correct numeric type', function() {
      var data = {
        num: '123'
      };
      return Needle.postAsync(url + '/parameters', data).then(function(response) {
        expect(response[1].number).to.be.a('number');
      });
    });

    it('will cast value to correct boolean type', function() {
      var data = {
        bool: 'true'
      };
      return Needle.postAsync(url + '/parameters', data).then(function(response) {
        expect(response[1].bool).to.be.a('boolean');
      });
    });

    it('will cast value to correct uuid type', function() {
      var data = {
        uuid: uuid.v4().toUpperCase()
      };
      return Needle.postAsync(url + '/parameters', data).then(function(response) {
        expect(response[1].uuid).to.be.a('string');
        // UUID should be converted to lowercase for consistency.
        expect(response[1].uuid).to.equal(data.uuid.toLowerCase());
      });
    });

    it('will add full body to parameters when no specific field requested', function() {
      var data = {
        num: 'invalid'
      };
      return Needle.postAsync(url + '/parameters', data).then(function(response) {
        expect(response[1]).to.have.property('postData');
        expect(response[1].postData).to.deep.equal(data);
      });
    });

    it('will raise an error when missing type option', function() {
      const Post = require('./annotations/post');
      const routeClass = class Route {};
      const annotation = new Post({
        value: 'test'
      });
      expect(function() {
        var scope = {
          getCookie: function() { },
          setParameter: function() { }
        };
        annotation.getCallbacks(routeClass).initialize.apply(scope);
      }).to.throw(Error);
    });

    it('will raise an error when missing alias option when using full post data', function() {
      const Post = require('./annotations/post');
      const routeClass = class Route {};
      const annotation = new Post({
        value: null
      });
      expect(function() {
        var scope = {
          getCookie: function() { },
          setParameter: function() { }
        };
        annotation.getCallbacks(routeClass).initialize.apply(scope);
      }).to.throw(Error);
    });
  });
});
