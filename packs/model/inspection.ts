import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// These are enclosing/support components, not the moving mechanism.
export const enclosingParts = new Set(['motor','housing','mount','plate','rear','gasket','upper','lower','sight','breather','catch','chamber','sleeve','contour','head','headbolts','guide','ports','relief']);
export const mechanismColors: Record<string, number> = {gear:0xf2b65c,eccentric:0xf2b65c,coupling:0xf2b65c,yoke:0x68dddf,piston:0x68dddf,diaphragm:0xfb9074,balls:0x9aeea7};

/** Hollow walls, with a real void; clipping a solid box would expose a solid block. */
export function hollowBox(width:number,height:number,depth:number){
 const t=Math.min(.12,Math.min(width,height,depth)*.2);
 const pieces=[
  new THREE.BoxGeometry(width,height,t).translate(0,0,(depth-t)/2),
  new THREE.BoxGeometry(width,height,t).translate(0,0,-(depth-t)/2),
  new THREE.BoxGeometry(width,t,depth-2*t).translate(0,(height-t)/2,0),
  new THREE.BoxGeometry(width,t,depth-2*t).translate(0,-(height-t)/2,0),
  new THREE.BoxGeometry(t,height-2*t,depth-2*t).translate((width-t)/2,0,0),
  new THREE.BoxGeometry(t,height-2*t,depth-2*t).translate(-(width-t)/2,0,0),
 ];
 const result=mergeGeometries(pieces)!;pieces.forEach(g=>g.dispose());return result;
}
export function hollowCylinder(bottom:number,top:number,length:number,segments=64){
 const thickness=Math.min(.12,Math.min(bottom,top)*.23);
 return new THREE.LatheGeometry([
  new THREE.Vector2(bottom,-length/2),new THREE.Vector2(top,length/2),
  new THREE.Vector2(top-thickness,length/2),new THREE.Vector2(bottom-thickness,-length/2),
  new THREE.Vector2(bottom,-length/2),
 ],segments);
}

/** Keep the positive half-space, matching Three's material clipping semantics. */
export function clipGeometry(source:THREE.BufferGeometry,plane:THREE.Plane){
 const positions:number[]=[],normals:number[]=[],uvs:number[]=[];
 const pos=source.getAttribute('position'),nor=source.getAttribute('normal'),uv=source.getAttribute('uv'),index=source.index;
 type Vertex={p:THREE.Vector3;n:THREE.Vector3;uv:THREE.Vector2};
 const vertex=(i:number):Vertex=>({p:new THREE.Vector3().fromBufferAttribute(pos,i),n:nor?new THREE.Vector3().fromBufferAttribute(nor,i):new THREE.Vector3(),uv:uv?new THREE.Vector2(uv.getX(i),uv.getY(i)):new THREE.Vector2()});
 const count=index?index.count:pos.count;
 for(let i=0;i<count;i+=3){const input=[0,1,2].map(j=>vertex(index?index.getX(i+j):i+j));const output:Vertex[]=[];
  for(let j=0;j<3;j++){const a=input[j],b=input[(j+1)%3],da=plane.distanceToPoint(a.p),db=plane.distanceToPoint(b.p);if(da>=0)output.push(a);if((da>=0)!==(db>=0)){const t=da/(da-db);output.push({p:a.p.clone().lerp(b.p,t),n:a.n.clone().lerp(b.n,t).normalize(),uv:a.uv.clone().lerp(b.uv,t)})}}
  for(let j=1;j<output.length-1;j++)for(const v of [output[0],output[j],output[j+1]]){positions.push(...v.p.toArray());normals.push(...v.n.toArray());uvs.push(...v.uv.toArray())}
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));return g;
}

/** Outline only the intersection with the section plane, including the inner walls. */
export function sectionEdges(source:THREE.BufferGeometry,plane:THREE.Plane){
 const vertices:number[]=[],pos=source.getAttribute('position'),idx=source.index;
 for(let i=0;i<(idx?idx.count:pos.count);i+=3){const points=[0,1,2].map(j=>new THREE.Vector3().fromBufferAttribute(pos,idx?idx.getX(i+j):i+j));const crossings:THREE.Vector3[]=[];
  for(let j=0;j<3;j++){const a=points[j],b=points[(j+1)%3],da=plane.distanceToPoint(a),db=plane.distanceToPoint(b);if((da>=0)!==(db>=0))crossings.push(a.clone().lerp(b,da/(da-db)))}
  if(crossings.length===2)for(const p of crossings)vertices.push(...p.toArray());
 }
 return new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
}
