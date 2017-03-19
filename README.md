[![Standard - JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](http://standardjs.com/)

# What ?
Node.js alternative to https://docs.fabric.io/web/digits/getting-started.html

### Getting started

`digits-server-client` need the latest Node.js that supports ES6(recommended v6.10), you can check that requirements with [node.green](https://node.green). Or if you still wanna use older version, you can use it with [babel-register](https://babeljs.io/docs/usage/babel-register/).

### Installation

```sh
$ npm install --save digits-server-client
```

### How to use
After you install the package. You can include `digits-server-client` within your code like this:

```jss
var DigitsClient = require('digits-server-client');
```

### Create client
All API operations can be used through a client. So we need to create a Digits client. It takes an object as parameter with these properties:

- digitsConsumerKey (required and should be a string)
- digitsHost (required and should be a string)

```js
var digits = new DigitsClient({
	digitsConsumerKey: 'myConsumerKey',
	digitsHost: "https://mydomain.com" //MUST BE HTTPS
});
```
Note: To get these credentials, read : [here](https://docs.fabric.io/web/digits/getting-started.html)


### Send code
`sendVerificationCode` method sends verification code to given phoneNumber. It takes an object as parameter with these following properties:

- phoneNumber
	- required
	- type `String`
- countryCode 
	- required
	- type `String` i.e two-letter ISO country code (like US)
- headers 
	- required
	- type `Object` with `user-agent` and `accept-language` as required properties
- method
	- optional
	- type `String` i.e either `sms` or `voicecall`
	- default is `sms`

#### Example:
```js
digits.sendVerificationCode({
	phoneNumber: '0648446907',
	countryCode: 'FR',
	headers: req.headers // for express.js,
	// method: "voicecall" (sms by default)
}).then(function (registrationToken) {
	//eyJsb2dpblZlcmlmaWNhdGlvblJlcXVlc3RJZCI6InV...
	console.log(registrationToken);
}).then(null, function (error) {
	// error.message
	// error.statusCode
});
```
As seen in the example in success case it return `registrationToken` as a result which will be used for verifying the code later. If any errors occured while sending the code then an error is thrown with `message` and `statusCode` as properties. 

| message | statusCode |
|---------| -----------|
|Error: Please Configure Digits ConsumerKey and Host| 500|
|Error: You attempted to reach Digits by Twitter from a website different than the registered URL for. If you are the website owner, go to our Digits for Web docs to learn more about how to register the correct URL.| 400 |
|Error: Unable to get Digits web session| 500|
|Error: Please provide req headers: {"user-agent": ...., "accept-language": .....}| 400|
|Error: Please provide both phoneNumber and countryCode| 400|
|Error: Provided phoneNumber is invalid| 400|
|Error: Unable to parse Digits response| 500|


### Verify code
It takes an object as parameter with these following properties

- registrationToken
	- required
	-  type `String`
	- It is the token you got as a result from ``sendVerificationCode` method
- code
	- required
	- type `String`
	- It the verfication code sent to given phoneNumber
- headers
	- required
	- type `Object` with `user-agent` and `accept-language` as required properties

#### Example:

```js
digits.verifyCode({
	registrationToken: 'eyJsb2dpblZlcmlmaWNhdGlvblJlcXVlc3RJZCI6InV...',
	code: '196099',
	headers: req.headers
}).then(function (result) {
	//{ success: true, phone: '+33648446907'}
	//{ success: false, phone: '+33648446907', errors: []}
	console.log(result);
}).then(null, function (error) {
	// error.message
	// error.statusCode
});
```
As seen in the example in success case it returns a result object which has following properties

- success
	- `true` if code is verified successfully
	- `false` if code or token are expired or invalid (more in errors property)
- phone
	- It contains the verified phoneNumber
- errors
	- It is present when `success: false` only
	- It contains a message why the verification failed
	- Example:
		
		```js
		  "errors": [
		    {
		      "code": 235,
		      "message": "The login verification request has expired"
		    }
		  ]
		```

If any errors occured while verifying the code then an error is thrown with `message` and `statusCode` as properties. 

| message | statusCode |
|---------| -----------|
|Error: Please Configure Digits ConsumerKey and Host| 500|
|Error: You attempted to reach Digits by Twitter from a website different than the registered URL for. If you are the website owner, go to our Digits for Web docs to learn more about how to register the correct URL.| 400 |
|Error: Unable to get Digits web session| 500|
|Error: Please provide req headers: {"user-agent": ...., "accept-language": .....}| 400|
|Error: Please provide both registrationToken and code| 400|
|Error: Provided registrationToken is invalid(i.e not base64 encoded string)| 400|
|Error: Unable to parse Digits response| 500|