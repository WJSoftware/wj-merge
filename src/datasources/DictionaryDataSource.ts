import type { LeafValue, SourceObject, IDataSource, DataPredicate, Dictionary } from "wj-merge";
import { DataSource } from "./DataSource.js";
import { attemptParse, forEachProperty, isSourceObject } from "../helpers.js";

const processKey = (key: keyof SourceObject, hierarchySeparator: string, prefix?: string) => {
    if (prefix) {
        key = key.toString().substring(prefix.length);
    }
    return key.toString().split(hierarchySeparator);
};

const ensurePropertyValue = (obj: SourceObject, name: string) => {
    if (obj[name] === undefined) {
        obj[name] = {};
    }
    return obj[name];
}

export class DictionaryDataSource extends DataSource implements IDataSource {
    private _dictionary: Dictionary | (() => Promise<Dictionary>);
    private _hierarchySeparator: string;
    private _prefixOrDataPredicate?: string | DataPredicate<keyof Dictionary>;

    #buildDataPredicate(): [DataPredicate<keyof Dictionary>, string] {
        let dataPredicateFn: DataPredicate<keyof Dictionary> = _name => true;
        let prefix: string = '';
        if (this._prefixOrDataPredicate) {
            if (typeof this._prefixOrDataPredicate === "string") {
                prefix = this._prefixOrDataPredicate;
                dataPredicateFn = name => name.toString().startsWith(prefix);
            }
            else {
                dataPredicateFn = this._prefixOrDataPredicate;
            }
        }
        return [dataPredicateFn, prefix];
    }

    #validateDictionary(dic: Dictionary) {
        if (!isSourceObject(dic)) {
            throw new Error('The provided dictionary must be a flat object.');
        }
        const [dataPredicateFn, prefix] = this.#buildDataPredicate();
        forEachProperty(dic, (k, v) => {
            if (!dataPredicateFn(k)) {
                // This property does not qualify, so skip its validation.
                return false;
            }
            if (isSourceObject(v)) {
                throw new Error(`The provided dictionary must be a flat object:  Property ${k} has a node value.`);
            }
        });
    }

    #inflateDictionary(dic: Dictionary) {
        const result: SourceObject = {};
        if (!dic || !isSourceObject(dic)) {
            return result;
        }
        const [dataPredicateFn, prefix] = this.#buildDataPredicate();
        forEachProperty(dic, (key, value) => {
            if (dataPredicateFn(key)) {
                // Object values are disallowed because a dictionary's source is assumed to be flat.
                if (isSourceObject(value)) {
                    throw new Error(`Dictionary data sources cannot hold object values.  Key: ${key}`);
                }
                const keyParts = processKey(key, this._hierarchySeparator, prefix);
                let obj: LeafValue | SourceObject = result;
                for (let i = 0; i < keyParts.length - 1; ++i) {
                    obj = ensurePropertyValue(obj as SourceObject, keyParts[i]);
                    if (!isSourceObject(obj)) {
                        throw new Error(`Cannot set the value of variable "${key}" because "${keyParts[i]}" has already been created as a leaf value.`);
                    }
                }
                // Ensure there is no value override.
                if (obj[keyParts[keyParts.length - 1]]) {
                    throw new Error(`Cannot set the value of variable "${key}" because "${keyParts[keyParts.length - 1]}" has already been created as an object to hold other values.`);
                }
                // If the value is a string, attempt parsing.  This is to support data sources that can only hold strings
                // as values, such as enumerating actual system environment variables.
                if (typeof value === 'string') {
                    value = attemptParse(value);
                }
                obj[keyParts[keyParts.length - 1]] = value;
            }
        });
        return result;
    }

    constructor(dictionary: Dictionary | (() => Promise<Dictionary>), hierarchySeparator: string, prefixOrDataPredicate?: string | DataPredicate<keyof Dictionary>) {
        super('Dictionary');
        if ((typeof dictionary !== 'object' && typeof dictionary !== 'function') || dictionary === null) {
            throw new Error('The provided dictionary is neither a valid object nor a function.');
        }
        if (!hierarchySeparator) {
            throw new Error('Dictionaries must specify a hierarchy separator.');
        }
        if (typeof hierarchySeparator !== 'string') {
            throw new Error('The hierarchy separator must be a string.');
        }
        this._hierarchySeparator = hierarchySeparator;
        if (typeof prefixOrDataPredicate === 'string' && prefixOrDataPredicate.length === 0) {
            throw new Error('The provided prefix value cannot be an empty string.');
        }
        this._prefixOrDataPredicate = prefixOrDataPredicate;
        if (dictionary && typeof dictionary !== 'function') {
            this.#validateDictionary(dictionary);
        }
        this._dictionary = dictionary;
    }

    async getObject(): Promise<SourceObject> {
        let dic = this._dictionary;
        if (dic && typeof dic === 'function') {
            dic = await dic();
        }
        const inflatedObject = this.#inflateDictionary(dic);
        return Promise.resolve(inflatedObject);
    }
}
