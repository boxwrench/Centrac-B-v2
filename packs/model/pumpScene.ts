import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { byId } from './parts';
import {enclosingParts,mechanismColors,hollowBox,hollowCylinder,sectionEdges,clipGeometry} from './inspection';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
export type ViewState={explode:number;xray:boolean;shellOpacity:number;cutaway:boolean;cutSide:number;running:boolean;speed:number;labels:boolean;selected:string|null;isolate:boolean;phase:number;mode:string};
export type PumpScene=ReturnType<typeof createPumpScene>;
export function createPumpScene(host:HTMLElement,onSelect:(id:string|null)=>void,onPhase:(phase:number)=>void){
 const scene=new THREE.Scene(); scene.background=new THREE.Color('#181d23');
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(host.clientWidth,host.clientHeight);renderer.localClippingEnabled=true;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.3;host.appendChild(renderer.domElement);renderer.domElement.setAttribute('aria-label','Interactive Centrac B pump. Drag to orbit, scroll to zoom, right-drag to pan. Select parts here or in the component list.');
 const camera=new THREE.PerspectiveCamera(36,host.clientWidth/host.clientHeight,.1,200); camera.position.set(-10,7.7,11.7);
 const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(-.9,2.2,0);controls.enableDamping=true;controls.minDistance=3;controls.maxDistance=35;controls.maxPolarAngle=Math.PI*.88;
 const pmrem=new THREE.PMREMGenerator(renderer);const room=new RoomEnvironment();const env=pmrem.fromScene(room,.05);scene.environment=env.texture;room.dispose();pmrem.dispose();
 scene.add(new THREE.HemisphereLight(0xd7e7ff,0x263044,2.0));
 const key=new THREE.DirectionalLight(0xfff0dc,4);key.position.set(-4,9,6);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-12,right:12,top:12,bottom:-12});key.shadow.bias=-.001;scene.add(key);
 const rim=new THREE.DirectionalLight(0x86bcff,3);rim.position.set(5,6,-7);scene.add(rim);
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(150,150),new THREE.MeshStandardMaterial({color:0x181d23,roughness:.92,metalness:.12}));ground.rotation.x=-Math.PI/2;ground.position.y=-.08;ground.receiveShadow=true;scene.add(ground);
 const grid=new THREE.GridHelper(50,100,0x414b59,0x2c343e);grid.position.y=-.065;(grid.material as THREE.Material).transparent=true;(grid.material as THREE.Material).opacity=.35;scene.add(grid);
 const root=new THREE.Group();scene.add(root);
 const sectionPlane=new THREE.Plane(new THREE.Vector3(0,0,-1),0);
 const interiorLight=new THREE.PointLight(0xd8edff,0,15,0);scene.add(interiorLight);
 const shellAlternatives=new Map<THREE.Mesh,{solid:THREE.BufferGeometry;hollow:THREE.BufferGeometry}>();
 const original=new Map<THREE.Mesh,THREE.MeshStandardMaterial>();
 const outlines=new Map<THREE.Mesh,THREE.LineSegments>();
 const sectionRims=new Map<THREE.Mesh,THREE.LineSegments>();

 const materials={blue:new THREE.MeshStandardMaterial({color:0x1268a9,metalness:.48,roughness:.34}),black:new THREE.MeshStandardMaterial({color:0x2a3037,metalness:.55,roughness:.31}),steel:new THREE.MeshStandardMaterial({color:0xb9c9d4,metalness:.9,roughness:.24}),polish:new THREE.MeshStandardMaterial({color:0xe3eaf0,metalness:.95,roughness:.13}),dark:new THREE.MeshStandardMaterial({color:0x131c23,metalness:.15,roughness:.65}),brass:new THREE.MeshStandardMaterial({color:0xc8994e,metalness:.8,roughness:.3}),rubber:new THREE.MeshStandardMaterial({color:0x353d43,roughness:.8}),membrane:new THREE.MeshStandardMaterial({color:0xeae3d2,metalness:.08,roughness:.48,side:THREE.DoubleSide}),oil:new THREE.MeshStandardMaterial({color:0xf7b64d,transparent:true,opacity:.25,roughness:.2,metalness:.1,depthWrite:false}),liquid:new THREE.MeshStandardMaterial({color:0x50c9df,transparent:true,opacity:.32,depthWrite:false})};
 type M=keyof typeof materials;
 const groups:Record<string,THREE.Group>={}; const meshes:THREE.Mesh[]=[];const shells:THREE.Mesh[]=[];
 const base=new Map<THREE.Object3D,THREE.Vector3>();const offsets:Record<string,THREE.Vector3>={};
 function group(id:string,p:number[],e:number[]){const g=new THREE.Group();g.name=id;g.position.fromArray(p);root.add(g);groups[id]=g;base.set(g,g.position.clone());offsets[id]=new THREE.Vector3(...e);return g}
 function mesh(g:THREE.Group,geo:THREE.BufferGeometry,mat:M,p=[0,0,0],shell=false){const m=new THREE.Mesh(geo,materials[mat].clone());m.position.fromArray(p);m.castShadow=true;m.receiveShadow=true;m.userData.id=g.name;g.add(m);meshes.push(m);original.set(m,materials[mat].clone());if(shell)shells.push(m);return m;}
 function box(g:THREE.Group,s:number[],p:number[],mat:M='steel',shell=false,r=.06){const m=mesh(g,new RoundedBoxGeometry(s[0],s[1],s[2],3,r),mat,p,shell);if(shell)shellAlternatives.set(m,{solid:m.geometry,hollow:hollowBox(s[0],s[1],s[2])});return m}
 function cyl(g:THREE.Group,r:number,len:number,p:number[],mat:M='steel',axis='y',shell=false,rt=r,n=64){const m=mesh(g,new THREE.CylinderGeometry(rt,r,len,n),mat,p,shell);if(axis==='x')m.rotation.z=Math.PI/2;if(axis==='z')m.rotation.x=Math.PI/2;if(shell)shellAlternatives.set(m,{solid:m.geometry,hollow:hollowCylinder(r,rt,len,n)});return m}
 function ring(g:THREE.Group,r:number,t:number,p:number[],mat:M='steel',axis='x'){const m=mesh(g,new THREE.TorusGeometry(r,t,12,64),mat,p);if(axis==='x')m.rotation.y=Math.PI/2;if(axis==='y')m.rotation.x=Math.PI/2;return m}
 function bolt(g:THREE.Group,p:number[],axis='x',size=.08){cyl(g,size,.10,p,'steel',axis,false,size,6)}
 function pipe(g:THREE.Group,points:number[][],r:number,mat:M='steel'){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));return mesh(g,new THREE.TubeGeometry(curve,32,r,10,false),mat)}
 const housing=group('housing',[.2,1.42,0],[0,0,-2.2]);
 box(housing,[2.75,1.95,1.8],[0,0,0],'blue',true,.14);box(housing,[1.45,1.24,1.24],[-1.94,-.07,0],'blue',true,.12);
 for(const x of [-1.05,1.05])for(const z of [-.68,.68]){box(housing,[.35,.55,.32],[x,-1.1,z],'blue');box(housing,[.64,.16,.64],[x,-1.34,z],'blue');bolt(housing,[x,-1.23,z],'y')}
 for(const z of [-.8,.8])box(housing,[2.1,.09,.09],[0,-.77,z],'blue');
 const rear=group('rear',[1.68,1.44,0],[1.7,0,0]);box(rear,[.14,1.8,1.7],[0,0,0],'blue');for(const y of [-.7,0,.7])for(const z of [-.7,.7])bolt(rear,[.13,y,z]);
 const gasket=group('gasket',[1.59,1.44,0],[1.15,0,0]);for(const y of [-.77,.77])box(gasket,[.028,.07,1.58],[0,y,0],'rubber');for(const z of [-.77,.77])box(gasket,[.028,1.55,.07],[0,0,z],'rubber');
 const mount=group('mount',[.9,2.67,0],[.6,1.8,0]);cyl(mount,.51,.62,[0,0,0],'blue','y',true,.63);cyl(mount,.69,.12,[0,-.3,0],'blue');cyl(mount,.72,.13,[0,.32,0],'blue');
 const plate=group('plate',[.9,3.08,0],[.6,2.2,0]);cyl(plate,.75,.10,[0,0,0]);for(let i=0;i<4;i++){const a=i*Math.PI/2+Math.PI/4;bolt(plate,[Math.cos(a)*.62,.09,Math.sin(a)*.62],'y')}
 const motor=group('motor',[.9,3.9,0],[.6,2.8,0]);cyl(motor,.55,1.43,[0,0,0],'black');cyl(motor,.6,.2,[0,.81,0],'black');cyl(motor,.51,.17,[0,-.82,0],'black');cyl(motor,.32,.06,[0,.94,0],'black');
 for(let i=0;i<28;i++){const a=i*Math.PI*2/28;const fin=box(motor,[.07,1.10,.13],[Math.cos(a)*.55,0,Math.sin(a)*.55],'black',false,.015);fin.rotation.y=-a;}
 box(motor,[.36,.57,.47],[.57,.24,0],'black');box(motor,[.32,.21,.035],[-.08,.42,.575],'steel',false,.01);
 const mc=document.createElement('canvas');mc.width=512;mc.height=128;const ctx=mc.getContext('2d')!;ctx.fillStyle='#d9e3e9';ctx.fillRect(0,0,512,128);ctx.fillStyle='#26333d';ctx.font='bold 42px sans-serif';ctx.fillText('MILTON ROY',26,55);ctx.font='20px monospace';ctx.fillText('CENTRAC B  •  DRIVE',26,92);const labelMaterial=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(mc)});const badge=new THREE.Mesh(new THREE.PlaneGeometry(.89,.23),labelMaterial);badge.position.set(-.18,.29,.907);housing.add(badge);badge.userData.id='housing';meshes.push(badge);
 const coupling=group('coupling',[.9,2.92,0],[.6,.9,.6]);cyl(coupling,.19,.31,[0,0,0]);cyl(coupling,.2,.075,[0,0,0],'rubber');
 const gear=group('gear',[-.35,.97,0],[0,0,1.65]);
 const wheel=new THREE.Group();wheel.name="gear";gear.add(wheel);cyl(wheel,.76,.20,[0,0,0],'brass');cyl(wheel,.2,1.36,[0,.44,0]);
 for(let i=0;i<55;i++){const a=i*Math.PI*2/55;const tooth=box(wheel,[.1,.22,.07],[Math.cos(a)*.78,0,Math.sin(a)*.78],'brass',false,.009);tooth.rotation.y=-a;}
 const pinion=new THREE.Group();pinion.name="gear";pinion.position.x=1.25;gear.add(pinion);cyl(pinion,.14,1.71,[0,.63,0]);cyl(pinion,.29,.25,[0,0,0],'steel');for(let i=0;i<10;i++){const a=i*Math.PI*2/10;const t=box(pinion,[.10,.26,.09],[Math.cos(a)*.28,0,Math.sin(a)*.28],'steel',false,.008);t.rotation.y=-a;}
 cyl(wheel,.12,.55,[.29,.50,0],'steel');
 const ecc=group('eccentric',[-.06,1.57,0],[0,.45,2.65]);box(ecc,[.28,.29,.29],[0,0,0],'brass');
 const yoke=group('yoke',[-.35,1.58,0],[-.45,.4,3.1]);for(const x of [-.26,.26])box(yoke,[.14,.28,1.08],[x,0,0]);for(const z of [-.5,.5])box(yoke,[.65,.28,.13],[0,0,z]);cyl(yoke,.18,1.25,[-.87,0,0],'steel','x');
 const upper=group('upper',[-.35,2.46,0],[-.65,1.05,0]);cyl(upper,.37,.14,[0,0,0],'blue');for(let i=0;i<3;i++){let a=i*Math.PI*2/3;bolt(upper,[Math.cos(a)*.28,.12,Math.sin(a)*.28],'y')}
 const lower=group('lower',[-.35,.45,0],[0,-.35,1.1]);cyl(lower,.38,.15,[0,0,0],'steel');
 const bearing=group('bearing',[-.35,1.43,0],[-.4,.6,1.7]);for(const y of [-.77,.76]){ring(bearing,.21,.065,[0,y,0],'steel','y');for(let i=0;i<12;i++){const a=i*Math.PI/6;cyl(bearing,.031,.12,[Math.cos(a)*.21,y,Math.sin(a)*.21],'polish')}}
 const cups=group('cups',[-.35,1.43,0],[-.8,.65,2.0]);for(const y of [-.77,.76])ring(cups,.29,.04,[0,y,0],'polish','y');
 const seal=group('seal',[.9,2.4,0],[1,.9,1.1]);ring(seal,.18,.045,[0,0,0],'rubber','y');
 const sight=group('sight',[.86,1.77,.94],[.8,0,1.4]);cyl(sight,.17,.13,[0,0,0],'steel','z',false,.17,6);cyl(sight,.119,.016,[0,0,.08],'oil','z');
 const breather=group('breather',[.12,2.62,.48],[0,1.25,.6]);cyl(breather,.09,.24,[0,0,0],'brass');cyl(breather,.15,.14,[0,.17,0],'black');
 const catchall=group('catch',[-1.82,2.035,0],[-1.1,1.9,-.4]);box(catchall,[1.3,.075,1.22],[0,0,0],'blue');for(const x of [-.52,.52])for(const z of [-.49,.49])bolt(catchall,[x,.07,z],'y',.045);
 const chamber=group('chamber',[-2.78,1.55,0],[-1.25,0,0]);cyl(chamber,.57,.66,[.26,0,0],'blue','x',true);cyl(chamber,.84,.27,[-.12,0,0],'blue','x',true);for(let i=0;i<8;i++){const a=i*Math.PI/4;cyl(chamber,.085,.3,[-.11,.70*Math.cos(a),.7*Math.sin(a)],'blue','x')}
 const sleeve=group('sleeve',[-2.29,1.55,0],[-.65,0,1.6]);cyl(sleeve,.24,.74,[0,0,0],'steel','x',true);ring(sleeve,.25,.036,[.36,0,0]);
 const piston=group('piston',[-2.1,1.55,0],[-.2,0,2.4]);cyl(piston,.143,.93,[0,0,0],'polish','x');cyl(piston,.20,.09,[.48,0,0],'steel','x');
 const ps=group('pistonseal',[-2.54,1.55,0],[-1.2,0,2.7]);ring(ps,.158,.028,[0,0,0],'rubber');
 const wear=group('wear',[-2.35,1.55,0],[-1.15,.6,2.4]);for(const x of [-.15,.15])ring(wear,.151,.023,[x,0,0],'rubber');
 const contour=group('contour',[-3.12,1.55,0],[-1.9,0,0]);cyl(contour,.62,.095,[0,0,0],'steel','x');for(let i=0;i<20;i++){const a=i*Math.PI/10;cyl(contour,.022,.098,[0,.46*Math.cos(a),.46*Math.sin(a)],'dark','x',false,.022,12)}
 const oring=group('oring',[-3.20,1.55,0],[-2.5,0,0]);ring(oring,.64,.028,[0,0,0],'rubber');
 const diaphragm=group('diaphragm',[-3.25,1.55,0],[-3.0,0,0]);const diaGeo=new THREE.CircleGeometry(.645,72);diaGeo.rotateY(Math.PI/2);const dia=mesh(diaphragm,diaGeo,'membrane');ring(diaphragm,.636,.021,[0,0,0],'membrane');
 const head=group('head',[-3.44,1.55,0],[-3.7,0,0]);cyl(head,.84,.32,[0,0,0],'steel','x',true);cyl(head,.44,.16,[-.2,0,0],'steel','x',true);for(const y of [-.73,.73])box(head,[.4,.39,.5],[.03,y,0],'steel',true,.05);
 const hb=group('headbolts',[-3.66,1.55,0],[-4.6,0,0]);for(let i=0;i<8;i++){const a=i*Math.PI/4+Math.PI/8;const y=Math.cos(a)*.72,z=Math.sin(a)*.72;bolt(hb,[0,y,z],'x',.092);cyl(hb,.046,.58,[.32,y,z],'steel','x');ring(hb,.08,.015,[.057,y,z]);}
 const vg=group('valvegasket',[-3.40,1.55,0],[-3.7,0,.9]);for(const sign of [-1,1])for(let i=0;i<3;i++)ring(vg,.14,.026,[0,sign*(.91+i*.105),0],'membrane','y');
 const guide=group('guide',[-3.40,1.55,0],[-3.7,0,1.6]);for(const sign of [-1,1]){cyl(guide,.18,.25,[0,sign*1.01,0],'steel','y',true);ring(guide,.155,.024,[0,sign*1.10,0],'steel','y');}
 const balls=group('balls',[-3.4,1.55,0],[-3.7,0,2.3]);const inlet=mesh(balls,new THREE.SphereGeometry(.108,32,24),'polish',[0,-1.02,0]);const outlet=mesh(balls,new THREE.SphereGeometry(.108,32,24),'polish',[0,1.02,0]);
 const ports=group('ports',[-3.4,1.55,0],[-3.7,0,0]);for(const sign of [-1,1]){cyl(ports,.25,.16,[0,sign*1.20,0],'steel');cyl(ports,.20,.26,[0,sign*1.4,0],'steel','y',false,.20,6);cyl(ports,.11,.011,[0,sign*1.54,0],'dark');for(const z of [-.25,.25]){cyl(ports,.038,.46,[0,sign*1.05,z]);bolt(ports,[0,sign*1.24,z],'y',.065)}}
 const mars=group('mars',[-2.93,1.79,0],[-1.55,1.4,-1]);cyl(mars,.11,.4,[0,0,0],'brass');cyl(mars,.17,.12,[0,.25,0],'steel','y',false,.17,6);
 const relief=group('relief',[-2.8,2.29,0],[-1.2,1.6,0]);cyl(relief,.16,.48,[0,0,0],'steel');cyl(relief,.19,.12,[0,.26,0],'steel','y',false,.19,6);cyl(relief,.05,.18,[0,.4,0],'steel');pipe(relief,[[0,.15,.16],[.18,.13,.4],[.65,-.27,.56],[.94,-.35,.56]],.037);pipe(relief,[[0,-.45,.29],[.3,-.65,.45],[.9,-.75,.4]],.023,'brass');
 const fluid=new THREE.Group();root.add(fluid);fluid.name='fluid';const oil=mesh(fluid,new THREE.CylinderGeometry(.22,.22,.40,32),'oil',[-2.83,1.55,0]);oil.rotation.z=Math.PI/2;const process=mesh(fluid,new THREE.CylinderGeometry(.50,.50,.18,48),'liquid',[-3.39,1.55,0]);process.rotation.z=Math.PI/2;
 const particles:THREE.Mesh[]=[];const particleMat=new THREE.MeshBasicMaterial({color:0x71e8ff});for(let i=0;i<16;i++){const p=new THREE.Mesh(new THREE.SphereGeometry(.025,8,8),particleMat);fluid.add(p);particles.push(p)}
 const labels=document.createElement('div');labels.className='model-labels';host.appendChild(labels);const labelNodes:Record<string,HTMLButtonElement>={};
 for(const id of Object.keys(groups)){const p=byId[id];const node=document.createElement('button');node.className='part-label';node.innerHTML=`<span>${p.item}</span><b>${p.pn}</b>`;node.title=p.name;node.setAttribute('aria-label',`${p.name}, ${p.pn}`);node.onclick=()=>onSelect(id);labels.appendChild(node);labelNodes[id]=node;}
 let state:ViewState={explode:0,xray:false,shellOpacity:.025,cutaway:false,cutSide:1,running:false,speed:.5,labels:false,selected:null,isolate:false,phase:0,mode:'assembled'};let explosion=0;let theta=0;let frame=0;let last=performance.now();let phaseTick=0;let active=true;let viewVisible=true;
 const ray=new THREE.Raycaster();const pointer=new THREE.Vector2();let down=[0,0];
 function isVisible(o:THREE.Object3D){let p:THREE.Object3D|null=o;while(p){if(!p.visible)return false;p=p.parent}return true}
 const pointerDown=(e:PointerEvent)=>{down=[e.clientX,e.clientY]};
 const pointerUp=(e:PointerEvent)=>{if(e.button!==0||Math.hypot(e.clientX-down[0],e.clientY-down[1])>4)return;const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(meshes).find(h=>isVisible(h.object)&&!((h.object as THREE.Mesh).material as THREE.MeshStandardMaterial).userData.ghost&&!(((h.object as THREE.Mesh).material as THREE.MeshStandardMaterial).clippingPlanes??[]).some(p=>p.distanceToPoint(h.point)<0)&&h.object.userData.id);if(hit)onSelect(hit.object.userData.id);else onSelect(null)};
 renderer.domElement.addEventListener('pointerdown',pointerDown);renderer.domElement.addEventListener('pointerup',pointerUp);
 const resize=()=>{const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h)};const observer=new ResizeObserver(resize);observer.observe(host);
 // Outlines provide orientation without layers of tinted surfaces obscuring the parts.
 for(const m of shells){const line=new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry,30),new THREE.LineBasicMaterial({color:0x7194ad,transparent:true,opacity:.22,depthWrite:false}));line.visible=false;line.userData.inspectionHelper=true;m.add(line);outlines.set(m,line);}
 function update(next:ViewState){
  const phaseChanged=next.phase!==state.phase;if(phaseChanged&&!next.running)theta=next.phase/100*Math.PI*2;
  state=next;sectionPlane.normal.set(0,0,-state.cutSide);
  const inspecting=(state.xray||state.cutaway)&&!state.isolate;
  for(const m of meshes){
   if(!(m.material instanceof THREE.MeshStandardMaterial))continue;
   const mat=m.material,source=original.get(m)!;const id=m.userData.id;
   const enclosing=enclosingParts.has(id),ghost=state.xray&&enclosing&&!state.isolate;
   const sliced=state.cutaway&&enclosing&&!state.isolate;
   const selected=id===state.selected,color=inspecting?mechanismColors[id]:undefined;
   const previousClipped=!!mat.clippingPlanes?.length,previousTransparent=mat.transparent,previousSide=mat.side;
   mat.clippingPlanes=sliced?[sectionPlane]:null;mat.clipShadows=true;
   mat.transparent=ghost||source.transparent;mat.opacity=ghost?state.shellOpacity:source.opacity;
   mat.depthWrite=ghost?false:source.depthWrite;mat.userData.ghost=ghost;mat.side=sliced?THREE.DoubleSide:source.side;
   mat.color.copy(source.color);if(color)mat.color.setHex(color);
   mat.metalness=inspecting&&!enclosing?Math.min(source.metalness,.32):source.metalness;
   mat.roughness=inspecting&&!enclosing?.42:source.roughness;
   mat.emissive.setHex(selected?0x5c9da8:color??0);mat.emissiveIntensity=selected?.45:color?.20:0;
   m.castShadow=!ghost;m.receiveShadow=!inspecting||enclosing;m.renderOrder=ghost?2:0;
   if(previousClipped!==sliced||previousTransparent!==mat.transparent||previousSide!==mat.side)mat.needsUpdate=true;
   const alternative=shellAlternatives.get(m);if(alternative)m.geometry=sliced?alternative.hollow:alternative.solid;
   const outline=outlines.get(m);if(outline)outline.visible=ghost;
  }
  for(const [id,g]of Object.entries(groups))g.visible=!state.isolate||!state.selected||id===state.selected;
  badge.visible=!inspecting;fluid.visible=inspecting&&!state.isolate&&state.explode<.1;
  interiorLight.intensity=inspecting?2.8:0;
  updateSectionRims(true);
 }
 function updateSectionRims(force=false){
  root.updateMatrixWorld(true);
  for(const m of shells){
   let rim=sectionRims.get(m);
   if(!state.cutaway||state.isolate){if(rim)rim.visible=false;continue}
   const key=m.matrixWorld.elements.join(',')+state.cutSide;
   if(!force&&rim?.userData.matrixKey===key){rim.visible=true;continue}
   const local=sectionPlane.clone().applyMatrix4(m.matrixWorld.clone().invert());
   const geometry=sectionEdges(m.geometry,local);
   if(!rim){rim=new THREE.LineSegments(geometry,new THREE.LineBasicMaterial({color:0xffbf83,depthTest:true}));rim.userData.inspectionHelper=true;m.add(rim);sectionRims.set(m,rim)}else{rim.geometry.dispose();rim.geometry=geometry}
   rim.userData.matrixKey=key;rim.visible=true;
  }
 }
 function setView(view:string){const distance=state.explode>.1?1.5:1;const t=new THREE.Vector3(-.9,2.1,0);controls.target.copy(t);const positions:Record<string,number[]>={section:[-4.6,4.2,11.5*state.cutSide],iso:[-10,7.7,11.7],front:[-1,3,14],end:[-14,2.6,.01],top:[-1,17,.01]};camera.position.fromArray(positions[view==='iso'&&(state.cutaway||state.xray)?'section':view]||positions.iso);camera.position.sub(t).multiplyScalar(distance).add(t);controls.update();}
 function focus(id:string){const g=groups[id];if(!g)return;const center=new THREE.Box3().setFromObject(g).getCenter(new THREE.Vector3());const size=new THREE.Box3().setFromObject(g).getSize(new THREE.Vector3()).length();const direction=camera.position.clone().sub(controls.target).normalize();controls.target.copy(center);camera.position.copy(center).addScaledVector(direction,Math.max(size*2.2,3));controls.update()}
 function animate(now:number){if(!active)return;frame=requestAnimationFrame(animate);if(!viewVisible){last=now;return}const dt=Math.min((now-last)/1000,.05);last=now;if(state.running)theta+=dt*Math.PI*2*state.speed;explosion=THREE.MathUtils.damp(explosion,state.explode,6,dt);for(const[id,g]of Object.entries(groups))g.position.copy(base.get(g)!).addScaledVector(offsets[id],explosion);
 const x=.29*Math.cos(theta),z=-.29*Math.sin(theta);wheel.rotation.y=theta;pinion.rotation.y=-theta*11;coupling.rotation.y=-theta*11;ecc.position.x=base.get(ecc)!.x+offsets.eccentric.x*explosion+x-.29;ecc.position.z=base.get(ecc)!.z+offsets.eccentric.z*explosion+z;yoke.position.x+=x;piston.position.x+=x;wear.position.x+=x;inlet.position.y=-1.02+(Math.sin(theta)<0?.105*Math.abs(Math.sin(theta)):0);outlet.position.y=1.02+(Math.sin(theta)>=0?.105*Math.sin(theta):0);
 const pa=dia.geometry.attributes.position;for(let i=0;i<pa.count;i++){const y=pa.getY(i),z=pa.getZ(i);pa.setX(i,.075*Math.cos(theta)*(1-(y*y+z*z)/(.645*.645)))}pa.needsUpdate=true;dia.geometry.computeVertexNormals();
 if(fluid.visible){const discharge=Math.sin(theta)>=0;for(let i=0;i<particles.length;i++){const u=((theta/(Math.PI*2)*3+i/particles.length)%1+1)%1;particles[i].position.set(-3.42,discharge?1.55+u*1.51:.05+u*1.50,.04);particles[i].visible=state.running;}}
 controls.update();interiorLight.position.copy(camera.position);if(state.cutaway)updateSectionRims();scene.updateMatrixWorld();const rect=host.getBoundingClientRect();const visibleRects:{x:number;y:number}[]=[];
 const ids=Object.keys(groups).sort((a,b)=>a===state.selected?-1:b===state.selected?1:0);for(const id of ids){const n=labelNodes[id],g=groups[id];const shown=g.visible&&(state.selected===id||(state.labels&&explosion>.05));if(!shown){n.style.display='none';continue}const center=new THREE.Box3().setFromObject(g).getCenter(new THREE.Vector3()).project(camera);const px=(center.x*.5+.5)*rect.width,py=(-center.y*.5+.5)*rect.height;const overlap=visibleRects.some(p=>Math.abs(p.x-px)<158&&Math.abs(p.y-py)<34);if(center.z>1||px<0||px>rect.width||py<0||py>rect.height||(overlap&&id!==state.selected)){n.style.display='none';continue}n.style.display='flex';n.style.left=`${px}px`;n.style.top=`${py}px`;n.classList.toggle('chosen',id===state.selected);visibleRects.push({x:px,y:py});}
 renderer.render(scene,camera);if(now-phaseTick>130){phaseTick=now;if(state.running)onPhase(((theta%(Math.PI*2)+Math.PI*2)%(Math.PI*2))/(Math.PI*2)*100)}}
 frame=requestAnimationFrame(animate);
 async function exportModel(){const clone=root.clone(true);clone.name='CENTRAC B — illustrative reconstruction';clone.userData={configuration:'Simplex / 1 HP / 1-inch 316SS / single-ball / head <1600 psig',source:'Centrac_B_IOM.pdf',geometry:'Illustrative proportions, not manufacturing dimensions',export:'Current pose and exploded position; animation is available in the interactive viewer'};clone.updateMatrixWorld(true);const helpers:THREE.Object3D[]=[];const clipped:THREE.BufferGeometry[]=[];clone.traverse(o=>{if(o.userData.inspectionHelper)helpers.push(o);o.visible=true;if(byId[o.name])o.userData={...o.userData,...byId[o.name]};if(o instanceof THREE.Mesh){o.material=o.material.clone();if(o.material.clippingPlanes?.length){o.geometry=clipGeometry(o.geometry,o.material.clippingPlanes[0].clone().applyMatrix4(o.matrixWorld.clone().invert()));clipped.push(o.geometry)}o.material.clippingPlanes=null;o.material.emissive?.setHex(0);o.material.opacity=1;o.material.transparent=false;o.material.depthWrite=true}});helpers.forEach(o=>o.removeFromParent());const f=clone.getObjectByName('fluid');if(f)clone.remove(f);const buffer=await new GLTFExporter().parseAsync(clone,{binary:true,onlyVisible:true});const url=URL.createObjectURL(new Blob([buffer as ArrayBuffer],{type:'model/gltf-binary'}));const a=document.createElement('a');a.href=url;a.download='centrac-b-illustrative-model.glb';a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);clone.traverse(o=>{if(o instanceof THREE.Mesh)o.material.dispose()});clipped.forEach(g=>g.dispose())}
 return {update,setView,focus,exportModel,setActive:(value:boolean)=>{viewVisible=value;last=performance.now()},zoom:(factor:number)=>{camera.position.sub(controls.target).multiplyScalar(factor).add(controls.target);controls.update()},dispose:()=>{active=false;cancelAnimationFrame(frame);observer.disconnect();controls.dispose();renderer.domElement.removeEventListener('pointerdown',pointerDown);renderer.domElement.removeEventListener('pointerup',pointerUp);scene.traverse(o=>{if(o instanceof THREE.Mesh||o instanceof THREE.LineSegments){o.geometry.dispose();const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>m.dispose())}});original.forEach(m=>m.dispose());shellAlternatives.forEach(g=>{g.solid.dispose();g.hollow.dispose()});Object.values(materials).forEach(m=>m.dispose());env.dispose();renderer.dispose();renderer.domElement.remove();labels.remove()}};
}
