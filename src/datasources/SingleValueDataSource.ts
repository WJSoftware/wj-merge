import type { Dictionary, LeafValue } from "wj-merge";
import { DictionaryDataSource } from "./DictionaryDataSource.js";

const buildDictionary = (key: string | (() => Promise<[string, LeafValue]>), value?: LeafValue): Dictionary | (() => Promise<Dictionary>) => {
    if (!key) {
        throw new Error('No valid path was provided.');
    }
    const dicFn = (k: string, v: LeafValue) => {
        const dic: Dictionary = {};
        dic[k] = v;
        return dic;
    };
    if (typeof key === 'function') {
        return async () => {
            const [k, v] = await (key as (() => Promise<[string, LeafValue]>))();
            return dicFn(k, v);
        };
    }
    return dicFn(key, value!);
}

export class SingleValueDataSource extends DictionaryDataSource {
    constructor(path: string | (() => Promise<[string, LeafValue]>), value?: LeafValue, hierarchySeparator: string = ':') {
        super(buildDictionary(path, value), hierarchySeparator);
        if (typeof path === 'string') {
            this.name = `Single Value: ${path}`;
        }
        else {
            this.name = 'Single Value';
        }
    }
}
