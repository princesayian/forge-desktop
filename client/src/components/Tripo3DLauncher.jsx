export default function Tripo3DLauncher({prompt,copied,onCopy}){
  const launch=()=>{
    navigator.clipboard.writeText(prompt).then(()=>{
      onCopy();
      window.open("https://www.tripo3d.ai/","_blank");
    });
  };
  return(<div style={{display:"flex",gap:8,marginTop:8,flexWrap:"wrap"}}>
    <button onClick={onCopy} style={{padding:"5px 12px",background:copied?"rgba(212,175,55,0.12)":"var(--bg3)",border:`1px solid ${copied?"#D4AF37":"var(--border)"}`,borderRadius:6,cursor:"pointer",fontSize:10,color:copied?"#D4AF37":"var(--text3)",fontFamily:"var(--font-mono)"}}>
      {copied?"Copied!":"Copy"}
    </button>
    <button onClick={launch} style={{padding:"5px 14px",background:"rgba(15,110,86,0.12)",border:"1px solid rgba(15,110,86,0.4)",borderRadius:6,cursor:"pointer",fontSize:10,color:"#5DCAA5",fontFamily:"var(--font-mono)",display:"flex",alignItems:"center",gap:5}}>
      <span style={{fontSize:12}}>⬡</span> Copy & Open Tripo3D
    </button>
  </div>);
}
