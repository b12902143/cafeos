import { DEMO } from '../lib/demo.js';
import fs from 'node:fs';
fs.mkdirSync('artifacts',{recursive:true});
fs.writeFileSync('artifacts/voice-script.json',JSON.stringify(DEMO.map((d,index)=>({index,voice:d.actor.customer??d.actor.role,user:d.text,assistant:d.response})),null,2));
console.log('Authored voice script exported to artifacts/voice-script.json');
