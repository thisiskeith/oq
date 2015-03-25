# oboe-q

oboe-q is a simple Oboe.js XHR wrapper with promises by Q optimized for use with your Node.js and React apps.

## Examples

React

```js

var xhrData = {
        url: 'http://example.com/'
    };

return oq(xhrData);
```

Node.js

```js
exports.getExample = function (req, res) {

    var xhrData = {
        url: 'http://example.com/'
    };

    oq(xhrData)
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

Install the package
```js
npm install oboe-q --save
```
Require in your application
```
var oq = require('oboe-q');
```
