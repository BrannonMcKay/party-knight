// Facial variants and water/ghost poses remain separate from the rigid batches.
export function createStoryRig(T,guest,portrait,limbs,{emily=false}={}){
 const head=guest.head,normalEyes=new T.Group();normalEyes.name='Story normal eyes';head.add(normalEyes);
 const eyeNames=/eye|iris|pupil|eyebrow|brow|eyelash/i;
 for(const child of [...portrait.children])if(eyeNames.test(child.name))normalEyes.add(child);
 const expressions={},white=new T.MeshStandardMaterial({color:0xfff5ed}),ink=new T.MeshStandardMaterial({color:0x251d2d}),pink=new T.MeshStandardMaterial({color:0xdc8c95});
 white.name='Story expression whites';ink.name='Story expression ink';pink.name='Story expression tongue';
 const width=emily?.83:1,depth=emily?.151:.176,sphere=new T.SphereGeometry(1,12,8),up=new T.Vector3(0,1,0);
 function ball(g,name,p,size,mat){const m=new T.Mesh(sphere,mat);m.name=name;m.position.set(...p);m.scale.set(...size);g.add(m);return m;}
 function segment(m,a,b,r){const delta=new T.Vector3(...b).sub(new T.Vector3(...a));m.position.set(...a).addScaledVector(delta,.5);m.scale.set(r,delta.length(),r);m.quaternion.setFromUnitVectors(up,delta.normalize());}
 function stroke(g,name,a,b,r=.007){const m=new T.Mesh(new T.CylinderGeometry(1,1,1,8),ink);m.name=name;g.add(m);segment(m,a,b,r);return m;}
 for(const kind of ['distressed','surprised','happy','excited','joyful','horrified','dead']){
  const face=new T.Group();face.name='Story expression '+kind;head.add(face);expressions[kind]=face;
  for(const sign of [-1,1]){
   const x=sign*.082*width,y=.034;
   if(kind==='dead'){
    for(const diagonal of [-1,1])stroke(face,'Dead X eye',[x-.031*width,y-.034*diagonal,depth+.019],[x+.031*width,y+.034*diagonal,depth+.019],.010);
   }else if(kind==='joyful'){
    // Upturned, laughing eyes distinguish delight from the round shocked eyes.
    for(let j=0;j<8;j++){
     const a=Math.PI*j/8,b=Math.PI*(j+1)/8;
     stroke(face,'Joyful laughing eye',[x+Math.cos(a)*.043*width,y+Math.sin(a)*.027,depth+.018],[x+Math.cos(b)*.043*width,y+Math.sin(b)*.027,depth+.018],.009);
    }
    ball(face,'Joyful rosy cheek',[sign*.117*width,-.054,depth-.006],[.022,.011,.007],pink);
   }else{
    const horror=kind==='horrified';
    ball(face,'Story wide eye',[x,y,depth],[.049*width,kind==='happy'?.025:horror?.057:.043,.015],white);
    ball(face,'Story pupil',[x,y,depth+.014],horror?[.009,.012,.006]:[.013,.021,.006],ink);
    stroke(face,'Story eyebrow',[x-sign*.041,.115+(['distressed','horrified'].includes(kind)?.023:0),depth-.014],[x+sign*.044,horror?.125:.105,depth-.018]);
   }
  }
  if(kind==='joyful'){
   const grin=new T.Shape();grin.moveTo(-.092*width,-.092);grin.quadraticCurveTo(0,-.112,.092*width,-.092);grin.quadraticCurveTo(.080*width,-.188,0,-.193);grin.quadraticCurveTo(-.080*width,-.188,-.092*width,-.092);
   const smile=new T.Mesh(new T.ShapeGeometry(grin,16),ink);smile.name='Joyful broad grin';smile.position.z=depth+.012;face.add(smile);
   const teeth=new T.Shape();teeth.moveTo(-.077*width,-.107);teeth.quadraticCurveTo(0,-.124,.077*width,-.107);teeth.quadraticCurveTo(.064*width,-.158,0,-.164);teeth.quadraticCurveTo(-.064*width,-.158,-.077*width,-.107);
   const toothy=new T.Mesh(new T.ShapeGeometry(teeth,16),white);toothy.name='Joyful toothy smile';toothy.position.z=depth+.015;face.add(toothy);
  }else if(kind==='happy'||kind==='excited'){
   const big=kind==='excited'?1.25:1;
   ball(face,'Story smile',[0,-.132,depth-.004],[.065*width*big,.041*big,.012],ink);
   ball(face,'Story smiling teeth',[0,-.119,depth+.008],[.054*width*big,.022*big,.005],white);
  }else{
   ball(face,'Story open mouth',[0,-.139,depth-.005],[(kind==='horrified'?.055:.043)*width,kind==='dead'?.015:kind==='horrified'?.068:.052,.012],ink);
   if(kind==='distressed'||kind==='horrified')ball(face,'Story tongue',[0,-.168,depth+.008],[.026,.012,.004],pink);
  }
  face.visible=false;
 }
 function update(time){
  const mode=expressions[guest.expression]?guest.expression:null;
  normalEyes.visible=!mode;for(const [key,face] of Object.entries(expressions))face.visible=key===mode;
  if(mode)for(const mouth of [guest.neutral,guest.talking,guest.burp,guest.smile])if(mouth)mouth.visible=false;
  const water=guest.waterPose;if(!water)return;
  const struggle=water==='struggling',spirit=water==='spirit',reach=spirit?T.MathUtils.clamp(guest.spiritProgress??1,0,1):0;
  guest.body.rotation.set(struggle?Math.sin(time*8)*.07:0,0,struggle?Math.sin(time*11)*.08:0);
  guest.body.position.y=emily?1.02:.90;guest.head.rotation.set(struggle?-.15:-Math.PI/2*reach,0,0);
  for(const [i,l] of limbs.entries()){
   const s=l.sign,flail=struggle?Math.sin(time*13+i*Math.PI):0;
   const shoulder=[s*(emily?.184:.178),emily?.53:.457,0];
   const elbow=[s*(struggle?.39:.31),struggle?.58+flail*.18:.16,.10],hand=[s*(struggle?.43:.37),struggle?.90+flail*.18:.05,.18];
   if(spirit){const e=[s*.25,.66,.14],h=[s*.18,1.06,.16];for(let k=0;k<3;k++){elbow[k]=T.MathUtils.lerp(elbow[k],e[k],reach);hand[k]=T.MathUtils.lerp(hand[k],h[k],reach);}}
   if(spirit&&guest.spiritHandTarget&&guest.spiritHoldingHand===i){
    guest.body.updateWorldMatrix(true,false);const joined=guest.body.worldToLocal(guest.spiritHandTarget.clone()).toArray();
    for(let k=0;k<3;k++){hand[k]=T.MathUtils.lerp(hand[k],joined[k],reach);elbow[k]=T.MathUtils.lerp(elbow[k],(shoulder[k]+joined[k])*.5+(k===2?.06:0),reach);}
   }
   if(spirit&&guest.spiritReachDirection){
    // A direction, rather than a distant target, keeps the arms a natural length
    // while the ghost is whisked away from the person they are reaching for.
    guest.body.updateWorldMatrix(true,false);
    const direction=guest.spiritReachDirection.clone().normalize().applyQuaternion(guest.body.getWorldQuaternion(new T.Quaternion()).invert()).toArray();
    for(let k=0;k<3;k++){elbow[k]=shoulder[k]+direction[k]*.29+(k===0?s*.07:0);hand[k]=shoulder[k]+direction[k]*.64+(k===0?s*.10:0);}
   }
   segment(l.upperArm||l.sleeve,shoulder,elbow,emily?.043:.059);segment(l.forearm,elbow,hand,emily?.033:.044);
   guest.hands[i].position.set(...hand);guest.hands[i].rotation.set(0,0,s*.12);
   const hip=emily?1.015:.9,kick=struggle?flail*.14:0;
   segment(l.thigh,[s*.10,hip,0],[s*.13,hip*.54,.08+kick],emily?.058:.061);
   segment(l.shin,[s*.13,hip*.54,.08+kick],[s*.14,.12,kick],emily?.043:.045);
   guest.feet[i].position.set(s*(emily?.112:.125),0,kick);
  }
 }
 return {expressions,normalEyes,update};
}
