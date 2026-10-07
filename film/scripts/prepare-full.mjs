import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createState,execute,availability,recipe} from '../../lib/store.js';
import {DEMO} from '../../lib/demo.js';
import {prepareAudio} from './prepare-audio.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url));
const submission=process.argv.includes('--submission');
const folder=submission?'scene-submission':'scene-full';
let sources, audioModel;
if(submission){
 const manifest=JSON.parse(await readFile(`${root}public/audio/submission-trimmed/manifest.json`,'utf8'));
 sources=manifest.files.map(a=>({...a,file:`submission-trimmed/${a.file}`}));audioModel=manifest.model;
}else{
 const original=JSON.parse(await readFile(`${root}public/audio/manifest.json`,'utf8'));
 const extra=JSON.parse(await readFile(`${root}public/audio/full/manifest.json`,'utf8'));
 const revised=JSON.parse(await readFile(`${root}public/audio/dialogue/manifest.json`,'utf8'));
 sources=[...revised.files.map(a=>({...a,file:`dialogue/${a.file}`})),...original.files,...extra.files.map(a=>({...a,file:`full/${a.file}`}))];audioModel=original.model;
}
const dialogue=JSON.parse(await readFile(`${root}film/dialogue.json`,'utf8'));
const audio=[],events=[],commands=[];
let state=createState(),cursor=2,serial=0;
let context={title:'Order in your own words.',customer:'Aria',focusOrder:'C12',itemId:'C12-2',mode:'queue',notice:'',customerNotice:'',tone:'green'};
const snapshot=()=>({orders:structuredClone(state.orders),inventory:availability(state),revision:state.revision});
function scene(at,patch={}) {context={...context,...patch};events.push({at:Number(at.toFixed(3)),...context,...snapshot()});}
function act(at,actor,actions,patch={},id=null,expectedError=null) {
  const command={requestId:id??`film:extra:${++serial}`,actor,actions};
  const before=structuredClone(state);
  try {
    const outcome=execute(state,command);
    assert.ok(!expectedError,'Expected a rejected transaction');
    state=outcome.state;
    commands.push({at,command,result:outcome.result});
  } catch(error) {
    if(!expectedError)throw error;
    assert.equal(error.code,expectedError);
    assert.deepEqual(state,before);
    commands.push({at,command,error:expectedError});
  }
  scene(at,patch);
}
function clip(index,kind,start) {
  const row=dialogue.find(d=>d.index===index);
  const voice=kind==='user'?row.voice:'assistant';
  const a=sources.find(v=>v.text===row[kind]&&v.voice===voice);assert.ok(a,`Missing approved audio for ${index}-${kind}`);
  audio.push({...a,index,kind,audience:row[`${kind}Audience`],start:Number(start.toFixed(3)),speaker:a.voice==='assistant'?'CafeOS':a.voice==='barista'?'Sam':a.voice});
  return start+a.durationSeconds;
}
function pair(index,patch={},options={}) {
  scene(cursor,{...patch,notice:options.noticeBefore??'',customerNotice:options.customerBefore??'',tone:'green'});
  const end=options.suppressUser?cursor+.4:clip(index,'user',cursor);
  const commit=end+.23;
  if(index<17) {
    const cue=DEMO[index];
    act(commit,cue.actor,cue.actions,{...patch,notice:options.notice??'',customerNotice:options.customerNotice??'',tone:options.tone??'green'},`film:demo:${cue.duplicateOf??index}`,cue.expectedError);
  } else if(options.actions)act(commit,options.actor??{role:'barista'},options.actions,{...patch,notice:options.notice??'',customerNotice:options.customerNotice??'',tone:options.tone??'green'});
  else scene(commit,{notice:options.notice??'',customerNotice:options.customerNotice??''});
  cursor=options.skipReply?commit+(options.hold??1.5):clip(index,'assistant',commit+.28)+.62;
  return commit;
}
scene(0);
pair(0,{}, {notice:'Draft saved · Review before sending',customerNotice:'Check your drinks before placing the order.'});
pair(1,{title:'Change just the second drink.'},{notice:'Only cup 02 changed',customerNotice:'Your oat latte is now iced. Your dairy latte stays hot.'});
pair(2,{title:'Confirmed. At the bar.'},{notice:'Order sent · Ingredients reserved',customerNotice:'Order received. We’ll call you when both drinks are ready.'});
pair(3,{title:'Another customer. The same stock.',customer:'Leo',focusOrder:'C13',itemId:'C13-1'},{skipReply:true,hold:.9});
pair(4,{}, {notice:'Last oat portion reserved',customerNotice:'Order received. We’ll call you when it’s ready.'});
pair(16,{title:'“Did my order go through?”'},{notice:'Already received · No duplicate order',customerNotice:'We have your order. You don’t need to send it again.'});
pair(5,{title:'Mia asks for an oat latte.',customer:'Mia',focusOrder:'C14',itemId:'C14-1'},{notice:'Checking availability',customerNotice:'Checking whether oat milk is available…'});
pair(6,{title:'A useful alternative, right away.'},{suppressUser:true,notice:'Not sent · Oat milk is fully reserved',customerNotice:'Sorry, oat milk isn’t available. Try dairy milk or an iced Americano.',tone:'amber'});
pair(7,{}, {notice:'Changed to iced Americano',customerNotice:'One iced Americano. NT$ 120.'});
pair(8,{title:'Back on track. Sent to the bar.'},{notice:'Order sent · No oat milk required',customerNotice:'Order received. We’ll call you when it’s ready.'});
pair(9,{title:'Sam starts Aria’s oat latte.',customer:'Aria',focusOrder:'C12',itemId:'C12-2',mode:'guide'},{notice:'Cup 02 is now in progress',customerNotice:'Sam is making your oat latte.'});
pair(10,{title:'A change while the drink is in progress.'},{notice:'Awaiting Sam’s approval',customerNotice:'We’re checking with Sam if he can still change it.',tone:'amber'});
pair(11,{title:'Sam confirms. Both panels update.'},{notice:'Iced → Hot · Oat milk unchanged',customerNotice:'Sam can make your oat latte hot.'});
pair(12,{title:'Check the ticket. Follow the next step.'},{skipReply:true,hold:1.5,notice:'Revised ticket checked',customerNotice:'Sam is making your hot oat latte.'});
pair(13,{title:'The next step matches this drink.'},{notice:'Use oat milk · Keep dairy separate',customerNotice:'Your hot oat latte is being made.'});
pair(14,{title:'Finish the cup. Check the ticket.'},{notice:'Final check: hot oat latte',customerNotice:'Sam is finishing your hot oat latte.'});
pair(15,{title:'One cup ready. One still to make.'},{notice:'1 of 2 cups ready · Keep the order open',customerNotice:'Your oat latte is ready. We’re still making your dairy latte.'});

function prepareNext(orderId,itemId,customer,title) {
  act(cursor,{role:'barista'},[{type:'start',orderId,itemId}],{title,customer,focusOrder:orderId,itemId,mode:'guide',notice:'',customerNotice:orderId==='C12'?'Your oat latte is ready. Sam is making your dairy latte.':'Sam is making your Americano.',tone:'green'});
  for(let i=1;i<=3;i++)act(cursor+i*1.8,{role:'barista'},[{type:'step',orderId,itemId}],{notice:''});
  cursor+=6.4;
}
prepareNext('C12','C12-1','Aria','Sam prepares the other cup.');
const allReady=pair(17,{title:'Both cups ready. Call the customer.',mode:'pickup'},{actions:[{type:'ready',orderId:'C12',itemId:'C12-1'}],notice:'2 of 2 cups ready · Waiting for pickup'});
assert.equal(state.orders[0].status,'complete');
pair(18,{title:'Two coffees, handed to Aria.'},{notice:'Confirm the handoff when both cups are received'});
const collectedAt=pair(19,{title:'Collected. Make room for the next order.',mode:'queue'},{actions:[{type:'collect',orderId:'C12'}],notice:'C12 collected · Removed from active orders'});
const stockAfterHandoff=structuredClone(state.stock);
assert.equal(state.orders[0].status,'collected');
assert.equal(state.orders[0].items.length,2);
const cancelAt=pair(20,{title:'Plans change. Cancel with one request.',customer:'Leo',focusOrder:'C13',itemId:'C13-1'},{actor:{role:'customer',customer:'Leo'},actions:[{type:'cancel',orderId:'C13'}],notice:'C13 cancelled · 1 oat portion available again'});
assert.deepEqual(state.stock,stockAfterHandoff);
assert.equal(availability(state).oat.available,1);
prepareNext('C14','C14-1','Mia','One last coffee for Mia.');
pair(21,{title:'Ready to pick up.',mode:'pickup'},{actions:[{type:'ready',orderId:'C14',itemId:'C14-1'}],notice:'1 of 1 cup ready · Waiting for pickup'});
const clearAt=pair(22,{title:'Mia collects. The counter clears.',mode:'queue'},{actions:[{type:'collect',orderId:'C14'}],notice:'C14 collected · No orders waiting'});
scene(cursor,{title:'Every conversation. A completed order.',mode:'end',notice:''});
const duration=Math.ceil(cursor+5);
assert.deepEqual(state.orders.map(o=>o.status),['collected','cancelled','collected']);
assert.equal(state.stock.espresso,21);
assert.equal(state.stock.oat,1);
assert.equal(state.stock.dairy,15);
assert.equal(availability(state).oat.reserved,0);
assert.equal(commands.find(c=>c.command.requestId==='film:demo:4'&&c.result?.duplicate)?.result.duplicate,true);
for(const event of events)for(const i of Object.values(event.inventory))assert.ok(i.available>=0);
// Customer messaging is deliberately independent from operational notices.
const internalLanguage=/reserv(?:ed|ation)|releas(?:ed|e)|deduplic|revision|stock count|connected screen|keep dairy separate|revised ticket/i;
for(const e of events)assert.ok(!internalLanguage.test(e.customerNotice),`Internal detail in customer panel: ${e.customerNotice}`);
for(const a of audio){assert.ok(a.audience,`Missing audience: ${a.file}`);if(a.speaker==='CafeOS'&&a.audience!=='Sam')assert.ok(!internalLanguage.test(a.text),`Internal detail spoken to ${a.audience}: ${a.text}`);}
const used=[...new Map(audio.map(a=>[a.file,a])).values()];
for(const a of used)assert.equal(createHash('sha256').update(await readFile(`${root}public/audio/${a.file}`)).digest('hex'),a.sha256);
const mastering=await prepareAudio(root,used,folder);
for(const a of audio)a.renderFile=mastering[a.file].renderFile;
const result={fps:30,width:1920,height:1080,duration,events,audio,milestones:{allReady,collectedAt,cancelAt,clearAt}};
await mkdir(`${root}artifacts/${folder}`,{recursive:true});
await writeFile(`${root}film/src/${submission?'submission':'full'}-story.json`,JSON.stringify(result,null,2)+'\n');
await writeFile(`${root}artifacts/${folder}/story-evidence.json`,JSON.stringify({description:'Authored animated simulation. Recorded synthetic voices. Domain transitions executed using the actual store engine. Editorial timing is not live latency.',audioHost:'remote GPU',audioModel,commands,mastering,...result},null,2)+'\n');
console.log(`Full film: ${duration}s, ${events.length} state frames, ${audio.length} voice clips. Handoff at ${collectedAt.toFixed(2)}s; clear at ${clearAt.toFixed(2)}s.`);
