dpush
=====

Send push notifications from a node.js application to an Android device using [Google Cloud Messaging](http://developer.android.com/google/gcm/index.html) (GCM).

## What you need

* Create a new Google API project following instructions from [here](http://developer.android.com/google/gcm/gs.html). The API key associated with the project is used as the `apiKey` parameter required by dpush. 
* Create an Android application and register it with GCM to receive notifications following instruction from [here](http://developer.android.com/google/gcm/gs.html). The device will be assigned a registration ID, which allows dpush to send notifications to the device. 

## Your first notification

Install ```dpush``` module with

```
npm install dpush
```

Then send a notification to your Android application with:

```javascript
var wns = require('dpush');

var registrationId = '{registration ID obtained by the Android application}';
var apiKey = '{API key associated with the Google API project}';

dpush.send(apiKey, registrationId, 'Hello, world!', function (error, response) {
    if (error)
        console.error(error);
    else
        console.log(result);
});
```

The notification message can be extracted in your Android application as follows:

```java
public class GCMIntentService extends GCMBaseIntentService {

    @Override
    protected void onMessage(Context context, Intent intent) {
        String notificationMessage = intent.getStringExtra("message");
        // ...
    }

    // ...
}
```

The message parameter of the `dpush.send` API (Hello, world!) is optional. If not specified, the notification is still delivered but does not contain any paload. This can be used to signal the Android application, perhaps to perform a pull for data. 

## Sending multiple key value pairs

You can send a structured message with multiple key value pairs as follows:

```javascript
var payload = {
    symbol: 'msft',
    price: '26.78',
    lastClose: '26.20'  
};

dpush.send(apiKey, registrationId, payload, function (error, response) {
    // ...
});
```

The values in the `payload` property bag must be strings. There are some restrictions on the property names outlined [here](http://developer.android.com/google/gcm/gcm.html#request). The total size of the payload serialized to JSON cannot be larger than 4KB. 

You can extract individual values of the property bag in your Andoid application by passing the property name (e.g. `price`) to the `Intent.getStringExtra` API from within the overload of `GCMBaseIntentService.onMessage` API.

## Sending uniform notifications to multiple recipients

You can send the same notification to multiple recipients with a single call to GCM as follows:

```javascript
var registrationIds = [ '{registration ID 1}', '{registration ID 2}', ... ];

dpush.send(apiKey, registrationIds, 'Hello, world!', function (error, response) {
    // ...
});
```

## Processing the response

The `dpush.send` API succeeds if GCM was able to successfuly accept the request. It does not mean all notifications were delivered. Your application must process the `response` callback parameter to fully understand the state of processing using instructions from [here](http://developer.android.com/google/gcm/gcm.html#response).

The `response` parameter contains the following two properties that the `dpush` module added to the response from GCM to help in processing the result:

* `response.invalidIds` - this is an array of registration IDs that are no longer valid. The application should not send future notifications to these IDs, otherwise it may be blocked by GCM. 
* `response.updatedIds` - a map of registration IDs provided in the request to updated registration IDs. The application should use the updated IDs instead of the original IDs when sending future notifications. GCM may occasionally update the registration ID associated with a device, and this is the mechanism used to notify the sender about such update. 

## Advanced notifications

If you require any of the following advanced notification features, you must use the `dpush.sendAdvanced` API instead of the `dpush.send` API:

* automatically retry sending the notications if GCM servers are too busy,
* collapse multiple notifications into one if the notification cannot be delievered at once,
* only send a notification if the device is active,
* specify the TTL for storing notifications at GCM servers while the device is offline,
* restrict delivery to applications with specific package name,
* issue the request against GCM sandbox without actual delivery to the device. 

The `dpush.sendAdvanced` has the following signature:

```
dpush.sendAdvanced(apiKey, content, [retryCount], [callback])
```

The `content` parameter is a JSON object passed verbatim as a request to the GCM service. Its format is specified [here](http://developer.android.com/google/gcm/gcm.html#request). 

The `retryCount` is a non-negative integer indicating how many times the request should be re-tried if the GCM servers respond with a 5xx status code. The dpush module implements the required back-off policy based on the `Retry-After` HTTP response header sent from GCM. The default value is 0. 

## Running tests
 
Tests are using mocha and nock which are listed as dev dependencies. To run tests against the mocked up GCM responses:
 
```
npm test
```

To run tests against live GCM servers, update the dpush-tests.js file with your own Google API key and a sample, valid registration ID of an Android device, then:

```
export NOCK_OFF=true (or set NOCK_OFF=true on Windows)
npm test
```
