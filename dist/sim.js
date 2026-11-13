export const LEADERS = {
  indigo:{name:'Indigo',title:'The Radiant King',house:'House of Cock',style:'Hold. Protect. Advance.',doctrine:'Shield discipline',detail:'Soldiers have 25% more health. Your army holds a steady shield line.',signature:'Radiant Rally',signatureText:'Heal allied squads on this Front by 35 and shield them for 5 seconds.',sigIcon:'✦',color:'#d7bd77'},
  lucy:{name:'Lucy',title:'The Frost Queen',house:'House of Hen',style:'Control the field.',doctrine:'Winter formation',detail:'Archers gain range. Their arrows slow enemy movement by 25% for 2 seconds.',signature:'Winter’s Grasp',signatureText:'Slow all enemy squads on this Front by 70% for 5 seconds.',sigIcon:'❄',color:'#9fc6de'},
  nezz:{name:'Nezz',title:'The Void-Touched Prince',house:'House of Cock',style:'Find the opening.',doctrine:'Relentless pursuit',detail:'Melee squads move 25% faster and deal 25% more damage to wounded enemies.',signature:'Void Step',signatureText:'Advance allied melee squads on this Front and give them a 5-second attack surge.',sigIcon:'◈',color:'#bb9cda'}
};
export const CARDS = {
 soldier:{name:'Dawn Infantry',type:'Troop · melee',cost:2,icon:'⚔',text:'Deploy 3 soldiers. They advance, engage enemy squads, and attack the Stronghold.',tone:'gold'},
 archer:{name:'Roost Archers',type:'Troop · ranged',cost:3,icon:'➶',text:'Deploy 3 archers. They fire from behind your front line.',tone:'sage'},
 fire:{name:'Fire Arrows',type:'Army doctrine',cost:4,icon:'♨',text:'All allied archers, on every Front, deal +3 damage and burn targets. Includes future archers. Lasts this battle; does not stack.',tone:'ember'},
 guard:{name:'Oathguard',type:'Troop · defender',cost:3,icon:'⬟',text:'Deploy 3 heavy guards. High health, slow advance, and a sturdy shield line.',tone:'gold'},
 shield:{name:'Shield Wall',type:'Tactic · Front',cost:2,icon:'▰',text:'Allied squads on the selected Front take 50% less damage for 7 seconds.',tone:'blue'},
 rally:{name:'Field Mending',type:'Tactic · Front',cost:2,icon:'✚',text:'Restore 45 health to every allied squad on the selected Front.',tone:'sage'},
 signature:{name:'Leader command',type:'Leader · exclusive',cost:3,icon:'✦',text:'Your commander’s signature order.',tone:'violet'},
 oath:{name:'Oath of the Line',type:'Oath · 1 Soul',cost:2,icon:'◎',text:'Keep an allied squad on this Front for 12 seconds. Binds 1 Soul. Fulfill: return Soul, gain 4 Command, restore 3 Integrity. Lose all allies here: Soul becomes Debt.',tone:'violet'}
};
const STATS={soldier:{hp:100,damage:11,range:1.35,speed:1.02,interval:1.5},archer:{hp:64,damage:8,range:6.6,speed:.7,interval:1.9},guard:{hp:170,damage:8,range:1.5,speed:.7,interval:1.8}};
export class Battle {
 constructor(leader='indigo',seed=82){
  this.seed=seed;this.time=0;this.id=0;this.units=[];this.projectiles=[];this.effects=[];this.log=[];this.result=null;this.aiTimer=3.8;
  this.sides=[this.side(leader),this.side(leader==='lucy'?'nezz':'lucy')];
  this.record('The gates open. Both armies act in real time.');
 }
 rng(){this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;return this.seed/4294967296;}
 side(leader){return {leader,integrity:25,command:7,soul:6,debt:0,fire:false,hand:['soldier','archer','fire','signature','oath'],deck:['guard','shield','rally','soldier','archer','fire','guard','shield','rally','signature','oath'],discard:[],oaths:[],played:0,kills:0};}
 record(text,side=null){this.log.unshift({time:this.time,text,side});if(this.log.length>32)this.log.length=32;}
 card(key,side=0){const c={...CARDS[key]};if(key==='signature'){const l=LEADERS[this.sides[side].leader];c.name=l.signature;c.text=l.signatureText;c.icon=l.sigIcon;}if(key==='guard'){const l=this.sides[side].leader;c.name=l==='lucy'?'Frostguard':l==='nezz'?'Covenant Guard':'Oathguard';}return c;}
 allies(side,lane){return this.units.filter(u=>u.side===side&&u.lane===lane&&u.hp>0);}
 canPlay(side,index,lane){
  if(this.result)return 'This battle has ended.';
  const s=this.sides[side],key=s.hand[index],c=CARDS[key];if(!c)return 'No card in that slot.';
  if(lane<0||lane>2)return 'Select a Front.';
  if(s.command<c.cost)return 'Need more Command.';
  if(['soldier','archer','guard'].includes(key)&&this.units.filter(u=>u.side===side&&u.hp>0).length>=12)return 'Army limit: 12 squads.';
  if(key==='fire'&&s.fire)return 'Fire Arrows is already active.';
  if(['rally','shield','oath'].includes(key)&&!this.allies(side,lane).length)return 'Deploy an allied squad on this Front first.';
  if(key==='signature'&&s.leader!=='lucy'&&!this.allies(side,lane).length)return 'Deploy an allied squad on this Front first.';
  if(key==='signature'&&s.leader==='lucy'&&!this.allies(1-side,lane).length)return 'No enemies on this Front to freeze.';
  if(key==='oath'&&(s.soul<1||s.oaths.length>=2||s.oaths.some(o=>o.lane===lane)))return 'Need 1 free Soul and an open Oath slot on this Front.';
  return null;
 }
 play(side,index,lane){
  const error=this.canPlay(side,index,lane);if(error)return {ok:false,error};
  const s=this.sides[side],key=s.hand[index],c=this.card(key,side),friends=this.allies(side,lane);s.command-=c.cost;s.played++;
  if(STATS[key])this.spawn(side,key,lane);
  if(key==='fire'){s.fire=true;this.effects.push({kind:'upgrade',side,lane,x:side?7:-7,z:0,life:1.2});}
  if(key==='shield')friends.forEach(u=>u.shield=Math.max(u.shield,7));
  if(key==='rally')friends.forEach(u=>u.hp=Math.min(u.maxHp,u.hp+45));
  if(key==='signature'){
   if(s.leader==='indigo')friends.forEach(u=>{u.hp=Math.min(u.maxHp,u.hp+35);u.shield=Math.max(u.shield,5);});
   if(s.leader==='lucy')this.allies(1-side,lane).forEach(u=>{u.slow=5;u.slowAmount=.7;});
   if(s.leader==='nezz')friends.filter(u=>u.type!=='archer').forEach(u=>{u.x+=side?-2.2:2.2;u.surge=5;});
   this.effects.push({kind:'signature',leader:s.leader,side,lane,x:0,z:(lane-1)*4.8,life:1.4});
  }
  if(key==='oath'){s.soul--;s.oaths.push({lane,remaining:12});}
  s.discard.push(key);
  if(!s.deck.length){s.deck=s.discard.splice(0);for(let i=s.deck.length-1;i>0;i--){const j=Math.floor(this.rng()*(i+1));[s.deck[i],s.deck[j]]=[s.deck[j],s.deck[i]];}}
  s.hand[index]=s.deck.shift();
  this.record(`${side?'Enemy':'You'} played ${c.name}${key==='fire'?' · every allied archer':` · ${['West','Center','East'][lane]} Front`}.`,side);
  return {ok:true,key};
 }
 spawn(side,type,lane){const stats={...STATS[type]},leader=this.sides[side].leader;
  if(leader==='indigo'&&type==='soldier')stats.hp*=1.25;
  if(leader==='lucy'&&type==='archer')stats.range+=1.2;
  if(leader==='nezz'&&type!=='archer')stats.speed*=1.25;
  const u={...stats,id:++this.id,type,side,lane,x:side?11.7:-11.7,z:(lane-1)*4.8+(this.rng()-.5)*1.6,maxHp:stats.hp,cooldown:.5+this.rng()*.45,burn:0,shield:0,slow:0,slowAmount:.25,surge:0,attacking:0};this.units.push(u);return u;
 }
 damage(u,amount){if(!u||u.hp<=0)return;u.hp-=amount*(u.shield>0?.5:1);this.effects.push({kind:'hit',x:u.x,z:u.z,life:.35,side:u.side});}
 tick(dt){
  if(this.result)return;
  this.time+=dt;
  for(const s of this.sides)s.command=Math.min(10,s.command+dt*.7);
  const live=this.units.filter(u=>u.hp>0);const hits=[];const baseHits=[0,0];
  for(const u of live){
   u.cooldown-=dt;u.attacking=Math.max(0,u.attacking-dt);u.shield=Math.max(0,u.shield-dt);u.surge=Math.max(0,u.surge-dt);u.slow=Math.max(0,u.slow-dt);if(u.slow===0)u.slowAmount=.25;
   if(u.burn>0){u.burn=Math.max(0,u.burn-dt);hits.push({u,amount:2*dt});}
   let target=null,distance=Infinity;
   for(const v of live)if(v.side!==u.side&&v.lane===u.lane){const d=Math.abs(v.x-u.x);if(d<distance){distance=d;target=v;}}
   const baseX=u.side?-13.2:13.2,baseDist=Math.abs(baseX-u.x),inRange=target?distance<=u.range:baseDist<=u.range;
   if(!inRange){let speed=u.speed*(u.slow>0?1-u.slowAmount:1);if(u.type==='archer'&&target){const guard=live.find(v=>v.side===u.side&&v.lane===u.lane&&v.type!=='archer'&&(u.side?v.x<u.x:v.x>u.x));if(guard&&Math.abs(guard.x-u.x)<1.8)speed*=.2;}u.x+=(u.side?-1:1)*speed*dt;}
   else if(u.cooldown<=0){u.cooldown=u.interval/(u.surge>0?1.45:1);u.attacking=.35;let damage=u.damage;if(this.sides[u.side].leader==='nezz'&&u.type!=='archer'&&target&&target.hp<target.maxHp*.5)damage*=1.25;
    if(u.type==='archer'){const fire=this.sides[u.side].fire;this.projectiles.push({side:u.side,fromX:u.x,fromZ:u.z,toX:target?target.x:baseX,toZ:target?target.z:u.z,targetId:target?.id??null,base:!target,targetSide:1-u.side,damage:target?damage+(fire?3:0):.65+(fire?.25:0),fire,frost:this.sides[u.side].leader==='lucy',life:.6,total:.6});}
    else if(target)hits.push({u:target,amount:damage});else baseHits[1-u.side]+=.9;
   }
  }
  for(const p of this.projectiles){p.life-=dt;if(p.life<=0){if(p.base){baseHits[p.targetSide]+=p.damage;}else{const u=live.find(u=>u.id===p.targetId);if(u){hits.push({u,amount:p.damage});if(p.fire)u.burn=3;if(p.frost){u.slow=Math.max(u.slow,2);u.slowAmount=Math.max(u.slowAmount,.25);}}}}}
  for(const h of hits)this.damage(h.u,h.amount);
  for(let i=0;i<2;i++)this.sides[i].integrity=Math.max(0,this.sides[i].integrity-baseHits[i]);
  this.projectiles=this.projectiles.filter(p=>p.life>0);this.effects.forEach(e=>e.life-=dt);this.effects=this.effects.filter(e=>e.life>0);
  for(const u of this.units)if(u.hp<=0){this.sides[1-u.side].kills++;this.effects.push({kind:'fall',x:u.x,z:u.z,side:u.side,life:.8});}
  this.units=this.units.filter(u=>u.hp>0);
  this.sides.forEach((s,side)=>{for(const o of [...s.oaths]){if(!this.allies(side,o.lane).length){s.debt++;s.oaths.splice(s.oaths.indexOf(o),1);this.record(`${side?'Enemy':'Your'} Oath broke. 1 Soul became Debt.`,side);}else{o.remaining-=dt;if(o.remaining<=0){s.soul++;s.command=Math.min(10,s.command+4);s.integrity=Math.min(25,s.integrity+3);s.oaths.splice(s.oaths.indexOf(o),1);this.record(`${side?'Enemy':'Your'} Oath fulfilled. Soul returned; +4 Command, +3 Integrity.`,side);}}}});
  const dead=this.sides.map(s=>s.integrity<=0);if(dead[0]||dead[1]){this.result=dead[0]&&dead[1]?'draw':dead[1]?'victory':'defeat';this.record(this.result==='victory'?'Their Stronghold has fallen. Victory.':this.result==='draw'?'Both Strongholds fell. A draw.':'Your Stronghold has fallen.');return;}
  this.aiTimer-=dt;if(this.aiTimer<=0){this.aiTimer=1.9+this.rng()*1.1;this.ai();}
 }
 ai(){const side=1,s=this.sides[side];let lane=Math.floor(this.rng()*3);
  // Reinforce threatened Fronts while allowing pressure on all three.
  if(this.rng()<.65){const counts=[0,1,2].map(l=>this.allies(0,l).length-this.allies(1,l).length);lane=counts.indexOf(Math.max(...counts));}
  const candidates=s.hand.map((key,i)=>({key,i,score:(key==='soldier'||key==='guard'?4:key==='archer'?3:key==='fire'?5:key==='oath'?2:1)+this.rng()*2})).filter(c=>!this.canPlay(side,c.i,lane)).sort((a,b)=>b.score-a.score);
  if(candidates.length)this.play(side,candidates[0].i,lane);
 }
}
