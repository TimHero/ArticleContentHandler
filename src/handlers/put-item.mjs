// Create clients and set shared const values outside of the handler.

// Create a DocumentClient that represents the query to add an item
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

// Get the DynamoDB table name from environment variables
const tableName = process.env.TABLE_NAME;
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
const sendToS3 = async (data, key = allItemsKey) => {
  
    const putObjectCommand = new PutObjectCommand({
      Bucket,
      Key: key,
      Body:JSON.stringify(data),
    });
  
  try {
    const response = await s3Client.send(putObjectCommand);
    console.info('upload complete');
    return response;
  } catch (err) {
  console.error("Error uploading file:", err);
  }
  }

const getFromS3 = async () => {
    const getObjectCommand = new GetObjectCommand({
    Bucket,
    Key: allItemsKey,
    });
    const data = await s3Client.send(getObjectCommand);
    return JSON.parse( await streamToString(data.Body));
}
/**
 * A simple example includes a HTTP post method to add one item to a DynamoDB table.
 */
export const putItemHandler = async (event) => {
    if (event.httpMethod !== 'POST') {
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
    console.info('received:', event);

    // Get id and name from the body of the request
    const body = JSON.parse(event.body);
    if(!body.id){
        body.id = uuidv4();
    }
    if(body.published && !body.firstPublished){
        body.firstPublished = new Date().toISOString();
    }
    body.lastUpdated = new Date().toISOString();
    // Creates a new item, or replaces an old item with a new item
    // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#put-property
    var params = {
        TableName : "ArticleContentHandler-ContentArticles-MH8XMC50JHLW",
        Item: body 
    };

    try {
        const data = await ddbDocClient.send(new PutCommand(params));
        const allArticles = await getFromS3();

        // get the index of the item with the matching id
        const index = allArticles.findIndex(item => item.id === body.id);
        if(index === -1){
            allArticles.push(body);
        }
        else{
            allArticles[index] = body;
        }
        await sendToS3(allArticles);
        if(body.published){
            const publishedArticles = allArticles.filter(item => item.published);
            await sendToS3(publishedArticles, publishedItemsKey);
        }

      } catch (err) {
        console.log("Error", err.stack);
        return {
            statusCode: 500
        }
        
      }

      const response = {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json', 
        },
        body: JSON.stringify({ message: 'Success' })
    };
    
    return response;
};
