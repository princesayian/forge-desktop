import { useState } from 'react';
import { G, NK_ALIGNMENTS, ALIGN_META, TEAM_COLORS, TEAM_TYPES, randTeamName } from '../constants/index.js';
import TeamLogo from './TeamLogo.jsx';

export default function TeamCreator({teams,members=[],onSave,onCancel,callAI,ollamaOk,initialData}){
  const[step,setStep]=useState(1);
  const[name,setName]=useState(initialData?.name||"");
  const[abbr,setAbbr]=useState(initialData?.abbr||"");
  const[color,setColor]=useState(initialData?.color||"#534AB7");
  const[type,setType]=useState(initialData?.type||"street");
  const[align,setAlign]=useState(initialData?.nkAlignment||"neutral");
  const[desc,setDesc]=useState(initialData?.description||"");
  const[motto,setMotto]=useState(initialData?.motto||"");
  const[origin,setOrigin]=useState(initialData?.origin||"");
  const[genLoading,setGenLoading]=useState(false);
  const[genError,setGenError]=useState("");
  const[genElapsed,setGenElapsed]=useState(0);
  const[logoSeed,setLogoSeed]=useState(initialData?.logoSeed??Math.floor(Math.random()*8));
  const[relatedTeams,setRelatedTeams]=useState([]);
  const[relatedMembers,setRelatedMembers]=useState([]);
  const[loreHint,setLoreHint]=useState("");
  const autoAbbr=n=>n.split(" ").map(w=>w[0]||"").join("").toUpperCase().slice(0,3)||"??";
  const handleName=n=>{setName(n);if(!abbr||abbr===autoAbbr(name))setAbbr(autoAbbr(n));};
  const generateLore=async()=>{
    setGenLoading(true);setGenError("");setGenElapsed(0);
    const timer=setInterval(()=>setGenElapsed(n=>n+1),1000);
    try{
      const relTeamNames=relatedTeams.map(id=>teams.find(t=>t.id===id)?.name).filter(Boolean);
      const relMemberNames=relatedMembers.map(id=>members.find(m=>m.id===id)?.heroName).filter(Boolean);
      const ctx=[
        relTeamNames.length&&`Connected teams: ${relTeamNames.join(", ")}`,
        relMemberNames.length&&`Key characters involved: ${relMemberNames.join(", ")}`,
        loreHint.trim()&&`Story direction: ${loreHint.trim()}`,
      ].filter(Boolean).join("\n");
      const p=await callAI(`Create lore for a superhero team. JSON only, keys "description", "motto", "origin".\n\nTeam name: ${name}\nType: ${type}\nAlignment: ${align}\n${ctx?ctx+"\n":""}\nWeave any connections and story direction naturally into the origin. Keep the tone dark, grounded, and personal.\n\n{"description":"1 sentence team description","motto":"short team motto","origin":"2-3 sentence origin story"}`);
      if(p?.description)setDesc(p.description);
      if(p?.motto)setMotto(p.motto);
      if(p?.origin)setOrigin(p.origin);
    }catch(e){setGenError(e.message||"Generation failed");}
    clearInterval(timer);
    setGenLoading(false);
  };
  const handleSave=()=>{
    if(!name.trim())return;
    const isEdit=!!initialData;
    onSave({
      id:isEdit?initialData.id:`team-${Date.now()}`,
      isDefault:isEdit?initialData.isDefault:false,
      createdAt:isEdit?initialData.createdAt:Date.now(),
      name:name.trim(),abbr:abbr.trim()||autoAbbr(name),color,colorLight:color+"CC",type,nkAlignment:align,description:desc,motto,origin,logoSeed
    });
  };
  const isEdit=!!initialData;
  const lbl={fontSize:9,letterSpacing:"0.18em",color:"rgba(212,175,55,0.75)",textTransform:"uppercase",marginBottom:8,display:"block"};
  const chip=(a,c=G)=>({padding:"6px 12px",background:a?`${c}16`:"var(--bg3)",border:`1px solid ${a?c:"var(--border2)"}`,borderRadius:20,cursor:"pointer",fontSize:10.5,color:a?c:"var(--text3)",fontFamily:"var(--font-mono)",fontWeight:a?"bold":"normal"});

  // ── Edit mode: flat single-page form ────────────────────────────────────────
  if(isEdit) return(
    <div style={{background:"var(--bg-card2,#07070E)",border:"1px solid rgba(212,175,55,0.2)",borderRadius:14,overflow:"hidden"}}>
      <div style={{background:"rgba(212,175,55,0.06)",borderBottom:"1px solid rgba(212,175,55,0.15)",padding:"14px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><div style={{fontSize:9,letterSpacing:"0.18em",color:`${G}88`,textTransform:"uppercase",marginBottom:2}}>Edit Team</div><div style={{fontSize:15,fontWeight:"bold",color:"var(--text-primary)"}}>{name||"Untitled Team"}</div></div>
        <button onClick={onCancel} style={{padding:"5px 12px",background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:7,cursor:"pointer",color:"var(--text2)",fontSize:10,fontFamily:"var(--font-mono)"}}>Cancel</button>
      </div>
      <div style={{padding:"20px",display:"flex",flexDirection:"column",gap:14}}>
        <div><span style={lbl}>Team Name</span><input type="text" placeholder="Team name" value={name} onChange={e=>handleName(e.target.value)} autoFocus/></div>
        <div style={{display:"flex",gap:12}}>
          <div style={{flex:"0 0 auto"}}><span style={lbl}>Abbreviation</span><input type="text" placeholder="e.g. NK" value={abbr} onChange={e=>setAbbr(e.target.value.toUpperCase().slice(0,4))} style={{maxWidth:90}}/></div>
          <div style={{flex:1}}>
            <span style={lbl}>Team Color</span>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {TEAM_COLORS.map(tc=><button key={tc.id} onClick={()=>setColor(tc.hex)} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",background:color===tc.hex?`${tc.hex}18`:"var(--bg3)",border:`1px solid ${color===tc.hex?tc.hex:"var(--border2)"}`,borderRadius:20,cursor:"pointer",fontFamily:"var(--font-mono)",fontSize:10,color:color===tc.hex?"var(--text-primary)":"var(--text3)"}}><div style={{width:8,height:8,borderRadius:"50%",background:tc.hex,flexShrink:0}}/>{tc.label}</button>)}
            </div>
          </div>
        </div>
        <div>
          <span style={lbl}>Team Logo</span>
          <div style={{display:"flex",alignItems:"center",gap:14,padding:"10px 14px",background:"var(--bg3)",border:"1px solid var(--border2)",borderRadius:9}}>
            <TeamLogo team={{id:`preview-${logoSeed}`,color,logoSeed}} size={48}/>
            <div style={{flex:1}}>
              <div style={{fontSize:10,color:"var(--text2)",marginBottom:6,fontFamily:"var(--font-mono)"}}>Style {logoSeed+1} of 8</div>
              <div style={{display:"flex",gap:7}}>
                <button onClick={()=>setLogoSeed(s=>(s+7)%8)} style={{padding:"4px 10px",background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:6,cursor:"pointer",color:"var(--text2)",fontSize:10,fontFamily:"var(--font-mono)"}}>← Prev</button>
                <button onClick={()=>setLogoSeed(s=>(s+1)%8)} style={{padding:"4px 10px",background:`${color}14`,border:`1px solid ${color}55`,borderRadius:6,cursor:"pointer",color,fontSize:10,fontFamily:"var(--font-mono)"}}>Next →</button>
              </div>
            </div>
          </div>
        </div>
        <div>
          <span style={lbl}>Team Type</span>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>{TEAM_TYPES.map(tt=><button key={tt.id} style={chip(type===tt.id,color)} onClick={()=>setType(tt.id)}>{tt.label}</button>)}</div>
        </div>
        <div>
          <span style={lbl}>Alliance Alignment</span>
          <div style={{display:"flex",flexDirection:"column",gap:7}}>
            {NK_ALIGNMENTS.map(a=><button key={a.id} onClick={()=>setAlign(a.id)} style={{padding:"9px 14px",background:align===a.id?`${a.color}14`:"var(--bg3)",border:`1px solid ${align===a.id?a.color:"var(--border2)"}`,borderRadius:9,cursor:"pointer",textAlign:"left",fontFamily:"var(--font-mono)"}}>
              <div style={{fontSize:11,color:"var(--text-primary)",fontWeight:align===a.id?"bold":"normal"}}>{a.label}</div>
              <div style={{fontSize:9.5,color:"var(--text2)",marginTop:1}}>{a.desc}</div>
            </button>)}
          </div>
        </div>
        <div style={{background:"rgba(212,175,55,0.04)",border:"1px solid rgba(212,175,55,0.12)",borderRadius:10,padding:"14px"}}>
          <div style={{fontSize:9,letterSpacing:"0.18em",color:`${G}88`,textTransform:"uppercase",marginBottom:12,fontFamily:"var(--font-mono)"}}>Lore</div>
          {ollamaOk&&<button onClick={generateLore} disabled={genLoading} style={{width:"100%",padding:"9px",background:genLoading?"var(--bg3)":`${G}0E`,border:`1px solid ${genLoading?"var(--border)":`${G}55`}`,borderRadius:8,cursor:genLoading?"not-allowed":"pointer",color:genLoading?"var(--text3)":G,fontSize:10,fontFamily:"var(--font-mono)",marginBottom:10,letterSpacing:"0.08em"}}>{genLoading?`Generating... (${genElapsed}s)`:"✦ Regenerate lore with AI"}</button>}
          {genError&&<div style={{fontSize:10,color:"#E07070",background:"rgba(139,26,26,0.12)",border:"1px solid rgba(139,26,26,0.3)",borderRadius:7,padding:"6px 10px",marginBottom:10,fontFamily:"var(--font-mono)"}}>{genError}</div>}
          <div style={{marginBottom:10}}><span style={lbl}>Description</span><input type="text" placeholder="One sentence about this team" value={desc} onChange={e=>setDesc(e.target.value)}/></div>
          <div style={{marginBottom:10}}><span style={lbl}>Motto</span><input type="text" placeholder="Team motto or battle cry" value={motto} onChange={e=>setMotto(e.target.value)}/></div>
          <div><span style={lbl}>Origin</span><textarea style={{height:80}} placeholder="Team backstory..." value={origin} onChange={e=>setOrigin(e.target.value)}/></div>
        </div>
        <button disabled={!name.trim()} onClick={handleSave} style={{width:"100%",padding:"12px",background:name.trim()?`${color}18`:"var(--bg3)",border:`1px solid ${name.trim()?color:"var(--border2)"}`,borderRadius:8,cursor:name.trim()?"pointer":"not-allowed",color:name.trim()?color:"var(--text4)",fontSize:10.5,letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"var(--font-mono)"}}>Save Changes</button>
      </div>
    </div>
  );

  // ── Create mode: 3-step wizard ───────────────────────────────────────────────
  return(<div style={{background:"var(--bg-card2, #07070E)",border:"1px solid rgba(212,175,55,0.2)",borderRadius:14,overflow:"hidden"}}>
    <div style={{background:"rgba(212,175,55,0.06)",borderBottom:"1px solid rgba(212,175,55,0.15)",padding:"14px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div><div style={{fontSize:9,letterSpacing:"0.18em",color:`${G}88`,textTransform:"uppercase",marginBottom:2}}>New Team · Step {step} of 3</div><div style={{fontSize:15,fontWeight:"bold",color:"var(--text-primary)"}}>{step===1?"Identity":step===2?"Alignment & Type":"Lore"}</div></div>
      <button onClick={onCancel} style={{padding:"5px 12px",background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:7,cursor:"pointer",color:"var(--text2)",fontSize:10,fontFamily:"var(--font-mono)"}}>Cancel</button>
    </div>
    <div style={{padding:"20px"}}>
      {step===1&&(<>
        <div style={{marginBottom:14}}><span style={lbl}>Team Name</span><div style={{display:"flex",gap:6}}><input type="text" placeholder="e.g. The Iron Covenant" value={name} onChange={e=>handleName(e.target.value)} style={{flex:1}}/><button onClick={()=>handleName(randTeamName())} title="Random name" style={{padding:"0 12px",background:"var(--bg3)",border:"1px solid var(--border2)",borderRadius:8,cursor:"pointer",color:"var(--text2)",fontSize:16,flexShrink:0}}>⚄</button></div></div>
        <div style={{marginBottom:16}}><span style={lbl}>Abbreviation</span><input type="text" placeholder="e.g. TIC" value={abbr} onChange={e=>setAbbr(e.target.value.toUpperCase().slice(0,4))} style={{maxWidth:120}}/></div>
        <span style={lbl}>Team Color</span>
        <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:6}}>
          {TEAM_COLORS.map(tc=><button key={tc.id} onClick={()=>setColor(tc.hex)} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",background:color===tc.hex?`${tc.hex}18`:"var(--bg3)",border:`1px solid ${color===tc.hex?tc.hex:"var(--border2)"}`,borderRadius:20,cursor:"pointer",fontFamily:"var(--font-mono)",fontSize:10.5,color:color===tc.hex?"var(--text-primary)":"var(--text3)"}}><div style={{width:10,height:10,borderRadius:"50%",background:tc.hex,flexShrink:0}}/>{tc.label}</button>)}
        </div>
        <div style={{marginTop:16,marginBottom:4}}>
          <span style={lbl}>Team Logo</span>
          <div style={{display:"flex",alignItems:"center",gap:14,padding:"12px 14px",background:"var(--bg3)",border:"1px solid var(--border2)",borderRadius:9}}>
            <TeamLogo team={{id:`preview-${logoSeed}`,color,logoSeed}} size={56}/>
            <div style={{flex:1}}>
              <div style={{fontSize:10,color:"var(--text2)",marginBottom:8,fontFamily:"var(--font-mono)"}}>Style {logoSeed+1} of 8 · updates with your color</div>
              <div style={{display:"flex",gap:7}}>
                <button onClick={()=>setLogoSeed(s=>(s+7)%8)} style={{padding:"4px 11px",background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:6,cursor:"pointer",color:"var(--text2)",fontSize:10,fontFamily:"var(--font-mono)"}}>← Prev</button>
                <button onClick={()=>setLogoSeed(s=>(s+1)%8)} style={{padding:"4px 11px",background:`${color}14`,border:`1px solid ${color}55`,borderRadius:6,cursor:"pointer",color,fontSize:10,fontFamily:"var(--font-mono)"}}>Next →</button>
              </div>
            </div>
          </div>
        </div>
        <button disabled={!name.trim()} onClick={()=>setStep(2)} style={{width:"100%",padding:"12px",background:name.trim()?`${G}14`:"var(--bg3)",border:`1px solid ${name.trim()?G:"var(--border2)"}`,borderRadius:8,cursor:name.trim()?"pointer":"not-allowed",color:name.trim()?G:"var(--text4)",fontSize:10.5,letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"var(--font-mono)",marginTop:14}}>Next →</button>
      </>)}
      {step===2&&(<>
        <span style={lbl}>Team Type</span>
        <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:18}}>{TEAM_TYPES.map(tt=><button key={tt.id} style={chip(type===tt.id,color)} onClick={()=>setType(tt.id)}>{tt.label}</button>)}</div>
        <span style={lbl}>Team Alignment</span>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
          {NK_ALIGNMENTS.map(a=><button key={a.id} onClick={()=>setAlign(a.id)} style={{padding:"10px 14px",background:align===a.id?`${a.color}14`:"var(--bg3)",border:`1px solid ${align===a.id?a.color:"var(--border2)"}`,borderRadius:9,cursor:"pointer",textAlign:"left",fontFamily:"var(--font-mono)"}}>
            <div style={{fontSize:12,color:"var(--text-primary)",fontWeight:align===a.id?"bold":"normal"}}>{a.label}</div>
            <div style={{fontSize:10,color:"var(--text2)",marginTop:2}}>{a.desc}</div>
          </button>)}
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={()=>setStep(1)} style={{flex:1,padding:"10px",background:"var(--bg3)",border:"1px solid var(--border2)",borderRadius:8,cursor:"pointer",color:"var(--text3)",fontSize:10.5,fontFamily:"var(--font-mono)"}}>← Back</button>
          <button onClick={()=>setStep(3)} style={{flex:2,padding:"10px",background:`${color}14`,border:`1px solid ${color}`,borderRadius:8,cursor:"pointer",color,fontSize:10.5,letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"var(--font-mono)"}}>Next →</button>
        </div>
      </>)}
      {step===3&&(<>
        <div style={{background:"rgba(212,175,55,0.04)",border:"1px solid rgba(212,175,55,0.12)",borderRadius:10,padding:"14px",marginBottom:16}}>
          <div style={{fontSize:9,letterSpacing:"0.18em",color:`${G}88`,textTransform:"uppercase",marginBottom:12,fontFamily:"var(--font-mono)"}}>AI Context — optional</div>
          {teams.length>0&&(<>
            <span style={lbl}>Relates to — Teams</span>
            <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:14}}>
              {teams.map(t=>{const sel=relatedTeams.includes(t.id);return(<button key={t.id} onClick={()=>setRelatedTeams(p=>sel?p.filter(x=>x!==t.id):[...p,t.id])} style={{display:"flex",alignItems:"center",gap:6,...chip(sel,t.color)}}><TeamLogo team={t} size={16} style={{borderRadius:3}}/>{t.name}</button>);})}
            </div>
          </>)}
          {members.length>0&&(<>
            <span style={lbl}>Relates to — Characters</span>
            <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:14}}>
              {members.map(m=>{const sel=relatedMembers.includes(m.id);const mc=m.color||color;return(<button key={m.id} onClick={()=>setRelatedMembers(p=>sel?p.filter(x=>x!==m.id):[...p,m.id])} style={{display:"flex",alignItems:"center",gap:5,...chip(sel,mc)}}><div style={{width:6,height:6,borderRadius:"50%",background:mc,flexShrink:0}}/>{m.heroName}</button>);})}</div>
          </>)}
          <span style={lbl}>Story Direction</span>
          <textarea style={{height:56,fontSize:11}} placeholder={`E.g. "Splinter group after the leader's disappearance" · "Built to counter a rival team's tech" · "Allied through a shared enemy"`} value={loreHint} onChange={e=>setLoreHint(e.target.value)}/>
        </div>
        {ollamaOk&&<button onClick={generateLore} disabled={genLoading} style={{width:"100%",padding:"10px",background:genLoading?"var(--bg3)":`${G}0E`,border:`1px solid ${genLoading?"var(--border)":`${G}55`}`,borderRadius:8,cursor:genLoading?"not-allowed":"pointer",color:genLoading?"var(--text3)":G,fontSize:10.5,fontFamily:"var(--font-mono)",marginBottom:genError?6:14,letterSpacing:"0.08em"}}>{genLoading?`Generating lore... (${genElapsed}s)`:"✦ Generate lore with AI"}</button>}
        {genError&&<div style={{fontSize:10,color:"#E07070",background:"rgba(139,26,26,0.12)",border:"1px solid rgba(139,26,26,0.3)",borderRadius:7,padding:"6px 10px",marginBottom:14,fontFamily:"var(--font-mono)"}}>{genError}</div>}
        <div style={{marginBottom:12}}><span style={lbl}>Description</span><input type="text" placeholder="One sentence about this team" value={desc} onChange={e=>setDesc(e.target.value)}/></div>
        <div style={{marginBottom:12}}><span style={lbl}>Motto</span><input type="text" placeholder="Team motto or battle cry" value={motto} onChange={e=>setMotto(e.target.value)}/></div>
        <div style={{marginBottom:16}}><span style={lbl}>Origin</span><textarea style={{height:80}} placeholder="Team backstory — or generate above and edit here..." value={origin} onChange={e=>setOrigin(e.target.value)}/></div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={()=>setStep(2)} style={{flex:1,padding:"10px",background:"var(--bg3)",border:"1px solid var(--border2)",borderRadius:8,cursor:"pointer",color:"var(--text3)",fontSize:10.5,fontFamily:"var(--font-mono)"}}>← Back</button>
          <button onClick={handleSave} style={{flex:2,padding:"10px",background:`${color}18`,border:`1px solid ${color}`,borderRadius:8,cursor:"pointer",color,fontSize:10.5,letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"var(--font-mono)"}}>Create Team →</button>
        </div>
      </>)}
    </div>
  </div>);
}
