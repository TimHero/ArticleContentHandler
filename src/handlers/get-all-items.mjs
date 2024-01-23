import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const Bucket = 'flattened-user-data';
const Folder = 'ArticleData/';
const REGION = "eu-west-1";
const allItemsKey = Folder + 'allItems.json';
const publishedItemsKey = Folder + 'publishedItems.json';

function isStringInArray(inputArray, searchString) {
    // Create a regular expression pattern for each element in the array
    const regexPatterns = inputArray.map(pattern => new RegExp(`^${pattern.replace(/%/g, '.*')}$`));
  
    // Check if the searchString matches any pattern in the array
    return regexPatterns.some(pattern => pattern.test(searchString));
  }

export const streamToString = (stream) =>
new Promise((resolve, reject) => {
  const chunks = [];
  stream.on("data", (chunk) => chunks.push(chunk));
  stream.on("error", reject);
  stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
});


const s3Client = new S3Client({
    region:REGION
});

const getFromS3 = async (key = allItemsKey) => {
    const getObjectCommand = new GetObjectCommand({
    Bucket,
    Key: key,
    });
    const data = await s3Client.send(getObjectCommand);
    return await streamToString(data.Body);
}

// Get the DynamoDB table name from environment variables
const tableName = process.env.TABLE_NAME;

/**
 * A simple example includes a HTTP get method to get all items from a DynamoDB table.
 */
export const getAllItemsHandler = async (event) => {
    if (event.httpMethod !== 'GET') {
        throw new Error(`getAllItems only accept GET method, you tried: ${event.httpMethod}`);
    }
    const queryParams = event.queryStringParameters || {};
    var response = {};
    try{
        var items = [];
       if(queryParams.all){
            items = JSON.parse(await getFromS3());
        }
        else{
            items = JSON.parse(await getFromS3(publishedItemsKey));
        }

        if(queryParams.companyId){
            if(queryParams.region){
                items = items.filter(item => !item.companies || !item.companies.length || (item.companies.includes(queryParams.companyId) && (!item.companyRegions  || !item.companyRegions.length || isStringInArray(item.companyRegions, queryParams.region))));
            }
            else{
                items = items.filter(item => !item.companies || !item.companies.length || item.companies.includes(queryParams.companyId));
            }
           
        }
        response = {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*", // Replace * with your allowed origin or list of allowed origins
                "Access-Control-Allow-Headers": "Content-Type", // Add other allowed headers as needed
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE", // Add other allowed HTTP methods as needed
              },
            body: JSON.stringify(items)
        };

       
    
    }
    catch(err){
        console.log(err);
        response = {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*", // Replace * with your allowed origin or list of allowed origins
                "Access-Control-Allow-Headers": "Content-Type", // Add other allowed headers as needed
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE", // Add other allowed HTTP methods as needed
              }
        };
    }
    
    

    // All log statements are written to CloudWatch
    console.info(`response from: ${event.path} statusCode: ${response.statusCode}`);
    return response;
}
