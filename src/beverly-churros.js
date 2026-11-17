import {Font} from '../vendor/FontLoader.js';
import fontData from '../vendor/beverly-font.js';
import {world,CHURRO_TENT} from './beverly-layout.js';

// Static tent dressing with a separately animated, seated eater.
export function buildChurroTent(T,root,groups,materials){
 const tent=new T.Group();tent.name='Churro_tent';groups.Churro_tent=tent;root.add(tent);
 tent.position.set(...world(CHURRO_TENT.u,CHURRO_TENT.v,CHURRO_TENT.y));tent.rotation.y=Math.PI/2;
 tent.userData={purpose:'Churro catering between Union Toilets and the entrance loop wall',front:'toward the driveway',occupants:'One animated seated eater; three bus guests visit'};
 const mat=(name,color,roughness=.8,extra={})=>materials[name]=new T.MeshStandardMaterial({name,color,roughness,...extra});
 const canvas=mat('Churro tent ivory canvas',0xf1dfb6,.95,{side:T.DoubleSide}),stripe=mat('Churro tent cinnamon stripes',0xb76434,.93,{side:T.DoubleSide}),timber=mat('Churro table warm timber',0x92613a),dark=mat('Churro sign dark cocoa',0x39261d),letter=mat('Churro sign cream letters',0xffe9b9,.7,{emissive:0x654420,emissiveIntensity:.15}),body=mat('Churro guest charcoal',0x252a2d,.78),pastry=mat('Golden churro',0xd99639,.95),ridge=mat('Churro toasted ridges',0xab5e23,.95),sugar=mat('Churro cinnamon sugar',0xf1d6a0),metal=materials['Aged iron'],glow=materials['Lantern glass'];
 const cube=new T.BoxGeometry(1,1,1),sphere=new T.SphereGeometry(1,14,10);
 function mesh(g,name,geometry,material,p,scale=[1,1,1]){const m=new T.Mesh(geometry,material);m.name=name;m.position.set(...p);m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;}
 const box=(g,name,p,size,m)=>mesh(g,name,cube,m,p,size);
 const ball=(g,name,p,size,m)=>mesh(g,name,sphere,m,p,size);
 function rod(g,name,a,b,r,m){const start=new T.Vector3(...a),end=new T.Vector3(...b),delta=end.clone().sub(start);const item=mesh(g,name,new T.CylinderGeometry(r,r,delta.length(),10),m,start.clone().add(end).multiplyScalar(.5).toArray());item.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return item;}
 function label(value,size,p,m){const geometry=new T.ShapeGeometry(new Font(fontData).generateShapes(value,size),4);geometry.computeBoundingBox();geometry.translate(-(geometry.boundingBox.max.x+geometry.boundingBox.min.x)/2,0,0);const item=mesh(tent,value,geometry,m,p);item.userData.text=value;return item;}
 const w=CHURRO_TENT.width/2,d=CHURRO_TENT.depth/2,eave=2.68,peak=4.3;
 box(tent,'Tent floor mat',[0,.025,0],[w*2-.12,.05,d*2-.12],mat('Tent woven floor',0x967e59,.98));
 // Striped hipped canopy with a slight cloth sag between the peak and eaves.
 const corners=[[-w,eave,-d],[w,eave,-d],[w,eave,d],[-w,eave,d]];
 for(let side=0;side<4;side++){
  const a=corners[side],b=corners[(side+1)%4],panels=side%2===0?12:8;
  for(let j=0;j<panels;j++){
   const points=[0,peak,0],indices=[0,2,1],rows=5;
   for(let k=1;k<=rows;k++){
    for(const edge of [j/panels,(j+1)/panels]){const t=k/rows;points.push((a[0]+(b[0]-a[0])*edge)*t,peak+(eave-peak)*t-.12*Math.sin(Math.PI*t),(a[2]+(b[2]-a[2])*edge)*t);}
    if(k>1){const n=1+2*(k-2);indices.push(n,n+1,n+2,n+1,n+3,n+2);}
   }
   const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(points,3));geometry.setIndex(indices);geometry.computeVertexNormals();mesh(tent,'Striped fabric canopy panel',geometry,j%3===1?stripe:canvas,[0,0,0]);
  }
 }
 for(const x of [-w,w])for(const z of [-d,d]){rod(tent,'Tent corner upright',[x,.05,z],[x,eave+.06,z],.048,metal);box(tent,'Tent post ballast',[x,.12,z],[.36,.24,.36],dark);}
 for(let i=0;i<4;i++){const a=corners[i],b=corners[(i+1)%4];rod(tent,'Canopy perimeter rail',a,b,.045,metal);rod(tent,'Canopy roof rib',a,[0,peak,0],.034,metal);}
 // Back canvas and tied side curtains shelter the booth, leaving its front open.
 box(tent,'Tent back canvas',[0,1.32,-d+.035],[w*2,.1+2.48,.05],canvas);
 for(const x of [-w+.045,w-.045])box(tent,'Short side canvas return',[x,1.32,-d+.58],[.065,2.48,1.1],canvas);
 for(const x of [-w+.14,w-.14]){
  box(tent,'Gathered front curtain',[x,1.54,d-.02],[.28,2.2,.15],canvas);
  box(tent,'Curtain cinnamon tie',[x,1.28,d+.07],[.32,.11,.045],stripe);
 }
 for(const z of [-d,d])box(tent,'Canvas valance',[0,2.51,z],[w*2,.34,.07],canvas);
 for(const x of [-w,w])box(tent,'Side canvas valance',[x,2.51,0],[.07,.34,d*2],canvas);
 box(tent,'Eat Churros Here sign border',[0,2.88,d+.075],[6.92,.77,.08],stripe);
 box(tent,'Eat Churros Here sign board',[0,2.88,d+.124],[6.76,.63,.04],dark);
 const sign=label('Eat Churros Here',.46,[0,2.68,d+.151],letter);sign.userData.facing='Driveway';
 // Warm practical lights hung under the canopy.
 rod(tent,'Tent string light cable',[-3,2.49,.55],[3,2.49,.55],.012,metal);
 for(const x of [-2.35,0,2.35]){rod(tent,'Pendant cord',[x,2.49,.55],[x,2.25,.55],.012,metal);ball(tent,'Warm tent bulb',[x,2.19,.55],[.075,.11,.075],glow);}
 // Table, seating and a tray of churros: the only food at the catering tent.
 box(tent,'Churro eating table top',[-.25,.86,-.18],[3.45,.12,1.04],timber);
 for(const x of [-1.68,1.18])for(const z of [-.57,.21])rod(tent,'Folding table leg',[x,.08,z],[x,.8,z],.042,metal);
 for(const x of [-1.68,1.18])rod(tent,'Table cross brace',[x,.18,-.57],[x,.69,.21],.027,metal);
 box(tent,'Churro serving tray',[-1.03,.945,-.18],[1.18,.05,.65],dark);
 box(tent,'Serving tray paper',[-1.03,.974,-.18],[1.08,.012,.55],letter);
 function churro(g,name,a,b,r=.026){
  const item=new T.Group();item.name=name;g.add(item);const start=new T.Vector3(...a),end=new T.Vector3(...b),delta=end.clone().sub(start),length=delta.length();item.position.copy(start.clone().add(end).multiplyScalar(.5));item.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());
  rod(item,'Churro pastry core',[0,-length/2,0],[0,length/2,0],r,pastry);
  for(let i=0;i<7;i++){const angle=i/7*Math.PI*2,px=Math.cos(angle)*r,pz=Math.sin(angle)*r;rod(item,'Churro lengthwise ridge',[px,-length/2,pz],[px,length/2,pz],r*.2,ridge);}
  for(let i=0;i<9;i++){const angle=i*2.4;ball(item,'Cinnamon sugar fleck',[Math.cos(angle)*r*1.15,(i/8-.5)*length*.87,Math.sin(angle)*r*1.15],[.006,.008,.006],sugar);}
  return item;
 }
 for(let i=0;i<8;i++){const x=-1.48+i*.12;churro(tent,'Tray churro '+(i+1),[x,1.014,-.42],[x+.06,1.014,.05],.025);}
 // Keep the rig outside the tent's static batching so its joints stay editable.
 const eater=new T.Group();eater.name='Churro_eater';eater.userData.dynamic=true;eater.position.copy(tent.position);eater.rotation.copy(tent.rotation);root.add(eater);groups.Churro_eater=eater;
 const guest=new T.Group();guest.name='Stickman eating a churro';guest.position.set(.75,.04,-1.2);eater.add(guest);guest.userData={pose:'seated; raise churro, bite, chew, lower churro',dynamic:true};
 box(guest,'Guest chair seat',[0,.45,0],[.54,.08,.5],timber);
 for(const x of [-.22,.22])for(const z of [-.2,.2])rod(guest,'Guest chair leg',[x,0,z],[x,.43,z],.025,metal);
 box(guest,'Guest chair back',[0,.84,-.22],[.54,.43,.065],timber);
 rod(guest,'Stickman torso',[0,.52,0],[0,1.07,0],.055,body);rod(guest,'Stickman neck',[0,1.06,0],[0,1.25,.01],.04,body);
 const head=new T.Group();head.name='Chewing head';head.position.set(0,1.41,.025);guest.add(head);
 ball(head,'Stickman head',[0,0,0],[.19,.205,.19],body);
 for(const x of [-.064,.064])ball(head,'Stickman eye',[x,.025,.178],[.022,.025,.013],letter);
 const mouth=ball(head,'Chewing mouth',[0,-.085,.184],[.034,.009,.012],letter);
 for(const x of [-.15,.15]){rod(guest,'Seated stickman thigh',[x*.3,.53,0],[x,.49,.47],.043,body);rod(guest,'Seated stickman shin',[x,.49,.47],[x,.085,.51],.041,body);ball(guest,'Stickman shoe',[x,.075,.6],[.07,.06,.14],body);}
 const armUpper=mesh(guest,'Eating arm upper',new T.CylinderGeometry(1,1,1,8),body,[0,0,0]),armFore=mesh(guest,'Eating arm raised',new T.CylinderGeometry(1,1,1,8),body,[0,0,0]);
 const hand=new T.Group();hand.name='Churro holding hand';guest.add(hand);ball(hand,'Holding palm',[0,0,0],[.055,.055,.055],body);
 rod(guest,'Resting arm upper',[-.1,1.05,.01],[-.36,.84,.27],.039,body);rod(guest,'Resting arm forearm',[-.36,.84,.27],[-.34,.88,.55],.037,body);ball(guest,'Resting hand',[-.34,.88,.55],[.055,.055,.055],body);
 const heldChurro=churro(hand,'Churro held to mouth',[0,-.13,0],[0,.27,0],.029);
 const up=new T.Vector3(0,1,0);let time=0;
 function segment(o,a,b,r){const start=new T.Vector3(...a),v=new T.Vector3(...b).sub(start);o.position.copy(start).addScaledVector(v,.5);o.scale.set(r,v.length(),r);o.quaternion.setFromUnitVectors(up,v.normalize());}
 function update(dt){
  if(guest.userData.escapeControlled)return;
  time+=Math.max(0,dt);const cycle=time%6.8;
  const lift=T.MathUtils.smoothstep(cycle,1.1,2.3)*(1-T.MathUtils.smoothstep(cycle,4.5,5.7));
  const chew=cycle>2.3&&cycle<4.5?Math.sin(time*13):0;
  hand.position.set(.28-.13*lift,1.02+.12*lift,.43-.10*lift);
  // The upper tip reaches the mouth; the lower end stays behind his fingers.
  hand.quaternion.setFromUnitVectors(up,new T.Vector3(-.52*lift,1,-.43*lift).normalize());
  const elbow=[.38,.93+.04*lift,.24];segment(armUpper,[.1,1.05,.01],elbow,.039);segment(armFore,elbow,hand.position.toArray(),.037);
  head.rotation.x=lift*.035+chew*.008;mouth.scale.y=.009+Math.abs(chew)*.014;
 }
 update(0);
 root.userData.churroTent={...CHURRO_TENT,sign:'Eat Churros Here',guests:'One animated seated eater, plus three arriving bus guests'};
 return {group:tent,eater,sign,guest,head,hand,heldChurro,armUpper,armFore,update,get elapsed(){return time;}};
}
