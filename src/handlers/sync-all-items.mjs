import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

const Bucket = 'flattened-user-data';
const Folder = 'ArticleData/';
const REGION = "eu-west-1";
const allItemsKey = Folder + 'allItems.json';


const s3Client = new S3Client({
    region:REGION
});

const sendToS3 = async (data) => {
    const putObjectCommand = new PutObjectCommand({
      Bucket,
      Key: allItemsKey,
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


const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const getAllItems = async (ExclusiveStartKey) => {
    var params = {
        TableName : "ArticleContentHandler-ContentArticles-MH8XMC50JHLW",
        ExclusiveStartKey
    };
    let items = [];
    try {
        do {
            const data = await ddbDocClient.send(new ScanCommand(params));
            items = items.concat(data.Items);
            params.ExclusiveStartKey = data.LastEvaluatedKey;
        } while (params.ExclusiveStartKey);
    } catch (err) {
        console.log("Error", err.name, err.message);

        if(err.name === "ProvisionedThroughputExceededException"){
            console.log('retrying');
            await new Promise(resolve => setTimeout(resolve, 1000));
            items.concat(await getAllItems(params.ExclusiveStartKey));
        }
        else{
            throw err;

        }
    }
    return items;
    };

export const syncAllItemsHandler = async (event) => {
    await getAllItems().then(async (items) => {
        await sendToS3(items);
        console.log('upload complete');
        return {
            statusCode: 200
        };
    }).catch(err => {
        console.info('error',err);
        return {
            statusCode: 500
        };
    });
}


