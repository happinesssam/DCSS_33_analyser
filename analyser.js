import { jobsData, speciesData }   from "./dcssData.js";

export function getActions(morgues, actionType, actionId){
    let actions = {total: 0, totalUnique:0, distribution: [], distributionUnique: []};
    if(!actionId){
        actions.items = {};//{total: 0, distribution: []}
    }
    morgues.forEach(morgue => {
        morgue.actions.forEach(action => {
            try{
                if(action.type == actionType && (!actionId || action.action == actionId)){
                    if(!actionId){
                        if(!actions.items[action.action]){
                            actions.items[action.action] = {total: 0, totalUnique:0, distribution: [], distributionUnique: [], lateUseCount:0};
                        }
                        actions.items[action.action].total += action.total;
                        actions.items[action.action].totalUnique ++;
                    }
                    actions.total += action.total;
                    if(action.total>0) actions.totalUnique ++;
                    if(!actionId){
                      actions.items[action.action].lateUseCount+=action.counts[action.counts.length-1];
                    }
                    for(let i = 0; i < action.counts.length; i++){
                        if(!actions.distribution[i]){
                            actions.distribution[i] = 0;
                            actions.distributionUnique[i] = 0;
                        }
                        actions.distribution[i] += action.counts[i];
                        if(action.counts[i]>0) actions.distributionUnique[i] ++;
                        if(!actionId){
                            if(!actions.items[action.action].distribution[i]){
                                actions.items[action.action].distribution[i] = 0;
                                actions.items[action.action].distributionUnique[i] = 0;
                            }
                            actions.items[action.action].distribution[i] += action.counts[i];
                            if(action.counts[i]>0) actions.items[action.action].distributionUnique[i] ++;
                        }
                    }
                }
                
            } catch(e){
                console.log(action);
            }
        });
    })
    return actions;
}

export function getEndGameItems(morgues, params){
  const items= {};
  let noMelee = 0;
  morgues.forEach(morgue => {
    const actionCounts = {};
    morgue.actions.forEach(action => {
      if(action.type == params[0]){
        switch(params[1]){
          case 0 || undefined:
            actionCounts[action.action] = action.counts[action.counts.length-1];  
            break;
          case 1:
            for(let i=0;i<3;i++){
              actionCounts[action.action] = action.counts[i];
            }
            break;
          case 2:
            const end = Math.min(6, action.counts.length-1);
            for(let i=2;i<end;i++){
              actionCounts[action.action] = action.counts[i];
            }
            break
          case 3:
            if(action.action!="wand") {
              actionCounts[action.action] = action.counts[action.counts.length-1];  
            }
            break;
        }   

      }
    });
    let highestCount = 0;
    let highestCountItem = null;
    for(let item in actionCounts){
      if(actionCounts[item]>highestCount){
        highestCount = actionCounts[item];
        highestCountItem = item;
      }
    }
    if(highestCount==0){
      highestCountItem = "no melee";
      noMelee++;
      return;
    }
    
    if(!items[highestCountItem]){
      items[highestCountItem] = {count:0};
    }
    items[highestCountItem].count ++;  
  });
  let itemsAr = [];
  for(let item in items){
    items[item].item = item;
    if(item=='null'){
      items[item].item = "Unknown";
    }
    items[item].share = items[item].count/(morgues.length-noMelee) * 100;
    itemsAr.push(items[item]);
  }
  itemsAr.sort((a,b) => b.count - a.count);
  itemsAr.forEach(item => {
    item.share = item.share;
  });
  return itemsAr;
}

export function getMoguesApport(morgues, params){
  const items= {};
  const morguesWithApport = [];
  let noMelee = 0;
  morgues.forEach(morgue => {
    const actionCounts = {};
    morgue.actions.forEach(action => {
      if(action.type == params[0]){
        switch(params[1]){
          case 0 || undefined:
            actionCounts[action.action] = action.counts[action.counts.length-1];  
            break;
          case 1:
            for(let i=0;i<3;i++){
              actionCounts[action.action] = action.counts[i];
            }
            break;
          case 2:
            const end = Math.min(6, action.counts.length-1);
            for(let i=2;i<end;i++){
              actionCounts[action.action] = action.counts[i];
            }
            break
          case 3:
            if(action.action!="wand") {
              actionCounts[action.action] = action.counts[action.counts.length-1];  
            }
            break;
        }   

      }
    });
    let highestCount = 0;
    let highestCountItem = null;
    for(let item in actionCounts){
      if(actionCounts[item]>highestCount){
        highestCount = actionCounts[item];
        highestCountItem = item;
      }
    }
    if(highestCount==0){
      highestCountItem = "no melee";
      noMelee++;
      return;
    }
    
    if(!items[highestCountItem]){
      items[highestCountItem] = {count:0};
    }
    items[highestCountItem].count ++;  
    if(highestCountItem=="apportation"){
      morguesWithApport.push(morgue);
    }
  });
  let itemsAr = [];
  for(let item in items){
    items[item].item = item;
    if(item=='null'){
      items[item].item = "Unknown";
    }
    items[item].share = items[item].count/(morgues.length-noMelee) * 100;
    itemsAr.push(items[item]);
  }
  itemsAr.sort((a,b) => b.count - a.count);
  itemsAr.forEach(item => {
    item.share = item.share;
  });
  return morguesWithApport;
}

export function getUsedShield(morgues){
  let usedShield = 0;
  let nonFormacid = 0;
  const shieldTypes = ['kite shield', 'buckler', 'tower shield'];
  morgues.forEach(morgue => {
    if(morgue.species!="formicid" && !isProbablyMage(morgue)){
      nonFormacid++;
      let blockCount=0;
      morgue.actions.forEach(action => {
        if(action.type == "block" && shieldTypes.includes(action.action)){
          blockCount+=action.counts[action.counts.length-1];
          blockCount+=action.counts[action.counts.length-2];
        }
      });
      if(blockCount>20){
        usedShield++;
      }
    }
  });
  return {usedShield:usedShield, share:usedShield/nonFormacid*100, games:nonFormacid};
}

function isProbablyMage(morgue){
  return morgue.skills['spellcasting']>12;
}

export function getSpecies(morgues){
  let species = {};
  morgues.forEach(morgue => {
    if(!species[morgue.species]){
      species[morgue.species] = {count:0};
    }
    species[morgue.species].count ++;
  });
  let speciesAr = []
  for(let sObj in species){
    species[sObj].share = species[sObj].count/morgues.length * 100;
    species[sObj].item = sObj;
    speciesAr.push(species[sObj]);
  }
  speciesAr.sort((a,b) => b.share - a.share);
  speciesAr.forEach(item => {
    item.share = item.share;
  });
  return speciesAr;
}

export function getBackgrounds(morgues){
  let background = {};
  morgues.forEach(morgue => {
    if(!background[morgue.background]){
      background[morgue.background] = {count:0};
    }
    background[morgue.background].count ++;
  });
  let backgroundAr = []
  for(let sObj in background){
    background[sObj].share = background[sObj].count/morgues.length * 100;
    background[sObj].item = sObj;
    backgroundAr.push(background[sObj]);
  }
  backgroundAr.sort((a,b) => b.share - a.share);
  backgroundAr.forEach(item => {
    item.share = item.share;
  });
  return backgroundAr;
}

export function getPlayerName(morgues){
  let background = {};
  morgues.forEach(morgue => {
    if(!background[morgue.playerName]){
      background[morgue.playerName] = {count:0};
    }
    background[morgue.playerName].count ++;
  });
  let backgroundAr = []
  for(let sObj in background){
    background[sObj].share = background[sObj].count/morgues.length * 100;
    background[sObj].item = sObj;
    backgroundAr.push(background[sObj]);
  }
  backgroundAr.sort((a,b) => b.share - a.share);
  backgroundAr.forEach(item => {
    item.share = item.share;
  });
  return backgroundAr;
}

export function getCombos(morgues){
  let combos = {};
  morgues.forEach(morgue => {
    let combo = `${morgue.species}-${morgue.background}`;
    if(!combos[combo]){
      combos[combo] = {count:0};
    }
    combos[combo].count ++;
  });
  let combosAr = []
  for(let sObj in combos){
    //if(combos[sObj].count<2) continue;
    
    combos[sObj].share = combos[sObj].count/morgues.length * 100;
    combos[sObj].item = sObj;
    combosAr.push(combos[sObj]);
  }
  combosAr.sort((a,b) => b.share - a.share);
  combosAr.forEach(item => {
    item.share = item.share;
  });
  return combosAr;
}

export function getGod(morgues){
  let god = {};
  morgues.forEach(morgue => {
    if(!god[morgue.god]){
      god[morgue.god] = {count:0};
    }
    god[morgue.god].count ++;
  });
  let godAr = []
  for(let sObj in god){
    god[sObj].share = god[sObj].count/morgues.length * 100;
    god[sObj].item = sObj;
    godAr.push(god[sObj]);
  }
  godAr.sort((a,b) => b.share - a.share);
  godAr.forEach(item => {
    item.share = item.share;
  });
  return godAr;
}

export function getLevel(morgues){
  let level = {};
  morgues.forEach(morgue => {
    if(!level[morgue.XL]){
      level[morgue.XL] = {count:0};
    }
    level[morgue.XL].count ++;
  });
  let levelAr = []
  for(let sObj in level){
    level[sObj].share = level[sObj].count/morgues.length * 100;
    level[sObj].item = sObj;
    levelAr.push(level[sObj]);
  }
  levelAr.sort((a,b) => b.share - a.share);
  levelAr.forEach(item => {
    item.share = item.share;
  });
  return levelAr;
}

export function getGold(morgues){
  let gold = 0; 
  let goldSpent = 0;
  let goldGozag = 0;
  let goldGozagSpent = 0;
  let goldNoGozag = 0;
  let goldNoGozagSpent = 0;
  let numGozag = 0;
  let numNoGozag = 0;
   morgues.forEach(morgue => {
    gold+=morgue.gold + morgue.goldSpent;
    goldSpent+=morgue.goldSpent;
    if(morgue.god=="gozag"){
      goldGozag+=morgue.gold + morgue.goldSpent;
      goldGozagSpent+=morgue.goldSpent;
      numGozag++;
    } else {
      goldNoGozag+=morgue.gold + morgue.goldSpent;
      goldNoGozagSpent+=morgue.goldSpent;
      numNoGozag++;
    }
  });
  return {gold:Math.round(gold/morgues.length), 
    goldSpent:Math.round(goldSpent/morgues.length), 
    goldGozag:Math.round(goldGozag/numGozag), 
    goldGozagSpent:Math.round(goldGozagSpent/numGozag), 
    goldNoGozag:Math.round(goldNoGozag/numNoGozag), 
    goldNoGozagSpent:Math.round(goldNoGozagSpent/numNoGozag)}
}

export function filterMorguesForChallenges(morgues){
        //remove low turncount + nemelex
    const nemelex = 'OnEE, BaRe, MDEn, CoMo, MDAr, DESh, GnFw, MiAl, ReAE, PoCA, ReCK, AtHu, TrFw, SpAl, AtGl, OnNe, PoBe, FeCA, HuRe, CoSu, DgFw, PoWr, FoSh, KoRe, MDIE, ReBr, OnDe, MfAl, OpFw, VSSh, PoHW, SpCA, CoFE, ReWn, AtHs, OnCj, ReHs, CoHW, MuAl, AtCK, DERe, KoSh, MDCK, NaRe, PoAE, TeFw, ReDe, AtNe, VSAl'.toLowerCase();
    let numNemelex = 0;
    let lowTurnCount = 0;
    let lowRunTime = 0;
    const result = morgues.filter(morgue => {        
      const combo = speciesData[morgue.species].short + jobsData[morgue.background].short;
        if(nemelex.indexOf(combo)!=-1){
          numNemelex++;
            return false;
        }
        if(morgue.turnCount<20000){
          lowTurnCount++;
            return false;
        }
        if(morgue.runTime<3600){
          lowRunTime++;
            return false;
        }
        return true;    
    });
    console.log("Removed " + numNemelex + " nemelex");
    console.log("Removed " + lowTurnCount + " low turncount");
    console.log("Removed " + lowRunTime + " low runtime");
    return result;
}