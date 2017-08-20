# taco-bell-server

Utility server to support [taco-bell](https://www.npmjs.com/package/taco-bell)

## How to configure
Examples taken from [taco-bell-starter](https://www.npmjs.com/package/taco-bell-starter)

```typescript
// calling startServer(config, port = 8000) will  start an http server
// with an array of ServerHandler configuration objects
startServer([
    {
        // handle requests sent to the servlet path "/hello"
        path: '/hello',
        
        // only handle if the http method is GET
        method: 'GET',
        
        // (optional) function to check if the passed request parameters are valid
        // returning false from this function will cause the server to early return a 400 to the client
        validate: (params: HelloRequest): boolean => {
            return params != undefined && params.name.get() != undefined;
        },
        
        // put your business logic here
        handle: (params: HelloRequest): HelloResponse => {
            let o = new HelloResponse();
            o.message.set("Hello " + params.name.get() + "!");
            return o;
        },
        
        // Callback to instantiate a new request object. The request parameters will be deserialized to this object
        // This property is optional if this servlet doesn't expect any request parameters
        request: () => { return new HelloRequest(); },
        
        // Optional callback for handling any uncaught errors during validation or handling                        
        onError: (e: Error, params: HelloRequest): ServerError => {
            let error = new ServerError();
            error.message.set(e.message + ": " + params.name.get());
            return error;
        }
    }
]);

```