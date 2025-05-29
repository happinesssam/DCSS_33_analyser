import {speciesData} from './dcssData.js';

export function parseMorgue(morgue){
    let result = {
        species:"",
        background:"",
        title:"",
        seed:"",
        god:"",
        XL:0,
        score:0,
        runes:3,
        gems:0,
        playerName:"",
        gold:0,
        goldSpent:0,
        str:0,
        dex:0,
        int:0,
        AC:0,
        EV:0,
        SH:0,
        HP:0,
        MP:0,        
        skills:{},
        places:[],
        actions:[],
        turnCount:-1,
        runTime:-1,
        mobsKilled:-1
    }

    const morgueSections = morgue.toLowerCase().split("\n\n");    

    result.seed = morgueSections[1].match(/\d+/g).join('');
    parseHeader(morgueSections[2], result);
    parseStats(morgueSections[4], result);
    parseEquipment(morgueSections[5], result);

    for(let i=5;i<morgueSections.length;i++){
        if(morgueSections[i].includes("you spent ")){
            result.goldSpent = parseInt(morgueSections[i].split("you spent ")[1].split(" gold")[0]);        
        }
        if(morgueSections[i].substr(0, 6)=="action"){
            parseActions(morgueSections[i], result);
        }
        if(morgueSections[i].substr(0, 5)=="skill"){
            parseSkills(morgueSections[i], result);
        }
        if(morgueSections[i].substr(0, 5)=="notes"){
            parsePlaces(morgueSections[i], result);
        }        
        if(morgueSections[i].substr(0, 12)=="grand total:"){
            parseMobsKilled(morgueSections[i], result);
        }
    }
    checkMorgue(result);
    return result;
}

function checkMorgue(result){
    const expectedKeys = [
    "species",
    "background",
    "title",
    "seed",
    "god",
    "XL",
    "score",
    "runes",
    "gems",
    "playerName",
    "gold",
    "goldSpent",
    "str",
    "dex",
    "int",
    "AC",
    "EV",
    "SH",
    "HP",
    "MP",
    "skills",
    "places",
    "actions",
    "turnCount",
    "runTime",
    "mobsKilled",
  ];

  const missingKeys = expectedKeys.filter(key => !(key in result));
  if (missingKeys.length > 0) {
    console.error("Error: Missing keys in result object:", missingKeys);
    return false;
  }

  for (const key in result) {
    if (result.hasOwnProperty(key)) {
      const value = result[key];
      switch (key) {
        case "species":
        case "background":
        case "title":
        case "seed":
        case "god":
        case "playerName":
          if (typeof value !== 'string') {
            console.error(`Error: ${key} should be a string, but got ${typeof value}`);
            return false;
          }
          break;
        case "XL":
        case "score":
        case "runes":
        case "gems":
        case "gold":
        case "goldSpent":
        case "str":
        case "dex":
        case "int":
        case "AC":
        case "EV":
        case "SH":
        case "HP":
        case "MP":
        case "turnCount":
        case "runTime":
        case "mobsKilled":
          if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
            console.error(`Error: ${key} should be a non-negative integer, but got ${value}`);
            return false;
          }
          break;
        case "skills":
          if (typeof value !== 'object' || value === null || Array.isArray(value)) {
            console.error(`Error: ${key} should be an object, but got ${typeof value}`);
            return false;
          }
          // You might want to add more specific checks for the skills object structure here
          break;
        case "places":
        case "actions":
          if (!Array.isArray(value)) {
            console.error(`Error: ${key} should be an array, but got ${typeof value}`);
            return false;
          }
          break;
        default:
          console.warn(`Warning: Unrecognized key "${key}" in result object.`);
      }
    }
  }

  // Add any specific value constraints here if needed
  // For example:
  if (result.runes < 0 || result.runes > 15) {
    console.error("Error: runes value is out of range.");
    return false;
  }
  if (result.turnCount < 0 ) {
    console.error("Error: turnCount value is outof range.");
    return false;
  }
  if (result.runTime < 0 ) {
    console.error("Error: turnCount value is outof range.");
    return false;
  }

  //console.log("Result object values are set correctly according to basic type checks.");
  return true;

}

function parseMobsKilled(killedLine, result){
    result.mobsKilled = parseInt(killedLine.match(/\d+/g).join(''));
}

function parseStats(stats, result){
    const statsSplit = stats.replaceAll("\n", "  ").split(":");
    const statsPairs = [];
    
    for(let i=0;i<statsSplit.length - 1;i++){
        let chunk = statsSplit[i].trim().split(" ");
        let chunk2 =  statsSplit[i + 1].trim().split(" ");
        statsPairs.push({key:chunk.pop(), value:chunk2[0]})

    }
    for(let i=0;i<statsPairs.length;i++){
        switch(statsPairs[i].key){
            case "hp":
            case "health":
                if(statsPairs[i].value.includes("(")){
                    result.HP = parseInt(statsPairs[i].value.split("(")[1].match(/\d+/g).join(''))
                }else{
                    result.HP = parseInt(statsPairs[i].value.split("/")[0]);
                }
                break;
            case "ac":
                result.AC = parseInt(statsPairs[i].value);
                break;
            case "mp":
            case "magic":
                result.MP = parseInt(statsPairs[i].value);
                break;
            case "ev":
                result.EV = parseInt(statsPairs[i].value);
                break;
            case "sh":
                result.SH = parseInt(statsPairs[i].value);
                break;
            case "str":
                result.str = parseInt(statsPairs[i].value);
                break;
            case "dex":
                result.dex = parseInt(statsPairs[i].value);
                break;
            case "int":
                result.int = parseInt(statsPairs[i].value);
                break;
            case "gold":
                result.gold = parseInt(statsPairs[i].value);
                break;
        }
    }
}

function parseEquipment(equipment, result){
    const stats = []
    const equipmentLines = equipment.replaceAll("\n", "-").split("-");
    ///console.log(equipmentLines);
    //seems better to just see what was done in actions
}

function parseActions(actions, result){
    const actionLines = actions.split("\n");
    let currentActionType = "";
    for(let i=2;i<actionLines.length;i++){
        const line = actionLines[i];
        const counts = line.split("|"); 
        let currentAction = {type:currentActionType, counts:[]};
        if(counts[0].includes(":")){
            currentActionType = currentAction.type = counts[0].split(":")[0].trim();  
            currentAction.action =  counts[0].split(":")[1].trim();        
        }else{
            currentAction.action = counts[0].trim();
        }
    
        for(let j=1;j<counts.length;j++){
            if(j<=counts.length - 3){ 
                currentAction.counts.push(Number(counts[j]));
            }else if(j==counts.length - 1){
                currentAction.total = parseInt(counts[j]);
            }
        }      
        result.actions.push(currentAction);
    }
}

function parseSkills(skills, result){
    const skillLines = skills.split("\n");
    for(let i=2;i<skillLines.length;i++){
        const lineSplit = skillLines[i].split("|");
        result.skills[lineSplit[0].trim()] = parseInt(lineSplit[2].trim());
    }
}

const branchLengths = {"d":15, "orc":2, "lair":5, "elf":3, "shoals":4, "snake":4, "spider":4, "swamp":4, "vaults": 5, 
                        "crypt": 3, "depths": 4, "slime": 5, "zot":5, "zig":27, "hell":1, "tomb":3, "pan":1, "temple":1,
                        "abyss":10, "coc":7, "tar":7, "geh": 7, "dis":7}

function parsePlaces(notes, result){
    const placesSeen = {};
    result.places = [];
    const noteLines = notes.split("\n");
    for(let i=3;i<noteLines.length;i++){
        const lineChunks = noteLines[i].split("|");
        if(lineChunks.length>2){
            const place = lineChunks[1].trim().split(":");
            const levelNum = place.length>1 ? parseInt(place[1]) : 1;

            if(placesSeen[place[0]]){
                if(levelNum>placesSeen[place[0]]){
                    placesSeen[place[0]] = levelNum;
                    if(levelNum==branchLengths[place[0]]){
                        result.places.push({name:place[0], level:levelNum});
                    }
                }
            }else{
                placesSeen[place[0]] = levelNum;
                result.places.push({name:place[0], level:levelNum});            
            }
        
        }
    }
}

function parseHeader(header, result){
    const headerLines = header.split("\n");
    const intro = headerLines[0].split("(");

    const intro1 = intro[0].split(" ");
    result.score = parseInt(intro1[0]);
    result.playerName = intro1[1];
    result.title = intro1.splice(2).join(" ").trim();

    const intro2 = intro[1].split(" "); 
    result.XL = parseInt(intro2[1]);  

    const speciesInfo = getSpecies(headerLines[1]);
    result.species = speciesInfo.name;
    result.background = headerLines[1]
        .split(speciesInfo.name)[1]
        .split(" on")[0].trim();

    for(let index in headerLines){
        const line = headerLines[index];
        if(line.includes(" was ") && line.includes(" of ")){
            result.god = line.split(" of ")[1].replace(/\./g, '');
        }
        if(line.includes(" and ") && line.includes(" runes")){
            result.runes = parseInt(line.split(" and ")[1].split(" runes")[0]);
        }
        if(line.includes(" and ") && line.includes(" gems")){
            result.gems = parseInt(line.split(" and ")[1].split(" gems")[0]);
        }
        if(line.includes("the game lasted")){
            result.turnCount = parseInt(line.split("(")[1].split(" ")[0]);
            result.runTime = getTime(line.split("the game lasted ")[1].split(" ")[0]);
        }
    }
}

function getTime(timeString){
    let seconds = 0;
    const multipliers = [1, 60, 3600, 86400];
    const timeParts = timeString.split(":").reverse();
    for(let i=0;i<timeParts.length;i++){
        seconds += parseInt(timeParts[i]) * multipliers[i];
    }
    return seconds;
}

function getSpecies(line){
    for(let species in speciesData){
        if(line.includes(species)){
            return speciesData[species];
        }
    }
    return null;
}


//chatGPT a go go 
function extractPlayerNames(str, prefix, suffix) {
  const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedSuffix = suffix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`${escapedPrefix}(.*?)${escapedSuffix}`);


    const match = str.match(regex);
    if (match && match[1]) {
      return match[1].trim(); // Trim any potential extra whitespace
    }

  return "";
}