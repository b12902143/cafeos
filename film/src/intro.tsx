import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Fonts, Icon, Cup} from './scene';
import intro from '../intro.json';

export const INTRO_FRAMES = intro.durationInFrames;
const C = {ink:'#183d35', green:'#316b50', paper:'#f7f7ee', lime:'#d8ef85', muted:'#637365', line:'#d7e0cf'};
const clamp = (v:number) => Math.max(0,Math.min(1,v));
const ease = (v:number) => 1-Math.pow(1-clamp(v),3);
const appear = (t:number, at:number) => ease((t-at)/.45);

function Pointer({x,y,click}:{x:number,y:number,click:number}) {
  return <div style={{position:'absolute',left:x,top:y,pointerEvents:'none'}}>
    <div style={{position:'absolute',width:70,height:70,left:-30,top:-30,border:`5px solid ${C.green}`,borderRadius:'50%',opacity:1-click,transform:`scale(${.5+click})`}}/>
    <svg width="46" height="53" viewBox="0 0 46 53"><path d="M5 4v37l10-9 8 16 9-5-8-16h14Z" fill={C.ink} stroke={C.paper} strokeWidth="3"/></svg>
  </div>;
}

function Panel({staff,t}:{staff:boolean,t:number}) {
  const changed=t>6.55;
  const ready=t>7.65;
  const rise=appear(t,staff?3.75:3.55);
  const clicking=clamp((t-6.1)/.65);
  return <div style={{position:'absolute',left:staff?1030:110,top:272,width:780,height:425,padding:30,boxSizing:'border-box',borderRadius:26,background:'#fffef8',border:`2px solid ${C.line}`,opacity:rise,transform:`translateY(${(1-rise)*25}px)`,boxShadow:'0 15px 35px #183d3508'}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:33,fontWeight:700}}>
      <span>{staff?'Sam · Staff screen':'Aria · Customer screen'}</span>
      <span style={{fontSize:24,color:C.green,display:'flex',gap:10,alignItems:'center'}}><span style={{width:11,height:11,borderRadius:'50%',background:C.green}}/>Connected</span>
    </div>
    <div style={{marginTop:20,padding:'16px 20px',height:125,boxSizing:'border-box',background:changed?'#edf3df':'#f0f2e9',borderRadius:16,display:'flex',alignItems:'center',gap:20}}>
      <Cup hot={staff}/>
      <div style={{flex:1}}>
        <div style={{fontSize:33,fontWeight:700}}>{staff?'Leo’s Americano':changed?'Aria’s oat latte':'Aria’s latte'}</div>
        <div style={{marginTop:9,fontSize:27,color:C.muted}}>{staff?(changed?'Espresso ready · Pour water next':'Step 1 · Prepare espresso'):(changed?'Oat milk · Iced · Order updated':'Dairy milk · Iced · In queue')}</div>
      </div>
      {changed&&<span style={{color:C.green}}><Icon kind="check" size={35}/></span>}
    </div>
    <div style={{display:'flex',alignItems:'center',gap:15,marginTop:20}}>
      <div style={{height:64,flex:1,borderRadius:15,background:changed?'#e1edc3':C.ink,color:changed?C.ink:'#fffef8',display:'flex',alignItems:'center',justifyContent:'center',gap:16,fontSize:29,fontWeight:700}}>
        <Icon kind={changed?'check':staff?'check':'mic'} size={29}/>
        {staff?(changed?'Step complete':'Mark espresso ready'):(changed?'Change received':'“Use oat milk, please.”')}
      </div>
    </div>
    <div style={{fontSize:25,color:C.green,marginTop:18,opacity:ready?1:.55}}>{staff?(ready?'Aria’s updated oat latte is also in the queue.':'Other orders stay visible while you work.'):(ready?'Your change is now on the staff screen.':'Speak or tap — your choice.')}</div>
    {t>5.75&&t<7.3&&<Pointer x={staff?535:562} y={291} click={clicking}/>}
  </div>;
}

export const IntroFilm:React.FC=()=>{
  const f=useCurrentFrame(),t=f/30;
  const overview=appear(t,3.2);
  const titleFade=1-clamp((t-3.2)/.45);
  const synced=appear(t,7.3);
  const caption=t<3.2?'Meet CafeOS, a voice assistant for busy cafés.':t<8.95?'Customers and staff can speak or use their own screens at the same time.':t<11.95?'Orders, preparation steps, and inventory stay in sync.':'Let’s see it in action.';
  return <AbsoluteFill style={{background:C.paper,fontFamily:'DM Sans, sans-serif',color:C.ink}}>
    <Fonts/>
    <Sequence from={8}><Audio src={staticFile(intro.audio)}/></Sequence>
    <AbsoluteFill style={{background:C.ink,color:C.paper,padding:'120px 140px',opacity:titleFade}}>
      <div style={{fontSize:43,color:C.lime,fontWeight:700}}>Meet your café’s voice assistant.</div>
      <div style={{fontSize:164,fontWeight:700,letterSpacing:-6,marginTop:40}}>CafeOS</div>
      <div style={{fontSize:64,lineHeight:1.25,marginTop:25}}>Customers speak.<br/>The whole café stays in sync.</div>
      <div style={{position:'absolute',right:155,top:258,width:380,height:380,borderRadius:70,background:'#294d3e',display:'grid',placeItems:'center',transform:`translateY(${(1-appear(t,.15))*20}px)`}}><Icon kind="mic" size={175} color={C.lime}/></div>
      <div style={{position:'absolute',left:140,bottom:175,fontSize:31,color:'#d2dec7'}}>Prototype simulation · Prerecorded synthetic voices</div>
    </AbsoluteFill>
    <AbsoluteFill style={{opacity:overview}}>
      <div style={{position:'absolute',left:110,top:60,fontSize:33,fontWeight:700,color:C.green}}>CafeOS</div>
      <div style={{position:'absolute',left:110,top:117,fontSize:65,fontWeight:700,letterSpacing:-1.9}}>Different screens. One shared state.</div>
      <div style={{position:'absolute',left:110,top:207,fontSize:29,color:C.muted}}>Customers and staff act at the same time.</div>
      <Panel staff={false} t={t}/><Panel staff t={t}/>
      <div style={{position:'absolute',left:899,top:438,width:122,height:88,display:'grid',placeItems:'center',color:C.green,opacity:synced}}><Icon kind="link" size={58}/></div>
      <div style={{position:'absolute',left:260,right:260,top:751,display:'flex',justifyContent:'center',gap:22,opacity:synced,transform:`translateY(${(1-synced)*15}px)`}}>
        {['Orders updated','Preparation updated','Stock reserved'].map(label=><div key={label} style={{padding:'22px 30px',borderRadius:18,background:'#e5edcf',fontSize:30,fontWeight:700,display:'flex',alignItems:'center',gap:13}}><Icon kind="check" size={28}/>{label}</div>)}
      </div>
    </AbsoluteFill>
    <div style={{position:'absolute',bottom:46,left:90,right:90,textAlign:'center',fontSize:34,lineHeight:1.4,color:t<3.4?C.paper:C.ink}}>{caption}</div>
  </AbsoluteFill>;
};
