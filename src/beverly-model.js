import {s,world,LEVELS,DRIVE,SIDE_DRIVE,COACH_APPROACH,TRAILER_PAD,CHURRO_TENT,ARRIVAL_WALL,FUTURE_BUS_BAY,WEST_PATIO,BYPASS_HEDGES,terrainHeight,gardenHeight,nearPolyline,GARDEN_BASINS,GARDEN_CASCADES,MAIN_POOL,PATIO_FOUNTAIN,FUTURE_STORY} from './beverly-layout.js';
import {buildBeverlySetPieces} from './beverly-setpieces.js';
import {buildGardenWater} from './beverly-garden-water.js';
import {buildChurroTent} from './beverly-churros.js';
import {buildPatioFountain} from './beverly-fountain.js';
import {buildPartyBus} from './beverly-bus.js';
import {buildBeverlyPassengers} from './beverly-passengers.js';
import {buildGalleryArtwork,WORDS_LOSE_ART} from './beverly-artwork.js';
import {buildPatioPerformance} from './beverly-performance.js';
import {buildBeverlyGuests} from './beverly-guests.js';
import {buildBeverlyFilmCrew} from './beverly-film-crew.js';
import {buildDrivewayCameraman} from './beverly-driveway-cameraman.js';
import {buildPatioBubbles} from './beverly-party-bubbles.js';
import {buildDrivewayPaint} from './beverly-driveway-paint.js';
import {buildBeverlyStory} from './beverly-story.js';
import {buildDrowningRemains} from './beverly-drowning-remains.js';
import {buildBeverlyMaze} from './beverly-maze.js';
import {buildBeverlyStubby} from './beverly-stubby.js';

// Editable, deterministic first-pass geometry. Trace footprints from USER-04;
// elevations and ornamental profiles are estimates checked against photographs.
export function buildBeverlyEstate(T,{paintingTexture=null,logoTexture=null,hallPaintingTexture=null}={}){
 const root=new T.Group();root.name='Beverly Estate — architectural study 08';
 root.userData={stage:'Architectural blockout, not a measured reconstruction',units:'metres',plan:'USER-04',scaleAnchor:'Pool horizontal dimension 74 feet 9 inches',elevations:'Photo-guided estimates',scope:'House, terrain, party guests and three playable story scenes including the fountain finale'};
 const groups={};for(const name of ['Terrain','Driveway','Ground_floor','Upper_floors_and_roofs','Terraces','Pool_and_cascades','Pavilions','Planting','Lamps']){const g=new T.Group();g.name=name;root.add(g);groups[name]=g;}
 const mats={};
 const material=(name,color,roughness=.8,extra={})=>mats[name]=new T.MeshStandardMaterial({name,color,roughness,...extra});
 const stucco=material('Peach lime stucco',0xc58e6b),cream=material('Ivory architectural trim',0xe0d6bd),stone=material('Warm limestone paving',0xc9ba9e),tile=material('Terracotta roof and coping',0x9c5b40),tileLight=material('Terracotta variation',0xb47c59),grass=material('Lawn',0x63744b),earth=material('Hillside earth',0x54624a),hedge=material('Clipped hedges',0x304b2e),leaf=material('Tree foliage',0x3c5239),bark=material('Tree bark',0x5e5744),wood=material('Dark timber',0x382a24),iron=material('Aged iron',0x343738,.48,{metalness:.55}),glass=material('Smoky window glass',0x263b3c,.25,{metalness:.25}),water=material('Pool water',0x3a999d,.18,{metalness:.2,transparent:true,opacity:.84}),basin=material('Pool tile',0x358c9d,.46),red=material('Red fireplace room',0x873a2c),parquet=material('Parquet wood',0x865a38),gold=material('Brass detail',0xac9056,.3,{metalness:.65}),glow=material('Lantern glass',0xffe8b0,.5,{emissive:0xffc87d,emissiveIntensity:.75});
 const drivewayGlass=material('Driveway lantern glass',0xffffff,.5,{emissive:0xffffff,emissiveIntensity:2});
 const boxGeo=new T.BoxGeometry(1,1,1),sphereGeo=new T.SphereGeometry(1,12,8),cylGeo=new T.CylinderGeometry(1,1,1,12);
 function mesh(g,geo,mat,name,pos=[0,0,0],scale=[1,1,1]){const m=new T.Mesh(geo,mat);m.name=name;m.position.set(...pos);m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;}
 function box(g,name,u,v,w,d,y,h,mat=stucco){return mesh(g,boxGeo,mat,name,world(u,v,y+h/2),[w*s,h,d*s]);}
 function ellipsoid(g,name,u,v,y,rx,ry,rz,mat){return mesh(g,sphereGeo,mat,name,world(u,v,y),[rx,ry,rz]);}
 function cylinder(g,name,u,v,y,r,h,mat,rt=r){return mesh(g,rt===r?cylGeo:new T.CylinderGeometry(rt,r,h,16),mat,name,world(u,v,y+h/2),rt===r?[r,h,r]:[1,1,1]);}
 function rect(g,name,u1,v1,u2,v2,y,h,mat){return box(g,name,(u1+u2)/2,(v1+v2)/2,u2-u1,v2-v1,y,h,mat);}
 function slab(g,name,points,y,h,mat,holes=[]){const shape=new T.Shape(points.map(p=>new T.Vector2((p[0]-820)*s,-(p[1]-600)*s)));for(const {u,v,r} of holes){const hole=new T.Path();hole.absarc((u-820)*s,-(v-600)*s,r,0,Math.PI*2,true);shape.holes.push(hole);}const geo=new T.ExtrudeGeometry(shape,{depth:h,bevelEnabled:false,curveSegments:32});geo.rotateX(-Math.PI/2);return mesh(g,geo,mat,name,[0,y,0]);}
 function strip(g,name,points,width,mat,matchDrive=false){
  const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...world(...p))));
  const mainCurve=matchDrive?new T.CatmullRomCurve3(DRIVE.map(p=>new T.Vector3(...world(...p)))):null;
  const samples=mainCurve?Array.from({length:501},(_,i)=>{const p=mainCurve.getPoint(i/500);return [p.x/s+820,p.z/s+600,p.y];}):null;
  const p=[],idx=[],n=140,across=matchDrive?12:1;
  for(let i=0;i<=n;i++){
   const t=i/n,c=curve.getPoint(t),d=curve.getTangent(t),norm=new T.Vector3(-d.z,0,d.x).normalize().multiplyScalar(width/2);
   for(let j=0;j<=across;j++){const sign=1-2*j/across;
    const q=c.clone().addScaledVector(norm,sign);let h=c.y+.035;
    if(samples){const r=nearPolyline(q.x/s+820,q.z/s+600,samples),blend=Math.max(0,Math.min(1,(5-r.distance*s)/1.65));h=h*(1-blend)+(r.height+.03)*blend;}
    p.push(q.x,h,q.z);
   }
   if(i<n)for(let j=0;j<across;j++){const k=(across+1)*i+j,next=k+across+1;idx.push(k,next,k+1,k+1,next,next+1);}
  }
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(p,3));geo.setIndex(idx);geo.computeVertexNormals();return mesh(g,geo,mat,name);
 }
 function line(g,name,pts,r,mat){const curve=new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(...p)));return mesh(g,new T.TubeGeometry(curve,Math.max(2,pts.length*4),r,6,false),mat,name);}
 function opening(g,name,u,v,width,height,spring,wallWidth,depth,y,mat=stucco,rotation=Math.PI/2,pointed=false){
  const w=width/2,outer=wallWidth/2;
  const profile=[];
  for(let i=0;i<=20;i++){const t=i/20,x=-w+2*w*t;const rise=pointed?Math.pow(Math.sin(Math.PI*t),.7)*(height-spring):Math.sqrt(Math.max(0,1-(x/w)**2))*(height-spring);profile.push([x,spring+rise]);}
  const pts=[[-outer,0],[-w,0],...profile,[w,0],[outer,0],[outer,height+.65],[-outer,height+.65]];
  const shape=new T.Shape(pts.map(p=>new T.Vector2(...p)));const geo=new T.ExtrudeGeometry(shape,{depth,bevelEnabled:false});geo.translate(0,0,-depth/2);
  const item=mesh(g,geo,mat,name,world(u,v,y));item.rotation.y=rotation;
  const trim=new T.Group();trim.name=name+' trim';trim.position.copy(item.position);trim.rotation.y=rotation;g.add(trim);
  const trimpts=[[-w,0,depth/2+.015],...profile.map(p=>[p[0],p[1],depth/2+.015]),[w,0,depth/2+.015]];
  line(trim,'Arch surround',trimpts,.065,cream);
  return item;
 }
 function wall(g,name,u1,v1,u2,v2,y,h,mat=stucco,depth=.42){const a=new T.Vector3(...world(u1,v1,y+h/2)),b=new T.Vector3(...world(u2,v2,y+h/2));const m=mesh(g,boxGeo,mat,name,a.clone().add(b).multiplyScalar(.5).toArray(),[a.distanceTo(b),h,depth]);m.rotation.y=-Math.atan2(b.z-a.z,b.x-a.x);return m;}
 function windows(g,u,v,face,y,width=1.25,height=1.6){const pane=mesh(g,boxGeo,glass,'Recessed window',world(u,v,y+height/2),[.1,height,width]);if(face==='z')pane.rotation.y=Math.PI/2;const trim=mesh(g,boxGeo,wood,'Window lintel',world(u,v,y+height),[.2,.13,width+.22]);if(face==='z')trim.rotation.y=Math.PI/2;const awning=mesh(g,boxGeo,tile,'Small scalloped awning mass',world(u+(face==='x'?4:0),v+(face==='z'?4:0),y+height+.13),[face==='x'?.64:width+.32,.16,face==='x'?width+.32:.64]);return awning;}
 function roof(g,name,u1,v1,u2,v2,y,rise=1.35){
  const x1=(u1-820)*s,x2=(u2-820)*s,z1=(v1-600)*s,z2=(v2-600)*s,mid=(x1+x2)/2;
  const verts=[x1,y,z1,x2,y,z1,mid,y+rise,z1,x1,y,z2,mid,y+rise,z2,x2,y,z2];
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));geo.setIndex([0,2,1,3,5,4,0,3,4,0,4,2,2,4,5,2,5,1]);geo.computeVertexNormals();mesh(g,geo,tile,name);
  // Roof ridges express barrel-tile direction without individual tile meshes.
  for(let v=v1;v<v2;v+=6){line(g,'Tile course',[[x1,y+.025,(v-600)*s],[mid,y+rise+.025,(v-600)*s],[x2,y+.025,(v-600)*s]],.036,tileLight);}
 }
 function balustrade(g,u1,v1,u2,v2,y){wall(g,'Balustrade base',u1,v1,u2,v2,y,.18,cream,.32);wall(g,'Balustrade handrail',u1,v1,u2,v2,y+1.02,.16,cream,.38);const n=Math.ceil(Math.hypot(u2-u1,v2-v1)*s/.52);for(let i=0;i<=n;i++){const u=u1+(u2-u1)*i/n,v=v1+(v2-v1)*i/n;cylinder(g,'Baluster shaft',u,v,y+.16,.075,.86,cream);ellipsoid(g,'Baluster swell',u,v,y+.55,.12,.23,.12,cream);}}
 function stairs(g,u1,u2,v1,v2,y1,y2){const n=Math.ceil(Math.abs(y2-y1)/.17);for(let i=0;i<n;i++){const x1=u1+(u2-u1)*i/n,x2=u1+(u2-u1)*(i+1)/n,top=y1+(y2-y1)*(i+1)/n;rect(g,'Stone stair tread',Math.min(x1,x2),v1,Math.max(x1,x2),v2,Math.min(y1,y2)-.22,top-Math.min(y1,y2)+.22,stone);}}
 function lamp(u,v,y,lens=glow){const g=groups.Lamps;cylinder(g,'Garden lamp post',u,v,y,.065,2.3,iron);cylinder(g,'Lamp plinth',u,v,y,.16,.15,stone);box(g,'Glowing lantern',u,v,4,4,y+2.3,.42,lens);const cap=mesh(g,new T.ConeGeometry(.28,.24,4),iron,'Lantern roof',world(u,v,y+2.84));cap.rotation.y=Math.PI/4;cylinder(g,'Lamp finial',u,v,y+2.96,.03,.12,iron);}
 function statue(u,v,h,angle=0){
  const g=new T.Group();g.name='Stone stickman statue on pedestal';g.position.set(...world(u,v,h));g.rotation.y=angle;groups.Driveway.add(g);
  mesh(g,boxGeo,stone,'Square statue pedestal',[0,.36,0],[.9,.72,.9]);
  mesh(g,boxGeo,cream,'Pedestal cap',[0,.76,0],[1,.13,1]);
  mesh(g,sphereGeo,cream,'Stickman stone head',[0,2.45,0],[.23,.25,.23]);
  for(const pts of [[[0,2.2,0],[0,1.55,0]],[[0,1.58,0],[-.3,.84,.08]],[[0,1.58,0],[.3,.84,-.08]],[[-.55,1.55,.05],[0,2.04,0],[.5,2.3,0]]])line(g,'Carved stickman limb',pts,.075,cream);
 }
 function rectangularDoor(g,name,u,v,width,height,span,y,rotation=Math.PI/2,mat=stucco){
  const local=new T.Group();local.name=name;local.position.set(...world(u,v,y));local.rotation.y=rotation;g.add(local);
  for(const sign of [-1,1])mesh(local,boxGeo,mat,'Door side wall',[sign*(span+width)/4,2,0],[(span-width)/2,4,.5]);
  mesh(local,boxGeo,mat,'Door lintel',[0,(height+4)/2,0],[width,4-height,.5]);return local;
 }
 // Continuous hillside, with road grading and excavated pool area.
 const terrain=groups.Terrain,vertices=[],indices=[],nx=218,nz=118;
 for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){const u=-20+i/nx*2880,v=-100+j/nz*1770;vertices.push(...world(u,v,terrainHeight(u,v)-.12));}
 for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i;indices.push(a,a+nx+1,a+1,a+1,a+nx+1,a+nx+2);}
 const tg=new T.BufferGeometry();tg.setAttribute('position',new T.Float32BufferAttribute(vertices,3));tg.setIndex(indices);tg.computeVertexNormals();mesh(terrain,tg,earth,'Photo-guided hillside — elevations provisional');
 // Plan-traced arrival court with rounded outline and central island.
 const court=[];for(let i=0;i<72;i++){const a=i/72*Math.PI*2;court.push([474+177*Math.cos(a),599+116*Math.sin(a)]);}
 slab(groups.Driveway,'Oval arrival court — front door on right',court,7.82,.18,stone);
 // Unmarked coach bay behind the island's statue, with room for the turning wheels.
 // Flare the rear corner to meet the ramp across its width, without a grass notch.
 slab(groups.Driveway,'Party bus standing area',[[120,496],[310,480],[374,492],[382,520],[365,676],[351,718],[312,744],[286,718],[128,718],[100,675],[100,550]],7.82,.18,stone);
 strip(groups.Driveway,'Graded coach parking approach',COACH_APPROACH,6.7,stone);
 root.userData.futureBusBay={...FUTURE_BUS_BAY,lengthMetres:(FUTURE_BUS_BAY.v2-FUTURE_BUS_BAY.v1)*s,widthMetres:(FUTURE_BUS_BAY.u2-FUTURE_BUS_BAY.u1)*s};
 const boundary=new T.Group();boundary.name='Entrance loop estate boundary wall';groups.Driveway.add(boundary);
 for(let i=1;i<ARRIVAL_WALL.length;i++){
  const a=ARRIVAL_WALL[i-1],b=ARRIVAL_WALL[i],base=Math.min(terrainHeight(...a),terrainHeight(...b),7.8)-.6;
  wall(boundary,'Peach stucco boundary wall',...a,...b,base,10.65-base,stucco,.48);
  wall(boundary,'Terracotta boundary wall coping',...a,...b,10.65,.13,tile,.6);
 }
 for(const [u,v] of ARRIVAL_WALL){const base=Math.min(terrainHeight(u,v),7.8)-.6;box(boundary,'Boundary wall pier',u,v,9,9,base,10.85-base,stucco);box(boundary,'Boundary pier cap',u,v,11,11,10.85,.15,cream);}
 strip(groups.Driveway,'Driveway to N Beverly Drive — satellite traced',DRIVE,6.7,stone);
 const sideDrive=strip(groups.Driveway,'Southern service branch',SIDE_DRIVE,5.8,stone,true);
 const drivewayPaint=buildDrivewayPaint(T,groups,mats,sideDrive);
 strip(groups.Driveway,'N Beverly Drive street segment',[[2480,-10,-18],[2631,223,-18],[2810,481,-18]],9,material('Street asphalt',0x545b60));
 slab(groups.Driveway,'Vehicle turnaround — PERSONAL-03 corrected',[[174,788],[311,767],[345,810],[327,942],[296,980],[167,978],[159,931]],6.38,.16,stone);
 strip(groups.Driveway,'Turnaround connection',[[348,934,6.5],[320,911,6.54],[294,877,6.54]],4.8,stone);
 const pad=TRAILER_PAD;
 rect(groups.Driveway,'Upper Union Toilets hardstanding',pad.u-55,pad.v-57,pad.u+53,pad.v+70,pad.y-.18,.18,stone);
 strip(groups.Driveway,'Upper toilet trailer driveway apron',[[316,1052,5.9],[332,1052,5.77],[345.3,1052.7,5.659]],4,stone,true);
 // The terrain and road fall continuously from this location toward the street.
 function rounded(g,name,u1,v1,u2,v2,r,y,h,mat){const pts=[];for(const [cx,cz,a0] of [[u2-r,v2-r,0],[u1+r,v2-r,Math.PI/2],[u1+r,v1+r,Math.PI],[u2-r,v1+r,Math.PI*1.5]])for(let i=0;i<=8;i++){const a=a0+i/8*Math.PI/2;pts.push([cx+r*Math.cos(a),cz+r*Math.sin(a)]);}return slab(g,name,pts,y,h,mat);}
 rounded(groups.Driveway,'Oval planted island',369,558,569,640,29,8,.3,hedge);
 rounded(groups.Driveway,'Arrival reflecting basin coping',384,570,553,629,21,8.3,.18,cream);
 rounded(groups.Driveway,'Arrival reflecting basin',390,576,547,623,17,8.49,.025,water);
 const octagon=(u,v,r)=>Array.from({length:8},(_,i)=>[u+Math.cos(Math.PI/8+i*Math.PI/4)*r,v+Math.sin(Math.PI/8+i*Math.PI/4)*r]);
 slab(groups.Driveway,'Arrival octagonal fountain basin',octagon(412,600,14),8.5,.57,cream);
 slab(groups.Driveway,'Octagonal fountain water',octagon(412,600,11.5),9.08,.02,water);
 cylinder(groups.Driveway,'Forecourt fountain pedestal',412,600,9.1,.12,.83,cream);cylinder(groups.Driveway,'Forecourt fountain bowl',412,600,9.85,.32,.13,cream);
 for(const u of [383,471,537])for(const v of [554,645]){cylinder(groups.Driveway,'Forecourt urn',u,v,8.2,.34,.5,tile);for(let i=0;i<6;i++){const a=i*Math.PI/3;line(groups.Planting,'Agave leaf',[world(u,v,8.7),world(u+Math.cos(a)*4,v+Math.sin(a)*4,9.3),world(u+Math.cos(a)*9,v+Math.sin(a)*9,9.55)],.035,hedge);}}
 for(const [u,v] of [[373,600],[499,553],[499,647]])statue(u,v,8.15);
 // Ground floor: the paired long galleries are open through repeated arches.
 const house=groups.Ground_floor,upper=groups.Upper_floors_and_roofs,y=LEVELS.house;
 rect(house,'Main house floor',650,398,818,707,y-.25,.25,parquet);
 rect(house,'Floor west of descending stairs',650,707,702,738,y-.25,.25,parquet);
 rect(house,'Floor east of descending stairs',743,707,818,738,y-.25,.25,parquet);
 // Outside the wall the threshold is the walking surface. Indoors it is an inlay
 // over the parquet, so it sits a hair proud: at the same height the two floors
 // shared a plane and flickered between tile and timber.
 rect(house,'Entrance threshold',633,592,650,629,y-.18,.18,stone);rect(house,'Entrance threshold inlay',650,592,704,629,y-.18,.192,stone);
 wall(house,'Front wall upper segment',650,398,650,590,y,4.0);
 wall(house,'Front wall lower segment',650,631,650,737,y,4.0);
 rectangularDoor(house,'Rectangular front entrance',650,610,2.5,3.12,42*s,y);
 for(const v of [590,630]){box(house,'Carved entrance pilaster',644,v,7,6,y,3.45,stone);box(house,'Portal pilaster capital',644,v,9,10,y+3.28,.2,cream);}
 box(house,'Entry portal stone entablature',643,610,9,51,y+3.48,.3,stone);box(house,'Entry portal cornice',641,610,12,56,y+3.76,.14,cream);
 for(const v of [590,610,630]){cylinder(house,'Portal finial plinth',644,v,y+3.9,.13,.13,stone);ellipsoid(house,'Portal stone finial',644,v,y+4.15,.1,.21,.1,cream);}
 // Open timber leaves against the reveal preserve the player-width threshold.
 for(const v of [594,626])box(house,'Open carved entrance door',663,v,22,1.4,y,.0+3.02,wood);
 for(const v of [478,530,582,634,686])opening(house,'Gallery-to-patio arched doorway',818,v,2.55,3.65,2.38,52*s,.5,y);
 // Four glazed bays and one open route door. Glazing follows the arch silhouette.
 const glazing=glass.clone();glazing.name='Arched smoky glazing';glazing.side=T.DoubleSide;glazing.transparent=true;glazing.opacity=.64;
 for(const v of [478,530,634,686]){
  const shape=new T.Shape();shape.moveTo(-1.275,0);shape.lineTo(1.275,0);shape.lineTo(1.275,2.38);shape.absarc(0,2.38,1.275,0,Math.PI,false);shape.closePath();
  const pane=mesh(house,new T.ShapeGeometry(shape),glazing,'Arched glazed patio bay',world(820,v,y));pane.rotation.y=Math.PI/2;
  for(const dv of [-11,0,11])wall(house,'Window vertical mullion',820,v+dv,820,v+dv+.01,y,3.1,wood,.05);
  for(const dh of [1.2,2.36])wall(house,'Window horizontal mullion',820,v-16.3,820,v+16.3,y+dh,.06,wood,.06);
 }
 wall(house,'Patio facade north end',818,398,818,452,y,4.0);
 wall(house,'Patio facade south end',818,712,818,737,y,4.0);
 for(const v of [478,530,582,634,686])opening(house,'Interior communicating arch',753,v,2.65,3.25,1.93,52*s,.6,y,cream);
 wall(house,'Gallery divider north end',753,398,753,452,y,4,cream);
 wall(house,'Gallery divider south end',753,712,753,737,y,4,cream);
 wall(house,'Main north wall',650,398,858,398,y,4);
 wall(house,'Main south wall west of lower room entrance',650,737,702,737,LEVELS.darkRoom,4.51);
 wall(house,'Main south wall east of lower room entrance',743,737,775,737,LEVELS.darkRoom,4.51);
 wall(house,'Lower room entrance lintel',702,737,743,737,y+2.8,1.2,wood,.36);
 rectangularDoor(house,'Gallery to fireplace room',796,737,2.35,3.0,43*s,y,0,cream);
 // Timber beams and lower wall paneling make the interior scale readable.
 for(const v of [461,513,565,617,669,720]){rect(house,'Gallery ceiling beam',655,v-1,755,v+1,y+3.85,.19,wood);}
 rect(house,'Gallery front wainscot',651,400,654,589,y,.9,wood);rect(house,'Gallery front wainscot',651,633,654,735,y,.9,wood);
 // USER-08 purple annotation locates the fireplace room in the lower-right wing.
 // Its former north-side proxy is now an ordinary closed secondary room.
 rect(house,'North secondary room',753,398,859,452,y,4,stucco);
 rect(house,'Fireplace room floor — user confirmed footprint',770,740,900,817,y-.25,.25,parquet);
 wall(house,'Red room fireplace wall',770,817,900,817,y,4.2,red);
 rectangularDoor(house,'Wooden room to fireplace doorway',770,777,2.3,3.05,77*s,y,Math.PI/2,red);
 wall(house,'Fireplace connecting doorway crown',770,740,770,817,y+4,.2,red,.5);
 wall(house,'Red room north wall',817,737,900,737,y,4.2,red);
 rectangularDoor(house,'Red room patio exit',900,777,2.2,3.05,80*s,y,Math.PI/2,red);
 wall(house,'Fireplace wing exterior',770,821,900,821,y,4.2,stucco);
 rectangularDoor(house,'Fireplace wing exterior portal',904,777,2.2,3.05,80*s,y);
 wall(house,'Fireplace exit wall crown',900,737,900,817,y+4,.2,red,.5);
 wall(house,'Fireplace exterior wall crown',904,737,904,817,y+4,.2,stucco,.5);
 for(const [u1,v1,u2,v2] of [[772,815,898,815],[772,742,772,760],[772,794,772,815],[819,740,898,740]])wall(house,'Red room timber wainscot',u1,v1,u2,v2,y,1.02,wood,.1);
 rect(house,'Fireplace dark opening',809,805,845,813,y,2.35,wood);
 for(const u of [805,849]){box(house,'Carved fireplace support proxy',u,804,6,10,y,2.35,stone);ellipsoid(house,'Fireplace corbel',u,801,y+1.85,.24,.36,.23,stone);}
 box(house,'Fireplace mantel',827,804,54,13,y+2.35,.25,stone);
 box(house,'Fireplace hearth',827,798,62,24,y,.14,cream);
 box(house,'Portrait dark frame',827,813,18,2,y+2.75,1.45,wood);
 box(house,'Portrait gilt inset',827,811.7,16.8,.8,y+2.8,1.35,gold);
 box(house,'Portrait blue field placeholder',827,811,15.5,.6,y+2.84,1.27,material('Portrait placeholder blue',0x244a76));
 // Original geometric color study: blue ground, dark hair and a red garment.
 // A finished painting texture can replace this study without moving the frame.
 const portraitHair=material('Portrait umber',0x483021),portraitSkin=material('Portrait warm ochre',0xbe9666),portraitDress=material('Portrait vermilion',0x9c392a);
 ellipsoid(house,'Portrait hair study',827.8,810,y+3.64,.25,.4,.018,portraitHair);
 ellipsoid(house,'Portrait red garment study',827,809.7,y+3.1,.38,.21,.015,portraitDress);
 ellipsoid(house,'Portrait shoulder study',827,809.5,y+3.34,.26,.19,.015,portraitSkin);
 ellipsoid(house,'Portrait face study',826.2,809.4,y+3.74,.15,.21,.013,portraitSkin);
 for(const u of [800,854]){cylinder(house,'Mantel fern pot',u,803,y+2.6,.22,.33,iron);ellipsoid(house,'Fern foliage proxy',u,803,y+3.0,.53,.35,.45,hedge);}
 // Coffered dark timber ceiling, broad rug and sparse furniture establish the room.
 rect(house,'Fireplace room woven rug',788,753,880,791,y+.01,.02,material('Faded wine rug',0x714b3d));
 for(const u of [778,804,830,856,882])rect(upper,'Fireplace ceiling coffer',u,741,u+2,815,y+3.98,.14,wood);
 for(const v of [746,770,795,814])rect(upper,'Fireplace ceiling cross beam',774,v,898,v+2,y+3.96,.16,wood);
 for(const u of [797,875]){box(house,'Lounge chair seat',u,771,12,12,y+.4,.24,wood);box(house,'Lounge chair back',u,777,12,3,y+.55,.65,wood);}
 // Galerie reference: patio-side gallery has terracotta paving and a plaster vault.
 rect(house,'Terracotta gallery paving',757,453,813,731,y,.025,material('Terracotta gallery paving',0xb47c59));
 for(let v=459;v<726;v+=15)wall(house,'Gallery paving joint',758,v,813,v,y+.028,.008,stone,.016);
 for(let u=762;u<813;u+=15)wall(house,'Gallery paving joint',u,455,u,730,y+.028,.008,stone,.016);
 const vaultMat=cream.clone();vaultMat.name='Vaulted cream plaster';vaultMat.side=T.DoubleSide;
 // A higher, shallower vault exposes both arch crowns while staying below the upper floor.
 const vaultSpring=3.73,vaultRise=.27;
 const vp=[],vi=[],count=32;for(let j=0;j<2;j++)for(let i=0;i<=count;i++){const angle=Math.PI*i/count;vp.push((785.5-820)*s+Math.cos(angle)*2.18,y+vaultSpring+Math.sin(angle)*vaultRise,((j?731:451)-600)*s);}
 for(let i=0;i<count;i++)vi.push(i,i+1,i+count+1,i+1,i+count+2,i+count+1);
 const vg=new T.BufferGeometry();vg.setAttribute('position',new T.Float32BufferAttribute(vp,3));vg.setIndex(vi);vg.computeVertexNormals();mesh(upper,vg,vaultMat,'Plaster barrel-vault proxy — Galerie reference');
 for(const v of [476,529,582,635,688]){cylinder(house,'Gallery pendant chain',786,v,y+2.8,.018,vaultSpring+vaultRise-2.8,iron);cylinder(house,'Gallery hanging lantern',786,v,y+2.55,.17,.33,glow);}
 // Cover the red room, keeping its colored wall treatment within the building.
 rect(upper,'Fireplace room ceiling',770,737,900,821,y+4.15,.15,wood);
 rect(upper,'Fireplace-room upper mass',764,735,904,828,y+4.3,2.8,stucco);
 roof(upper,'Fireplace wing roof',759,730,909,833,y+7.1,.9);
 // Secondary footprints traced from the supplied plan; closed service rooms stay simple.
 const wings=[['North rooms',700,243,817,398,4.0],['North garden wing',820,252,943,395,7.1],['South library wing',464,738,647,889,7.8],['Service east',473,330,647,463,4.0],['Service north',450,180,707,331,4.0],['Garage range',147,146,396,330,3.8]];
 for(const [name,u1,v1,u2,v2,h] of wings){rect(house,name+' floor',u1,v1,u2,v2,y-.28,.28,stone);const wGroup=h>4?upper:house;rect(wGroup,name+' closed volume',u1,v1,u2,v2,y,h,stucco);roof(upper,name+' roof',u1-5,v1-5,u2+5,v2+5,y+h,.9);for(let v=v1+22;v<v2-10;v+=42)windows(wGroup,u2+.8,v,'x',y+1.2);}
 // Main upper story shell; inaccessible in the review and future level.
 rect(upper,'Main upper floor behind loggia',674,398,819,738,y+4.05,3.1,stucco);
 for(const [v1,v2] of [[398,488],[715,738]])rect(upper,'Loggia end wing',650,v1,674,v2,y+4.05,3.1,stucco);
 rect(upper,'Recessed front loggia floor',645,488,675,715,y+4.05,.18,stone);
 wall(upper,'Loggia low parapet',648,488,648,715,y+4.23,.55,stucco,.28);
 for(let v=489;v<=715;v+=28.2){cylinder(upper,'Front loggia stone column',648,v,y+4.6,.13,2.4,cream);cylinder(upper,'Loggia column capital',648,v,y+6.86,.22,.16,stone);}
 wall(upper,'Loggia timber lintel',648,488,648,715,y+7.0,.15,wood,.27);
 // Court-facing wing details use the new frontal photograph as their guide.
 for(const [u,v1,v2] of [[473,343,451],[464,752,875]])for(let v=v1;v<v2;v+=41){
  windows(house,u-.8,v,'x',y+.9,1.25,1.7);windows(upper,u-.8,v,'x',y+4.7,1.18,1.5);
  for(const dv of [-7,-3.5,0,3.5,7])cylinder(house,'Wrought iron window grille',u-2,v+dv,y+.82,.018,1.92,iron);
 }
 for(const [v,sign] of [[465,1],[736,-1]])for(const u of [500,548,598]){
  windows(house,u,v,'z',y+1.1,1.2,1.65);
  for(const du of [-7,-3.5,0,3.5,7])cylinder(house,'Court-facing window grille',u+du,v+sign,y+1.03,.018,1.9,iron);
  box(groups.Planting,'Court edge clipped hedge',u,v+sign*12,45,11,8,.74,hedge);
 }
 for(const v of [478,530,582,634,686])windows(upper,821,v,'x',y+4.65,1.15,1.55);
 roof(upper,'Long main tiled roof',645,393,825,743,y+7.15,1.15);
 for(const [u,v] of [[707,414],[879,753],[588,759],[878,276]]){box(upper,'Stucco chimney',u,v,14,14,y+7.1,1.3,stucco);box(upper,'Chimney crown',u,v,20,20,y+8.35,.15,cream);box(upper,'Chimney dark vent',u,v,12,12,y+8.52,.3,iron);}
 for(const [u,v1,v2] of [[945,259,388],[907,744,818]]){rect(upper,'Projecting wing balcony',u-4,v1,u+18,v2,y+3.5,.22,cream);balustrade(upper,u+18,v1,u+18,v2,y+3.72);balustrade(upper,u-4,v1,u+18,v1,y+3.72);balustrade(upper,u-4,v2,u+18,v2,y+3.72);}
 // User correction: these stairs descend to an empty timber room, not upstairs.
 const low=LEVELS.darkRoom,darkTimber=material('Dark room aged timber',0x241812,.96),panel=material('Dark room panel relief',0x34231a,.91);
 rect(house,'Lower wooden room floor',657,737,770,901,low-.25,.25,darkTimber);
 for(let i=0;i<3;i++)rect(house,'Three shallow descending steps',702,707+i*10,743,717+i*10,low-.15,.15+(2-i)*.17,darkTimber);
 for(let i=0;i<3;i++)rect(house,'Descending tread nosing',702,716.4+i*10,743,717+i*10,low+(2-i)*.17+.004,.007,panel);
 for(const u of [700,745])wall(house,'Stair side timber trim',u,706,u,737,low,.66,panel,.12);
 wall(house,'Dark room exterior west',657,738,657,901,low,4.51,stucco);
 wall(house,'Dark room exterior south',657,901,770,901,low,4.51,stucco);
 wall(house,'Dark room exterior east',770,817,770,901,low,4.51,stucco);
 for(const [a,b,c,d] of [[660,740,660,898],[660,898,767,898],[767,819,767,898]])wall(house,'Dark room full-height wooden lining',a,b,c,d,low,4.25,darkTimber,.14);
 for(let v=746;v<891;v+=14){box(house,'Vertical timber panel stile',662,v,2,1,low,3.65,panel);if(v>818)box(house,'East wall panel stile',765,v,2,1,low,3.65,panel);}
 for(let u=667;u<764;u+=14)box(house,'End-wall timber panel stile',u,896,1,2,low,3.65,panel);
 for(let u=662;u<766;u+=8)rect(house,'Dark floor plank seam',u,739,u+.4,898,low+.004,.005,panel);
 rect(upper,'Dark room timber ceiling',657,737,770,901,11.95,.2,darkTimber);
 for(let v=749;v<896;v+=28)rect(upper,'Dark room ceiling beam',658,v,769,v+2,11.76,.2,panel);
 rect(upper,'Southern hall upper closed floor',657,739,770,901,12.15,2.8,stucco);
 roof(upper,'Southern hall roof',652,734,775,906,14.95,.9);
 // The connecting threshold rises three shallow steps to the existing fireplace floor.
 for(let i=0;i<3;i++)rect(house,'Wooden steps into fireplace room',740+i*10,762,750+i*10,792,low-.15,.15+(i+1)*.17,darkTimber);
 wall(house,'Foundation below fireplace connecting wall',770,740,770,817,low-.25,.76,red,.5);
 for(const [v1,v2] of [[740,762],[792,817]])wall(house,'Timber lining beside fireplace doorway',766.5,v1,766.5,v2,low,4.25,darkTimber,.15);
 wall(house,'Timber doorway lintel',766.5,762,766.5,792,y+2.9,1.35,darkTimber,.15);
 rect(house,'Fireplace connecting threshold',766,762,780,792,y-.175,.17,wood);
 // Plan-traced terrace and lateral loggia.
 const terrace=groups.Terraces;
 slab(terrace,'Main upper patio',[[818,399],[973,399],[973,484],[976,484],[976,728],[907,728],[907,739],[818,739]],7.8,.35,stone,[{u:PATIO_FOUNTAIN.u,v:PATIO_FOUNTAIN.v,r:2.37}]);
 slab(terrace,'Fireplace exit terrace',[[904,735],[970,735],[970,863],[774,863],[774,828],[904,828]],7.8,.35,stone);
 // Faceted side terrace footprint follows the supplied plan. Rail treatment is
 // photograph-guided; its outer landscaping intentionally closes the bypass.
 slab(terrace,'Raised west-side patio',WEST_PATIO,7.77,.38,stone);
 for(let i=1;i<WEST_PATIO.length;i++){const a=WEST_PATIO[i],b=WEST_PATIO[(i+1)%WEST_PATIO.length];wall(terrace,'West patio retaining wall',...a,...b,5.2,2.57,stucco,.4);balustrade(terrace,...a,...b,8.15);}
 rect(terrace,'Raised lateral deck',943,281,1265,395,10.93,.3,stone);
 for(let u=969;u<1250;u+=53)opening(terrace,'Lower loggia arch',u,394,2.65,3.1,1.775,53*s,.55,8.15,stucco,0);
 rect(terrace,'Loggia side wall',1252,287,1266,393,8.15,3.0,stucco);
 balustrade(terrace,946,395,1265,395,11.24);balustrade(terrace,1265,395,1265,287,11.24);
 // Low parapets leave the paired garden stairs open.
 for(const [v1,v2] of [[404,479],[539,653],[713,733]]){wall(terrace,'Patio retaining wall',980,v1,980,v2,5.1,4.0,stucco,.55);wall(terrace,'Terracotta patio coping',980,v1,980,v2,9.1,.1,tile,.67);}
 stairs(terrace,976,1016,481,535,8.15,5.4);stairs(terrace,976,1016,657,712,8.15,5.4);
 // Fountain in upper patio: massing of the original sculptural fountain.
 // Terraced formal garden, water channels and paired stairways.
 const pg=groups.Pool_and_cascades;
 for(const [a,b,h] of [[1016,1135,5.4],[1165,1280,4],[1315,1343,2.2]]){
  for(const [v1,v2] of [[432,548],[652,760]]){
   if(a===1016){
    const top=v1<600;
    rect(terrace,top?'Second terrace north fountain patio':'Second terrace south fountain patio',1009,top?402:652,1135,top?548:800,h-.3,.3,stone);
    for(let u=1020;u<1135;u+=16)wall(terrace,'Fountain patio paving joint',u,top?403:653,u,top?547:799,h+.005,.006,tileLight,.012);
    for(let v=top?407:657;v<(top?548:800);v+=16)wall(terrace,'Fountain patio transverse joint',1010,v,1134,v,h+.005,.006,tileLight,.012);
   }else rect(terrace,'Terraced lawn',a,v1,b,v2,h-.3,.3,grass);
   rect(terrace,'Paved garden path',a,v1<600?548:630,b,v1<600?570:652,h-.22,.22,stone);
   // Keep the outer formal hedges; the two inner strips now hold maze passages.
   if(a!==1016&&a!==1315)for(const v of [v1+8,v2-8].filter(v=>v<524||v>678))box(groups.Planting,'Low formal hedge',(a+b)/2,v,b-a-8,7,h,.55,hedge);
  }
  const bath=GARDEN_BASINS.find(item=>item.u1===a);
  const bed=rect(pg,'Shallow terrace basin bed — '+bath.id,a,582,b,620,bath.bed-.16,.16,basin);
  bed.userData={waterRegion:bath.id,depth:bath.surface-bath.bed};
  for(const [v1,v2] of [[582,586],[616,620]])rect(pg,'Terrace basin side lining',a,v1,b,v2,bath.bed-.16,h-bath.bed+.16,basin);
  if(a===1016)rect(pg,'Upper watercourse head wall',1014,582,1016,620,bath.bed-.16,h-bath.bed+.16,cream);
  for(const v of [580,622])box(pg,'Channel stone coping',(a+b)/2,v,b-a,5,h-.05,.12,cream);
 }
 for(const cascade of GARDEN_CASCADES){
  const {u1:a,u2:b,from,to,steps}=cascade;
  stairs(terrace,a,b,547,571,from+.16,to+.16);stairs(terrace,a,b,630,654,from+.16,to+.16);
  for(let i=0;i<steps;i++){
   const u=a+(b-a)*i/steps,end=a+(b-a)*(i+1)/steps,top=from+(to-from)*i/steps-.035;
   rect(pg,'Cascade stone tread',u,584,end,618,top-.22,.22,cream);
   for(const [v1,v2] of [[581,586],[616,621]])rect(pg,'Cascade side curb',u,v1,end,v2,top-.3,.43,cream);
  }
 }
 rect(pg,'Pool inlet stone chute',1343,584,1361,618,1.8,.20,cream);
 // Lower pool: shaped perimeter, scaled to 74'9" length; depth is an estimate.
 rect(terrace,'North stair-to-pool landing',1315,518,1358,572,1.97,.23,stone);
 rect(terrace,'South stair-to-pool landing',1315,630,1358,682,1.97,.23,stone);
 const pool=MAIN_POOL.polygon;
 const outer=pool.map(([u,v])=>[1508+(u-1508)*1.09,601+(v-601)*1.27]);
 // Split the west coping into two pieces to leave the central cascade inlet open.
 for(let i=0;i<pool.length;i++){
  const next=(i+1)%pool.length,a=pool[i],b=pool[next],oa=outer[i],ob=outer[next];
  if(i===pool.length-1){
   const at=v=>{const f=(v-a[1])/(b[1]-a[1]);return [oa[0]+(ob[0]-oa[0])*f,oa[1]+(ob[1]-oa[1])*f];};
   slab(pg,'Pool coping beside inlet',[[a[0],616],a,oa,at(616)],1.97,.23,stone);
   slab(pg,'Pool coping beside inlet',[b,[b[0],586],at(586),ob],1.97,.23,stone);
  }else slab(pg,'Pool coping ring segment',[a,b,ob,oa],1.97,.23,stone);
 }
 slab(pg,'Pool floor',pool,0,.14,basin);
 for(let i=0;i<pool.length;i++){const a=pool[i],b=pool[(i+1)%pool.length];wall(pg,'Pool basin wall',a[0],a[1],b[0],b[1],.05,1.9,basin,.2);wall(pg,'Pool tile band',a[0],a[1],b[0],b[1],1.76,.2,basin,.24);}
 for(let i=0;i<5;i++)rect(pg,'Pool entry step',1360+i*5,580,1366+i*5,625,1.7-i*.32,.18,cream);
 // Poolside pavilions: footprint from plan, column rhythm from supplied photographs.
 function pavilion(u1,v1,u2,v2,side){
  const g=groups.Pavilions;rect(g,'Pavilion platform',u1-5,v1-5,u2+5,v2+5,1.9,.3,stone);
  const facing=side==='top'?v2:v1;
  rect(g,'Pavilion rear wall',u1,side==='top'?v1:v2-4,u2,side==='top'?v1+4:v2,2.2,3.95,stucco);
  for(let i=0;i<4;i++){const u=u1+(i+.5)*(u2-u1)/4;opening(g,'Pointed pavilion arch',u,facing,1.55,3.35,2.05,(u2-u1)*s/4,.3,2.2,stucco,0,true);}
  for(let i=0;i<=4;i++){const u=u1+i*(u2-u1)/4;cylinder(g,'Slender pavilion column',u,facing,2.2,.10,2.1,cream);cylinder(g,'Column base',u,facing,2.2,.18,.16,cream);cylinder(g,'Column capital',u,facing,4.15,.2,.17,cream);}
  // Side arcades add depth, as seen in pool photos.
  for(const u of [u1,u2])for(let i=0;i<3;i++){const v=v1+(i+.5)*(v2-v1)/3;opening(g,'Pavilion side arch',u,v,1.55,3.35,2.05,(v2-v1)*s/3,.28,2.2,stucco,Math.PI/2,true);}
  roof(g,'Pavilion tiled roof',u1-4,v1-4,u2+4,v2+4,6.2,.85);
 }
 pavilion(1516,379,1639,500,'top');pavilion(1516,700,1594,818,'bottom');
 // Central decorative screen is photograph-derived; simplified plan omits its profile.
 for(let i=0;i<7;i++){opening(groups.Pavilions,'Far-end pointed arcade',1683,551+i*16,1.02,3.35,2.2,16*s,.27,2.2,stucco,Math.PI/2,true);cylinder(groups.Pavilions,'Arcade column',1683,543+i*16,2.2,.085,2.2,cream);}
 cylinder(groups.Pavilions,'Arcade end column',1683,655,2.2,.085,2.2,cream);
 // Provide a broad, open far-end exit zone in front of the decorative screen.
 rect(terrace,'Far pool end exit landing',1660,531,1682,672,1.98,.22,stone);
 // Both octagonal fountain pools sit wholly within the broad paved second tier.
 for(const v of [459,741]){
  slab(terrace,'Second terrace octagonal fountain coping',octagon(1058,v,26),5.4,.28,cream);
  slab(terrace,'Second terrace fountain pool',octagon(1058,v,21.5),5.685,.025,water);
  cylinder(terrace,'Side fountain pedestal',1058,v,5.72,.17,.64,stone);
  cylinder(terrace,'Side fountain bowl',1058,v,6.32,.4,.16,cream,.3);
 }
 // Planting silhouettes: replace with detailed foliage assets after proportions agree.
 for(const [a,b,h] of [[1040,1130,5.4],[1165,1275,4],[1315,1410,2.2]])for(const v of (a===1315?[500,700]:a===1165?[516,704]:[516,681]))for(let u=a+10;u<=b;u+=55){cylinder(groups.Planting,'Topiary pot',u,v,h,.45,.3,stucco);ellipsoid(groups.Planting,'Clipped topiary',u,v,h+1.2,.62,1.05,.62,hedge);}
 for(const v of [416,789]){for(let u=1088;u<=1510;u+=32){const h=gardenHeight(u);ellipsoid(groups.Planting,'Tall boundary hedge',u,v,h+3.55,1.35,3.6,1.3,hedge);}}
 let seed=7821;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 function tree(u,v,h,scale=1,crownLift=0){const g=groups.Planting;cylinder(g,'Tree trunk',u,v,h,.22*scale,4.8*scale+crownLift,bark);for(let i=0;i<4;i++)ellipsoid(g,'Broadleaf canopy',u+(rand()-.5)*20,v+(rand()-.5)*20,h+(5.2+rand()*1.5)*scale+crownLift,2.3*scale,2*scale,2.4*scale,leaf);}
 for(let i=0;i<145;i++){const u=40+rand()*2420,v=i<40?30+rand()*110:840+rand()*670;if(nearPolyline(u,v,DRIVE).distance<95||nearPolyline(u,v,SIDE_DRIVE).distance<62||Math.hypot(u-pad.u,v-pad.v)<95||(Math.abs(u-CHURRO_TENT.u)<70&&Math.abs(v-CHURRO_TENT.v)<78))continue;tree(u,v,terrainHeight(u,v),.75+rand()*.65);}
 for(const [u,v] of [[1190,359],[1290,354],[1430,335],[1740,499],[1740,712],[309,780],[88,675]])tree(u,v,terrainHeight(u,v),1.05);
 function palm(u,v,height){const g=groups.Planting,h=terrainHeight(u,v);cylinder(g,'Palm trunk',u,v,h,.16,height,bark);for(let i=0;i<9;i++){const a=i/9*Math.PI*2;const start=world(u,v,h+height),mid=[start[0]+Math.cos(a)*1.8,start[1]+.7,start[2]+Math.sin(a)*1.8],end=[start[0]+Math.cos(a)*3.2,start[1]-.85,start[2]+Math.sin(a)*3.2];line(g,'Palm frond',[start,mid,end],.13,leaf);}}
 for(const [u,v,h] of [[726,210,16],[1080,205,19],[1175,179,17],[1300,250,15],[481,993,15],[501,1053,17]])palm(u,v,h);
 for(const v of [536,665])for(const u of [1065,1218,1404,1634])lamp(u,v,gardenHeight(u));
 for(const [u,v,h] of [[628,581,8],[628,640,8]])lamp(u,v,h);
 // Closely spaced trunks and undergrowth form continuous approach boundaries.
 const roadCurve=new T.CatmullRomCurve3(DRIVE.map(p=>new T.Vector3(...world(...p))));
 const roadLength=roadCurve.getLength(),roadCount=Math.ceil(roadLength/2.15);
 for(let i=2;i<roadCount-7;i++){
  const t=i/roadCount,c=roadCurve.getPointAt(t),dir=roadCurve.getTangentAt(t),n=new T.Vector3(-dir.z,0,dir.x).normalize();
  for(const sign of [-1,1]){
   const p=c.clone().addScaledVector(n,sign*4.9),u=p.x/s+820,v=p.z/s+600;
   // Open the trailer spur and catering turnout toward the road.
   if((u<360&&v>973&&v<1110)||(u<335&&v>805&&v<955)||Math.hypot(u-354,v-1090)<50)continue;
   if(i%9!==0)ellipsoid(groups.Planting,'Driveway boundary undergrowth',u,v,c.y+1.35,1.3,1.5,1.3,hedge);
   if(i%3===0)tree(u,v,c.y-.18,.83+rand()*.12,1.5); // lift roadside crowns above the coach roof
   if(i%9===0){const q=c.clone().addScaledVector(n,sign*4.0);statue(q.x/s+820,q.z/s+600,c.y,Math.atan2(dir.x,dir.z));}
   if(i%12===4){const q=c.clone().addScaledVector(n,sign*3.65);lamp(q.x/s+820,q.z/s+600,c.y,drivewayGlass);}
  }
 }
 for(const points of BYPASS_HEDGES)for(let i=1;i<points.length;i++){
  const a=points[i-1],b=points[i],n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/17);
  for(let j=0;j<=n;j++){const u=a[0]+(b[0]-a[0])*j/n,v=a[1]+(b[1]-a[1])*j/n,h=terrainHeight(u,v);ellipsoid(groups.Planting,'Continuous no-bypass hedge',u,v,h+1.7,1.1,1.8,1.1,hedge);}
 }
 for(const v of [545,675]){tree(554,v,8,.95);cylinder(groups.Planting,'Entry topiary trunk',608,v,8,.09,1.5,bark);ellipsoid(groups.Planting,'Entry clipped umbrella',608,v,10.1,1.2,.95,1.2,hedge);}
 // User removed the side-drive barrier and its piers across from Union Toilets.
 // Main entrance piers support the animated double leaves at Beverly Drive. No statues stand
 // beside them: the leaves swing through that space as they open.
 const gateCenter=roadCurve.getPointAt(.055),gateDir=roadCurve.getTangentAt(.055),gateNormal=new T.Vector3(-gateDir.z,0,gateDir.x).normalize();
 for(const sign of [-1,1]){const p=gateCenter.clone().addScaledVector(gateNormal,sign*4.1),u=p.x/s+820,v=p.z/s+600;box(groups.Driveway,'Beverly Drive entrance pier',u,v,13,13,p.y,3.1,stucco);lamp(u,v,p.y+3.1,drivewayGlass);}
 house.traverse(o=>{if(o.isMesh&&o.name.startsWith('Portrait '))o.position.y-=.18;});
 const setPieces=buildBeverlySetPieces(T,root,groups,mats);
 const gardenWater=buildGardenWater(T,root,groups,mats);
 const maze=buildBeverlyMaze(T,root,groups,mats);
 const patioFountain=buildPatioFountain(T,root,groups,mats);
 root.userData.futureStory=FUTURE_STORY;
 const churroTent=buildChurroTent(T,root,groups,mats);
 const partyBus=buildPartyBus(T,root,groups,mats);
 const passengers=buildBeverlyPassengers(T,root,groups,mats,partyBus);
 const artwork=buildGalleryArtwork(T,root,groups,mats,paintingTexture);
 const hallArtwork=buildGalleryArtwork(T,root,groups,mats,hallPaintingTexture,WORDS_LOSE_ART);
 const performance=buildPatioPerformance(T,root,groups,mats,logoTexture);
 const guests=buildBeverlyGuests(T,root,groups,mats);
 const stubby=buildBeverlyStubby(T,root,groups,mats);
 const drowningRemains=buildDrowningRemains(T,root,groups);
 const story=buildBeverlyStory(T,root,groups,guests,drowningRemains,churroTent);
 const filmCrew=buildBeverlyFilmCrew(T,root,groups,mats);
 const drivewayCameraman=buildDrivewayCameraman(T,root,groups,partyBus,filmCrew);
 const patioBubbles=buildPatioBubbles(T,root,groups,mats);
 root.userData.partyBus=partyBus.group.userData;
 root.updateMatrixWorld(true);
 root.userData.driveway='USER-07 registered to USER-04; hidden bends and elevations estimated';
 root.userData.fireplaceRoom='USER-08 purple annotation: plan rectangle 770,740 to 900,817';
 root.userData.navigation='Walk boundaries and obstacle probes in src/beverly-navigation.js; not embedded physics';
 return {root,groups,materials:mats,maze,stubby,gardenWater,patioFountain,churroTent,partyBus,passengers,artwork,hallArtwork,performance,guests,story,drowningRemains,filmCrew,drivewayCameraman,patioBubbles,drivewayPaint,...setPieces,animations:[...setPieces.animations,...partyBus.animations]};
}
