import { useState } from 'react';
import { ageStage } from '../utils/helpers.js';

export default function ImagePromptQuestionnaire({subjectLabel,accentColor,isVillain,initialGender,initialAge,initialAppearanceAge,initialCostume,initialNotes,hasImage,onAnalyzeImage,onCancel,onSubmit}){
  const[gender,setGender]=useState(initialGender||"");
  const[age,setAge]=useState(initialAge||"");
  const[appearanceAge,setAppearanceAge]=useState(initialAppearanceAge||initialAge||"");
  const[costume,setCostume]=useState(initialCostume||"");
  const[notes,setNotes]=useState(initialNotes||"");
  const[analyzing,setAnalyzing]=useState(false);
  const[analyzeError,setAnalyzeError]=useState("");
  const stage=ageStage(age);
  const appearanceStage=ageStage(appearanceAge);
  const c=accentColor||(isVillain?"#E07070":"#5DCAA5");
  // Visual safety tracks how the character LOOKS in the render, not their lore age —
  // a 150-year-old who appears as a teen still needs the same modesty guardrails.
  const needsGuard=gender==="Female"||appearanceStage==="child"||appearanceStage==="teen";

  const runAnalysis=async()=>{
    if(!onAnalyzeImage)return;
    setAnalyzing(true);setAnalyzeError("");
    try{
      const desc=await onAnalyzeImage();
      if(desc)setNotes(prev=>prev.trim()?`${prev.trim()}, ${desc}`:desc);
      else setAnalyzeError("No description returned.");
    }catch(e){
      setAnalyzeError(e.message||"Analysis failed.");
    }
    setAnalyzing(false);
  };

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(5,5,10,0.78)",zIndex:1200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onCancel}>
      <div onClick={e=>e.stopPropagation()} style={{background:"var(--bg2, #0D0D16)",border:`1px solid ${c}44`,borderRadius:14,padding:"22px 24px",maxWidth:440,width:"100%",maxHeight:"86vh",overflowY:"auto",boxShadow:"0 8px 40px rgba(0,0,0,0.6)"}}>
        <div style={{fontSize:10,letterSpacing:"0.18em",color:`${c}99`,textTransform:"uppercase",marginBottom:4,fontFamily:"var(--font-mono)"}}>Image Prompt Setup</div>
        <div style={{fontSize:16,fontWeight:"bold",color:"var(--text-primary)",marginBottom:18}}>{subjectLabel}</div>

        <div style={{marginBottom:14}}>
          <div style={{fontSize:10,letterSpacing:"0.12em",color:`${c}88`,textTransform:"uppercase",marginBottom:6,fontFamily:"var(--font-mono)"}}>Gender</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {["Male","Female","Non-binary","Other"].map(g=>(
              <button key={g} onClick={()=>setGender(g)} style={{padding:"6px 12px",background:gender===g?`${c}22`:"var(--bg3)",border:`1px solid ${gender===g?c:"var(--border2)"}`,borderRadius:20,cursor:"pointer",color:gender===g?c:"var(--text3)",fontSize:11,fontFamily:"var(--font-mono)"}}>{g}</button>
            ))}
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
          <div>
            <div style={{fontSize:10,letterSpacing:"0.12em",color:`${c}88`,textTransform:"uppercase",marginBottom:6,fontFamily:"var(--font-mono)"}}>Age</div>
            <input type="number" value={age} onChange={e=>setAge(e.target.value)} placeholder="e.g. 150" style={{width:"100%",padding:"7px 10px",background:"var(--bg3)",border:"1px solid var(--border2)",borderRadius:7,color:"var(--text-primary)",fontSize:12,fontFamily:"var(--font-mono)",boxSizing:"border-box"}}/>
            {stage&&<div style={{fontSize:10,color:`${c}88`,marginTop:4,fontFamily:"var(--font-mono)"}}>Lore age stage: {stage}</div>}
          </div>
          <div>
            <div style={{fontSize:10,letterSpacing:"0.12em",color:`${c}88`,textTransform:"uppercase",marginBottom:6,fontFamily:"var(--font-mono)"}}>Appearance Age</div>
            <input type="number" value={appearanceAge} onChange={e=>setAppearanceAge(e.target.value)} placeholder="e.g. 28" style={{width:"100%",padding:"7px 10px",background:"var(--bg3)",border:"1px solid var(--border2)",borderRadius:7,color:"var(--text-primary)",fontSize:12,fontFamily:"var(--font-mono)",boxSizing:"border-box"}}/>
            {appearanceStage&&<div style={{fontSize:10,color:`${c}88`,marginTop:4,fontFamily:"var(--font-mono)"}}>Looks like: {appearanceStage}</div>}
          </div>
        </div>
        <div style={{fontSize:9.5,color:"var(--text4)",marginTop:-8,marginBottom:14,lineHeight:1.4}}>How old they actually look drives the render and safety guardrails below — useful when lore age and appearance differ (immortals, de-aged forms, etc).</div>

        <div style={{marginBottom:14}}>
          <div style={{fontSize:10,letterSpacing:"0.12em",color:`${c}88`,textTransform:"uppercase",marginBottom:6,fontFamily:"var(--font-mono)"}}>Costume / Design Elements</div>
          <textarea value={costume} onChange={e=>setCostume(e.target.value)} rows={3} placeholder="e.g. armored bodysuit with glowing circuit lines, flowing cape" style={{width:"100%",padding:"8px 10px",background:"var(--bg3)",border:"1px solid var(--border2)",borderRadius:7,color:"var(--text-primary)",fontSize:12,fontFamily:"var(--font-mono)",resize:"vertical",boxSizing:"border-box"}}/>
        </div>

        <div style={{marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
            <div style={{fontSize:10,letterSpacing:"0.12em",color:`${c}88`,textTransform:"uppercase",fontFamily:"var(--font-mono)"}}>Additional Visual Details <span style={{opacity:0.55,fontSize:9}}>(optional)</span></div>
            {hasImage&&<button onClick={runAnalysis} disabled={analyzing} style={{padding:"4px 10px",background:analyzing?"var(--bg3)":`${c}18`,border:`1px solid ${analyzing?"var(--border2)":c}55`,borderRadius:6,cursor:analyzing?"default":"pointer",color:analyzing?"var(--text4)":c,fontSize:10,fontFamily:"var(--font-mono)",flexShrink:0}}>{analyzing?"Analyzing…":"🔍 Analyze Reference Image"}</button>}
          </div>
          <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={2} placeholder="e.g. silver hair, scar over left eye, holds a glowing staff" style={{width:"100%",padding:"8px 10px",background:"var(--bg3)",border:"1px solid var(--border2)",borderRadius:7,color:"var(--text-primary)",fontSize:12,fontFamily:"var(--font-mono)",resize:"vertical",boxSizing:"border-box"}}/>
          {hasImage&&!analyzeError&&<div style={{fontSize:9.5,color:"var(--text4)",marginTop:4}}>Pulls visual details (hair, costume, accessories) straight from the uploaded reference image.</div>}
          {analyzeError&&<div style={{fontSize:10,color:"#e74c3c",marginTop:4}}>{analyzeError}</div>}
        </div>

        {needsGuard&&<div style={{display:"flex",gap:8,padding:"10px 12px",background:"rgba(93,202,165,0.08)",border:"1px solid rgba(93,202,165,0.3)",borderRadius:8,marginBottom:16,fontSize:11,color:"#5DCAA5",lineHeight:1.5}}>
          <span>🛡️</span><span>Safety mode active for this subject — costume descriptors will be kept modest, full-coverage, and non-sexualized. The image will still be generated.</span>
        </div>}

        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <button onClick={onCancel} style={{padding:"8px 16px",background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:8,cursor:"pointer",color:"var(--text3)",fontSize:12,fontFamily:"var(--font-mono)"}}>Cancel</button>
          <button onClick={()=>onSubmit({gender,age,appearanceAge,costumeDesc:costume,designNotes:notes})} disabled={!gender} style={{padding:"8px 20px",background:!gender?"var(--bg3)":`${c}22`,border:`1px solid ${!gender?"var(--border)":c}`,borderRadius:8,cursor:!gender?"not-allowed":"pointer",color:!gender?"var(--text4)":c,fontSize:12,fontWeight:"bold",fontFamily:"var(--font-mono)"}}>Generate Prompt →</button>
        </div>
      </div>
    </div>
  );
}
