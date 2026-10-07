import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, Sequence, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import story from './story.json';

const C = {ink:'#183d35', green:'#316b50', lime:'#d8ef85', muted:'#718277', paper:'#f7f7ee', line:'#e5e9df', amber:'#bd7529', amberBg:'#fff1d5', blue:'#56859a', blueBg:'#e4f1f4', hot:'#b66a49', hotBg:'#f8e7db'};
const clamp = (n:number) => Math.min(1, Math.max(0,n));
const ease = (n:number) => 1 - Math.pow(1-clamp(n),3);
const at = (f:number, seconds:number, length=14) => ease((f-seconds*30)/length);
const font = 'DM Sans, sans-serif';
type S = React.CSSProperties;
const small:S = {fontSize:17, letterSpacing:2.1, fontWeight:700, textTransform:'uppercase'};

export function Fonts() {
  const [handle] = useState(() => delayRender('Loading local film fonts'));
  useEffect(() => {
    const files = [
      ['DM Sans','400','rP2tp2ywxg089UriI5-g4vlH9VoD8CmcqZG40F9JadbnoEwAopxhTg.ttf'],
      ['DM Sans','500','rP2tp2ywxg089UriI5-g4vlH9VoD8CmcqZG40F9JadbnoEwAkJxhTg.ttf'],
      ['DM Sans','700','rP2tp2ywxg089UriI5-g4vlH9VoD8CmcqZG40F9JadbnoEwARZthTg.ttf'],
      ['Manrope','800','xn7_YHE41ni1AdIRqAuZuw1Bx9mbZk59E-_F.ttf'],
    ];
    Promise.all(files.map(async ([name,weight,file]) => {
      const face = new FontFace(name, `url(${staticFile(`assets/fonts/${file}`)})`, {weight});
      document.fonts.add(await face.load());
    })).then(() => continueRender(handle));
  },[handle]);
  return null;
}

export function Icon({kind, size=24, color='currentColor'}:{kind:string,size?:number,color?:string}) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {kind==='check' ? <path d="m5 12 4 4L19 6"/> : kind==='arrow' ? <><path d="M4 12h15m-5-5 5 5-5 5"/></> : kind==='mic' ? <><rect x="9" y="2" width="6" height="13" rx="3"/><path d="M6 10v2a6 6 0 0 0 12 0v-2M12 18v4m-4 0h8"/></> : kind==='link' ? <><path d="m10 13 4-4m-5 7-2 2a4 4 0 0 1-6-6l4-4m10-1 2-2a4 4 0 0 1 6 6l-4 4" transform="translate(1 0) scale(.9)"/></> : kind==='cup' ? <><path d="M4 9h12v7a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9Z M16 10h2a3 3 0 0 1 0 6h-2M7 3v2m5-2v2"/></> : <circle cx="12" cy="12" r="8"/>}
  </svg>;
}
export function Pill({children,bg=C.paper,color=C.green,style={}}:{children:React.ReactNode,bg?:string,color?:string,style?:S}) {
  return <span style={{display:'inline-flex',gap:8,alignItems:'center',padding:'8px 13px',borderRadius:10,fontSize:19,fontWeight:700,background:bg,color,whiteSpace:'nowrap',...style}}>{children}</span>;
}
export function Wave({frame,color=C.green}:{frame:number,color?:string}) {
  return <div style={{display:'flex',alignItems:'center',gap:4,height:30}}>{Array.from({length:9},(_,i) => <div key={i} style={{width:4,borderRadius:3,background:color,height:5+22*Math.abs(Math.sin(frame*.2+i*.88))}}/>)}</div>;
}
export function Cup({hot=false,large=false}:{hot?:boolean,large?:boolean}) {
  return <svg width={large?100:70} height={large?112:76} viewBox="0 0 90 100" fill="none">
    {hot ? <g stroke={C.hot} strokeWidth="3" strokeLinecap="round"><path d="M30 24c-8-10 7-9 0-20M44 24c-8-10 7-9 0-20M58 24c-8-10 7-9 0-20"/></g> : <g stroke={C.blue} strokeWidth="2.5"><path d="m54 8 4 4-4 4-4-4Z M26 14l4 4-4 4-4-4Z"/></g>}
    <path d="M23 34h44l-5 54H29Z" fill={hot?'#f0d4bd':'#cbe3e6'} stroke={hot?C.hot:C.blue} strokeWidth="2.5"/>
    <rect x="19" y="30" width="52" height="8" rx="4" fill={hot?C.hot:C.blue}/>
    <path d="M27 56h36l-2 20H29Z" fill="#fffaf0"/>
    <path d="M40 59c-8 6-6 13 0 13 8-5 7-13 0-13Z" fill={C.green}/>
    <path d="m42 61-4 9" stroke="#fffaf0" strokeWidth="1.5"/>
  </svg>;
}

export function Scene({f,speaker,hot,steam,clean=false,customerName='Aria',cups=0,depart=0,handoff=0}:{f:number,speaker:string,hot:boolean,steam:boolean,clean?:boolean,customerName?:string,cups?:number,depart?:number,handoff?:number}) {
  const aria = speaker===customerName, sam=speaker==='Sam';
  const nod = sam ? Math.sin(f*.15)*2 : 0;
  return <div style={{position:'absolute',left:48,top:190,width:386,height:clean?700:650,borderRadius:28,overflow:'hidden',background:'#e9eee2'}}>
    {!clean && <div style={{position:'absolute',top:25,left:26,...small,color:'#647b64'}}>At the counter</div>}
    {!clean && <div style={{position:'absolute',top:55,left:26,fontSize:27,fontWeight:700}}>Morning shift · 09:12</div>}{clean && <div style={{position:'absolute',top:31,left:29,fontSize:28,fontWeight:700}}>Daylight Coffee</div>}
    <svg width="386" height={clean?620:570} viewBox={`0 0 386 ${clean?620:570}`} style={{position:'absolute',top:80}}>
      <defs><pattern id="floor" width="54" height="44" patternUnits="userSpaceOnUse"><path d="M0 44h54M54 0v44" fill="none" stroke="#cfd9c8" strokeWidth="1"/></pattern></defs>
      <rect x="0" y="330" width="386" height={clean?290:240} fill="#dce4d5"/><rect x="0" y="330" width="386" height={clean?290:240} fill="url(#floor)"/>
      <path d="M29 79a69 69 0 0 1 138 0v125H29Z" fill="#cfdbbd"/>
      <path d="M97 12v191M31 110h133" stroke="#e9eee2" strokeWidth="8"/>
      <path d="M29 201c48-84 86-71 136-115v116Z" fill="#bfcea9"/>
      <rect x="220" y="98" width="128" height="8" rx="4" fill="#a4b89d"/>
      <path d="M241 93V69m-8 4 8 11 12-15" stroke="#6c9663" strokeWidth="6" strokeLinecap="round"/><path d="M229 88h26l-4 14h-18Z" fill="#b3835c"/>
      <rect x="285" y="79" width="17" height="20" rx="3" fill="#faf8e8"/><rect x="309" y="79" width="17" height="20" rx="3" fill="#faf8e8"/>
      <ellipse cx="272" cy="356" rx="64" ry="13" fill="#c4ceb9"/>
      <g transform={`translate(0 ${nod})`}>
        {sam && <circle cx="271" cy="186" r={49+Math.sin(f*.16)*3} fill="none" stroke="#90b36c" strokeWidth="3"/>}
        <path d="M230 249q43-25 83 0l16 89H212Z" fill="#f7f6e9"/>
        <path d="M244 238v32h52v-32m-63 30h77l9 96h-95Z" fill="#3b6953"/>
        <path d="M253 249h37l-4-38h-29Z" fill="#d99b72"/>
        <ellipse cx="271" cy="188" rx="31" ry="39" fill="#e8ad81"/>
        <path d="M240 187q-6-51 32-47 40-2 31 48l-14-31q-17 15-49 15Z" fill="#394a3b"/>
        <path d="M250 144q16-25 42-5l15 14h-71Z" fill="#516b53"/>
        <circle cx="260" cy="187" r="2" fill="#3c4236"/><circle cx="283" cy="187" r="2" fill="#3c4236"/>
        <path d={sam&&Math.sin(f*.7)>0?'M264 207q8 8 15-1':'M265 208q7 3 12-1'} stroke="#8b513e" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        <path d="m231 271-12 53 40 8m47-60 13 49-30 13" stroke="#e8ad81" strokeWidth="17" strokeLinecap="round" fill="none"/>
      </g>
      <rect x="173" y="318" width="213" height="153" rx="4" fill="#b39771"/>
      <rect x="160" y="312" width="235" height="17" rx="5" fill="#7b795b"/>
      <path d="M189 337v125m31-125v125m31-125v125m31-125v125m31-125v125m31-125v125m31-125v125" stroke="#a28562" strokeWidth="3"/>
      <rect x="303" y="247" width="74" height="65" rx="8" fill="#8b9b86"/><rect x="311" y="255" width="59" height="21" rx="4" fill="#d5dfc9"/>
      <circle cx="321" cy="265" r="4" fill="#416b4e"/><path d="M333 284h27v6h-27Z" fill="#475c48"/>
      <path d="M342 291v10" stroke="#765b3d" strokeWidth="3"/><path d="M335 299h22l-3 12h-16Z" fill="#f9f4e7"/>
      <rect x="190" y="276" width="49" height="36" rx="4" fill="#374f43" transform="rotate(-10 214 294)"/><rect x="195" y="281" width="39" height="25" rx="2" fill="#d6eb9a" transform="rotate(-10 214 294)"/>
      {steam && <g stroke="#fffdf4" strokeWidth="3" fill="none" strokeLinecap="round" opacity={.5+.5*Math.sin(f*.07)**2}><path d={`M280 303q-14-16 0-29t0-29`} transform={`translate(0 ${-(f%35)/4})`}/><path d="M288 301q-10-13 0-24t0-24"/></g>}
      <path d="M267 286h24l-3 23h-17Z" fill="#e0e5d8" stroke="#81917c" strokeWidth="2"/>
      <path d="M291 290q17 2 0 15" stroke="#81917c" strokeWidth="3" fill="none"/>
      <ellipse cx="103" cy="518" rx="58" ry="15" fill="#c2cebb" opacity={1-depart}/>
      <g opacity={1-depart} transform={`translate(${-depart*175} ${aria?Math.sin(f*.13)*1.8:0})`}>
        {aria && <circle cx="105" cy="297" r={48+Math.sin(f*.17)*3} fill="none" stroke="#b68957" strokeWidth="3"/>}
        <path d="m76 429 7 83h22l3-82m6 0 10 82h23l-6-87" fill="#6d7869"/>
        <path d="M79 510h25v12H73q-5-9 6-12m46 0h22l8 10h-33Z" fill="#425248"/>
        <path d="M66 366q39-21 74 0l12 78H52Z" fill={customerName==='Leo'?'#799aac':customerName==='Mia'?'#ad8696':'#cb8c60'}/>
        <path d="M91 345v23q14 8 26 0v-24Z" fill="#d49a73"/>
        <path d="M66 301q-1-57 40-51 39-3 36 61l5 42H60Z" fill="#76513d"/>
        <ellipse cx="105" cy="305" rx="28" ry="37" fill="#e9b88d"/>
        <path d="M75 302q0-58 42-44l16 29q-38-5-57 25Z" fill="#76513d"/>
        <circle cx="97" cy="306" r="2" fill="#543b30"/><circle cx="116" cy="306" r="2" fill="#543b30"/>
        <path d={aria&&Math.sin(f*.8)>0?'M101 322q7 8 13-1':'M102 323q6 3 11-1'} stroke="#9a6047" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        <path d="m65 379-10 36 35 10m45-49 26 20 28-40" fill="none" stroke="#e9b88d" strokeWidth="16" strokeLinecap="round"/>
        <rect opacity={1-handoff} x="174" y="334" width="22" height="36" rx="5" fill="#355a46" transform="rotate(12 184 350)"/>
        <rect opacity={1-handoff} x="178" y="340" width="14" height="23" rx="2" fill="#cfe49a" transform="rotate(12 184 350)"/>
        <path d="M74 369q-23 9-24 56" stroke="#704f3b" strokeWidth="5" fill="none"/>
        <rect x="35" y="412" width="37" height="38" rx="8" fill="#edca93"/>
      </g>
      {cups>0 && <g opacity={1-depart} transform={`translate(${166-14*handoff-175*depart} ${293+59*handoff})`}><path d="M0 0h18l-2 19H3Z" fill="#f7f1dd" stroke="#567457" strokeWidth="1.5"/><path d="M-2-3h22v4H-2Z" fill="#41644c"/>{cups>1&&<g transform="translate(30 0)"><path d="M0 0h18l-2 19H3Z" fill="#f7f1dd" stroke="#567457" strokeWidth="1.5"/><path d="M-2-3h22v4H-2Z" fill="#ad7753"/></g>}</g>}
      <rect opacity={1-depart} x="26" y="215" width="112" height="40" rx="20" fill={aria?'#fff9ed':'#f5f6ed'}/>
      <text opacity={1-depart} x="82" y="241" textAnchor="middle" fill="#6d533c" fontSize="20" fontFamily={font} fontWeight="700">{customerName}</text>
      <rect x="222" y="110" width="99" height="36" rx="18" fill={sam?C.lime:'#f5f6ed'}/>
      <text x="271" y="134" textAnchor="middle" fill={C.ink} fontSize="20" fontFamily={font} fontWeight="700">Sam</text>
    </svg>
    {!clean && <div style={{position:'absolute',bottom:21,left:25,right:25,display:'flex',alignItems:'center',gap:10,color:C.green,fontSize:18,fontWeight:500}}><span style={{width:8,height:8,background:C.green,borderRadius:'50%'}}/> {steam?'Sam continues making the drink':hot?'Change confirmed at the counter':'One drink is already in progress'}</div>}
  </div>;
}

function Panel({left,width,children,style={}}:{left:number,width:number,children:React.ReactNode,style?:S}) {
  return <div style={{position:'absolute',left,top:190,width,height:650,borderRadius:28,background:'#fffef8',border:'1px solid #e4e8dd',boxShadow:'0 14px 40px #233e2b0b',overflow:'hidden',...style}}>{children}</div>;
}

function OrderPanel({f,pending,hot}:{f:number,pending:boolean,hot:boolean}) {
  const change = at(f,story.events.requested);
  const accepted = at(f,story.events.accepted);
  return <Panel left={458} width={602}>
    <div style={{padding:'26px 30px',display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:`1px solid ${C.line}`}}><div><div style={{...small,color:C.muted,marginBottom:8}}>Customer view</div><div style={{fontSize:30,fontWeight:700}}>Aria’s order <span style={{color:'#81907c',marginLeft:10}}>C12</span></div></div><div style={{width:49,height:49,display:'grid',placeItems:'center',borderRadius:16,background:'#edf1e5'}}><Icon kind="cup" size={29}/></div></div>
    <div style={{padding:'22px 26px'}}>
      <div style={{display:'flex',alignItems:'center',height:106,padding:'6px 18px',borderRadius:17,background:'#f5f5ec',gap:15}}>
        <Cup hot/><div style={{flex:1}}><div style={{fontSize:24,fontWeight:700}}>01 · Dairy latte</div><div style={{fontSize:19,color:C.muted,marginTop:7}}>Hot · Regular</div></div><span style={{fontSize:17,color:C.muted}}>In queue</span>
      </div>
      <div style={{position:'relative',marginTop:15,height:203,padding:'21px 20px',borderRadius:19,background:hot?'#f7ede3':'#edf3ef',border:`2px solid ${pending?'#d8ae67':hot?'#ddbc9e':'#bdd1be'}`}}>
        <div style={{display:'flex',alignItems:'center',gap:16}}><Cup hot={hot} large/><div style={{flex:1}}><div style={{fontSize:29,fontWeight:700}}>02 · Oat latte</div><div style={{display:'flex',alignItems:'center',gap:10,marginTop:12}}><Pill bg={hot?C.hotBg:C.blueBg} color={hot?C.hot:C.blue} style={{fontSize:23,padding:'7px 15px'}}>{hot?'HOT':'ICED'}</Pill><span style={{fontSize:22,color:C.muted}}>Oat milk</span></div></div></div>
        <div style={{position:'absolute',left:24,right:24,bottom:17,display:'flex',alignItems:'center',justifyContent:'space-between',fontSize:19,color:pending?C.amber:C.green}}><span style={{display:'flex',alignItems:'center',gap:9}}><span style={{width:8,height:8,borderRadius:'50%',background:'currentColor'}}/>{pending?'Change awaiting approval':'Being made by Sam'}</span><span style={{color:C.muted}}>Regular</span></div>
      </div>
      <div style={{marginTop:17,minHeight:115,opacity:change,transform:`translateY(${(1-change)*20}px)`,borderRadius:16,padding:'17px 20px',background:hot?'#e9f0da':C.amberBg,position:'relative',overflow:'hidden'}}>
        <div style={{display:'flex',alignItems:'center',gap:10,fontSize:23,fontWeight:700,color:hot?C.green:C.amber}}><Icon kind={hot?'check':'mic'} size={25}/>{hot?'Sam accepted your change':'Your change request'}</div>
        <div style={{display:'flex',alignItems:'center',gap:14,marginTop:10,fontSize:23}}><span style={{color:C.muted,textDecoration:hot?'line-through':'none'}}>Iced oat latte</span><Icon kind="arrow" size={23}/><span style={{fontWeight:700,color:C.hot}}>Hot oat latte</span></div>
        {hot && <div style={{position:'absolute',inset:0,background:'#d8ef85',opacity:(1-accepted)*.55}}/>}
      </div>
    </div>
  </Panel>;
}

function GuidePanel({f,pending,hot,steam}:{f:number,pending:boolean,hot:boolean,steam:boolean}) {
  const checked = f>=story.events.checked*30;
  const snapshot = steam?story.snapshots.steaming:checked?story.snapshots.checked:hot?story.snapshots.accepted:pending?story.snapshots.requested:story.snapshots.initial;
  const active = snapshot.guide.index;
  const highlight = steam?at(f,story.events.steaming):hot?at(f,story.events.accepted):1;
  const steps = ['Check revised ticket','Extract espresso',hot?'Steam oat milk':'Add ice + cold oat milk','Finish & check the drink'];
  if(!hot) steps[0]='Check the ticket';
  const currentTitle = pending?'A change needs your OK':steam?'Steam oat milk':hot&&!checked?'Recheck the updated ticket':'Extract the espresso';
  const currentDetail = pending?'Cup 02 · Iced → Hot · Oat milk stays':steam?'Silky texture. Café temperature target.':hot&&!checked?'Cup 02 · Hot latte · Oat milk':hot?'Double shot, following the café recipe.':'Double shot for the iced oat latte.';
  return <Panel left={1084} width={788}>
    <div style={{padding:'26px 30px',display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:`1px solid ${C.line}`}}><div><div style={{...small,color:C.muted,marginBottom:8}}>Barista view</div><div style={{fontSize:30,fontWeight:700}}>Sam’s next step</div></div><Pill bg="#eaf0e2" style={{fontSize:18}}><Icon kind="mic" size={19}/> Voice on</Pill></div>
    <div style={{padding:'21px 27px'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}><div style={{fontSize:23,fontWeight:700}}>C12 <span style={{fontWeight:400,color:C.muted,margin:'0 8px'}}>/</span> Cup 02 · Oat latte</div><Pill bg={hot?C.hotBg:C.blueBg} color={hot?C.hot:C.blue} style={{fontSize:18,padding:'6px 13px'}}>{hot?'HOT':'ICED'}</Pill></div>
      <div style={{height:159,borderRadius:20,padding:'22px 25px',background:pending?C.amberBg:C.ink,color:pending?C.ink:'#f8faec',position:'relative',overflow:'hidden'}}>
        <div style={{...small,fontSize:15,color:pending?C.amber:C.lime,marginBottom:9}}>{pending?'Request from Aria':steam?'Now · step 03 of 04':hot&&!checked?'Recipe updated · step 01 of 04':'Now · step 02 of 04'}</div>
        <div style={{fontSize:33,fontWeight:700,letterSpacing:-.7,lineHeight:1.18}}>{currentTitle}</div>
        <div style={{fontSize:22,marginTop:10,color:pending?'#8b663d':'#c6d5c4'}}>{currentDetail}</div>
        {!pending && <div style={{position:'absolute',inset:0,background:C.lime,opacity:(1-highlight)*.25}}/>}
      </div>
      {pending ? <div style={{marginTop:18,borderRadius:17,border:'1px solid #e0c18d',padding:'17px 21px',height:188,transform:`translateY(${(1-at(f,5.55))*15}px)`,opacity:at(f,5.55)}}>
        <div style={{fontSize:23,fontWeight:700}}>You’re still in control.</div>
        <div style={{fontSize:21,color:C.muted,marginTop:6}}>Original recipe stays until you confirm.</div>
        <div style={{display:'flex',gap:12,marginTop:20}}><div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:12,background:C.ink,color:'#fffdf1',borderRadius:13,height:55,flex:1,fontSize:23,fontWeight:700}}><Icon kind="mic"/> “Accept the change”</div><div style={{border:`1px solid ${C.line}`,padding:'13px 22px',borderRadius:13,fontSize:21,color:C.muted}}>Keep original</div></div>
      </div> : <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:16}}>{steps.map((step,i) => <div key={step} style={{height:70,borderRadius:13,padding:'12px 15px',display:'flex',alignItems:'center',gap:12,background:i===active?'#e8f0d9':'#f6f6ed',border:i===active?'1px solid #bfd187':'1px solid transparent',color:i===active?C.ink:i<active?'#718875':'#929b88'}}><div style={{flexShrink:0,width:29,height:29,borderRadius:'50%',display:'grid',placeItems:'center',fontSize:16,fontWeight:700,background:i===active?C.green:i<active?'#e5ecdf':'#ebeee3',color:i===active?'white':'inherit'}}>{i<active?<Icon kind="check" size={18}/>:i+1}</div><span style={{fontSize:21,fontWeight:i===active?700:500,lineHeight:1.15}}>{step}</span></div>)}</div>}
      <div style={{marginTop:15,display:'flex',alignItems:'center',gap:10,fontSize:20,color:steam||checked?C.green:C.muted,opacity:pending?.5:1}}><Icon kind={steam||checked?'check':'link'} size={23}/>{steam?'OAT pitcher · Keep dairy equipment separate':checked?'Sam rechecked the revised ticket':hot?'Order and recipe are in sync':'Guidance follows staff-reported progress'}</div>
    </div>
  </Panel>;
}

export const CafeScene:React.FC = () => {
  const f = useCurrentFrame();
  const t = f/30;
  const requested = t>=story.events.requested;
  const hot = t>=story.events.accepted;
  const steam = t>=story.events.steaming;
  const pending = requested&&!hot;
  const cue = story.audio.find(a=>t>=a.start&&t<a.start+a.durationSeconds);
  const speaker = cue?.speaker??'';
  const heading = t>=24.5?'The conversation keeps work moving.':steam?'The right step. At the right time.':hot?'Confirmed by Sam. Updated for both.':requested?'One request. A shared next step.':'Mid-order. A change of mind.';
  const cut = t>=24.5?24.5:steam?story.events.steaming:hot?story.events.accepted:requested?story.events.requested:0;
  const headlineIn = at(f,cut,12);
  const intro = at(f,0,23);
  const caption = cue?.text ?? (t<2?'A latte is already being made. Aria changes her mind.':pending?'Waiting for Sam’s confirmation.':t>=24.32?'One conversation. The order and the next step stay together.':hot?'The updated order is shared with both sides.':'Aria’s request reaches the bar.');
  return <AbsoluteFill style={{background:C.paper,fontFamily:font,color:C.ink,overflow:'hidden'}}>
    <Fonts/>
    <div style={{position:'absolute',width:1000,height:800,right:-300,top:-450,borderRadius:'50%',background:'#eaf0dc'}}/>
    <div style={{position:'absolute',left:48,top:32,display:'flex',alignItems:'center',gap:13}}><div style={{width:40,height:40,borderRadius:13,background:C.ink,color:C.lime,display:'grid',placeItems:'center'}}><Icon kind="cup" size={25}/></div><span style={{fontFamily:'Manrope',fontSize:29,fontWeight:800,letterSpacing:-1}}>CafeOS</span><span style={{height:22,width:1,background:'#cbd6c4',margin:'0 8px'}}/><span style={{fontSize:20,color:C.muted}}>Voice at work</span></div>
    <div style={{position:'absolute',right:49,top:41,...small,fontSize:15,color:'#7b8b74'}}>Scene preview <span style={{margin:'0 13px',color:'#b6c0ad'}}>/</span> 01 — Change in progress</div>
    <div style={{position:'absolute',left:48,top:101,fontSize:49,fontWeight:700,letterSpacing:-1.8,lineHeight:1.15,opacity:.5+.5*headlineIn,transform:`translateY(${(1-headlineIn)*7}px)`}}>{heading}</div>
    <div style={{opacity:intro,transform:`translateY(${(1-intro)*16}px)`}}><Scene f={f} speaker={speaker} hot={hot} steam={steam}/><OrderPanel f={f} pending={pending} hot={hot}/><GuidePanel f={f} pending={pending} hot={hot} steam={steam}/></div>
    <div style={{position:'absolute',left:460,right:49,top:859,display:'flex',alignItems:'center',gap:20}}>{['Say the change','Confirm together','Keep making'].map((label,i)=><React.Fragment key={label}>{i>0&&<div style={{height:1,flex:1,background:'#cdd7c5'}}/>}<div style={{display:'flex',alignItems:'center',gap:11,fontSize:19,color:(i===0||i===1&&hot||i===2&&steam)?C.green:'#9aa591',fontWeight:700}}><span style={{width:28,height:28,borderRadius:'50%',background:(i===0||i===1&&hot||i===2&&steam)?'#dfecc3':'#e9ece1',display:'grid',placeItems:'center',fontSize:15}}>{i+1}</span>{label}</div></React.Fragment>)}</div>
    <div style={{position:'absolute',top:857,left:73,fontSize:16,color:'#839079'}}>A simple scene. Shared context.</div>
    <div style={{position:'absolute',left:48,right:48,top:914,height:113,display:'flex',alignItems:'center',gap:27,padding:'20px 28px',borderRadius:23,background:cue?'#e9eddf':'#eff1e6',border:'1px solid #e1e6d8'}}>
      <div style={{width:159,flexShrink:0,borderRight:'1px solid #cdd8c2',height:70,display:'flex',flexDirection:'column',justifyContent:'center'}}><div style={{fontSize:23,fontWeight:700}}>{cue?.speaker??'CafeOS'}</div><div style={{fontSize:16,color:C.muted,marginTop:4}}>{cue?.role??'Scene notes'}</div></div>
      <div style={{fontSize:28,lineHeight:1.3,fontWeight:500,flex:1,letterSpacing:-.3}}>{caption}</div>
      <div style={{width:65,flexShrink:0}}>{cue&&<Wave frame={f} color={speaker==='Aria'?C.hot:C.green}/>}</div>
    </div>
    <div style={{position:'absolute',left:49,bottom:16,fontSize:13,color:'#87917e',letterSpacing:.35}}>Simulated scenario · Prerecorded synthetic voices · Timing edited for presentation</div>
    <div style={{position:'absolute',right:49,bottom:16,fontSize:13,color:'#87917e'}}>CafeOS / Counter conversations</div>
    {story.audio.map(a=><Sequence key={a.file} from={Math.round(a.start*30)} durationInFrames={Math.ceil(a.durationSeconds*30)} layout="none"><Audio src={staticFile(`audio/${a.renderFile}`)} volume={1}/></Sequence>)}
  </AbsoluteFill>;
};
