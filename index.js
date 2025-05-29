import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import fs from 'node:fs/promises';
import path from 'node:path';
import { checkIfFileExists, downloadAndSaveOrOpenFile } from './utils.js';
import { MorgueData } from './morgueData.js';
import {parseMorgue} from './morgueCruncher.js';
import {getActions, getSpecies, getBackgrounds, getGod, getGold, getCombos, getLevel, getUsedShield, getEndGameItems, filterMorguesForChallenges, getMoguesApport, getPlayerName} from './analyser.js';

const baseUrl = "https://crawl.develz.org/tournament/0.33/";
const tournamentUrl = baseUrl + "all-players-ranks.html";
let topN = 151;
const outputDirectory = "morgues";

const morgueData = new MorgueData();
await morgueData.init();

async function processPlayerPage(playerUrl, playerName, playerRank) {
  try {
    const html = await downloadAndSaveOrOpenFile(playerUrl, outputDirectory + "/" + playerName, "playerPage.html");

    const $ = cheerio.load(html);
    const table = getWonGamesTable($);

    const gameRows = table.find('tr'); // Adjust selector as needed

    const rowsData = [];
    gameRows.each((i, row) => {
      const firstLink = $(row).find('a').first(); // Find the first 'a' tag in the row
      if (firstLink.length > 0) {
        const href = firstLink.attr('href');
        rowsData.push({ rowIndex: i, href: href });
      }
    });

    if(!morgueData.hasPlayer(playerName)){
      morgueData.addPlayer(playerName, playerRank);
    }
    
    const morgues = []
    for(const row of rowsData){
      if(!morgueData.hasMorgue(playerName, row.href)){        
        const morgueFile = await downloadAndSaveOrOpenFile( row.href, outputDirectory + "/" + playerName, row.href.split('/').pop());
        morgues.push(morgueFile); 
        const morgueParsed = parseMorgue(morgueFile);
        morgueParsed.morgueURL = row.href;
        morgueData.addMorgue(playerName, morgueParsed);
      }     
    }
    if(morgues.length>0){
      await morgueData.saveData();
    }

    console.log(`  Processed ${morgues.length} won games for ${playerName}`);
    return morgues
   // await new Promise(resolve => setTimeout(resolve, 2000)); // Be polite
  } catch (error) {
    console.error(`  Error processing player page ${playerUrl}:`, error);
  }
}

function getWonGamesTable($) {
  const tablesWithCaption = $('table').has('caption');
  // Iterate through these tables and check their caption text
  for (let i = 0; i < tablesWithCaption.length; i++) {
    const table = $(tablesWithCaption[i]);
    const caption = table.find('caption').text().trim(); // Get the caption text and trim whitespace

    if (caption.indexOf('Recent wins')>=0) {
      return table; // Return the Cheerio object representing the found table
    }
  }
  return null; // Return null if no table with the specified caption is found
}

async function downloadPlayersList() {
  try {
    await fs.mkdir(outputDirectory, { recursive: true });

    const html = await downloadAndSaveOrOpenFile(tournamentUrl, "./", "players.html");
    const $ = cheerio.load(html);
    const playerLinks = $('tr').slice(0, topN).toArray();

    for (const tr of playerLinks) {
      const playerNameNode = $(tr)._findBySelector("a").toArray();
      const header = $(tr).find("th");
      
      if(playerNameNode.length){
        //2 a links per td, no otehr class or id
        const playerName = playerNameNode[0].children[0].data;
        const playerUrl = playerNameNode[0].attribs.href;
        console.log(`Processing player: ${playerName} - ${playerUrl}`);
        await processPlayerPage(playerUrl, playerName, header[0].children[0].data);
      }      
    }
    console.log('Finished processing top players.');
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

async function downloadPlayer(playerName) {
  try {
    await fs.mkdir(outputDirectory, { recursive: true });

    const html = await downloadAndSaveOrOpenFile(tournamentUrl, "./", "players.html");
    const $ = cheerio.load(html);
    const playerLinks = $('tr').toArray();
    playerName = playerName.toLowerCase();

    for (const tr of playerLinks) {
      const playerNameNode = $(tr)._findBySelector("a").toArray();
      const header = $(tr).find("th");
      
      if(playerNameNode.length && playerNameNode[0].children[0].data.toLowerCase() === playerName){
        //2 a links per td, no otehr class or id
        const playerName = playerNameNode[0].children[0].data;
        const playerUrl = playerNameNode[0].attribs.href;
        console.log(`Processing player: ${playerName} - ${playerUrl}`);
        await processPlayerPage(playerUrl, playerName, header[0].children[0].data);
      }      
    }
    console.log(`Finished processing player ${playerName}.`);
  } catch (error) {
    console.error('An error occurred:', error);
  }
}
async function testParse(){
  const fileDir = "morgues_node/Aarujn";
  const file = "morgue-Aarujn-20250510-041103.txt";
  const morgueFile = await downloadAndSaveOrOpenFile( "", fileDir, file);

  parseMorgue(morgueFile);
}


if(process.argv.length > 2){
  switch(process.argv[2]){
    case "downloadPlayersList":
      topN = parseInt(process.argv[3]);
      if(!isNaN(topN)){
        topN++;//
        downloadPlayersList();
      }else{
        throw("Invalid number");
      }      
      break;
    case "downloadPlayer":
      const playerName = process.argv[3];
      if(playerName){
        downloadPlayer(playerName);
      }
      break;
    case "test":
      testParse();
      break;
    case "analyse":
      const noChallenges = process.argv[4]== "no_challenges" || process.argv[5]== "no_challenges";
      switch(process.argv[3]){
        case "species":
          getAnalysis("Species", getSpecies, "results/species.txt", "", noChallenges);
          break;
        case "backgrounds":
          getAnalysis("Background", getBackgrounds, "results/backgrounds.txt", "", noChallenges);
          break;
        case "gods":
          getAnalysis("Gods", getGod, "results/gods.txt", "", noChallenges);
          break;
        case "combos":
          getAnalysis("Combos", getCombos, "results/combos.txt", "", noChallenges);
          break;
        case "gold":
          getAnalysis("Gold", getGold, "results/gold.txt", "", noChallenges);
          break;
        case "level":
          getAnalysis("LeveL", getLevel, "results/level.txt", "", noChallenges);
          break; 
        case "all":
          
          await getAnalysis("Species", getSpecies, "results/species.txt", "", noChallenges);
          await getAnalysis("Background", getBackgrounds, "results/backgrounds.txt", "", noChallenges);
          await getAnalysis("Gods", getGod, "results/gods.txt", "", noChallenges);
          await getAnalysis("Combos", getCombos, "results/combos.txt", "", noChallenges);
          await getAnalysis("Gold", getGold, "results/gold.txt", "", noChallenges);
          await getAnalysis("LeveL", getLevel, "results/level.txt", "", noChallenges);
          await getAnalysis("Melee", getEndGameItems, "results/items_melee.txt", ['melee'], noChallenges);
          await getAnalysis("Armour", getEndGameItems, "results/items_armour.txt", ['armour'], noChallenges);
          await getAnalysis("Ranged", getEndGameItems, "results/items_ranged.txt", ['fire'], noChallenges);
          await getAnalysis("Evokables", getEndGameItems, "results/items_evokables.txt", ['evoke', 3], noChallenges);
          await getAnalysis("Spells", getEndGameItems, "results/items_spells.txt", ['cast'], noChallenges);
          await getAnalysis("Spells Mid", getEndGameItems, "results/items_spells_mid.txt", ['cast', 2], noChallenges);
          await getAnalysis("Spells Early", getEndGameItems, "results/items_spells_early.txt", ['cast', 1], noChallenges);
          await getAnalysis("Shapeshift", getEndGameItems, "results/items_shapeshift.txt", ['form'], noChallenges);
          await getAnalysis("Shapeshift Early", getEndGameItems, "results/items_shapeshift_early.txt", ['form', 1], noChallenges);
          break;
        case "apport":
          let morguesApport = morgueData.getMorgues(200);
          morguesApport = getMoguesApport(morguesApport, ["cast"]);
          console.log("rar:" + morguesApport.length);
          console.log("no challenges", filterMorguesForChallenges(morguesApport).length);
          console.log("combo", getCombos(morguesApport));
          console.log("background", getBackgrounds(morguesApport));
          console.log("gods", getGod(morguesApport));
          console.log("armour", getEndGameItems(morguesApport, ['armour']));
          console.log("form", getEndGameItems(morguesApport, ['form']));
          console.log("player", getPlayerName(morguesApport));
          break;
      }
      break;
  }
}
async function getAnalysis(description, func, output, params, no_challenges=false){
  const results =[];  

  let morgues = morgueData.getMorgues(20);if(no_challenges) morgues = filterMorguesForChallenges(morgues);
  results.push({title:"Top 20", count:morgues.length, result:func( morgues, params)});    

  morgues = morgueData.getMorgues(50);if(no_challenges) morgues = filterMorguesForChallenges(morgues);
  results.push({title:"Top 50", count:morgues.length, result:func( morgues, params)}); 

  morgues = morgueData.getMorgues(200);if(no_challenges) morgues = filterMorguesForChallenges(morgues);
  results.push({title:"Top 200", count:morgues.length, result:func( morgues, params)}); 

  morgues = morgueData.getMorguesMinRunes(15);if(no_challenges) morgues = filterMorguesForChallenges(morgues);
  results.push({title:"15 Runes", count:morgues.length, result:func( morgues, params)}); 

  morgues = morgueData.getMorguesFinishedZigs();if(no_challenges) morgues = filterMorguesForChallenges(morgues);
  results.push({title:"Zigg Cleared", count:morgues.length, result:func( morgues, params)}); 

  morgues = morgueData.getMorguesNoZig();if(no_challenges) morgues = filterMorguesForChallenges(morgues);
  results.push({title:"No Zigg", count:morgues.length, result:func( morgues, params)}); 
  
  //Code to build the reddit tables
  let result = description + "\n";
  for(let i=0;i<results.length;i++){
    result += results[i].title +  ":\n";
    result += arToString(results[i].result) + "\n";
  }

  result += "\r\n**" + description + "**\r\n\r\n";
  for(let i=0;i<results.length;i++){
    result += "|" + results[i].title +  " (" + results[i].count + " games)"
  }
  result += "|\r\n";
  for(let i=0;i<results.length;i++){
    result +="|:-";
  }
  result += "|\r\n";
  const numRows = results.reduce((max, current)=>{
    return Math.max(max, current.result.length);
  }, 0);
  for(let i=0;i<numRows;i++){
    for(let j=0;j<results.length;j++){
      if(i<results[j].result.length){
        result += "|" + capitalise(results[j].result[i].item)+": " + results[j].result[i].count + " - share: " + results[j].result[i].share.toFixed(2) + "%";
      }else{
        result += "|";
      }
    }
    result += "|\r\n";
  }

  if(output){
    if(no_challenges) output = output.replace("results/", "results_no_challenges/");
    await fs.mkdir(output.split('/')[0], { recursive: true });
    await fs.writeFile(output, result);
    console.log("Saved result to " + JSON.stringify(output));
  }else{
    console.log(result);    
  }
}
function capitalise(str){
  return str.charAt(0).toUpperCase() + str.slice(1);
}
function arToString(ar){
  if(Array.isArray(ar)){    
    return ar.reduce((result, current)=>{
      result += JSON.stringify(current) + ",\n";
      return result;
    }, "");
  }else{
    return JSON.stringify(ar);
  }
}
