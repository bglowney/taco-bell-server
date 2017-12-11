"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Server_1 = require("../src/Server");
const taco_bell_1 = require("taco-bell");
class GetInputA {
    constructor() {
        this.a = new taco_bell_1.ModelElement();
    }
}
class InputA extends taco_bell_1.AbstractSerializable {
    constructor() {
        super(...arguments);
        this.a = new taco_bell_1.ModelElement();
    }
}
class OutputA extends taco_bell_1.AbstractSerializable {
    constructor() {
        super(...arguments);
        this.a = new taco_bell_1.ModelElement();
    }
}
class CustomErrorMessage extends taco_bell_1.AbstractSerializable {
    constructor() {
        super(...arguments);
        this.message = new taco_bell_1.ModelElement();
    }
}
Server_1.startServer([
    {
        path: '/echo',
        method: 'GET',
        validate: (params) => {
            return params != undefined && params.a.get() != undefined;
        },
        handle: (params) => {
            let o = new OutputA();
            o.a.set(params.a.get());
            return o;
        },
        request: () => { return new GetInputA(); }
    },
    {
        path: '/error',
        method: 'POST',
        handle: (params) => {
            throw new Error("Contrived failure");
        },
        request: () => { return new InputA(); },
        onError: (e, params) => {
            let error = new CustomErrorMessage();
            error.message.set(e.message + ": " + params.a.get());
            return error;
        }
    }
]);
