export function texture(T,d){let c=document.createElement('canvas');c.width=720;c.height=460;const g=c.getContext('2d');const backgrounds=['#d9df6b','#e4b3a2','#292e29','#d5d7ce','#404a39','#bdc9db'];g.fillStyle=backgrounds[d.art];g.fillRect(0,0,720,460);g.save();g.beginPath();g.rect(0,0,720,460);g.clip();g.strokeStyle=d.art===2||d.art===4?'#cadba2':'#394335';g.fillStyle=g.strokeStyle;g.lineWidth=2.5;
if(d.art===0){g.font='180px Georgia';g.fillText('FORM',35,205);g.font='italic 180px Georgia';g.fillText('/ field',30,386)}
if(d.art===1){for(let i=0;i<17;i++){g.save();g.translate(360,230);g.rotate(i*.16);g.beginPath();g.ellipse(0,0,45+i*15,170-i*4,0,0,Math.PI*2);g.stroke();g.restore()}}
if(d.art===2){for(let i=0;i<25;i++){g.beginPath();g.moveTo(30+i*28,0);g.bezierCurveTo(500-i*5,150,140+i*6,320,30+i*28,460);g.stroke()}}
if(d.art===3){g.font='italic 82px Georgia';for(let i=0;i<7;i++){g.globalAlpha=.3+i*.1;g.fillText('echo echo echo',22+i*8,40+i*73)}g.globalAlpha=1}
if(d.art===4){for(let i=0;i<240;i++){g.beginPath();g.arc(25+(i%24)*29,25+Math.floor(i/24)*45,2+7*(1+Math.sin(i*.4))/2,0,Math.PI*2);g.fill()}}
if(d.art===5){g.fillStyle='#dae2e5';g.beginPath();g.arc(360,230,170,0,7);g.fill();g.fillStyle='#38464d';g.beginPath();g.arc(360,230,106,0,7);g.fill();g.fillStyle='#d5de6d';g.beginPath();g.arc(420,180,35,0,7);g.fill()}
g.restore();const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;
// Pre-blur once, then crossfade on the GPU so hover stays light while rotating.
const blurred=document.createElement('canvas');blurred.width=c.width;blurred.height=c.height;
const bg=blurred.getContext('2d');bg.fillStyle=backgrounds[d.art];bg.fillRect(0,0,c.width,c.height);
bg.filter='blur(20px)';bg.drawImage(c,0,0);
const blurredTexture=new T.CanvasTexture(blurred);blurredTexture.colorSpace=T.SRGBColorSpace;
return {texture:t,blurredTexture,url:c.toDataURL()} }
