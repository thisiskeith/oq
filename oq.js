'use strict';

var oboe = require('oboe');
var Q = require('q');

function oq(data) {

    if (typeof data !== "object") {
        throw new Error('data is undefined');
    }

    var defered = Q.defer();
    var statusCode;
    var xhrObj = {
            url: data.url,
            method: data.method || 'GET',
            cached: data.cached || true,
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
        .start(function (status) {
            statusCode = status;
        })
        .done(function (payload) {

            if (data.callback) {
                payload = data.callback(payload);
            }

            // Inject status code
            payload.statusCode = statusCode;

            defered.resolve(payload);
        })
        .fail(function (errorReport) {
            defered.reject(errorReport);
        });

    return defered.promise;
}

module.exports = oq;
