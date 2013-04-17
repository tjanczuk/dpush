var https = require('https');

// To communicate with GCM without GCM sending any notifications, set `GCM_DRY_RUN=1` environment variable.

// The GCM protocol spec is at http://developer.android.com/google/gcm/gcm.html#server

exports.send = function (apiKey, registrationIds, message, callback) {
    if (typeof message === 'function') {
        callback = message;
        message = undefined;
    }

    var content = {
        registration_ids: Array.isArray(registrationIds) ? registrationIds : [ registrationIds ]
    };

    if (typeof message === 'string') {
        content.data = { 'message': message };
    }
    else if (typeof message === 'object') {
        for (var i in message) {
            if (typeof message[i] !== 'string' && typeof message[i] !== 'object') {
                throw new Error('The message must be either a string or a JSON object with string properties.');
            }
        }

        content.data = message;
    }
    else if (typeof message !== 'undefined') {
        throw new Error('The message must be either a string or a JSON object with string properties.')
    }

    return exports.sendAdvanced(apiKey, content, 0, callback);
}

exports.sendAdvanced = function (apiKey, content, retryCount, callback) {
    if (typeof retryCount === 'function') {
        callback = retryCount;
        retryCount = 0;
    }
    else if (typeof retryCount === undefined) {
        retryCount = 0;
    }

    if (typeof apiKey !== 'string') {
        throw new Error('The first parameter must be the Google API key specified as a string.');
    }

    if (typeof content !== 'object') {
        throw new Error('The second paramater must be message payload specified as a JSON object ' +
            'compliant with the specification at http://developer.android.com/google/gcm/gcm.html#server');
    }

    if (isNaN(retryCount) || retryCount < 0) {
        throw new Error('The optional retryCount must be a non-negative number.');
    }

    if (typeof callback !== 'undefined' && typeof callback !== 'function') {
        throw new Error('The optional callback must be a function.');
    }

    if (typeof content.dry_run === 'undefined' && process.env.GCM_DRY_RUN) {
        content.dry_run = true;
    }

    var options = {
        hostname: 'android.googleapis.com',
        port: 443,
        path: '/gcm/send',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'key=' + apiKey
        }
    };

    var req = https.request(options, function (res) {
        res.setEncoding('utf8');
        var body = '';
        res.on('data', function (data) { body += data; });
        res.on('end', function () {
            if (res.statusCode === 200) {
                // Request processed successfuly. This does not mean all messages were sent successfuly. 
                // The processResponse function makes the determination. 

                var parsedBody;
                try {
                    parsedBody = JSON.parse(body);
                }
                catch (e) {
                    return callback(new Error('Unable to parse response from GCM as JSON: ' + body));
                }

                callback(null, processResponse(parsedBody));
            }
            else if (res.statusCode === 503) {
                // GCM server is too busy. Retry the request up to the retryCount times observing the 
                // Retry-After HTTP response header value. 

                if (retryCount <= 1 || !res.headers['retry-after']) {
                    callback(new Error('GCM is too busy to process the request. Try later or increase retryCount. ' +
                        'Status code: ' + res.statusCode + '. Body: ' + body));
                }
                else {
                    var retryAfter = res.headers['retry-after'];
                    var delay;
                    try {
                        delay = isNaN(retryAfter) ? new Date(retryAfter) - new Date() : retryAfter * 1000;
                    }
                    catch (e) {
                        return callback(new Error('GCM returned invalid Retry-After header in the response. ' +
                            'Status code: ' + res.statusCode + '. Body: ' + body));
                    }
                    
                    if (delay <= 0) {
                        exports.sendAdvanced(apiKey, content, retryCount - 1, callback);
                    }
                    else {
                        setTimeout(function () {
                            exports.sendAdvanced(apiKey, content, retryCount - 1, callback);
                        }, delay);
                    }
                }
            }
            else {
                // Request rejected by GCM for other reasons. 

                callback(new Error('GCM returned an error. Status code: ' + res.statusCode + '. Body: ' + body));
            }
        });
    });

    req.on('error', function (error) {
        callback(new Error('Error communicating with GCM: ' + error));
    });

    req.write(JSON.stringify(content));
    req.end();

    function processResponse(response) {
        response.invalidIds = [];
        response.updatedIds = {};

        if (response.failure !== 0 || response.canonical_ids !== 0) {

            // Process the response to determine registration IDs that are no longer active and should be removed
            // and registration IDs which value has changed.

            response.results.forEach(function (result, index) {
                if (result.error === 'InvalidRegistration' || result.error === 'NotRegistered') {
                    response.invalidIds.push(content.registration_ids[index]);
                }
                else if (result.registration_id) {
                    response.updatedIds[content.registration_ids[index]] = result.registration_id;
                }
            });
        }

        return response;
    }
};
