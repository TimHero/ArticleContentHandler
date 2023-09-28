// Create clients and set shared const values outside of the handler.

// Create a DocumentClient that represents the query to add an item
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client } from '@aws-sdk/client-s3';


const Bucket = 'flattened-user-data';
const Folder = 'ArticleData/';
const REGION = "eu-west-1";
const allItemsKey = Folder + 'allItems.json';


const s3Client = new S3Client({
    region:REGION
});


const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

// Get the DynamoDB table name from environment variables
const tableName = process.env.TABLE_NAME;

/**
 * A simple example includes a HTTP get method to get all items from a DynamoDB table.
 */
export const getAllItemsHandler = async (event) => {
    if (event.httpMethod !== 'GET') {
        throw new Error(`getAllItems only accept GET method, you tried: ${event.httpMethod}`);
    }
    console.info('received:', event);
    const queryParams = event.queryStringParameters || {};
    var params = {
        TableName : "ArticleContentHandler-ContentArticles-MH8XMC50JHLW"
    };
    let items = [];
    try {
        do {
            const data = await ddbDocClient.send(new ScanCommand(params));
            items = items.concat(data.Items);
            params.ExclusiveStartKey = data.LastEvaluatedKey;
        } while (params.ExclusiveStartKey);
    } catch (err) {
        console.log("Error", err);
    }
    if(!queryParams.all){
        items = items.filter(item => item.published);
    }
    const response = {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin": "*", // Replace * with your allowed origin or list of allowed origins
            "Access-Control-Allow-Headers": "Content-Type", // Add other allowed headers as needed
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE", // Add other allowed HTTP methods as needed
          },
        body: JSON.stringify(items)
    };

    // All log statements are written to CloudWatch
    console.info(`response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`);
    return response;
}
