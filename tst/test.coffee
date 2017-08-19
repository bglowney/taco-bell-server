assert = require 'assert'
request = require 'request'

describe 'taco-bell server', () ->

  describe 'valid GET request', () ->
    it 'should echo back the request params', (done) ->
      request 'http://localhost:8000/echo?a=aaa', (err, res, body) ->
        if err
          throw err
        assert.ok res
        assert.equal res.statusCode, 200
        assert.equal body, '{"a":"aaa"}'
        done()

  describe 'invalid GET request', () ->
    it 'should return a 400', (done) ->
      request 'http://localhost:8000/echo', (err, res, body) ->
        if err
          throw err
        assert.ok res
        assert.equal res.statusCode, 400
        done()

  describe 'server error request', () ->
    it 'should return a custom error object', (done) ->
      options =
        url: 'http://localhost:8000/error'
        body:
          a: 'bbb'
        json: true
      request.post options, (err, res, body) ->
        if err
          throw err
        assert.ok res
        assert.equal res.statusCode, 500
        assert.deepEqual res.body, { message: 'Contrived failure: bbb' }
        done()
