import {bundle} from '@remotion/bundler';
import {selectComposition,renderMedia,renderStill} from '@remotion/renderer';
import {fileURLToPath} from 'node:url';
import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
const root=fileURLToPath(new URL('../../',import.meta.url));
const out=`${root}artifacts/scene-submission`;
await mkdir(out,{recursive:true});
await mkdir(`${root}submission`,{recursive:true});
const story=JSON.parse(await readFile(`${root}film/src/submission-story.json`,'utf8'));
const url=await bundle({entryPoint:`${root}film/src/index.tsx`,publicDir:`${root}public`});
const composition=await selectComposition({serveUrl:url,id:'CafeOS-Submission'});
if(composition.durationInFrames>=180*30)throw new Error('Film must be under three minutes.');
const where=(s)=>story.events.find(e=>e.notice.includes(s))?.at??0;
const marks=[['intro',1],['order',15],['pending',where('Awaiting')+4],['guidance',where('Use oat')+4],['pickup',story.milestones.allReady+4],['collected',story.milestones.collectedAt+4.2],['cancelled',story.milestones.cancelAt+4],['empty',story.duration+1]];
for(const [name,seconds] of marks){await renderStill({serveUrl:url,composition,frame:Math.round(seconds*30),output:`${out}/${name}.png`,imageFormat:'png'});console.log(`${name}: ${seconds.toFixed(2)}s`);}
if(!process.argv.includes('--stills-only')){
 let last=-1;
 await renderMedia({serveUrl:url,composition,codec:'h264',audioCodec:'aac',outputLocation:`${out}/rendering.mp4`,crf:18,pixelFormat:'yuv420p',concurrency:4,onProgress:({progress})=>{const n=Math.floor(progress*10)*10;if(n!==last){last=n;console.log(`Rendering ${n}%`);}}});
 await rename(`${out}/rendering.mp4`,`${root}submission/CafeOS_demo.mp4`);
 await writeFile(`${out}/render-info.json`,JSON.stringify({duration:story.duration+3,fps:30,width:1920,height:1080,frames:composition.durationInFrames,stills:marks,renderedAt:new Date().toISOString()},null,2)+'\n');
 console.log('Wrote submission/CafeOS_demo.mp4');
}
