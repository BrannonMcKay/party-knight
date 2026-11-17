import {world,LEVELS} from './beverly-layout.js';
import {Font} from '../vendor/FontLoader.js';
import fontData from '../vendor/beverly-font.js';

export const PARTY_KNIGHT_ART={
 title:'Party Knight',artist:'Misty Ogle',wallCard:'Painting by Misty Ogle',image:'../assets/party-knight-misti-ogle.png',
 // The names the exported model already carries; the artist's name is spelled Misty.
 group:'Gallery_artwork',material:'Party Knight — Misti Ogle',mesh:'Party Knight painting by Misty Ogle',
 source:'User-supplied photograph of artwork created for the song Party Knight',location:'End wall of the patio-side gallery',
 u:785.5,v:452,width:2.12,height:2.12,centerHeight:LEVELS.house+1.92,
 // Corners inside the photographed canvas, in top-left image coordinates.
 // UV framing omits the photographed wall without changing the original PNG.
 corners:[[.155,.167],[.842,.164],[.155,.853],[.844,.858]]
};

// Words Lose hangs in the main hall, on the front wall south of the entrance,
// centred between two ceiling beams and clear of the wainscot below it.
export const WORDS_LOSE_ART={
 title:'Words Lose',artist:'Misty Ogle',wallCard:'Painting by Misty Ogle',image:'../assets/words-lose-misty-ogle.jpg',
 group:'Hall_artwork',material:'Words Lose — Misty Ogle',mesh:'Words Lose painting by Misty Ogle',
 source:'User-supplied photograph of the Words Lose painting',location:'Front wall of the main hall, south of the entrance',
 // The plan position is the wall's centre line; `out` is the half thickness of the wall, to its inside face.
 u:650,v:694.5,out:.21,facing:Math.PI/2,width:1.9,height:1.9,centerHeight:LEVELS.house+2.36,
 corners:[[.004,.004],[.996,.004],[.004,.996],[.996,.996]],
 // The hall's own lamps light it; another point light would cost every frame.
 lit:false
};

export function buildGalleryArtwork(T,root,groups,materials,texture=null,art=PARTY_KNIGHT_ART){
 const group=new T.Group();group.name=art.group;
 group.position.set(...world(art.u,art.v,art.centerHeight));group.rotation.y=art.facing??0;
 // Step off the wall's centre line onto its face (the painting's own +Z).
 if(art.out)group.position.add(new T.Vector3(0,0,art.out).applyEuler(group.rotation));
 group.userData={preserveGeometry:true,title:art.title,artist:art.artist,source:art.source,location:art.location,image:art.image};
 root.add(group);groups[art.group]=group;
 if(texture){texture.colorSpace=T.SRGBColorSpace;texture.flipY=false;}
 // Moderate canvas reflectance keeps the saturated paint from washing out under the film lights.
 const paint=new T.MeshStandardMaterial({name:art.material,color:0xb8b8b8,map:texture,roughness:.92});
 paint.userData={artworkImage:art.image,artist:art.artist,title:art.title};materials[paint.name]=paint;
 const geometry=new T.PlaneGeometry(art.width,art.height);
 geometry.setAttribute('uv',new T.Float32BufferAttribute(art.corners.flat(),2));
 const canvas=new T.Mesh(geometry,paint);canvas.name=art.mesh;canvas.position.z=.075;canvas.receiveShadow=true;group.add(canvas);
 // Both paintings share their frame, fittings and wall-card materials.
 const shared=(name,options)=>materials[name]??=new T.MeshStandardMaterial({name,...options});
 const backing=shared('Painting canvas edges',{color:0x242024,roughness:.92});
 const frame=shared('Painting dark walnut frame',{color:0x281d1d,roughness:.65});
 const brass=shared('Painting light brass',{color:0xa88c59,roughness:.4,metalness:.6});
 function block(name,w,h,d,x,y,z,mat){const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat);m.name=name;m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;group.add(m);return m;}
 block('Painting canvas backing',art.width,art.height,.055,0,0,.044,backing);
 const edge=.045,gap=.012,half=art.width/2+gap+edge/2,outer=art.width+2*(gap+edge);
 const lightY=outer/2+.115;
 for(const sign of [-1,1]){
  block('Walnut frame side',edge,outer,.10,sign*half,0,.065,frame);
  block('Walnut frame rail',art.width+2*gap,edge,.10,0,sign*half,.065,frame);
  block('Picture light arm',.025,.025,.30,sign*.25,lightY,.15,brass);
 }
 block('Picture light shade',.76,.06,.12,0,lightY,.30,brass);
 const cardStock=shared('Painting wall card ivory',{color:0xeee9de,roughness:.95});
 const ink=shared('Painting wall card charcoal text',{color:0x211e1c,roughness:.95});
 const cardY=-outer/2-.24;
 const card=block('Painting attribution wall card',1.6,.24,.018,0,cardY,.028,cardStock);card.userData.text=art.wallCard;
 const lettering=new T.ShapeGeometry(new Font(fontData).generateShapes(art.wallCard,.09),5);
 lettering.computeBoundingBox();
 const bounds=lettering.boundingBox,size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
 const fit=Math.min(1,1.42/size.x,.13/size.y);
 lettering.translate(-center.x,-center.y,0);lettering.scale(fit,fit,1);
 const label=new T.Mesh(lettering,ink);label.name=art.wallCard;label.userData.text=art.wallCard;
 label.position.set(0,cardY,.038);label.receiveShadow=true;group.add(label);
 let light=null;
 if(art.lit!==false){light=new T.PointLight(0xffefd6,4,4,2);light.name='Painting picture light';light.position.set(0,lightY-.08,.53);group.add(light);}
 return {group,canvas,light,spec:art};
}
