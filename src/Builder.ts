import type { IBuilder, IDataSource, Predicate, SourceObject, LeafValue, DataPredicate, ProcessFetchResponse, MergeResult, Dictionary } from "wj-merge";
import { DictionaryDataSource } from "./datasources/DictionaryDataSource.js"
import { FetchedDataSource } from "./datasources/FetchedDataSource.js";
import { JsonDataSource } from "./datasources/JsonDataSource.js";
import merge from "./merge.js";
import { ObjectDataSource } from "./datasources/ObjectDataSource.js"
import { SingleValueDataSource } from "./datasources/SingleValueDataSource.js";

interface IDataSourceDef {
    dataSource: IDataSource,
    predicate?: Predicate
}

export default class Builder<TSourceObject extends SourceObject> implements IBuilder<TSourceObject> {
    /**
     * Collection of data sources added to the builder.
     */
    private _dsDefs: IDataSourceDef[] = [];

    /**
     * Flag to determine if the last call in the builder was the addition of a data source.
     */
    private _lastCallWasDsAdd: boolean = false;

    add(dataSource: IDataSource): IBuilder<TSourceObject> {
        this._dsDefs.push({
            dataSource: dataSource
        });
        dataSource.index = this._dsDefs.length - 1;
        this._lastCallWasDsAdd = true;
        return this;
    }

    addObject(obj: SourceObject | (() => Promise<SourceObject>)): IBuilder<TSourceObject> {
        return this.add(new ObjectDataSource(obj));
    }

    addDictionary(dictionary: Dictionary | (() => Promise<Dictionary>), hierarchySeparator: string = ':', prefixOrPredicate?: string | DataPredicate<keyof SourceObject>): IBuilder<TSourceObject> {
        return this.add(new DictionaryDataSource(dictionary, hierarchySeparator, prefixOrPredicate));
    }

    addFetched(input: URL | RequestInfo | (() => Promise<URL | RequestInfo>), required: boolean = true, init?: RequestInit, procesFn?: ProcessFetchResponse): IBuilder<TSourceObject> {
        return this.add(new FetchedDataSource(input, required, init, procesFn));
    }

    addJson(json: string | (() => Promise<string>), jsonParser?: JSON, reviver?: (this: any, key: string, value: any) => any) {
        return this.add(new JsonDataSource(json, jsonParser, reviver));
    }

    addSingleValue(path: string | (() => Promise<[string, LeafValue]>), valueOrHierarchySeparator?: LeafValue | string, hierarchySeparator?: string): IBuilder<TSourceObject> {
        return this.add(new SingleValueDataSource(path, valueOrHierarchySeparator, typeof path === 'function' ? valueOrHierarchySeparator as string : hierarchySeparator));
    }

    name(name: string): IBuilder<TSourceObject> {
        if (!this._lastCallWasDsAdd) {
            throw new Error('Names for data sources must be set immediately after adding the data source or setting its conditional.');
        }
        this._dsDefs[this._dsDefs.length - 1].dataSource.name = name;
        return this;
    }

    when(predicate: Predicate, dataSourceName?: string): IBuilder<TSourceObject> {
        if (!this._lastCallWasDsAdd) {
            throw new Error('Conditionals for data sources must be set immediately after adding the data source or setting its name.');
        }
        if (this._dsDefs[this._dsDefs.length - 1].predicate) {
            throw new Error('Cannot set more than one predicate (conditional) per data source, and the last-added data source already has a predicate.');
        }
        const dsDef = this._dsDefs[this._dsDefs.length - 1];
        dsDef.predicate = predicate;
        if (dataSourceName != undefined) {
            this.name(dataSourceName);
        }
        return this;
    }

    async build<TTrace extends boolean>(traceValueSources?: TTrace): Promise<MergeResult<TSourceObject, TTrace>> {
        this._lastCallWasDsAdd = false;
        const qualifyingDs: IDataSource[] = [];
        let mergedData = {} as MergeResult<TSourceObject, TTrace>;
        if (this._dsDefs.length > 0) {
            // Prepare a list of qualifying data sources.  A DS qualifies if it has no predicate or
            // the predicate returns true.
            this._dsDefs.forEach(ds => {
                if (!ds.predicate || ds.predicate()) {
                    qualifyingDs.push(ds.dataSource);
                }
            });
            if (qualifyingDs.length > 0) {
                const dsTasks: Promise<SourceObject>[] = [];
                qualifyingDs.forEach(ds => {
                    dsTasks.push(ds.getObject());
                });
                const sources = await Promise.all(dsTasks);
                mergedData = merge(sources, traceValueSources ? qualifyingDs : undefined) as MergeResult<TSourceObject, TTrace>;
            }
        }
        if (traceValueSources) {
            if (qualifyingDs.length > 0) {
                mergedData._qualifiedDs = qualifyingDs.map(ds => ds.trace());
            }
            else {
                mergedData._qualifiedDs = [];
            }
        }
        return mergedData;
    }
};
