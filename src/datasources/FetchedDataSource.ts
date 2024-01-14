import type { SourceObject, ProcessFetchResponse, IDataSource } from "wj-merge";
import { DataSource } from "./DataSource.js";

export class FetchedDataSource extends DataSource implements IDataSource {
    private _input: URL | RequestInfo | (() => Promise<URL | RequestInfo>);
    private _required: boolean;
    private _init?: RequestInit;
    private _processFn: (response: Response) => Promise<SourceObject>;
    constructor(input: URL | RequestInfo | (() => Promise<URL | RequestInfo>), required: boolean = true, init?: RequestInit, processFn?: ProcessFetchResponse) {
        super(
            typeof input === 'string' || input instanceof URL ?
                `Fetch ${input.toString()}` :
                (input instanceof Request ? `Fetch ${input.url}` : 'Fetch Data')
        );
        this._input = input;
        this._required = required;
        this._init = init;
        const defaultProcessFetchFn: ProcessFetchResponse = async (response) => {
            if (this._required && response.status === 204) {
                throw new Error(`${this.name}: Data from this source is required but the fetch operation yielded no data.`);
            }
            else if (this._required && response.status === 404) {
                throw new Error(`${this.name}: Data from this source is required but the fetch operation could not find the resource.`);
            }
            else if (this._required && !response.ok) {
                throw new Error(`${this.name}: Data from this source is required but the fetch operation yielded a non-OK response: ${response.status} (${response.statusText}).`);
            }
            else if (response.ok && response.status !== 204) {
                return await response.json();
            }
            return null;
        };
        this._processFn = r => (processFn ?? defaultProcessFetchFn)(r, defaultProcessFetchFn);
    }

    async getObject(): Promise<SourceObject> {
        let input = this._input;
        if (typeof input === 'function') {
            input = await input();
        }
        const response = await fetch(input, this._init);
        let data: SourceObject = {};
        try {
            data = await this._processFn(response);
        }
        catch (err) {
            if (this._required) {
                // Strange.  While navigating to the TS definition I clearly see that the cause property is of type unknown,
                // but tsc actually throws an error saying it is of type Error | undefined, so casting as Error.
                throw new Error(`${this.name}: An error occurred while processing the fetched response.`, { cause: err as Error });
            }
        }
        return data;
    }
}
