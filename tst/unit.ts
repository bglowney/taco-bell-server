import 'mocha';
import assert = require('assert');
import {co} from "../src/Server";

describe('co', function () {

    function* gen(x: number) {
        let r = yield new Promise<number>(function (resolve, reject) {
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

        co(gen.bind(gen,1))
        .then(function (res) {
            assert.equal(3, res);
            done();
        }, function (res) {
            throw res;
        });

    });

    it('should handle errors thrown in chained promises', function (done) {

        co(gen.bind(gen,2))
            .then(function (res) {
                throw res;
            }, function (res) {
                assert(res instanceof Error);
                done();
            });

    });

});