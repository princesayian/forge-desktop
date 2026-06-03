export const autoScore=m=>{const v=Object.values(m.stats||{});return v.length?Math.round(v.reduce((a,b)=>a+b,0)/v.length):0;};
export const autoTierFn=m=>{const sc=autoScore(m);return sc>=85?"S":sc>=70?"A":sc>=55?"B":"C";};
export const pronounOf=g=>g==="Female"?"she":g==="Non-binary"?"they":"he";
export const ageStage=age=>{const n=parseInt(age);if(isNaN(n))return "";if(n<13)return "child";if(n<18)return "teen";if(n<=25)return "young adult";return "adult";};
