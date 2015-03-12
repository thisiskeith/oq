'use strict';

var oboe = require('oboe');
var Q = require('q');

function oqXHR(data) {

    if (typeof data !== "object") {
        throw new Error('data is undefined');
    }

    var defered = Q.defer();

    var xhrObj = {
            url: data.url,
            method: data.method || 'GET',
            cached: data.cached || false,
            withCredentials: data.withCredentials || false
        };

    // Headers
    if (data.headers) {
        xhrObj.headers = data.headers;
    }

    // Body
    if (data.body) {
        xhrObj.body = data.body;
    }

    oboe(xhrObj)
        .done(function (payload) {

            if (data.callback) {
                payload = data.callback(payload);
            }

            defered.resolve(payload);
        })
        .fail(function () {
            defered.reject(new Error("Query failed"));
        });

    return defered.promise;
}

module.exports = oqXHR;
