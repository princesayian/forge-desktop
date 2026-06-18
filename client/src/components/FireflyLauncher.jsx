export default function FireflyLauncher({prompt,copied,onCopy}){
  const launch=()=>{
    // Open synchronously on the click so popup blockers see it as user-initiated,
    // then copy — clipboard writes can be async/flaky in embedded webviews.
    // try/catch: some embedded webviews throw on window.open instead of no-op'ing,
    // which would otherwise abort onCopy() below and leave the click looking dead.
    try{window.open("https://firefly.adobe.com/generate/images","_blank");}catch(e){}
    onCopy();
  };
  return(<div style={{display:"flex",gap:8,marginTop:8,flexWrap:"wrap"}}>
    <button onClick={onCopy} style={{padding:"5px 12px",background:copied?"rgba(212,175,55,0.12)":"var(--bg3)",border:`1px solid ${copied?"#D4AF37":"var(--border)"}`,borderRadius:6,cursor:"pointer",fontSize:11,color:copied?"#D4AF37":"var(--text3)",fontFamily:"var(--font-mono)"}}>
      {copied?"Copied!":"Copy"}
    </button>
    <button onClick={launch} style={{padding:"5px 14px",background:"rgba(238,50,61,0.12)",border:"1px solid rgba(238,50,61,0.4)",borderRadius:6,cursor:"pointer",fontSize:11,color:"#FF5B66",fontFamily:"var(--font-mono)",display:"flex",alignItems:"center",gap:5}}>
      <span style={{fontSize:13}}>✦</span> Copy & Open Firefly
    </button>
  </div>);
}
