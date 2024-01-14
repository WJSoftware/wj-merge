import 'chai/register-expect.js';
import Builder from '../src/Builder.js';
import * as allExports from '../src/index.js';
import { expect } from 'chai';

describe('All Exports', () => {
    it('Should export the DataSource class.', () => {
        // Assert.
        expect(allExports.DataSource).to.exist;
    });
    it('Should export the entry function as default.', () => {
        // Assert.
        expect(allExports.default).to.exist;
        expect(allExports.default).to.be.a('function');
    });
});
describe('wjMerge', () => {
    it('Should return a builder object when called.', () => {
        // Act.
        const result = allExports.default();

        // Assert.
        expect(result).to.be.instanceOf(Builder);
    });
});
