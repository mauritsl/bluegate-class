BlueGate Class
==================

Use ES6 classes to write routes.
Route classes are using annotations to integrate routes in the application.

## Installation

Install using ``npm install bluegate-class``

## Quick example

```javascript
var BlueGate = require('bluegate');
var app = new BlueGate();
app.listen(8080);

require('bluegate-class')(app, {
  files: __dirname + '/routes/**.js'
});
```

Add a route in ``routes/homepage.js``:
```
/**
 * @Route("GET /")
 */
module.exports = class FrontpageRoute {
  process() {
    return '<html>Frontpage</html>';
  }
}
```

More complex route:
```
/**
 * @Route("GET /page/<id:int>")
 * @Query("json", type="bool", alias="respondInJson")
 */
module.exports = class FrontpageRoute {
  postvalidation(id) {
    return db.hasPost(id).then(exists => {
      if (!exists) {
        throw new Error('Invalid post');
      }
    });
  }

  process(id, respondInJson) {
    return db.getPost(id).then(post => {
      if (respondInJson) {
        return post;
      }
      else {
        return postTemplate(post);
      }
    });
  }
}
```

## Routes

In the example above, all routes are located in the ``routes`` folder. And all files in this
folder with a ``.js`` extension needs to be a route.
This path is parsed with the [globby](https://www.npmjs.com/package/globby) module.
You may provide an array to provide multiple paths.
Providing a path is optional, the default of ``routes/**.js`` is used when omitted.

## Annotations

Annotations are used to provide the routing path. There are also annotations available to register
input from get, post, cookie and header fields. These eliminate the need to save the ``request``
object in the constructor and call ``getQuery`` on that object.

### Route

Using a Route annotation is mandatory.
More information about the formatting of routes can be found in the
[BlueGate](https://www.npmjs.com/package/bluegate) readme.

```
/**
 * @Route("GET /user/<name:string>")
 */
```

This annotation accepts extra parameters which will be registered in BlueGate, using the
``setParameter`` function on the request object. These parameters can be retrieved in the
callbacks as function parameters. Parameters registered in annotations are available to
all callbacks, including callbacks outside this class.
A common use-case for this is to specify a page template.

```
/**
 * @Route("GET /user", template="userPage")
 */
class UserProfileRoute {
  process() {
    return {};
  }
}
```

```
app.postprocess(function(template) {
  return templateFunctions[template](this.output);
});
```


### Query

Add a Query annotation to register GET-parameters as function parameters in the callbacks.
You must specify a type. Usual types are "string", "int" and "bool". A list of available types
is available in the [BlueGate](https://www.npmjs.com/package/bluegate) readme.

```
/**
 * @Route("GET /user")
 * @Query("name", type="string")
 */
class UserProfileRoute {
  process(name) {
    return {};
  }
}
```

The default value is used when the input does not match the provided type.
A default value can be provided using the ``default`` parameter (and defaults to ``null``).
You may also specify an alias. This is the name used for the function parameter.

```
/**
 * @Route("GET /users")
 * @Query("page", type="int", alias="pageNumber", default=1)
 */
class UsersListRoute {
  process(pageNumber) {
    return {};
  }
}
```

### Post

```
/**
 * @Route("GET /test")
 * @Post("name", type="string")
 * @Post(alias="postData")
 */
class TestRoute {
  process(name, postData) {
    return {name: name, postData: postData};
  }
}
```

### Cookie

```
/**
 * @Route("GET /test")
 * @Cookie("sessionId", type="string")
 */
class TestRoute {
  process(sessionId) {
    return {sessionId: sessionId};
  }
}
```

### Header

```
/**
 * @Route("GET /test")
 * @Header("User-Agent", alias="userAgent")
 */
class TestRoute {
  process(userAgent) {
    return {userAgent: userAgent};
  }
}
```

### Content Type

```
/**
 * @Route("GET /test")
 * @ContentType("application/pdf")
 */
class TestRoute {
  process() {
    return new Buffer('test');
  }
}
```

## Request object

The BlueGate request object is passed to the class constructor as the ``request`` parameter.
You have to save a reference to it in order to access it in the ``process`` function.

```
/**
 * @Route("GET /test")
 */
class TestRoute {
  constructor(request) {
    this.request = request;
  }

  process() {
    this.request.setCookie('foo', 'bar');
    return {};
  }
}
```

## Constructor parameters

It is possible to pass extra parameters to the route constructors. They can hold references
to your database client, for example.

```
require('bluegate-class')(app, {
  files: __dirname + '/routes/**.js',
  parameters: {
    db: dbClient
  }
});
```

```
/**
 * @Route("GET /test")
 */
class TestRoute {
  constructor(request, params) {
    this.db = params.db;
  }
```
