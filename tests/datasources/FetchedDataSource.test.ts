/// <reference path="../../src/wj-merge.d.ts" />
import 'chai/register-expect.js';
import { expect } from 'chai';
import { FetchedDataSource } from '../../src/datasources/FetchedDataSource.js';
import { beforeEach } from 'mocha';
import { tryCatchError } from '../helpers.js';

class MockedResponse implements Response {
    body: ReadableStream<Uint8Array> | null = null;
    bodyUsed: boolean = false;
    arrayBuffer(): Promise<ArrayBuffer> {
        throw new Error('Not implemented.');
    };
    blob(): Promise<Blob> {
        throw new Error('Not implemented.');
    };
    formData(): Promise<FormData> {
        throw new Error('Not implemented.');
    };
    json(): Promise<any> {
        if (!this.#bodyText) {
            return Promise.resolve(null);
        }
        return Promise.resolve(JSON.parse(this.#bodyText));
    };
    text(): Promise<string> {
        if (!this.#bodyText) {
            return Promise.resolve('');
        }
        return Promise.resolve(this.#bodyText);
    };
    headers: Headers;
    ok: boolean;
    redirected: boolean;
    status: number;
    statusText: string = '';
    type: ResponseType;
    url: string = '';
    #bodyText: string | undefined;
    clone(): Response {
        throw new Error('Not implemented.');
    }
    constructor(status: number, body?: string) {
        this.status = status;
        this.ok = status >= 200 && status < 300;
        this.redirected = status >= 300 && status < 400;
        this.type = 'default';
        this.#bodyText = body;
        this.headers = new Headers();
    }
}

describe('FetchedDataSource', () => {
    const defaultNameTest = (input: URL | RequestInfo | (() => Promise<URL | RequestInfo>), expectedName: string) => {
        // Act.
        const ds = new FetchedDataSource(input);

        // Assert.
        expect(ds.name).to.equal(expectedName);
    };
    const testUrl = 'http://my.example.com/data'
    const defaultNameTests = [
        {
            input: testUrl,
            inputName: testUrl,
            expectedName: `Fetch ${testUrl}`
        },
        {
            input: new Request('http://my.example.com/data'),
            inputName: 'Request object',
            expectedName: `Fetch ${testUrl}`
        },
        {
            input: new URL(testUrl),
            inputName: 'URL object',
            expectedName: `Fetch ${testUrl}`
        },
        {
            input: () => Promise.resolve(testUrl),
            inputName: 'function',
            expectedName: `Fetch Data`
        }
    ];
    defaultNameTests.forEach(tc => {
        it(`Should set the data source's name to "${tc.expectedName}" when initialized with "${tc.inputName}" as input.`, () => defaultNameTest(tc.input, tc.expectedName));
    });
    const originalFetch = globalThis.fetch;
    describe('getObject', () => {
        beforeEach(() => {
            globalThis.fetch = originalFetch;
        });
        it('Should evaluate the input function to obtain the data.', async () => {
            // Arrange.
            let receivedInput: any;
            globalThis.fetch = function(i: any, _o?: RequestInit) {
                receivedInput = i;
                return Promise.resolve(new MockedResponse(200, '{ "p": 1 }'));
            };
            const ds = new FetchedDataSource(() => Promise.resolve(testUrl));

            // Act.
            await ds.getObject();

            // Assert.
            expect(receivedInput).to.equal(testUrl);
        });
        const fetchParamsTest = async (input: RequestInfo | URL | (() => Promise<RequestInfo | URL>), expectedInput: RequestInfo | URL) => {
            // Arrange.
            const init: RequestInit = {
                headers: {
                    'content-type': 'application/json'
                }
            };
            let passedInput: any;
            let passedInit: RequestInit | undefined;
            globalThis.fetch = function(i: any, o?: RequestInit) {
                passedInput = i;
                passedInit = o;
                return Promise.resolve(new MockedResponse(200, '{ "p": 1 }'));
            };
            const ds = new FetchedDataSource(input, false, init);

            // Act.
            await ds.getObject();

            // Assert.
            expect(passedInput).to.equal(expectedInput);
            expect(passedInit).to.equal(init);
        };
        const urlInput = new URL(testUrl);
        const requestInput = new Request(testUrl);
        const fetchParamsTests = [
            {
                input: testUrl,
                inputType: 'String URL',
                expectedInput: testUrl
            },
            {
                input: () => Promise.resolve(testUrl),
                inputType: 'Function that returns a string URL',
                expectedInput: testUrl
            },
            {
                input: urlInput,
                inputType: 'URL object',
                expectedInput: urlInput
            },
            {
                input: () => Promise.resolve(urlInput),
                inputType: 'Function that returns a URL object',
                expectedInput: urlInput
            },
            {
                input: requestInput,
                inputType: 'Request object',
                expectedInput: requestInput
            },
            {
                input: () => Promise.resolve(requestInput),
                inputType: 'Function that returns a Request object',
                expectedInput: requestInput
            }
        ];
        fetchParamsTests.forEach(tc => {
            it(`Should pass the input and the init options to fetch(): ${tc.inputType}`, () => fetchParamsTest(tc.input, tc.expectedInput));
        });
        const defaultProcessFnTest = async (status: number, required: boolean) => {
            // Arrange.
            globalThis.fetch = function (i: any, o?: RequestInit) {
                return Promise.resolve(new MockedResponse(status, '{ "p": 1 }'));
            };
            const ds = new FetchedDataSource(testUrl, required);

            // Act.
            const error = await tryCatchError(() => ds.getObject());

            // Assert.
            if (required) {
                expect(error).to.be.instanceOf(Error);
            }
            else {
                expect(error).to.be.null;
            }
        };
        const defaultProcessFnTests = [
            {
                statusCode: 204,
                required: false
            },
            {
                statusCode: 204,
                required: true
            },
            {
                statusCode: 404,
                required: false
            },
            {
                statusCode: 404,
                required: true
            },
            {
                statusCode: 500,
                required: false
            },
            {
                statusCode: 500,
                required: true
            },
            {
                statusCode: 301,
                required: false
            },
            {
                statusCode: 301,
                required: true
            },
        ];
        defaultProcessFnTests.forEach(tc => {
            it(`Should ${tc.required ? '' : 'not '}throw when the HTTP response carries status code ${tc.statusCode} and the data source is ${tc.required ? '' : 'not '}required.`, () => defaultProcessFnTest(tc.statusCode, tc.required));
        });
    });
});
