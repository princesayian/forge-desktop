import { useState, useEffect, useRef } from 'react';
import { G, TEAM_RANKS, NK_ALIGNMENTS, ALIGN_META, raceLabel, raceLore } from '../constants/index.js';
import RaceSelector from './RaceSelector.jsx';
import InspirationsField from './InspirationsField.jsx';

export default function EditPanel({member,onSave,onCancel,callAI,teamName}){
  const[heroName,setHeroName]=useState(member.heroName||"");
  const[realName,setRealName]=useState(member.realName||"");
  const[t,setT]=useState(member.tagline||"");
  const[o,setO]=useState(member.origin||"");
  const[stats,setStats]=useState({...member.stats});
  const[powers,setPowers]=useState(member.powers.map(p=>({...p})));
  const[align,setAlign]=useState(member.nkAlignment||"neutral");
  const[teamRank,setTeamRank]=useState(member.teamRank||"operative");
  const[gender,setGender]=useState(member.gender||"");
  const[race,setRace]=useState(member.race||null);
  const[birthYear,setBirthYear]=useState(member.birthYear||"");
  const[age,setAge]=useState(member.birthYear?String(2026-parseInt(member.birthYear)):(member.age||""));
  const[heroType,setHeroType]=useState(member.heroType||"hero");
  const[powerType,setPowerType]=useState(member.powerType||"powers");
  const[hometown,setHometown]=useState(member.hometown||"");
  const[baseOfOps,setBaseOfOps]=useState(member.baseOfOps||"");
  const[inspirations,setInspirations]=useState(member.inspirations||[]);
  const[storyDir,setStoryDir]=useState("");
  const[regenLoading,setRegenLoading]=useState(false);
  const[nameError,setNameError]=useState("");
  const[nameChecking,setNameChecking]=useState(false);
  const nameTimerRef=useRef(null);
  const c=member.color;

  useEffect(()=>{
    const trimmed=heroName.trim();
    if(!trimmed||(member.heroName||"").toLowerCase()===trimmed.toLowerCase()){
      setNameError("");setNameChecking(false);return;
    }
    setNameChecking(true);
    clearTimeout(nameTimerRef.current);
    nameTimerRef.current=setTimeout(async()=>{
      try{
        const res=await fetch("/api/validate-name",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:trimmed,char_id:member.id})});
        const d=await res.json();
        setNameError(d.available?"":(`"${d.taken_by||trimmed}" is already claimed by another character`));
      }catch(e){setNameError("");}
      setNameChecking(false);
    },420);
    return()=>clearTimeout(nameTimerRef.current);
  },[heroName,member.heroName,member.id]);
  async function regenOrigin(){
    if(!callAI)return;
    setRegenLoading(true);
    try{
      const rl=raceLabel(race);
      const rc=raceLore(race);
      const p=await callAI(`Regenerate the origin story for this character. JSON only, key "origin".\n\nCharacter: ${member.heroName} (${member.realName})\nRole: ${member.role||"Hero"}\nTeam: ${teamName||"Unknown"}\nRace: ${rl||"Unspecified"}\nRace lore: ${rc||"No special racial traits"}\nPowers: ${(member.powers||[]).map(pw=>pw.name).join(", ")}\nCurrent origin: ${o}\n${storyDir.trim()?`Story direction (shape the new origin around this): ${storyDir.trim()}\n`:""}\nWrite a new origin (2-3 sentences) rooted in their racial biology and history${storyDir.trim()?" and the story direction given":""}.${!storyDir.trim()?" Keep their core identity but reshape the backstory through their race.":""}\n{"origin":"new origin here"}`);
      if(p?.origin) setO(p.origin);
    }catch(e){}
    setRegenLoading(false);
  }
  return(<div style={{padding:"18px 20px",background:"var(--bg-card2, #07070E)",border:`1px solid ${c}33`,borderRadius:"0 0 12px 12px"}}>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
      <div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:5}}>
          <div style={{fontSize:10,letterSpacing:"0.12em",color:`${c}88`,textTransform:"uppercase"}}>Hero Name</div>
          {nameChecking&&<div style={{fontSize:9,color:`${c}66`,fontFamily:"var(--font-mono)"}}>checking…</div>}
        </div>
        <input type="text" value={heroName} onChange={e=>setHeroName(e.target.value)} style={{padding:"7px 10px",borderColor:nameError?`#C0392B66`:undefined}}/>
        {nameError&&<div style={{fontSize:10,color:"#C0392B",marginTop:3,fontFamily:"var(--font-mono)"}}>{nameError}</div>}
      </div>
      <div>
        <div style={{fontSize:10,letterSpacing:"0.12em",color:`${c}88`,textTransform:"uppercase",marginBottom:5}}>Real Name</div>
        <input type="text" value={realName} onChange={e=>setRealName(e.target.value)} style={{padding:"7px 10px"}}/>
      </div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
      <div>
        <div style={{fontSize:10,letterSpacing:"0.12em",color:`${c}88`,textTransform:"uppercase",marginBottom:5}}>Hometown</div>
        <input type="text" placeholder="e.g. Chicago, IL" value={hometown} onChange={e=>setHometown(e.target.value)} style={{padding:"7px 10px"}}/>
      </div>
      <div>
        <div style={{fontSize:10,letterSpacing:"0.12em",color:`${c}88`,textTransform:"uppercase",marginBottom:5}}>Base of Operations <span style={{opacity:0.55,fontSize:9}}>(override)</span></div>
        <input type="text" placeholder="If different from team base" value={baseOfOps} onChange={e=>setBaseOfOps(e.target.value)} style={{padding:"7px 10px"}}/>
      </div>
    </div>
    <InspirationsField value={inspirations} onChange={setInspirations} accentColor={c}/>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
      <div>
        <div style={{fontSize:10,letterSpacing:"0.12em",color:`${c}88`,textTransform:"uppercase",marginBottom:5}}>Gender</div>
        <select value={gender} onChange={e=>setGender(e.target.value)} style={{width:"100%",padding:"7px 10px",background:"var(--bg2)",border:"1px solid var(--border2)",borderRadius:7,color:"var(--text-primary)",fontSize:12}}>
          <option value="">— unset —</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Non-binary">Non-binary</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <div>
        <div style={{fontSize:10,letterSpacing:"0.12em",color:`${c}88`,textTransform:"uppercase",marginBottom:5}}>Birth Year</div>
        <input type="number" placeholder="e.g. 1995" value={birthYear} onChange={e=>{setBirthYear(e.target.value);setAge(e.target.value?String(2026-parseInt(e.target.value)):"");}} style={{padding:"7px 10px"}}/>
      </div>
      <div>
        <div style={{fontSize:10,letterSpacing:"0.12em",color:`${c}88`,textTransform:"uppercase",marginBottom:5}}>Age {birthYear&&age?`(${age} yrs)`:""}</div>
        <input type="text" placeholder="e.g. 28 or Unknown" value={age} onChange={e=>setAge(e.target.value)} style={{padding:"7px 10px"}}/>
      </div>
    </div>
    <div style={{marginBottom:14}}>
      <div style={{fontSize:10,letterSpacing:"0.12em",color:`${c}88`,textTransform:"uppercase",marginBottom:8}}>Race</div>
      <RaceSelector value={race} onChange={setRace} color={c}/>
    </div>
    <div style={{fontSize:10,letterSpacing:"0.18em",color:`${c}88`,textTransform:"uppercase",marginBottom:6}}>Tagline</div>
    <input type="text" value={t} onChange={e=>setT(e.target.value)} style={{marginBottom:14}}/>
    {callAI&&<div style={{marginBottom:10}}>
      <div style={{fontSize:10,letterSpacing:"0.12em",color:`${c}88`,textTransform:"uppercase",marginBottom:5}}>Story Direction <span style={{opacity:0.55}}>(optional)</span></div>
      <input type="text" placeholder="e.g. Betrayed by their mentor · Found faith after losing everything" value={storyDir} onChange={e=>setStoryDir(e.target.value)} style={{padding:"6px 10px",fontSize:11.5}}/>
    </div>}
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
      <div style={{fontSize:10,letterSpacing:"0.18em",color:`${c}88`,textTransform:"uppercase"}}>Origin</div>
      {callAI&&<button onClick={regenOrigin} disabled={regenLoading} style={{fontSize:9.5,padding:"2px 10px",background:`${c}14`,border:`1px solid ${c}55`,borderRadius:12,cursor:"pointer",color:c,fontFamily:"var(--font-mono)",opacity:regenLoading?0.6:1}}>
        {regenLoading?"Generating...":"↺ Regenerate from Race"}
      </button>}
    </div>
    <textarea value={o} onChange={e=>setO(e.target.value)} style={{height:80,marginBottom:14}}/>
    <div style={{fontSize:10,letterSpacing:"0.18em",color:`${c}88`,textTransform:"uppercase",marginBottom:8}}>Team Rank</div>
    <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>
      {TEAM_RANKS.map(r=><button key={r.id} onClick={()=>setTeamRank(r.id)} style={{fontSize:10,padding:"3px 10px",background:teamRank===r.id?`${r.color||G}22`:"var(--bg3)",border:`1px solid ${teamRank===r.id?(r.color||G):"var(--border2)"}`,borderRadius:20,cursor:"pointer",color:teamRank===r.id?(r.color||G):"var(--text2)",fontFamily:"var(--font-mono)"}}>{r.icon?`${r.icon} `:""}{r.label}</button>)}
    </div>
    <div style={{fontSize:10,letterSpacing:"0.18em",color:`${c}88`,textTransform:"uppercase",marginBottom:8}}>Team Alignment</div>
    <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>
      {[{id:"base",label:"Member"},...NK_ALIGNMENTS].map(a=><button key={a.id} onClick={()=>setAlign(a.id)} style={{fontSize:10,padding:"3px 10px",background:align===a.id?`${(ALIGN_META[a.id]||{color:G}).color}22`:"var(--bg3)",border:`1px solid ${align===a.id?(ALIGN_META[a.id]||{color:G}).color:"var(--border2)"}`,borderRadius:20,cursor:"pointer",color:align===a.id?(ALIGN_META[a.id]||{color:G}).color:"var(--text2)",fontFamily:"var(--font-mono)"}}>{a.label}</button>)}
    </div>
    {!member.isVillain&&(<>
      <div style={{fontSize:10,letterSpacing:"0.18em",color:`${c}88`,textTransform:"uppercase",marginBottom:8}}>Hero Type</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>
        {[{id:"hero",label:"Hero"},{id:"anti-hero",label:"Anti-Hero"},{id:"reluctant",label:"Reluctant Hero"}].map(ht=><button key={ht.id} onClick={()=>setHeroType(ht.id)} style={{fontSize:10,padding:"3px 10px",background:heroType===ht.id?`${c}22`:"var(--bg3)",border:`1px solid ${heroType===ht.id?c:"var(--border2)"}`,borderRadius:20,cursor:"pointer",color:heroType===ht.id?c:"var(--text2)",fontFamily:"var(--font-mono)"}}>{ht.label}</button>)}
      </div>
    </>)}
    <div style={{fontSize:10,letterSpacing:"0.18em",color:`${c}88`,textTransform:"uppercase",marginBottom:8}}>Stats</div>
    <div className="fstats-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>{Object.entries(stats).map(([k,v])=>(<div key={k}><div style={{fontSize:10,color:"var(--text2)",marginBottom:4,textTransform:"uppercase"}}>{k}</div><input type="number" min="1" max="100" value={v} onChange={e=>setStats(p=>({...p,[k]:Math.min(100,Math.max(1,+e.target.value))}))} style={{padding:"6px 10px"}}/></div>))}</div>
    <div style={{fontSize:10,letterSpacing:"0.18em",color:`${c}88`,textTransform:"uppercase",marginBottom:8}}>Ability Type</div>
    <div style={{display:"flex",gap:6,marginBottom:12}}>
      {[{id:"powers",label:"Powers",hint:"Superpowers / mutations"},{id:"equipment",label:"Arsenal",hint:"Gadgets / tech / weapons"},{id:"skills",label:"Skills",hint:"Training / peak human"}].map(pt=>(
        <button key={pt.id} onClick={()=>setPowerType(pt.id)} title={pt.hint} style={{fontSize:10,padding:"4px 12px",background:powerType===pt.id?`${c}22`:"var(--bg3)",border:`1px solid ${powerType===pt.id?c:"var(--border2)"}`,borderRadius:20,cursor:"pointer",color:powerType===pt.id?c:"var(--text2)",fontFamily:"var(--font-mono)"}}>{pt.label}</button>
      ))}
    </div>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
      <div style={{fontSize:10,letterSpacing:"0.18em",color:`${c}88`,textTransform:"uppercase"}}>{powerType==="equipment"?"Arsenal / Gear":powerType==="skills"?"Skills & Abilities":"Powers"}</div>
      <button onClick={()=>setPowers(p=>[...p,{name:"",desc:""}])} style={{fontSize:9.5,padding:"2px 10px",background:`${c}14`,border:`1px solid ${c}55`,borderRadius:12,cursor:"pointer",color:c,fontFamily:"var(--font-mono)"}}>+ Add</button>
    </div>
    {powers.map((p,i)=>(
      <div key={i} style={{marginBottom:10,position:"relative"}}>
        <div style={{display:"flex",gap:5,alignItems:"flex-start"}}>
          <div style={{flex:1}}>
            <input type="text" placeholder={powerType==="equipment"?"Gadget / weapon name":powerType==="skills"?"Skill / technique name":"Power name"} value={p.name} onChange={e=>setPowers(pw=>pw.map((x,j)=>j===i?{...x,name:e.target.value}:x))} style={{marginBottom:4}}/>
            <input type="text" placeholder="Description" value={p.desc} onChange={e=>setPowers(pw=>pw.map((x,j)=>j===i?{...x,desc:e.target.value}:x))}/>
          </div>
          <button onClick={()=>setPowers(pw=>pw.filter((_,j)=>j!==i))} title="Remove" style={{marginTop:3,flexShrink:0,width:22,height:22,display:"flex",alignItems:"center",justifyContent:"center",background:"transparent",border:`1px solid ${c}30`,borderRadius:5,cursor:"pointer",color:`${c}66`,fontSize:14,fontFamily:"var(--font-mono)",lineHeight:1}}>×</button>
        </div>
      </div>
    ))}
    <div style={{display:"flex",gap:10,marginTop:16}}>
      <button onClick={onCancel} style={{flex:1,padding:"10px",background:"var(--bg3)",border:"1px solid var(--border2)",borderRadius:8,cursor:"pointer",color:"var(--text2)",fontSize:12}}>Cancel</button>
      <button onClick={()=>onSave({heroName,realName,tagline:t,origin:o,stats,powers,nkAlignment:align,teamRank,gender,age,birthYear,race,species:raceLabel(race)||member.species||"",powerType,hometown:hometown.trim(),baseOfOps:baseOfOps.trim(),inspirations:inspirations.filter(s=>s.trim()),...(!member.isVillain&&{heroType})})} disabled={!!nameError||nameChecking} style={{flex:2,padding:"10px",background:nameError?`#C0392B18`:`${c}18`,border:`1px solid ${nameError?"#C0392B":c}`,borderRadius:8,cursor:(nameError||nameChecking)?"not-allowed":"pointer",color:nameError?"#C0392B":c,fontSize:12,letterSpacing:"0.1em",textTransform:"uppercase",opacity:(nameError||nameChecking)?0.6:1}}>{nameChecking?"Checking name…":nameError?"Name taken":"Save Changes"}</button>
    </div>
  </div>);
}
