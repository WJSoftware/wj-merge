import type { IBuilder, SourceObject } from "wj-merge";
export { default as Builder } from './Builder.js';
export * from './datasources/DataSource.js';
export * from './datasources/DictionaryDataSource.js';
export * from './datasources/FetchedDataSource.js';
export * from './datasources/JsonDataSource.js';
export * from './datasources/ObjectDataSource.js';
export * from './datasources/SingleValueDataSource.js';
import Builder from "./Builder.js";

export default function wjMerge<TSourceObject extends SourceObject>(): IBuilder<TSourceObject> {
    return new Builder();
}
