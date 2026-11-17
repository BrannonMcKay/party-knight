// An arrival triggers one greeting. Leaving the larger radius rearms it, so
// lingering beside a character doesn't repeatedly interrupt their sentence.
export function createGuestApproach(guest,greet){
 let nearby=false,cooldown=0;
 return {
  update(dt,{playerPosition=null,canApproach=()=>true}={}){
   cooldown=Math.max(0,cooldown-dt);
   if(!playerPosition||guest.scripted||!guest.group.visible){nearby=false;return false;}
   const distance=guest.group.position.distanceTo(playerPosition);
   if(distance>4||Math.abs(playerPosition.y-guest.group.position.y)>.85){nearby=false;return false;}
   if(distance>2.8&&!nearby)return false;
   if(!canApproach(guest.group.position,playerPosition)){nearby=false;return false;}
   guest.faceToward(playerPosition);
   if(!nearby&&cooldown===0){greet();cooldown=12;}
   nearby=true;return true;
  },
  reset(){nearby=false;cooldown=0;}
 };
}
