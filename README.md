# Darkside

Darkside aims to be a lightweight [Node.js](http://nodejs.org/) (server-side JavaScript) framework for building simple web apps.

It features an HTTP server, a request router, controllers and a MongoDB service. In the future, there will also be a WebSocket server, a templating system and a few components such as a form handler.

> Disclaimer: This is originally a high school graduation project (2012) of [Jan Kuča](http://jankuca.com) from Prague, Czech Republic. This, however, does not mean that the development will end together with his graduation itself. The project will definitely be kept alive and will remain here on Github.

## Installation

*This is how you start a new application based on Darkside:*

**Create an empty repository for your app.**

    git init project-name

**Add Darkside to your project as a submodule to have control over updating.**

    git submodule add git://github.com/jankuca/darkside.git node_modules/darkside

**Download all dependencies.**

    git submodule update --init --recursive

**Declare your routes.**

    nano routes.declaration

The simpliest route declaration that points all requests to one static resource server would look like this:

    *
    	* = static './static'

If you wanted to handle requests on the subdomain `abc` different, you would write

    abc
    	* = static './static-abc'
    
    *
    	* = static './static'

> Please note that you need to use either tabs of single spaces to structure the `*.declaration` file.

**Create your bootstrapping script.**

    nano boot.js

The simpliest application (a static resource server) would be defined like this:

    // Require the darkside modules
    var darkside = require('darkside');
    
    function main() {
      // Create a router
      var router = new darkside.Router();
      // Define a request handler
      // In a more sophisticated app, there would also be regular controllers.
      router.setRouteTypeHandler('static', function (pathname) {
        return new darkside.StaticResourceServer(pathname);
      });
      // Feed the router your route declaration file
      router.setRouteDeclaration('./app/routes.declaration');
    
      // Create an HTTP server, assign the router to it and start it.
      var http_server = darkside.createHTTPServer();
      http_server.setRouter(router);
      http_server.listen(2000); // Listen on port 2000
    };
    
    main();

**Start your app.**

    node boot

**Check out the official [Darkside Wiki](https://github.com/jankuca/darkside/wiki) for more information.**
