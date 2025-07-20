import { FirehoseClient, PutRecordBatchCommand } from '@aws-sdk/client-firehose';
import { Buffer } from 'buffer';
import { gunzipSync } from 'zlib';

// Create a Firehose client using the current region
const region = process.env.AWS_REGION;  // Get the region from the environment variable
const firehoseClient = new FirehoseClient({ region });

export const handler = async (event: any) => {
  console.log('Received event:', JSON.stringify(event, null, 2));  // Log the event for debugging

  if (!event.awslogs || !event.awslogs.data) {
    throw new Error('CloudWatch Logs data is missing');
  }

  try {
    // Decode the base64 encoded string
    const compressedData = Buffer.from(event.awslogs.data, 'base64');
    // Decompress the data using gunzipSync
    const decompressedData = gunzipSync(compressedData).toString('utf-8');
    // Parse the decompressed JSON data
    const parsedData = JSON.parse(decompressedData);

    if (!parsedData.logEvents) {
      throw new Error('No log events found in the decompressed data');
    }

    // Transform logs into the format required by Firehose
    const records = parsedData.logEvents.map((logEvent: any) => ({
      Data: logEvent.timestamp + "\t" + 
            parsedData.logGroup + "\t" + 
            logEvent.id + "\t" + 
            logEvent.message
    }));

    const params = {
      DeliveryStreamName: process.env.DELIVERY_STREAM_NAME!,
      Records: records
    };

    try {
      const command = new PutRecordBatchCommand(params);
      await firehoseClient.send(command);
      return {
        statusCode: 200,
        body: JSON.stringify('Successfully processed log events')
      };
    } catch (error) {
      console.error('Error sending logs to Firehose', error);
      throw new Error('Error sending logs to Firehose');
    }
  } catch (error) {
    console.error('Error processing CloudWatch Logs data', error);
    throw new Error('Error processing CloudWatch Logs data');
  }
};
