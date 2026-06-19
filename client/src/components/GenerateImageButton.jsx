import { useState } from 'react';

export default function GenerateImageButton({prompt,imgId,aspectRatio="1:1",enabled,onSaved}){
  const[loading,setLoading]=useState(false);
  const[saving,setSaving]=useState(false);
  const[error,setError]=useState("");
  const[preview,setPreview]=useState(null);

  if(!enabled)return null;

  const generate=async()=>{
    setLoading(true);setError("");setPreview(null);
    try{
      const res=await fetch("/api/generate-image",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt,aspect_ratio:aspectRatio})});
      const data=await res.json();
      if(!res.ok||data.error)throw new Error(data.error||"Generation failed");
      setPreview(data.image_b64);
    }catch(e){setError(e.message);}
    setLoading(false);
  };

  const save=async()=>{
    setSaving(true);
    try{
      await fetch(`/api/images/${imgId}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({data:preview})});
      onSaved?.(imgId);
      setPreview(null);
    }catch(e){setError("Could not save image.");}
    setSaving(false);
  };

  return(<div style={{marginTop:8}}>
    <button onClick={generate} disabled={loading||!prompt} style={{padding:"5px 14px",background:"rgba(93,202,165,0.12)",border:"1px solid rgba(93,202,165,0.4)",borderRadius:6,cursor:loading?"default":"pointer",fontSize:11,color:"#5DCAA5",fontFamily:"var(--font-mono)",display:"flex",alignItems:"center",gap:5}}>
      <span style={{fontSize:13}}>✦</span> {loading?"Generating…":"Generate Image"}
    </button>
    {error&&<div style={{fontSize:10,color:"#e74c3c",marginTop:6}}>{error}</div>}
    {preview&&<div style={{marginTop:10}}>
      <img src={preview} alt="" style={{maxWidth:220,borderRadius:8,border:"1px solid var(--border2)",display:"block"}}/>
      <div style={{display:"flex",gap:8,marginTop:8}}>
        <button onClick={save} disabled={saving} style={{padding:"5px 14px",background:"rgba(212,175,55,0.15)",border:"1px solid #D4AF37",borderRadius:6,cursor:saving?"default":"pointer",fontSize:11,color:"#D4AF37",fontFamily:"var(--font-mono)"}}>{saving?"Saving…":"Use This Image"}</button>
        <button onClick={()=>setPreview(null)} style={{padding:"5px 14px",background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:6,cursor:"pointer",fontSize:11,color:"var(--text3)",fontFamily:"var(--font-mono)"}}>Discard</button>
      </div>
    </div>}
  </div>);
}
