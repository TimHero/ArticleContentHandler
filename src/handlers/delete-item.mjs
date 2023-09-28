// Create clients and set shared const values outside of the handler.

// Create a DocumentClient that represents the query to add an item
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

// Get the DynamoDB table name from environment variables
const tableName = process.env.TABLE_NAME;

/**
 * A simple example includes a HTTP post method to add one item to a DynamoDB table.
 */
export const DeleteItemHandler = async (event) => {
    if (event.httpMethod !== 'DELETE') {
        if(event.httpMethod === 'OPTIONS'){
            return {
                statusCode: 200,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "Content-Type",
                    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
                },
            }
        }
        else{
            throw new Error(`postMethod only accepts POST method, you tried: ${event.httpMethod} method.`);
        }
        
    }
    // All log statements are written to CloudWatch
    console.info('received:', event);

    const id = event.pathParameters.id;

    // Creates a new item, or replaces an old item with a new item
    // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#put-property
    var params = {
        TableName : "ArticleContentHandler-ContentArticles-MH8XMC50JHLW",
        Key: { id: id },
    };

    try {
        const data = await ddbDocClient.send(new DeleteCommand(params));
        console.log("Success - item added or updated", data);
      } catch (err) {
        console.log("Error", err.stack);
        return {
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
            },
            statusCode: 500
        }
        
      }

    const response = {
        statusCode: 204,
        headers: {
            "Access-Control-Allow-Origin": "*", 
            "Access-Control-Allow-Headers": "Content-Type", 
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
        },
        body: ""
    };

    // All log statements are written to CloudWatch
    console.info(`response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`);
    return response;
};
