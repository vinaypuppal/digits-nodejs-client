'use strict'

const request = require('request-promise')
const cheerio = require('cheerio')
const { isValidNumber } = require('libphonenumber-js')
const isBase64 = require('validator/lib/isBase64')

const reqOptions = {
  resolveWithFullResponse: true,
  simple: false // Don't reject messages that come back with error code (e.g. 404, 500s)
}

const throwError = (message, statusCode) => {
  const error = new Error(message)
  error.statusCode = statusCode || 500
  throw error
}

const hasValue = value => typeof value !== 'undefined' && value.length !== 0

class Digits {
  constructor ({ digitsConsumerKey = '', digitsHost = '' } = {}) {
    this.consumerKey = digitsConsumerKey
    this.host = digitsHost
  }
  _canMakeRequest () {
    if (hasValue(this.consumerKey) && hasValue(this.host)) return true
    return false
  }
  /**
   * GET a web session needed for each api call
   */
  async getWebSession () {
    try {
      const res = await request.get(
        `https://www.digits.com/embed?consumer_key=${this.consumerKey}&host=${this.host}`,
        reqOptions
      )
      const $ = cheerio.load(res.body)
      if (res.statusCode === 200) {
        const cookieHeader = res.headers['set-cookie']
        const cookie = cookieHeader[1].split(';')[0]
        const $$ = cheerio.load($('body').find('script').html())
        const authToken = $$('input[name=authenticity_token]').val()
        return {
          cookie,
          authToken
        }
      }
      throwError(
        $('.message').text().replace(/(\r\n|\n|\r)/gm, ''),
        res.statusCode
      )
    } catch (e) {
      if (e && e.message) throw e
      else throwError('Error: Unable to get Digits web session')
    }
  }

  /**
    Send verification code to device via sms or voicecall
    Get registration token to challenge the code later
      Usage example :
    sendVerificationCode({
      phoneNumber: '0648446907',
      countryCode: 'FR',
      headers: {"user-agent": ...., "accept-language": .....},
      method: "sms" // sms or "voicecall"
    }).then(function (registrationToken) {
      console.log(registrationToken);
    }).then(null, function (error) {
      //error
      console.log(error.message, error.statusCode)
    });
   */
  async sendVerificationCode (options = {}) {
    if (!this._canMakeRequest()) {
      throwError('Error: Please Configure Digits ConsumerKey and Host')
    }
    const {
      phoneNumber = '',
      countryCode = '',
      method = '',
      headers = {}
    } = options
    if (
      !hasValue(headers['accept-language']) || !hasValue(headers['user-agent'])
    ) {
      throwError(
        'Error: Please provide req headers: {"user-agent": ...., "accept-language": .....}',
        400
      )
    }
    if (!hasValue(phoneNumber) || !hasValue(countryCode)) {
      throwError('Error: Please provide both phoneNumber and countryCode', 400)
    }
    if (!isValidNumber(phoneNumber, countryCode)) {
      throwError('Error: Provided phoneNumber is invalid', 400)
    }
    try {
      const session = await this.getWebSession()
      const postReqOptions = Object.assign(
        {},
        {
          har: {
            method: 'POST',
            url: 'https://www.digits.com/sdk/login',
            headers: [
              {
                name: 'cookie',
                value: session.cookie
              },
              {
                name: 'referer',
                value: `https://www.digits.com/embed?consumer_key=${this.consumerKey}&host=${this.host}`
              },
              {
                name: 'accept-language',
                value: headers['accept-language']
              },
              {
                name: 'user-agent',
                value: headers['user-agent']
              }
            ],
            postData: {
              mimeType: 'application/x-www-form-urlencoded',
              params: [
                {
                  name: 'authenticity_token',
                  value: session.authToken
                },
                {
                  name: 'verification_type',
                  value: method || 'sms'
                },
                {
                  name: 'x_auth_country_code',
                  value: countryCode
                },
                {
                  name: 'x_auth_phone_number',
                  value: phoneNumber
                }
              ]
            }
          }
        },
        reqOptions
      )
      const res = await request.post(postReqOptions)
      if (res.statusCode === 200) {
        const jsonBody = JSON.parse(res.body)
        const token = new Buffer(
          JSON.stringify({
            loginVerificationRequestId: jsonBody.login_verification_request_id,
            loginVerificationUserId: jsonBody.login_verification_user_id,
            phoneNumber: jsonBody.phone_number || phoneNumber
          })
        ).toString('base64')
        return token
      }
      throwError(res.body, res.statusCode)
    } catch (e) {
      if (e && e.message) throw e
      else throwError('Error: Unable to parse Digits response')
    }
  }

  /**
    Test code validation
      Usage example :
    verify({
      registrationToken: 'abcdefdsjfbdshfsdfsdhfjbsdhfd...',
      code: '020531',
    }).then(function (results) {
      console.log(results);
    }).then(null, function (e) {
      //error
      console.log(error.message, error.statusCode)
    });
   */
  async verifyCode (options = {}) {
    if (!this._canMakeRequest()) {
      throwError('Error: Please Configure Digits ConsumerKey and Host')
    }
    const { registrationToken = '', code = '', headers = {} } = options
    if (
      !hasValue(headers['accept-language']) || !hasValue(headers['user-agent'])
    ) {
      throwError(
        'Error: Please provide req headers: {"user-agent": ...., "accept-language": .....}',
        400
      )
    }
    if (!hasValue(registrationToken) || !hasValue(code)) {
      throwError('Error: Please provide both registrationToken and code', 400)
    }
    if (!isBase64(registrationToken)) {
      throwError('Error: Provided registrationToken is invalid', 400)
    }
    try {
      const data = JSON.parse(
        new Buffer(registrationToken, 'base64').toString('ascii')
      )
      const session = await this.getWebSession()
      const postReqOptions = Object.assign(
        {},
        {
          har: {
            method: 'POST',
            url: 'https://www.digits.com/sdk/challenge',
            headers: [
              {
                name: 'cookie',
                value: session.cookie
              },
              {
                name: 'referer',
                value: `https://www.digits.com/embed?consumer_key=${this.consumerKey}&host=${this.host}`
              },
              {
                name: 'accept-language',
                value: headers['accept-language']
              },
              {
                name: 'user-agent',
                value: headers['user-agent']
              }
            ],
            postData: {
              mimeType: 'application/x-www-form-urlencoded',
              params: [
                {
                  name: 'authenticity_token',
                  value: session.authToken
                },
                {
                  name: 'remember_me',
                  value: 'off'
                },
                {
                  name: 'phone_number',
                  // value: "0648446907"
                  value: data.phoneNumber
                },
                {
                  name: 'login_verification_user_id',
                  value: data.loginVerificationUserId
                },
                {
                  name: 'login_verification_challenge_response',
                  value: code
                },
                {
                  name: 'login_verification_request_id',
                  value: data.loginVerificationRequestId
                }
              ]
            }
          }
        },
        reqOptions
      )
      const res = await request.post(postReqOptions)
      const jsonBody = JSON.parse(res.body)
      if (res.statusCode === 200) {
        return {
          success: !!jsonBody['X-Verify-Credentials-Authorization'],
          phoneNumber: data.phoneNumber
        }
      }
      if (jsonBody.errors) {
        return {
          success: false,
          phone: data.phoneNumber,
          errors: jsonBody.errors
        }
      }
      throwError('Error: An unknow error in digits response', res.statusCode)
    } catch (e) {
      if (e && e.message) throw e
      else throwError('Error: Unable to parse Digits response')
    }
  }
}

module.exports = Digits
