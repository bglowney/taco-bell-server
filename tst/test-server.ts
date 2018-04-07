// be careful to import from index here for testing properly
import {startServer} from "../src/Server";
import {AbstractSerializable, ModelElement, HttpGetParams} from "taco-bell";

class GetInputA implements HttpGetParams {
    [key: string]: ModelElement<any>;
    readonly a = new ModelElement<string>();
}

class InputA extends AbstractSerializable {
    readonly a = new ModelElement<string>();
}

class OutputA extends AbstractSerializable {
    readonly a = new ModelElement<string>();
}

class CustomErrorMessage extends AbstractSerializable {
    readonly message = new ModelElement<string>();
}

startServer([
    {
        path: '/echo',
        method: 'GET',
        validate: (params: GetInputA): boolean => {
            return params != undefined && params.a.get() != undefined;
        },
        handle: (params: GetInputA): OutputA => {
            let o = new OutputA();
            o.a.set(params.a.get());
            return o;
        },
        request: () => { return new GetInputA(); }
    },
    {
        path: '/error',
        method: 'POST',
        handle: (params: InputA): OutputA => {
            throw new Error("Contrived failure")
        },
        request: () => { return new InputA(); },
        onError: (e: Error, params: InputA) => {
            let error = new CustomErrorMessage();
            error.message.set(e.message + ": " + params.a.get());
            return error;
        }
    },
    {
        path: '/slow',
        method: 'GET',
        validate: (params: InputA): Promise<boolean> => {
            return new Promise<boolean>(function (resolve, reject) {
                setTimeout(resolve.bind(resolve,true), 100);
            });
        },
        request: () => { return new InputA(); },
        handle: (params: InputA): any => {
            if (params.a.get() == "bad")
                throw new Error("contrived");

            return new Promise<OutputA>(function (resolve, reject) {
                let result = new OutputA();
                result.a.set('slow');
                setTimeout(resolve.bind(resolve, result), 100);
            });
        },
        onError: (e: Error, params: InputA) => {
            return new Promise<CustomErrorMessage>(function (resolve, reject) {
                let error = new CustomErrorMessage();
                error.message.set("slow");
                setTimeout(resolve.bind(resolve, error), 100);
            });
        }
    }
]);
