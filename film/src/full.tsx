import React from 'react';
import {AbsoluteFill,Audio,Sequence,staticFile,useCurrentFrame} from 'remotion';
import data from './full-story.json';
import {Fonts,Icon,Pill,Wave,Cup,Scene} from './scene';

const C={ink:'#183d35',green:'#316b50',lime:'#d8ef85',muted:'#748475',paper:'#f7f7ee',line:'#e5e9df',amber:'#ad6a24',amberBg:'#fff1d5',blue:'#56859a',blueBg:'#e4f1f4',hot:'#b66a49',hotBg:'#f8e7db'};
type Item={id:string,product:string,milk:string,temperature:string,size:string,price:number,status:string,step:number,pendingChange?:{temperature:string}};
type Order={id:string,customer:string,status:string,items:Item[]};
type Stock={stock:number,reserved:number,available:number};
type Event={at:number,title:string,customer:string,focusOrder:string,itemId:string,mode:string,notice:string,customerNotice:string,tone:string,orders:Order[],inventory:Record<string,Stock>,revision:number};
type Clip={file:string,renderFile:string,index:number,kind:string,audience:string,start:number,durationSeconds:number,speaker:string,text:string};
type Focus={name:string,role:string,opacity:number,pulse:number};
export type FullStory={events:Event[],audio:Clip[],duration:number,milestones:Record<string,number>};
const StoryContext=React.createContext<FullStory>(data as unknown as FullStory);
const clamp=(v:number)=>Math.min(1,Math.max(0,v));
const ease=(v:number)=>1-Math.pow(1-clamp(v),3);
const name=(i:Item)=>i.product==='americano'?'Americano':i.milk==='oat'?'Oat latte':'Dairy latte';
const status=(i:Item)=>({draft:'Not ordered yet',queued:'Order received',making:'Being made',ready:'Ready'}[i.status]??i.status);
const active=(orders:Order[])=>orders.filter(o=>['confirmed','complete'].includes(o.status));
function Surface({left,width,children,focus}:{left:number,width:number,children:React.ReactNode,focus?:Focus}){
 return <div style={{position:'absolute',left,top:165,width,height:700,borderRadius:28,background:'#fffef8',border:`1px solid ${C.line}`,boxShadow:'0 14px 40px #233e2b09',zIndex:focus?2:1}}>
  <div style={{height:'100%',borderRadius:27,overflow:'hidden'}}>{children}</div>
  {focus&&<>
   <div style={{position:'absolute',inset:-1,borderRadius:28,pointerEvents:'none',opacity:focus.opacity,boxShadow:`0 0 0 7px ${C.green},0 0 0 ${13+2*focus.pulse}px rgba(216,239,133,${.5+.2*focus.pulse})`}}/>
   <div style={{position:'absolute',left:18,top:-51,height:42,padding:'0 17px',borderRadius:13,background:C.green,color:'#fffef8',display:'flex',alignItems:'center',gap:10,fontSize:25,fontWeight:700,whiteSpace:'nowrap',opacity:focus.opacity,transform:`translateY(${(1-focus.opacity)*4}px)`}}><span style={{color:C.lime}}>→</span><span>To {focus.name}</span><span style={{fontSize:23,fontWeight:500,color:'#e3efcc'}}>· {focus.role}</span></div>
  </>}
 </div>;
}
function Top({title,aside}:{title:string,aside?:React.ReactNode}){
 return <div style={{padding:'28px 28px 25px',display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:`1px solid ${C.line}`,height:94}}><span style={{fontSize:30,fontWeight:700,letterSpacing:-.5}}>{title}</span>{aside}</div>;
}
function Notice({children,amber=false}:{children:React.ReactNode,amber?:boolean}){
 return <div style={{padding:'17px 20px',borderRadius:16,background:amber?C.amberBg:'#eaf0dc',color:amber?C.amber:C.green,fontSize:23,fontWeight:500,lineHeight:1.35,display:'flex',alignItems:'center',gap:13}}><span style={{flexShrink:0,display:'flex'}}><Icon kind={amber?'mic':'check'} size={25}/></span>{children}</div>;
}
function Customer({e,t,focus}:{e:Event,t:number,focus?:Focus}){
 const story=React.useContext(StoryContext);
 const order=e.orders.find(o=>o.id===e.focusOrder);
 const removed=order&&['collected','cancelled'].includes(order.status);
 const ready=order?.items.filter(i=>i.status==='ready').length??0;
 const pending=order?.items.find(i=>i.pendingChange);
 const progress=e.at===story.milestones.collectedAt||e.at===story.milestones.cancelAt||e.at===story.milestones.clearAt?ease((t-e.at)/.9):1;
 return <Surface left={458} width={602} focus={focus}>
  <Top title={`${e.customer}’s order`} aside={order&&!removed?<Pill style={{fontSize:22}}>{order.id}</Pill>:<Icon kind="cup" size={30}/>}/>
  {!order?<div style={{padding:30}}><div style={{margin:'28px 0 24px',color:C.green}}><Icon kind="mic" size={55}/></div><div style={{fontSize:36,fontWeight:700,lineHeight:1.2}}>What would<br/>you like today?</div><p style={{fontSize:25,color:C.muted,lineHeight:1.4,marginTop:18}}>Tell CafeOS your order.<br/>Review it before sending.</p><div style={{display:'flex',gap:15,marginTop:28}}>{['Latte','Americano'].map(p=><div key={p} style={{background:'#f0f2e7',padding:'18px 21px',borderRadius:17,fontSize:24,flex:1}}><Cup hot/><div style={{fontWeight:700}}>{p}</div></div>)}</div></div>
  :removed?<div style={{padding:'51px 30px',opacity:progress,transform:`translateY(${(1-progress)*18}px)`}}><div style={{width:80,height:80,background:order.status==='collected'?'#e4edca':C.amberBg,borderRadius:'50%',display:'grid',placeItems:'center',color:C.green}}><Icon kind="check" size={43}/></div><div style={{fontSize:39,fontWeight:700,lineHeight:1.15,marginTop:26}}>{order.status==='collected'?'Enjoy your coffee!':'Order cancelled.'}</div><p style={{fontSize:25,lineHeight:1.45,color:C.muted,margin:'18px 0 30px'}}>{order.status==='collected'?`Thanks for stopping by, ${order.customer}.`:`No problem, ${order.customer}. We hope to see you again soon.`}</p><Notice>{order.status==='collected'?'See you next time.':'Your order is cancelled. You’re all set.'}</Notice></div>
  :<div style={{padding:'24px 26px'}}>
   {order.items.map((i,k)=><div key={i.id} style={{height:order.items.length>1?147:197,display:'flex',alignItems:'center',gap:18,padding:'16px 20px',marginBottom:14,borderRadius:19,background:i.status==='ready'?'#edf2e1':i.pendingChange?'#fbf4e5':i.temperature==='hot'?'#f7eee4':'#edf3ef',border:`2px solid ${i.pendingChange?'#d6a85b':i.status==='ready'?'#bacf8d':i.id===e.itemId?'#c4d1bc':'transparent'}`}}><Cup hot={i.temperature==='hot'} large/><div style={{flex:1}}><div style={{fontSize:29,fontWeight:700,letterSpacing:-.5}}>{String(k+1).padStart(2,'0')} · {name(i)}</div><div style={{display:'flex',gap:10,alignItems:'center',marginTop:8}}><Pill bg={i.temperature==='hot'?C.hotBg:C.blueBg} color={i.temperature==='hot'?C.hot:C.blue} style={{fontSize:19,padding:'5px 11px'}}>{i.temperature.toUpperCase()}</Pill><span style={{fontSize:21,color:C.muted}}>{i.size==='large'?'Large':'Regular'}</span></div><div style={{marginTop:9,fontSize:21,color:i.status==='ready'?C.green:C.muted,display:'flex',alignItems:'center',gap:6}}>{i.status==='ready'&&<Icon kind="check" size={20}/>}{status(i)}</div></div></div>)}
   <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',margin:'21px 4px',fontSize:24}}><span style={{color:C.muted}}>{order.status==='draft'?'Total':`${ready} / ${order.items.length} ready`}</span><strong>NT$ {order.items.reduce((v,i)=>v+i.price,0)}</strong></div>
   {pending?<Notice amber>You’d like your oat latte hot.<br/>We’re checking with Sam.</Notice>:order.status==='complete'?<Notice>All drinks ready.<br/>Waiting for pickup.</Notice>:e.customerNotice?<Notice amber={e.tone==='amber'}>{e.customerNotice}</Notice>:order.status==='draft'?<div style={{background:C.ink,color:'#fafbef',padding:'18px 23px',borderRadius:15,fontSize:25,fontWeight:700,display:'flex',justifyContent:'space-between'}}>Review & send <Icon kind="arrow" size={28}/></div>:<Notice>Your order is at the bar.</Notice>}
  </div>}
 </Surface>;
}
function QueueCard({o,ghost=false,label,style={}}:{o:Order,ghost?:boolean,label?:string,style?:React.CSSProperties}){
 const ready=o.items.filter(i=>i.status==='ready').length;
 return <div style={{height:106,padding:'17px 20px',borderRadius:16,background:ghost?'#e7eed7':o.status==='complete'?'#eaf0da':'#f2f4e9',border:`1px solid ${ghost?'#aebf8b':'#e2e7d7'}`,...style}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><span style={{fontSize:27,fontWeight:700}}>{o.id} <span style={{fontWeight:500,marginLeft:12}}>{o.customer}</span></span><span style={{fontSize:21,color:C.green,fontWeight:500}}>{label??(o.status==='complete'?'Ready for pickup':o.items.some(i=>i.status==='making')?'In progress':'Queued')}</span></div><div style={{display:'flex',justifyContent:'space-between',marginTop:9,fontSize:21,color:C.muted}}><span>{o.items.map(i=>name(i)).join(' + ')}</span><span>{ready}/{o.items.length} ready</span></div></div>;
}
function Queue({e,previous,t,focus}:{e:Event,previous:Event,t:number,focus?:Focus}){
 const list=active(e.orders),before=active(previous.orders);
 const removed=before.find(o=>!list.some(n=>n.id===o.id));
 const transition=ease((t-e.at)/.9);
 const removedStatus=e.orders.find(o=>o.id===removed?.id)?.status;
 const oat=e.inventory.oat;
 const recent=e.notice.includes('duplicate')||e.notice.includes('Already received');
 return <Surface left={1084} width={788} focus={focus}>
  <Top title="Bar queue" aside={<Pill style={{fontSize:22}}>{list.length} {list.length===1?'order':'orders'}</Pill>}/>
  <div style={{padding:'23px 27px'}}>
   <div style={{height:356,position:'relative'}}>
    {list.map((o,i)=>{const old=before.findIndex(v=>v.id===o.id);const offset=old>=0?(old-i)*119*(1-transition):25*(1-transition);return <QueueCard key={o.id} o={o} style={{position:'absolute',left:0,right:0,top:i*119+offset,opacity:old>=0?1:transition}}/>;})}
    {removed&&transition<1&&<QueueCard o={removed} ghost label={removedStatus==='cancelled'?'Cancelled':'Collected'} style={{position:'absolute',left:0,right:0,top:before.findIndex(o=>o.id===removed.id)*119,transform:`translateX(${transition*800}px)`,opacity:1-transition}}/>}
    {!list.length&&(!removed||transition>.8)&&<div style={{height:324,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',color:C.green,opacity:removed?transition:1}}><div style={{width:85,height:85,borderRadius:'50%',background:'#e7efcf',display:'grid',placeItems:'center'}}><Icon kind={e.mode==='end'?'check':'cup'} size={46}/></div><div style={{fontSize:36,fontWeight:700,marginTop:23}}>{e.mode==='end'||e.orders.length?'All caught up.':'Ready for the first order.'}</div><div style={{fontSize:24,color:C.muted,marginTop:10}}>{e.orders.length?'No orders waiting.':'Confirmed orders appear here.'}</div></div>}
   </div>
   <div style={{borderTop:`1px solid ${C.line}`,paddingTop:19}}>
    {e.mode==='end'?<div style={{display:'flex',justifyContent:'space-between',padding:'7px 22px'}}>{[[e.orders.filter(o=>o.status==='collected').length,'Orders collected'],[e.orders.filter(o=>o.status==='collected').reduce((n,o)=>n+o.items.length,0),'Coffees served']].map(([n,label])=><div key={label} style={{textAlign:'center'}}><div style={{fontSize:55,fontWeight:700,color:C.green}}>{n}</div><div style={{fontSize:23,color:C.muted}}>{label}</div></div>)}</div>
    :<div style={{display:'flex',alignItems:'center',justifyContent:'space-between',borderRadius:18,background:oat.available===0?C.amberBg:'#eef2e3',padding:'18px 23px'}}><div><div style={{fontSize:25,fontWeight:700}}>Oat milk</div><div style={{fontSize:21,color:C.muted,marginTop:6}}>{oat.reserved} reserved · {oat.stock} in stock</div></div><div style={{display:'flex',alignItems:'baseline',gap:12,color:oat.available===0?C.amber:C.green}}><span style={{fontSize:53,lineHeight:1,fontWeight:700}}>{oat.available}</span><span style={{fontSize:23}}>available</span></div></div>}
    {recent&&<div style={{display:'flex',gap:10,alignItems:'center',fontSize:22,color:C.green,marginTop:16}}><Icon kind="check" size={24}/>Retry received · Ticket count unchanged</div>}
    {e.tone==='amber'&&!recent&&<div style={{fontSize:22,color:C.amber,marginTop:16}}>Draft stays with the customer until it can be sent.</div>}
   </div>
  </div>
 </Surface>;
}
function Guide({e,focus}:{e:Event,focus?:Focus}){
 const order=e.orders.find(o=>o.id===e.focusOrder)!;
 const item=order.items.find(i=>i.id===e.itemId)!;
 const isReady=item.status==='ready',pending=Boolean(item.pendingChange);
 const index=item.step;
 const steps=['Check the ticket','Extract espresso',item.product==='americano'?'Add ice + water':item.temperature==='hot'?`Steam ${item.milk} milk`:`Add ice + ${item.milk} milk`,'Finish & check'];
 const titles=['Check this ticket','Extract the espresso',item.product==='americano'?'Add ice and water':item.temperature==='hot'?`Steam ${item.milk} milk`:`Add ice and ${item.milk} milk`,'Finish and check the cup'];
 const details=[`${item.temperature==='hot'?'Hot':'Iced'} ${name(item).toLowerCase()} · ${item.size==='large'?'Large':'Regular'}`,'Double shot, following the café recipe.',item.product==='americano'?'Filtered water, ice, then espresso.':item.temperature==='hot'?'Silky texture. Café temperature target.':`Cold ${item.milk} milk, measured for this cup.`,'Match the drink to the ticket before marking ready.'];
 return <Surface left={1084} width={788} focus={focus}>
  <Top title={e.mode==='pickup'&&order.status==='complete'?'Ready for pickup':'Sam’s next step'} aside={<Pill style={{fontSize:22}}>{order.status==='complete'?order.id:`${order.id} · ${item.id.endsWith('2')?'Cup 02':'Cup 01'}`}</Pill>}/>
  <div style={{padding:'23px 27px'}}>
   {order.status==='complete'?<>
    <div style={{borderRadius:21,background:C.ink,color:'#f9f9ed',padding:'29px 28px',height:195}}><div style={{fontSize:24,color:C.lime,marginBottom:13}}>All drinks checked</div><div style={{fontSize:38,fontWeight:700}}>{order.customer}’s order is ready.</div><div style={{fontSize:25,color:'#c2d6bc',marginTop:13}}>{order.items.length} {order.items.length===1?'cup':'cups'} · Waiting at the counter</div></div>
    <div style={{display:'flex',gap:16,marginTop:24}}>{order.items.map(i=><div key={i.id} style={{flex:1,borderRadius:17,padding:'18px 21px',background:'#edf2e1',display:'flex',gap:12,alignItems:'center'}}><Cup hot={i.temperature==='hot'}/><div style={{fontSize:24,fontWeight:700}}>{name(i)}<div style={{display:'flex',gap:5,alignItems:'center',fontSize:22,fontWeight:400,color:C.green,marginTop:6}}><Icon kind="check" size={22}/>Ready</div></div></div>)}</div>
    <div style={{marginTop:23,padding:'22px 24px',borderRadius:17,border:'1px solid #cbd6bd'}}><div style={{fontSize:25,fontWeight:700}}>Hand over every cup.</div><div style={{fontSize:23,color:C.muted,marginTop:8}}>Tell CafeOS when the customer has their drinks.</div></div>
   </>:<>
    <div style={{fontSize:25,fontWeight:700,marginBottom:15}}>{name(item)} <span style={{fontWeight:400,color:C.muted}}>· {item.temperature==='hot'?'Hot':'Iced'}</span></div>
    <div style={{height:173,borderRadius:20,padding:'22px 25px',background:pending?C.amberBg:C.ink,color:pending?C.ink:'#f8faec'}}><div style={{fontSize:21,color:pending?C.amber:C.lime,marginBottom:10}}>{pending?'Request from Aria':isReady?'Cup completed':`Step ${index+1} of 4`}</div><div style={{fontSize:35,fontWeight:700,letterSpacing:-.7,lineHeight:1.2}}>{pending?'A change needs your OK':isReady?'Oat latte ready. Dairy is next.':titles[index]}</div><div style={{fontSize:23,lineHeight:1.3,marginTop:11,color:pending?'#8b663d':'#c6d5c4'}}>{pending?'Cup 02 · Iced → Hot · Oat milk stays':isReady?'Set the oat latte aside while you make the dairy latte.':details[index]}</div></div>
    {pending?<div style={{marginTop:20,borderRadius:17,border:'1px solid #dfc08c',padding:'21px 23px'}}><div style={{fontSize:25,fontWeight:700}}>Original recipe stays until you confirm.</div><div style={{background:C.ink,color:'#fafbef',padding:'18px 23px',borderRadius:14,fontSize:26,fontWeight:700,marginTop:22,display:'flex',alignItems:'center',gap:12}}><Icon kind="mic" size={27}/>Approve this change</div></div>
    :isReady?<div style={{marginTop:21}}><Notice>1 of 2 cups ready.<br/>Prepare Aria’s dairy latte next.</Notice><div style={{fontSize:25,color:C.green,marginTop:27,fontWeight:700}}>Next cup → C12 · Dairy latte</div></div>
    :<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginTop:20}}>{steps.map((s,i)=><div key={s} style={{height:77,padding:'12px 16px',borderRadius:14,display:'flex',alignItems:'center',gap:12,background:i===index?'#e6efcf':'#f3f5eb',border:i===index?'1px solid #b8ce85':'1px solid transparent',color:i===index?C.ink:i<index?'#789173':'#949f8d'}}><div style={{width:29,height:29,borderRadius:'50%',background:i===index?C.green:'#e8eddf',color:i===index?'white':'inherit',fontSize:18,fontWeight:700,display:'grid',placeItems:'center',flexShrink:0}}>{i<index?<Icon kind="check" size={19}/>:i+1}</div><span style={{fontSize:22,fontWeight:i===index?700:500,lineHeight:1.15}}>{s}</span></div>)}</div>}
    {!pending&&!isReady&&<div style={{fontSize:23,color:C.green,display:'flex',gap:9,alignItems:'center',marginTop:23}}><Icon kind="check" size={24}/>{e.notice||'Follow the current ticket.'}</div>}
   </>}
  </div>
 </Surface>;
}

export const FullCafeFilm:React.FC<{story?:FullStory}>=({story=data as unknown as FullStory})=><StoryContext.Provider value={story}><FilmBody/></StoryContext.Provider>;
const FilmBody:React.FC=()=>{
 const story=React.useContext(StoryContext);
 const f=useCurrentFrame(),t=f/30;
 let n=0;for(let i=1;i<story.events.length;i++){if(story.events[i].at>t)break;n=i;}
 const e=story.events[n],previous=story.events[Math.max(0,n-1)];
 const cue=story.audio.find(a=>t>=a.start&&t<a.start+a.durationSeconds);
 const focus=cue?{name:cue.audience,role:cue.audience==='Sam'?'Barista':'Customer',opacity:Math.min(ease((t-cue.start)/.12),ease((cue.start+cue.durationSeconds-t)/.14)),pulse:Math.sin(Math.PI*clamp((t-cue.start)/.8))}:undefined;
 const customerFocus=focus?.name===e.customer?focus:undefined;
 const staffFocus=focus?.name==='Sam'?focus:undefined;
 const cafeListening=focus?.name==='CafeOS';
 const order=e.orders.find(o=>o.id===e.focusOrder),item=order?.items.find(i=>i.id===e.itemId);
 const transition=ease((t-e.at)/.4);
 const removed=order&&['collected','cancelled'].includes(order.status);
 const depart=removed?ease((t-e.at-.6)/1.4):0;
 const ready=order?.items.filter(i=>i.status==='ready').length??0;
 const handoffStart=story.audio.find(a=>a.index===(e.customer==='Aria'?18:22)&&a.kind==='user')?.start??999;
 const handoff=order?.status==='collected'?1:ease((t-handoffStart-.6)/1.3);
 const steam=item?.step===2&&item.temperature==='hot'&&item.status==='making';
 return <AbsoluteFill style={{fontFamily:'DM Sans, sans-serif',background:C.paper,color:C.ink,overflow:'hidden'}}>
  <Fonts/>
  <div style={{position:'absolute',left:40,top:35,padding:8,borderRadius:20,display:'flex',alignItems:'center',gap:13,background:cafeListening?'#eaf0dc':'transparent',boxShadow:cafeListening?`0 0 0 4px rgba(49,107,80,${focus.opacity}),0 0 0 9px rgba(216,239,133,${focus.opacity*.5})`:'none'}}><div style={{width:48,height:48,borderRadius:15,background:C.ink,color:C.lime,display:'grid',placeItems:'center'}}><Icon kind="cup" size={30}/></div><span style={{fontSize:34,fontFamily:'Manrope',fontWeight:800,letterSpacing:-1}}>CafeOS</span></div>
  <div style={{position:'absolute',left:307,top:45,fontSize:43,fontWeight:700,letterSpacing:-1.1,lineHeight:1.17,opacity:.65+.35*transition,transform:`translateY(${(1-transition)*4}px)`}}>{e.title}</div>
  <div style={{transform:'translateY(-25px)'}}><Scene f={f} speaker={cue?.speaker??''} hot={item?.temperature==='hot'} steam={Boolean(steam)} clean customerName={e.customer} cups={order?.status==='cancelled'?0:ready} depart={depart} handoff={handoff}/></div>
  <Customer e={e} t={t} focus={customerFocus}/>
  {e.mode==='guide'||e.mode==='pickup'?<Guide e={e} focus={staffFocus}/>:<Queue e={e} previous={previous} t={t} focus={staffFocus}/>}
  {cue&&<div style={{position:'absolute',left:48,right:48,top:910,height:120,display:'flex',alignItems:'center',gap:26,padding:'16px 28px',borderRadius:23,background:'#e8eddf',border:'1px solid #dfe5d5',borderLeft:`7px solid ${C.green}`}}><div style={{width:225,flexShrink:0,borderRight:'1px solid #cbd6be',height:87,display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'flex-start',gap:8,fontSize:24,fontWeight:700}}><span>{cue.speaker}</span><span style={{fontSize:28,lineHeight:1,fontWeight:700,color:'#fffef8',background:C.green,padding:'8px 13px',borderRadius:12,display:'flex',alignItems:'center',gap:9}}><span style={{color:C.lime}}>→</span>To {cue.audience}</span></div><div style={{fontSize:28,fontWeight:500,lineHeight:1.32,letterSpacing:-.3,flex:1}}>{cue.text}</div><Wave frame={f} color={cue.speaker==='CafeOS'?C.green:C.hot}/></div>}
  {story.audio.map(a=><Sequence key={`${a.file}-${a.start}`} from={Math.round(a.start*30)} durationInFrames={Math.ceil(a.durationSeconds*30)} layout="none"><Audio src={staticFile(`audio/${a.renderFile}`)}/></Sequence>)}
 </AbsoluteFill>;
};
