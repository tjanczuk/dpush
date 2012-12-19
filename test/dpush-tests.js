
var apiKey = 'AIzaSyAJa7YZ9fcDi6SZDAsUqH7_WpIxGDDqzwM';
var registrationId = 'APA91bG4R6JehqqPEbO93l699bnhFHDUd_E7V0_5KQ8sRPrhkqLfR7TgkiXI7YG6T0WBw3mqh0iwwnhbZNXJS4fIrmJCipp7hlA1CYK9AKTen3IeE5rvzBDTw_RdXXE_mRfsK-CNF3baPn4WPDf5E6UouUMrmWEBVVFEbxsHeRsOGLWgYvm9CCE';

var https = require('https'),
    http = require('http'),
    OriginalClientRequest = http.ClientRequest, // HTTP ClientRequest before mocking by Nock
    OriginalHttpsRequest = https.request,
    OriginalHttpRequest = http.request,
    nock = require('nock'),
    NockClientRequest = http.ClientRequest, // HTTP ClientRequest mocked by Nock
    NockHttpsRequest = https.request,
    NockHttpRequest = http.request,
    dpush = require('../lib/dpush.js'),
    assert = require('assert');

function nockHttp() {
    http.ClientRequest = NockClientRequest;
    http.request = NockHttpRequest;
    https.request = NockHttpsRequest;
};

function unNockHttp() {
    http.ClientRequest = OriginalClientRequest;
    http.request = OriginalHttpRequest;
    https.request = OriginalHttpsRequest;
};

unNockHttp(); // Revert the nock change so that tests by default run with the original, unmocked http request objects

describe('dpush.send', function () {

    it('requires apiKey', function (done) {
        assert.throws(
            dpush.send, 
            /The first parameter must be the Google API key specified as a string/);
        done();
    });

    it('requires apiKey to be a string', function (done) {
        assert.throws(
            function () {
                dpush.send(12);    
            },
            /The first parameter must be the Google API key specified as a string/);
        done();
    });

    it('requires message to be a string or JSON object', function (done) {
        assert.throws(
            function () {
                dpush.send('12', '12', 12);    
            },
            /The message must be either a string or a JSON object with string properties/);
        done();
    });

    it('requires callback to be a function', function (done) {
        assert.throws(
            function () {
                dpush.send('12', '12', '12', -1);    
            },
            /The optional callback must be a function/);
        done();
    });

    it('sends notification without content', function (done) {
        dpush.send(apiKey, registrationId, function (error, result) {
            try {
                assert.ifError(error);
                assert.ok(typeof result === 'object', 'Result is an object');
                assert.equal(result.success, 1);
                assert.equal(result.failure, 0);
                assert.equal(result.canonical_ids, 0);
                assert.equal(result.invalidIds.length, 0);
                assert.equal(Object.getOwnPropertyNames(result.updatedIds).length, 0);
            }
            catch (e) {
                console.log('ERROR: ', error);
                console.log('RESULT: ', result);
                return done(e);
            }

            done();
        });    
    });

    it('sends notification with string content', function (done) {
        dpush.send(apiKey, registrationId, 'a message', function (error, result) {
            try {
                assert.ifError(error);
                assert.ok(typeof result === 'object', 'Result is an object');
                assert.equal(result.success, 1);
                assert.equal(result.failure, 0);
                assert.equal(result.canonical_ids, 0);
                assert.equal(result.invalidIds.length, 0);
                assert.equal(Object.getOwnPropertyNames(result.updatedIds).length, 0);
            }
            catch (e) {
                console.log('ERROR: ', error);
                console.log('RESULT: ', result);
                return done(e);
            }

            done();
        });    
    });

    it('sends notification with JSON content', function (done) {
        dpush.send(apiKey, registrationId, { symbol: 'msft', price: '26.00' }, function (error, result) {
            try {
                assert.ifError(error);
                assert.ok(typeof result === 'object', 'Result is an object');
                assert.equal(result.success, 1);
                assert.equal(result.failure, 0);
                assert.equal(result.canonical_ids, 0);
                assert.equal(result.invalidIds.length, 0);
                assert.equal(Object.getOwnPropertyNames(result.updatedIds).length, 0);
            }
            catch (e) {
                console.log('ERROR: ', error);
                console.log('RESULT: ', result);
                return done(e);
            }

            done();
        });    
    });

    it('sends notification to two recipients: valid and invalid', function (done) {
        dpush.send(
            apiKey, 
            [ registrationId, 'invalid registration id' ], 
            { symbol: 'msft', price: '26.00' }, 
            function (error, result) {
                try {
                    assert.ifError(error);
                    assert.ok(typeof result === 'object', 'Result is an object');
                    assert.equal(result.success, 1);
                    assert.equal(result.failure, 1);
                    assert.equal(result.canonical_ids, 0);
                    assert.equal(result.invalidIds.length, 1);
                    assert.equal(result.invalidIds[0], 'invalid registration id');
                    assert.equal(Object.getOwnPropertyNames(result.updatedIds).length, 0);
                }
                catch (e) {
                    console.log('ERROR: ', error);
                    console.log('RESULT: ', result);
                    return done(e);
                }

                done();
            }
        );    
    });

    it('sends notification with invalid API key', function (done) {
        dpush.send(
            'invalid API key', 
            registrationId,
            function (error, result) {
                try {
                    assert.ok(typeof error === 'object', 'Error is an object');
                    assert.ok(typeof result === 'undefined', 'Result is undefined');
                    assert.ok(error.message.match(/GCM returned an error/));
                    assert.ok(error.message.match(/Status code: 401/));
                }
                catch (e) {
                    console.log('ERROR: ', error);
                    console.log('RESULT: ', result);
                    return done(e);
                }

                done();
            }
        );    
    }); 

});

describe('dpush.sendAdvanced', function () {

    it('requires apiKey', function (done) {
        assert.throws(
            dpush.sendAdvanced, 
            /The first parameter must be the Google API key specified as a string/);
        done();
    });

    it('requires apiKey to be a string', function (done) {
        assert.throws(
            function () {
                dpush.sendAdvanced(12);    
            },
            /The first parameter must be the Google API key specified as a string/);
        done();
    });

    it('requires message to be a JSON object', function (done) {
        assert.throws(
            function () {
                dpush.sendAdvanced('12', '12');    
            },
            /The second paramater must be message payload specified as a JSON object/);
        done();
    });

    it('requires retryCount to be a number', function (done) {
        assert.throws(
            function () {
                dpush.sendAdvanced('12', {}, 'abc');    
            },
            /The optional retryCount must be a non-negative number/);
        done();
    });

    it('requires retryCount to be a positive number', function (done) {
        assert.throws(
            function () {
                dpush.sendAdvanced('12', {}, -1);    
            },
            /The optional retryCount must be a non-negative number/);
        done();
    });    

    it('requires callback to be a function', function (done) {
        assert.throws(
            function () {
                dpush.sendAdvanced('12', {}, 1, -1);    
            },
            /The optional callback must be a function/);
        done();
    });

    it('sends notification without content', function (done) {
        dpush.sendAdvanced(
            apiKey, 
            {
                registration_ids: [ registrationId ] 
            }, 
            function (error, result) {
                try {
                    assert.ifError(error);
                    assert.ok(typeof result === 'object', 'Result is an object');
                    assert.equal(result.success, 1);
                    assert.equal(result.failure, 0);
                    assert.equal(result.canonical_ids, 0);
                    assert.equal(result.invalidIds.length, 0);
                    assert.equal(Object.getOwnPropertyNames(result.updatedIds).length, 0);
                }
                catch (e) {
                    console.log('ERROR: ', error);
                    console.log('RESULT: ', result);
                    return done(e);
                }

                done();
            }
        );    
    });

    it('sends notification with content', function (done) {
        dpush.sendAdvanced(
            apiKey, 
            {
                registration_ids: [ registrationId ],
                data: {
                    'message': 'a message'
                }
            }, 
            function (error, result) {
                try {
                    assert.ifError(error);
                    assert.ok(typeof result === 'object', 'Result is an object');
                    assert.equal(result.success, 1);
                    assert.equal(result.failure, 0);
                    assert.equal(result.canonical_ids, 0);
                    assert.equal(result.invalidIds.length, 0);
                    assert.equal(Object.getOwnPropertyNames(result.updatedIds).length, 0);
                }
                catch (e) {
                    console.log('ERROR: ', error);
                    console.log('RESULT: ', result);
                    return done(e);
                }

                done();
            }
        );    
    });

    it('sends notification to two recipients: valid and invalid', function (done) {
        dpush.sendAdvanced(
            apiKey, 
            {
                registration_ids: [ registrationId, 'invalid registration id' ],
                data: {
                    'message': 'a message'
                }
            }, 
            function (error, result) {
                try {
                    assert.ifError(error);
                    assert.ok(typeof result === 'object', 'Result is an object');
                    assert.equal(result.success, 1);
                    assert.equal(result.failure, 1);
                    assert.equal(result.canonical_ids, 0);
                    assert.equal(result.invalidIds.length, 1);
                    assert.equal(result.invalidIds[0], 'invalid registration id');
                    assert.equal(Object.getOwnPropertyNames(result.updatedIds).length, 0);
                }
                catch (e) {
                    console.log('ERROR: ', error);
                    console.log('RESULT: ', result);
                    return done(e);
                }

                done();
            }
        );    
    });

    it('sends notification without recipients', function (done) {
        dpush.sendAdvanced(
            apiKey, 
            {
                data: {
                    'message': 'a message'
                }
            }, 
            function (error, result) {
                try {
                    assert.ok(typeof error === 'object', 'Error is an object');
                    assert.ok(typeof result === 'undefined', 'Result is undefined');
                    assert.ok(error.message.match(/GCM returned an error/));
                    assert.ok(error.message.match(/Missing "registration_ids" field/));
                }
                catch (e) {
                    console.log('ERROR: ', error);
                    console.log('RESULT: ', result);
                    return done(e);
                }

                done();
            }
        );    
    });

    it('sends notification with invalid API key', function (done) {
        dpush.sendAdvanced(
            'invalid API key', 
            {
                registration_ids: [ registrationId ],
                data: {
                    'message': 'a message'
                }
            }, 
            function (error, result) {
                try {
                    assert.ok(typeof error === 'object', 'Error is an object');
                    assert.ok(typeof result === 'undefined', 'Result is undefined');
                    assert.ok(error.message.match(/GCM returned an error/));
                    assert.ok(error.message.match(/Status code: 401/));
                }
                catch (e) {
                    console.log('ERROR: ', error);
                    console.log('RESULT: ', result);
                    return done(e);
                }

                done();
            }
        );    
    }); 

});
