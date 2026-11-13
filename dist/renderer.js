// Dependency-free WebGL renderer. The battlefield and combatants occupy real 3D space.
const C={field:[.19,.235,.20],stone:[.28,.31,.30],dark:[.12,.15,.14],gold:[.75,.61,.33],red:[.63,.27,.24],wood:[.24,.19,.13],steel:[.54,.59,.58],ice:[.47,.73,.85],fire:[1,.40,.08]};
const hex=s=>s.match(/\w\w/g).map(v=>parseInt(v,16)/255);
function tri(a,b,c,color,out){const u=b.map((n,i)=>n-a[i]),v=c.map((n,i)=>n-a[i]);let n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];const l=Math.hypot(...n)||1;n=n.map(x=>x/l);for(const p of [a,b,c])out.push(...p,...n,...color);}
function box(out,x,y,z,w,h,d,c){const p=[[x-w/2,y,z-d/2],[x+w/2,y,z-d/2],[x+w/2,y+h,z-d/2],[x-w/2,y+h,z-d/2],[x-w/2,y,z+d/2],[x+w/2,y,z+d/2],[x+w/2,y+h,z+d/2],[x-w/2,y+h,z+d/2]];for(const q of [[0,3,2,1],[4,5,6,7],[0,4,7,3],[1,2,6,5],[3,7,6,2],[0,1,5,4]]){tri(p[q[0]],p[q[1]],p[q[2]],c,out);tri(p[q[0]],p[q[2]],p[q[3]],c,out);}}
function cylinder(out,x,y,z,r,h,c,top=r,n=7){for(let i=0;i<n;i++){const a=i/n*Math.PI*2,b=(i+1)/n*Math.PI*2;const p=[x+Math.cos(a)*r,y,z+Math.sin(a)*r],q=[x+Math.cos(b)*r,y,z+Math.sin(b)*r],t=[x+Math.cos(a)*top,y+h,z+Math.sin(a)*top],s=[x+Math.cos(b)*top,y+h,z+Math.sin(b)*top];tri(p,t,s,c,out);tri(p,s,q,c,out);tri([x,y+h,z],s,t,c,out);}}
function transform(out,mesh,x,y,z,rot=0,scale=1){const c=Math.cos(rot),s=Math.sin(rot);for(let i=0;i<mesh.length;i+=9){const px=mesh[i]*scale,pz=mesh[i+2]*scale,nx=mesh[i+3],nz=mesh[i+5];out.push(x+px*c+pz*s,y+mesh[i+1]*scale,z-px*s+pz*c,nx*c+nz*s,mesh[i+4],-nx*s+nz*c,mesh[i+6],mesh[i+7],mesh[i+8]);}}
function soldier(type,side){const a=[],cloth=side?C.red:C.gold,plate=side?[.36,.39,.42]:[.45,.49,.48];
 box(a,-.14,0,0,.14,.36,.17,C.dark);box(a,.14,0,0,.14,.36,.17,C.dark);
 cylinder(a,0,.31,0,.26,.46,cloth,.22);box(a,0,.47,-.015,.41,.28,.3,plate);
 cylinder(a,0,.83,0,.19,.28,[.73,.69,.49],.13);cylinder(a,0,.94,0,.22,.18,C.steel,.12);
 // Rooster crest, beak, and dark tail distinguish the lore's avian soldiers.
 box(a,0,1.09,0,.09,.19,.2,side?C.red:[.75,.35,.23]);box(a,.20,.88,.015,.18,.09,.1,[.81,.65,.29]);
 cylinder(a,-.25,.36,-.13,.16,.45,C.dark,.035);
 box(a,.1,.53,.26,.12,.35,.12,plate);box(a,-.1,.55,-.27,.13,.34,.12,plate);
 if(type==='archer'){box(a,.25,.41,.35,.05,.76,.05,C.wood);box(a,.34,.46,.35,.025,.66,.025,C.steel);box(a,-.18,.50,-.32,.28,.38,.18,C.wood);}
 else{box(a,.29,.25,.36,.045,1.35,.045,C.wood);cylinder(a,.29,1.59,.36,.085,.28,C.steel,0,4);box(a,.21,.40,-.34,type==='guard'?.48:.35,type==='guard'?.69:.45,.07,cloth);box(a,.21,.61,-.385,.055,.2,.025,C.steel);}
 return a;
}
function perspective(fov,aspect,near,far){const f=1/Math.tan(fov/2),nf=1/(near-far);return [f/aspect,0,0,0,0,f,0,0,0,0,(far+near)*nf,-1,0,0,2*far*near*nf,0];}
function look(eye,target){const sub=(a,b)=>a.map((x,i)=>x-b[i]),norm=a=>{const n=Math.hypot(...a);return a.map(x=>x/n);},cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dot=(a,b)=>a.reduce((s,n,i)=>s+n*b[i],0);const z=norm(sub(eye,target)),x=norm(cross([0,1,0],z)),y=cross(z,x);return [x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1];}
function multiply(a,b){const r=[];for(let c=0;c<4;c++)for(let i=0;i<4;i++)r[c*4+i]=[0,1,2,3].reduce((s,k)=>s+a[k*4+i]*b[c*4+k],0);return r;}
export class BattlefieldRenderer {
 constructor(canvas,overlay,frontTargets=[]){this.canvas=canvas;this.overlay=overlay;this.frontTargets=frontTargets;this.ctx=overlay.getContext('2d');this.gl=canvas.getContext('webgl',{antialias:true,alpha:false});this.view='tactical';const gl=this.gl;if(!gl){this.software=canvas.getContext('2d');if(!this.software)throw new Error('This browser cannot render the battlefield.');this.cache=document.createElement('canvas');}if(gl){
  const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;};
  const vertex=shader(gl.VERTEX_SHADER,'attribute vec3 aPosition; attribute vec3 aNormal; attribute vec3 aColor; uniform mat4 uMatrix; varying vec3 vColor; varying float vDepth; void main(){ vec3 light=normalize(vec3(-0.5,1.0,0.6)); float diffuse=max(0.0,dot(aNormal,light)); vColor=aColor*(0.46+diffuse*0.62); gl_Position=uMatrix*vec4(aPosition,1.0); vDepth=gl_Position.w;}');
  const fragment=shader(gl.FRAGMENT_SHADER,'precision mediump float; varying vec3 vColor; varying float vDepth; void main(){ float fog=smoothstep(29.0,68.0,vDepth)*0.55; gl_FragColor=vec4(mix(vColor,vec3(0.075,0.11,0.105),fog),1.0);}');
  this.program=gl.createProgram();gl.attachShader(this.program,vertex);gl.attachShader(this.program,fragment);gl.linkProgram(this.program);if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(this.program));gl.useProgram(this.program);this.matrixLoc=gl.getUniformLocation(this.program,'uMatrix');this.attrs=['aPosition','aNormal','aColor'].map(n=>gl.getAttribLocation(this.program,n));this.staticBuffer=gl.createBuffer();this.dynamicBuffer=gl.createBuffer();gl.enable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.clearColor(.055,.082,.075,1);
  }this.models={};for(const type of ['soldier','archer','guard'])for(let side=0;side<2;side++)this.models[type+side]=soldier(type,side);
  const ground=[];box(ground,0,-.8,0,32,.8,18,C.dark);box(ground,0,-.1,0,29,.1,16,C.field);
  for(const z of [-7.2,-2.4,2.4,7.2])box(ground,0,.008,z,27,.012,.07,[.33,.36,.28]);
  for(const x of [-8,0,8])for(const z of [-4.8,0,4.8]){cylinder(ground,x,.005,z,1.25,.012,[.22,.26,.21],1.25,18);}
  this.floorCount=ground.length;for(let side=0;side<2;side++){const x=side?14.5:-14.5,team=side?C.red:C.gold;
   for(const z of [-7.3,-2.4,2.4,7.3]){box(ground,x,0,z,1.6,3.2,1.45,C.stone);box(ground,x,3.2,z,1.95,.3,1.8,C.dark);for(const dz of [-.63,.63])for(const dx of [-.63,.63])box(ground,x+dx,3.5,z+dz,.38,.5,.4,C.stone);box(ground,x+(side?-.86:.86),1,z,.05,1.3,.6,team);}
   for(const z of [-4.8,0,4.8]){box(ground,x,0,z,1.1,1,3.3,C.stone);box(ground,x,1,z,1.2,.23,3.4,C.dark);}
   box(ground,x,3.7,-2.4,.06,2,.06,C.wood);box(ground,x,4.6,-1.95,.05,.85,.85,team);
  }
  for(let i=0;i<28;i++){const x=-18+i*1.4,z=-10-(i%3)*1.2;box(ground,x,0,z,.25,.8,.25,C.wood);cylinder(ground,x,.55,z,.7,2.5,[.12,.19,.15],0,5);}
  for(let i=0;i<9;i++)cylinder(ground,-24+i*6,-1,-19-(i%2)*2,5.4,6+i%3,[.14,.19,.18],0,4);
  this.ground=ground;this.staticCount=ground.length/9;if(gl){gl.bindBuffer(gl.ARRAY_BUFFER,this.staticBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(ground),gl.STATIC_DRAW);}
 }
 project(x,y,z){const a=this.matrix,v=[x,y,z,1],r=[0,0,0,0];for(let i=0;i<4;i++)for(let k=0;k<4;k++)r[i]+=a[k*4+i]*v[k];return [(r[0]/r[3]*.5+.5)*this.width,(-r[1]/r[3]*.5+.5)*this.height];}
 frontCorners(lane){const z=(lane-1)*4.8;return [[-13.5,.04,z-2.4],[13.5,.04,z-2.4],[13.5,.04,z+2.4],[-13.5,.04,z+2.4]].map(p=>this.project(...p));}
 updateFrontTargets(){const stamp=`${this.width}:${this.height}:${this.view}`;if(stamp===this.targetsStamp)return;this.targetsStamp=stamp;for(const target of this.frontTargets){const corners=this.frontCorners(Number(target.dataset.lane));const polygon=`polygon(${corners.map(([x,y])=>`${x/this.width*100}% ${y/this.height*100}%`).join(',')})`;target.style.clipPath=polygon;target.style.webkitClipPath=polygon;}}
 drawBuffer(buffer,count){const gl=this.gl;gl.bindBuffer(gl.ARRAY_BUFFER,buffer);for(let i=0;i<3;i++){gl.enableVertexAttribArray(this.attrs[i]);gl.vertexAttribPointer(this.attrs[i],3,gl.FLOAT,false,36,i*12);}gl.drawArrays(gl.TRIANGLES,0,count);}
 drawSoftware(ctx,vertices){const a=this.matrix,faces=[];for(let i=0;i<vertices.length;i+=27){const points=[];let depth=0;for(let j=0;j<3;j++){const k=i+j*9,x=vertices[k],y=vertices[k+1],z=vertices[k+2],w=a[3]*x+a[7]*y+a[11]*z+a[15];depth+=w;points.push([(a[0]*x+a[4]*y+a[8]*z+a[12])/w*this.width/2+this.width/2,-(a[1]*x+a[5]*y+a[9]*z+a[13])/w*this.height/2+this.height/2]);}const n=vertices[i+3]*-.394+vertices[i+4]*.788+vertices[i+5]*.473,shade=.46+Math.max(0,n)*.62;const color=[6,7,8].map(k=>Math.round(Math.min(255,vertices[i+k]*shade*255)));faces.push({points,depth,color});}faces.sort((a,b)=>b.depth-a.depth);for(const f of faces){ctx.fillStyle=`rgb(${f.color.join(',')})`;ctx.beginPath();ctx.moveTo(...f.points[0]);ctx.lineTo(...f.points[1]);ctx.lineTo(...f.points[2]);ctx.closePath();ctx.fill();}}
 drawFloor(ctx){const poly=(points,color)=>{ctx.fillStyle=color;ctx.beginPath();points.forEach((p,i)=>{const q=this.project(...p);i?ctx.lineTo(...q):ctx.moveTo(...q);});ctx.closePath();ctx.fill();};poly([[-16,-.1,-9],[16,-.1,-9],[16,-.1,9],[-16,-.1,9]],'#202b23');poly([[-16,-.8,9],[16,-.8,9],[16,-.1,9],[-16,-.1,9]],'#131c16');poly([[-14.5,0,-8],[14.5,0,-8],[14.5,0,8],[-14.5,0,8]],'#344030');for(const z of [-7.2,-2.4,2.4,7.2])poly([[-13.5,.01,z-.035],[13.5,.01,z-.035],[13.5,.01,z+.035],[-13.5,.01,z+.035]],'#51583c');for(const x of [-8,0,8])for(const z of [-4.8,0,4.8])poly(Array.from({length:20},(_,i)=>[x+Math.cos(i/20*Math.PI*2)*1.25,.015,z+Math.sin(i/20*Math.PI*2)*1.25]),'#3b4831');}
 render(battle,lane,time){const gl=this.gl,rect=this.canvas.getBoundingClientRect(),w=rect.width,h=rect.height,dpr=Math.min(devicePixelRatio||1,1.5);if(w<1||h<1)return;this.width=w;this.height=h;
  if(this.canvas.width!==Math.round(w*dpr)||this.canvas.height!==Math.round(h*dpr)){this.canvas.width=Math.round(w*dpr);this.canvas.height=Math.round(h*dpr);this.overlay.width=this.canvas.width;this.overlay.height=this.canvas.height;}
  const aspect=w/h,spread=aspect<1.25?1.25/aspect:1;const eye=this.view==='tactical'?[0,25*spread,28*spread]:[2,15*spread,31*spread];this.matrix=multiply(perspective(.77,aspect,.1,120),look(eye,[0,0,-.5]));if(gl){gl.viewport(0,0,this.canvas.width,this.canvas.height);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.uniformMatrix4fv(this.matrixLoc,false,new Float32Array(this.matrix));this.drawBuffer(this.staticBuffer,this.staticCount);}else{const stamp=`${w}:${h}:${this.view}`;if(stamp!==this.cacheStamp){this.cacheStamp=stamp;this.cache.width=this.canvas.width;this.cache.height=this.canvas.height;const c=this.cache.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);c.fillStyle='#101913';c.fillRect(0,0,w,h);this.drawFloor(c);this.drawSoftware(c,this.ground.slice(this.floorCount));}this.software.setTransform(1,0,0,1,0,0);this.software.drawImage(this.cache,0,0);this.software.setTransform(dpr,0,0,dpr,0,0);}
  this.updateFrontTargets();
  const dyn=[],lz=(lane-1)*4.8,lc=[.245,.285,.22],la=[-13,.025,lz-2.325],lb=[-13,.025,lz+2.325],ll=[13,.025,lz+2.325],ld=[13,.025,lz-2.325];tri(la,lb,ll,lc,dyn);tri(la,ll,ld,lc,dyn);
  for(const x of [-12.3,12.3])for(const z of [-6.9,6.9]){cylinder(dyn,x,0,z,.12,1.5,C.wood);cylinder(dyn,x,1.5,z,.2,.48,C.fire,0,5);}
  const t=battle?battle.time:time;
  for(const u of battle?.units??[]){const direction=u.side?Math.PI:0;const count=Math.max(1,Math.ceil(u.hp/u.maxHp*3));
   for(let i=0;i<count;i++){const ox=i===0?.32:-.3,oz=i===0?0:i===1?-.58:.58;const x=u.x+(u.side?-ox:ox),z=u.z+oz;cylinder(dyn,x,.045,z,.35,.012,[.095,.13,.10],.35,8);const bob=Math.sin(t*7+u.id+i)*.035;transform(dyn,this.models[u.type+u.side],x,bob,z,direction+(u.attacking>0?Math.sin(u.attacking*13)*.14:0),1.12);
    if(u.type==='archer'&&battle.sides[u.side].fire)cylinder(dyn,x+.25,1.25+bob,z+.36,.07,.24,C.fire,0,5);
   }
   if(u.shield>0)cylinder(dyn,u.x,.065,u.z,.92,.035,C.ice,.92,16);
   if(u.burn>0)for(let i=0;i<3;i++)cylinder(dyn,u.x+Math.sin(t*9+i)*.26,.3,u.z+Math.cos(i*2)*.28,.1,.5+Math.sin(t*10+i)*.2,C.fire,0,4);
   if(u.slow>0)box(dyn,u.x,.035,u.z,1.25,.035,1.25,[.42,.64,.70]);
  }
  for(const p of battle?.projectiles??[]){const f=1-p.life/p.total,x=p.fromX+(p.toX-p.fromX)*f,z=p.fromZ+(p.toZ-p.fromZ)*f,y=1.2+Math.sin(f*Math.PI)*2.6;box(dyn,x,y,z,.5,.045,.045,p.fire?C.fire:p.frost?C.ice:C.gold);cylinder(dyn,x+(p.side?-.25:.25),y,z,.06,.13,p.fire?C.fire:C.steel,0,4);if(p.fire)cylinder(dyn,x,y-.07,z,.12,.28,C.fire,0,5);}
  for(const e of battle?.effects??[]){if(e.kind==='hit'||e.kind==='fall'){for(let i=0;i<3;i++)box(dyn,e.x+Math.sin(i*2.1+t*3)*(.5-e.life),.4+e.life*2,e.z+Math.cos(i*2.1)*.35,.07,.07,.07,e.kind==='fall'?C.gold:C.fire);}if(e.kind==='signature'||e.kind==='upgrade'){const c=e.leader==='lucy'?C.ice:e.leader==='nezz'?[.55,.36,.72]:C.gold;cylinder(dyn,e.x,.08,e.z,Math.max(.1,(1.5-e.life)*2),.07,c,Math.max(.1,(1.5-e.life)*2),24);}}
  if(gl){gl.bindBuffer(gl.ARRAY_BUFFER,this.dynamicBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(dyn),gl.DYNAMIC_DRAW);this.drawBuffer(this.dynamicBuffer,dyn.length/9);}else this.drawSoftware(this.software,dyn);
  const ctx=this.ctx;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
  const outline=this.frontCorners(lane);ctx.beginPath();outline.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.strokeStyle='#dfc883cc';ctx.lineWidth=1.5;ctx.stroke();
  for(const u of battle?.units??[]){const [x,y]=this.project(u.x,1.95,u.z),width=28;ctx.fillStyle='#101917';ctx.fillRect(x-width/2-1,y-1,width+2,5);ctx.fillStyle=u.side?'#dd8275':'#d5c084';ctx.fillRect(x-width/2,y,width*Math.max(0,u.hp/u.maxHp),3);}
  for(let i=0;i<3;i++){const [x,y]=this.project(0,.2,(i-1)*4.8);ctx.font='10px sans-serif';ctx.textAlign='center';ctx.fillStyle=i===lane?'#e0cf9b99':'#acb2a355';ctx.fillText(['WEST FRONT','CENTER FRONT','EAST FRONT'][i],x,y+15);}
 }
}
