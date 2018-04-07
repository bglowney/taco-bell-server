///<reference path="../typings/globals/node/index.d.ts"/>
import http = require('http');
import fs = require('fs');
import url = require('url');
import {sprintf} from 'sprintf-js';
import moment = require('moment');
import {IncomingMessage} from "http";
import {ServerResponse} from "http";
import {ServerHandler, Request, Response, ServerInput} from "./ServerHandler";
import {Serializable, deserialize, instanceofDeserializable} from "taco-bell";

function endsWith(str: string, other: string): boolean {
    if (other == undefined)
        return false;
    if (other === "")
        return true;
    return str.substring(str.length - other.length, str.length) == other;
}

type GeneratorFunction<R> = (x?) => R & IterableIterator<Promise<any>> ;

/**
 * Use this dumbed down version of co. The real version causes some compilation errors when
 * this package is depended on by others.
 */
export function co<T>(gen: GeneratorFunction<any>): Promise<T> {
    let gInstance = (gen as Function)();
    return new Promise(function (resolve, reject) {

        function iter(yieldValue?) {
            try {
                let next: IteratorResult<Promise<any>> = gInstance.next(yieldValue);
                if (next.done) {
                    resolve(next.value);
                    return;
                }
                next.value.then(iter, reject);
            } catch (e) {
                reject(e);
            }
        }

        iter();
    });
}

// define server
export function startServer(_handlers?: ServerHandler<ServerInput, Response, Serializable>[],
                                                                                         port = 8000): void {

    const handlers: {[path: string]: {[method: string]: ServerHandler<ServerInput, Response, Serializable>}} = {};
    for (let handler of _handlers) {
        if (!handlers[handler.path])
            handlers[handler.path] = {};
        handlers[handler.path][handler.method] = handler;
    }

    http.createServer(function (req: IncomingMessage, res: ServerResponse) {

        // get all the request parts
        const method = req.method;
        const urlParts = url.parse(req.url, true);
        const path = urlParts.pathname;
        const params = urlParts.query;
        let bodyJson: Object = null;
        let statusCode = 200;
        let error: string = null;

        if (method !== "GET") {
            let body = [];
            req.on('data', (chunk) => {
                body.push(chunk);
            }).on('end', () => {
                let bodyStr = Buffer.concat(body).toString();
                if (bodyStr) {
                    try {
                        bodyJson = JSON.parse(bodyStr);
                    } catch (e) {
                        handleUnrecognizedRequest(res);
                        return;
                    }
                }
                handleRequestCallback();
            });
        } else {
            handleRequestCallback();
        }

        // Helper functions
        function handleUnrecognizedRequest(res: ServerResponse): void {
            statusCode = 400;
            res.statusCode = statusCode;
            res.write(writeErrorResponse("Unrecognized request"));
            res.end();
        }

        function handleFileRequest(fileName: string): void {
            let fileType: string;
            if (endsWith(fileName, '.js'))
                fileType = 'text/javascript';
            else if (endsWith(fileName, '.css'))
                fileType = 'text/css';
            else if (endsWith(fileName, '.html'))
                fileType = 'text/html';
            else
                throw new Error('unsupported file type');
            fs.readFile(fileName, (err, data) => {
                if (err) {
                    if (err.code === 'ENOENT')
                        statusCode = 404;
                    else
                        statusCode = 500;
                } else {
                    res.writeHead(statusCode, {'Content-Type': fileType, 'Content-Length': data.length});
                    res.write(data);
                }
                res.statusCode = statusCode;
                res.end();
                log(statusCode, err);
            });
        }

        function writeErrorResponse(message): string {
            return JSON.stringify({success: false, message: message});
        }

        function log(statusCode: number, e?: Error | string): void {
            if (!e)
                error = "";
            else if (e instanceof Error)
                error = "\n" + (e as Error).stack;
            else
                error = "\n" + e.toString();

            console.log(sprintf("%s %s %s %s %s", moment().format(), statusCode, method, path, error));
        }

        function isFileRequest(path: string): boolean {
            return path && (endsWith(path, '.js') || endsWith(path, '.css') || endsWith(path, '.html'));
        }

        function handleRequestCallback() {

            try {

                co(function* () {

                    if (isFileRequest(path)) {
                        let fileName = path.substring(1);
                        handleFileRequest(fileName);
                    } else {
                        let pathMethod = path + ":" + method.toUpperCase();
                        switch (pathMethod) {
                            // serve the index.html page
                            case ":GET":
                            case "/:GET":
                            case "/index:GET":
                            case "/index.html:GET":
                                handleFileRequest("./index.html");
                                break;
                            default:
                                if (handlers[path] && handlers[path][method]) {
                                    const handler = handlers[path][method];

                                    let requestObj: ServerInput;
                                    if (handler.request) {
                                        requestObj = handler.request();
                                        try {
                                            if (method === "GET") {
                                                if (instanceofDeserializable(requestObj))
                                                    (requestObj as Request).deserialize(JSON.stringify(params));
                                                else {
                                                    // its an HttpGetParams
                                                    deserialize.call(requestObj, JSON.stringify(params));
                                                }
                                            } else
                                                (requestObj as Request).deserialize(JSON.stringify(bodyJson));
                                        } catch (e) {
                                            handleUnrecognizedRequest(res);
                                            break;
                                        }
                                    }

                                    let valid = !handler.request // we need to deserialize the request in order to run validation function
                                        || !handler.validate; // request is valid by default
                                    if (!valid && handler.validate)
                                        valid = yield Promise.resolve(handler.validate(requestObj));

                                    if (valid) {

                                        let responseObj: Response | Serializable;
                                        try {
                                            responseObj = yield Promise.resolve(handler.handle(requestObj));
                                        } catch (e) {
                                            error = e;
                                            if (handler.onError)
                                                responseObj = yield Promise.resolve(handler.onError(e, requestObj));
                                            statusCode = 500
                                        }
                                        const serialized = responseObj ? responseObj.serialize() : "";
                                        res.writeHead(statusCode, {
                                            "Content-Type": "application/json",
                                            'Content-Length': serialized.length
                                        });
                                        res.write(serialized);
                                    } else {
                                        statusCode = 400;
                                    }
                                    res.statusCode = statusCode;
                                    res.end();
                                } else {
                                    handleUnrecognizedRequest(res);
                                }
                        }
                    }

                });
            } catch (e) {
                error = e;
                res.statusCode = 500;
                res.write(writeErrorResponse("Internal failure"));
                res.end();
            } finally {
                log(statusCode, error);
            }
        }
    }).listen(port);
}