declare module 'wj-merge' {
    /**
     * The data types that are considered valid leaf data, either on their own or in arrays.
     */
    export type SingleLeafValue = string | number | Date | boolean | Function | null;

    /**
     * The data types that are considered leaf values in data object properties.
     */
    export type LeafValue = SingleLeafValue | Array<SingleLeafValue>;

    /**
     * Dictionary used to add flat data to the hierarchical object being built.  It describes a flat object that 
     * specifies the hierarchy of the value using a naming convention in its keys (property names).
     */
    export type Dictionary = Record<string, LeafValue>;

    /**
     * Object that can be used as data object, which is then used to build the merged object.
     */
    export type SourceObject = {
        [x: string]: LeafValue | SourceObject;
    };

    /**
     * Type of trace data (the object found in the root `_trace` property).
     */
    export type TraceData<T extends SourceObject = SourceObject> = {
        [K in keyof T]: T[K] extends SourceObject ? TraceData<T[K]> : IDataSourceInfo
    };

    /**
     * Data type that defines the properties that are part of the tracing feature.
     */
    export type TraceResult<T extends SourceObject> = {
        /**
         * List of data sources that qualified after data source predicate evaluation.
         */
        _qualifiedDs: IDataSourceInfo[];
        /**
         * Trace object created when building with tracing on.  Its hierarchy mirrors the merged object's hierarchy 
         * and the values are of type `IDataSourceInfo`.
         */
        _trace: TraceData<T>;
    };

    /**
     * The result of the merging process.
     */
    export type MergeResult<T extends SourceObject = SourceObject, B extends boolean> = B extends true ? T & TraceResult<T> : T & Partial<TraceResult<T>>;

    /**
     * Predicate function that receives a single piece of data and emits a judgement in the form of a Boolean value 
     * that may or may not be based on the data given to it.
     */
    export type DataPredicate<T> = (data: T) => boolean;

    /**
     * Predicate function that evaluates arbitrary criteria and returns a judgment in the form of a Boolean value.
     */
    export type Predicate = () => boolean;

    /**
     * Function that receives a `Response` object produced by a call to `fetch()` and uses it to manufacture a source 
     * object.
     */
    export type ProcessFetchResponse = (response: Response, defaultProcessFn?: (response: Response) => Promise<SourceObject>) => Promise<SourceObject>;

    /**
     * Defines the data source identification information that is also found in data traces.
     */
    export interface IDataSourceInfo {
        /**
         * The name of the data source.
         */
        name: string;
        /**
         * Index (position) of the data source object in the builder's list of data sources.
         */
        index?: number;
    }

    /**
     * Defines the capabilities required from data sources.
     */
    export interface IDataSource extends IDataSourceInfo {
        /**
         * Asynchronously obtains the object that will be used as building block in the creation of the final merged 
         * object.
         */
        getObject(): Promise<SourceObject>;
        /**
         * Returns a data source information object on demand.  This is used when building a merged object with value 
         * tracing turned on.
         */
        trace(): IDataSourceInfo;
    }

    /**
     * Defines the capabilities required from data builder objects.
     */
    export interface IBuilder<TSourceObject> {
        /**
         * Adds the specified data source object to the list of data sources.
         * @param dataSource Data source to add to the builder's list of sources.
         */
        add(dataSource: IDataSource): IBuilder<TSourceObject>;
        /**
         * Adds the specified object to the collection of data sources that will be used to build the merged object.
         * @param obj Data object to include as part of the merged object, or a function that returns said object.
         */
        addObject(obj: SourceObject | (() => Promise<SourceObject>)): IBuilder<TSourceObject>;
        /**
         * Adds the specified dictionary to the collection of data sources that will be used to build the merged 
         * object.
         * @param dictionary Dictionary object to include (after processing) as part of the merged data object, or a 
         * function that returns said dictionary object.
         * @param hierarchySeparator Optional hierarchy separator.  If none is specified, a colon (:) is assumed.
         * @param prefix Optional prefix.  Only properties that start with the specified prefix are included, and the 
         * prefix is always removed after the dictionary is processed.  If no prefix is provided, then all dictionary 
         * entries will contribute to the merged object.
         */
        addDictionary(dictionary: Dictionary | (() => Promise<Dictionary>), hierarchySeparator?: string, prefix?: string): IBuilder<TSourceObject>;
        /**
         * Adds the specified dictionary to the collection of data sources that will be used to build the merged 
         * object.
         * @param dictionary Dictionary object to include (after processing) as part of the merged data object, or a 
         * function that returns said dictionary object.
         * @param hierarchySeparator Optional hierarchy separator.  If none is specified, a colon (:) is assumed.
         * @param predicate Optional predicate function that is called for every property in the dictionary.  Only 
         * when the return value of the predicate is `true` the property contributes to the merged object.
         */
        addDictionary(dictionary: Dictionary | (() => Promise<Dictionary>), hierarchySeparator?: string, predicate?: DataPredicate<keyof SourceObject>): IBuilder<TSourceObject>;
        /**
         * Adds a fetch operation to the collection of data sources that will be used to build the merged object.
         * @param url `URL` to fetch.
         * @param required Optional Boolean value indicating if `fetch()` must produce a data object.
         * @param init Optional fetch init data.  Refer to the `fecth()` [documentation](https://developer.mozilla.org/en-US/docs/Web/API/fetch#options) 
         * for information.
         * @param processFn Optional processing function that must return the source object to use in the merge 
         * process.  Useful if the unmodified response from `fetch()` is unsuitable for the building algorithm (is an 
         * XML response, a CSV, only part of the response is useful, etc.).
         */
        addFetched(url: URL | (() => Promise<URL>), required?: boolean, init?: RequestInit, processFn?: ProcessFetchResponse): IBuilder<TSourceObject>;
        /**
         * Adds a fetch operation to the collection of data sources that will be used to build the merged object.
         * @param request Request object to use when fetching.  Refer to the `fetch()` 
         * [documentation](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) for information.
         * @param required Optional Boolean value indicating if the fetch must produce a data object.
         * @param init Optional fetch init data.  Refer to the `fecth()` [documentation](https://developer.mozilla.org/en-US/docs/Web/API/fetch#options) 
         * for information.
         * @param processFn Optional processing function that must return the source object to use in the merge 
         * process.  Useful if the unmodified response from `fetch()` is unsuitable for the building algorithm (is an 
         * XML response, a CSV, only part of the response is useful, etc.).
         */
        addFetched(request: RequestInfo | (() => Promise<RequestInfo>), required?: boolean, init?: RequestInit, processFn?: ProcessFetchResponse): IBuilder<TSourceObject>;
        /**
         * Adds the specified JSON string to the collection of data sources that will be used to build the merged 
         * object.
         * @param json The JSON string to parse into a data object, or a function that returns said string.
         * @param jsonParser Optional JSON parser.  If not specified, the built-in `JSON` object will be used to parse.
         * @param reviver Optional reviver function.  For more information see the `JSON.parse()` 
         * [documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse#reviver).
         */
        addJson(json: string | (() => Promise<string>), jsonParser?: JSON, reviver?: (this: any, key: string, value: any) => any): IBuilder<TSourceObject>;
        /**
         * Adds a single value to the collection of data sources that will be used to build the merged object.
         * @param path Key comprised of names that determine the hierarchy of the value.  Refer to the naming 
         * convention of dictionaries for detailed information.
         * @param value Value of the property.
         * @param hierarchySeparator Optional hierarchy separator.  If not specified, colon (:) is assumed.
         */
        addSingleValue(path: string, value?: LeafValue, hierarchySeparator?: string): IBuilder<TSourceObject>;
        /**
         * Adds a single value to the collection of data sources that will be used to build the merged object.
         * @param dataFn Function that returns the `[key, value]` tuple that needs to be added.
         * @param hierarchySeparator Optional hierarchy separator.  If not specified, colon (:) is assumed.
         */
        addSingleValue(dataFn: () => Promise<[string, LeafValue]>, hierarchySeparator?: string): IBuilder<TSourceObject>;
        /**
         * Sets the data source name of the last data source added to the builder.  This is useful when enabling data 
         * tracing, as this name will appear in the traces.
         * @param name Name for the data source.
         */
        name(name: string): IBuilder<TSourceObject>;
        /**
         * Makes the last-added data source conditionally inclusive.
         * 
         * When data tracing is on, the `_qualifiedDs` property in the merged object will list all data sources that 
         * qualified for merging.
         * @param predicate Predicate function that is run whenever the build function runs.  If the predicate returns 
         * `true`, then the data source will be included; if it returns `false`, then the data source is skipped.
         * @param dataSourceName Optional data source name.  Provided to simplify the build chain and is merely a 
         * shortcut calling the `name()` function.  Equivalent to `when().name()`.
         */
        when(predicate: Predicate, dataSourceName?: string): IBuilder<TSourceObject>;
        /**
         * Asynchronously builds the desired merged object.
         */
        build<TTrace extends boolean>(traceValueSources?: TTrace): Promise<MergeResult<TSourceObject, TTrace>>;
    }

    /**
     * Base class to create new data source classes.  It implements `IDataSourceInfo`.
     */
    export class DataSource implements IDataSourceInfo {
        name: string;
        index?: number;
        /**
         * Initializes a new instance of this class.
         * @param name The data source's name (visible in data traces).
         */
        constructor(name: string);
        trace();
    }

    /**
     * Dictionary data source that converts a `Dictionary` object (flat object) into a hierarchical source object by 
     * parsing the properties' names according to a specific naming convetion.  Read the documentation for details.
     */
    export class DictionaryDataSource extends DataSource implements IDataSource {
        /**
         * Initializes a new instance of this class.
         * @param dictionary Dictionary object to include (after processing) as part of the merged data object, or a 
         * function that returns said dictionary object.
         * @param hierarchySeparator Optional hierarchy separator.  If none is specified, a colon (:) is assumed.
         * @param prefixOrDataPredicate Optional string representing a specific prefix that must be found in the 
         * dictionary's property names to participate in the merging process, or a predicate function that receives 
         * the property names and must return `true` to have the property participate in the merging process.
         */
        constructor(dictionary: SourceObject | (() => Promise<SourceObject>), hierarchySeparator: string, prefixOrDataPredicate?: string | DataPredicate<keyof SourceObject>);
        getObject(): Promise<SourceObject>;
    }

    /**
     * Fetch data source that fetches the source object on-demand from the provided URL.
     */
    export class FetchedDataSource extends DataSource implements IDataSource {
        /**
         * Initializes a new instance of this class.
         * @param input The URL to fetch from, the `RequestInfo` object to fetch with, or a function that returns 
         * either.
         * @param required Optional Boolean value indicating if the fetch must produce a data object.
         * @param init Optional fetch init data.  Refer to the `fecth()` [documentation](https://developer.mozilla.org/en-US/docs/Web/API/fetch#options) 
         * for information.
         * @param processFn Optional processing function that must return the source object to use in the merge 
         * process.  Useful if the unmodified response from `fetch()` is unsuitable for the building algorithm (is an 
         * XML response, a CSV, only part of the response is useful, etc.).
         */
        constructor(input: URL | RequestInfo | (() => Promise<URL | RequestInfo>), required: boolean = true, init?: RequestInit, processFn?: ProcessFetchResponse);
        getObject(): Promise<SourceObject>;
    }

    /**
     * JSON data source that deserializes strings that are meant to contain JSON data.
     */
    export class JsonDataSource extends DataSource implements IDataSource {
        /**
         * Initializes a new instance of this class.
         * @param json The JSON string to parse into a data object, or a function that returns said string.
         * @param jsonParser Optional JSON parser.  If not specified, the built-in `JSON` object will be used to parse.
         * @param reviver Optional reviver function.  For more information see the `JSON.parse()` 
         * [documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse#reviver).
         */
        constructor(json: string | (() => Promise<string>), jsonParser?: JSON, reviver?: (this: any, key: string, value: any) => any);
        getObject(): Promise<SourceObject>;
    }

    /**
     * Object data source that queues the provided object up for the merging process.
     * 
     * The object is not processed in any way.
     */
    export class ObjectDataSource extends DataSource implements IDataSource {
        /**
         * Initializes a new instance of this class.
         * @param obj Data object to include as part of the merged object, or a function that returns said object.
         */
        constructor(obj: SourceObject | (() => Promise<SourceObject>));
        getObject(): Promise<SourceObject>;
    }

    /**
     * Single value data source that creates a one-value dictionary object and queues it up for the merging process.
     */
    export class SingleValueDataSource extends DictionaryDataSource {
        /**
         * Initializes a new instance of this class.
         * @param path Key comprised of names that determine the hierarchy of the value.  Refer to the naming 
         * convention of dictionaries for detailed information.
         * @param value Value of the property.
         * @param hierarchySeparator Optional hierarchy separator.  If not specified, colon (:) is assumed.
         */
        constructor(path: string | (() => Promise<[string, LeafValue]>), value?: LeafValue, hierarchySeparator: string = ':');
    }

    /**
     * Builder factory function.
     */
    export default function wjMerge<TSourceObject = SourceObject>(): IBuilder<TSourceObject>;
}
