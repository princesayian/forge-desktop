import { useState } from 'react';
import { G } from '../constants/index.js';

export default function RemotePanel({remoteInfo,setRemoteInfo,onClose,s,forgeVersion,setAppAlert}){
  const[rusername,setRusername]=useState(remoteInfo?.username||"");
  const[rpassword,setRpassword]=useState("");
  const[rconfirm,setRconfirm]=useState("");
  const[rdomain,setRdomain]=useState(remoteInfo?.duck_domain||"");
  const[rtoken,setRtoken]=useState("");
  const[saving,setSaving]=useState(false);
  const[pwErr,setPwErr]=useState("");
  const saveRemote=async(enabled)=>{
    if(rpassword&&rpassword!==rconfirm){setPwErr("Passwords do not match.");return;}
    setPwErr("");
    setSaving(true);
    const body={remote_enabled:enabled};
    if(rusername)body.remote_username=rusername;
    if(rpassword)body.remote_password=rpassword;
    if(rdomain)body.duck_domain=rdomain;
    if(rtoken)body.duck_token=rtoken;
    const cr=await fetch("/api/config",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
    const cd=await cr.json();
    if(cd.needs_restart&&setAppAlert)setAppAlert({type:"restart",msg:"Restart required — Flask needs to rebind to all interfaces to activate remote access. DuckDNS is already updating your IP."});
    const r=await fetch("/api/remote");setRemoteInfo(await r.json());
    setRpassword("");setRconfirm("");
    setSaving(false);
  };
  return(<div style={{background:"var(--bg2)",borderBottom:"1px solid var(--border)",padding:"14px 22px"}}>
    <div style={{maxWidth:960,margin:"0 auto"}}>
      <div style={{fontSize:9,letterSpacing:"0.18em",color:"#5EB1FF88",textTransform:"uppercase",marginBottom:12}}>Remote Access & Settings — Nocturnal Innovations's Superhero Forge {forgeVersion?`v${forgeVersion}`:""}</div>
      {(()=>{
        const live=remoteInfo?.enabled&&remoteInfo?.url;
        const needsRestart=remoteInfo?.enabled&&!remoteInfo?.url&&remoteInfo?.cloudflared;
        const sc=live?"#5DCAA5":needsRestart?"#D4AF37":remoteInfo?.enabled?"#E07070":"#888780";
        const statusLabel=live?"LIVE · ACCESSIBLE":needsRestart?"RESTART REQUIRED":remoteInfo?.enabled?"INCOMPLETE SETUP":"DISABLED";
        const checks=[
          {ok:!!remoteInfo?.cloudflared,label:"cloudflared installed",fix:"Mac: brew install cloudflared · Windows: winget install cloudflare.cloudflared"},
          {ok:!!remoteInfo?.auth_set,label:"Login credentials set",fix:"Enter a username and password in the Login Credentials card and save"},
          {ok:!!remoteInfo?.enabled,label:"Remote access enabled",fix:'Click "Enable Remote Access" below'},
          {ok:!!remoteInfo?.url,label:"Tunnel running",fix:remoteInfo?.enabled?(remoteInfo?.cloudflared?"Restart the app to start the tunnel":"Install cloudflared first"):"Enable remote access first"},
        ];
        return(
          <div style={{padding:"12px 16px",background:"var(--bg3)",border:`1px solid ${sc}30`,borderRadius:8,marginBottom:12}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:sc,flexShrink:0,boxShadow:live?`0 0 7px ${sc}`:undefined}}/>
              <span style={{fontSize:10,fontWeight:"bold",color:sc,letterSpacing:"0.1em"}}>{statusLabel}</span>
              {live&&<span style={{fontSize:9,color:"#5DCAA5AA",fontFamily:"var(--font-mono)",marginLeft:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:260,cursor:"pointer"}} onClick={()=>navigator.clipboard.writeText(remoteInfo.url)}>{remoteInfo.url}</span>}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:"4px 16px"}}>
              {checks.map(({ok,label,fix})=>(
                <div key={label} style={{display:"flex",alignItems:"flex-start",gap:7,padding:"3px 0"}}>
                  <span style={{fontSize:11,color:ok?"#5DCAA5":"#E07070",flexShrink:0,fontWeight:"bold",lineHeight:1.4,fontFamily:"var(--font-mono)"}}>{ok?"✓":"✗"}</span>
                  <div>
                    <div style={{fontSize:10,color:ok?"var(--text2)":"var(--text-primary)",lineHeight:1.4}}>{label}</div>
                    {!ok&&<div style={{fontSize:8.5,color:"var(--text4)",marginTop:1,lineHeight:1.4}}>{fix}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:12}}>
        <div style={{padding:"12px 14px",background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:8}}>
          <div style={{fontSize:10,fontWeight:"bold",color:"#5EB1FF",marginBottom:8}}>Cloudflared Tunnel</div>
          <div style={{fontSize:10,color:"var(--text2)",lineHeight:1.6,marginBottom:8}}>{remoteInfo?.cloudflared?"✓ cloudflared installed":"✗ Not installed — Mac: brew install cloudflared · Windows: winget install cloudflare.cloudflared"}</div>
          {remoteInfo?.url?<div style={{fontSize:10,color:"#5DCAA5",wordBreak:"break-all"}}>{remoteInfo.url}</div>:<div style={{fontSize:10,color:"var(--text4)"}}>Tunnel starts when Remote Access is enabled</div>}
        </div>
        <div style={{padding:"12px 14px",background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:8}}>
          <div style={{fontSize:10,fontWeight:"bold",color:G,marginBottom:8}}>DuckDNS (persistent domain)</div>
          <input type="text" value={rdomain} onChange={e=>setRdomain(e.target.value)} placeholder="your-domain (no .duckdns.org)" style={{marginBottom:6,fontSize:10}}/>
          <input type="text" value={rtoken} onChange={e=>setRtoken(e.target.value)} placeholder="DuckDNS token" style={{marginBottom:2,fontSize:10}}/>
          <div style={{fontSize:9,color:"var(--text4)"}}>Get a free domain at duckdns.org + forward port 7432 on your router</div>
        </div>
        <div style={{padding:"12px 14px",background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:8}}>
          <div style={{fontSize:10,fontWeight:"bold",color:"#e74c3c",marginBottom:8}}>Login Credentials {remoteInfo?.auth_set&&<span style={{color:"#5DCAA5",fontWeight:"normal"}}>· set</span>}</div>
          <input type="text" value={rusername} onChange={e=>setRusername(e.target.value)} placeholder="Username" autoComplete="off" style={{marginBottom:6,fontSize:10}}/>
          <input type="password" value={rpassword} onChange={e=>setRpassword(e.target.value)} placeholder={remoteInfo?.auth_set?"New password (leave blank to keep)":"Password"} autoComplete="new-password" style={{marginBottom:6,fontSize:10}}/>
          <input type="password" value={rconfirm} onChange={e=>setRconfirm(e.target.value)} placeholder="Confirm password" autoComplete="new-password" style={{marginBottom:4,fontSize:10}}/>
          {pwErr&&<div style={{fontSize:9,color:"#e74c3c",marginBottom:4}}>{pwErr}</div>}
          <div style={{fontSize:9,color:"var(--text4)"}}>Remote visitors must sign in. Local access is always unrestricted.</div>
        </div>
      </div>
      <div style={{display:"flex",gap:10,marginTop:12}}>
        <button onClick={()=>saveRemote(true)} disabled={saving} style={{...s.bigBtn(saving,"#5EB1FF"),width:"auto",padding:"8px 20px",marginTop:0}}>{saving?"Saving...":"Enable Remote Access"}</button>
        <button onClick={()=>saveRemote(false)} disabled={saving} style={{...s.bigBtn(saving),width:"auto",padding:"8px 20px",marginTop:0,color:"var(--text3)"}}>{saving?"...":"Disable"}</button>
        <button onClick={onClose} style={{padding:"8px 16px",background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:8,cursor:"pointer",color:"var(--text3)",fontSize:10,fontFamily:"var(--font-mono)",marginLeft:"auto"}}>Close</button>
      </div>
    </div>
  </div>);
}
