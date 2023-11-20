import type { IDataSourceInfo } from "wj-merge";

/**
 * Base class that implements the `IDataSourceInfo` interface.  Use this class as a base for new data sources.
 */
export class DataSource implements IDataSourceInfo {
    name: string;
    index?: number;
    private _traceObject?: IDataSourceInfo;

    constructor(name: string) {
        this.name = name;
    }

    trace() {
        return this._traceObject = this._traceObject ?? {
            name: this.name,
            index: this.index
        };
    }
}