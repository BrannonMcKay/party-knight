import {world,LEVELS} from './beverly-layout.js';
import {Font} from '../vendor/FontLoader.js';
import fontData from '../vendor/beverly-font.js';

export const PARTY_KNIGHT_ART={
 title:'Party Knight',artist:'Misti Ogle',wallCard:'Painting by Misti Ogle',image:'../assets/party-knight-misti-ogle.png',
 u:785.5,v:452,width:2.12,height:2.12,centerHeight:LEVELS.house+1.92,
 // Corners inside the photographed canvas, in top-left image coordinates.
 // UV framing omits the photographed wall without changing the original PNG.
 corners:[[.155,.167],[.842,.164],[.155,.853],[.844,.858]]
};

export function buildGalleryArtwork(T,root,groups,materials,texture=null){
 const art=PARTY_KNIGHT_ART,group=new T.Group();group.name='Gallery_artwork';
 group.position.set(...world(art.u,art.v,art.centerHeight));
 group.userData={preserveGeometry:true,title:art.title,artist:art.artist,source:'User-supplied photograph of artwork created for the song Party Knight',location:'End wall of the patio-side gallery',image:art.image};
 root.add(group);groups.Gallery_artwork=group;
 if(texture){texture.colorSpace=T.SRGBColorSpace;texture.flipY=false;}
 // Moderate canvas reflectance keeps the saturated paint from washing out under the film lights.
 const paint=new T.MeshStandardMaterial({name:'Party Knight — Misti Ogle',color:0xb8b8b8,map:texture,roughness:.92});
 paint.userData={artworkImage:art.image,artist:art.artist,title:art.title};materials[paint.name]=paint;
 const geometry=new T.PlaneGeometry(art.width,art.height);
 geometry.setAttribute('uv',new T.Float32BufferAttribute(art.corners.flat(),2));
 const canvas=new T.Mesh(geometry,paint);canvas.name='Party Knight painting by Misti Ogle';canvas.position.z=.075;canvas.receiveShadow=true;group.add(canvas);
 const backing=new T.MeshStandardMaterial({name:'Painting canvas edges',color:0x242024,roughness:.92});
 const frame=new T.MeshStandardMaterial({name:'Painting dark walnut frame',color:0x281d1d,roughness:.65});
 const brass=new T.MeshStandardMaterial({name:'Painting light brass',color:0xa88c59,roughness:.4,metalness:.6});
 for(const mat of [backing,frame,brass])materials[mat.name]=mat;
 function block(name,w,h,d,x,y,z,mat){const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat);m.name=name;m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;group.add(m);return m;}
 block('Painting canvas backing',art.width,art.height,.055,0,0,.044,backing);
 const edge=.045,gap=.012,half=art.width/2+gap+edge/2,outer=art.width+2*(gap+edge);
 for(const sign of [-1,1]){
  block('Walnut frame side',edge,outer,.10,sign*half,0,.065,frame);
  block('Walnut frame rail',art.width+2*gap,edge,.10,0,sign*half,.065,frame);
  block('Picture light arm',.025,.025,.30,sign*.25,1.23,.15,brass);
 }
 block('Picture light shade',.76,.06,.12,0,1.23,.30,brass);
 const cardStock=new T.MeshStandardMaterial({name:'Painting wall card ivory',color:0xeee9de,roughness:.95});
 const ink=new T.MeshStandardMaterial({name:'Painting wall card charcoal text',color:0x211e1c,roughness:.95});
 for(const mat of [cardStock,ink])materials[mat.name]=mat;
 const cardY=-outer/2-.24;
 const card=block('Painting attribution wall card',1.6,.24,.018,0,cardY,.028,cardStock);card.userData.text=art.wallCard;
 const lettering=new T.ShapeGeometry(new Font(fontData).generateShapes(art.wallCard,.09),5);
 lettering.computeBoundingBox();
 const bounds=lettering.boundingBox,size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
 const fit=Math.min(1,1.42/size.x,.13/size.y);
 lettering.translate(-center.x,-center.y,0);lettering.scale(fit,fit,1);
 const label=new T.Mesh(lettering,ink);label.name=art.wallCard;label.userData.text=art.wallCard;
 label.position.set(0,cardY,.038);label.receiveShadow=true;group.add(label);
 const light=new T.PointLight(0xffefd6,4,4,2);light.name='Painting picture light';light.position.set(0,1.15,.53);group.add(light);
 return {group,canvas,light,spec:art};
}
