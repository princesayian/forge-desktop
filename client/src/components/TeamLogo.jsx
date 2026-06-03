import { G } from '../constants/index.js';

export default function TeamLogo({team,size=40,imageUrl=null,style:extra={}}){
  const c=team.color||G;
  const seed=team.logoSeed!=null?team.logoSeed:Math.abs((team.id||'').split('').reduce((a,ch)=>((a<<5)-a)+ch.charCodeAt(0)|0,0));
  const t=seed%8;
  const sw=size<30?0.9:1.3;
  const d=Math.round(size*0.72);
  const shapes=[
    <g key="s"><polygon points="16,3 26,8 26,18 16,28 6,18 6,8" fill={`${c}30`} stroke={c} strokeWidth={sw}/><polygon points="16,9 21,12 21,18 16,23 11,18 11,12" fill={c} opacity="0.5"/></g>,
    <g key="s"><polygon points="16,3 26.5,9 26.5,23 16,29 5.5,23 5.5,9" fill="none" stroke={c} strokeWidth={sw}/><polygon points="16,8 21.5,11.25 21.5,20.75 16,24 10.5,20.75 10.5,11.25" fill={c} opacity="0.4"/></g>,
    <g key="s"><polygon points="20,2 8,18 15,18 12,30 24,14 17,14" fill={c} opacity="0.9"/></g>,
    <g key="s"><rect x="9" y="9" width="14" height="14" transform="rotate(45,16,16)" fill={`${c}25`} stroke={c} strokeWidth={sw}/><line x1="16" y1="2" x2="16" y2="11" stroke={c} strokeWidth={sw*0.8} opacity="0.5"/><line x1="16" y1="21" x2="16" y2="30" stroke={c} strokeWidth={sw*0.8} opacity="0.5"/><line x1="2" y1="16" x2="11" y2="16" stroke={c} strokeWidth={sw*0.8} opacity="0.5"/><line x1="21" y1="16" x2="30" y2="16" stroke={c} strokeWidth={sw*0.8} opacity="0.5"/><circle cx="16" cy="16" r="3.5" fill={c}/></g>,
    <g key="s"><path d="M16 2 L18.5 13.5 L30 16 L18.5 18.5 L16 30 L13.5 18.5 L2 16 L13.5 13.5 Z" fill={c} opacity="0.85"/></g>,
    <g key="s"><polyline points="5,22 16,8 27,22" fill="none" stroke={c} strokeWidth={sw*1.7} strokeLinejoin="round" strokeLinecap="round"/><polyline points="7,27 16,14 25,27" fill="none" stroke={c} strokeWidth={sw*1.3} strokeLinejoin="round" strokeLinecap="round" opacity="0.42"/></g>,
    <g key="s"><circle cx="16" cy="16" r="3.5" fill={c}/><ellipse cx="16" cy="16" rx="13" ry="5.5" fill="none" stroke={c} strokeWidth={sw*0.9} opacity="0.65"/><ellipse cx="16" cy="16" rx="13" ry="5.5" fill="none" stroke={c} strokeWidth={sw*0.9} opacity="0.65" transform="rotate(60,16,16)"/><ellipse cx="16" cy="16" rx="13" ry="5.5" fill="none" stroke={c} strokeWidth={sw*0.9} opacity="0.65" transform="rotate(120,16,16)"/></g>,
    <g key="s"><polygon points="16,4 29,27 3,27" fill="none" stroke={c} strokeWidth={sw}/><polygon points="16,11 23.5,25 8.5,25" fill={c} opacity="0.42"/></g>,
  ];
  return(
    <div style={{width:size,height:size,borderRadius:Math.round(size*0.22),background:`linear-gradient(160deg,${c}28 0%,${c}10 100%)`,border:`1px solid ${c}50`,borderBottomColor:`${c}20`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,overflow:"hidden",boxShadow:`0 4px 10px rgba(0,0,0,0.45),0 2px 3px rgba(0,0,0,0.3),inset 0 1px 0 rgba(255,255,255,0.12),inset 0 -1px 0 rgba(0,0,0,0.25),0 0 12px ${c}18`,...extra}}>
      {imageUrl?<img src={imageUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"center"}}/>:<svg width={d} height={d} viewBox="0 0 32 32">{shapes[t]}</svg>}
    </div>
  );
}
