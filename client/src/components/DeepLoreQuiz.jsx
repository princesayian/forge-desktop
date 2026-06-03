import { DEEP_LORE_PHASES } from '../constants/index.js';

export default function DeepLoreQuiz({phase,answers,onAnswer,accentColor}){
  const phaseData=DEEP_LORE_PHASES[phase];
  if(!phaseData)return null;
  const c=accentColor||"#534AB7";
  return(<div style={{background:"var(--bg3)",border:`1px solid ${c}33`,borderRadius:10,padding:"20px"}}>
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
      <div style={{width:22,height:22,borderRadius:"50%",background:`${c}22`,border:`1px solid ${c}55`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:"bold",color:c,flexShrink:0}}>{phaseData.phase}</div>
      <div><div style={{fontSize:15,fontWeight:"bold",color:"var(--text-primary)"}}>{phaseData.title}</div><div style={{fontSize:10,color:"var(--text2)",marginTop:1}}>{phaseData.subtitle}</div></div>
    </div>
    <div style={{width:"100%",height:1,background:`${c}22`,margin:"14px 0"}}/>
    {phaseData.questions.map((q,qi)=>(<div key={q.id} style={{marginBottom:qi<phaseData.questions.length-1?20:0}}>
      <div style={{fontSize:12,color:"var(--text2)",marginBottom:10,lineHeight:1.4}}>{q.label}</div>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {q.options.map(opt=>{
          const sel=answers[q.id]===opt.id;
          return(<button key={opt.id} onClick={()=>onAnswer(q.id,opt.id)} style={{padding:"9px 14px",background:sel?`${c}18`:"rgba(255,255,255,0.02)",border:`1px solid ${sel?c:"var(--border2)"}`,borderRadius:8,cursor:"pointer",color:sel?"var(--text-primary)":"var(--text2)",fontFamily:"var(--font-mono)",fontSize:11.5,textAlign:"left",transition:"all 0.12s",fontWeight:sel?"bold":"normal"}}>
            {sel&&<span style={{color:c,marginRight:7}}>▸</span>}{opt.label}
          </button>);
        })}
      </div>
    </div>))}
  </div>);
}
