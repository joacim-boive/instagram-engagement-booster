import { InstagramService } from '../services/instagramService.js';
import fs from 'node:fs';

async function collectTrainingData() {
  const service = new InstagramService();
  
  try {
    const comments = await service.fetchAllComments();
    
    fs.writeFileSync(
      'training-data.json',
      JSON.stringify(comments, null, 2)
    );

    console.log(`Collected ${comments.length} comments for training`);
  } catch (error) {
    console.error('Error collecting training data:', error);
  }
}

collectTrainingData(); 