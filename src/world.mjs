export const HZ=60, DT=1/60, ISLAND_RADIUS=40;
export const distXZ=(a,b)=>Math.hypot(a[0]-b[0],a[2]-b[2]);
export const round=(v,d=3)=>Number(v.toFixed(d))||0;
export function ring(radius,count,center=[0,0,0],offset=0){return Array.from({length:count},(_,i)=>{const a=(offset+i*360/count)*Math.PI/180;return [center[0]+radius*Math.cos(a),center[1],center[2]+radius*Math.sin(a)];});}
export function world(night){
  if(night===1)return {night,name:'Đảo Bến',radius:40,centers:[[0,0,0]],spawn:[0,0,0],lanterns:[[0,0,25],[23.8,0,7.7],[14.7,0,-20.2],[-14.7,0,-20.2],[-23.8,0,7.7]],motePoints:[...ring(12,8),...ring(33,16)],shadePoints:ring(37,12,[0,0,0],15),interval:480,maxShades:6,pads:[],charms:[]};
  if(night===2)return {night,name:'Đảo Cau',radius:28,centers:[[0,0,0],[70,0,0]],spawn:[0,0,0],lanterns:[[0,0,20],[17,0,-10],[-17,0,-10],[70,0,20],[87,0,-10],[53,0,-10]],motePoints:[...ring(10,4),...ring(22,8),...ring(10,4,[70,0,0]),...ring(22,8,[70,0,0])],shadePoints:[...ring(26,8,[0,0,0],22.5),...ring(26,8,[70,0,0],22.5)],interval:420,maxShades:8,pads:[{pos:[20,0,18],vy:14,speed:24,target:[70,0,0]},{pos:[50,0,-18],vy:14,speed:24,target:[0,0,0]}],charms:[[35,0,0]]};
  if(night===3)return {night,name:'Đảo Chuông',radius:45,centers:[[0,0,0]],spawn:[0,6,7.5],lanterns:[[0,6,6],[18,3,10],[-18,3,10],[35,0,-10],[-35,0,-10],[20,0,-35],[-20,0,-35]],motePoints:[...ring(34,18),...Array.from({length:8},(_,i)=>{const a=(20+i*20)*Math.PI/180;return[18*Math.cos(a),3,18*Math.sin(a)];}),...ring(5,4,[0,6,0],45)],shadePoints:ring(43,16),interval:360,maxShades:10,pads:[{pos:[0,3,13],vy:12,speed:8,target:[0,3,0]}],charms:[[30,0,25],[-30,0,25]]};
  throw new Error('night must be 1, 2 or 3');
}
export function groundHeight(night,x,z){
  const r=Math.hypot(x,z);
  if(night===1)return r<=40+1e-8?0:-Infinity;
  if(night===2)return Math.min(r,Math.hypot(x-70,z))<=28+1e-8||(x>=26&&x<=44&&Math.abs(z)<=2)?0:-Infinity;
  if(r>45+1e-8)return-Infinity;
  let y=r<=8?6:r>=12&&r<=24&&z>0?3:0;
  for(const deg of [30,150]){const a=deg*Math.PI/180,s=x*Math.cos(a)+z*Math.sin(a),p=-x*Math.sin(a)+z*Math.cos(a);if(s>=24&&s<=30&&Math.abs(p)<=1.5)y=Math.max(y,(30-s)/2);}
  return y;
}
export function blocked(night,from,to){
  if(night===3&&Math.hypot(to[0],to[2])<2.25&&to[1]<14&&to[1]>=5.8)return true;
  const h=groundHeight(night,to[0],to[2]);
  return Number.isFinite(h)&&h>from[1]+.35;
}
