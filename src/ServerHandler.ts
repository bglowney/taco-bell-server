import {Deserializable, Serializable, HttpMethod} from "taco-bell";

export type RequestProvider<P extends Request> = () => P;

export interface Request extends Deserializable {

}

export type ResponseProvider<R extends Response> = () => R;

export interface Response extends Serializable {

}

export interface ServerHandler<P extends Request,R extends Response,E extends Serializable> {
    path: string
    method: HttpMethod
    validate?: (params: P) => boolean
    handle: (params: P) => R
    onError?: (e: Error, params: P) => E
    request?: RequestProvider<P>
    response?: ResponseProvider<R>
}