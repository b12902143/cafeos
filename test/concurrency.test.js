import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,execute,availability} from '../lib/store.js';
test('a batch checks the original version once and commits both edits atomically',()=>{
 const actor={role:'customer',customer:'Aria'};
 const initial=execute(createState(),{requestId:'new',actor,actions:[{type:'create',items:[{product:'latte'}]}]}).state;
 const result=execute(initial,{requestId:'change-and-send',actor,actions:[{type:'change',orderId:'C12',itemId:'C12-1',changes:{temperature:'iced'},expectedVersion:1},{type:'confirm',orderId:'C12',expectedVersion:1}]});
 assert.equal(result.state.orders[0].version,3);assert.equal(result.state.orders[0].status,'confirmed');assert.equal(result.state.orders[0].items[0].temperature,'iced');assert.equal(result.state.revision,2);
});
test('insufficient stock at staff acceptance preserves the original drink and pending change',()=>{
 let state=createState();const run=(requestId,actor,actions)=>{state=execute(state,{requestId,actor,actions}).state;};const aria={role:'customer',customer:'Aria'},leo={role:'customer',customer:'Leo'},bar={role:'barista'};
 run('aria-new',aria,[{type:'create',items:[{product:'latte'}]}]);run('aria-send',aria,[{type:'confirm',orderId:'C12'}]);run('aria-start',bar,[{type:'start',orderId:'C12',itemId:'C12-1'}]);
 run('leo-new',leo,[{type:'create',items:[{product:'latte',milk:'oat'},{product:'latte',milk:'oat'}]}]);run('leo-send',leo,[{type:'confirm',orderId:'C13'}]);
 run('aria-change',aria,[{type:'change',orderId:'C12',itemId:'C12-1',changes:{milk:'oat'}}]);
 const before=structuredClone(state);assert.throws(()=>execute(state,{requestId:'accept',actor:bar,actions:[{type:'acceptChange',orderId:'C12',itemId:'C12-1'}]}),{code:'OUT_OF_STOCK'});
 assert.deepEqual(state,before);assert.equal(state.orders[0].items[0].milk,'dairy');assert.equal(state.orders[0].items[0].pendingChange.milk,'oat');assert.equal(availability(state).oat.reserved,2);
});
