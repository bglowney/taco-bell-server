import {Deserializable, Serializable, HttpMethod, HttpGetParams} from "taco-bell";

export type RequestProvider<P extends Request | HttpGetParams> = () => P;

export interface Request extends Deserializable {

}

export type ResponseProvider<R extends Response> = () => R;

export interface Response extends Serializable {

}

export type ServerInput = HttpGetParams | Request;

export interface ServerHandler<P extends ServerInput,R extends Response,E extends Serializable> {
    path: string
    method: HttpMethod
    validate?: (params: P) => boolean
    handle: (params: P) => R
    onError?: (e: Error, params: P) => E
    request?: RequestProvider<P>
}