import { ALIGN_META, TEAM_RANKS, raceLabel } from '../constants/index.js';
import AlignmentBadge from './AlignmentBadge.jsx';
import StatBar from './StatBar.jsx';

export default function CharacterPage({member,imageUrl,isVillain=false,teamName,teamColor}){
  const c=member.color,cl=member.colorLight||c;
  const tName=teamName||"Unknown Team";

  const pt=member.powerType||"powers";
  const ptLabel=pt==="equipment"?"ARSENAL":pt==="skills"?"SKILL SET":"KEY STRENGTHS";
  const ptSection=pt==="equipment"?"Arsenal / Gear":pt==="skills"?"Skills & Abilities":"Powers";

  const powerNames=(member.powers||[]).slice(0,3).map(p=>p.name).filter(s=>s&&s.length>2&&s.length<60);
  const labels=powerNames.length>=1?powerNames:[
    member.role||"Operative",
    (()=>{const s=raceLabel(member.race)||member.species||"";return s&&s!=="Human"?s:"Enhanced Operative";})(),
    member.powerFX?(member.powerFX.split(/[,.]/).map(s=>s.trim()).find(s=>s.length>6&&s.length<55)||null):null
  ].filter(Boolean).slice(0,3);

  const keyStrengths=(member.powers||[]).slice(0,3).map(p=>p.name).join(", ");
  const affiliationLine=[tName,member.nkAlignment&&member.nkAlignment!=="base"?(ALIGN_META[member.nkAlignment]?.label||member.nkAlignment):null].filter(Boolean).join(", ");

  return(<div style={{background:"#07070E",overflow:"hidden"}}>
    <div style={{background:isVillain?"rgba(163,45,45,0.18)":`${c}12`,padding:"7px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1px solid ${c}20`}}>
      <div style={{fontSize:7.5,letterSpacing:"0.26em",color:cl,textTransform:"uppercase",fontFamily:"var(--font-mono)"}}>{isVillain?"CLASSIFIED THREAT":tName.toUpperCase()}</div>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        {(()=>{const rk=TEAM_RANKS.find(r=>r.id===member.teamRank);return rk&&rk.icon?<span style={{fontSize:9,padding:"2px 9px",background:`${rk.color}18`,border:`1px solid ${rk.color}55`,borderRadius:20,color:rk.color,fontFamily:"var(--font-mono)",whiteSpace:"nowrap",fontWeight:"bold"}}>{rk.icon} {rk.label}</span>:null;})()}
        {member.nkAlignment&&member.nkAlignment!=="base"&&<AlignmentBadge alignment={member.nkAlignment}/>}
        {member.number&&<div style={{fontSize:9.5,color:`${c}66`,fontFamily:"var(--font-mono)"}}>No.{member.number}</div>}
      </div>
    </div>
    <div style={{padding:"14px 20px 10px",borderBottom:`3px solid ${c}`}}>
      <div className="fchar-name" style={{fontSize:28,fontWeight:900,textTransform:"uppercase",letterSpacing:"0.04em",color:"var(--text-primary)",lineHeight:1,marginBottom:3,fontFamily:"var(--font-body)"}}>{member.heroName}</div>
      <div style={{fontSize:11,fontStyle:"italic",color:"var(--text2)"}}>{[member.realName,member.role].filter(Boolean).join("  ·  ")}</div>
    </div>
    <div className="fchar-grid" style={{display:"grid",gridTemplateColumns:"1.05fr 1fr",minHeight:330}}>
      <div style={{position:"relative",overflow:"hidden",background:`${c}05`}}>
        {imageUrl
          ?<img src={imageUrl} alt={member.heroName} style={{width:"100%",height:"100%",minHeight:360,objectFit:"cover",objectPosition:"center top",display:"block"}}/>
          :<div style={{minHeight:360,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10}}>
             <div style={{width:62,height:62,borderRadius:"50%",background:`${c}12`,border:`2px dashed ${c}40`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:"bold",color:c}}>{member.initials}</div>
             <div style={{fontSize:9,color:"var(--text4)"}}>{isVillain?"IMAGE CLASSIFIED":"No image uploaded"}</div>
           </div>
        }
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to right,transparent 52%,#07070E 97%)",pointerEvents:"none"}}/>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,#07070E 0%,transparent 28%)",pointerEvents:"none"}}/>
        {labels.map((txt,i)=>(
          <div key={i} style={{position:"absolute",top:i===0?"14%":i===1?"44%":"72%",right:0,display:"flex",alignItems:"center",pointerEvents:"none"}}>
            <div style={{width:28,height:1,background:`${c}55`,flexShrink:0}}/>
            <div style={{padding:"3px 7px",background:"rgba(7,7,14,0.88)",border:`1px solid ${c}30`,borderRadius:"0 3px 3px 0",maxWidth:118}}>
              <div style={{fontSize:7.5,color:"var(--text2)",lineHeight:1.4}}>{txt}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{padding:"14px 16px",display:"flex",flexDirection:"column",gap:11,background:"#07070E"}}>
        {member.tagline&&<div style={{fontSize:10.5,fontStyle:"italic",color:"var(--text2)",lineHeight:1.65,borderLeft:`2px solid ${c}`,paddingLeft:8}}>{member.tagline}</div>}
        <div style={{border:`1.5px solid ${c}`,borderRadius:4,overflow:"hidden"}}>
          <div style={{background:c,padding:"4px 10px",textAlign:"center"}}>
            <span style={{fontSize:8.5,fontWeight:900,letterSpacing:"0.22em",color:"#07070E",fontFamily:"var(--font-mono)"}}>DATA FILE</span>
          </div>
          <div style={{padding:"8px 10px",display:"flex",flexDirection:"column",gap:4}}>
            <div><span style={{fontSize:8.5,fontWeight:"bold",color:cl,letterSpacing:"0.04em"}}>AFFILIATION: </span><span style={{fontSize:8.5,color:"var(--text2)"}}>{affiliationLine}</span></div>
            <div><span style={{fontSize:8.5,fontWeight:"bold",color:cl,letterSpacing:"0.04em"}}>{ptLabel}: </span><span style={{fontSize:8.5,color:"var(--text2)"}}>{keyStrengths}</span></div>
            {(member.gender||member.age||member.birthYear)&&<div><span style={{fontSize:8.5,fontWeight:"bold",color:cl,letterSpacing:"0.04em"}}>PROFILE: </span><span style={{fontSize:8.5,color:"var(--text2)"}}>{[member.gender,member.age&&`Age ${member.age}`,member.birthYear&&`b. ${member.birthYear}`].filter(Boolean).join(" · ")}</span></div>}
            {member.race&&<div><span style={{fontSize:8.5,fontWeight:"bold",color:cl,letterSpacing:"0.04em"}}>RACE: </span><span style={{fontSize:8.5,color:"var(--text2)"}}>{raceLabel(member.race)}</span></div>}
            <div><span style={{fontSize:8.5,fontWeight:"bold",color:cl,letterSpacing:"0.04em"}}>STATUS: </span><span style={{fontSize:8.5,color:isVillain?"#E07070":"var(--text2)"}}>{isVillain?"HIGH PRIORITY THREAT":member.nkAlignment==="base"?"OPERATIVE":"ASSOCIATE"}</span></div>
          </div>
        </div>
      </div>
    </div>
    <div style={{padding:"14px 18px 12px",borderTop:`1px solid ${c}18`,borderBottom:`1px solid ${c}18`}}>
      <div style={{fontSize:7.5,letterSpacing:"0.22em",color:`${c}77`,textTransform:"uppercase",fontFamily:"var(--font-mono)",marginBottom:10}}>{ptSection}</div>
      <div className="fpowers-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"14px 24px"}}>
        {(member.powers||[]).map((p,i)=>(
          <div key={i}>
            <div style={{fontSize:9.5,fontWeight:900,textTransform:"uppercase",letterSpacing:"0.13em",color:cl,marginBottom:5,paddingBottom:3,borderBottom:`1px solid ${c}30`}}>{p.name}</div>
            <div style={{fontSize:10,color:"var(--text3)",lineHeight:1.66}}>{p.desc}</div>
          </div>
        ))}
      </div>
    </div>
    {member.origin&&<div style={{padding:"10px 18px",borderBottom:`1px solid ${c}14`}}>
      <div style={{fontSize:7.5,letterSpacing:"0.22em",color:`${c}77`,textTransform:"uppercase",fontFamily:"var(--font-mono)",marginBottom:5}}>Origin</div>
      <div style={{fontSize:10.5,color:"var(--text3)",lineHeight:1.72}}>{member.origin}</div>
    </div>}
    <div style={{padding:"10px 18px 14px"}}>
      <div style={{fontSize:7.5,letterSpacing:"0.22em",color:`${c}77`,textTransform:"uppercase",fontFamily:"var(--font-mono)",marginBottom:8}}>Stats</div>
      {Object.entries(member.stats||{}).map(([k,v])=><StatBar key={k} label={k} value={v} color={c}/>)}
    </div>
    <div style={{borderTop:`1px solid ${c}18`,padding:"7px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",background:`${c}06`}}>
      <div style={{fontSize:7.5,letterSpacing:"0.15em",color:"var(--text4)"}}>{isVillain?"HIGH PRIORITY TARGET · CLASSIFIED":`${tName.toUpperCase()} · CLASSIFIED`}</div>
      {member.number&&<div style={{fontSize:22,fontWeight:900,color:`${c}22`,fontFamily:"var(--font-mono)",lineHeight:1}}>#{member.number}</div>}
    </div>
  </div>);
}
