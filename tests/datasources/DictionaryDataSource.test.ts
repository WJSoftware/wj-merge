/// <reference path="../../src/wj-merge.d.ts" />
import 'chai/register-expect.js';
import { DictionaryDataSource } from '../../src/datasources/DictionaryDataSource.js';
import { expect } from 'chai';
import { tryCatchError } from '../helpers.js';
import type { DataPredicate, Dictionary, SourceObject } from 'wj-merge';

describe('DictionaryDataSource', () => {
    it('Should name itself as "Dictionary" upon construction.', () => {
        // Act.
        const ds = new DictionaryDataSource({}, ':');

        // Assert.
        expect(ds.name).to.equal('Dictionary');
    });
    const failedConstructionTest = (dic: any, sep: any) => {
        // Act.
        const act = () => new DictionaryDataSource(dic, sep);

        // Assert.
        expect(act).to.throw(Error);
    };
    const failedConstructionTests = [
        {
            dic: 123,
            sep: ':',
            target: 'dictionary',
            text: 'a number'
        },
        {
            dic: 'hi',
            sep: ':',
            target: 'dictionary',
            text: 'a string'
        },
        {
            dic: true,
            sep: ':',
            target: 'dictionary',
            text: 'a Boolean'
        },
        {
            dic: new Date(),
            sep: ':',
            target: 'dictionary',
            text: 'a date'
        },
        {
            dic: [],
            sep: ':',
            target: 'dictionary',
            text: 'an empty array'
        },
        {
            dic: '',
            sep: ':',
            target: 'dictionary',
            text: 'an empty string'
        },
        {
            dic: ['abc'],
            sep: ':',
            target: 'dictionary',
            text: 'an array'
        },
        {
            dic: null,
            sep: ':',
            target: 'dictionary',
            text: 'null'
        },
        {
            dic: undefined,
            sep: ':',
            target: 'dictionary',
            text: 'undefined'
        },
        {
            dic: { 'key': 'value' },
            sep: '',
            target: 'hierarchy separator',
            text: 'an empty string'
        },
        {
            dic: { 'key': 'value' },
            sep: null,
            target: 'hierarchy separator',
            text: 'null'
        },
        {
            dic: { 'key': 'value' },
            sep: undefined,
            target: 'hierarchy separator',
            text: 'undefined'
        },
        {
            dic: { 'key': 'value' },
            sep: () => false,
            target: 'hierarchy separator',
            text: 'a function'
        },
        {
            dic: { 'key': 'value' },
            sep: [],
            target: 'hierarchy separator',
            text: 'an empty array'
        },
        {
            dic: { 'key': 'value' },
            sep: ['def'],
            target: 'hierarchy separator',
            text: 'an array'
        },
        {
            dic: { 'key': 'value' },
            sep: {},
            target: 'hierarchy separator',
            text: 'an empty object'
        },
        {
            dic: { 'key': 'value' },
            sep: { 'ab': 'cd' },
            target: 'hierarchy separator',
            text: 'an object'
        },
    ];
    failedConstructionTests.forEach(t => {
        it(`Should throw an error if constructed with ${t.text} for ${t.target}.`, () => failedConstructionTest(t.dic, t.sep));
    });
    it('Should throw an error if the provided dictionary is not a flat object.', () => {
        // Arrange.
        const dic = {
            prop1: 123,
            prop2: {
                prop3: 'abc'
            }
        };
        // // Act.
        // @ts-expect-error
        const act = () => new DictionaryDataSource(dic, ':');

        // Assert.
        expect(act).to.throw(Error);
    });
    describe('getObject', () => {
        it('Should throw an error if the dictionary provided via a function is not a flat object.', async () => {
            // Arrange.
            const dic = {
                prop1: 123,
                prop2: {
                    prop3: 'abc'
                }
            };
            // @ts-expect-error
            const ds = new DictionaryDataSource(() => dic, ':');

            // Act.
            const error = await tryCatchError(async () => await ds.getObject());

            // Assert.
            expect(error).to.be.instanceOf(Error);
        });
        const prefixTest = async (dic: Dictionary, expectedResult: SourceObject, prefixOrPredicate?: string | DataPredicate<keyof Dictionary>) => {
            // Arrange.
            const ds = new DictionaryDataSource(dic, ':', prefixOrPredicate);

            // Act.
            const result = await ds.getObject();

            // Assert.
            expect(result).to.deep.equal(expectedResult);
        };
        const prefixTests: {
            prefix: string | DataPredicate<keyof Dictionary> | undefined;
            dic: Dictionary;
            expectedResult: SourceObject;
            text: string;
        }[] = [
                {
                    prefix: undefined,
                    dic: { p1: 1, p2: 'B' },
                    expectedResult: { p1: 1, p2: 'B' },
                    text: 'No prefix'
                },
                {
                    prefix: 'A_',
                    dic: { p1: 1, A_p2: 'B' },
                    expectedResult: { p2: 'B' },
                    text: 'With string prefix, 1 qualifying, 1 unqualifying'
                },
                {
                    prefix: 'A_',
                    dic: { A_p1: 1, A_p2: 'B' },
                    expectedResult: { p1: 1, p2: 'B' },
                    text: 'With string prefix, 2 qualifying'
                },
                {
                    prefix: 'A_',
                    dic: { p1: 1, p2: 'B' },
                    expectedResult: {},
                    text: 'With string prefix, 2 unqualifying'
                },
                {
                    prefix: p => p === 'p2',
                    dic: { p1: 1, p2: 'B' },
                    expectedResult: { p2: 'B' },
                    text: 'With predicate, 1 qualifying, 1 unqualifying'
                },
                {
                    prefix: p => true,
                    dic: { p1: 1, p2: 'B' },
                    expectedResult: { p1: 1, p2: 'B' },
                    text: 'With predicate, 2 qualifying'
                },
                {
                    prefix: p => false,
                    dic: { p1: 1, p2: 'B' },
                    expectedResult: {},
                    text: 'With predicate, 2 unqualifying'
                },
            ];
        prefixTests.forEach(tc => {
            it(`Should only include the properties that pass the prefix test in the inflated object: ${tc.text}`, () => prefixTest(tc.dic, tc.expectedResult, tc.prefix));
        });
        const hierarchyTest = async (dic: Dictionary, hierarchySeparator: string, expectedResult: SourceObject) => {
            // Arrange.
            const ds = new DictionaryDataSource(dic, hierarchySeparator);

            // Act.
            const result = await ds.getObject();

            // Assert.
            expect(result).to.be.deep.equal(expectedResult);
        };
        const hierarchyTests: {
            hs: string;
            dic: Dictionary;
            expected: SourceObject;
            text: string;
        }[] = [
                {
                    hs: ':',
                    dic: { p1: 'abc', p2: 123 },
                    expected: { p1: 'abc', p2: 123 },
                    text: 'No hierarchy'
                },
                {
                    hs: ':',
                    dic: { 'p1:p1.1': 'abc', p2: 123 },
                    expected: { p1: { 'p1.1': 'abc' }, p2: 123 },
                    text: '2-level hierarchy on 1 property'
                },
                {
                    hs: ':',
                    dic: { 'p1:p1.1': 'abc', 'p2:p2.1': 123 },
                    expected: { p1: { 'p1.1': 'abc' }, p2: { 'p2.1': 123 } },
                    text: '2-level hierarchy on 2 properties'
                },
                {
                    hs: '-',
                    dic: { 'p1-p1.1': 'abc', 'p2-p2.1': 123 },
                    expected: { p1: { 'p1.1': 'abc' }, p2: { 'p2.1': 123 } },
                    text: '2-level hierarchy on 2 properties with (-) hierarchy separator'
                },
                {
                    hs: ':',
                    dic: { 'p1:p1.1:p1.1.1': 'abc', p2: 123 },
                    expected: { p1: { 'p1.1': { 'p1.1.1': 'abc' } }, p2: 123 },
                    text: '3-level hierarchy on 1 property'
                }
            ];
        hierarchyTests.forEach(tc => {
            it(`Should inflate the dictionary object according to the hierarchy separator: ${tc.text}`, () => hierarchyTest(tc.dic, tc.hs, tc.expected));
        })
    });
});
