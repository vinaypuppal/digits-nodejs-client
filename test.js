require('async-to-gen/register')
const test = require('ava')
const DigitsClient = require('./index')

// intialise digits
const digits = new DigitsClient({
  digitsConsumerKey: 'myConsumerKey',
  digitsHost: 'https://example.com'
})

// some dummy headers for testing purpose
const headers = {
  'accept-language': 'en-US',
  'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.98 Safari/537.36'
}

test('digits.sendVerificationCode should throw error when digits is not intialised with key & host', t => {
  const digits = new DigitsClient()
  return digits.sendVerificationCode({
    phoneNumber: '0648446907',
    countryCode: 'FR',
    headers
  }).catch(e => {
    t.is(e.message, 'Error: Please Configure Digits ConsumerKey and Host')
    t.is(e.statusCode, 500)
  })
})

test('digits.sendVerificationCode should throw error when no headers provided', t => {
  return digits.sendVerificationCode({
    phoneNumber: '0648446907',
    countryCode: 'FR'
  }).catch(e => {
    t.is(e.message, 'Error: Please provide req headers: {"user-agent": ...., "accept-language": .....}')
    t.is(e.statusCode, 400)
  })
})

test('digits.sendVerificationCode should throw error when no phoneNumber/countryCode provided', t => {
  return digits.sendVerificationCode({
    phoneNumber: '',
    countryCode: '',
    headers
  }).catch(e => {
    t.is(e.message, 'Error: Please provide both phoneNumber and countryCode')
    t.is(e.statusCode, 400)
  })
})

test('digits.sendVerificationCode should throw error when an invalid phoneNumber is provided', t => {
  return digits.sendVerificationCode({
    phoneNumber: '064844690', // invalid phoneNumber
    countryCode: 'FR',
    headers
  }).catch(e => {
    t.is(e.message, 'Error: Provided phoneNumber is invalid')
    t.is(e.statusCode, 400)
  })
})

test('digits.verifyCode should throw error when digits is not intialised with key & host', t => {
  const digits = new DigitsClient()
  return digits.verifyCode({
    registrationToken: 'eyJsb2dpblZlcmlmaWNhdGlvblJlcXVlc3RJZCI6InV...',
    code: '196099',
    headers
  }).catch(e => {
    t.is(e.message, 'Error: Please Configure Digits ConsumerKey and Host')
    t.is(e.statusCode, 500)
  })
})

test('digits.verifyCode should throw error when no headers provided', t => {
  return digits.verifyCode({
    phoneNumber: '0648446907',
    countryCode: 'FR'
  }).catch(e => {
    t.is(e.message, 'Error: Please provide req headers: {"user-agent": ...., "accept-language": .....}')
    t.is(e.statusCode, 400)
  })
})

test('digits.verifyCode should throw error when no token/code provided', t => {
  return digits.verifyCode({
    registrationToken: '',
    code: '',
    headers
  }).catch(e => {
    t.is(e.message, 'Error: Please provide both registrationToken and code')
    t.is(e.statusCode, 400)
  })
})

test('digits.verifyCode should throw error when non base64 token is passed', t => {
  return digits.verifyCode({
    registrationToken: 'eyJsb2dpblZlcmlmaWNhdGlvblJlcXVlc3RJZCI6InV...', // invalid base64 token
    code: '196099',
    headers
  }).catch(e => {
    t.is(e.message, 'Error: Provided registrationToken is invalid')
    t.is(e.statusCode, 400)
  })
})
