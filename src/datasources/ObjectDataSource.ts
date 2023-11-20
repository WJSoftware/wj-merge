import type { SourceObject, IDataSource } from "wj-merge";
import { DataSource } from "./DataSource.js";
import { isSourceObject } from "../helpers.js";

/**
 * Configuration data source class that injects a pre-build JavaScript object into the configuration build chain.
 */
export class ObjectDataSource extends DataSource implements IDataSource {
    /**
     * The object to inject.
     */
    private _obj: SourceObject | (() => Promise<SourceObject>);

    #validateObject(obj: SourceObject) {
        if (!isSourceObject(obj)) {
            throw new Error('The provided object is not suitable as configuration data source.');
        }
    }

    /**
     * Initializes a new instance of this class.
     * @param obj Data object to inject into the configuration build chain.
     */
    constructor(obj: SourceObject | (() => Promise<SourceObject>)) {
        super('Object');
        if (typeof obj !== 'function') {
            this.#validateObject(obj);
        }
        this._obj = obj;
    }

    async getObject(): Promise<SourceObject> {
        let obj = this._obj;
        if (typeof obj === 'function') {
            obj = await obj();
        }
        this.#validateObject(obj);
        return Promise.resolve(obj);
    };
}
