import { ALIGN_META, TEAM_TYPES } from '../constants/index.js';
import TeamLogo from './TeamLogo.jsx';

export default function TeamCard({team,isActive,memberCount,onSelect,onEdit,onDelete,imageUrl=null}){
  const am=ALIGN_META[team.nkAlignment]||ALIGN_META.neutral;
  const type=TEAM_TYPES.find(t=>t.id===team.type);
  return(
    <div onClick={onSelect} style={{
      background:isActive?`${team.color}12`:"var(--bg3)",
      border:`2px solid ${isActive?team.color+"88":"var(--border2)"}`,
      borderRadius:12,
      padding:"20px 18px 46px",
      cursor:"pointer",
      transition:"all 0.15s",
      position:"relative",
      display:"flex",
      flexDirection:"column",
      alignItems:"center",
      gap:8,
      textAlign:"center"
    }}>
      {isActive&&<div style={{position:"absolute",top:10,left:10,fontSize:8,padding:"1px 7px",background:`${team.color}22`,border:`1px solid ${team.color}55`,borderRadius:10,color:team.color,fontFamily:"var(--font-mono)"}}>Active</div>}

      <TeamLogo team={team} size={52} imageUrl={imageUrl}/>

      <div style={{fontSize:13,fontWeight:"bold",color:"var(--text-primary)",wordBreak:"break-word",lineHeight:1.3}}>{team.name}</div>

      <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center",justifyContent:"center"}}>
        {type&&<span style={{fontSize:9,color:"var(--text3)",fontFamily:"var(--font-mono)"}}>{type.label}</span>}
        <span style={{fontSize:9,color:"var(--text4)"}}>·</span>
        <span style={{fontSize:9,color:"var(--text3)",fontFamily:"var(--font-mono)"}}>{memberCount} member{memberCount!==1?"s":""}</span>
        {team.nkAlignment&&team.nkAlignment!=="base"&&<>
          <span style={{fontSize:9,color:"var(--text4)"}}>·</span>
          <span style={{fontSize:9,color:am.color,fontFamily:"var(--font-mono)"}}>{am.label}</span>
        </>}
      </div>

      <div style={{position:"absolute",bottom:10,right:10,display:"flex",gap:5}} onClick={e=>e.stopPropagation()}>
        <button onClick={onEdit} style={{padding:"3px 9px",background:"var(--bg3)",border:"1px solid var(--border2)",borderRadius:6,cursor:"pointer",fontSize:9.5,color:"var(--text3)",fontFamily:"var(--font-mono)"}}>Edit</button>
        <button onClick={onDelete} style={{padding:"3px 9px",background:"rgba(139,26,26,0.1)",border:"1px solid rgba(139,26,26,0.3)",borderRadius:6,cursor:"pointer",fontSize:9.5,color:"#E07070",fontFamily:"var(--font-mono)"}}>Delete</button>
      </div>
    </div>
  );
}
