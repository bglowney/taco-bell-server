var assert, request;

assert = require('assert');

request = require('request');

describe('taco-bell server', function() {
  describe('valid GET request', function() {
    return it('should echo back the request params', function(done) {
      return request('http://localhost:8000/echo?a=aaa', function(err, res, body) {
        if (err) {
          throw err;
        }
        assert.ok(res);
        assert.equal(res.statusCode, 200);
        assert.equal(body, '{"a":"aaa"}');
        return done();
      });
    });
  });
  describe('valid slow GET request', function() {
    return it('should handle async logic', function(done) {
      return request('http://localhost:8000/slow?a=b', function(err, res, body) {
        if (err) {
          throw err;
        }
        assert.ok(res);
        assert.equal(res.statusCode, 200);
        assert.equal(body, '{"a":"slow"}');
        return done();
      });
    });
  });
  describe('invalid slow GET request', function() {
    return it('should handle async error logic', function(done) {
      return request('http://localhost:8000/slow?a=bad', function(err, res, body) {
        if (err) {
          throw err;
        }
        assert.ok(res);
        assert.equal(res.statusCode, 500);
        assert.equal(body, '{"message":"slow"}');
        return done();
      });
    });
  });
  describe('invalid GET request', function() {
    return it('should return a 400', function(done) {
      return request('http://localhost:8000/echo', function(err, res, body) {
        if (err) {
          throw err;
        }
        assert.ok(res);
        assert.equal(res.statusCode, 400);
        return done();
      });
    });
  });
  return describe('server error request', function() {
    return it('should return a custom error object', function(done) {
      var options;
      options = {
        url: 'http://localhost:8000/error',
        body: {
          a: 'bbb'
        },
        json: true
      };
      return request.post(options, function(err, res, body) {
        if (err) {
          throw err;
        }
        assert.ok(res);
        assert.equal(res.statusCode, 500);
        assert.deepEqual(res.body, {
          message: 'Contrived failure: bbb'
        });
        return done();
      });
    });
  });
});
