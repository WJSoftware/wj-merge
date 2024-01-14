/// <reference path="../src/wj-merge.d.ts" />
import 'chai/register-expect.js';
import { forEachProperty } from '../src/helpers.js';
import merge from '../src/merge.js';
import { expect } from 'chai';
import { type SourceObject } from 'wj-merge';

describe('merge', () => {
    const testValidationArg1Fn = (arg: any) => {
        // Act.
        // @ts-expect-error
        const act = () => merge(arg, null);

        // Assert.
        expect(act).to.throw(Error);
    };
    it('Should throw if the first array element is null.', () => testValidationArg1Fn([null]));
    it('Should throw if the first array element is undefined.', () => testValidationArg1Fn([undefined]));
    it('Should throw if the first argument is not an array.', () => testValidationArg1Fn({}));
    const testValidationArg2Fn = (arg: any, shouldThrow: boolean) => {
        // Act.
        const act = () => merge([{}, arg], arg);

        // Assert.
        if (shouldThrow) {
            expect(act).to.throw(Error);
        }
        else {
            expect(act).to.not.throw();
        }
    };
    it('Should not throw if any subsequent array element is null.', () => testValidationArg2Fn(null, false));
    it('Should not throw if any subsequent array element is undefined.', () => testValidationArg2Fn(undefined, false));
    it('Should throw if any subsequent array element is not an object.', () => testValidationArg2Fn(456, true));
    const propertyMismatchTestFn = (config1: SourceObject, config2: SourceObject) => {
        // Act.
        const act = () => merge([config1, config2]);

        // Assert.
        expect(act).to.throw(Error);
    };
    it('Should throw an error if the value of a property in object 1 is an object but in object 2 is a leaf value.', () => propertyMismatchTestFn({
        p1: 'Set A',
        p2: {
            p2_p1: true
        },
        p3: 123
    }, {
        p1: 'Set B',
        p2: false,
        p3: 456
    }));
    it('Should throw an error if the value of a property in object 1 is an object but in object 2 is an array.', () => propertyMismatchTestFn({
        p1: 'Set A',
        p2: {
            p2_p1: true
        },
        p3: 123
    }, {
        p1: 'Set B',
        p2: [true, false],
        p3: 456
    }));
    it('Should throw an error if the value of a property in object 1 is a leaf value but in object 2 is an object.', () => propertyMismatchTestFn({
        p1: 'Set A',
        p2: {
            p2_p1: true
        },
        p3: 123
    }, {
        p1: {
            p1_p1: 'Set B'
        },
        p2: {
            p2_p1: false
        },
        p3: 456
    }));
    it('Should throw an error if the value of a property in object 1 is an array value but in object 2 is an object.', () => propertyMismatchTestFn({
        p1: 'Set A',
        p2: {
            p2_p1: true
        },
        p3: [123]
    }, {
        p1: 'Set B',
        p2: {
            p2_p1: false
        },
        p3: {
            p3_p1: [456]
        }
    }));
    it('Should create a result that has all the properties defined in objects 1 and 2.', () => {
        // Arrange.
        const config1 = {
            p1: 'A',
            p2: 3,
            p3: false
        };
        const config2 = {
            p1: 'B',
            p3: true,
            p4: [1, 2, 3],
            p5: {
                p5_p1: 'Yes'
            }
        };
        const expectedResult = {
            p1: 'B',
            p2: 3,
            p3: true,
            p4: [1, 2, 3],
            p5: {
                p5_p1: 'Yes'
            }
        };

        // Act.
        const result = merge([config1, config2]);

        // Assert.
        expect(result).to.be.deep.equal(expectedResult);
    });
});
