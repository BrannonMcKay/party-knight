import {createStoryRig} from './beverly-story-rig.js';
import {world,LEVELS} from './beverly-layout.js';
import {makePartyWander} from './beverly-party-crowd.js';
import {say} from './stickman-behavior.js';
import {createGuestApproach} from './beverly-guest-approach.js';
import {Font} from '../vendor/FontLoader.js';
import fontData from '../vendor/beverly-font.js';

export const EMILY_LINE='Have you seen Alex?  He is interacting with fictitious entities instead of me.';
export const EMILY={id:'emily',name:'Emily',u:674,v:716,y:LEVELS.house,firstSpeech:6,speechSeconds:10,quietSeconds:16,speed:.52};
// West corner of the upper landing and adjacent entrance gallery. This loop
// stays beside the stairs: it never crosses the descending treads or doorways.
export const EMILY_WANDER=[[674,716],[681,695],[675,670],[695,652],[706,674],[691,696]];

export function buildEmily(T,root,groups,materials){
 const group=new T.Group();group.name='Emily_guest';group.userData.dynamic=true;root.add(group);groups.Emily_guest=group;
 const actor=new T.Group();actor.name=EMILY.name;group.add(actor);
 actor.userData={id:EMILY.id,role:'main story character searching for Alex',hostile:false,playerControlled:false,
  reference:'Diana Silvers as Emily in the user-supplied party still and Billy Knight bus photograph',
  appearance:'Taller than Alex, lanky, long dark wavy hair, pale ice-blue satin slip dress with thin straps and a side slit, bare arms and legs, dark party shoes, concerned face',
  location:'Inside the house, west corner above the shallow steps into the lower wooden room',
  movement:'Slow wandering and searching pauses on the upper landing and adjoining gallery',dialogue:[EMILY_LINE]};
 const mat=(name,color,extra={})=>materials[name]=new T.MeshStandardMaterial({name,color,roughness:.83,...extra});
 const skin=mat('Emily warm fair skin',0xd4ab94),crease=mat('Emily face contours',0xb08473),lip=mat('Emily muted rose lips',0xa76565);
 const satin=new T.MeshPhysicalMaterial({name:'Emily ice-blue satin',color:0xb7d1e1,roughness:.32,metalness:.08,sheen:.75,sheenColor:0xe2efff,sheenRoughness:.4,clearcoat:.15,side:T.DoubleSide});materials[satin.name]=satin;
 const satinEdge=mat('Emily satin seams',0xbdd5e3,{roughness:.4}),shoesMat=mat('Emily dark party shoes',0x252229,{roughness:.38});
 const hair=mat('Emily dark brown waves',0x2d2224),hairLight=mat('Emily chestnut hair strands',0x543a36),ink=mat('Emily dark features',0x34282b);
 const white=mat('Emily eye whites',0xf2e4d9),iris=mat('Emily brown eyes',0x66503a),gold=mat('Emily small gold earrings',0xb99b67,{metalness:.55,roughness:.35});
 const sphere=new T.SphereGeometry(1,16,12),rod=new T.CylinderGeometry(1,1,1,10),cube=new T.BoxGeometry(1,1,1),up=new T.Vector3(0,1,0);
 function mesh(parent,name,geometry,m,p=[0,0,0],scale=[1,1,1]){const o=new T.Mesh(geometry,m);o.name=name;o.position.set(...p);o.scale.set(...scale);o.castShadow=o.receiveShadow=true;parent.add(o);return o;}
 const ball=(g,n,p,scale,m)=>mesh(g,n,sphere,m,p,scale),box=(g,n,p,scale,m)=>mesh(g,n,cube,m,p,scale);
 function part(parent,name,p=[0,0,0]){const g=new T.Group();g.name=name;g.position.set(...p);parent.add(g);return g;}
 function line(g,n,points,r,m){return mesh(g,n,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),16,r,5,false),m);}
 const body=part(actor,'Emily animated upper body',[0,1.02,0]),torso=part(body,'Emily satin party dress and shoulders');
 ball(torso,'Bare upper chest',[0,.485,-.01],[.147,.142,.079],skin);
 for(const sign of [-1,1]){
  ball(torso,'Bare shoulder',[sign*.177,.532,-.005],[.059,.065,.063],skin);
  line(torso,'Thin satin shoulder strap',[[sign*.119,.464,.064],[sign*.137,.54,.043],[sign*.145,.588,-.007],[sign*.135,.548,-.06],[sign*.119,.47,-.074]],.008,satinEdge);
 }
 // One fitted fabric shell, widening below the hips to clear the walking legs.
 // The lower rings open at the front-side seam to form an actual triangular slit.
 const dressRings=[[.465,.151,.103],[.36,.171,.123],[.23,.133,.091],[.11,.147,.10],[-.03,.171,.12],[-.12,.177,.14],[-.25,.190,.163],[-.39,.204,.18]];
 const slitAngle=1.02,columns=64,dressPositions=[],dressIndices=[];
 function fabricPoint(y,angle){
  let row=0;while(row<dressRings.length-2&&y<dressRings[row+1][0])row++;
  const a=dressRings[row],b=dressRings[row+1],t=T.MathUtils.clamp((a[0]-y)/(a[0]-b[0]),0,1);
  const rx=T.MathUtils.lerp(a[1],b[1],t),rz=T.MathUtils.lerp(a[2],b[2],t);
  const ripple=.002*Math.sin(angle*5+y*15)*Math.max(0,.3-y);
  const cowl=y===dressRings[0][0]?-.025*Math.max(0,Math.cos(angle))**6:0;
  return [Math.sin(angle)*(rx+ripple),y+cowl,Math.cos(angle)*(rz+ripple)];
 }
 for(let row=0;row<dressRings.length;row++){
  const y=dressRings[row][0],gap=.30*Math.max(0,(-.03-y)/.36);
  for(let col=0;col<=columns;col++)dressPositions.push(...fabricPoint(y,slitAngle+gap+col/columns*(Math.PI*2-gap*2)));
  if(row)for(let col=0;col<columns;col++){const a=(row-1)*(columns+1)+col,b=a+columns+1;dressIndices.push(a,b,a+1,a+1,b,b+1);}
 }
 const dressGeometry=new T.BufferGeometry();dressGeometry.setAttribute('position',new T.Float32BufferAttribute(dressPositions,3));dressGeometry.setIndex(dressIndices);dressGeometry.computeVertexNormals();
 mesh(torso,'Ice-blue satin slip dress with side slit',dressGeometry,satin);
 line(torso,'Soft draped neckline',Array.from({length:17},(_,i)=>fabricPoint(.465,-1.12+i/16*2.24)),.0035,satinEdge);
 for(const sign of [-1,1])line(torso,'Finished slit edge',[-.03,-.12,-.25,-.39].map(y=>fabricPoint(y,slitAngle+sign*.30*Math.max(0,(-.03-y)/.36))),.003,satinEdge);
 line(torso,'Satin hem',Array.from({length:49},(_,i)=>fabricPoint(-.39,slitAngle+.30+i/48*(Math.PI*2-.60))),.0035,satinEdge);
 for(const [y,start,end] of [[.07,-1.0,.85],[-.11,-.75,.95]])line(torso,'Subtle diagonal satin fold',Array.from({length:13},(_,i)=>{const p=fabricPoint(y-i/12*.055,start+i/12*(end-start));p[2]+=.002;return p;}),.0025,satinEdge);
 ball(torso,'Long slender neck',[0,.637,.014],[.061,.111,.060],skin);
 const head=part(body,'Emily searching head',[0,.845,.026]),portrait=part(head,'Emily face and long dark hair');
 // Loose shoulder-length waves frame a long face, with a clear center part.
 ball(portrait,'Back of dark hair',[0,.021,-.118],[.190,.248,.080],hair);
 for(const sign of [-1,1]){
  line(portrait,'Long flowing hair',[[sign*.130,.196,-.018],[sign*.185,.086,-.03],[sign*.179,-.103,-.028],[sign*.194,-.27,-.062],[sign*.141,-.385,-.040]],.063,hair);
  line(portrait,'Outer wavy lock',[[sign*.165,.129,-.054],[sign*.208,-.056,-.044],[sign*.183,-.204,-.015],[sign*.213,-.329,-.071]],.035,hair);
  line(portrait,'Loose chestnut wave',[[sign*.14,.183,.039],[sign*.181,.049,.026],[sign*.162,-.116,.026],[sign*.184,-.269,-.018],[sign*.144,-.364,.005]],.006,hairLight);
 }
 ball(portrait,'Long narrow face',[0,0,0],[.163,.227,.140],skin);
 ball(portrait,'Tapered chin',[0,-.139,.012],[.109,.095,.104],skin);
 for(const sign of [-1,1]){
  ball(portrait,'Ear',[sign*.16,-.024,-.008],[.025,.052,.019],skin);
  ball(portrait,'Small gold earring',[sign*.169,-.080,.012],[.011,.019,.012],gold);
  ball(portrait,'High cheekbone',[sign*.102,-.051,.093],[.043,.047,.028],skin);
  ball(portrait,'Concerned eye white',[sign*.070,.024,.129],[.041,.025,.014],white);
  ball(portrait,'Brown iris',[sign*.068,.029,.143],[.016,.020,.007],iris);
  ball(portrait,'Dark pupil',[sign*.067,.030,.15],[.008,.012,.003],ink);
  ball(portrait,'Eye catchlight',[sign*.061,.039,.154],[.0035,.0035,.002],white);
  line(portrait,'Raised inner concerned brow',[[sign*.029,.110,.137],[sign*.064,.105,.133],[sign*.111,.071,.113]],.011,hair);
  line(portrait,'Upper eyelash line',[[sign*.034,.042,.139],[sign*.070,.051,.140],[sign*.110,.035,.123]],.004,hair);
  line(portrait,'Lower eye contour',[[sign*.04,-.003,.140],[sign*.076,-.007,.139],[sign*.11,.004,.121]],.0025,crease);
 }
 ball(portrait,'Straight nose',[0,-.006,.144],[.025,.064,.030],skin);
 ball(portrait,'Nose tip',[0,-.059,.169],[.032,.024,.025],skin);
 const neutral=part(head,'Emily concerned mouth');
 line(neutral,'Small worried frown',[[-.046,-.136,.135],[0,-.122,.148],[.046,-.136,.135]],.006,lip);
 line(neutral,'Soft lower lip',[[-.024,-.145,.139],[0,-.140,.144],[.026,-.146,.138]],.0035,lip);
 const talking=part(head,'Emily asking about Alex');
 ball(talking,'Speaking lips',[0,-.133,.14],[.043,.035,.011],lip);
 const mouth=ball(talking,'Open speaking mouth',[0,-.133,.15],[.033,.025,.005],ink);
 ball(talking,'Upper teeth',[0,-.117,.156],[.026,.006,.003],white);talking.visible=false;
 for(const sign of [-1,1]){
  const crown=ball(portrait,'Center-parted crown',[sign*.086,.174,-.041],[.103,.081,.136],hair);crown.rotation.z=sign*.20;
  line(portrait,'Swept forehead lock',[[sign*.008,.219,.027],[sign*.059,.198,.091],[sign*.12,.145,.104],[sign*.155,.056,.04]],.024,hair);
  for(let i=0;i<3;i++)line(portrait,'Fine parted hair strand',[[sign*(.015+i*.015),.235-i*.008,.00],[sign*(.059+i*.015),.215-i*.009,.062],[sign*(.116+i*.013),.158-i*.012,.074]],.003,hairLight);
 }
 const limbs=[],hands=[],feet=[],shoeParts=[];
 for(const sign of [-1,1]){
  const thigh=mesh(actor,'Emily bare thigh',rod,skin),shin=mesh(actor,'Emily bare lower leg',rod,skin);
  const upperArm=mesh(body,'Emily bare upper arm',rod,skin),forearm=mesh(body,'Emily bare forearm',rod,skin);
  const hand=part(body,'Emily expressive hand');
  ball(hand,'Slim palm',[0,0,0],[.032,.054,.027],skin);
  for(let i=0;i<4;i++)ball(hand,'Long finger',[(i-1.5)*.014,-.043,.012],[.009,.034,.011],skin);
  ball(hand,'Thumb',[-sign*.03,-.004,.025],[.013,.029,.015],skin);
  const foot=part(actor,'Emily animated party shoe',[sign*.112,0,0]);
  ball(foot,'Dark shoe sole',[0,.022,.051],[.063,.022,.141],shoesMat);
  ball(foot,'Bare instep',[0,.064,.043],[.053,.035,.108],skin);
  ball(foot,'Bare ankle',[0,.115,-.017],[.04,.052,.041],skin);
  ball(foot,'Satin shoe toe',[0,.067,.128],[.056,.03,.059],shoesMat);
  box(foot,'Small party shoe heel',[0,.033,-.057],[.043,.066,.039],shoesMat);
  line(foot,'Fine instep strap',[[-.049,.073,.060],[0,.102,.049],[.049,.073,.060]],.007,shoesMat);
  feet.push(foot);shoeParts.push(foot);hands.push(hand);limbs.push({sign,thigh,shin,upperArm,forearm});
 }
 const label=part(actor,'Emily floating name',[0,2.31,0]);label.userData={text:EMILY.name,billboard:true};
 const labelInk=materials['Guest name ivory']??(materials['Emily name ivory']=new T.MeshBasicMaterial({name:'Emily name ivory',color:0xfff3d8,side:T.DoubleSide}));
 const outlineInk=materials['Guest name dark outline']??(materials['Emily name outline']=new T.MeshBasicMaterial({name:'Emily name outline',color:0x272333,side:T.DoubleSide}));
 const lettering=new T.ShapeGeometry(new Font(fontData).generateShapes(EMILY.name,.10),5);lettering.computeBoundingBox();const center=lettering.boundingBox.getCenter(new T.Vector3());lettering.translate(-center.x,-center.y,0);
 for(const [x,y] of [[-.003,0],[.003,0],[0,-.003],[0,.003]])mesh(label,'Name outline',lettering,outlineInk,[x,y,-.002]);
 mesh(label,'Emily name lettering',lettering,labelInk);label.traverse(o=>{if(o.isMesh)o.castShadow=o.receiveShadow=false;});
 const anchor=part(actor,'Emily speech anchor',[0,2.60,0]);
 const wander=makePartyWander(T,EMILY_WANDER,EMILY.y,{seed:519,closed:true,speed:EMILY.speed});
 const va=new T.Vector3(),vb=new T.Vector3(),cameraWorld=new T.Vector3(),labelWorld=new T.Vector3(),rotation=new T.Quaternion(),yawQ=new T.Quaternion();
 function segment(o,a,b,r){va.set(...a);vb.set(...b).sub(va);o.position.copy(va).addScaledVector(vb,.5);o.scale.set(r,vb.length(),r);o.quaternion.setFromUnitVectors(up,vb.normalize());}
 const guest={id:EMILY.id,speechName:EMILY.name,voiceCue:'flying-squirrel',spec:EMILY,group:actor,body,head,label,anchor,hands,feet,neutral,talking,speech:null,moving:false,wandering:true,wander,
  rigidParts:[torso,portrait,...hands,...shoeParts],
  setPosition(position){guest.wandering=false;guest.moving=false;actor.position.copy(position);},
  faceToward(position){actor.rotation.set(0,Math.atan2(position.x-actor.position.x,position.z-actor.position.z),0);}};
 guest.storyRig=createStoryRig(T,guest,portrait,limbs,{emily:true});
 let elapsed=0,wanderTime=0,nextSpeech=EMILY.firstSpeech,walkPhase=0;
 function speak(){say(guest,EMILY_LINE,EMILY.speechSeconds);nextSpeech=elapsed+EMILY.speechSeconds+EMILY.quietSeconds;}
 const approach=createGuestApproach(guest,speak);
 function pose(time){
  const moving=guest.moving,asking=!!guest.speech,sway=Math.sin(walkPhase);
  body.position.y=1.02+(moving?Math.sin(walkPhase*2)*.006:0);
  body.rotation.set(.018,moving?0:Math.sin(time*.39)*.018,moving?sway*.012:Math.sin(time*.8)*.008);
  head.rotation.set(.015+Math.sin(time*.59)*.035,guest.attending||guest.scripted?0:Math.sin(time*.53)*.29,-.03+Math.sin(time*.43)*.022);
  neutral.visible=!asking;talking.visible=asking;mouth.scale.y=.02+.009*(.5+.5*Math.sin(time*12));
  for(const [i,l] of limbs.entries()){
   const step=moving?sway*l.sign*.145:0,lift=moving?Math.max(0,sway*l.sign)*.045:0;
   feet[i].position.set(l.sign*.112,lift,step);
   segment(l.thigh,[l.sign*.095,1.015,0],[l.sign*.117,.55,.025+step*.48],.058);
   segment(l.shin,[l.sign*.117,.55,.025+step*.48],[l.sign*.112,.15+lift,step],.043);
   // A big wave with her left hand when asked (the trailer stage).
   const wave=guest.waving&&i===1;
   const p=wave?[.37+Math.sin(time*10+.9)*.11,.85,.14]:asking?(i===0?[-.265,.215,.185]:[.135,.39,.173]):[l.sign*.227,-.15,.08-step*.65];
   const elbow=wave?[.31,.5,.04]:[l.sign*.251,.269,asking?.09:.014-step*.3];
   segment(l.upperArm,[l.sign*.184,.53,0],elbow,.043);segment(l.forearm,elbow,p,.033);hands[i].position.set(...p);
   hands[i].rotation.set(asking&&i===0?-.3:0,0,asking?l.sign*.25:0);
  }
 }
 function update(dt,camera=null,context={}){
  dt=Math.max(0,dt);elapsed+=dt;
  if(!guest.scripted){
   if(guest.speech){guest.speech.remaining-=dt;if(guest.speech.remaining<=0)guest.speech=null;}
   guest.attending=approach.update(dt,context);
   if(elapsed>=nextSpeech&&!guest.attending)speak();
   guest.moving=false;
  }
  if(guest.wandering&&!guest.scripted&&!guest.attending){
   const walkingTime=Math.max(0,Math.min(dt,elapsed-4));
   if(!guest.speech)wanderTime+=walkingTime;
   const p=wander.sample(wanderTime);actor.position.copy(p.position);guest.moving=walkingTime>0&&!guest.speech&&p.moving;
   if(guest.moving){yawQ.setFromAxisAngle(up,Math.atan2(p.direction.x,p.direction.z));actor.quaternion.slerp(yawQ,1-Math.exp(-dt*4));walkPhase+=dt*4.4;}
  }
  if(guest.scripted&&guest.moving)walkPhase+=dt*4.4;
  pose(elapsed);guest.storyRig.update(elapsed);
  if(camera){actor.updateWorldMatrix(true,true);camera.getWorldPosition(cameraWorld);label.getWorldPosition(labelWorld);actor.getWorldQuaternion(rotation);label.quaternion.copy(rotation.invert()).multiply(yawQ.setFromAxisAngle(up,Math.atan2(cameraWorld.x-labelWorld.x,cameraWorld.z-labelWorld.z)));}
 }
 function reset(){elapsed=wanderTime=walkPhase=0;nextSpeech=EMILY.firstSpeech;guest.speech=null;guest.scripted=false;guest.attending=false;guest.moving=false;guest.wandering=true;actor.visible=true;wander.reset();approach.reset();actor.position.set(...world(EMILY.u,EMILY.v,EMILY.y));guest.faceToward(new T.Vector3(...world(705,668,EMILY.y)));pose(0);}
 const resetBase=reset;const resetScene=()=>{guest.waterPose=null;guest.expression=null;actor.rotation.set(0,0,0);label.visible=true;resetBase();guest.storyRig.update(0);};
 resetScene();Object.assign(guest,{update,reset:resetScene});return guest;
}
