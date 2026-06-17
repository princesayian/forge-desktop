export default function InspirationsField({value=[],onChange,accentColor="#D4AF37"}){
  const c=accentColor;
  const ph=["e.g. Batman","e.g. Vegeta","e.g. Miles Morales","e.g. Storm","e.g. Moon Knight"];
  return(
    <div style={{marginBottom:14}}>
      <div style={{fontSize:10,letterSpacing:"0.18em",color:`${c}88`,textTransform:"uppercase",marginBottom:4,fontFamily:"var(--font-mono)"}}>
        Character Inspirations <span style={{opacity:0.5,textTransform:"none",letterSpacing:0,fontWeight:"normal"}}>— up to 5</span>
      </div>
      <div style={{fontSize:10.5,color:"var(--text4)",marginBottom:8,lineHeight:1.5}}>Characters whose powers, look, or energy should shape this character</div>
      {value.map((v,i)=>(
        <div key={i} style={{display:"flex",gap:6,marginBottom:5,alignItems:"center"}}>
          <div style={{fontSize:9,color:`${c}44`,fontFamily:"var(--font-mono)",width:10,textAlign:"right",flexShrink:0}}>{i+1}</div>
          <input type="text" placeholder={ph[i]||"Character name"} value={v}
            onChange={e=>{const n=[...value];n[i]=e.target.value;onChange(n);}}
            style={{flex:1,padding:"6px 10px",fontSize:12}}/>
          <button onClick={()=>onChange(value.filter((_,j)=>j!==i))}
            style={{background:"none",border:"none",cursor:"pointer",color:`${c}44`,fontSize:16,padding:"0 4px",lineHeight:1,flexShrink:0}}>×</button>
        </div>
      ))}
      {value.length<5&&(
        <button onClick={()=>onChange([...value,""])}
          style={{fontSize:10,padding:"3px 12px",background:`${c}0A`,border:`1px solid ${c}22`,borderRadius:12,cursor:"pointer",color:`${c}77`,fontFamily:"var(--font-mono)",marginTop:2}}>+ Add Inspiration</button>
      )}
    </div>
  );
}
