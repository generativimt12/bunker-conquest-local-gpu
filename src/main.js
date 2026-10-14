import * as pc from 'playcanvas';
import './style.css';

const canvas = document.getElementById('application');
const $ = (id) => document.getElementById(id);
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
const V = (x=0,y=0,z=0) => new pc.Vec3(x,y,z);
const C = (r,g,b) => new pc.Color(r,g,b);

let device, app, backend = 'GPU';
try {
  device = await pc.createGraphicsDevice(canvas, {
    deviceTypes: [pc.DEVICETYPE_WEBGPU, pc.DEVICETYPE_WEBGL2],
    antialias: true,
    powerPreference: 'high-performance'
  });
} catch (error) {
  $('intro').innerHTML = '<div class="intro-card"><div class="eyebrow">LOCAL GPU UNAVAILABLE</div><h1>WEBGPU /<br><span>WEBGL 2</span></h1><p>הדפדפן לא הצליח ליצור הקשר גרפי. נסה דפדפן עדכני עם האצת חומרה.</p></div>';
  throw error;
}
backend = device.isWebGPU ? 'WEBGPU' : 'WEBGL 2';
const opts = new pc.AppOptions();
opts.graphicsDevice = device;
opts.componentSystems = [pc.RenderComponentSystem, pc.CameraComponentSystem, pc.LightComponentSystem];
opts.resourceHandlers = [pc.TextureHandler, pc.ContainerHandler];
app = new pc.AppBase(canvas);
app.init(opts);
app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
app.setCanvasResolution(pc.RESOLUTION_AUTO);
app.scene.ambientLight = C(.13,.14,.12);
app.scene.gammaCorrection = pc.GAMMA_SRGB;
app.scene.toneMapping = pc.TONEMAP_ACES || pc.TONEMAP_FILMIC || pc.TONEMAP_LINEAR;
app.scene.exposure = 1.05;
app.scene.fog = 'linear';
app.scene.fogColor = C(.035,.047,.043);
app.scene.fogStart = 14;
app.scene.fogEnd = 34;
app.start();
window.addEventListener('resize', () => app.resizeCanvas());

const texCache = {};
function makeTexture(kind, seed) {
  if (texCache[kind]) return texCache[kind];
  const s = 256, c = document.createElement('canvas'); c.width = c.height = s;
  const x = c.getContext('2d', {willReadFrequently:true});
  let rng = seed >>> 0;
  const rnd = () => { rng = (1664525*rng + 1013904223) >>> 0; return rng / 4294967296; };
  const im = x.createImageData(s,s);
  for (let y=0;y<s;y++) for (let xx=0;xx<s;xx++) {
    const n=(rnd()-.5), wave=Math.sin(xx*.035+Math.sin(y*.025)*2.1)*5+Math.sin(y*.047+xx*.012)*3;
    let r=105+wave+n*26, g=108+wave+n*25, b=101+wave+n*23;
    if(kind==='steel'){r=62+Math.sin(xx*.38)*6+n*20;g=73+Math.sin(xx*.38)*5+n*19;b=72+n*18;}
    if(kind==='floor'){r=47+wave+n*29;g=52+wave+n*26;b=50+wave+n*24;}
    if(kind==='olive'){r=59+wave+n*22;g=71+wave+n*21;b=55+wave+n*18;}
    if(kind==='fabric'){r=75+wave+n*24;g=78+wave+n*22;b=58+wave+n*20;}
    if(kind==='dark'){r=24+n*14;g=29+n*14;b=27+n*13;}
    if(kind==='screen'){r=7+n*4;g=24+n*7;b=17+n*5;}
    const i=(y*s+xx)*4; im.data[i]=clamp(r,0,255);im.data[i+1]=clamp(g,0,255);im.data[i+2]=clamp(b,0,255);im.data[i+3]=255;
  }
  x.putImageData(im,0,0);
  if(kind==='concrete'||kind==='steel'||kind==='floor') {
    for(let i=0;i<190;i++){x.fillStyle='rgba('+(rnd()>.5?'10,16,13':'210,205,185')+','+(.025+rnd()*.11)+')';x.beginPath();x.ellipse(rnd()*s,rnd()*s,1+rnd()*6,1+rnd()*3,rnd()*3.14,0,Math.PI*2);x.fill();}
  }
  if(kind==='steel') { for(let i=0;i<90;i++){x.strokeStyle='rgba(210,218,205,'+(.04+rnd()*.25)+')';x.lineWidth=.4+rnd()*1.5;x.beginPath();const a=rnd()*s,b=rnd()*s;x.moveTo(a,b);x.lineTo(a+(rnd()-.5)*5,b+5+rnd()*45);x.stroke();} }
  if(kind==='screen'){x.fillStyle='#102a22';x.fillRect(0,0,s,s);x.strokeStyle='rgba(102,220,144,.25)';for(let i=12;i<s;i+=18){x.beginPath();x.moveTo(i,0);x.lineTo(i,s);x.moveTo(0,i);x.lineTo(s,i);x.stroke();}x.fillStyle='#8ce5ad';x.fillRect(20,24,122,6);x.fillRect(20,39,175,3);x.fillRect(20,50,145,3);x.strokeRect(20,76,210,108);}
  const t = new pc.Texture(device,{width:s,height:s,format:pc.PIXELFORMAT_R8_G8_B8_A8,mipmaps:true});
  t.setSource(c);t.srgb=true;t.addressU=pc.ADDRESS_REPEAT;t.addressV=pc.ADDRESS_REPEAT;t.minFilter=pc.FILTER_LINEAR_MIPMAP_LINEAR;t.magFilter=pc.FILTER_LINEAR;t.anisotropy=4;texCache[kind]=t;return t;
}
function mat(kind, color, metal, gloss, emissive) {
  const m=new pc.StandardMaterial();m.diffuse=C(color[0],color[1],color[2]);m.useMetalness=true;m.metalness=metal;m.gloss=gloss;
  if(kind)m.diffuseMap=makeTexture(kind,kind.length*313+17);
  if(emissive){m.emissive=C(emissive[0],emissive[1],emissive[2]);m.emissiveIntensity=emissive[3]||1;}
  m.update();return m;
}
const M={
  concrete:mat('concrete',[.82,.83,.77],.02,.08),
  steel:mat('steel',[.87,.9,.86],.78,.55),
  floor:mat('floor',[.72,.76,.71],.14,.26),
  olive:mat('olive',[.8,.82,.69],.14,.22),
  fabric:mat('fabric',[.85,.82,.68],0,.08),
  dark:mat('dark',[.42,.47,.43],.22,.18),
  black:mat('dark',[.16,.19,.18],.36,.35),
  skin:mat(null,[.57,.34,.23],0,.15),
  screen:mat('screen',[.52,1,.7],.2,.4,[.1,.9,.36,2.3]),
  bulb:mat(null,[1,.83,.51],.08,.7,[1,.62,.23,5]),
  spark:mat(null,[1,.43,.09],0,.2,[1,.24,.02,4]),
  blood:mat(null,[.28,.012,.006],0,.25),
  smoke:mat(null,[.2,.23,.21],0,.02),
  flame:mat(null,[1,.19,.025],0,.2,[1,.08,.005,3])
};
function part(name,type,pos,scale,material,parent,angles) {
  const e=new pc.Entity(name);e.addComponent('render',{type:type,castShadows:true,receiveShadows:true});e.render.material=material;
  (parent||app.root).addChild(e);e.setLocalPosition(pos[0],pos[1],pos[2]);e.setLocalScale(scale[0],scale[1],scale[2]);
  if(angles)e.setLocalEulerAngles(angles[0],angles[1],angles[2]);return e;
}
function box(n,p,s,m,parent,angles){return part(n,'box',p,s,m,parent,angles);}
function cylinder(n,p,s,m,parent,angles){return part(n,'cylinder',p,s,m,parent,angles);}
function sphere(n,p,s,m,parent){return part(n,'sphere',p,s,m,parent);}
function pointLight(name,pos,color,intensity,range,parent) {
  const e=new pc.Entity(name);e.addComponent('light',{type:'omni',color:C(color[0],color[1],color[2]),intensity:intensity,range:range,castShadows:false});
  (parent||app.root).addChild(e);e.setPosition(pos[0],pos[1],pos[2]);return e;
}
const sun=new pc.Entity('warm industrial key');sun.addComponent('light',{type:'directional',color:C(.72,.76,.68),intensity:1.15,castShadows:true,shadowResolution:2048,normalOffsetBias:.04});app.root.addChild(sun);sun.setEulerAngles(42,28,0);
const cameraEntity=new pc.Entity('first person camera');cameraEntity.addComponent('camera',{clearColor:C(.025,.035,.034),fov:73,nearClip:.07,farClip:65});app.root.addChild(cameraEntity);
const camera=cameraEntity.camera;

box('floor slab',[0,-.24,-5],[8.6,.48,33],M.floor);
box('ceiling slab',[0,4.45,-5],[8.6,.45,33],M.concrete);
box('left wall',[-4.22,2.1,-5],[.48,4.3,33],M.concrete);
box('right wall',[4.22,2.1,-5],[.48,4.3,33],M.concrete);
box('far wall',[0,2.1,-21.2],[8.8,4.3,.5],M.concrete);
for(let z=9;z>-20;z-=3) {
  box('reinforced rib L',[-3.82,2.15,z],[.22,4.05,.26],M.steel);
  box('reinforced rib R',[3.82,2.15,z],[.22,4.05,.26],M.steel);
  box('reinforced rib top',[0,4.12,z],[7.65,.18,.26],M.steel);
  box('wall seam L',[-3.965,2.1,z-1.3],[.028,3.7,.035],M.dark);
  box('wall seam R',[3.965,2.1,z-1.3],[.028,3.7,.035],M.dark);
}
for(let x of [-2.8,-2.3,2.3,2.8]) {
  cylinder('overhead conduit',[x,4.1,-5],[.055,.055,28],M.steel);
  cylinder('cable run',[x+.16,4.02,-5],[.02,.02,28],M.dark);
}
for(let z of [6,0,-6,-12,-18]) {
  box('ceiling lamp housing',[0,4.12,z],[1.24,.13,1.65],M.black);
  box('diffuser',[0,4.035,z],[.82,.018,1.16],M.bulb);
}
const lamps=[pointLight('lamp 1',[0,3.8,6],[1,.73,.42],3.0,11),pointLight('lamp 2',[0,3.8,-1],[1,.73,.42],2.6,10),pointLight('lamp 3',[0,3.8,-9],[1,.73,.42],2.8,10),pointLight('lamp 4',[0,3.8,-16],[1,.73,.42],2.3,9)];
// Floor grating, damp marks, wall service pipes and visible hardware.
for(let z=8;z>-20;z-=1.2){box('floor plate seam',[0,.012,z],[3.15,.025,.026],M.steel);box('drain slot',[-.18,.018,z-.58],[.11,.035,.78],M.black);}
for(let side of [-1,1]) {
  box('utility trunk',[side*3.67,3.35,-5],[.14,.16,28],M.olive);
  cylinder('fire pipe',[side*3.47,3.55,-5],[.072,.072,28],M.steel);
  cylinder('return pipe',[side*3.32,3.37,-5],[.036,.036,28],M.dark);
}
function makeCrate(x,y,z,s=1) {
  box('military crate',[x,y,z],[.86*s,.75*s,.83*s],M.olive);
  box('crate lid',[x,y+.39*s,z],[.9*s,.06*s,.87*s],M.steel);
  for(let dx of [-.29,.29]){box('crate strap',[x+dx*s,y,z+.423*s],[.06*s,.68*s,.027],M.black);box('crate latch',[x+dx*s,y+.12*s,z+.45*s],[.11*s,.06*s,.035],M.steel);}
  for(let dx of [-.31,.31])for(let dz of [-.31,.31])cylinder('crate bolt',[x+dx*s,y+.43*s,z+dz*s],[.026*s,.026*s,.02],M.steel);
}
makeCrate(-2.6,.43,3.5,1.05);makeCrate(-2.6,1.18,3.5,.78);makeCrate(2.7,.4,-1.4,1.0);makeCrate(2.7,.4,-2.35,.82);makeCrate(2.65,.4,-8.5,1.05);
for(let i=0;i<3;i++){for(let j=0;j<3;j++){const x=-3.15+i*.45,z=-4.8+j*.35;const bag=sphere('sandbag',[x,.32,z],[.48,.25,.27],M.fabric);bag.setLocalEulerAngles(0,12*(i%2),0);}}
const panel=box('electrical cabinet',[3.83,1.62,-7.6],[.22,1.35,1.05],M.steel);
box('cabinet dark face',[3.69,1.63,-7.6],[.035,1.12,.86],M.black);
box('cabinet live screen',[3.665,1.91,-7.47],[.025,.28,.43],M.screen);
for(let y of [1.26,1.39,1.52]){cylinder('breaker handle',[3.64,y,-7.78],[.065,.045,.045],M.bulb,[app.root]);}
for(let side of [-1,1])for(let y of [1.12,2.12])cylinder('cabinet bolts',[3.64,y,-7.98+side*.32],[.025,.025,.025],M.brass);
const cabinetLight=pointLight('cabinet power glow',[3.55,1.7,-7.6],[.16,1,.42],1.7,4);
const lampAt=[{p:V(0,3.86,-1),light:lamps[1],bulb:null,alive:true},{p:V(0,3.86,-9),light:lamps[2],bulb:null,alive:true}];
lampAt[0].bulb=box('destructible diffuser A',[0,4.035,-1],[.82,.018,1.16],M.bulb);
lampAt[1].bulb=box('destructible diffuser B',[0,4.035,-9],[.82,.018,1.16],M.bulb);
const relay=box('security relay',[0,1.05,-19.75],[1.2,1.75,.48],M.black);
box('relay display',[0,1.35,-19.48],[.78,.36,.025],M.screen);
for(let x of [-.4,-.2,0,.2,.4])box('relay button',[x,.85,-19.46],[.08,.07,.025],M.steel);
pointLight('relay green indicator',[0,1.45,-19.22],[.12,1,.38],.65,3);

const enemyRoot=new pc.Entity('hostile sentry');app.root.addChild(enemyRoot);enemyRoot.setPosition(.8,0,-12.3);
const eBody=box('armor and torso',[0,1.08,0],[.58,.72,.31],M.olive,enemyRoot);
box('plate carrier',[0,1.12,-.17],[.43,.45,.065],M.black,enemyRoot);
box('armor plates',[0,1.19,-.21],[.3,.28,.025],M.steel,enemyRoot);
sphere('human head',[0,1.7,-.01],[.22,.27,.22],M.skin,enemyRoot);
box('helmet',[0,1.89,-.01],[.46,.19,.42],M.olive,enemyRoot);
box('helmet rim',[0,1.81,-.11],[.48,.045,.44],M.black,enemyRoot);
box('eye shadow',[0,1.68,-.205],[.31,.07,.025],M.black,enemyRoot);
sphere('left eye',[-.07,1.69,-.222],[.025,.022,.012],M.bulb,enemyRoot);
sphere('right eye',[.07,1.69,-.222],[.025,.022,.012],M.bulb,enemyRoot);
const eArms=[],eLegs=[];
for(let side of [-1,1]) {
  const arm=box('sleeved arm',[side*.4,1.11,-.01],[.19,.56,.2],M.fabric,enemyRoot,[0,0,side*9]);eArms.push(arm);
  sphere('glove',[side*.42,.82,-.1],[.12,.13,.12],M.black,enemyRoot);
  const leg=box('combat trouser',[side*.16,.47,.01],[.22,.63,.25],M.olive,enemyRoot);eLegs.push(leg);
  box('boot',[side*.16,.12,-.07],[.25,.17,.37],M.black,enemyRoot);
}
const enemyGun=box('enemy rifle',[.27,1.0,-.36],[.13,.13,.75],M.black,enemyRoot,[7,0,-5]);
box('rifle magazine',[.25,.83,-.24],[.09,.24,.15],M.steel,enemyRoot);
const enemyMuzzle=pointLight('enemy muzzle flash',[.8,1.2,-13],[1,.4,.12],0,3);

const playerGun=box('first person rifle',[.34,-.29,-.63],[.19,.16,.55],M.black,cameraEntity,[0,0,-3]);
box('rifle handguard',[.34,-.28,-.48],[.23,.15,.34],M.olive,cameraEntity);
box('rifle receiver',[.34,-.24,-.36],[.22,.2,.25],M.steel,cameraEntity);
cylinder('rifle barrel',[.34,-.24,-.91],[.047,.047,.48],M.black,cameraEntity,[90,0,0]);
box('rifle optic',[.34,-.13,-.38],[.13,.095,.13],M.black,cameraEntity);
box('rifle magazine',[.34,-.41,-.28],[.12,.21,.12],M.olive,cameraEntity);
const muzzle=pointLight('player muzzle flash',[0,0,0],[1,.46,.12],0,4,cameraEntity);
const particles=[];
function particle(pos,vel,life,size,kind,gravity) {
  const material=kind==='smoke'?M.smoke:kind==='blood'?M.blood:kind==='flame'?M.flame:M.spark;
  const e=sphere('particle',[pos.x,pos.y,pos.z],[size,size,size],material);particles.push({e,p:pos.clone(),v:vel.clone(),age:0,life:life,size:size,kind:kind,gravity:gravity===undefined?4:gravity});
}
function burst(pos,count,kind,size) {
  for(let i=0;i<count;i++){const vel=V((Math.random()-.5)*2.8,Math.random()*2.8+.15,(Math.random()-.5)*2.8);particle(pos,vel,.3+Math.random()*.75,size*(.45+Math.random()),kind,kind==='smoke'?-.12:8);}
}
const state={x:0,y:0,z:8,yaw:0,pitch:-.03,vy:0,grounded:true,hp:100,mag:30,reserve:120,weapon:0,reloadEnd:0,shooting:false,lastShot:0,flashUntil:0,score:0};
const specs=[{name:'AR-09 / SERVICE RIFLE',mag:30,reserve:120,rate:125,damage:34,reload:1.35,mode:'FULL AUTO · 5.56 × 45'},{name:'M12 / COMPACT SMG',mag:36,reserve:144,rate:78,damage:22,reload:1.2,mode:'HIGH CYCLIC · 9 × 19'},{name:'M40 / MARKSMAN',mag:8,reserve:40,rate:480,damage:82,reload:1.8,mode:'SEMI AUTO · 7.62 × 51'}];
let enemyAlive=true,enemyHp=100,enemyCooldown=1.1,enemyWalk=0,enemyFall=0,started=false,finished=false,runHeld=false,stick={x:0,y:0},stickId=null,lookId=null,lookPrev=null,toastUntil=0,hitUntil=0,audio;
function soundShot() {
  try{if(!audio)audio=new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type='sawtooth';o.frequency.setValueAtTime(125,audio.currentTime);o.frequency.exponentialRampToValueAtTime(43,audio.currentTime+.11);g.gain.setValueAtTime(.07,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.13);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+.14);}catch(_){}
}
function toast(text){$('toast').textContent=text;$('toast').classList.add('show');toastUntil=performance.now()+1600;}
function forward(){const cp=Math.cos(state.pitch);return V(Math.sin(state.yaw)*cp,Math.sin(state.pitch),-Math.cos(state.yaw)*cp);}
function eye(){return V(state.x,1.62+state.y,state.z);}
function distance(a,b){return a.distance(b);}
function hurt(amount){if(finished)return;state.hp=Math.max(0,state.hp-amount);$('damage').style.opacity='.85';setTimeout(()=>$('damage').style.opacity='0',150);if(state.hp<=0)endGame(false);}
function rayNear(target,radius,maxDistance) {
  const origin=eye(),dir=forward(),delta=target.clone().sub(origin),t=delta.dot(dir);
  if(t<.12||t>maxDistance)return null;
  const nearest=origin.add(dir.scale(t));const d=distance(nearest,target);
  return d<radius?{t:t,d:d}:null;
}
function killEnemy(){if(!enemyAlive)return;enemyAlive=false;enemyHp=0;enemyRoot.setEulerAngles(0,enemyRoot.getEulerAngles().y,0);state.score+=350;$('threat').textContent='CLEARED';$('threat').style.color='#a9d4ad';$('objective').textContent='השומר נוטרל. התקדם למסוף האבטחה.';toast('SENTRY NEUTRALIZED');burst(V(enemyRoot.getPosition().x,1.1,enemyRoot.getPosition().z),9,'blood',.09);burst(V(enemyRoot.getPosition().x,1.4,enemyRoot.getPosition().z),12,'smoke',.08);}
function explodeCabinet(){cabinetDead=true;cabinetLight.enabled=false;lamps[1].enabled=false;state.score+=75;toast('POWER CABINET — ARC FLASH');burst(V(3.48,1.65,-7.6),40,'spark',.075);burst(V(3.48,1.65,-7.6),14,'smoke',.14);pointLight('arc flash',[3.3,1.7,-7.6],[.1,.85,1],7,10);setTimeout(()=>{if(distance(eye(),V(3.5,1.65,-7.6))<4)hurt(18);},90);if(state.x>1.4&&state.z<-5&&state.z>-11)hurt(14);}
let cabinetDead=false;
function igniteLamp(lamp,index){if(!lamp.alive)return;lamp.alive=false;lamp.light.enabled=false;lamp.bulb.render.material=M.dark;toast('LAMP CIRCUIT FAILED');burst(lamp.p,18,'spark',.045);burst(lamp.p,11,'smoke',.075);const glow=pointLight('small electrical fire',[lamp.p.x,lamp.p.y-.22,lamp.p.z],[1,.19,.035],1.8,3);setTimeout(()=>{glow.enabled=false;},8000);for(let i=0;i<9;i++)particle(lamp.p.clone().add(V((Math.random()-.5)*.25,-.15, (Math.random()-.5)*.25)),V((Math.random()-.5)*.25,.45+Math.random()*.55,(Math.random()-.5)*.25),1.2,.055,'flame',-.2);}
function shoot() {
  const now=performance.now();if(!started||finished||now-state.lastShot<specs[state.weapon].rate||now<state.reloadEnd)return;
  state.lastShot=now;if(state.mag<=0){reload();return;}state.mag--;state.flashUntil=now+72;muzzle.enabled=true;muzzle.light.intensity=5;playerGun.setLocalPosition(.34,-.29,-.68);soundShot();
  const o=eye(),d=forward();for(let i=0;i<5;i++)particle(o.clone().add(d.clone().scale(1)),d.clone().scale(8).add(V((Math.random()-.5)*1.8,Math.random()*.8,(Math.random()-.5)*1.8)),.12,.025,'spark',0);
  const targets=[];
  if(enemyAlive){const ep=enemyRoot.getPosition();for(const [p,r,zone] of [[V(ep.x,1.3,ep.z-.08),.52,'body'],[V(ep.x,1.72,ep.z-.03),.28,'head']]){const hit=rayNear(p,r,30);if(hit)targets.push({t:hit.t,kind:'enemy',zone:zone});}}
  const cab=rayNear(V(3.66,1.62,-7.6),.8,30);if(cab&&!cabinetDead)targets.push({t:cab.t,kind:'cabinet'});
  lampAt.forEach((l,i)=>{const h=rayNear(l.p,.9,30);if(h&&l.alive)targets.push({t:h.t,kind:'lamp',index:i});});
  targets.sort((a,b)=>a.t-b.t);
  if(targets.length){const t=targets[0];if(t.kind==='enemy'){enemyHp-=t.zone==='head'?specs[state.weapon].damage*1.8:specs[state.weapon].damage;state.score+=t.zone==='head'?25:10;$('hitmarker').style.opacity='1';hitUntil=now+130;if(enemyHp<=0)killEnemy();else{enemyRoot.setLocalPosition(enemyRoot.getLocalPosition().x,.025,enemyRoot.getLocalPosition().z);setTimeout(()=>{if(enemyAlive)enemyRoot.setLocalPosition(enemyRoot.getLocalPosition().x,0,enemyRoot.getLocalPosition().z);},110);burst(V(enemyRoot.getPosition().x,1.25,enemyRoot.getPosition().z),5,'blood',.035);}}
    else if(t.kind==='cabinet')explodeCabinet();else if(t.kind==='lamp')igniteLamp(lampAt[t.index],t.index);
  }
  $('ammo').textContent=state.mag;
}
function reload(){if(state.reloadEnd>performance.now()||state.mag>=specs[state.weapon].mag||state.reserve<=0)return;state.reloadEnd=performance.now()+specs[state.weapon].reload*1000;toast('RELOADING');}
function switchWeapon(){state.weapon=(state.weapon+1)%specs.length;state.mag=Math.min(specs[state.weapon].mag,state.mag===0?specs[state.weapon].mag:state.mag);state.reserve=specs[state.weapon].reserve;$('wname').textContent=specs[state.weapon].name;$('wmode').textContent=specs[state.weapon].mode;$('ammo').textContent=state.mag;$('reserve').textContent='/ '+state.reserve;toast('WEAPON SELECTED');}
function interact(){if(enemyAlive){toast('NEUTRALIZE THE SENTRY FIRST');return;}if(distance(V(state.x,0,state.z),V(0,0,-19.5))<3.5){state.score+=1000;endGame(true);}else toast('MOVE CLOSER TO THE RELAY');}
function endGame(success){finished=true;$('finish').style.display='flex';$('finishTitle').textContent=success?'RELAY SECURED':'OPERATOR DOWN';$('finishText').textContent=success?'Sector 04 secured. Score: '+state.score:'The sentry won this engagement. Score: '+state.score;}
function restart(){location.reload();}
const keys={};
function collides(x,z){if(x<-3.55||x>3.55||z>9.35||z<-20.2)return true;const blocks=[[-2.6,3.5,.95,.98],[2.7,-1.4,.95,.95],[2.7,-2.35,.8,.8],[2.65,-8.5,1,1]];return blocks.some(b=>Math.abs(x-b[0])<b[2]/2+.28&&Math.abs(z-b[1])<b[3]/2+.28);}
let bob=0;
function updatePlayer(dt){const kf=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0),ks=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0);let f=kf-stick.y,s=ks+stick.x;const m=Math.hypot(f,s);if(m>1){f/=m;s/=m;}const moving=m>.05,fast=runHeld||keys.ShiftLeft||keys.ShiftRight,speed=fast?5.2:3.15;const dx=(Math.sin(state.yaw)*f+Math.cos(state.yaw)*s)*speed*dt,dz=(-Math.cos(state.yaw)*f+Math.sin(state.yaw)*s)*speed*dt;if(!collides(state.x+dx,state.z))state.x+=dx;if(!collides(state.x,state.z+dz))state.z+=dz;state.vy-=9.8*dt;state.y+=state.vy*dt;if(state.y<=0){state.y=0;state.vy=0;state.grounded=true;}bob+=dt*(moving?(fast?13:9):2);cameraEntity.setPosition(state.x,1.62+state.y+(moving?Math.abs(Math.sin(bob))*.025:0),state.z);cameraEntity.setEulerAngles(state.pitch*180/Math.PI,state.yaw*180/Math.PI,0);playerGun.setLocalPosition(.34,-.29-(nowMs()<state.flashUntil?.035:0),-.63+(nowMs()<state.flashUntil?.06:0));playerGun.setLocalEulerAngles(moving?Math.sin(bob)*1.6:0,0,-3+(moving?Math.sin(bob)*.8:0));}
function nowMs(){return performance.now();}
function updateEnemy(dt){if(!enemyAlive){enemyFall=Math.min(1,enemyFall+dt*1.8);enemyRoot.setEulerAngles(0,enemyRoot.getEulerAngles().y,88*enemyFall);enemyRoot.setPosition(enemyRoot.getPosition().x,0-.15*enemyFall,enemyRoot.getPosition().z);return;}enemyWalk+=dt;const ep=enemyRoot.getPosition(),dx=state.x-ep.x,dz=state.z-ep.z,dist=Math.hypot(dx,dz);const desired=Math.atan2(-dx,-dz)*180/Math.PI,cur=enemyRoot.getEulerAngles();let diff=((desired-cur.y+540)%360)-180;enemyRoot.setEulerAngles(0,cur.y+clamp(diff,-95*dt,95*dt),0);eLegs.forEach((e,i)=>e.setLocalEulerAngles(Math.sin(enemyWalk*7+i*Math.PI)*10,0,0));eArms.forEach((e,i)=>e.setLocalEulerAngles(0,0,(i?1:-1)*(-6+Math.sin(enemyWalk*4)*2)));if(dist<14&&dist>4.7&&Math.abs(diff)<40){const nx=ep.x+dx/dist*.36*dt,nz=ep.z+dz/dist*.36*dt;if(!collides(nx,ep.z))enemyRoot.setPosition(nx,0,ep.z);if(!collides(enemyRoot.getPosition().x,nz))enemyRoot.setPosition(enemyRoot.getPosition().x,0,nz);}enemyCooldown-=dt;if(dist<16&&enemyCooldown<=0&&Math.abs(diff)<32){enemyCooldown=1.35+Math.random()*.8;enemyMuzzle.enabled=true;enemyMuzzle.light.intensity=4;setTimeout(()=>{enemyMuzzle.enabled=false;enemyMuzzle.light.intensity=0;},65);if(Math.random()>.34)hurt(5+Math.round(Math.random()*7));burst(V(ep.x,1.2,ep.z-.6),3,'spark',.022);}}
function updateParticles(dt){for(let i=particles.length-1;i>=0;i--){const q=particles[i];q.age+=dt;if(q.age>=q.life){q.e.destroy();particles.splice(i,1);continue;}q.v.y-=q.gravity*dt;q.p.add(q.v.clone().scale(dt));if(q.p.y<.025){q.p.y=.025;q.v.y=Math.abs(q.v.y)*.22;q.v.x*=.62;q.v.z*=.62;}q.e.setPosition(q.p);const k=1-q.age/q.life;const growth=q.kind==='smoke'?1+q.age*1.7:Math.max(.08,k);q.e.setLocalScale(q.size*growth,q.size*growth,q.size*growth);}}
function updateHud(){const s=specs[state.weapon];$('ammo').textContent=state.mag;$('reserve').textContent='/ '+state.reserve;$('hp').innerHTML=state.hp+'<small>%</small>';$('hpbar').style.width=state.hp+'%';$('usePrompt').style.display=distance(V(state.x,0,state.z),V(0,0,-19.5))<3.4?'block':'none';$('usePrompt').textContent=enemyAlive?'[ E ] מסוף נעול — נטרל את השומר':'[ E ] אבטח את הממסר';if(performance.now()>toastUntil)$('toast').classList.remove('show');if(performance.now()>hitUntil)$('hitmarker').style.opacity='0';if(performance.now()>state.flashUntil){muzzle.enabled=false;muzzle.light.intensity=0;}}
app.on('update',(dt)=>{if(!started||finished)return;dt=Math.min(dt,.04);updatePlayer(dt);updateEnemy(dt);updateParticles(dt);if(state.shooting)shoot();if(state.reloadEnd&&performance.now()>=state.reloadEnd){const s=specs[state.weapon],amount=Math.min(s.mag-state.mag,state.reserve);state.mag+=amount;state.reserve-=amount;state.reloadEnd=0;toast('RELOAD COMPLETE');}updateHud();});

// Keyboard + mouse controls
window.addEventListener('keydown',(e)=>{keys[e.code]=true;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(e.repeat)return;if(e.code==='KeyR')reload();if(e.code==='KeyE')interact();if(e.code==='KeyQ')switchWeapon();if(e.code==='Space'&&state.grounded){state.vy=4.8;state.grounded=false;}});
window.addEventListener('keyup',(e)=>{keys[e.code]=false;});
canvas.addEventListener('click',()=>{if(started&&matchMedia('(pointer:fine)').matches&&canvas.requestPointerLock){try{canvas.requestPointerLock();}catch(_){}}});
document.addEventListener('mousemove',(e)=>{if(document.pointerLockElement===canvas&&started){state.yaw-=e.movementX*.0022;state.pitch=clamp(state.pitch-e.movementY*.002,-1.15,1.15);}});
canvas.addEventListener('pointerdown',(e)=>{if(e.pointerType==='mouse'&&e.button===0){state.shooting=true;shoot();}});window.addEventListener('pointerup',()=>state.shooting=false);
const stickEl=$('stick'),nub=$('nub'),lookZone=$('lookZone');
stickEl.addEventListener('pointerdown',(e)=>{e.preventDefault();stickId=e.pointerId;stickEl.setPointerCapture(e.pointerId);moveStick(e);});
stickEl.addEventListener('pointermove',(e)=>{if(e.pointerId===stickId)moveStick(e);});
function moveStick(e){const r=stickEl.getBoundingClientRect(),x=clamp((e.clientX-(r.left+r.width/2))/(r.width*.38),-1,1),y=clamp((e.clientY-(r.top+r.height/2))/(r.height*.38),-1,1),m=Math.hypot(x,y);stick={x:m>1?x/m:x,y:m>1?y/m:y};nub.style.transform='translate('+(stick.x*25)+'px,'+(stick.y*25)+'px)';}
function releaseStick(){stickId=null;stick={x:0,y:0};nub.style.transform='translate(0,0)';}
stickEl.addEventListener('pointerup',releaseStick);stickEl.addEventListener('pointercancel',releaseStick);
lookZone.addEventListener('pointerdown',(e)=>{if(!started)return;lookId=e.pointerId;lookPrev={x:e.clientX,y:e.clientY};lookZone.setPointerCapture(e.pointerId);});
lookZone.addEventListener('pointermove',(e)=>{if(e.pointerId!==lookId||!lookPrev)return;state.yaw-=(e.clientX-lookPrev.x)*.004;state.pitch=clamp(state.pitch-(e.clientY-lookPrev.y)*.0035,-1.15,1.15);lookPrev={x:e.clientX,y:e.clientY};});
lookZone.addEventListener('pointerup',()=>{lookId=null;lookPrev=null;});lookZone.addEventListener('pointercancel',()=>{lookId=null;lookPrev=null;});
$('fireBtn').addEventListener('pointerdown',(e)=>{e.preventDefault();state.shooting=true;shoot();});$('fireBtn').addEventListener('pointerup',()=>state.shooting=false);$('fireBtn').addEventListener('pointercancel',()=>state.shooting=false);
$('reloadBtn').addEventListener('pointerdown',(e)=>{e.preventDefault();reload();});$('useBtn').addEventListener('pointerdown',(e)=>{e.preventDefault();interact();});$('runBtn').addEventListener('pointerdown',()=>runHeld=true);$('runBtn').addEventListener('pointerup',()=>runHeld=false);$('runBtn').addEventListener('pointercancel',()=>runHeld=false);$('jumpBtn').addEventListener('pointerdown',()=>{if(state.grounded){state.vy=4.8;state.grounded=false;}});$('switchBtn').addEventListener('pointerdown',(e)=>{e.preventDefault();switchWeapon();});
$('deploy').addEventListener('click',()=>{started=true;$('intro').classList.add('hidden');try{if(audio)audio.resume();else{audio=new (window.AudioContext||window.webkitAudioContext)();}}catch(_){}if(matchMedia('(pointer:fine)').matches&&canvas.requestPointerLock){try{canvas.requestPointerLock();}catch(_){}}toast('RENDERER: '+backend);});
$('again').addEventListener('click',restart);
console.info('[Bunker Conquest] local GPU renderer: '+backend+'; generated textures; no remote model or texture assets.');
