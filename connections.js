// Category paths take distinct, gently bowed lanes along the globe's surface.
// They meet at the project cards, but shared routes separate between the cards.
export function sphericalPath(T,positions,radius,categoryIndex){
  const points=[];
  for(let j=1;j<positions.length;j++){
    const a=positions[j-1].clone().normalize(),b=positions[j].clone().normalize();
    const angle=Math.acos(T.MathUtils.clamp(a.dot(b),-1,1));
    const normal=new T.Vector3().crossVectors(a,b);
    if(normal.lengthSq()<1e-8)normal.crossVectors(a,Math.abs(a.y)<.9?new T.Vector3(0,1,0):new T.Vector3(1,0,0));
    normal.normalize();const tangent=new T.Vector3().crossVectors(normal,a).normalize();
    // Use the same side reference for A → B and B → A. Otherwise two categories
    // can collapse onto the same curve when their project order is reversed.
    const direction=Math.sign(a.x-b.x||a.y-b.y||a.z-b.z)||1;
    const laneNormal=normal.clone().multiplyScalar(direction);
    const laneOffset=(categoryIndex-2.5)*.032;
    const steps=Math.max(12,Math.ceil(angle/.018));
    for(let step=j===1?0:1;step<=steps;step++){
      const t=step/steps;
      const p=a.clone().multiplyScalar(Math.cos(angle*t)).addScaledVector(tangent,Math.sin(angle*t));
      p.addScaledVector(laneNormal,Math.sin(Math.PI*t)*laneOffset);
      points.push(p.normalize().multiplyScalar(radius));
    }
  }
  return points;
}
