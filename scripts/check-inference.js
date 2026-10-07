import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createState,execute,publicState} from '../lib/store.js';
import {parseIntent} from '../lib/inference.js';
let state=createState();const results=[],actor={role:'customer',customer:'Test customer'};
const prompts=['Two lattes, please. One dairy, and the second with oat milk.','Actually, make only the second one iced.','Yes, send my order.'];
for(const [index,text]of prompts.entries()) {
 const parsed=await parseIntent({text,actor,state:publicState(state)});
 state=execute(state,{requestId:`eval:${index}`,actor,actions:parsed.actions}).state;
 results.push({text,model:parsed.model,elapsedMs:parsed.elapsedMs,actions:parsed.actions});
 if(index===0){assert.equal(state.orders[0].status,'draft');assert.equal(state.orders[0].items.length,2);assert.equal(state.orders[0].items[1].milk,'oat');}
 if(index===1){assert.equal(state.orders[0].items[0].temperature,'hot');assert.equal(state.orders[0].items[1].temperature,'iced');}
 if(index===2)assert.equal(state.orders[0].status,'confirmed');
 console.log(`PASS ${index+1}: ${parsed.model} · ${parsed.elapsedMs}ms`);
 fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/inference-check.json',JSON.stringify({passed:results.length,results},null,2));
}
