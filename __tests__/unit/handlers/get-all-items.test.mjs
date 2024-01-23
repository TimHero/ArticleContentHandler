// Import getAllItemsHandler function from get-all-items.mjs 
import { Readable } from 'stream';
import { getAllItemsHandler } from '../../../src/handlers/get-all-items.mjs';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { mockClient } from "aws-sdk-client-mock";

// This includes all tests for getAllItemsHandler() 
describe('Test getAllItemsHandler', () => { 
    const s3Mock = mockClient(S3Client);

    beforeEach(() => {
        s3Mock.reset();
    });

    it('should return items from mocked S3', async () => { 
        const items = [{ id: 'id1' }, { id: 'id2' }];

        const readableStream = new Readable();
        readableStream.push(JSON.stringify(items));
        readableStream.push(null); // End the stream
        s3Mock.on(GetObjectCommand).resolves({
            Body: readableStream, // Mock the response as a readable stream
        });

        const event = { 
            httpMethod: 'GET',
            queryStringParameters: {
                companyId: 'yourCompanyId',
                region: 'yourRegion',
            },
        };

        // Invoke getAllItemsHandler() 
        const result = await getAllItemsHandler(event);

        const expectedResult = { 
            statusCode: 200, 
            body: JSON.stringify(items),
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
            }
        };

        // Compare the result with the expected result 
        expect(result).toEqual(expectedResult);
    });

    // a test that verifies that the function doesn't return items if the companyId is not in the item's companies array
    it('should return empty array if the companyId is not in the item\'s companies array', async () => { 
        const items = [{ id: 'id1', companies: ['anotherCompanyId'] }, { id: 'id2' }, { id: 'id3', companies: ['yourCompanyId'] }];

        const readableStream = new Readable();
        readableStream.push(JSON.stringify(items));
        readableStream.push(null); // End the stream
        s3Mock.on(GetObjectCommand).resolves({
            Body: readableStream, // Mock the response as a readable stream
        });

        const event = { 
            httpMethod: 'GET',
            queryStringParameters: {
                companyId: 'yourCompanyId',
                region: 'yourRegion',
            },
        };

        // Invoke getAllItemsHandler() 
        const result = await getAllItemsHandler(event);

        const expectedResult = { 
            statusCode: 200, 
            body: JSON.stringify([{ id: 'id2' }, { id: 'id3', companies: ['yourCompanyId'] }]),
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
            }
        };

        // Compare the result with the expected result 
        expect(result).toEqual(expectedResult);
    });

    //test that verifies that the function doesn't return items that are in the companyId but not in the companyRegions array
    it('should return empty array if the companyId is in the item\'s companies array but not in the companyRegions array', async () => { 
        const items = [{ id: 'id1', companies: ['yourCompanyId'], companyRegions: ['anotherRegion'] }, { id: 'id2' }, { id: 'id3', companies: ['yourCompanyId'], companyRegions: ['yourRegion'] },{ id: 'id4', companies: ['yourCompanyId'] }, { id: 'id5', companies: ['yourCompanyId'], companyRegions: ['%urRe%'] }];

        const readableStream = new Readable();
        readableStream.push(JSON.stringify(items));
        readableStream.push(null); // End the stream
        s3Mock.on(GetObjectCommand).resolves({
            Body: readableStream, // Mock the response as a readable stream
        });

        const event = { 
            httpMethod: 'GET',
            queryStringParameters: {
                companyId: 'yourCompanyId',
                region: 'yourRegion',
            },
        };

        // Invoke getAllItemsHandler() 
        const result = await getAllItemsHandler(event);

        const expectedResult = { 
            statusCode: 200, 
            body: JSON.stringify([{ id: 'id2' },{ id: 'id3', companies: ['yourCompanyId'], companyRegions: ['yourRegion'] },{ id: 'id4', companies: ['yourCompanyId'] },{ id: 'id5', companies: ['yourCompanyId'], companyRegions: ['%urRe%'] }]),
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
            }
        };

        // Compare the result with the expected result 
        expect(result).toEqual(expectedResult);
    });
});
