import { expect } from "chai";
import { JsonDataSource } from "../../src/datasources/JsonDataSource.js";

const stockJsonParser = globalThis.JSON;

describe('JsonDataSource', () => {
    beforeEach(() => globalThis.JSON = stockJsonParser);
    it("Should set the data source's name to 'JSON Data' when constructed.", () => {
        // Act.
        const ds = new JsonDataSource('{}');

        // Assert.
        expect(ds.name).to.equal('JSON Data');
    });
    describe('getObject', () => {
        it('Should evaulate the function to obtain the data.', async () => {
            // Arrange.
            let dataFnCalled = false;
            const dataFn = () => {
                dataFnCalled = true;
                return Promise.resolve('{}');
            }
            const ds = new JsonDataSource(dataFn);

            // Act.
            await ds.getObject();

            // Assert.
            expect(dataFnCalled).to.equal(true);
        });
    });
});
