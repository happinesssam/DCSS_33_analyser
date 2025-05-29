import { json } from "node:stream/consumers";
import { checkIfFileExists, downloadAndSaveOrOpenFile } from './utils.js';
import fs from 'node:fs/promises';


export class MorgueData{
    data;

    static dataFile = "./morgueData.json";

    constructor(){
    }

    async init(fromClean){
        const exists = await checkIfFileExists(MorgueData.dataFile);
        if(exists && !fromClean){
            const rawData = await fs.readFile(MorgueData.dataFile, 'utf-8');
            this.data = JSON.parse(rawData);
        }else{
            this.data = {
                players:[]
            };
        }
    }

    addPlayer(playerName, rank){
        this.data.players.push({
            name: playerName,
            rank: rank,
            morgues: []
        });
    }  
    
    hasPlayer(playerName){
        return this.data.players.some(player => player.name === playerName);
    }

    getPlayer(playerName){
        return this.data.players.find(player => player.name === playerName);
    }

    hasMorgue(playerName, morgueURL){
        if(!this.hasPlayer(playerName)){
            throw(`Player ${playerName} not found`);
        }
        const player = this.getPlayer(playerName);
        return player.morgues.reduce((found,morgue) => morgue.morgueURL===morgueURL || found, false);    
    }

    addMorgue(playerName, morgue){
        if(!this.hasPlayer(playerName)){
            throw(`Player ${playerName} not found`);
        }
        const player = this.getPlayer(playerName);
        player.morgues.push(morgue);    
    }

    getPlayers(maxRank, minRank){
        if(!minRank){
            minRank = 0;
        }
        if(!maxRank){
            maxRank = 1000;
        }
        return this.data.players.filter(player => player.rank >= minRank && player.rank <= maxRank);
    }

    getMorgues(maxRank, minRank){
        const players = this.getPlayers(maxRank, minRank);
        const morgues = [];
        for(const player of players){
            morgues.push(...player.morgues);
        }
        return morgues;
    }

    getMorguesMinRunes(minRunes){
        const morgues = this.getMorgues();//just get all
        return morgues.filter(morgue => morgue.runes >= minRunes);            
    }

    getMorguesFinishedZigs(){
        const morgues = this.getMorgues();//just get all
        return morgues.filter(morgue => {
            return morgue.places.reduce((result, place)=>{
                return result || (place.name=="zig" && place.level==27)
            }, false);
        });            
    }

    getMorguesNoZig(){
        const morgues = this.getMorgues();//just get all
        return morgues.filter(morgue => {
            return morgue.places.reduce((result, place)=>{
                return result && place.name!="zig";
            }, true);
        });            
    }

    getMorguesWithActions(actionType, actionId){
        const morgues = this.getMorgues();
        const results = [];
        morgues.forEach(morgue => {
        morgue.actions.forEach(action => {            
                if(!results.includes(morgue) && action.type == actionType && (!actionId || action.action == actionId)){
                    results.push(morgue);                    
                }
            });
        });
        return morgues;    
    }

    getMorguesWithKey(key, value){
        const morgues = this.getMorgues();
        return morgues.filter(morgue=>{
            return value.includes(morgue[key]);        
        });
    }

    getMorguesWithoutKey(key, value){
        const morgues = this.getMorgues();
        return morgues.filter(morgue=>{
            return !value.includes(morgue[key]);        
        });
    }

    async saveData(){
        fs.writeFile(MorgueData.dataFile, JSON.stringify(this.data), 'utf-8', (err) => {
            if(err){
                console.error(err);
            }
        });
    }
}