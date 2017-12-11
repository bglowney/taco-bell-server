"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http = require("http");
const fs = require("fs");
const url = require("url");
const sprintf_js_1 = require("sprintf-js");
const moment = require("moment");
const taco_bell_1 = require("taco-bell");
function endsWith(str, other) {
    if (other == undefined)
        return false;
    if (other === "")
        return true;
    return str.substring(str.length - other.length, str.length) == other;
}
function startServer(_handlers, port = 8000) {
    const handlers = {};
    for (let handler of _handlers) {
        if (!handlers[handler.path])
            handlers[handler.path] = {};
        handlers[handler.path][handler.method] = handler;
    }
    http.createServer(function (req, res) {
        const method = req.method;
        const urlParts = url.parse(req.url, true);
        const path = urlParts.pathname;
        const params = urlParts.query;
        let bodyJson = null;
        let statusCode = 200;
        let error = null;
        if (method !== "GET") {
            let body = [];
            req.on('data', (chunk) => {
                body.push(chunk);
            }).on('end', () => {
                let bodyStr = Buffer.concat(body).toString();
                if (bodyStr) {
                    try {
                        bodyJson = JSON.parse(bodyStr);
                    }
                    catch (e) {
                        handleUnrecognizedRequest(res);
                        return;
                    }
                }
                handleRequestCallback();
            });
        }
        else {
            handleRequestCallback();
        }
        function handleUnrecognizedRequest(res) {
            statusCode = 400;
            res.statusCode = statusCode;
            res.write(writeErrorResponse("Unrecognized request"));
            res.end();
        }
        function handleFileRequest(fileName) {
            let fileType;
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
                }
                else {
                    res.writeHead(statusCode, { 'Content-Type': fileType, 'Content-Length': data.length });
                    res.write(data);
                }
                res.statusCode = statusCode;
                res.end();
                log(statusCode, err);
            });
        }
        function writeErrorResponse(message) {
            return JSON.stringify({ success: false, message: message });
        }
        function log(statusCode, e) {
            if (!e)
                error = "";
            else if (e instanceof Error)
                error = "\n" + e.stack;
            else
                error = "\n" + e.toString();
            console.log(sprintf_js_1.sprintf("%s %s %s %s %s", moment().format(), statusCode, method, path, error));
        }
        function isFileRequest(path) {
            return path && (endsWith(path, '.js') || endsWith(path, '.css') || endsWith(path, '.html'));
        }
        function handleRequestCallback() {
            try {
                if (isFileRequest(path)) {
                    let fileName = path.substring(1);
                    handleFileRequest(fileName);
                }
                else {
                    let pathMethod = path + ":" + method.toUpperCase();
                    switch (pathMethod) {
                        case ":GET":
                        case "/:GET":
                        case "/index:GET":
                        case "/index.html:GET":
                            handleFileRequest("./index.html");
                            break;
                        default:
                            if (handlers[path] && handlers[path][method]) {
                                const handler = handlers[path][method];
                                let requestObj;
                                if (handler.request) {
                                    requestObj = handler.request();
                                    try {
                                        if (method === "GET") {
                                            if (taco_bell_1.instanceofDeserializable(requestObj))
                                                requestObj.deserialize(JSON.stringify(params));
                                            else {
                                                taco_bell_1.deserialize.call(requestObj, JSON.stringify(params));
                                            }
                                        }
                                        else
                                            requestObj.deserialize(JSON.stringify(bodyJson));
                                    }
                                    catch (e) {
                                        handleUnrecognizedRequest(res);
                                        break;
                                    }
                                }
                                if (!handler.request
                                    || !handler.validate
                                    || handler.validate(requestObj)) {
                                    let responseObj;
                                    try {
                                        responseObj = handler.handle(requestObj);
                                    }
                                    catch (e) {
                                        error = e;
                                        if (handler.onError)
                                            responseObj = handler.onError(e, requestObj);
                                        statusCode = 500;
                                    }
                                    const serialized = responseObj ? responseObj.serialize() : "";
                                    res.writeHead(statusCode, {
                                        "Content-Type": "application/json",
                                        'Content-Length': serialized.length
                                    });
                                    res.write(serialized);
                                }
                                else {
                                    statusCode = 400;
                                }
                                res.statusCode = statusCode;
                                res.end();
                            }
                            else {
                                handleUnrecognizedRequest(res);
                            }
                    }
                }
            }
            catch (e) {
                error = e;
                res.statusCode = 500;
                res.write(writeErrorResponse("Internal failure"));
                res.end();
            }
            finally {
                log(statusCode, error);
            }
        }
    }).listen(port);
}
exports.startServer = startServer;
