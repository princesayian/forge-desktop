import { ALIGN_META } from '../constants/index.js';

export default function AlignmentBadge({alignment}){
  const m=ALIGN_META[alignment]||ALIGN_META.neutral;
  return <span style={{fontSize:10,padding:"2px 9px",background:`${m.color}18`,border:`1px solid ${m.color}44`,borderRadius:20,color:m.color,whiteSpace:"nowrap"}}>{m.label}</span>;
}
