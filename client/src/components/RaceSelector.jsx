import { useState, useRef, useEffect } from 'react';
import { G, RACE_TREE, raceLabel } from '../constants/index.js';

export default function RaceSelector({value,onChange,color}){
  const c=color||G;
  const init=value&&typeof value==="object"?value:{};
  const[main,setMain]=useState(init.main||null);
  const[sub,setSub]=useState(init.sub||null);
  const[h,setH]=useState([init.sub1||{main:null,sub:null},init.sub2||{main:null,sub:null}]);
  const mounted=useRef(false);
  useEffect(()=>{
    if(!mounted.current){mounted.current=true;return;}
    if(main==="hybrid"){
      if(h[0].main&&h[0].sub&&h[1].main&&h[1].sub) onChange({main:"hybrid",sub1:h[0],sub2:h[1]});
    } else if(main&&sub){
      onChange({main,sub});
    }
  },[main,sub,JSON.stringify(h)]);
  const bs=(active)=>({padding:"4px 10px",background:active?`${c}22`:"var(--bg3)",border:`1px solid ${active?c:"var(--border2)"}`,borderRadius:20,cursor:"pointer",color:active?c:"var(--text2)",fontSize:9,fontFamily:"var(--font-mono)"});
  const label=raceLabel(main==="hybrid"?{main:"hybrid",sub1:h[0],sub2:h[1]}:main&&sub?{main,sub}:null);
  return(
    <div>
      <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:6}}>
        {Object.entries(RACE_TREE).map(([id,r])=>(
          <button key={id} title={r.hint||""} style={bs(main===id)} onClick={()=>{setMain(id);setSub(null);setH([{main:null,sub:null},{main:null,sub:null}]);}}>{r.label}</button>
        ))}
      </div>
      {main&&main!=="hybrid"&&(
        <div style={{display:"flex",flexWrap:"wrap",gap:5,paddingLeft:8,borderLeft:`2px solid ${c}30`,marginBottom:4}}>
          {RACE_TREE[main].subs.map(s=>(
            <button key={s.id} title={s.lore||""} style={bs(sub===s.id)} onClick={()=>setSub(s.id)}>{s.label}</button>
          ))}
        </div>
      )}
      {main==="hybrid"&&(
        <div style={{display:"flex",flexDirection:"column",gap:8,paddingLeft:8,borderLeft:`2px solid ${c}30`}}>
          {[0,1].map(i=>{
            const hv=h[i];
            return(
              <div key={i}>
                <div style={{fontSize:7.5,color:"var(--text4)",letterSpacing:"0.1em",marginBottom:4}}>{i===0?"FIRST RACE":"SECOND RACE"}</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:4}}>
                  {Object.entries(RACE_TREE).filter(([id])=>id!=="hybrid").map(([id,r])=>(
                    <button key={id} title={r.hint||""} style={bs(hv.main===id)} onClick={()=>setH(prev=>prev.map((x,j)=>j===i?{main:id,sub:null}:x))}>{r.label}</button>
                  ))}
                </div>
                {hv.main&&(
                  <div style={{display:"flex",flexWrap:"wrap",gap:4,paddingLeft:6,borderLeft:`1px solid ${c}20`}}>
                    {RACE_TREE[hv.main].subs.map(s=>(
                      <button key={s.id} title={s.lore||""} style={bs(hv.sub===s.id)} onClick={()=>setH(prev=>prev.map((x,j)=>j===i?{...x,sub:s.id}:x))}>{s.label}</button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {label&&<div style={{fontSize:8.5,color:`${c}88`,marginTop:5,fontFamily:"var(--font-mono)"}}>→ {label}</div>}
      {main&&main!=="hybrid"&&sub&&(()=>{
        const entry=(RACE_TREE[main]?.subs||[]).find(s=>s.id===sub);
        const cx=entry?.codex;
        if(!cx)return null;
        const rows=Object.entries(cx).map(([k,v])=>[k.replace(/([A-Z])/g," $1").trim(),v]).filter(([,v])=>v);
        return(
          <div style={{marginTop:10,padding:"10px 13px",background:`${c}08`,border:`1px solid ${c}22`,borderRadius:8}}>
            <div style={{fontSize:7.5,letterSpacing:"0.18em",textTransform:"uppercase",color:`${c}88`,fontFamily:"var(--font-mono)",marginBottom:8}}>Codex — {entry.label}</div>
            {rows.map(([label,text])=>(
              <div key={label} style={{marginBottom:8}}>
                <span style={{fontSize:8,letterSpacing:"0.12em",textTransform:"uppercase",color:`${c}77`,fontFamily:"var(--font-mono)"}}>{label}: </span>
                <span style={{fontSize:10.5,color:"var(--text3)",lineHeight:1.6}}>{text}</span>
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
}
