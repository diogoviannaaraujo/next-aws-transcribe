import { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';

const REGION = 'us-east-1'; // Replace with your region
const ACCESS_KEY = process.env.AWS_ACCESS_KEY_ID; // Add your AWS Access Key in .env
const SECRET_KEY = process.env.AWS_SECRET_ACCESS_KEY; // Add your AWS Secret Key in .env
const SESSION_TOKEN = process.env.AWS_SESSION_TOKEN; // Optional, for temporary credentials

AWS.config.update({
  accessKeyId: ACCESS_KEY,
  secretAccessKey: SECRET_KEY,
  sessionToken: SESSION_TOKEN,
  region: REGION,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const transcribeService = new AWS.TranscribeService();

    const params = {
      LanguageCode: 'en-US', // Adjust language code as needed
      MediaEncoding: 'pcm', // Amazon Transcribe supports pcm encoding for live streams
      MediaSampleRateHertz: 16000, // Standard audio sample rate
    };

    const url = transcribeService.getTranscriptionJobUrl(params); // Presigned WebSocket URL
    res.status(200).json({ url });
  } catch (error) {
    console.error('Error generating Transcribe URL:', error);
    res.status(500).json({ error: 'Error generating URL' });
  }
}