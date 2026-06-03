export const autoScore=m=>{const v=Object.values(m.stats||{});return v.length?Math.round(v.reduce((a,b)=>a+b,0)/v.length):0;};
export const autoTierFn=m=>{const sc=autoScore(m);return sc>=85?"S":sc>=70?"A":sc>=55?"B":"C";};
export const pronounOf=g=>g==="Female"?"she":g==="Non-binary"?"they":"he";
export const ageStage=age=>{const n=parseInt(age);if(isNaN(n))return "";if(n<13)return "child";if(n<18)return "teen";if(n<=25)return "young adult";return "adult";};

const _CL=[
  {h:"#FF0000",n:"bright red"},{h:"#CC0000",n:"dark red"},{h:"#8B0000",n:"deep blood red"},
  {h:"#8B1A1A",n:"deep crimson"},{h:"#A32D2D",n:"dark crimson"},{h:"#DC143C",n:"crimson"},
  {h:"#B22222",n:"firebrick red"},{h:"#FF4500",n:"vivid orange-red"},
  {h:"#FF6600",n:"vivid orange"},{h:"#FF8C00",n:"deep orange"},{h:"#993C1D",n:"burnt rust"},
  {h:"#8B4513",n:"saddle brown"},{h:"#D35400",n:"pumpkin orange"},{h:"#A0522D",n:"sienna"},
  {h:"#F0997B",n:"warm coral"},{h:"#E07070",n:"rose pink"},{h:"#CD853F",n:"warm tan"},
  {h:"#FFD700",n:"bright gold"},{h:"#D4AF37",n:"antique gold"},{h:"#BA7517",n:"amber gold"},
  {h:"#FFA500",n:"orange gold"},{h:"#F39C12",n:"golden yellow"},{h:"#B8860B",n:"dark gold"},
  {h:"#00FF00",n:"lime green"},{h:"#32CD32",n:"lime green"},{h:"#2ECC71",n:"emerald green"},
  {h:"#27AE60",n:"medium green"},{h:"#1D9E75",n:"deep emerald green"},
  {h:"#0F6E56",n:"dark teal green"},{h:"#1A5C2A",n:"forest green"},
  {h:"#145A32",n:"deep forest green"},{h:"#006400",n:"dark green"},
  {h:"#5DCAA5",n:"seafoam teal"},{h:"#00FF7F",n:"spring green"},
  {h:"#00FFFF",n:"bright cyan"},{h:"#00CED1",n:"dark turquoise"},
  {h:"#00bdb0",n:"electric cyan"},{h:"#20B2AA",n:"light sea green"},
  {h:"#008B8B",n:"dark teal"},{h:"#40E0D0",n:"turquoise"},
  {h:"#48D1CC",n:"medium turquoise"},{h:"#7FFFD4",n:"aquamarine"},
  {h:"#87CEEB",n:"sky blue"},{h:"#87CEFA",n:"light sky blue"},
  {h:"#6495ED",n:"cornflower blue"},{h:"#5EB1FF",n:"bright cornflower blue"},
  {h:"#85B7EB",n:"powder blue"},{h:"#AED6F1",n:"pale blue"},
  {h:"#378ADD",n:"vivid sky blue"},{h:"#2980B9",n:"ocean blue"},
  {h:"#1E90FF",n:"dodger blue"},{h:"#4169E1",n:"royal blue"},
  {h:"#0066CC",n:"electric blue"},{h:"#0000FF",n:"blue"},
  {h:"#0000CD",n:"medium blue"},{h:"#185FA5",n:"cobalt blue"},
  {h:"#1A237E",n:"deep navy blue"},{h:"#003366",n:"midnight blue"},
  {h:"#8B00FF",n:"electric violet"},{h:"#9400D3",n:"dark violet"},
  {h:"#800080",n:"purple"},{h:"#4B0082",n:"indigo"},
  {h:"#534AB7",n:"deep violet"},{h:"#2D1B69",n:"midnight indigo"},
  {h:"#6A0DAD",n:"dark purple"},{h:"#8B2FC9",n:"deep purple"},
  {h:"#AFA9EC",n:"soft lavender"},{h:"#DDA0DD",n:"plum"},
  {h:"#EE82EE",n:"violet"},{h:"#DA70D6",n:"orchid"},
  {h:"#FF00FF",n:"magenta"},{h:"#FF1493",n:"deep pink"},
  {h:"#FF69B4",n:"hot pink"},{h:"#8B1A8B",n:"deep magenta"},
  {h:"#FFB6C1",n:"light pink"},{h:"#C0392B",n:"strong red"},
  {h:"#FFFFFF",n:"white"},{h:"#F5F5F5",n:"off-white"},{h:"#F8F8FF",n:"ghost white"},
  {h:"#C0C0C0",n:"silver"},{h:"#A9A9A9",n:"dark silver"},{h:"#808080",n:"gray"},
  {h:"#696969",n:"dim gray"},{h:"#888780",n:"warm gray"},
  {h:"#3D4A5C",n:"dark slate blue-gray"},{h:"#2C3E50",n:"dark blue-gray"},
  {h:"#000000",n:"black"},{h:"#1C1C1C",n:"near black"},{h:"#1A1A2E",n:"midnight black"},
];
export function hexToColorName(hex){
  if(!hex)return"primary color";
  const h=hex.replace("#","").toLowerCase();
  if(h.length!==6)return hex;
  const r=parseInt(h.slice(0,2),16),g=parseInt(h.slice(2,4),16),b=parseInt(h.slice(4,6),16);
  let best=_CL[0],min=Infinity;
  for(const c of _CL){
    const ch=c.h.replace("#","");
    const cr=parseInt(ch.slice(0,2),16),cg=parseInt(ch.slice(2,4),16),cb=parseInt(ch.slice(4,6),16);
    const d=(r-cr)**2+(g-cg)**2+(b-cb)**2;
    if(d<min){min=d;best=c;}
  }
  return best.n;
}
