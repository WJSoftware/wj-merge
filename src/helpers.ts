'use strict';

import { SourceObject } from "wj-merge";

/**
 * Tests the provided object to determine if it is an array.
 * @param obj Object to test.
 * @returns True if the object is an array; false otherwise.
 */
export function isArray(obj: unknown): obj is any[] { return Array.isArray(obj); }

/**
 * Tests the provided object to determine if it is an object that can be considered a non-leaf property in an object.
 * @param obj Object to test.
 * @returns True if the object is a non-leaf object; false otherwise.
 */
export function isSourceObject(obj: unknown): obj is SourceObject {
    return typeof obj === 'object' && !isArray(obj) && !(obj instanceof Date);
}

/**
 * Tests the provided object to determine if it is a function.
 * @param obj Object to test.
 * @returns True if the object is a function; false otherwise.
 */
export function isFunction(obj: unknown): obj is Function { return typeof obj === 'function'; }

/**
 * Enumerates all the properties of the specified object that are owned by the object, therefore excluding the ones 
 * inherited from the prototype.
 * @param obj Object whose properties will be enumerated.
 * @param loopBody Callback function that receives the property name (key), value and index.  If the callback returns 
 * truthy then the enumeration stops.
 */
export function forEachProperty<T extends SourceObject>(obj: T, loopBody: (key: keyof T, value: SourceObject[keyof SourceObject], index?: number) => boolean | void) {
    if (!isFunction(loopBody)) {
        throw new Error('The provided loop body is not a function.');
    }
    for (const [key, value] of Object.entries(obj)) {
        let index = 0;
        if (loopBody(key, value, index++)) {
            break;
        }
    }
};

/**
 * Attempts to parse the provided value in order to convert it to a more specialized primitive type.
 * 
 * Specifically it will attempt to obtain a Boolean, integer, floating point value or date.  If all fails, then the 
 * value is kept as a string.
 * @param value Value to parse.
 * @returns The converted value, or the value's string representation if no conversion was possible.
 */
export function attemptParse(value: (string | null)) {
    const isInteger = /^-?\d+$/;
    const isHex = /^0x[0-9a-fA-F]+$/;
    const isFloat = /^-?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?$/;
    const isDate = /^\d{4}-\d{2}-\d{2}[T ]{1}\d{2}:\d{2}:\d{2}(?:\.\d+)?/;
    if (value === undefined || value === null) {
        return value;
    }
    if (typeof value !== 'string') {
        throw new Error('The value to parse must always be of the string data type.');
    }
    // Boolean.
    if (value === 'true' || value === 'false') {
        return value === 'true';
    }
    let parsedValue: string | number | null = null;
    // Integer.
    if (isInteger.test(value)) {
        parsedValue = Number.parseInt(value, 10);
    }
    else if (isHex.test(value)) {
        parsedValue = Number.parseInt(value, 16);
    }
    // Float.
    else if (isFloat.test(value)) {
        parsedValue = Number.parseFloat(value);
    }
    if (!Number.isNaN(parsedValue) && parsedValue !== null) {
        return parsedValue;
    }
    // Date.
    if (isDate.test(value)) {
        parsedValue = Date.parse(value);
        if (!Number.isNaN(parsedValue)) {
            return new Date(parsedValue);
        }
    }
    // Return as string.
    return value.toString();
};
