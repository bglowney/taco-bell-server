"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("mocha");
const assert = require("assert");
const Server_1 = require("../src/Server");
describe('co', function () {
    function* gen(x) {
        let r = yield new Promise(function (resolve, reject) {
            setTimeout(resolve.bind(resolve, x), 100);
        });
        if (x == 2)
            throw new Error();
        let p = yield new Promise(function (resolve, reject) {
            setTimeout(resolve.bind(resolve, r + 2), 100);
        });
        return p;
    }
    it('should handle chained promises', function (done) {
        Server_1.co(gen.bind(gen, 1))
            .then(function (res) {
            assert.equal(3, res);
            done();
        }, function (res) {
            throw res;
        });
    });
    it('should handle errors thrown in chained promises', function (done) {
        Server_1.co(gen.bind(gen, 2))
            .then(function (res) {
            throw res;
        }, function (res) {
            assert(res instanceof Error);
            done();
        });
    });
});
