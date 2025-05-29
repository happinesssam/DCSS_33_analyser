import fetch from 'node-fetch';
import fs from 'node:fs/promises';
import path from 'node:path';

export async function checkIfFileExists(filePath) {
  return fs.access(filePath)
    .then(() => {
      console.log(`File exists: ${filePath}`);
      return true;
    })
    .catch((error) => {
      if (error.code === 'ENOENT') {
        console.log(`File does not exist: ${filePath}`);
        return false;
      } else {
        console.error(`Error checking file ${filePath}:`, error);
        return false;
      }
    });
}

/**
 * 
 * @param string fileUrl 
 * @param string outputDirectory 
 * @param string outputfile 
 * @returns 
 */
export async function downloadAndSaveOrOpenFile(fileUrl, outputDirectory, outputfile){
  try {
    await fs.mkdir(outputDirectory, { recursive: true });
    const exists = await checkIfFileExists(outputDirectory + "/" + outputfile);
    let file;
    if(!exists){
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error(`Error fetching file: HTTP status ${response.status}`);
      }
      const html = await response.text();
      const filePath = path.join(outputDirectory + "/" + outputfile);
      await fs.writeFile(filePath, html, 'utf-8');
      console.log(`    Downloaded: ${filePath}`);   
      file = html;
      await new Promise(resolve => setTimeout(resolve, 100));
    }else{
      file = await fs.readFile(outputDirectory + "/" + outputfile, 'utf-8');     
    }
    return file;
  } catch(error)
  {
    console.error('An error occurred:', error);
  }
}