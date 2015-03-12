# oXHR

oXHR is a simple Oboe.js XHR wrapper with promises by Q optimized for use with your Node.js and React apps.

## Examples

React

```js

var xhrData = {
        url: 'http://example.com/'
    };

return oXHR(xhrData);
```

Node.js

```js
exports.getExample = function (req, res) {

    var xhrData = {
        url: 'http://example.com/'
    };

    oXHR(xhrData)
        .then(function (payload) {
            res.send(payload);
        })
        .fail(function (error) {
            // Handler error
        })
        .done();
};
```

## Installation

The easiest way to get started is to add the following to your `package.json` dependencies
```js
{
    "dependencies": {
        "oxhr": "git+ssh://git@github.com:thisiskeith/oXHR.git",
    }
}
```
Install the package
```js
npm install
```
Require in your application
```
var oXHR = require('oxhr');
```

