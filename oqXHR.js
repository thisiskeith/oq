'use strict';

var oboe = require('oboe');
var Q = require('q');

function oqXHR(data) {
    /**
     * Compute XHRHeaders
     * @param {Object} body
     * @param {String} contentType
     * @returns {{Object}}
    */
    function _getXHRHeaders(body, contentType) {
        var cLength = JSON.stringify(body).length;
    
        return {
            "Accept": "application/" + contentType,
            "Content-Type": "application/" + contentType,
            "Content-Length": cLength
        };
    }
    
    if (typeof data !== "object") {
        throw new Error('data is undefined');
    }

    var defered = Q.defer();

    var xhrObj = {
            url: data.url,
            method: data.method || 'GET',
            cached: data.cached || true,
            withCredentials: data.withCredentials || false
        };

    // Headers
    if (data.contentType) {
        xhrObj.headers = _getXHRHeaders(data.body, data.contentType);
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
