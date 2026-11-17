import {Font} from '../vendor/FontLoader.js';
import fontData from '../vendor/beverly-font.js';
import {SIDE_DRIVE,world} from './beverly-layout.js';

// One continuous line bends along the unused drive, sideways from the overview.
export const DRIVEWAY_MESSAGE={text:'are you missing something?',start:.55,end:.97,height:2.65};

export function buildDrivewayPaint(T,groups,materials,road){
 const spec=DRIVEWAY_MESSAGE,group=new T.Group();group.name='Spray-painted driveway message';
 group.userData={preserveGeometry:true,text:spec.text,location:'Unused southern driveway, user-marked dead end',surface:'Paint directly on paving; no collision'};
 groups.Driveway.parent.add(group);groups.Driveway_message=group;
 const paint=new T.MeshStandardMaterial({name:'Driveway charcoal spray paint',color:0x302735,roughness:1,emissive:0x231c2b,emissiveIntensity:.08,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
 materials[paint.name]=paint;
 const curve=new T.CatmullRomCurve3(SIDE_DRIVE.map(p=>new T.Vector3(...world(...p)))),length=curve.getLength(),font=new Font(fontData);
 const ray=new T.Raycaster(),down=new T.Vector3(0,-1,0);road.updateMatrixWorld(true);
 let seed=317;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 function project(geo){
  const pos=geo.attributes.position;
  for(let i=0;i<pos.count;i++){
   const t=spec.start+pos.getX(i)/length,p=curve.getPointAt(t),d=curve.getTangentAt(t),y=pos.getY(i);
   const n=new T.Vector3(d.z,0,-d.x).normalize();p.addScaledVector(n,y);
   ray.set(new T.Vector3(p.x,40,p.z),down);const hit=ray.intersectObject(road,false)[0];
   if(!hit)throw new Error('Driveway paint extends beyond the paving');
   pos.setXYZ(i,p.x,hit.point.y+.025,p.z);
  }
  pos.needsUpdate=true;geo.computeVertexNormals();return geo;
 }
 function add(geo,mat,name){const mesh=new T.Mesh(geo,mat);mesh.name=name;group.add(mesh);return mesh;}
 {
  const text=spec.text;
  const shapes=font.generateShapes(text,1),geo=new T.ShapeGeometry(shapes,5);geo.computeBoundingBox();
  const size=geo.boundingBox.getSize(new T.Vector3()),center=geo.boundingBox.getCenter(new T.Vector3());
  const left=geo.boundingBox.min.x,sx=(spec.end-spec.start)*length/size.x,sy=spec.height/size.y;
  geo.translate(-left,-center.y,0);geo.scale(sx,sy,1);
  // Charcoal paint contrasts with the pale paving; fine mist breaks up its edge.
  const main=add(project(geo.clone()),paint,text);main.userData.text=text;
  const dots=[];
  for(const shape of shapes)for(const path of [shape,...shape.holes])for(const p of path.getPoints(8)){
   if(random()>.6)continue;
   const x=(p.x-left)*sx+(random()-.5)*.13,y=(p.y-center.y)*sy+(random()-.5)*.13,r=.008+random()*.018;
   dots.push(x-r,y-r,0,x+r,y-r,0,x,y+r,0);
  }
  const spray=new T.BufferGeometry();spray.setAttribute('position',new T.Float32BufferAttribute(dots,3));
  add(project(spray),paint,'Fine paint mist');geo.dispose();
 }
 return {group,spec};
}
