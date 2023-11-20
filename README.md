# wj-merge

> Object merger that creates a single object using objects from various data sources, applying them sequentially and 
> conditionally.

This package is a deep object merging algorithm that is also capable of tracing the origin of the data.  This is very 
helpful for troubleshooting and for features for a more elaborate, more specific package or objective.

## Package Description

Review the information carefully to determine if this package is right for you.  Before proceeding, review the list of 
concepts.

| Concept | Relevant Type(s) | Description |
| - | - | - |
| Leaf Value | `LeafValue`, `SingleLeafValue` | A leaf value is a value that cannot contain other values; it is *the* value. |
| Node | `SourceObject` | A node is a value that contains other values, be it leaf values or other nodes. |
| Root Node | `SourceObject` | Represented by the same type as the node, the only difference is the semantics:  The root node is the data object. |
| Source Object | `SourceObject` | Source objects (or sources) are the inputs that feed the merging algorithm; this is a synonym for nodes. |
| Merge Result | `MergeResult<T, B>` | The output of the builder's `build()` method and the final goal. |
| Dictionary | `Dictionary` | A dictionary is an object with a flat hierarchy:  Its properties are all leaf values. |

### Leaf Values

Values of type `string`, `number`, `Date`, `boolean`, `Function` and `null` are leaf values.  Leaf values cannot be 
overridden during the merging process by nodes, only by other leaf values.

Arrays of the aforementioned types are also leaf values.  This means that arrays are replaced entirely during the 
merging process.

Consider the following two JSON files representing two source objects (or root nodes):

```json
{
    "A": "a-value",
    "B": "b-value"
}
```

```json
{
    "A": 1
}
```

When feeding `wj-merge` these two sources in this order, the merge result will be:

```json
{
    "A": 1,
    "B": "b-value"
}
```

This happens because `A` in the first JSON is of type `string`, a leaf value type, and `A` in the second JSON is of 
type `number`, also a leaf value type.

If the second JSON happened to be something like:

```json
{
    "A": {
        "A+": 1
    }
}
```

Then the merging algorithm would throw an error because once the nature of the property has been established, it 
cannot be changed:  The first JSON established that `A` was a leaf value, and the merging algorithm will make sure 
this continues to be the case.

The inverse is also true:  Once a property's type has been established as a node, a subsequent source object cannot 
redefine this nature as a leaf value.

## Data Sources

Source objects are fed into the merging algorithm by using builder semantics and the concept of data sources.  Any 
object that satisfies the `IDataSource` interface can be used to provide a source object.

The package provides 5 data sources out of the box:

| Data Source | Class Name | Description |
| - | - | - |
| Dictionary | `DictionaryDataSource` | Injects a dictionary object as data source.  Property names in dictionaries follow a naming convention to specify the object's hierarchy.  This is useful when importing from environment variables or INI files. |
| Fetched | `FetchedDataSource` | Executes a `fetch()` operation to obtain the source object. |
| Json | `JsonDataSource` | Parses string data into a JSON object to be used as source. |
| Object | `ObjectDataSource` | The simplest, yet most versatile data source:  Provides an object as source. |
| SingleValue | `SingleValueDataSource` | Injects a source object with a single value.  The value's name must follow the naming convention of dictionaries. |

## Quickstart

1. Import the builder factory function, `wjMerge()`.
2. Execute `wjMerge()` to obtain a builder.
3. Add data using the appropriate data source.  The builder has corresponding helper functions for the out-of-box data 
sources.
4. Execute and await `build()`.

```typescript
import wjMerge from "wj-merge";

const result = await wjMerge()
    .addDictionary(...)
    .addFetched(...)
    .addJson(...)
    .addObject(...)
    .addSingleValue(...)
    .build();

// Optionally, you can have this code in its own module, and export the result.
export default result;
```

You can include as many sources as needed, and you can prepare your own data source if the out-of-the-box ones are 
insufficient.  The most popular one, which isn't included in this package so it can be equally used in the browser and 
NodeJS, is a File data source that reads a file from disk (usually a JSON file, but the sky is the limit).

```typescript
import { DataSource, type IDataSource, type SourceObject } from "wj-merge";

export class FileDataSource extends DataSource implements IDataSource {
    #fileName: string;
    constructor(fileName: string) {
        super(`File: ${fileName}`);
        this.#fileName = fileName;
    }

    getObject(): Promise<SourceObject> {} {
        // Implementation goes here.  Recommendation: import { readFile } from 'fs/promises'.
    }
}
```

The DataSource class is the base class for all data sources, but it is optional.  It simplifies development of new 
sources, though, so this is why it exists.  Furthermore, you can use the out-of-the-box data sources as base classes.

## Documentation

The detailed documentation is found in [this repository's Wiki](./wiki).

## Building Extensions

2Do
