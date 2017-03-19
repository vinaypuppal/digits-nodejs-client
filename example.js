'use strict'

var DigitsClient = require('./index')
// var DigitsClient = require('digits-server-client');

var digits = new DigitsClient({
  digitsConsumerKey: 'myConsumerKey',
  digitsHost: 'https://mydomain.com'
})

digits.sendVerificationCode({
  phoneNumber: '0648446907',
  countryCode: 'FR'
  // headers: req.headers
  // method: "voicecall"
}).then(function (registrationToken) {
  // eyJsb2dpblZlcmlmaWNhdGlvblJlcXVlc3RJZCI6InV...
  console.log(registrationToken)
}).then(null, function (error) {
  // error
  console.log(error)
})

digits.verifyCode({
  registrationToken: 'eyJsb2dpblZlcmlmaWNhdGlvblJlcXVlc3RJZCI6InV...',
  code: '196099'
  // headers: req.headers
}).then(function (results) {
  // { success: true, phone: '+33648446907'}
  /*
    {
      "success": false,
      "phone": "+33648446907",
      "errors": [
        {
          "code": 235,
          "message": "The login verification request has expired"
        }
      ]
    }
  */
  console.log(results)
}).then(null, function (error) {
  // error
  console.log(error)
})
