# Darkside.js

Darkside.js aims to be a lightweight [Node.js](http://nodejs.org/) (server-side JavaScript) framework for building larger web apps.

It leverages the MVC architecture and the dependency injection design pattern.

Darkside.js features most of the components you would expect from a server-side framework:

- an HTTP server
- a WebSocket server (via socket.io)
- a request router,
- controllers
- a model system (entities and repositories) connected to a **MongoDB** service
- a templating engine

> Disclaimer: This is originally a high school graduation project (2012) of [Jan Kuča](http://jankuca.com) from Prague, Czech Republic. This, however, does not mean that the development ended together with his graduation. The project is kept alive and will remain here on Github.

## Installation

Darkside.js is distributed via NPM.

    npm install darkside

## Getting started

Your bootstrapping file should look somewhat like this:

```js
var darkside = require('darkside');
var app = darkside.create(__dirname);

app.router.setRouteDeclaration('./routes.declaration');
app.services.setServiceDeclaration('./services.declaration');

app.run(process.env['PORT'] || 5000);
```

You need to declare your routes and your services:

```r
# routes.declaration:

www
  / = 'front:post:index'
  /posts/:id = 'front:post:show'
  POST /posts = 'front:post:create-post'

m
  / = 'mobile:post:index'
```

```r
# services.declaration:

database
  @ = darkside.MongoDBService
  name = 'blog'
  server = 'mongodb://user:*****@localhost:27017'

@repositories
  posts
```

### Controllers

Controller files are located in the `controllers` subdirectory of the specified application directory (`__dirname` in the example above). They are grouped by namespaces.

```
controllers/
  front/
    PostController.js
  mobile/
    PostController.js
```

A controller that simply retrieves `Post` entities from the database and populates its views with them would look like this:

```js
var darkside = require('darkside');

var PostController = function (posts) {
  darkside.base(darkside.ViewController, this);

  this.$posts = posts;
};

darkside.inherits(PostController, darkside.ViewController);
PostController.prototype.$deps = [ 'posts' ]; // dependencies

PostController.prototype['index'] = function () {
  this.$posts.all(function (err, posts) {
    if (err) return this.$response.end(500);

    this.view['posts'] = posts;
    this.render();
  }, this);
};

PostController.prototype['show'] = function (params) {
  this.$posts.one(params['id'], function (err, post) {
    if (err) return this.$response.end(500);

    this.view['post'] = post;
    this.render();
  }, this);
};

module.exports = PostController;
```

> Note: The way inheritance and DI are combined might be subjected to a change in the future.

### Views

The templating engine used by Darkside.js is ECO (Embedded CoffeeScript) because of its lightweight syntax.

Template files are grouped by namespaces and controllers:

```
views/
  front/
    post/
      index.eco
      show.eco
    @layout.eco
  mobile/
    post/
      index.eco
    @layout.eco
```

By default, a layout and a content templates are bound to `ViewController` instances.

Content templates are inserted into layout ones as the `content` component.

```html
<!-- @layout.eco: -->
<!DOCTYPE html>
<meta charset="UTF-8">

<body>
<%= @component 'content' %>
```

```html
<!-- post/index.eco: -->
<h1>Posts</h1>

<% for post in @posts: %>
<h2><%= post.title %></h2>
<%- post.content %>
<% end %>
```
