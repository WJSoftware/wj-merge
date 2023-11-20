import type { SourceObject, IDataSource, TraceData, MergeResult, LeafValue } from "wj-merge";
import { forEachProperty, isArray, isSourceObject as isSourceObject } from "./helpers.js";
import Builder from "./Builder.js";

type TraceRequest<T extends SourceObject> = {
    trace: TraceData<T>,
    dataSource: IDataSource
}

function mergeTwo<TSourceObject extends SourceObject>(obj1: SourceObject, obj2: SourceObject, trace?: TraceRequest<TSourceObject>) {
    let recursiveTrace: TraceRequest<SourceObject> | undefined;
    // Add the properties of obj2.
    forEachProperty(obj2, (key, value) => {
        const value1 = obj1[key];
        if (value1 !== undefined) {
            // If it is a scalar/array value, the value in object 2 must also be a scalar or array.
            // If it is an object value, then value in object 2 must also be an object.
            if (isSourceObject(value1) && !isSourceObject(value)) {
                throw new Error(`The destination value of property "${key}" is an object, but the second object is not providing an object value.`);
            }
            if (!isSourceObject(value1) && isSourceObject(value)) {
                throw new Error(`The destination value of property "${key}" is a scalar/array value, but the second object is not providing a scalar/array value.`);
            }
            if (isSourceObject(value1)) {
                // Recursively merge obj2 into obj1.
                if (trace) {
                    recursiveTrace = {
                        trace: (trace.trace[key as keyof TSourceObject] = trace.trace[key] ?? {}) as TraceData<TSourceObject>,
                        dataSource: trace.dataSource
                    }
                }
                mergeTwo(value1, value as SourceObject, recursiveTrace);
            }
            else {
                obj1[key] = value as LeafValue;
                if (trace) {
                    (trace.trace as TraceData)[key] = trace.dataSource.trace();
                }
            }
        }
        else {
            if (trace && isSourceObject(value)) {
                // Must trace, so merge.
                obj1[key] = {} as TSourceObject;
                recursiveTrace = {
                    trace: (trace.trace[key as keyof TSourceObject] = trace.trace[key] ?? {}) as TraceData,
                    dataSource: trace.dataSource
                };
                mergeTwo((obj1[key] as SourceObject), value, recursiveTrace);
            }
            else {
                obj1[key] = value;
                if (!isSourceObject(value) && trace) {
                    // Update the trace.
                    (trace.trace as TraceData)[key] = trace.dataSource.trace();
                }
            }
        }
    });
    return obj1;
}

export default function merge<TSourceObject extends SourceObject, B extends boolean>(objects: TSourceObject[], dataSources?: IDataSource[]): MergeResult<TSourceObject, B> {
    if (!isArray(objects)) {
        throw new Error('The provided value is not an array of objects.');
    }
    // There must be at least one object.
    if (objects.length === 0 || !isSourceObject(objects[0]) || objects[0] === null || objects[0] === undefined) {
        throw new Error('The first element of the array is required and must be a suitable configuration object.');
    }
    // If there are data sources, the number of these must match the number of provided objects.
    if (dataSources && objects.length !== dataSources?.length) {
        throw new Error('The number of provided objects differs from the number of provided data sources.');
    }
    let result = objects[0] as MergeResult<TSourceObject, B>;
    let initialIndex = 1;
    let trace: TraceRequest<TSourceObject> | undefined;
    if (dataSources) {
        result = {} as MergeResult<TSourceObject, B>;
        initialIndex = 0;
        trace = {
            trace: {} as TraceData<TSourceObject>,
            dataSource: dataSources[0]
        };
    }
    for (let idx = initialIndex; idx < objects.length; ++idx) {
        let nextObject: TSourceObject = objects[idx];
        // If null or undefined, just substitute for an empty object.
        if (nextObject === null || nextObject === undefined) {
            nextObject = {} as TSourceObject;
        }
        if (!isSourceObject(nextObject)) {
            throw new Error(`Configuration object at index ${idx} is not of the appropriate type.`);
        }
        if (trace) {
            trace.dataSource = (dataSources as IDataSource[])[idx];
        }
        mergeTwo<TSourceObject>(result, nextObject, trace);
    }
    if (trace) {
        result._trace = trace.trace;
    }
    return result as MergeResult<TSourceObject, B>;
}