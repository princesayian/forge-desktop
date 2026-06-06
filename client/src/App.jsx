import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import './index.css';
import {
  G, NK_TEAM, TEAM_COLORS, TEAM_TYPES, NK_ALIGNMENTS, ALIGN_META,
  RACE_TREE, raceLabel, raceLore,
  DEFAULT_NK, NK_DYNAMICS,
  RECRUIT_QUIZ, VILLAIN_QUIZ, SCENARIOS, TONES,
  TEAM_RANKS, FAMILY_RELATIONS, HERO_ASSOC_TYPES,
  ART_STYLES, ACCENT_COLORS, TIER_DEFS,
  DEEP_LORE_PHASES, PERSONAL_PROFILE,
  _rp, _NAMES, _TS, randTeamName, randHeroName,
} from './constants/index.js';
import { autoScore, autoTierFn, pronounOf, ageStage, hexToColorName } from './utils/helpers.js';
import AlignmentBadge from './components/AlignmentBadge.jsx';
import StatBar from './components/StatBar.jsx';
import CharacterPage from './components/CharacterPage.jsx';
import RaceSelector from './components/RaceSelector.jsx';
import EditPanel from './components/EditPanel.jsx';
import TeamLogo from './components/TeamLogo.jsx';
import TeamCard from './components/TeamCard.jsx';
import TeamCreator from './components/TeamCreator.jsx';
import OllamaGuide from './components/OllamaGuide.jsx';
import DeepLoreQuiz from './components/DeepLoreQuiz.jsx';
import MetaAILauncher from './components/MetaAILauncher.jsx';
import Tripo3DLauncher from './components/Tripo3DLauncher.jsx';
import RemotePanel from './components/RemotePanel.jsx';

// Storage adapter — checks window.storage at call time so PyWebView has a
// chance to inject it before any useEffect fires. Falls back to /api/store
// HTTP endpoints when running in a plain browser.
const storage = {
  get: async (key) => {
    if (window.storage) return window.storage.get(key);
    const r = await fetch(`/api/store/${encodeURIComponent(key)}`);
    if (!r.ok) return null;
    return r.json();
  },
  set: async (key, value) => {
    if (window.storage) return window.storage.set(key, value);
    await fetch(`/api/store/${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    });
  },
  delete: async (key) => {
    if (window.storage) return window.storage.delete(key);
    await fetch(`/api/store/${encodeURIComponent(key)}`, { method: 'DELETE' });
  },
};

export default
function App(){
  // ── State ────────────────────────────────────────────────────────────────
  const[teams,setTeams]=useState([]);
  const[activeTeamId,setActiveTeamId]=useState(null);
  const[teamRosters,setTeamRosters]=useState({});
  const[showTeamCreator,setShowTeamCreator]=useState(false);
  const[editingTeamData,setEditingTeamData]=useState(null);
  // ── Char state ──────────────────────────────────────────────────────────
  const[sharedEdits,setSharedEdits]=useState({});
  const[expanded,setExpanded]=useState({});
  const[editingChar,setEditingChar]=useState({});
  const[images,setImages]=useState({});
  const[removedMembers,setRemovedMembers]=useState({});
  const[battleA,setBattleA]=useState(null);
  const[battleB,setBattleB]=useState(null);
  const[battleLoading,setBattleLoading]=useState(false);
  const[battleResult,setBattleResult]=useState(null);
  const[arcTitle,setArcTitle]=useState("");
  const[arcVillain,setArcVillain]=useState("");
  const[arcIssues,setArcIssues]=useState(3);
  const[arcTone,setArcTone]=useState("intense");
  const[arcTeams,setArcTeams]=useState([]);
  const[arcLoading,setArcLoading]=useState(false);
  const[arcResult,setArcResult]=useState(null);
  const[tierOverrides,setTierOverrides]=useState(()=>{try{return JSON.parse(localStorage.getItem("forge-tiers")||"{}");}catch{return {};}});
  const[switchingMember,setSwitchingMember]=useState(null);
  const[sharingMember,setSharingMember]=useState(null);
  const[redeemingVillain,setRedeemingVillain]=useState(null);
  const[updateInfo,setUpdateInfo]=useState(null);
  const[remoteInfo,setRemoteInfo]=useState(null);
  const[showRemotePanel,setShowRemotePanel]=useState(false);
  const[updatePulling,setUpdatePulling]=useState(false);
  const[appAlert,setAppAlert]=useState(null); // {type:"restart"|"reload"|"error", msg:string}
  // ── Villain pool ────────────────────────────────────────────────────────
  const[villainPool,setVillainPool]=useState([]);
  // ── Solo / Independent Heroes ─────────────────────────────────────────────
  const[soloHeroes,setSoloHeroes]=useState([]);
  const[soloVillains,setSoloVillains]=useState({});
  const[activeSoloId,setActiveSoloId]=useState(null);
  const[soloHeroView,setSoloHeroView]=useState("profile");
  const[rogueMode,setRogueMode]=useState(null); // null or heroId — saves villain to rogues gallery
  const[showSoloCreator,setShowSoloCreator]=useState(false);
  const[soloStoryResult,setSoloStoryResult]=useState(null);
  const[soloStoryLoading,setSoloStoryLoading]=useState(false);
  const[soloStoryRogueIds,setSoloStoryRogueIds]=useState([]);
  // Solo creator wizard state
  const[scStep,setScStep]=useState(0);
  const[scAnswers,setScAnswers]=useState({});
  const[scName,setScName]=useState("");
  const[scHeroName,setScHeroName]=useState("");
  const[scGender,setScGender]=useState("Male");
  const[scRace,setScRace]=useState(null);
  const[scColors,setScColors]=useState(["#888780"]);
  const[scCustomHex,setScCustomHex]=useState("#ffffff");
  const[scStoryDir,setScStoryDir]=useState("");
  const[scAge,setScAge]=useState("");
  const[scBirthYear,setScBirthYear]=useState("");
  const[scResult,setScResult]=useState(null);
  const[scLoading,setScLoading]=useState(false);
  const[scDeepMode,setScDeepMode]=useState(false);
  const[scProfileMode,setScProfileMode]=useState(false);
  const[scDeepPhase,setScDeepPhase]=useState(0);
  const[scDeepAnswers,setScDeepAnswers]=useState({});
  const[scProfileStep,setScProfileStep]=useState(0);
  const[scProfileAnswers,setScProfileAnswers]=useState({});
  const toggleScColor=hex=>setScColors(prev=>{if(prev.includes(hex)){if(prev.length===1)return prev;return prev.filter(c=>c!==hex);}if(prev.length>=3)return prev;return[...prev,hex];});
  const addCustomScColor=()=>{const h=scCustomHex.trim();if(!h.match(/^#[0-9a-fA-F]{6}$/))return;setScColors(prev=>{if(prev.includes(h)||prev.length>=3)return prev;return[...prev,h];});setScCustomHex("#ffffff");};
  const resetSoloCreator=()=>{setScStep(0);setScAnswers({});setScName("");setScHeroName("");setScGender("Male");setScRace(null);setScColors(["#888780"]);setScCustomHex("#ffffff");setScStoryDir("");setScAge("");setScBirthYear("");setScResult(null);setScLoading(false);setScDeepMode(false);setScProfileMode(false);setScDeepPhase(0);setScDeepAnswers({});setScProfileStep(0);setScProfileAnswers({});};
  // ── Ollama ──────────────────────────────────────────────────────────────
  const[ollamaOk,setOllamaOk]=useState(null);const[groqOk,setGroqOk]=useState(false);
  const[forgeVersion,setForgeVersion]=useState("");
  const[models,setModels]=useState([]);
  const[currentModel,setCurrentModel]=useState("llama3.2");
  // ── Recruit ─────────────────────────────────────────────────────────────
  // ── Recruit / Deep Forge ─────────────────────────────────────────────────
  const[rStep,setRStep]=useState(0);const[rAnswers,setRAnswers]=useState({});
  const[rName,setRName]=useState("");const[rHeroName,setRHeroName]=useState("");
const[rColors,setRColors]=useState(["#A32D2D"]);const[rCustomHex,setRCustomHex]=useState("#ffffff");
const toggleRColor=hex=>setRColors(prev=>{if(prev.includes(hex)){if(prev.length===1)return prev;return prev.filter(c=>c!==hex);}if(prev.length>=3)return prev;return[...prev,hex];});
const addCustomRColor=()=>{const h=rCustomHex.trim();if(!h.match(/^#[0-9a-fA-F]{6}$/)&&!h.match(/^#[0-9a-fA-F]{3}$/))return;setRColors(prev=>{if(prev.includes(h)||prev.length>=3)return prev;return[...prev,h];});setRCustomHex("#ffffff");};
  const[rNkAlign,setRNkAlign]=useState("neutral");
  const[rTeamRank,setRTeamRank]=useState("operative");
  const[rFamilyCharId,setRFamilyCharId]=useState("");const[rFamilyRelation,setRFamilyRelation]=useState("parent");
  const[rHeroAssocId,setRHeroAssocId]=useState("");const[rHeroAssocType,setRHeroAssocType]=useState("sidekick");
  const[rGender,setRGender]=useState("Male");
  const[rAge,setRAge]=useState("");
  const[rBirthYear,setRBirthYear]=useState("");
  const[rRace,setRRace]=useState(null);
  const[rStoryDir,setRStoryDir]=useState("");
  const[rLoading,setRLoading]=useState(false);const[rResult,setRResult]=useState(null);
  const[recruitSuggest,setRecruitSuggest]=useState(null);const[recruitSuggestLoading,setRecruitSuggestLoading]=useState(false);
  const[deepMode,setDeepMode]=useState(false);
  const[deepPhase,setDeepPhase]=useState(0);
  const[deepAnswers,setDeepAnswers]=useState({});
  const[profileMode,setProfileMode]=useState(false);
  const[profileStep,setProfileStep]=useState(0);
  const[profileAnswers,setProfileAnswers]=useState({});
  // ── Meta AI / Tripo3D preferences ────────────────────────────────────────
  const[hasMetaAI,setHasMetaAI]=useState(false);
  const[tripo3DTarget,setTripo3DTarget]=useState(null);
  const[tripo3DPrompt,setTripo3DPrompt]=useState(null);
  const[tripo3DLoading,setTripo3DLoading]=useState(false);
  // ── Villain quiz ─────────────────────────────────────────────────────────
  const[vStep,setVStep]=useState(0);const[vAnswers,setVAnswers]=useState({});
  const[vName,setVName]=useState("");const[vTargetTeams,setVTargetTeams]=useState([]);
  const[vGender,setVGender]=useState("Male");
  const[vLoading,setVLoading]=useState(false);const[vResult,setVResult]=useState(null);
  const[editingVillainTarget,setEditingVillainTarget]=useState(null);
  const[vtDraft,setVtDraft]=useState({teams:[],heroes:[]});
  const[vDeepMode,setVDeepMode]=useState(false);
  const[vProfileMode,setVProfileMode]=useState(false);
  const[vDeepPhase,setVDeepPhase]=useState(0);
  const[vDeepAnswers,setVDeepAnswers]=useState({});
  const[vProfileStep,setVProfileStep]=useState(0);
  const[vProfileAnswers,setVProfileAnswers]=useState({});
  const[aiStreamText,setAiStreamText]=useState("");
  const genControllerRef=useRef(null);
  // ── Story ────────────────────────────────────────────────────────────────
  const[sCast,setSCast]=useState([]);const[sScenario,setSScenario]=useState("ambush");
  const[sTone,setSTone]=useState("intense");
  const[sLoading,setSLoading]=useState(false);const[sResult,setSResult]=useState(null);
  const[crossover,setCrossover]=useState(false);
  // ── Prompts ──────────────────────────────────────────────────────────────
  const[pStyle,setPStyle]=useState("comic");
  const[pPlatform,setPPlatform]=useState("meta-ai");
  const[pSelected,setPSelected]=useState(null);
  const[pLoading,setPLoading]=useState(false);const[pResult,setPResult]=useState(null);const[sheetLoading,setSheetLoading]=useState(false);
  const[duoA,setDuoA]=useState("");const[duoB,setDuoB]=useState("");
  const pResultRef=useRef(null);
  useEffect(()=>{if(pResult&&pResultRef.current)setTimeout(()=>pResultRef.current?.scrollIntoView({behavior:"smooth",block:"nearest"}),80);},[pResult]);
  // ── Dynamics ─────────────────────────────────────────────────────────────
  const[dynActive,setDynActive]=useState(null);
  // ── Family Tree ──────────────────────────────────────────────────────────
  const[familyLinks,setFamilyLinks]=useState([]);
  const[ftAddA,setFtAddA]=useState("");
  const[ftAddB,setFtAddB]=useState("");
  const[ftAddRelation,setFtAddRelation]=useState("parent");
  const[ftActiveNode,setFtActiveNode]=useState(null);
  const[heroAssocs,setHeroAssocs]=useState([]);
  const[haAddA,setHaAddA]=useState("");
  const[haAddB,setHaAddB]=useState("");
  const[haAddType,setHaAddType]=useState("sidekick");
  // ── Delete PIN ───────────────────────────────────────────────────────────
  const DELETE_PIN="K76J85J!!K!8";
  const[pinDialog,setPinDialog]=useState(null);// {label,action}
  const[pinInput,setPinInput]=useState("");
  const[pinError,setPinError]=useState(false);
  const requirePin=(label,action)=>{setPinDialog({label,action});setPinInput("");setPinError(false);};
  const confirmPin=()=>{if(pinInput===DELETE_PIN){pinDialog.action();setPinDialog(null);}else{setPinError(true);setPinInput("");}};
  // ── UI ───────────────────────────────────────────────────────────────────
  const[tab,setTab]=useState(()=>{try{return localStorage.getItem("forge-active-tab")||"teams";}catch{return"teams";}});
  const[saved,setSaved]=useState(false);
  const[pdfLoading,setPdfLoading]=useState(false);
  const[lightMode,setLightMode]=useState(()=>{try{return localStorage.getItem("forge-theme")==="light";}catch{return false;}});

  useEffect(()=>{
    document.body.classList.toggle("light-mode",lightMode);
    try{localStorage.setItem("forge-theme",lightMode?"light":"dark");}catch{}
  },[lightMode]);
  useEffect(()=>{try{localStorage.setItem("forge-active-tab",tab);}catch{}},[tab]);
  const[copied,setCopied]=useState({});
  const fileRefs=useRef({});const teamLogoRefs=useRef({});

  // ── Ollama check ─────────────────────────────────────────────────────────
  const checkOllama=useCallback(()=>{
    fetch("/api/status").then(r=>r.json()).then(d=>{setOllamaOk(d.ollama);setGroqOk(d.groq||false);setModels(d.models||[]);setCurrentModel(d.current_model||(d.groq?"llama-3.1-8b-instant":"llama3.2"));if(d.version)setForgeVersion(d.version);}).catch(()=>setOllamaOk(false));
  },[]);
  useEffect(()=>{checkOllama();const t=setInterval(checkOllama,10000);return()=>clearInterval(t);},[checkOllama]);

  // ── Persistence ──────────────────────────────────────────────────────────
  useEffect(()=>{
    (async()=>{
      const MIGRATE_KEYS=["forge-teams","forge-rosters","forge-edits","forge-villains","forge-removed","forge-meta-ai-pref","nk-edits","nk-villain","nk-recruits"];
      for(const k of MIGRATE_KEYS){const lv=localStorage.getItem(k);if(lv!=null){try{const ex=await fetch(`/api/store/${encodeURIComponent(k)}`);if(!ex.ok){await storage.set(k,lv);}}catch(e){await storage.set(k,lv);}localStorage.removeItem(k);}}
      // ── v3 migration: move DEFAULT_NK core members from hardcoded to stored roster ──
      try{
        const migFlag=await storage.get("forge-v3").catch(()=>null);
        if(!migFlag){
          let mt=[],mr={},me={};
          try{const d=await storage.get("forge-teams");mt=JSON.parse(d.value)||[];}catch(ex){}
          try{const d=await storage.get("forge-rosters");mr=JSON.parse(d.value)||{};}catch(ex){}
          try{const d=await storage.get("forge-edits");me=JSON.parse(d.value)||{};}catch(ex){}
          const hasNKStored=mt.some(t=>t.id==="nocturnal-knights");
          const hasAnyData=mt.length>0||Object.keys(mr).length>0;
          if(hasAnyData){
            if(!hasNKStored){mt=[NK_TEAM,...mt];await storage.set("forge-teams",JSON.stringify(mt));}
            const nkR=mr["nocturnal-knights"]||[];
            if(!nkR.some(m=>m.id==="darkstar")){
              const merged=DEFAULT_NK.map(m=>me[m.id]?{...m,...me[m.id]}:m);
              mr["nocturnal-knights"]=[...merged,...nkR];
              await storage.set("forge-rosters",JSON.stringify(mr));
            }
          }
          await storage.set("forge-v3","1");
        }
      }catch(ex){}
      let _loadedTeams=[];
      let _loadedRosters={};
      try{const d=await storage.get("forge-teams");_loadedTeams=JSON.parse(d.value)||[];}catch(e){}
      try{const d=await storage.get("forge-rosters");_loadedRosters=JSON.parse(d.value)||{};}catch(e){}
      // Recover orphaned rosters — any team ID in rosters but absent from teams list gets a stub entry
      {
        const _knownIds=new Set(_loadedTeams.map(t=>t.id));
        const _orphans=Object.keys(_loadedRosters).filter(id=>!_knownIds.has(id));
        if(_orphans.length){
          const _stubs=_orphans.map((id,i)=>({id,name:`Recovered Team ${i+1}`,abbr:`R${i+1}`,color:"#5EB1FF",colorLight:"#AFA9ECCC",type:"ground",nkAlignment:"ally",isDefault:false,description:""}));
          _loadedTeams=[..._loadedTeams,..._stubs];
          await storage.set("forge-teams",JSON.stringify(_loadedTeams));
        }
      }
      if(_loadedTeams.length)setTeams(_loadedTeams);
      setTeamRosters(_loadedRosters);
      try{const d=await storage.get("forge-edits");setSharedEdits(JSON.parse(d.value)||{});}catch(e){
        try{const d2=await storage.get("nk-edits");setSharedEdits(JSON.parse(d2.value)||{});}catch(e2){}
      }
      try{const d=await storage.get("forge-villains");setVillainPool(JSON.parse(d.value)||[]);}catch(e){
        try{const d2=await storage.get("nk-villain");const v=JSON.parse(d2.value);if(v)setVillainPool([v]);}catch(e2){}
      }
      try{const d=await storage.get("nk-recruits");const rec=JSON.parse(d.value)||[];if(rec.length){setTeamRosters(p=>({...p,"nocturnal-knights":[...(p["nocturnal-knights"]||[]),...rec.map(r=>({...r,teamId:"nocturnal-knights"}))]}))};}catch(e){}
      try{const d=await storage.get("forge-meta-ai-pref");if(d)setHasMetaAI(JSON.parse(d.value));}catch(e){}
      try{const d=await storage.get("forge-prompt-platform");if(d)setPPlatform(JSON.parse(d.value)||"meta-ai");}catch(e){}
      try{const d=await storage.get("forge-family");setFamilyLinks(JSON.parse(d.value)||[]);}catch(e){
        try{const d2=await storage.get("nk-family");setFamilyLinks(JSON.parse(d2.value)||[]);}catch(e2){}
      }
      try{const d=await storage.get("forge-hero-assocs");setHeroAssocs(JSON.parse(d.value)||[]);}catch(e){}
      try{const d=await storage.get("forge-removed");setRemovedMembers(JSON.parse(d.value)||{});}catch(e){}
      try{const r=await fetch("/api/images");const ids=await r.json();const loaded={};const t=Date.now();ids.forEach(id=>{loaded[id]=`/api/images/${id}?t=${t}`;});if(Object.keys(loaded).length)setImages(loaded);}catch(e){}
      try{const r=await fetch("/api/update/check");setUpdateInfo(await r.json());}catch(e){}
      try{const r=await fetch("/api/remote");setRemoteInfo(await r.json());}catch(e){}
      try{const d=await storage.get("forge-solo-heroes");setSoloHeroes(JSON.parse(d.value)||[]);}catch(e){}
      try{const d=await storage.get("forge-solo-villains");setSoloVillains(JSON.parse(d.value)||{});}catch(e){}
    })();
  },[]);

  const persist=useCallback(async(key,data)=>{
    try{await storage.set(key,JSON.stringify(data));setSaved(true);setTimeout(()=>setSaved(false),2000);}catch(e){}
  },[]);

  // Auto-set activeTeamId when teams load or active team is removed
  useEffect(()=>{
    if(teams.length>0&&(!activeTeamId||!teams.find(t=>t.id===activeTeamId))){
      setActiveTeamId(teams[0].id);
    }
  },[teams,activeTeamId]);

  const addFamilyLink=useCallback(()=>{
    if(!ftAddA||!ftAddB||ftAddA===ftAddB)return;
    const rel=FAMILY_RELATIONS.find(r=>r.id===ftAddRelation);
    if(!rel)return;
    setFamilyLinks(prev=>{
      if(prev.find(l=>(l.a===ftAddA&&l.b===ftAddB)||(l.a===ftAddB&&l.b===ftAddA)))return prev;
      const updated=[...prev,{id:`fl-${Date.now()}`,a:ftAddA,b:ftAddB,aRelation:rel.label,bRelation:rel.inverse}];
      persist("forge-family",updated);
      return updated;
    });
    setFtAddA("");setFtAddB("");setFtAddRelation("parent");
  },[ftAddA,ftAddB,ftAddRelation,persist]);

  const removeFamilyLink=useCallback(id=>{
    setFamilyLinks(prev=>{
      const updated=prev.filter(l=>l.id!==id);
      persist("forge-family",updated);
      return updated;
    });
  },[persist]);

  const addHeroAssoc=useCallback(()=>{
    if(!haAddA||!haAddB||haAddA===haAddB)return;
    const t=HERO_ASSOC_TYPES.find(x=>x.id===haAddType);
    if(!t)return;
    setHeroAssocs(prev=>{
      if(prev.find(l=>(l.a===haAddA&&l.b===haAddB)||(l.a===haAddB&&l.b===haAddA)))return prev;
      const updated=[...prev,{id:`ha-${Date.now()}`,a:haAddA,b:haAddB,aRelation:t.label,bRelation:t.inverse}];
      persist("forge-hero-assocs",updated);
      return updated;
    });
    setHaAddA("");setHaAddB("");setHaAddType("sidekick");
  },[haAddA,haAddB,haAddType,persist]);

  const removeHeroAssoc=useCallback(id=>{
    setHeroAssocs(prev=>{
      const updated=prev.filter(l=>l.id!==id);
      persist("forge-hero-assocs",updated);
      return updated;
    });
  },[persist]);

  // ── Computed ─────────────────────────────────────────────────────────────
  const activeTeam=useMemo(()=>teams.find(t=>t.id===activeTeamId)||teams[0]||null,[teams,activeTeamId]);

  const getTeamRoster=useCallback((teamId)=>{
    const removed=removedMembers[teamId]||[];
    const custom=(teamRosters[teamId]||[]).filter(m=>!removed.includes(m.id));
    return custom.map(m=>sharedEdits[m.id]?{...m,...sharedEdits[m.id]}:m);
  },[teamRosters,sharedEdits,removedMembers]);

  const activeRoster=useMemo(()=>getTeamRoster(activeTeamId),[getTeamRoster,activeTeamId]);

  const allCharacters=useMemo(()=>[...teams.flatMap(t=>getTeamRoster(t.id)),...soloHeroes],[teams,getTeamRoster,soloHeroes]);

  const memberTeamMap=useMemo(()=>{
    const map={};
    Object.entries(teamRosters).forEach(([tid,members])=>{
      members.forEach(m=>{if(!map[m.id])map[m.id]=[];if(!map[m.id].includes(tid))map[m.id].push(tid);});
    });
    return map;
  },[teamRosters]);

  const getTeamMemberCount=useCallback((teamId)=>getTeamRoster(teamId).length,[getTeamRoster]);

  // ── Team management ───────────────────────────────────────────────────────
  const saveTeam=useCallback((teamData)=>{
    const newTeams=editingTeamData
      ?teams.map(t=>t.id===editingTeamData.id?{...t,...teamData}:t)
      :[...teams,teamData];
    setTeams(newTeams);
    persist("forge-teams",newTeams);
    setShowTeamCreator(false);setEditingTeamData(null);
  },[teams,editingTeamData,persist]);

  const deleteTeam=useCallback((teamId)=>{
    const newTeams=teams.filter(t=>t.id!==teamId);
    setTeams(newTeams);
    persist("forge-teams",newTeams);
    if(activeTeamId===teamId)setActiveTeamId(newTeams[0]?.id||null);
  },[teams,activeTeamId,persist]);

  // ── Character management ──────────────────────────────────────────────────
  const handleImg=useCallback((id,file)=>{
    if(!file||!file.type.startsWith("image/"))return;
    const reader=new FileReader();
    reader.onload=async e=>{
      const b64=e.target.result;
      try{await fetch(`/api/images/${id}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({data:b64})});setImages(p=>({...p,[id]:`/api/images/${id}?t=${Date.now()}`}));}catch(err){}
    };
    reader.readAsDataURL(file);
  },[]);
  const downloadImg=useCallback((id,heroName)=>{
    const url=images[id];if(!url)return;
    fetch(url).then(r=>r.blob()).then(blob=>{const bUrl=URL.createObjectURL(blob);const a=document.createElement("a");a.href=bUrl;a.download=`${heroName.toLowerCase().replace(/\s+/g,"-")}.png`;document.body.appendChild(a);a.click();document.body.removeChild(a);setTimeout(()=>URL.revokeObjectURL(bUrl),1000);}).catch(()=>{});
  },[images]);
  const toggle=useCallback(id=>setExpanded(p=>({...p,[id]:!p[id]})),[]);

  const saveCharEdit=useCallback((id,data)=>{
    const allRosterChars=Object.values(teamRosters).flat();
    const base=[...allRosterChars,...soloHeroes,...villainPool].find(c=>c.id===id);
    const current=base?(sharedEdits[id]?{...base,...sharedEdits[id]}:base):null;
    const oldHeroName=current?.heroName||"";
    const oldRealName=current?.realName||"";
    const newHeroName=data.heroName!==undefined?data.heroName:oldHeroName;
    const newRealName=data.realName!==undefined?data.realName:oldRealName;
    const heroChanged=newHeroName&&newHeroName!==oldHeroName;
    const realChanged=newRealName&&newRealName!==oldRealName;
    const swapText=txt=>{
      if(!txt||typeof txt!=="string")return txt;
      let t=txt;
      if(heroChanged)t=t.split(oldHeroName).join(newHeroName);
      if(realChanged)t=t.split(oldRealName).join(newRealName);
      return t;
    };
    const textReplace=char=>{
      const fields=["tagline","origin","costumeDesc","powerFX","consistencyNotes"];
      const upd={};let changed=false;
      for(const f of fields){if(char[f]){const r=swapText(char[f]);if(r!==char[f]){upd[f]=r;changed=true;}}}
      if(char.powers){const np=char.powers.map(p=>({...p,name:swapText(p.name),desc:swapText(p.desc)}));if(JSON.stringify(np)!==JSON.stringify(char.powers)){upd.powers=np;changed=true;}}
      if(char.dna){const nd=char.dna.map(d=>swapText(d));if(JSON.stringify(nd)!==JSON.stringify(char.dna)){upd.dna=nd;changed=true;}}
      return changed?upd:null;
    };
    const editedData={...data};
    if(realChanged&&newRealName)editedData.initials=newRealName.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
    let ne={...sharedEdits,[id]:editedData};
    if(heroChanged||realChanged){
      for(const char of allRosterChars){
        if(char.id===id)continue;
        const merged=ne[char.id]?{...char,...ne[char.id]}:char;
        const upd=textReplace(merged);
        if(upd)ne[char.id]={...(ne[char.id]||{}), ...upd};
      }
    }
    setSharedEdits(ne);
    persist("forge-edits",ne);
    if(heroChanged||realChanged){
      const updatedSolo=soloHeroes.map(h=>{if(h.id===id)return h;const upd=textReplace(h);return upd?{...h,...upd}:h;});
      if(JSON.stringify(updatedSolo)!==JSON.stringify(soloHeroes)){setSoloHeroes(updatedSolo);persist("forge-solo-heroes",updatedSolo);}
      const updatedVillains=villainPool.map(v=>{if(v.id===id)return v;const upd=textReplace(v);return upd?{...v,...upd}:v;});
      if(JSON.stringify(updatedVillains)!==JSON.stringify(villainPool)){setVillainPool(updatedVillains);persist("forge-villains",updatedVillains);}
    }
    setEditingChar(p=>({...p,[id]:false}));
  },[sharedEdits,teamRosters,soloHeroes,villainPool,persist]);

  // ── Solo hero management ──────────────────────────────────────────────────
  const addSoloHeroFn=useCallback((hero)=>{
    const updated=[...soloHeroes,hero];setSoloHeroes(updated);persist("forge-solo-heroes",updated);
  },[soloHeroes,persist]);
  const removeSoloHeroFn=useCallback((heroId)=>{
    fetch(`/api/images/${heroId}`,{method:"DELETE"}).catch(()=>{});
    setImages(p=>{const n={...p};delete n[heroId];return n;});
    const updated=soloHeroes.filter(h=>h.id!==heroId);setSoloHeroes(updated);persist("forge-solo-heroes",updated);
    if(activeSoloId===heroId)setActiveSoloId(null);
  },[soloHeroes,activeSoloId,persist]);
  const addSoloRogueFn=useCallback((heroId,rogue)=>{
    const existing=soloVillains[heroId]||[];
    const updated={...soloVillains,[heroId]:[...existing,rogue]};setSoloVillains(updated);persist("forge-solo-villains",updated);
  },[soloVillains,persist]);
  const removeSoloRogueFn=useCallback((heroId,rogueId)=>{
    const updated={...soloVillains,[heroId]:(soloVillains[heroId]||[]).filter(v=>v.id!==rogueId)};setSoloVillains(updated);persist("forge-solo-villains",updated);
  },[soloVillains,persist]);
  const generateSoloHero=async()=>{
    if(!scName.trim()&&!scHeroName.trim())return;
    setScLoading(true);setScResult(null);
    const hex=scColors[0]||"#888780";
    const colorDesc=scColors.length===1?(ACCENT_COLORS.find(a=>a.hex===hex)?.label||hex):scColors.map((c,i)=>(["primary","secondary","tertiary"][i])+": "+(ACCENT_COLORS.find(a=>a.hex===c)?.label||c)).join(", ");
    const answers=RECRUIT_QUIZ.map(q=>{const opt=q.options.find(o=>o.id===scAnswers[q.id]);return opt?`${q.question}: ${opt.value}`:"";}).filter(Boolean).join("\n");
    const raceStr=raceLabel(scRace);const raceLoreStr=raceLore(scRace);
    const computedAge=scAge||(scBirthYear?String(2026-parseInt(scBirthYear)):"");
    try{
      const p=await callAI(`Create a solo independent superhero (no team). JSON only.\n\nReal name: ${scName||"Unknown"}\nGender: ${scGender}\nAge: ${computedAge||"Unknown"}\n${scBirthYear?`Birth year: ${scBirthYear}\n`:""}Race: ${raceStr||"Unspecified"}\n${raceLoreStr?`Race lore: ${raceLoreStr}\n`:""}${scStoryDir.trim()?`Story direction: ${scStoryDir.trim()}\n`:""}Color palette: ${colorDesc}\n${scHeroName?`Hero name: ${scHeroName} (use exactly this name)`:"Hero name: (choose a fitting name)"}\nIMPORTANT: Use correct pronouns (${pronounOf(scGender)}/${pronounOf(scGender)==="they"?"them":pronounOf(scGender)==="she"?"her":"him"}) throughout.\nThis hero operates alone. Their origin and motivation should reflect that — no team dependency, personal mission, personal rogues gallery.\nQuiz:\n${answers||"Not provided"}\n\n{"heroName":"${scHeroName||"2-word hero name"}","tagline":"one piercing sentence capturing their solo essence","role":"Role · Descriptor (no team)","origin":"3-4 sentences — personal backstory, why they operate alone, what drives them","powers":[{"name":"Power","desc":"visual desc"},{"name":"Power","desc":"visual desc"},{"name":"Power","desc":"visual desc"},{"name":"Power","desc":"visual desc"}],"stats":{"Power":75,"Speed":70,"Tech":60,"Intellect":80,"Will":85},"costumeDesc":"costume using color palette ${colorDesc}","powerFX":"visual power effects using color palette ${colorDesc}","consistencyNotes":"design lock rules","dna":["Inspiration 1","Inspiration 2"]}`,t=>{});
      setScResult({id:`solo-${Date.now()}`,solo:true,teamId:null,realName:scName||"Unknown",gender:scGender,age:computedAge,birthYear:scBirthYear||"",race:scRace,species:raceStr||"Human",color:hex,colorPalette:scColors,colorLight:hex+"CC",initials:scName?scName.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase():"??",isCustom:true,...p});
    }catch(e){if(e.message!=="Generation cancelled.")setScResult({error:true,msg:e.message});}
    setScLoading(false);
  };
  const generateSoloHeroDeep=async()=>{
    if(!scName.trim()&&!scHeroName.trim())return;
    setScLoading(true);setScResult(null);
    const hex=scColors[0]||"#888780";
    const colorDesc=scColors.length===1?(ACCENT_COLORS.find(a=>a.hex===hex)?.label||hex):scColors.map((c,i)=>(["primary","secondary","tertiary"][i])+": "+(ACCENT_COLORS.find(a=>a.hex===c)?.label||c)).join(", ");
    const raceStr=raceLabel(scRace);const raceLoreStr=raceLore(scRace);
    const computedAge=scAge||(scBirthYear?String(2026-parseInt(scBirthYear)):"");
    const loreContext=DEEP_LORE_PHASES.map(ph=>`== ${ph.title} ==\n`+ph.questions.map(q=>{const opt=q.options?.find(o=>o.id===scDeepAnswers[q.id]);return opt?`${q.label}: ${opt.label}`:""}).filter(Boolean).join("\n")).filter(l=>l.includes(":")).join("\n\n");
    const dnaInspoOpt=DEEP_LORE_PHASES[0]?.questions?.find(q=>q.id==="keyInspo")?.options?.find(o=>o.id===scDeepAnswers.keyInspo);
    const dnaUnivOpt=DEEP_LORE_PHASES[0]?.questions?.find(q=>q.id==="universe")?.options?.find(o=>o.id===scDeepAnswers.universe);
    const dnaFoundation=[dnaInspoOpt?.label,dnaUnivOpt?.label].filter(Boolean).join(", ");
    try{
      const p=await callAI(`Create a deeply developed solo independent superhero (no team) using rich comic book lore. JSON only.\n\nReal name: ${scName||"Unknown"}\nGender: ${scGender}\nAge: ${computedAge||"Unknown"}\n${scBirthYear?`Birth year: ${scBirthYear}\n`:""}Race: ${raceStr||"Unspecified"}\n${raceLoreStr?`Race lore (bake into origin): ${raceLoreStr}\n`:""}${scStoryDir.trim()?`Story direction: ${scStoryDir.trim()}\n`:""}Color palette: ${colorDesc}\n${scHeroName?`Hero name: ${scHeroName} (use exactly this name)`:"Hero name: (choose a distinct fitting name)"}\nIMPORTANT: Use correct pronouns (${pronounOf(scGender)}/${pronounOf(scGender)==="they"?"them":pronounOf(scGender)==="she"?"her":"him"}) throughout.\nThis hero operates alone. Personal mission, personal rogues gallery, no team dependency.\n${dnaFoundation?`\nCHARACTER DNA FOUNDATION: ${dnaFoundation}\n`:""}\nFull lore profile:\n${loreContext}\n\n{"heroName":"${scHeroName||"2-word hero name"}","tagline":"one piercing sentence capturing their solo essence","role":"Role · Descriptor (no team)","origin":"3-4 sentences — personal backstory and solo drive, reflecting lore answers and race","powers":[{"name":"Power name","desc":"visual desc"},{"name":"Power name","desc":"visual desc"},{"name":"Power name","desc":"visual desc"},{"name":"Power name","desc":"visual desc"}],"stats":{"Power":75,"Speed":70,"Tech":60,"Intellect":80,"Will":85},"costumeDesc":"costume using color palette ${colorDesc}, reflecting costume philosophy answer","powerFX":"visual power effects using color palette ${colorDesc}, matching FX style answer","consistencyNotes":"2-3 design lock rules","dna":["Primary inspiration","Secondary inspiration"]}`,t=>{});
      setScResult({id:`solo-${Date.now()}`,solo:true,teamId:null,realName:scName||"Unknown",gender:scGender,age:computedAge,birthYear:scBirthYear||"",race:scRace,species:raceStr||"Human",color:hex,colorPalette:scColors,colorLight:hex+"CC",initials:scName?scName.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase():"??",isCustom:true,deepLore:scDeepAnswers,...p});
    }catch(e){if(e.message!=="Generation cancelled.")setScResult({error:true,msg:e.message});}
    setScLoading(false);
  };
  const generateSoloHeroProfile=async()=>{
    if(!scName.trim()&&!scHeroName.trim())return;
    setScLoading(true);setScResult(null);
    const hex=scColors[0]||"#888780";
    const colorDesc=scColors.length===1?(ACCENT_COLORS.find(a=>a.hex===hex)?.label||hex):scColors.map((c,i)=>(["primary","secondary","tertiary"][i])+": "+(ACCENT_COLORS.find(a=>a.hex===c)?.label||c)).join(", ");
    const raceStr=raceLabel(scRace);const raceLoreStr=raceLore(scRace);
    const computedAge=scAge||(scBirthYear?String(2026-parseInt(scBirthYear)):"");
    const profileContext=PERSONAL_PROFILE.map(sec=>`== ${sec.section} ==\n`+sec.questions.map(q=>{const opt=q.options.find(o=>o.id===scProfileAnswers[q.id]);return opt?`${q.q}\n→ ${opt.value}`:""}).filter(Boolean).join("\n")).join("\n\n");
    try{
      const p=await callAI(`Create a solo independent superhero (no team) built entirely from this person's real psychological profile. JSON only.\n\nEvery power, origin, and trait must grow directly from who this person actually is.\n\nReal name: ${scName||"Unknown"}\nGender: ${scGender}\nAge: ${computedAge||"Unknown"}\n${scBirthYear?`Birth year: ${scBirthYear}\n`:""}Race: ${raceStr||"Unspecified"}\n${raceLoreStr?`Race lore (bake into origin): ${raceLoreStr}\n`:""}${scStoryDir.trim()?`Story direction: ${scStoryDir.trim()}\n`:""}Color palette: ${colorDesc}\n${scHeroName?`Hero name: ${scHeroName} (use exactly this name)`:""}\nIMPORTANT: Use correct pronouns (${pronounOf(scGender)}/${pronounOf(scGender)==="they"?"them":pronounOf(scGender)==="she"?"her":"him"}) throughout.\nThis hero operates alone. Personal mission, no team dependency.\n\nPERSONAL PROFILE:\n\n${profileContext}\n\n{"heroName":"${scHeroName||"hero name that fits who they actually are"}","tagline":"one sentence capturing their specific truth","role":"Role · Descriptor drawn from their actual function","origin":"3-4 sentences — direct reflection of their wound, proving ground, and what they protect alone","powers":[{"name":"Power name traceable to their specific trait","desc":"How this power looks — directly from who they are"},{"name":"Power name","desc":"visual desc"},{"name":"Power name","desc":"visual desc"},{"name":"Power name","desc":"visual desc"}],"stats":{"Power":75,"Speed":70,"Tech":60,"Intellect":80,"Will":85},"costumeDesc":"Costume from their color and symbol answers using color palette ${colorDesc}","powerFX":"Exact visual FX using color palette ${colorDesc} — matches their power texture answer","consistencyNotes":"Design rules from their identity choices","dna":["Archetype mirroring this profile","Second reference"]}`,t=>{});
      setScResult({id:`solo-${Date.now()}`,solo:true,teamId:null,realName:scName||"Unknown",gender:scGender,age:computedAge,birthYear:scBirthYear||"",race:scRace,species:raceStr||"Human",color:hex,colorPalette:scColors,colorLight:hex+"CC",initials:scName?scName.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase():"??",isCustom:true,profileLore:Object.keys(scProfileAnswers).length,...p});
    }catch(e){if(e.message!=="Generation cancelled.")setScResult({error:true,msg:e.message});}
    setScLoading(false);
  };
  const saveSoloHero=()=>{
    if(!scResult||scResult.error)return;
    addSoloHeroFn(scResult);
    setShowSoloCreator(false);
    setActiveSoloId(scResult.id);
    setSoloHeroView("profile");
    resetSoloCreator();
  };
  const generateSoloStory=async(hero,rogues)=>{
    if(!hero||rogues.length===0)return;
    setSoloStoryLoading(true);setSoloStoryResult(null);
    const selected=rogues.filter(v=>soloStoryRogueIds.length===0||soloStoryRogueIds.includes(v.id));
    const rogueNames=selected.length?selected.map(v=>v.heroName).join(", "):rogues[0].heroName;
    try{
      const r=await callAI(`Write a solo superhero story scene. JSON only.\n\nHero: ${hero.heroName} (${hero.role||"Solo Hero"})\nOrigin: ${hero.origin||""}\nVillain(s): ${rogueNames}\n\n{"title":"story title","scene":"4-5 cinematic paragraphs — a solo showdown between ${hero.heroName} and ${rogueNames}","outcome":"one sentence on who gains the upper hand","hook":"one-sentence next-chapter hook"}`,t=>{});
      setSoloStoryResult(r);
    }catch(e){setSoloStoryResult({error:e.message});}
    setSoloStoryLoading(false);
  };
  const removeMember=useCallback((teamId,member)=>{
    fetch(`/api/images/${member.id}`,{method:"DELETE"}).catch(()=>{});
    setImages(p=>{const n={...p};delete n[member.id];return n;});
    if(member.isCore){
      const nr={...removedMembers,[teamId]:[...(removedMembers[teamId]||[]),member.id]};
      setRemovedMembers(nr);persist("forge-removed",nr);
    }else{
      const newCustom=(teamRosters[teamId]||[]).filter(m=>m.id!==member.id);
      const newRosters={...teamRosters,[teamId]:newCustom};
      setTeamRosters(newRosters);persist("forge-rosters",newRosters);
    }
  },[removedMembers,teamRosters,persist]);

  const addToTeam=useCallback((member,targetTeamId)=>{
    if((teamRosters[targetTeamId]||[]).some(m=>m.id===member.id))return;
    const nr={...teamRosters,[targetTeamId]:[...(teamRosters[targetTeamId]||[]),{...member,teamId:targetTeamId,isCore:false,isShared:true,primaryTeamId:member.primaryTeamId||member.teamId||activeTeamId}]};
    setTeamRosters(nr);persist("forge-rosters",nr);setSharingMember(null);
  },[teamRosters,activeTeamId,persist]);

  const switchMemberTeam=useCallback((member,targetTeamId)=>{
    let nr={...teamRosters};
    let nrem={...removedMembers};
    const src=member.teamId||activeTeamId;
    if(member.isCore){nrem[src]=[...(nrem[src]||[]),member.id];setRemovedMembers(nrem);persist("forge-removed",nrem);}
    else{nr[src]=(nr[src]||[]).filter(m=>m.id!==member.id);}
    nr[targetTeamId]=[...(nr[targetTeamId]||[]),{...member,teamId:targetTeamId,isCore:false}];
    setTeamRosters(nr);persist("forge-rosters",nr);setSwitchingMember(null);
  },[teamRosters,removedMembers,activeTeamId,persist]);

  const flipToVillain=useCallback((member)=>{
    let nr={...teamRosters};
    let nrem={...removedMembers};
    const src=member.teamId||activeTeamId;
    if(member.isCore){nrem[src]=[...(nrem[src]||[]),member.id];setRemovedMembers(nrem);persist("forge-removed",nrem);}
    else{nr[src]=(nr[src]||[]).filter(m=>m.id!==member.id);setTeamRosters(nr);persist("forge-rosters",nr);}
    const v={...member,isVillain:true,targetTeams:[src],nkAlignment:"enemy"};
    const nv=[...villainPool,v];setVillainPool(nv);persist("forge-villains",nv);setSwitchingMember(null);
  },[teamRosters,removedMembers,activeTeamId,villainPool,persist]);

  const redeemVillain=useCallback((villain,targetTeamId)=>{
    const nv=villainPool.filter(v=>v.id!==villain.id);
    setVillainPool(nv);persist("forge-villains",nv);
    const hero={...villain,isVillain:false,teamId:targetTeamId,isCore:false};
    delete hero.isVillain;
    const nr={...teamRosters,[targetTeamId]:[...(teamRosters[targetTeamId]||[]),hero]};
    setTeamRosters(nr);persist("forge-rosters",nr);setRedeemingVillain(null);
  },[villainPool,teamRosters,persist]);

  const copy=useCallback((key,text)=>{
    navigator.clipboard.writeText(text).then(()=>{setCopied(p=>({...p,[key]:true}));setTimeout(()=>setCopied(p=>({...p,[key]:false})),2000);});
  },[]);

  // ── AI ────────────────────────────────────────────────────────────────────
  const callAI=useCallback(async(prompt,onToken,maxTokens=1500)=>{
    const controller=new AbortController();
    genControllerRef.current=controller;
    // Retry config: exponential backoff with jitter
    const MAX_RETRIES=3;
    const RETRYABLE_STATUS=new Set([429,500,502,503,504]);
    let lastErr;
    for(let attempt=0;attempt<=MAX_RETRIES;attempt++){
      if(attempt>0){
        // base delay: 1s, 2s, 4s — plus up to 500ms random jitter
        const delay=1000*Math.pow(2,attempt-1)+Math.random()*500;
        await new Promise(r=>setTimeout(r,delay));
        if(controller.signal.aborted){genControllerRef.current=null;throw new Error("Generation cancelled.");}
        if(onToken)onToken(""); // clear partial stream on retry
      }
      try{
        const res=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:currentModel,max_tokens:maxTokens,messages:[{role:"user",content:prompt}]}),signal:controller.signal});
        if(!res.ok){
          if(RETRYABLE_STATUS.has(res.status)&&attempt<MAX_RETRIES){lastErr=new Error(`Server error ${res.status}`);continue;}
          throw new Error(`HTTP ${res.status}`);
        }
        if(!res.body)throw new Error("No response stream");
        const reader=res.body.getReader();
        const dec=new TextDecoder();
        let buf="",full="";
        while(true){
          const{done,value}=await reader.read();
          if(done)break;
          buf+=dec.decode(value,{stream:true});
          const lines=buf.split("\n");buf=lines.pop()||"";
          for(const line of lines){
            if(!line.trim())continue;
            let chunk;try{chunk=JSON.parse(line);}catch{continue;}
            if(chunk.e)throw new Error(chunk.e);
            if(chunk.t){full+=chunk.t;if(onToken)onToken(full);}
          }
        }
        genControllerRef.current=null;
        const clean=full.replace(/```json\n?/g,"").replace(/```\n?/g,"").trim().replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g,ch=>'\\u'+ch.charCodeAt(0).toString(16).padStart(4,'0'));
        try{return JSON.parse(clean);}catch{
          const m=clean.match(/\{[\s\S]*\}/);
          if(m){try{return JSON.parse(m[0]);}catch{}}
          const start=clean.indexOf("{");
          if(start>0){try{return JSON.parse(clean.slice(start));}catch{}}
          throw new Error("Response was not valid JSON");
        }
      }catch(e){
        if(e.name==="AbortError"){genControllerRef.current=null;throw new Error("Generation cancelled.");}
        // Retry on network-level errors (TypeError: Failed to fetch, etc.)
        if(e instanceof TypeError&&attempt<MAX_RETRIES){lastErr=e;continue;}
        genControllerRef.current=null;
        throw e;
      }
    }
    genControllerRef.current=null;
    throw lastErr||new Error("Request failed after retries");
  },[currentModel]);

  // ── Recruit ───────────────────────────────────────────────────────────────
  const generateRecruit=async()=>{
    setRLoading(true);setRResult(null);setAiStreamText("");
    const hex=rColors[0]||"#A32D2D";const colorDesc=rColors.length===1?(ACCENT_COLORS.find(a=>a.hex===hex)?.label||hex):rColors.map((c,i)=>(["primary","secondary","tertiary"][i]||"tertiary")+": "+(ACCENT_COLORS.find(a=>a.hex===c)?.label||c)).join(", ");
    const teamType=TEAM_TYPES.find(t=>t.id===activeTeam.type)?.label||activeTeam.type;
    const answers=RECRUIT_QUIZ.map(q=>{const opt=q.options.find(o=>o.id===rAnswers[q.id]);return`${q.question}: ${opt?.value||""}`;}).join("\n");
    const existingNames=activeRoster.map(m=>m.heroName).join(", ");
    try{
      const raceStr=raceLabel(rRace);
      const raceLoreStr=raceLore(rRace);
      const p=await callAI(`Create a ${activeTeam.name} team hero. JSON only.\n\nReal name: ${rName||"Unknown"}\nGender: ${rGender}\nAge: ${rAge||(rBirthYear?String(2026-parseInt(rBirthYear)):"Unknown")}\n${rBirthYear?`Birth year: ${rBirthYear}\n`:""}Race: ${raceStr||"Unspecified"}\n${raceLoreStr?`Race lore (bake into origin): ${raceLoreStr}\n`:""}${rStoryDir.trim()?`Story direction (shape the origin around this): ${rStoryDir.trim()}\n`:""}Team: ${activeTeam.name} (${teamType})\nColor palette: ${colorDesc}\nTeam alignment: ${rNkAlign}\nExisting names (pick different): ${existingNames||"none yet"}\n${rHeroName?`Hero name: ${rHeroName} (use exactly this name)`:"Hero name: (choose a fitting dark name)"}\nQuiz:\n${answers}\n\nIMPORTANT: Use correct pronouns (${pronounOf(rGender)}/${pronounOf(rGender)==="they"?"them":pronounOf(rGender)==="she"?"her":"him"}) for this character throughout.\nIMPORTANT: Pick 2-3 specific comic or anime characters as DNA for this hero based on the quiz answers. Bake these invisibly into every output field — power names shaped by their style, tagline capturing their essence, origin echoing their arc. Never name-drop them; only list in the dna array.\n\n{"heroName":"${rHeroName||"2-word dark name"}","tagline":"one punchy sentence","role":"Role · Descriptor","origin":"2-3 sentences connected to the team and their world — reflect their race biology and birth year context if provided","powers":[{"name":"Name","desc":"visual desc"},{"name":"Name","desc":"visual desc"},{"name":"Name","desc":"visual desc"},{"name":"Name","desc":"visual desc"}],"stats":{"Power":75,"Speed":70,"Tech":60,"Intellect":80,"Will":85},"costumeDesc":"costume in team aesthetic using color palette ${colorDesc}","powerFX":"visible effects using color palette ${colorDesc}","consistencyNotes":"design lock rules","dna":["Character whose energy shapes this hero's powers — e.g. Vegeta","Character whose arc or personality informs their story"]}`,t=>setAiStreamText(t));
      const num=String(activeRoster.length+1).padStart(2,"0");
      const computedAge=rAge||(rBirthYear?String(2026-parseInt(rBirthYear)):"");
      setRResult({id:`char-${Date.now()}`,teamId:activeTeamId,realName:rName||"Unknown",gender:rGender,age:computedAge,birthYear:rBirthYear||"",race:rRace,species:raceLabel(rRace)||"Human",color:hex,colorPalette:rColors,colorLight:hex+"CC",initials:rName?rName.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase():"??",number:num,isCustom:true,nkAlignment:rNkAlign,teamRank:rTeamRank,...p});
    }catch(e){if(e.message==="Generation cancelled.")setRResult(null);else setRResult({error:true,msg:e.message});}
    setRLoading(false);setAiStreamText("");
  };

  const addRecruit=()=>{
    if(!rResult||rResult.error)return;
    const newRosters={...teamRosters,[activeTeamId]:[...(teamRosters[activeTeamId]||[]),rResult]};
    setTeamRosters(newRosters);
    persist("forge-rosters",newRosters);
    if(rFamilyCharId){
      const rel=FAMILY_RELATIONS.find(r=>r.id===rFamilyRelation);
      if(rel){
        const newLink={id:`fl-${Date.now()}`,a:rResult.id,b:rFamilyCharId,aRelation:rel.label,bRelation:rel.inverse};
        const updatedLinks=[...familyLinks,newLink];
        setFamilyLinks(updatedLinks);
        persist("forge-family",updatedLinks);
      }
    }
    if(rHeroAssocId){
      const t=HERO_ASSOC_TYPES.find(x=>x.id===rHeroAssocType);
      if(t){
        const newAssoc={id:`ha-${Date.now()}`,a:rResult.id,b:rHeroAssocId,aRelation:t.label,bRelation:t.inverse};
        const updatedAssocs=[...heroAssocs,newAssoc];
        setHeroAssocs(updatedAssocs);
        persist("forge-hero-assocs",updatedAssocs);
      }
    }
    setRResult(null);setRAnswers({});setRName("");setRHeroName("");setRStep(0);setRNkAlign("neutral");setRTeamRank("operative");setRGender("Male");setRAge("");setRBirthYear("");setRRace(null);setRStoryDir("");setDeepAnswers({});setDeepPhase(0);setProfileAnswers({});setProfileStep(0);setRFamilyCharId("");setRFamilyRelation("parent");setRHeroAssocId("");setRHeroAssocType("sidekick");setRecruitSuggest(null);setRecruitSuggestLoading(false);setTab("roster");
  };

  const runAIRecruit=async()=>{
    const teamNames=[...activeRoster.map(m=>m.heroName),rResult?.heroName].filter(Boolean);
    setRecruitSuggestLoading(true);setRecruitSuggest(null);
    try{
      const r=await fetch("/api/generate/recruit",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({team:teamNames,model:currentModel})});
      const d=await r.json();
      setRecruitSuggest(d.error?{_err:d.error}:d);
    }catch(e){
      setRecruitSuggest({_err:"Request failed"});
    }finally{
      setRecruitSuggestLoading(false);
    }
  };

  const generateDeepRecruit=async()=>{
    setRLoading(true);setRResult(null);setAiStreamText("");
    const hex=rColors[0]||"#A32D2D";const colorDesc=rColors.length===1?(ACCENT_COLORS.find(a=>a.hex===hex)?.label||hex):rColors.map((c,i)=>(["primary","secondary","tertiary"][i]||"tertiary")+": "+(ACCENT_COLORS.find(a=>a.hex===c)?.label||c)).join(", ");
    const existingNames=activeRoster.map(m=>m.heroName).join(", ");
    // Build rich context from deep lore answers
    const loreContext=DEEP_LORE_PHASES.map(ph=>{
      return ph.questions.map(q=>{
        const opt=q.options?.find(o=>o.id===deepAnswers[q.id]);
        return opt?`${q.label.replace("?","")}: ${opt.label}`:"";
      }).filter(Boolean).join("\n");
    }).filter(Boolean).join("\n");
    const freeText=[deepAnswers.visualRef,deepAnswers.mustHave].filter(Boolean).join(". ");
    // Extract comicDNA answers as the primary creative foundation
    const dnaInspoOpt=DEEP_LORE_PHASES[0]?.questions?.find(q=>q.id==="keyInspo")?.options?.find(o=>o.id===deepAnswers.keyInspo);
    const dnaUnivOpt=DEEP_LORE_PHASES[0]?.questions?.find(q=>q.id==="universe")?.options?.find(o=>o.id===deepAnswers.universe);
    const dnaFoundation=[dnaInspoOpt&&`Primary character DNA: ${dnaInspoOpt.label}`,dnaUnivOpt&&`Universe energy: ${dnaUnivOpt.label}`].filter(Boolean).join("\n");
    try{
      const raceStr=raceLabel(rRace);
      const raceLoreStr=raceLore(rRace);
      const p=await callAI(`Create a deeply developed ${activeTeam.name} hero using rich comic book lore. JSON only.\n\nReal name: ${rName||"Unknown"}\nGender: ${rGender}\nAge: ${rAge||(rBirthYear?String(2026-parseInt(rBirthYear)):"Unknown")}\n${rBirthYear?`Birth year: ${rBirthYear}\n`:""}Race: ${raceStr||"Unspecified"}\n${raceLoreStr?`Race lore (bake into origin): ${raceLoreStr}\n`:""}${rStoryDir.trim()?`Story direction (shape the origin around this): ${rStoryDir.trim()}\n`:""}Color palette: ${colorDesc}\nTeam alignment: ${rNkAlign}\nExisting names (must be different): ${existingNames||"none"}\n${rHeroName?`Hero name: ${rHeroName} (use exactly this name)`:"Hero name: (choose a distinct name fitting the lore profile)"}\nTeam: ${activeTeam.name}\nIMPORTANT: Use correct pronouns (${pronounOf(rGender)}/${pronounOf(rGender)==="they"?"them":pronounOf(rGender)==="she"?"her":"him"}) for this character throughout.\n${dnaFoundation?`\nCHARACTER DNA FOUNDATION (bake these invisibly into every field — powers named/described through their aesthetic, origin reflecting their arc pattern, personality in the tagline — filter through the universe this team inhabits, never reference by name except in the dna array):\n${dnaFoundation}\n`:""}\nFull lore profile:\n${loreContext}${freeText?"\nVisual references: "+freeText:""}\n\nUse this lore to create a hero that feels authentic to these inspirations. JSON:\n{"heroName":"${rHeroName||"2-word hero name, distinct and fitting the lore profile"}","tagline":"one piercing sentence that captures their essence","role":"Role · Descriptor","origin":"3-4 sentences backstory that directly reflects the lore answers — specific and rooted in their race and birth year context","powers":[{"name":"Power name matching their visual style","desc":"2-sentence visual description of exactly how this looks in action"},{"name":"Power name","desc":"visual desc"},{"name":"Power name","desc":"visual desc"},{"name":"Power name","desc":"visual desc"}],"stats":{"Power":75,"Speed":70,"Tech":60,"Intellect":80,"Will":85},"costumeDesc":"Detailed costume description using color palette ${colorDesc}, reflecting their costume philosophy answer","powerFX":"Exact visual description of power effects using color palette ${colorDesc}, matching their FX style answer","consistencyNotes":"2-3 specific design lock rules based on their visual choices","dna":["Primary DNA — exact character name like Vegeta or Moon Knight","Secondary DNA — another specific character baked into this hero","Optional third DNA — only if genuinely applicable"]}`,t=>setAiStreamText(t));
      const num=String(activeRoster.length+1).padStart(2,"0");
      const computedAge=rAge||(rBirthYear?String(2026-parseInt(rBirthYear)):"");
      setRResult({id:`char-${Date.now()}`,teamId:activeTeamId,realName:rName||"Unknown",gender:rGender,age:computedAge,birthYear:rBirthYear||"",race:rRace,species:raceLabel(rRace)||"Human",color:hex,colorPalette:rColors,colorLight:hex+"CC",initials:rName?rName.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase():"??",number:num,isCustom:true,nkAlignment:rNkAlign,teamRank:rTeamRank,deepLore:deepAnswers,...p});
    }catch(e){if(e.message==="Generation cancelled.")setRResult(null);else setRResult({error:true,msg:e.message});}
    setRLoading(false);setAiStreamText("");
  };

  const generatePersonalProfile=async()=>{
    setRLoading(true);setRResult(null);setAiStreamText("");
    const hex=rColors[0]||"#A32D2D";const colorDesc=rColors.length===1?(ACCENT_COLORS.find(a=>a.hex===hex)?.label||hex):rColors.map((c,i)=>(["primary","secondary","tertiary"][i]||"tertiary")+": "+(ACCENT_COLORS.find(a=>a.hex===c)?.label||c)).join(", ");
    const existingNames=activeRoster.map(m=>m.heroName).join(", ");
    const profileContext=PERSONAL_PROFILE.map(sec=>`== ${sec.section} ==\n`+sec.questions.map(q=>{const opt=q.options.find(o=>o.id===profileAnswers[q.id]);return opt?`${q.q}\n→ ${opt.value}`:"";}).filter(Boolean).join("\n")).join("\n\n");
    const answerCount=Object.keys(profileAnswers).length;
    try{
      const raceStr=raceLabel(rRace);
      const raceLoreStr=raceLore(rRace);
      const p=await callAI(`Create a hero built entirely from this person's real psychological and physical profile. JSON only.\n\nThis is not a generic hero — every power, origin, and trait must grow directly from who this specific person actually is. Powers are not chosen from archetypes; they emerge from the person's specific strengths, wounds, and way of moving through the world.\n\nReal name: ${rName||"Unknown"}\nGender: ${rGender}\nAge: ${rAge||(rBirthYear?String(2026-parseInt(rBirthYear)):"Unknown")}\n${rBirthYear?`Birth year: ${rBirthYear}\n`:""}Race: ${raceStr||"Unspecified"}\n${raceLoreStr?`Race lore (bake into origin): ${raceLoreStr}\n`:""}${rStoryDir.trim()?`Story direction: ${rStoryDir.trim()}\n`:""}Team: ${activeTeam.name}\nColor palette: ${colorDesc}\nTeam alignment: ${rNkAlign}\nExisting names (must be different): ${existingNames||"none"}\n${rHeroName?`Hero name: ${rHeroName} (use exactly this name)`:""}\nIMPORTANT: Use correct pronouns (${pronounOf(rGender)}/${pronounOf(rGender)==="they"?"them":pronounOf(rGender)==="she"?"her":"him"}) throughout.\n\nPERSONAL PROFILE — 25 answers defining who this person actually is:\n\n${profileContext}\n\nBuild the hero from these truths. Powers must be an externalization of their actual traits, wounds, and way of being. The origin must reflect their real emotional core. Costume and FX must be the visual language of who they are — not what looks cool. Do not default to generic archetypes.\n\n{"heroName":"${rHeroName||"hero name that fits who they actually are"}","tagline":"one sentence that captures their specific truth","role":"Role · Descriptor drawn from their actual function in life","origin":"3-4 sentences — direct reflection of their wound, proving ground, and what they protect","powers":[{"name":"Power name traceable to their specific trait","desc":"How this power looks and works — directly from who they are"},{"name":"Power name","desc":"visual desc"},{"name":"Power name","desc":"visual desc"},{"name":"Power name","desc":"visual desc"}],"stats":{"Power":75,"Speed":70,"Tech":60,"Intellect":80,"Will":85},"costumeDesc":"Costume built from their color, movement, and symbol answers using color palette ${colorDesc}","powerFX":"Exact visual FX using color palette ${colorDesc} — must match their power texture and visual signature answers","consistencyNotes":"Design rules grounded in their specific identity choices","dna":["Archetype or character whose energy mirrors this profile","Second reference"]}`,t=>setAiStreamText(t));
      const num=String(activeRoster.length+1).padStart(2,"0");
      const computedAge=rAge||(rBirthYear?String(2026-parseInt(rBirthYear)):"");
      setRResult({id:`char-${Date.now()}`,teamId:activeTeamId,realName:rName||"Unknown",gender:rGender,age:computedAge,birthYear:rBirthYear||"",race:rRace,species:raceLabel(rRace)||"Human",color:hex,colorPalette:rColors,colorLight:hex+"CC",initials:rName?rName.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase():"??",number:num,isCustom:true,nkAlignment:rNkAlign,teamRank:rTeamRank,profileLore:answerCount,...p});
    }catch(e){if(e.message==="Generation cancelled.")setRResult(null);else setRResult({error:true,msg:e.message});}
    setRLoading(false);setAiStreamText("");
  };

  const saveBareRecruit=()=>{
    const hex=rColors[0]||"#A32D2D";const colorDesc=rColors.length===1?(ACCENT_COLORS.find(a=>a.hex===hex)?.label||hex):rColors.map((c,i)=>(["primary","secondary","tertiary"][i]||"tertiary")+": "+(ACCENT_COLORS.find(a=>a.hex===c)?.label||c)).join(", ");
    const num=String(activeRoster.length+1).padStart(2,"0");
    const computedAge=rAge||(rBirthYear?String(2026-parseInt(rBirthYear)):"");
    const bare={id:`char-${Date.now()}`,teamId:activeTeamId,realName:rName||"Unknown",heroName:rHeroName,gender:rGender,age:computedAge,birthYear:rBirthYear||"",race:rRace,species:raceLabel(rRace)||"Human",color:hex,colorPalette:rColors,colorLight:hex+"CC",initials:rName?rName.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase():"??",number:num,isCustom:true,nkAlignment:rNkAlign,teamRank:rTeamRank,tagline:"",role:"Hero",origin:"",powers:[],stats:{Power:50,Speed:50,Tech:50,Intellect:50,Will:50},costumeDesc:"",powerFX:"",consistencyNotes:"",dna:[]};
    const newRosters={...teamRosters,[activeTeamId]:[...(teamRosters[activeTeamId]||[]),bare]};
    setTeamRosters(newRosters);persist("forge-rosters",newRosters);
    if(rFamilyCharId){const rel=FAMILY_RELATIONS.find(r=>r.id===rFamilyRelation);if(rel){const newLink={id:`fl-${Date.now()}`,a:bare.id,b:rFamilyCharId,aRelation:rel.label,bRelation:rel.inverse};const updatedLinks=[...familyLinks,newLink];setFamilyLinks(updatedLinks);persist("forge-family",updatedLinks);}}
    if(rHeroAssocId){const t=HERO_ASSOC_TYPES.find(x=>x.id===rHeroAssocType);if(t){const newAssoc={id:`ha-${Date.now()}`,a:bare.id,b:rHeroAssocId,aRelation:t.label,bRelation:t.inverse};const updatedAssocs=[...heroAssocs,newAssoc];setHeroAssocs(updatedAssocs);persist("forge-hero-assocs",updatedAssocs);}}
    setRResult(null);setRAnswers({});setRName("");setRHeroName("");setRStep(0);setRNkAlign("neutral");setRTeamRank("operative");setRGender("Male");setRAge("");setRBirthYear("");setRRace(null);setRStoryDir("");setDeepAnswers({});setDeepPhase(0);setProfileAnswers({});setProfileStep(0);setRFamilyCharId("");setRFamilyRelation("parent");setRHeroAssocId("");setRHeroAssocType("sidekick");setTab("roster");
  };

  const generateTripo3D=async(member)=>{
    setTripo3DTarget(member.id);setTripo3DLoading(true);setTripo3DPrompt(null);
    try{
      const tAgeStage=ageStage(member.age);
      const p=await callAI(`Generate a Tripo3D 3D model prompt for this character. JSON only, key "prompt".\n\nCharacter: ${member.heroName}\nCostume: ${member.costumeDesc||"dramatic suit"}\nPower FX: ${member.powerFX||"energy effects"}\nAccent color: ${member.color}${tAgeStage?"\nAge stage: "+tAgeStage+" — body proportions must reflect this ("+tAgeStage+"-appropriate frame, musculature, and scale)":""}\n\n{"prompt":"2-3 sentence Tripo3D prompt. Describe as a 3D model: full-body character standing in neutral A-pose or slight heroic stance. Mention separate color regions for multi-filament FDM printing. Mention watertight mesh, clean topology, no floating geometry. Include character-specific details like costume elements, weapon accessories, or power effect attachments that print as separate pieces."}`);
      setTripo3DPrompt(p.prompt||"Generation failed.");
    }catch(e){setTripo3DPrompt("Generation failed: "+e.message);}
    setTripo3DLoading(false);
  };

  // ── Villain pool ──────────────────────────────────────────────────────────
  const generateVillain=async()=>{
    setVLoading(true);setVResult(null);setAiStreamText("");
    const answers=VILLAIN_QUIZ.map(q=>{const opt=q.options.find(o=>o.id===vAnswers[q.id]);return`${q.question}: ${opt?.value||""}`;}).join("\n");
    const targetNames=rogueMode
      ?(soloHeroes.find(h=>h.id===rogueMode)?.heroName||"the solo hero")
      :vTargetTeams.map(id=>teams.find(t=>t.id===id)?.name||id).join(", ")||(teams[0]?.name||"the heroes");
    try{
      const p=await callAI(`Create a villain who threatens: ${targetNames}. JSON only — keys: heroName, tagline, role, origin, powers, stats, dna.\n\nName: ${vName||"Unknown"}\nGender: ${vGender}\nIMPORTANT: Use correct pronouns (${pronounOf(vGender)}/${pronounOf(vGender)==="they"?"them":pronounOf(vGender)==="she"?"her":"him"}) throughout.\nTarget teams: ${targetNames}\nQuiz:\n${answers}\n\n{"heroName":"villain codename","tagline":"one chilling sentence","role":"Threat · Descriptor","origin":"3-4 sentences deeply tied to the target teams","powers":[{"name":"Name","desc":"desc, mirror or counter to a hero ability"},{"name":"Name","desc":"desc"},{"name":"Name","desc":"desc"},{"name":"Name","desc":"desc"}],"stats":{"Power":88,"Speed":78,"Tech":82,"Intellect":90,"Will":88},"dna":["Villain Inspiration 1","Villain Inspiration 2"]}`,t=>setAiStreamText(t));
      setVResult({id:`villain-${Date.now()}`,realName:vName||"Unknown",gender:vGender,color:"#8B1A1A",colorLight:"#E07070",initials:vName?vName.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase():"??",isVillain:true,targetTeams:vTargetTeams.length?vTargetTeams:(teams[0]?[teams[0].id]:[]),...p});
    }catch(e){if(e.message==="Generation cancelled.")setVResult(null);else setVResult({error:true,msg:e.message});}
    setVLoading(false);setAiStreamText("");
  };

  const addVillain=()=>{
    if(!vResult||vResult.error)return;
    if(rogueMode){
      addSoloRogueFn(rogueMode,{...vResult,rogueFor:rogueMode});
      setRogueMode(null);
    }else{
      const newPool=[...villainPool,vResult];setVillainPool(newPool);persist("forge-villains",newPool);
    }
    setVResult(null);setVAnswers({});setVName("");setVStep(0);setVTargetTeams([]);setVGender("Male");setVDeepMode(false);setVProfileMode(false);setVDeepPhase(0);setVDeepAnswers({});setVProfileStep(0);setVProfileAnswers({});
  };

  const saveBareVillain=()=>{
    const bare={id:`villain-${Date.now()}`,realName:vName||"Unknown",heroName:vName||"Unknown Threat",gender:vGender,color:"#8B1A1A",colorLight:"#E07070",initials:vName?vName.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase():"??",isVillain:true,targetTeams:vTargetTeams.length?vTargetTeams:(teams[0]?[teams[0].id]:[]),tagline:"",role:"Threat",origin:"",powers:[],stats:{Power:50,Speed:50,Tech:50,Intellect:50,Will:50},dna:[]};
    if(rogueMode){
      addSoloRogueFn(rogueMode,{...bare,rogueFor:rogueMode});setRogueMode(null);
    }else{
      const newPool=[...villainPool,bare];setVillainPool(newPool);persist("forge-villains",newPool);
    }
    setVResult(null);setVAnswers({});setVName("");setVStep(0);setVTargetTeams([]);setVGender("Male");setVDeepMode(false);setVProfileMode(false);setVDeepPhase(0);setVDeepAnswers({});setVProfileStep(0);setVProfileAnswers({});
  };

  const removeVillain=id=>{
    const newPool=villainPool.filter(v=>v.id!==id);
    setVillainPool(newPool);
    persist("forge-villains",newPool);
  };

  const saveVillainTarget=useCallback((id)=>{
    const updated=villainPool.map(v=>v.id===id?{...v,targetTeams:vtDraft.teams,targetHeroes:vtDraft.heroes}:v);
    setVillainPool(updated);persist("forge-villains",updated);setEditingVillainTarget(null);
  },[villainPool,vtDraft,persist]);

  const generateVillainDeep=async()=>{
    setVLoading(true);setVResult(null);setAiStreamText("");
    const targetNames=rogueMode?(soloHeroes.find(h=>h.id===rogueMode)?.heroName||"the solo hero"):vTargetTeams.map(id=>teams.find(t=>t.id===id)?.name||id).join(", ")||(teams[0]?.name||"the heroes");
    const loreContext=DEEP_LORE_PHASES.map(ph=>`== ${ph.title} ==\n`+ph.questions.map(q=>{const opt=q.options?.find(o=>o.id===vDeepAnswers[q.id]);return opt?`${q.label}: ${opt.label}`:""}).filter(Boolean).join("\n")).filter(l=>l.includes(":")).join("\n\n");
    const dnaInspoOpt=DEEP_LORE_PHASES[0]?.questions?.find(q=>q.id==="keyInspo")?.options?.find(o=>o.id===vDeepAnswers.keyInspo);
    const dnaUnivOpt=DEEP_LORE_PHASES[0]?.questions?.find(q=>q.id==="universe")?.options?.find(o=>o.id===vDeepAnswers.universe);
    const dnaFoundation=[dnaInspoOpt?.label,dnaUnivOpt?.label].filter(Boolean).join(", ");
    try{
      const p=await callAI(`Create a deeply developed villain who threatens: ${targetNames}. JSON only — keys: heroName, tagline, role, origin, powers, stats, dna.\n\nName: ${vName||"Unknown"}\nGender: ${vGender}\nIMPORTANT: Use correct pronouns (${pronounOf(vGender)}/${pronounOf(vGender)==="they"?"them":pronounOf(vGender)==="she"?"her":"him"}) throughout.\nTarget: ${targetNames}\n\nThis is a VILLAIN — interpret every lore answer as a dangerous antagonist, not a hero. Archetype becomes threat archetype, drive becomes destructive motivation, visual identity becomes menacing presence.\n${dnaFoundation?`\nVILLAIN DNA FOUNDATION (bake into powers and style invisibly): ${dnaFoundation}\n`:""}\nFull lore profile:\n${loreContext}\n\n{"heroName":"villain codename","tagline":"one chilling sentence","role":"Threat · Descriptor","origin":"3-4 sentences — layered backstory tied to the lore profile and the target","powers":[{"name":"Name","desc":"desc — mirrors or counters a hero ability"},{"name":"Name","desc":"desc"},{"name":"Name","desc":"desc"},{"name":"Name","desc":"desc"}],"stats":{"Power":88,"Speed":78,"Tech":82,"Intellect":90,"Will":88},"costumeDesc":"ominous costume reflecting lore visual answers","powerFX":"dark threatening power FX matching lore style answers","consistencyNotes":"design lock rules","dna":["Villain Inspiration 1","Villain Inspiration 2"]}`,t=>setAiStreamText(t));
      setVResult({id:`villain-${Date.now()}`,realName:vName||"Unknown",gender:vGender,color:"#8B1A1A",colorLight:"#E07070",initials:vName?vName.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase():"??",isVillain:true,targetTeams:vTargetTeams.length?vTargetTeams:(teams[0]?[teams[0].id]:[]),deepLore:vDeepAnswers,...p});
    }catch(e){if(e.message==="Generation cancelled.")setVResult(null);else setVResult({error:true,msg:e.message});}
    setVLoading(false);setAiStreamText("");
  };

  const generateVillainProfile=async()=>{
    setVLoading(true);setVResult(null);setAiStreamText("");
    const targetNames=rogueMode?(soloHeroes.find(h=>h.id===rogueMode)?.heroName||"the solo hero"):vTargetTeams.map(id=>teams.find(t=>t.id===id)?.name||id).join(", ")||(teams[0]?.name||"the heroes");
    const profileContext=PERSONAL_PROFILE.map(sec=>`== ${sec.section} ==\n`+sec.questions.map(q=>{const opt=q.options.find(o=>o.id===vProfileAnswers[q.id]);return opt?`${q.q}\n→ ${opt.value}`:""}).filter(Boolean).join("\n")).join("\n\n");
    try{
      const p=await callAI(`Create a villain who threatens: ${targetNames}, built from this psychological profile. JSON only — keys: heroName, tagline, role, origin, powers, stats, dna.\n\nName: ${vName||"Unknown"}\nGender: ${vGender}\nIMPORTANT: Use correct pronouns (${pronounOf(vGender)}/${pronounOf(vGender)==="they"?"them":pronounOf(vGender)==="she"?"her":"him"}) throughout.\nTarget: ${targetNames}\n\nThis is a VILLAIN. Interpret every profile answer through a dark lens — their strengths become weapons, their wounds become motivations, their presence becomes a threat.\n\nPERSONAL PROFILE:\n\n${profileContext}\n\n{"heroName":"villain codename fitting their psychological profile","tagline":"one chilling sentence capturing their specific darkness","role":"Threat · Descriptor rooted in their profile","origin":"3-4 sentences — how their psychological wound became a threat to the target","powers":[{"name":"Power emerging from their trait","desc":"How it looks — directly from who they are"},{"name":"Power name","desc":"desc"},{"name":"Power name","desc":"desc"},{"name":"Power name","desc":"desc"}],"stats":{"Power":85,"Speed":78,"Tech":80,"Intellect":92,"Will":90},"costumeDesc":"ominous costume from their visual identity answers","powerFX":"dark power FX matching their power texture answer","consistencyNotes":"design lock rules","dna":["Villain archetype mirroring this profile","Second villain reference"]}`,t=>setAiStreamText(t));
      setVResult({id:`villain-${Date.now()}`,realName:vName||"Unknown",gender:vGender,color:"#8B1A1A",colorLight:"#E07070",initials:vName?vName.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase():"??",isVillain:true,targetTeams:vTargetTeams.length?vTargetTeams:(teams[0]?[teams[0].id]:[]),profileLore:Object.keys(vProfileAnswers).length,...p});
    }catch(e){if(e.message==="Generation cancelled.")setVResult(null);else setVResult({error:true,msg:e.message});}
    setVLoading(false);setAiStreamText("");
  };

  // ── Story ─────────────────────────────────────────────────────────────────
  const generateStory=async()=>{
    setSLoading(true);setSResult(null);
    const castChars=[...allCharacters,...villainPool].filter(m=>sCast.includes(m.id));
    const scene=SCENARIOS.find(s=>s.id===sScenario);
    try{
      const p=await callAI(`Direct visual image prompt for Meta AI Imagine. JSON only, key "prompt".\n\nCast: ${castChars.map(m=>{const s=ageStage(m.age);const cn=hexToColorName(m.color);return`${m.heroName}${m.isVillain?" (VILLAIN)":""}${s?" ["+s+"]":""} (${m.powerFX||cn+" energy"}, ${m.costumeDesc||"dramatic suit"}, accent color: ${cn})`;}).join("; ")}\nScenario: ${scene?.label} — ${scene?.desc}\nTone: ${sTone}\n\nAge stage is in brackets — physique, face, and proportions must visually match each character's life stage.\n\n{"prompt":"5-6 sentence direct visual prompt. NEVER use instruction verbs — do NOT start with Generate, Create, Draw, Show, or any command. NEVER use hex codes — describe all colors by name. Begin directly with the scene visuals. Sentence 1: Set the scene environment with specific nighttime urban details — exact location, lighting sources, atmosphere matching the tone. Sentence 2-4: Each character described visually — position in scene, exact costume with named colors, power FX actively firing (color names for glow, particles, energy). Sentence 5: Action/interaction between characters matching the scenario. Sentence 6 (style): photorealistic digital painting, cinematic wide shot, all characters fully visible, dramatic lighting, high detail, comic book illustration style."}`);
      setSResult(p.prompt||"Generation failed — try again.");
    }catch(e){setSResult("Generation failed: "+e.message);}
    setSLoading(false);
  };

  // ── Prompts ───────────────────────────────────────────────────────────────
  const generateCharPrompt=async(member)=>{
    setPSelected(member.id);setPLoading(true);setPResult(null);
    const style=ART_STYLES.find(a=>a.id===pStyle)?.text||"";
    const hasRef=images[member.id];
    const refNote=hasRef?"Start the metaAI prompt with: \"Maintaining exact character design from reference image — same face, same costume, same color scheme, same power effects. Do not redesign.\"":"";
    try{
      const mPronoun=pronounOf(member.gender||"");
      const mAgeStage=ageStage(member.age);
      const colorName=hexToColorName(member.color);
      const fxDesc=member.powerFX||colorName+" energy";
      const platInstr=pPlatform==="midjourney"
        ?`metaAI = Midjourney /imagine prompt. Comma-separated visual descriptors ONLY — no sentences, no instruction verbs, no filler words.\nFORMAT: [hero name], [${member.gender||"hero"} warrior physique${mAgeStage?", "+mAgeStage+" body frame":""}, strong athletic build, confident heroic neutral stance, feet flat on ground], [form-fitting hero suit with subtle surface texture inspired by The Incredibles or Batman — no emblem no cape, dominant ${colorName} with named accent colors], [${member.powerType==="equipment"?fxDesc+" gear — described by material and color name":member.powerType==="skills"?"peak conditioning body language, martial discipline, no power effects":"faint "+colorName+" energy aura tracing suit edges — understated not explosive, all glow colors named"}], [plain clean background — neutral studio gradient complementing costume palette, no environment clutter], [cinematic dramatic lighting, strong front rim light tracing suit surface texture, deep realistic shadows], [full body head to toe, feet fully visible, wide shot generous space below feet, no cropping, ${style||"photorealistic digital painting, highly detailed, realistic style"}] --ar 2:3 --v 6.1 --style raw --q 2\nNEVER use hex codes — name all colors (e.g. "${colorName}"). Keep it punchy and visual.`
        :pPlatform==="dalle"
        ?`metaAI = DALL-E 3 prompt. 3-4 detailed prose sentences.\n- Start with: "A dramatic full-body portrait of ${member.heroName}..." — NEVER use verbs like "Generate", "Create", "Draw".\n- Sentence 1: Physical presence — ${member.gender||"hero"} warrior, strong athletic build${mAgeStage?", "+mAgeStage+" proportions":""}, confident heroic yet neutral stance, feet flat on the ground. Form-fitting hero suit with subtle surface texture — clean silhouette and design language inspired by The Incredibles or Batman, no emblem, no cape — dominant ${colorName} with named accent colors. Full body head to toe, feet fully visible, wide shot with generous space below feet, no cropping.\n- Sentence 2: ${member.powerType==="equipment"?`${fxDesc} — gear and equipment described by material and color name, integrated cleanly into the suit design.`:member.powerType==="skills"?"Body language radiates peak conditioning and martial discipline — intense focused expression, no supernatural effects.":"Subtle "+colorName+" power aura traces the suit edges — understated energy presence, every glow color named, not explosively active."}\n- Sentence 3: Plain neutral studio background — clean gradient backdrop that complements and contrasts the costume palette, no environment clutter, hero's full silhouette reads clearly at full scale with open space below feet.\n- Sentence 4: "${style||"photorealistic digital painting, cinematic dramatic lighting from high front angle, strong rim light tracing suit texture, deep realistic shadows, highly detailed, full body portrait orientation, realistic illustration style"}"`
        :`metaAI = Direct visual image prompt for Meta AI Imagine. STRICT RULES:\n- NEVER use instruction verbs. Do NOT start with "Generate", "Create", "Draw", "Show", or any command. Begin directly with visual content.\n- NEVER use hex codes — name all colors by name.\n\nSentence 1: ${member.heroName} — ${member.gender||"hero"} warrior with a strong, athletic build${mAgeStage?", "+mAgeStage+" proportions":""}, standing in a confident heroic yet neutral stance, feet flat on the ground. Form-fitting hero suit with subtle surface texture — clean silhouette and design language inspired by The Incredibles or Batman, no emblem, no cape — dominant ${colorName} with named accent colors from costume design. Full body visible head to toe, feet fully visible, wide shot with generous open space below feet, absolutely no cropping.\nSentence 2: ${member.powerType==="equipment"?`Detailed view of ${member.heroName}'s gear — ${fxDesc}, described by material and color name, cleanly integrated into the suit.`:member.powerType==="skills"?"Body language and stance radiate peak conditioning and martial discipline — intense composed expression, no supernatural effects.":"A subtle "+colorName+" energy presence — faint power aura at the hands or tracing the suit's edges, understated rather than explosively active. Every glow color named."}\nSentence 3: Plain clean background — neutral studio-quality gradient backdrop that complements and contrasts the costume colors, no environmental clutter, hero's full silhouette reads clearly against the background.\nSentence 4: Cinematic dramatic lighting from a high front angle, strong rim light tracing the form-fitting suit's surface texture, deep realistic shadows, highly detailed, photorealistic digital painting, ${style||"realistic illustration style"}.`;
      const p=await callAI(`JSON only. Reply with exactly this format, no other text:\n{"metaAI":"...","tripo3D":"..."}\n\n${refNote}Character: ${member.heroName} (${member.realName}), ${member.gender||"Unknown"} ${raceLabel(member.race)||member.species||"Human"}${member.age?", age "+member.age:""}${mAgeStage?" ("+mAgeStage+")":""}.\nTeam: ${activeTeam.name}. Style: ${style}.\nCostume: ${member.costumeDesc||"dramatic suit"}. Primary color: ${colorName}. Power FX: ${fxDesc}.\nDesign rules: ${member.consistencyNotes||"consistent accent color"}.\nPronouns: ${mPronoun}.${mAgeStage?"\nAge presentation: "+mAgeStage+" — physique, face, and body proportions must visually match this life stage.":""}\n\n${platInstr}\ntripo3D = 1 sentence FDM mesh prompt with separate color regions.\n\n{"metaAI":"...","tripo3D":"..."}`,null,500);
      setPResult({member,...p,platform:pPlatform});
    }catch(e){setPResult({error:true,msg:e.message});}
    setPLoading(false);
  };

  const generateVillainPrompt=async(villain)=>{
    setPSelected(villain.id);setPLoading(true);setPResult(null);
    const style=ART_STYLES.find(a=>a.id===pStyle)?.text||"";
    const hasRef=images[villain.id];
    const refNote=hasRef?"Start the metaAI prompt with: \"Maintaining exact character design from reference image — same face, same costume, same color scheme, same power effects. Do not redesign.\"":"";
    try{
      const vPronoun=pronounOf(villain.gender||"");
      const vAgeStage=ageStage(villain.age);
      const colorName=hexToColorName(villain.color||"#8B1A1A");
      const fxDesc=villain.powerFX||colorName+" corruption energy";
      const costumeDesc=villain.costumeDesc||"dark armored suit";
      const powerNames=villain.powers?.map(pw=>pw.name).join(", ")||"unknown powers";
      const platInstr=pPlatform==="midjourney"
        ?`metaAI = Midjourney /imagine prompt. Comma-separated visual descriptors ONLY — no sentences, no instruction verbs.\nFORMAT: [villain name], [${villain.gender||"villain"} physique${vAgeStage?", "+vAgeStage+" frame":""}, powerful imposing build, dominant menacing stance, feet planted on ground], [form-fitting villain suit with subtle surface texture — ${costumeDesc}, dominant ${colorName} with deep shadow accents, dark armor design language], [${fxDesc} ACTIVELY radiating — name every color: corruption tendrils, malevolent aura, dark glow], [ominous environment: crumbling rooftop or storm-lit ruins, rising smoke and debris, blood-red tinged atmosphere], [harsh underlighting from below, blood-red rim light, deep upward shadows, stormy sky], [full body head to toe, feet fully visible, wide shot space below feet, no cropping, ${style||"photorealistic digital painting, dramatic villain portrait, cinematic dark lighting, comic book villain art style"}] --ar 2:3 --v 6.1 --style raw --q 2\nNEVER use hex codes — name all colors. Villain must look threatening, dominant, and dangerous.`
        :pPlatform==="dalle"
        ?`metaAI = DALL-E 3 prompt. 3-4 detailed prose sentences.\n- Start with: "A dramatic full-body villain portrait of ${villain.heroName}..." — NEVER use instruction verbs.\n- Sentence 1: ${villain.gender||"villain"} villain, powerful imposing build${vAgeStage?", "+vAgeStage+" proportions":""}, dominant menacing stance with feet planted firmly on the ground, looming threatening presence, full body visible head to toe. Form-fitting villain suit with subtle surface texture — ${costumeDesc}, dominant ${colorName} with deep shadow accents. Wide shot with space below feet, no cropping.\n- Sentence 2: ${fxDesc} ACTIVELY radiating — ${colorName} corruption aura, dark energy tendrils from hands and body. Name every color. No hex codes.\n- Sentence 3: Ominous environment — crumbling rooftop or storm-lit industrial ruins, rising smoke, harsh underlighting casting deep shadows upward, blood-red tinged stormy sky.\n- Sentence 4: "${style||"dramatic villain portrait, photorealistic digital painting, harsh underlighting, cinematic dark lighting, full body portrait orientation, high detail, comic book villain art style"}"`
        :`metaAI = Direct visual image prompt for Meta AI Imagine. STRICT RULES:\n- NEVER use instruction verbs. Begin directly with visual content.\n- NEVER use hex codes — name all colors by name.\n\nSentence 1: ${villain.heroName} — ${villain.gender||"villain"} with a powerful, imposing build${vAgeStage?", "+vAgeStage+" physique":""}, standing in a dominant menacing stance with feet planted firmly on the ground, looming threatening presence radiating pure menace. Form-fitting villain suit with subtle surface texture — ${costumeDesc}, dominant ${colorName} with deep shadow accents. Full body visible head to toe, feet fully visible, wide shot with generous space below feet, no cropping.\nSentence 2: ${fxDesc} actively radiating — ${colorName} corruption aura, dark energy tendrils from hands and body. Every glow color named. Cold, contemptuous expression.\nSentence 3: Ominous environment — crumbling stone or dark industrial backdrop, rising smoke and debris, harsh underlighting casting deep shadows upward, blood-red tinged atmosphere.\nSentence 4: Dramatic villain portrait, harsh underlighting from below and strong blood-red rim light, cinematic dark lighting, deep realistic shadows, highly detailed, photorealistic digital painting, ${style||"comic book villain art style"}.`;
      const p=await callAI(`JSON only. Reply with exactly this format, no other text:\n{"metaAI":"...","tripo3D":"..."}\n\n${refNote}Character: ${villain.heroName} (${villain.realName}), ${villain.gender||"Unknown"} VILLAIN${villain.age?", age "+villain.age:""}${vAgeStage?" ("+vAgeStage+")":""}.\nRole: ${villain.role||"Villain"}. Tagline: "${villain.tagline||""}"\nPowers: ${powerNames}.\nCostume: ${costumeDesc}. Primary color: ${colorName}. Power FX: ${fxDesc}.\nThis is a VILLAIN — all visual descriptors must emphasize menace, darkness, and malevolence. NOT heroic.\nPronouns: ${vPronoun}.${vAgeStage?"\nAge presentation: "+vAgeStage+" — physique, face, and body proportions must visually match this life stage.":""}\n\n${platInstr}\ntripo3D = 1 sentence FDM mesh prompt with separate color regions for this villain.\n\n{"metaAI":"...","tripo3D":"..."}`,null,500);
      setPResult({member:villain,isVillain:true,...p,platform:pPlatform});
    }catch(e){setPResult({error:true,msg:e.message});}
    setPLoading(false);
  };

  const generateGroupPrompt=()=>{
    setPSelected("group");setPLoading(true);setPResult(null);
    const style=ART_STYLES.find(a=>a.id===pStyle)?.text||"";
    const n=activeRoster.length;
    const pos=n===2?["left","right"]:n===3?["left","center","right"]:["far left","center-left","center-right","far right"];
    let metaAI;
    if(pPlatform==="midjourney"){
      const chars=activeRoster.map((m,i)=>{
        const cn=hexToColorName(m.color);const gs=ageStage(m.age);
        return `${m.heroName} [${pos[Math.min(i,pos.length-1)]}]${gs?" "+gs+" frame":""} in ${m.costumeDesc||"superhero suit"} dominant ${cn}, ${m.powerFX||cn+" energy"} actively glowing`;
      }).join(", ");
      metaAI=`${activeTeam.name} group shot, ${chars}, dynamic heroic poses, nighttime city skyline backdrop, rain-slicked rooftop, dramatic rim lighting from power glows, ${style||"photorealistic digital painting, cinematic lighting, comic book illustration style"}, all heroes fully visible --ar 16:9 --v 6.1 --style raw`;
    } else {
      const charLines=activeRoster.map((m,i)=>{
        const cn=hexToColorName(m.color);
        const race=raceLabel(m.race)||m.species||"Human";
        const notes=m.consistencyNotes?` ${m.consistencyNotes}`:"";
        const gs=ageStage(m.age);
        return `• ${m.heroName} [${pos[Math.min(i,pos.length-1)]}]: ${m.gender||"hero"}, ${race}${gs?", "+gs:""}. Costume: ${m.costumeDesc||"superhero suit"}. Accent color: ${cn}. Power FX: ${m.powerFX||cn+" energy"}.${notes}`;
      }).join("\n");
      metaAI=`Referencing the uploaded character sheet strictly — do not redesign any character. Every face, costume, and color must match the reference images exactly.\n\n${charLines}\n\nAll ${n} members of ${activeTeam.name} in a wide cinematic group shot — dynamic heroic poses, ${style?style+", ":""}photorealistic, dramatic cinematic lighting, nighttime city backdrop, full bodies visible.\n\nDO NOT alter any character's face, costume, colors, or power effects. Match the reference sheet exactly.`;
    }
    setPResult({group:true,teamName:activeTeam.name,metaAI,platform:pPlatform});
    setPLoading(false);
  };

  const generateDuoPrompt=()=>{
    const a=activeRoster.find(m=>m.id===duoA),b=activeRoster.find(m=>m.id===duoB);
    if(!a||!b)return;
    setPSelected("duo");setPLoading(true);setPResult(null);
    const style=ART_STYLES.find(x=>x.id===pStyle)?.text||"";
    let metaAI;
    if(pPlatform==="midjourney"){
      const descMJ=m=>{const cn=hexToColorName(m.color);const ds=ageStage(m.age);return `${m.heroName}${ds?" "+ds+" frame":""} in ${m.costumeDesc||"superhero suit"} dominant ${cn}, ${m.powerFX||cn+" energy"} actively glowing`;};
      metaAI=`${a.heroName} and ${b.heroName} duo shot, [LEFT] ${descMJ(a)}, [RIGHT] ${descMJ(b)}, both facing slightly inward, dynamic duo heroic stance, nighttime city backdrop, dramatic rim lighting, ${style||"photorealistic digital painting, cinematic lighting, comic book illustration style"}, both fully visible --ar 2:3 --v 6.1 --style raw`;
    } else {
      const desc=m=>{
        const cn=hexToColorName(m.color);
        const race=raceLabel(m.race)||m.species||"Human";
        const notes=m.consistencyNotes?` ${m.consistencyNotes}`:"";
        const ds=ageStage(m.age);
        return `${m.heroName}: ${m.gender||"hero"}, ${race}${ds?", "+ds:""}. Costume: ${m.costumeDesc||"superhero suit"}. Accent color: ${cn}. Power FX: ${m.powerFX||cn+" energy"}.${notes}`;
      };
      metaAI=`Referencing the uploaded character sheet strictly — do not redesign either character. Every face, costume, and color must match the reference images exactly.\n\n[LEFT] ${desc(a)}\n\n[RIGHT] ${desc(b)}\n\n${a.heroName} and ${b.heroName} from ${activeTeam.name} — dynamic duo pose, both heroes facing slightly inward, ${style?style+", ":""}photorealistic, dramatic cinematic lighting, nighttime city backdrop, both fully visible, portrait or square format.\n\nDO NOT alter either character's face, costume, colors, or power effects. Match the reference sheet exactly.`;
    }
    setPResult({duo:true,heroA:a,heroB:b,metaAI,platform:pPlatform});
    setPLoading(false);
  };

  const downloadTeamSheet=async(members)=>{
    const roster=members||activeRoster;
    if(!roster.length)return;
    setSheetLoading(true);
    try{
      const COLS=Math.min(roster.length,2);
      const CARD_W=400,IMG_H=520,INFO_H=120,CARD_H=IMG_H+INFO_H;
      const HEADER_H=60,GAP=16,SIDE=20;
      const ROWS=Math.ceil(roster.length/COLS);
      const W=SIDE*2+COLS*CARD_W+(COLS-1)*GAP;
      const H=HEADER_H+8+ROWS*(CARD_H+GAP)+14;
      const canvas=document.createElement("canvas");
      canvas.width=W;canvas.height=H;
      const ctx=canvas.getContext("2d");
      ctx.fillStyle="#07070F";ctx.fillRect(0,0,W,H);
      ctx.fillStyle=activeTeam.color+"28";ctx.fillRect(0,0,W,HEADER_H);
      ctx.fillStyle=activeTeam.color;ctx.fillRect(0,HEADER_H-2,W,2);
      ctx.fillStyle="#FFFFFF";ctx.font="bold 22px monospace";ctx.textAlign="left";
      ctx.fillText(activeTeam.name.toUpperCase(),SIDE,40);
      ctx.fillStyle="rgba(255,255,255,0.45)";ctx.font="10px monospace";ctx.textAlign="right";
      ctx.fillText("CHARACTER REFERENCE — UPLOAD WITH PROMPT",W-SIDE,40);
      const loadImg=src=>new Promise(res=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>res(null);i.src=src;});
      for(let i=0;i<roster.length;i++){
        const m=roster[i];
        const col=i%COLS,row=Math.floor(i/COLS);
        const cx=SIDE+col*(CARD_W+GAP);
        const cy=HEADER_H+8+row*(CARD_H+GAP);
        // Card background
        ctx.fillStyle="#0D0D1C";ctx.fillRect(cx,cy,CARD_W,CARD_H);
        // Portrait image — cover crop filling the top portion
        const imgSrc=images[m.id];
        if(imgSrc){
          const img=await loadImg(imgSrc);
          if(img){
            ctx.save();
            ctx.beginPath();ctx.rect(cx,cy,CARD_W,IMG_H);ctx.clip();
            // CSS object-fit: cover — scale to fill, center (top-biased for faces)
            const iAspect=img.width/img.height,cAspect=CARD_W/IMG_H;
            let dw,dh,dx,dy;
            if(iAspect>cAspect){dh=IMG_H;dw=dh*iAspect;dx=cx+(CARD_W-dw)/2;dy=cy;}
            else{dw=CARD_W;dh=dw/iAspect;dx=cx;dy=cy;}  // top-aligned: shows head/face first
            ctx.drawImage(img,dx,dy,dw,dh);
            ctx.restore();
            // NO overlays — keep image fully clean for AI reference
          }
        } else {
          ctx.fillStyle=m.color+"18";ctx.fillRect(cx,cy,CARD_W,IMG_H);
          ctx.fillStyle=m.color+"55";ctx.font="bold 80px monospace";ctx.textAlign="center";
          ctx.fillText(m.initials||"??",cx+CARD_W/2,cy+IMG_H/2+28);
        }
        // Accent bar — left edge only, does not overlap image content
        ctx.fillStyle=m.color;ctx.fillRect(cx,cy,4,CARD_H);
        // Card border
        ctx.strokeStyle=m.color+"66";ctx.lineWidth=1;ctx.strokeRect(cx+0.5,cy+0.5,CARD_W-1,CARD_H-1);
        // Info panel — fully below image, dark background
        const ip=cy+IMG_H;
        ctx.fillStyle="#0A0A18";ctx.fillRect(cx+4,ip,CARD_W-4,INFO_H);
        ctx.textAlign="left";
        // Hero name
        ctx.fillStyle="#FFFFFF";ctx.font="bold 17px monospace";
        ctx.fillText(m.heroName||"Unknown",cx+14,ip+24);
        // Real name in accent color
        ctx.fillStyle=m.color;ctx.font="11px monospace";
        ctx.fillText(m.realName||"",cx+14,ip+40);
        // Powers / Arsenal / Skills — list up to 2 names
        ctx.fillStyle="rgba(255,255,255,0.55)";ctx.font="9.5px monospace";
        const pNames=(m.powers||[]).slice(0,2).map(p=>p.name).filter(Boolean);
        if(pNames[0])ctx.fillText(pNames[0].slice(0,42),cx+14,ip+58);
        if(pNames[1])ctx.fillText(pNames[1].slice(0,42),cx+14,ip+72);
        // Color swatch (no hex label)
        ctx.fillStyle=m.color;ctx.fillRect(cx+14,ip+82,18,11);
        ctx.strokeStyle="rgba(255,255,255,0.15)";ctx.lineWidth=0.5;ctx.strokeRect(cx+14,ip+82,18,11);
        // Power FX
        ctx.fillStyle="rgba(255,255,255,0.35)";ctx.font="8.5px monospace";
        const fx=(m.powerFX||(pNames[0]||"Energy")+" active").slice(0,58);
        ctx.fillText("FX: "+fx,cx+14,ip+110);
      }
      await new Promise(res=>canvas.toBlob(blob=>{if(!blob){res();return;}const u=URL.createObjectURL(blob);const a=document.createElement("a");a.href=u;a.download=`${activeTeam.name.toLowerCase().replace(/\s+/g,"-")}-reference.png`;document.body.appendChild(a);a.click();document.body.removeChild(a);setTimeout(()=>URL.revokeObjectURL(u),1000);res();},"image/png"));
    }catch(e){console.error("Sheet failed:",e);}
    setSheetLoading(false);
  };

  const generateBattle=async()=>{
    if(!battleA||!battleB)return;
    setBattleLoading(true);setBattleResult(null);
    try{
      const ci=m=>`${m.heroName}: Powers: ${(m.powers||[]).map(p=>p.name).join(", ")||"Unknown"}. Stats: ${JSON.stringify(m.stats||{})}. DNA: ${(m.dna||[]).join("+")}. Origin: ${(m.origin||"").slice(0,100)}`;
      const r=await callAI(`Simulate a superhero fight. JSON only.\n\nFighter A: ${ci(battleA)}\nFighter B: ${ci(battleB)}\n\n{"winner":"exact hero name","margin":"narrow|decisive|overwhelming","aEdge":["advantage 1","advantage 2"],"bEdge":["advantage 1","advantage 2"],"keyMoment":"one dramatic turning point sentence","narrative":"3-4 cinematic sentences describing the fight","finisher":"one sentence finishing move"}`);
      setBattleResult({...r,a:battleA,b:battleB});
    }catch(e){setBattleResult({error:true});}
    setBattleLoading(false);
  };

  const generateArc=async()=>{
    setArcLoading(true);setArcResult(null);
    try{
      const cast=arcTeams.length?arcTeams.flatMap(tid=>getTeamRoster(tid)):activeRoster;
      const villain=arcVillain||(villainPool[0]?.heroName)||"Unknown Threat";
      const r=await callAI(`Create a superhero story arc. JSON only.\n\nTitle: "${arcTitle||"Untitled Arc"}"\nVillain: ${villain}\nCast: ${cast.map(m=>`${m.heroName} (${m.role||"Hero"})`).join(", ")}\nTone: ${arcTone}\nIssues: ${arcIssues}\n\n{"arcTitle":"string","tagline":"short punchy tagline","villainGoal":"what they want","issues":[{"number":1,"title":"string","summary":"2-3 sentences","spotlightHero":"hero name","villainMove":"what villain does","cliffhanger":"one sentence"}],"resolution":"2 sentences final outcome","teaser":"1 sentence next arc hook"}`);
      setArcResult(r);
    }catch(e){setArcResult({error:true});}
    setArcLoading(false);
  };

  // ── PDF Export ────────────────────────────────────────────────────────────
  const exportPDF=async()=>{
    setPdfLoading(true);
    const b64Images={};
    for(const m of activeRoster){
      const url=images[m.id];
      if(url){try{const res=await fetch(url);const blob=await res.blob();const reader=new FileReader();await new Promise(resolve=>{reader.onload=e=>{b64Images[m.id]=e.target.result;resolve();};reader.readAsDataURL(blob);});}catch(e){}}
    }
    const sharedVillainsFor=id=>villainPool.filter(v=>v.targetTeams?.includes(activeTeamId)).map(v=>v.heroName);
    try{
      const payload={
        members:activeRoster.map(m=>({...m,teamName:activeTeam.name,teamColor:activeTeam.color,nkAlignment:m.nkAlignment||activeTeam.nkAlignment||"base",sharedVillains:sharedVillainsFor(m.id)})),
        images:b64Images,teamName:activeTeam.name,teamColor:activeTeam.color
      };
      const res=await fetch("/api/export-pdf",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      if(!res.ok){const err=await res.json();alert("PDF error: "+(err.error||"Unknown error"));setPdfLoading(false);return;}
      const blob=await res.blob();const url=URL.createObjectURL(blob);
      const a=document.createElement("a");a.href=url;a.download=`${activeTeam.name.toLowerCase().replace(/\s+/g,"-")}-roster.pdf`;
      document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);
    }catch(e){alert("PDF generation failed: "+e.message);}
    setPdfLoading(false);
  };

  // ── Team Power Index ──────────────────────────────────────────────────────
  const getTeamPower=useCallback((teamId)=>{
    const roster=getTeamRoster(teamId);
    if(!roster.length)return{Power:0,Speed:0,Tech:0,Intellect:0,Will:0,overall:0};
    const totals={Power:0,Speed:0,Tech:0,Intellect:0,Will:0};
    roster.forEach(m=>{Object.keys(totals).forEach(k=>{totals[k]+=(m.stats?.[k]||0);});});
    Object.keys(totals).forEach(k=>{totals[k]=Math.round(totals[k]/roster.length);});
    totals.overall=Math.round(Object.values(totals).reduce((a,b)=>a+b,0)/Object.keys(totals).length);
    return totals;
  },[getTeamRoster]);

  // ── Styles ────────────────────────────────────────────────────────────────
  const s={
    tab:a=>({padding:"11px 18px",fontSize:11,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer",border:"none",background:a?"rgba(212,175,55,0.08)":"transparent",color:a?G:"var(--text3)",borderBottom:a?`2px solid ${G}`:"2px solid transparent",fontFamily:"var(--font-mono)",whiteSpace:"nowrap",flexShrink:0,transition:"color 0.15s,background 0.15s"}),
    card:{background:"var(--bg2)",border:"1px solid var(--border)",borderRadius:14,padding:"20px 24px",boxShadow:"0 2px 16px rgba(0,0,0,0.22)"},
    lbl:{fontSize:11,letterSpacing:"0.18em",color:"rgba(212,175,55,0.65)",textTransform:"uppercase",marginBottom:10,display:"block",fontFamily:"var(--font-mono)"},
    chip:(a,c=G)=>({padding:"7px 15px",background:a?`${c}1A`:"var(--bg3)",border:`1px solid ${a?c+"88":"var(--border2)"}`,borderRadius:20,cursor:"pointer",fontSize:11,color:a?c:"var(--text3)",fontFamily:"var(--font-mono)",fontWeight:a?"600":"normal",transition:"all 0.12s"}),
    pBox:{background:"var(--prompt-bg)",border:"1px solid var(--border2)",borderRadius:10,padding:"16px 18px",fontFamily:"var(--font-mono)",fontSize:12,color:"var(--text2)",lineHeight:1.8,whiteSpace:"pre-wrap",wordBreak:"break-word"},
    cpyBtn:d=>({padding:"6px 14px",background:d?`${G}22`:"var(--bg3)",border:`1px solid ${d?G:"var(--border)"}`,borderRadius:8,cursor:"pointer",fontSize:11,color:d?G:"var(--text3)",fontFamily:"var(--font-mono)"}),
    bigBtn:(d,c=G)=>({width:"100%",padding:"14px",background:d?"var(--bg3)":`${c}16`,border:`1px solid ${d?"var(--border2)":c}`,borderRadius:10,cursor:d?"not-allowed":"pointer",color:d?"var(--text4)":c,fontSize:12,letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"var(--font-mono)",marginTop:6,fontWeight:"600"}),
    optBtn:(a,c=G)=>({width:"100%",padding:"13px 18px",background:a?`${c}1A`:"var(--bg3)",border:`1px solid ${a?c+"88":"var(--border2)"}`,borderRadius:10,cursor:"pointer",color:a?"var(--text)":"var(--text2)",fontFamily:"var(--font-mono)",fontSize:12.5,textAlign:"left",marginBottom:8,transition:"all 0.12s"}),
  };

  const rHex=rColors[0]||G;
  const rCurrentQ=RECRUIT_QUIZ[rStep-1];
  const vCurrentQ=VILLAIN_QUIZ[vStep-1];

  const coreMembers=activeTeam?activeRoster.slice(0,8):[];
  const N=coreMembers.length,cx=200,cy=155,r=105;
  const positions=coreMembers.map((_,i)=>{const angle=(2*Math.PI*i/N)-Math.PI/2;return{x:cx+r*Math.cos(angle),y:cy+r*Math.sin(angle)};});

  return(<div style={{background:"var(--bg-base)",color:"var(--text-primary)",minHeight:"100vh",paddingBottom:60}}>

    {/* ── Header ─────────────────────────────────────────────────────────── */}
    <div className="fhdr" style={{borderBottom:"1px solid rgba(212,175,55,0.14)",padding:"0 22px",height:56,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8,background:"var(--header-bg)",backdropFilter:"blur(12px)",position:"sticky",top:0,zIndex:50}}>
      <div style={{display:"flex",alignItems:"center",gap:14}}>

        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:34,height:34,borderRadius:9,background:`linear-gradient(135deg,${G}22,${G}0A)`,border:`1px solid ${G}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0,boxShadow:`0 0 18px ${G}1A`}}>⚒</div>
          <div>
            <div style={{fontSize:8.5,letterSpacing:"0.3em",color:`${G}70`,textTransform:"uppercase",fontFamily:"var(--font-mono)",marginBottom:1}}>Nocturnal Inc</div>
            <div style={{display:"flex",alignItems:"baseline",gap:7}}>
              <div style={{fontSize:17,fontWeight:"800",letterSpacing:"0.04em",color:"var(--text-primary)",fontFamily:"var(--font-mono)",lineHeight:1}}>SUPERHERO FORGE</div>
              {forgeVersion&&<div style={{fontSize:8,color:"var(--text4)",letterSpacing:"0.12em",fontFamily:"var(--font-mono)"}}>{`v${forgeVersion}`}</div>}
            </div>
          </div>
        </div>

        <div style={{width:1,height:30,background:"var(--border)",flexShrink:0}}/>

        {/* Active team indicator */}
        {activeTeam&&<div onClick={()=>setTab("teams")} style={{display:"flex",alignItems:"center",gap:7,padding:"5px 12px",background:`${activeTeam.color}10`,border:`1px solid ${activeTeam.color}33`,borderRadius:20,cursor:"pointer"}}>
          <div style={{width:8,height:8,borderRadius:2,background:activeTeam.color,flexShrink:0,boxShadow:`0 0 6px ${activeTeam.color}88`}}/>
          <span style={{fontSize:10,color:activeTeam.color,fontFamily:"var(--font-mono)",letterSpacing:"0.07em",fontWeight:"600"}}>{activeTeam.abbr} · {activeTeam.name}</span>
        </div>}
      </div>
      <div className="fhdr-right" style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
        {saved&&<div style={{fontSize:9,color:"#5DCAA5",padding:"3px 10px",background:"rgba(15,110,86,0.12)",border:"1px solid rgba(15,110,86,0.3)",borderRadius:20}}>✓ Saved</div>}
        {updateInfo?.has_update&&<div style={{display:"flex",alignItems:"center",gap:6,padding:"4px 11px",background:"rgba(212,175,55,0.12)",border:"1px solid rgba(212,175,55,0.4)",borderRadius:20,cursor:"pointer"}} onClick={async()=>{if(updatePulling)return;setUpdatePulling(true);const r=await fetch("/api/update/pull",{method:"POST"});const d=await r.json();setUpdatePulling(false);if(d.ok){setUpdateInfo(null);setAppAlert({type:"restart",msg:"Update applied — restart to load the new version."});}else{setAppAlert({type:"error",msg:"Update failed: "+(d.output||"Unknown error")});}}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:G}}/>
          <span style={{fontSize:9,color:G,fontFamily:"var(--font-mono)"}}>{updatePulling?"Updating...":"Update available — click to pull"}</span>
        </div>}
        {remoteInfo&&(()=>{
          const live=remoteInfo.enabled&&remoteInfo.url;
          const partial=remoteInfo.enabled&&!remoteInfo.url;
          const sc=live?"#5DCAA5":partial?"#D4AF37":"#888780";
          const bg=live?"rgba(93,202,165,0.08)":partial?"rgba(212,175,55,0.08)":"rgba(136,135,128,0.05)";
          const bd=live?"rgba(93,202,165,0.3)":partial?"rgba(212,175,55,0.3)":"rgba(136,135,128,0.18)";
          return(
            <div style={{display:"flex",alignItems:"center",gap:5,padding:"4px 11px",background:bg,border:`1px solid ${bd}`,borderRadius:20,cursor:"pointer"}}
              onClick={()=>live?navigator.clipboard.writeText(remoteInfo.url):setShowRemotePanel(p=>!p)}>
              <div style={{width:6,height:6,borderRadius:"50%",background:sc,boxShadow:live?`0 0 5px ${sc}`:undefined}}/>
              <span style={{fontSize:9,color:sc,fontFamily:"var(--font-mono)",whiteSpace:"nowrap"}}>{live?"Remote: Live":partial?"Remote: Restart":"Remote: Off"}</span>
              {live&&<span style={{fontSize:8,color:`${sc}99`,fontFamily:"var(--font-mono)",maxWidth:130,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>· {remoteInfo.url}</span>}
            </div>
          );
        })()}
        <button onClick={()=>setShowRemotePanel(p=>!p)} title="Remote Access & Settings" style={{padding:"5px 10px",background:showRemotePanel?"rgba(94,177,255,0.12)":"var(--bg3)",border:`1px solid ${showRemotePanel?"rgba(94,177,255,0.4)":"var(--border)"}`,borderRadius:7,cursor:"pointer",color:showRemotePanel?"#5EB1FF":"var(--text2)",fontSize:11}}>⚙</button>
        <div style={{display:"flex",alignItems:"center",gap:6,padding:"5px 12px",background:"var(--bg3)",border:`1px solid ${groqOk?"rgba(94,177,255,0.3)":ollamaOk?"rgba(15,110,86,0.3)":ollamaOk===false?"rgba(139,26,26,0.4)":"var(--border)"}`,borderRadius:20}}>
          <div style={{width:7,height:7,borderRadius:"50%",background:groqOk?"#5EB1FF":ollamaOk?"#5DCAA5":ollamaOk===false?"#E07070":"#888780"}}/>
          <span style={{fontSize:9,color:"var(--text2)"}}>{ollamaOk===null?"Checking...":groqOk?"Groq · "+currentModel:ollamaOk?currentModel:"Offline"}</span>
        </div>
        {ollamaOk&&models.length>0&&<select className="fhdr-model" value={currentModel} onChange={e=>{setCurrentModel(e.target.value);fetch("/api/config",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:e.target.value})});}} style={{background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:7,padding:"5px 10px",color:"var(--text-primary)",fontSize:10,cursor:"pointer"}}>{models.map(m=><option key={m} value={m}>{m}</option>)}</select>}
        <button className="fhdr-refresh" onClick={checkOllama} style={{padding:"5px 10px",background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:7,cursor:"pointer",color:"var(--text2)",fontSize:9,fontFamily:"var(--font-mono)"}}>↻</button>
        <button className="fhdr-restart" onClick={()=>{fetch("/api/restart",{method:"POST"}).then(()=>{setTimeout(()=>window.location.reload(),1800);});}} title="Restart Forge" style={{padding:"5px 10px",background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:7,cursor:"pointer",color:"var(--text2)",fontSize:9,fontFamily:"var(--font-mono)"}}>⟳ Restart</button>
        <button onClick={()=>setLightMode(p=>!p)} title={lightMode?"Switch to Dark Mode":"Switch to Light Mode"} style={{padding:"5px 11px",background:lightMode?"rgba(0,0,0,0.08)":"var(--bg2)",border:`1px solid ${lightMode?"rgba(0,0,0,0.15)":"var(--border)"}`,borderRadius:7,cursor:"pointer",fontSize:13,lineHeight:1,transition:"all 0.2s"}}>{lightMode?"🌙":"☀️"}</button>
      </div>
    </div>

    {/* ── Remote / Settings Panel ────────────────────────────────────── */}
    {showRemotePanel&&<RemotePanel remoteInfo={remoteInfo} setRemoteInfo={setRemoteInfo} onClose={()=>setShowRemotePanel(false)} G={G} s={s} forgeVersion={forgeVersion} setAppAlert={setAppAlert}/>}

    {/* ── App Alert Banner ───────────────────────────────────────────── */}
    {appAlert&&(()=>{
      const isRestart=appAlert.type==="restart";
      const isReload=appAlert.type==="reload";
      const isError=appAlert.type==="error";
      const bc=isRestart?"#D4AF37":isReload?"#5EB1FF":"#E07070";
      return(
        <div style={{display:"flex",alignItems:"center",gap:12,padding:"9px 22px",background:`${bc}0F`,borderBottom:`1px solid ${bc}35`,fontSize:10,color:bc,fontFamily:"var(--font-mono)",letterSpacing:"0.04em"}}>
          <span style={{flexShrink:0}}>{isRestart?"⚠":isReload?"↻":"✗"}</span>
          <span style={{flex:1}}>{appAlert.msg}</span>
          {isRestart&&<button onClick={()=>{fetch("/api/restart",{method:"POST"}).then(()=>{setTimeout(()=>window.location.reload(),1800);});setAppAlert(null);}} style={{padding:"4px 14px",background:`${bc}18`,border:`1px solid ${bc}55`,borderRadius:6,cursor:"pointer",color:bc,fontSize:9,fontFamily:"var(--font-mono)",letterSpacing:"0.1em"}}>RESTART NOW</button>}
          {isReload&&<button onClick={()=>{window.location.reload();}} style={{padding:"4px 14px",background:`${bc}18`,border:`1px solid ${bc}55`,borderRadius:6,cursor:"pointer",color:bc,fontSize:9,fontFamily:"var(--font-mono)",letterSpacing:"0.1em"}}>RELOAD</button>}
          <button onClick={()=>setAppAlert(null)} style={{padding:"3px 8px",background:"transparent",border:"none",cursor:"pointer",color:`${bc}99`,fontSize:13,lineHeight:1,fontFamily:"var(--font-mono)"}}>×</button>
        </div>
      );
    })()}

    {/* ── PIN Delete Modal ────────────────────────────────────────────── */}
    {pinDialog&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setPinDialog(null)}>
      <div style={{background:"#0D0D1A",border:"1px solid rgba(163,45,45,0.45)",borderRadius:14,padding:"28px 32px",width:320,boxShadow:"0 8px 40px rgba(0,0,0,0.7)"}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:11,fontWeight:"bold",color:"#e74c3c",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:6}}>Confirm Deletion</div>
        <div style={{fontSize:12,color:"var(--text2)",marginBottom:20,lineHeight:1.5}}>{pinDialog.label}</div>
        <input autoFocus type="password" placeholder="Enter PIN" value={pinInput} onChange={e=>{setPinInput(e.target.value);setPinError(false);}} onKeyDown={e=>e.key==="Enter"&&confirmPin()} style={{width:"100%",padding:"10px 14px",background:"rgba(255,255,255,0.05)",border:`1px solid ${pinError?"rgba(231,76,60,0.7)":"rgba(255,255,255,0.12)"}`,borderRadius:8,color:"#F0EAD6",fontSize:14,fontFamily:"var(--font-mono)",letterSpacing:"0.15em",outline:"none",marginBottom:pinError?6:16}}/>
        {pinError&&<div style={{fontSize:10,color:"#e74c3c",marginBottom:12,fontFamily:"var(--font-mono)"}}>Incorrect PIN</div>}
        <div style={{display:"flex",gap:10}}>
          <button onClick={()=>setPinDialog(null)} style={{flex:1,padding:"9px",background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text2)",fontSize:11,fontFamily:"var(--font-mono)",cursor:"pointer"}}>Cancel</button>
          <button onClick={confirmPin} style={{flex:1,padding:"9px",background:"rgba(163,45,45,0.15)",border:"1px solid rgba(163,45,45,0.4)",borderRadius:8,color:"#e74c3c",fontSize:11,fontFamily:"var(--font-mono)",cursor:"pointer",fontWeight:"bold"}}>Delete</button>
        </div>
      </div>
    </div>}

    {/* ── Tabs ───────────────────────────────────────────────────────────── */}
    <div className="ftabs" style={{display:"flex",borderBottom:"1px solid rgba(212,175,55,0.12)",padding:"0 16px",overflowX:"auto",background:"var(--bg-base)",gap:2}}>
      {[["teams","Teams"],["roster","Roster"],["team","Team"],["family","Family"],["prompts","Prompts"],["recruit","+ Recruit"],["villains","Villains"],["story","Story"],["battle","⚡ Battle"],["arc","Arc"],["tiers","Tiers"],["universe","Universe"],["codex","Codex"]].map(([id,label])=>{
        const freeTab=id==="teams"||id==="codex";
        return(<button key={id} className="ftab" style={s.tab(tab===id)} onClick={()=>{if(!activeTeam&&!freeTab)return;setTab(id);}} disabled={!activeTeam&&!freeTab}>{label}</button>);
      })}
    </div>

    <div className="fmain" style={{padding:"28px 26px",maxWidth:960,margin:"0 auto"}}>
      {ollamaOk===false&&<OllamaGuide/>}
      {!activeTeam&&tab!=="teams"&&tab!=="codex"&&(<div style={{textAlign:"center",padding:"60px 20px"}}><div style={{fontSize:13,color:"var(--text3)",marginBottom:16}}>No team selected.</div><button onClick={()=>setTab("teams")} style={{padding:"9px 22px",background:`${G}14`,border:`1px solid ${G}`,borderRadius:8,cursor:"pointer",color:G,fontSize:11,fontFamily:"var(--font-mono)"}}>Go to Teams</button></div>)}

      {/* ── TEAMS TAB ─────────────────────────────────────────────────── */}
      {tab==="teams"&&(<>
        {showTeamCreator||editingTeamData?(
          <TeamCreator
            teams={teams}
            members={Object.values(teamRosters).flat().filter((m,i,a)=>a.findIndex(x=>x.id===m.id)===i)}
            onSave={saveTeam}
            onCancel={()=>{setShowTeamCreator(false);setEditingTeamData(null);}}
            callAI={callAI}
            ollamaOk={ollamaOk||groqOk}
            initialData={editingTeamData}
          />
        ):(
          <>
            {teams.length===0&&!showTeamCreator&&(
              <div style={{textAlign:"center",padding:"60px 20px"}}>
                <div style={{fontSize:36,marginBottom:16}}>⚒</div>
                <div style={{fontSize:20,fontWeight:"bold",color:"var(--text-primary)",marginBottom:8,fontFamily:"var(--font-mono)"}}>Build Your Universe</div>
                <div style={{fontSize:13,color:"var(--text2)",marginBottom:28,lineHeight:1.7,maxWidth:400,margin:"0 auto 28px"}}>Create your first team to get started. Add members, generate lore, build out your hero universe.</div>
                <button onClick={()=>setShowTeamCreator(true)} style={{padding:"13px 32px",background:`${G}16`,border:`1px solid ${G}`,borderRadius:10,cursor:"pointer",color:G,fontSize:12,letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"var(--font-mono)"}}>+ Create First Team</button>
              </div>
            )}
            {teams.length>0&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div><div style={{fontSize:9,letterSpacing:"0.2em",color:`${G}77`,textTransform:"uppercase",marginBottom:4}}>All Teams</div><div style={{fontSize:13,color:"var(--text2)"}}>Click a team to set it active — all tabs will reflect that team.</div></div>
              <button onClick={()=>setShowTeamCreator(true)} style={{padding:"9px 18px",background:`${G}14`,border:`1px solid ${G}`,borderRadius:8,cursor:"pointer",color:G,fontSize:10.5,letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"var(--font-mono)",whiteSpace:"nowrap"}}>+ New Team</button>
            </div>}

            {/* Team grid */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12,marginBottom:32}}>
              {teams.map(t=>(
                <TeamCard
                  key={t.id} team={t} isActive={t.id===activeTeamId}
                  memberCount={getTeamMemberCount(t.id)}
                  onSelect={()=>{setActiveTeamId(t.id);setTab("roster");}}
                  onEdit={()=>setEditingTeamData(t)}
                  onDelete={()=>requirePin(`Delete team "${t.name}"`,()=>deleteTeam(t.id))}
                  imageUrl={images['teamlogo-'+t.id]}
                />
              ))}
            </div>

            {/* Team Power Index */}
            {teams.length>0&&(<>
              <div style={{fontSize:9,letterSpacing:"0.2em",color:`${G}77`,textTransform:"uppercase",marginBottom:14}}>Team Power Index</div>
              <div style={{...s.card,marginBottom:28}}>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:16}}>
                  {teams.filter(t=>getTeamMemberCount(t.id)>0).map(t=>{
                    const pw=getTeamPower(t.id);
                    return(<div key={t.id}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                        <TeamLogo team={t} size={24} imageUrl={images['teamlogo-'+t.id]}/>
                        <span style={{fontSize:11,fontWeight:"bold",color:"var(--text-primary)"}}>{t.name}</span>
                      </div>
                      <div style={{marginBottom:6}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                          <span style={{fontSize:9,color:"var(--text2)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Overall</span>
                          <span style={{fontSize:9,color:t.color,fontWeight:"bold"}}>{pw.overall}</span>
                        </div>
                        <div style={{height:4,background:"rgba(255,255,255,0.06)",borderRadius:2}}><div style={{height:4,width:`${pw.overall}%`,background:t.color,borderRadius:2}}/></div>
                      </div>
                      {["Power","Speed","Tech","Intellect","Will"].map(k=><StatBar key={k} label={k} value={pw[k]} color={t.color+"99"}/>)}
                    </div>);
                  })}
                </div>
              </div>

            {/* Team Alliance Map */}
              {teams.length>1&&(<>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                  <div style={{fontSize:9,letterSpacing:"0.2em",color:`${G}77`,textTransform:"uppercase"}}>Alliance Map</div>
                  <div style={{fontSize:8,color:"var(--text4)",fontStyle:"italic"}}>click node to upload logo</div>
                </div>
                <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid var(--border2)",borderRadius:12,overflow:"hidden",padding:"10px 0 14px",marginBottom:24}}>
                  {teams.map(t=>(<input key={t.id} type="file" accept="image/*" style={{display:"none"}} ref={el=>teamLogoRefs.current[t.id]=el} onChange={e=>handleImg('teamlogo-'+t.id,e.target.files[0])}/>))}
                  <svg viewBox={`0 0 ${Math.max(400,teams.length*80)} 400`} style={{width:"100%",display:"block"}}>
                    {(()=>{
                      const n=teams.length;
                      const cxm=Math.max(400,n*80)/2,cym=185,rm=Math.min(110,cxm-60);
                      const pts=teams.map((_,i)=>{const a=(2*Math.PI*i/n)-Math.PI/2;return{x:cxm+rm*Math.cos(a),y:cym+rm*Math.sin(a)};});
                      const lines=[];
                      teams.forEach((t,i)=>{
                        if(t.isDefault)return;
                        const nkIdx=teams.findIndex(x=>x.isDefault);
                        if(nkIdx<0)return;
                        const am=ALIGN_META[t.nkAlignment]||ALIGN_META.neutral;
                        lines.push(<line key={`l${i}`} x1={pts[i].x} y1={pts[i].y} x2={pts[nkIdx].x} y2={pts[nkIdx].y} stroke={am.color} strokeWidth={1.5} strokeOpacity={0.5} strokeDasharray={t.nkAlignment==="enemy"?"4,2":""}/>);
                      });
                      const wrap=(name,max=13)=>{const wds=name.split(' ');const ls=[];let cur='';wds.forEach(w=>{if(cur&&(cur+' '+w).length>max){ls.push(cur);cur=w;}else{cur=cur?cur+' '+w:w;}});if(cur)ls.push(cur);return ls;};
                      const getShapes=(c,sw)=>[
                        <g key="s"><polygon points="16,3 26,8 26,18 16,28 6,18 6,8" fill={`${c}30`} stroke={c} strokeWidth={sw}/><polygon points="16,9 21,12 21,18 16,23 11,18 11,12" fill={c} opacity="0.5"/></g>,
                        <g key="s"><polygon points="16,3 26.5,9 26.5,23 16,29 5.5,23 5.5,9" fill="none" stroke={c} strokeWidth={sw}/><polygon points="16,8 21.5,11.25 21.5,20.75 16,24 10.5,20.75 10.5,11.25" fill={c} opacity="0.4"/></g>,
                        <g key="s"><polygon points="20,2 8,18 15,18 12,30 24,14 17,14" fill={c} opacity="0.9"/></g>,
                        <g key="s"><rect x="9" y="9" width="14" height="14" transform="rotate(45,16,16)" fill={`${c}25`} stroke={c} strokeWidth={sw}/><line x1="16" y1="2" x2="16" y2="11" stroke={c} strokeWidth={sw*0.8} opacity="0.5"/><line x1="16" y1="21" x2="16" y2="30" stroke={c} strokeWidth={sw*0.8} opacity="0.5"/><line x1="2" y1="16" x2="11" y2="16" stroke={c} strokeWidth={sw*0.8} opacity="0.5"/><line x1="21" y1="16" x2="30" y2="16" stroke={c} strokeWidth={sw*0.8} opacity="0.5"/><circle cx="16" cy="16" r="3.5" fill={c}/></g>,
                        <g key="s"><path d="M16 2 L18.5 13.5 L30 16 L18.5 18.5 L16 30 L13.5 18.5 L2 16 L13.5 13.5 Z" fill={c} opacity="0.85"/></g>,
                        <g key="s"><polyline points="5,22 16,8 27,22" fill="none" stroke={c} strokeWidth={sw*1.7} strokeLinejoin="round" strokeLinecap="round"/><polyline points="7,27 16,14 25,27" fill="none" stroke={c} strokeWidth={sw*1.3} strokeLinejoin="round" strokeLinecap="round" opacity="0.42"/></g>,
                        <g key="s"><circle cx="16" cy="16" r="3.5" fill={c}/><ellipse cx="16" cy="16" rx="13" ry="5.5" fill="none" stroke={c} strokeWidth={sw*0.9} opacity="0.65"/><ellipse cx="16" cy="16" rx="13" ry="5.5" fill="none" stroke={c} strokeWidth={sw*0.9} opacity="0.65" transform="rotate(60,16,16)"/><ellipse cx="16" cy="16" rx="13" ry="5.5" fill="none" stroke={c} strokeWidth={sw*0.9} opacity="0.65" transform="rotate(120,16,16)"/></g>,
                        <g key="s"><polygon points="16,4 29,27 3,27" fill="none" stroke={c} strokeWidth={sw}/><polygon points="16,11 23.5,25 8.5,25" fill={c} opacity="0.42"/></g>,
                      ];
                      const defs=(<defs key="defs">{teams.map((t,i)=>{const tlImg=images['teamlogo-'+t.id];if(!tlImg)return null;return <clipPath key={t.id} id={`tlc-${t.id}`}><circle cx={pts[i].x} cy={pts[i].y} r={27}/></clipPath>;})}</defs>);
                      const nodes=teams.map((t,i)=>{
                        const tlImg=images['teamlogo-'+t.id];
                        const nameLines=wrap(t.name);
                        const seed=t.logoSeed!=null?t.logoSeed:Math.abs((t.id||'').split('').reduce((a,ch)=>((a<<5)-a)+ch.charCodeAt(0)|0,0));
                        const c=t.color||G;
                        return(
                          <g key={t.id} style={{cursor:"pointer"}} onClick={()=>teamLogoRefs.current[t.id]?.click()}>
                            <circle cx={pts[i].x} cy={pts[i].y} r={30} fill={`${c}20`} stroke={c} strokeWidth={t.id===activeTeamId?2.5:1.5}/>
                            {tlImg
                              ?<image href={tlImg} x={pts[i].x-27} y={pts[i].y-27} width={54} height={54} clipPath={`url(#tlc-${t.id})`} preserveAspectRatio="xMidYMid slice"/>
                              :<g transform={`translate(${pts[i].x},${pts[i].y}) scale(1.7) translate(-16,-16)`}>{getShapes(c,1.1)[seed%8]}</g>
                            }
                            {nameLines.map((line,li)=>(<text key={li} x={pts[i].x} y={pts[i].y+44+(li*11)} textAnchor="middle" fontSize="8" fill="var(--text-primary)" fontFamily="var(--font-mono)">{line}</text>))}
                          </g>
                        );
                      });
                      return[defs,...lines,...nodes];
                    })()}
                  </svg>
                  <div style={{textAlign:"center",fontSize:9,color:"var(--text4)",paddingBottom:8,letterSpacing:"0.08em"}}>
                    {[{c:"#0F6E56",l:"Allied"},{c:"#BA7517",l:"Rival"},{c:"#8B1A1A",l:"Enemy"},{c:"#888780",l:"Neutral"},{c:"#993C1D",l:"Splinter"}].map(({c,l})=>
                      <span key={l} style={{marginRight:14,color:c}}>■ {l}</span>
                    )}
                  </div>
                </div>
              </>)}
            </>)}

            {/* ── Independent Heroes — always visible in Teams tab ── */}
            <div style={{marginBottom:24}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <div>
                  <div style={{fontSize:9,letterSpacing:"0.2em",color:"rgba(136,135,128,0.7)",textTransform:"uppercase",marginBottom:4}}>Independent Heroes</div>
                  <div style={{fontSize:12,color:"var(--text3)"}}>Solo operatives — no team, personal rogues gallery.</div>
                </div>
                <button onClick={()=>{resetSoloCreator();setShowSoloCreator(true);}} style={{padding:"8px 16px",background:"rgba(136,135,128,0.08)",border:"1px solid rgba(136,135,128,0.3)",borderRadius:8,cursor:"pointer",color:"var(--text2)",fontSize:10.5,letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"var(--font-mono)",whiteSpace:"nowrap"}}>+ Solo Hero</button>
              </div>
              {soloHeroes.length===0&&<div style={{padding:"16px 0 4px",color:"var(--text4)",fontSize:11,fontStyle:"italic"}}>No independents yet — Spider-Man operates alone for a reason.</div>}
              {soloHeroes.length>0&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(230px,1fr))",gap:10}}>
                {soloHeroes.map(hero=>{
                  const rogueCount=(soloVillains[hero.id]||[]).length;
                  return(
                    <div key={hero.id} onClick={()=>{setActiveSoloId(hero.id);setSoloHeroView("profile");}} style={{background:`${hero.color}08`,border:`1px solid ${hero.color}30`,borderRadius:12,padding:"14px 16px",cursor:"pointer",transition:"border-color 0.15s,background 0.15s"}}
                      onMouseEnter={e=>{e.currentTarget.style.background=`${hero.color}14`;e.currentTarget.style.borderColor=`${hero.color}55`;}}
                      onMouseLeave={e=>{e.currentTarget.style.background=`${hero.color}08`;e.currentTarget.style.borderColor=`${hero.color}30`;}}>
                      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                        {images[hero.id]
                          ?<img src={images[hero.id]} alt="" style={{width:44,height:44,borderRadius:"50%",objectFit:"cover",objectPosition:"top",border:`2px solid ${hero.color}55`,flexShrink:0}}/>
                          :<div style={{width:44,height:44,borderRadius:"50%",background:`${hero.color}18`,border:`2px solid ${hero.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:"bold",color:hero.color,flexShrink:0}}>{hero.initials||"??"}</div>}
                        <div style={{minWidth:0}}>
                          <div style={{fontSize:13,fontWeight:"bold",color:"var(--text-primary)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{hero.heroName}</div>
                          <div style={{fontSize:9.5,color:"var(--text3)"}}>{hero.realName}</div>
                        </div>
                      </div>
                      <div style={{fontSize:9,color:"var(--text3)",fontStyle:"italic",lineHeight:1.5,marginBottom:8,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{hero.tagline}</div>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                        <span style={{fontSize:8,padding:"2px 9px",background:"rgba(136,135,128,0.12)",border:"1px solid rgba(136,135,128,0.25)",borderRadius:20,color:"var(--text4)",letterSpacing:"0.1em"}}>INDEPENDENT</span>
                        {rogueCount>0&&<span style={{fontSize:8,padding:"2px 9px",background:"rgba(139,26,26,0.12)",border:"1px solid rgba(139,26,26,0.3)",borderRadius:20,color:"#E07070",letterSpacing:"0.08em"}}>{rogueCount} rogue{rogueCount!==1?"s":""}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>}
            </div>

          </>
        )}
      </>)}

      {/* ── ROSTER TAB ────────────────────────────────────────────────── */}
      {tab==="roster"&&activeTeam&&(<>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:28,gap:16}}>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <TeamLogo team={activeTeam} size={56} imageUrl={images['teamlogo-'+activeTeam.id]}/>
            <div>
              <h2 className="forge-h2" style={{color:activeTeam.color}}>{activeTeam.name}</h2>
              <p style={{fontSize:12.5,color:"var(--text2)",lineHeight:1.5,marginTop:5}}>Upload images, expand to view full pages, or Edit to modify any character.</p>
            </div>
          </div>
          <button onClick={exportPDF} disabled={pdfLoading} style={{padding:"9px 18px",background:pdfLoading?"var(--bg3)":`${G}14`,border:`1px solid ${pdfLoading?"var(--border2)":G}`,borderRadius:9,cursor:pdfLoading?"not-allowed":"pointer",color:pdfLoading?"var(--text4)":G,fontSize:11,letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"var(--font-mono)",whiteSpace:"nowrap",flexShrink:0}}>
            {pdfLoading?"Exporting...":"⬇ Export PDF"}
          </button>
        </div>
        {activeRoster.length===0&&(<div style={{textAlign:"center",padding:"40px 20px",color:"var(--text3)"}}>
          <div style={{fontSize:24,marginBottom:10}}>⊕</div>
          <div style={{fontSize:12,marginBottom:6}}>No members yet</div>
          <button onClick={()=>setTab("recruit")} style={{fontSize:11,padding:"7px 16px",background:`${activeTeam.color}14`,border:`1px solid ${activeTeam.color}55`,borderRadius:20,cursor:"pointer",color:activeTeam.color,fontFamily:"var(--font-mono)"}}>+ Add First Member</button>
        </div>)}
        <div className="fimage-grid" style={{display:"grid",gridTemplateColumns:`repeat(${Math.min(activeRoster.length,4)},1fr)`,gap:10,marginBottom:24}}>
          {activeRoster.map(m=>(<div key={m.id}>
            <input type="file" accept="image/*" style={{display:"none"}} ref={el=>fileRefs.current[m.id]=el} onChange={e=>handleImg(m.id,e.target.files[0])}/>
            <div onClick={!images[m.id]?()=>fileRefs.current[m.id]?.click():undefined} style={{background:images[m.id]?"transparent":`${m.color}08`,border:`1.5px dashed ${images[m.id]?m.color+"66":m.color+"2E"}`,borderRadius:9,overflow:"hidden",cursor:images[m.id]?"default":"pointer",aspectRatio:"3/4",position:"relative",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:6}}>
              {images[m.id]?(<><img src={images[m.id]} alt={m.heroName} style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"top",position:"absolute",inset:0}}/><div style={{position:"absolute",inset:0,background:"linear-gradient(transparent 55%,rgba(0,0,0,0.88))"}}/><div style={{position:"absolute",bottom:8,left:8}}><div style={{fontSize:11,fontWeight:"bold",color:"#fff"}}>{m.heroName}</div><div style={{fontSize:8,color:m.colorLight||m.color}}>{m.number}</div></div><div style={{position:"absolute",top:6,right:6,display:"flex",gap:4}}><button onClick={e=>{e.stopPropagation();fileRefs.current[m.id]?.click();}} style={{fontSize:8,padding:"3px 8px",background:"rgba(0,0,0,0.65)",border:`1px solid ${m.color}99`,borderRadius:8,cursor:"pointer",color:"#fff",fontFamily:"var(--font-mono)",backdropFilter:"blur(4px)"}}>↑ Change</button><button onClick={e=>{e.stopPropagation();downloadImg(m.id,m.heroName);}} style={{fontSize:8,padding:"3px 8px",background:"rgba(0,0,0,0.65)",border:`1px solid ${m.color}99`,borderRadius:8,cursor:"pointer",color:"#fff",fontFamily:"var(--font-mono)",backdropFilter:"blur(4px)"}}>↓ Save</button></div></>):(<><div style={{width:34,height:34,borderRadius:"50%",background:`${m.color}14`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:"bold",color:m.color}}>{m.initials}</div><div style={{fontSize:9,color:"var(--text4)",textAlign:"center",lineHeight:1.4}}>{m.heroName}<br/>tap to upload</div></>)}
            </div>
          </div>))}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {activeRoster.map(m=>(<div key={m.id}>
            <div className="froster-row" style={{display:"flex",alignItems:"center",gap:14,padding:"13px 18px",background:expanded[m.id]?`${m.color}0E`:"rgba(255,255,255,0.02)",border:`1px solid ${expanded[m.id]?m.color+"44":"rgba(255,255,255,0.06)"}`,borderRadius:editingChar[m.id]||expanded[m.id]?"12px 12px 0 0":12,cursor:"pointer"}}>
              {images[m.id]?<img src={images[m.id]} alt="" style={{width:44,height:44,borderRadius:8,objectFit:"cover",objectPosition:"top",flexShrink:0}} onClick={()=>toggle(m.id)}/>:<div style={{width:44,height:44,borderRadius:8,background:`${m.color}14`,border:`1px dashed ${m.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:"bold",color:m.color,flexShrink:0}} onClick={()=>toggle(m.id)}>{m.initials}</div>}
              <div style={{flex:1}} onClick={()=>toggle(m.id)}>
                <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                  <span style={{fontSize:13,fontWeight:"bold",color:"var(--text-primary)"}}>{m.heroName}</span>
                  {m.isCustom&&<span style={{fontSize:8,background:`${G}22`,border:`1px solid ${G}44`,color:G,padding:"1px 6px",borderRadius:8}}>NEW</span>}
                  {sharedEdits[m.id]&&<span style={{fontSize:8,background:"rgba(15,110,86,0.15)",border:"1px solid rgba(15,110,86,0.3)",color:"#5DCAA5",padding:"1px 6px",borderRadius:8}}>Edited</span>}
                  {(memberTeamMap[m.id]||[]).filter(t=>t!==activeTeamId).map(tid=>{const ot=teams.find(x=>x.id===tid);return ot?<span key={tid} style={{fontSize:8,background:`${ot.color}18`,border:`1px solid ${ot.color}44`,color:ot.color,padding:"1px 6px",borderRadius:8}}>+{ot.abbr||ot.name.split(" ").map(w=>w[0]).join("").slice(0,3).toUpperCase()}</span>:null;})}
                  {m.nkAlignment&&m.nkAlignment!=="base"&&<AlignmentBadge alignment={m.nkAlignment}/>}
                </div>
                <div style={{fontSize:10,color:"var(--text3)",marginTop:1}}>{m.role}</div>
              </div>
              <div className="froster-actions" style={{display:"flex",gap:7,alignItems:"center"}}>
                <button onClick={e=>{e.stopPropagation();setEditingChar(p=>({...p,[m.id]:!p[m.id]}));setExpanded(p=>({...p,[m.id]:false}));}} style={{fontSize:10.5,padding:"5px 12px",background:editingChar[m.id]?`${m.color}22`:"var(--bg3)",border:`1px solid ${editingChar[m.id]?m.color:"var(--border)"}`,borderRadius:8,cursor:"pointer",color:editingChar[m.id]?m.color:"var(--text3)",fontFamily:"var(--font-mono)"}}>{editingChar[m.id]?"Close":"Edit"}</button>
                <button onClick={e=>{e.stopPropagation();setSwitchingMember(switchingMember===m.id?null:m.id);setSharingMember(null);}} style={{fontSize:10.5,padding:"5px 12px",background:switchingMember===m.id?`${m.color}22`:"var(--bg3)",border:`1px solid ${switchingMember===m.id?m.color:"var(--border)"}`,borderRadius:8,cursor:"pointer",color:switchingMember===m.id?m.color:"var(--text3)",fontFamily:"var(--font-mono)"}}>Move</button>
                <button onClick={e=>{e.stopPropagation();setSharingMember(sharingMember===m.id?null:m.id);setSwitchingMember(null);}} style={{fontSize:10.5,padding:"5px 12px",background:sharingMember===m.id?`${m.color}22`:"var(--bg3)",border:`1px solid ${sharingMember===m.id?m.color:"var(--border)"}`,borderRadius:8,cursor:"pointer",color:sharingMember===m.id?m.color:"var(--text3)",fontFamily:"var(--font-mono)"}}>+Team</button>
                <button onClick={e=>{e.stopPropagation();requirePin(`Remove ${m.heroName} from roster`,()=>removeMember(activeTeamId,m));}} style={{fontSize:10.5,padding:"5px 12px",background:"rgba(163,45,45,0.1)",border:"1px solid rgba(163,45,45,0.28)",borderRadius:8,cursor:"pointer",color:"#e74c3c",fontFamily:"var(--font-mono)"}}>Remove</button>
                {images[m.id]&&<button onClick={e=>{e.stopPropagation();generateTripo3D(m);}} style={{fontSize:10.5,padding:"5px 12px",background:"rgba(15,110,86,0.1)",border:"1px solid rgba(15,110,86,0.3)",borderRadius:8,cursor:"pointer",color:"#5DCAA5",fontFamily:"var(--font-mono)",whiteSpace:"nowrap"}}>{tripo3DLoading&&tripo3DTarget===m.id?"...":"⬡ Tripo3D"}</button>}
                <div style={{fontSize:11,color:`${m.color}88`,minWidth:16}} onClick={()=>toggle(m.id)}>{expanded[m.id]?"▲":"▼"}</div>
              </div>
            </div>
            {switchingMember===m.id&&(<div style={{display:"flex",flexWrap:"wrap",gap:8,padding:"12px 18px",background:`${m.color}08`,border:`1px solid ${m.color}33`,borderTop:"none",borderRadius:"0 0 12px 12px",alignItems:"center"}}>
              <span style={{fontSize:10,color:"var(--text4)",letterSpacing:"0.12em",textTransform:"uppercase",marginRight:4,fontFamily:"var(--font-mono)"}}>Move to:</span>
              {teams.filter(t=>t.id!==activeTeamId).map(t=><button key={t.id} onClick={()=>switchMemberTeam(m,t.id)} style={{fontSize:10.5,padding:"5px 13px",background:`${t.color}14`,border:`1px solid ${t.color}44`,borderRadius:20,cursor:"pointer",color:t.color,fontFamily:"var(--font-mono)"}}>{t.name}</button>)}
              <button onClick={()=>flipToVillain(m)} style={{fontSize:10.5,padding:"5px 13px",background:"rgba(139,26,26,0.12)",border:"1px solid rgba(139,26,26,0.35)",borderRadius:20,cursor:"pointer",color:"#e74c3c",fontFamily:"var(--font-mono)"}}>⚠ Go Villain</button>
              <button onClick={()=>setSwitchingMember(null)} style={{fontSize:10.5,padding:"5px 11px",background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:20,cursor:"pointer",color:"var(--text4)",fontFamily:"var(--font-mono)",marginLeft:4}}>Cancel</button>
            </div>)}
            {sharingMember===m.id&&(()=>{
              const alreadyOn=(memberTeamMap[m.id]||[]);
              const eligible=teams.filter(t=>t.id!==activeTeamId&&!alreadyOn.includes(t.id));
              return(<div style={{display:"flex",flexWrap:"wrap",gap:8,padding:"12px 18px",background:`${m.color}08`,border:`1px solid ${m.color}33`,borderTop:"none",borderRadius:"0 0 12px 12px",alignItems:"center"}}>
                <span style={{fontSize:10,color:"var(--text4)",letterSpacing:"0.12em",textTransform:"uppercase",marginRight:4,fontFamily:"var(--font-mono)"}}>Also add to:</span>
                {eligible.length===0
                  ?<span style={{fontSize:10.5,color:"var(--text4)",fontStyle:"italic"}}>Already on all teams</span>
                  :eligible.map(t=><button key={t.id} onClick={()=>addToTeam(m,t.id)} style={{fontSize:10.5,padding:"5px 13px",background:`${t.color}14`,border:`1px solid ${t.color}44`,borderRadius:20,cursor:"pointer",color:t.color,fontFamily:"var(--font-mono)"}}>{t.name}</button>)
                }
                {alreadyOn.filter(t=>t!==activeTeamId).length>0&&<span style={{fontSize:10,color:"var(--text3)",marginLeft:4}}>· On: {alreadyOn.filter(t=>t!==activeTeamId).map(t=>teams.find(x=>x.id===t)?.name||t).join(", ")}</span>}
                <button onClick={()=>setSharingMember(null)} style={{fontSize:10.5,padding:"5px 11px",background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:20,cursor:"pointer",color:"var(--text4)",fontFamily:"var(--font-mono)",marginLeft:4}}>Cancel</button>
              </div>);
            })()}
            {editingChar[m.id]&&<EditPanel member={m} onSave={d=>saveCharEdit(m.id,d)} onCancel={()=>setEditingChar(p=>({...p,[m.id]:false}))} callAI={callAI} teamName={activeTeam.name}/>}
            {expanded[m.id]&&!editingChar[m.id]&&!switchingMember&&!sharingMember&&(<div style={{border:`1px solid ${m.color}44`,borderTop:"none",borderRadius:"0 0 10px 10px",overflow:"hidden"}}><CharacterPage member={m} imageUrl={images[m.id]||null} teamName={activeTeam.name} teamColor={activeTeam.color}/></div>)}
          </div>))}
        </div>
      </>)}

      {/* ── Tripo3D result panel (Roster tab) ─────────────────────────── */}
      {tab==="roster"&&tripo3DPrompt&&tripo3DTarget&&(()=>{
        const m=activeRoster.find(x=>x.id===tripo3DTarget);
        return(<div style={{padding:"0 0 8px"}}>
          <div style={{padding:"16px 18px",background:"rgba(15,110,86,0.08)",border:"1px solid rgba(15,110,86,0.3)",borderRadius:12}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div><div style={{fontSize:11,fontWeight:"bold",color:"#5DCAA5"}}>⬡ Tripo3D Prompt — {m?.heroName}</div><div style={{fontSize:9,color:"var(--text3)",marginTop:2}}>FDM-optimized · separate color regions · watertight mesh</div></div>
              <button onClick={()=>{setTripo3DPrompt(null);setTripo3DTarget(null);}} style={{fontSize:9,padding:"2px 8px",background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:6,cursor:"pointer",color:"var(--text2)",fontFamily:"var(--font-mono)"}}>✕</button>
            </div>
            <div style={{background:"rgba(0,0,0,0.4)",border:"1px solid var(--border2)",borderRadius:8,padding:"12px 14px",fontFamily:"var(--font-mono)",fontSize:11.5,color:"#BFBBA6",lineHeight:1.7,whiteSpace:"pre-wrap",wordBreak:"break-word",marginBottom:8}}>{tripo3DPrompt}</div>
            <Tripo3DLauncher prompt={tripo3DPrompt} copied={copied.rtripo} onCopy={()=>copy("rtripo",tripo3DPrompt)}/>
          </div>
        </div>);
      })()}

      {/* ── TEAM DYNAMICS TAB ─────────────────────────────────────────── */}
      {tab==="team"&&activeTeam&&(<>
        <div style={{fontSize:9,letterSpacing:"0.2em",color:`${G}77`,textTransform:"uppercase",marginBottom:12}}>{activeTeam.name} — Team Dynamics</div>
        {coreMembers.length>=2?(
          <>
            <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid var(--border2)",borderRadius:12,overflow:"hidden",marginBottom:20}}>
              <svg viewBox="0 0 400 310" style={{width:"100%",display:"block"}}>
                {(()=>{const memberIds=coreMembers.map(m=>m.id);return familyLinks.filter(l=>memberIds.includes(l.a)&&memberIds.includes(l.b)).map((d,i)=>{
                  const ai=coreMembers.findIndex(m=>m.id===d.a),bi=coreMembers.findIndex(m=>m.id===d.b);
                  if(ai<0||bi<0)return null;
                  const pa=positions[ai],pb=positions[bi],active=dynActive===i;
                  const lc=activeTeam.color;
                  return(<g key={d.id} style={{cursor:"pointer"}} onClick={()=>setDynActive(dynActive===i?null:i)}>
                    <line x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} stroke={lc} strokeWidth={active?2.5:1.5} strokeOpacity={active?0.9:0.25}/>
                    <circle cx={(pa.x+pb.x)/2} cy={(pa.y+pb.y)/2} r={14} fill={active?`${lc}28`:"var(--bg3)"} stroke={lc} strokeWidth={active?1.5:0.5} strokeOpacity={0.7}/>
                    <text x={(pa.x+pb.x)/2} y={(pa.y+pb.y)/2+3} textAnchor="middle" fontSize="6" fill={lc} fontFamily="monospace" opacity={0.85}>{d.aRelation}</text>
                  </g>);
                });})()}
                {coreMembers.map((m,i)=>{const p=positions[i];return(<g key={m.id}>
                  <defs><clipPath id={`cl-${m.id}`}><circle cx={p.x} cy={p.y} r={28}/></clipPath></defs>
                  <circle cx={p.x} cy={p.y} r={34} fill={`${m.color}18`} stroke={m.color} strokeWidth={1.5}/>
                  {images[m.id]?<image href={images[m.id]} x={p.x-28} y={p.y-28} width={56} height={56} clipPath={`url(#cl-${m.id})`} preserveAspectRatio="xMidYMin slice"/>:<text x={p.x} y={p.y+5} textAnchor="middle" fontSize="12" fontWeight="bold" fill={m.color} fontFamily="monospace">{m.initials}</text>}
                  <text x={p.x} y={p.y+48} textAnchor="middle" fontSize="8.5" fill="var(--text-primary)" fontFamily="monospace" fontWeight="bold">{m.heroName}</text>
                </g>);})}
              </svg>
              <div style={{fontSize:9,color:"var(--text4)",textAlign:"center",paddingBottom:10,letterSpacing:"0.08em"}}>Family connections between roster members shown above · Add connections in the Family tab</div>
            </div>
            {(()=>{const memberIds=coreMembers.map(m=>m.id);const activeLinks=familyLinks.filter(l=>memberIds.includes(l.a)&&memberIds.includes(l.b));
            return activeLinks.length>0?(
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:10}}>
                {activeLinks.map((d,i)=>{const ma=coreMembers.find(m=>m.id===d.a),mb=coreMembers.find(m=>m.id===d.b);return(<div key={d.id} onClick={()=>setDynActive(dynActive===i?null:i)} style={{background:dynActive===i?`${activeTeam.color}0E`:"var(--bg3)",border:`1px solid ${dynActive===i?activeTeam.color+"44":"rgba(255,255,255,0.06)"}`,borderRadius:10,padding:"13px 15px",cursor:"pointer"}}>
                  <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:5}}><div style={{width:7,height:7,borderRadius:"50%",background:activeTeam.color}}/><span style={{fontSize:12,fontWeight:"bold",color:"var(--text-primary)"}}>{d.aRelation} / {d.bRelation}</span></div>
                  <div style={{fontSize:9,color:activeTeam.color}}>{ma?.heroName} · {mb?.heroName}</div>
                </div>);})}
              </div>
            ):<div style={{textAlign:"center",padding:"20px",color:"var(--text3)",fontSize:11}}>No family connections between roster members yet. Add them in the Family tab.</div>;
            })()}
          </>
        ):(
          <div style={{textAlign:"center",padding:"40px 20px"}}>
            <div style={{fontSize:9,letterSpacing:"0.12em",color:`${activeTeam.color}88`,textTransform:"uppercase",marginBottom:8}}>Team Dynamics</div>
            <div style={{fontSize:12,color:"var(--text2)",lineHeight:1.7,maxWidth:420,margin:"0 auto"}}>Add at least 2 members via Recruit, then return here to see the team dynamics visualization.</div>
          </div>
        )}
      </>)}

      {/* ── PROMPTS TAB ───────────────────────────────────────────────── */}
      {tab==="prompts"&&activeTeam&&(<>
        <div style={{padding:"12px 14px",background:"rgba(212,175,55,0.06)",border:"1px solid rgba(212,175,55,0.2)",borderRadius:8,fontSize:11,color:"var(--text2)",lineHeight:1.65,marginBottom:16}}>
          <strong style={{color:G,display:"block",marginBottom:3}}>Consistency Lock · {activeTeam.name}</strong>
          Prompts include exact costume specs and design rules. Reference images lock the prompt to that specific design.
        </div>
        {/* Platform selector */}
        <div style={{...s.card,marginBottom:14}}>
          <span style={s.lbl}>Image Platform</span>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {[["meta-ai","Meta AI"],["midjourney","Midjourney"],["dalle","DALL-E 3"]].map(([id,label])=>(
              <button key={id} onClick={()=>{setPPlatform(id);persist("forge-prompt-platform",id);setPResult(null);}} style={s.chip(pPlatform===id)}>{label}</button>
            ))}
          </div>
          <div style={{fontSize:9,color:"var(--text3)",marginTop:7}}>
            {pPlatform==="midjourney"?"Paste into Discord /imagine — best quality for detailed characters. Optimal for Midjourney v6.":pPlatform==="dalle"?"Works in ChatGPT (DALL-E 3) — excellent at following detailed descriptions. Requires ChatGPT Plus.":"Paste into Meta AI Imagine — best with reference image uploaded alongside the prompt."}
          </div>
        </div>
        {/* Meta AI account toggle — only relevant for Meta AI platform */}
        {pPlatform==="meta-ai"&&<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:"rgba(30,144,255,0.06)",border:"1px solid rgba(30,144,255,0.2)",borderRadius:8,marginBottom:14}}>
          <div><div style={{fontSize:11,fontWeight:"bold",color:"#5EB1FF",marginBottom:2}}>Meta AI Account</div><div style={{fontSize:10,color:"var(--text2)"}}>Enable "Copy & Open" buttons that launch meta.ai with your prompt pre-copied</div></div>
          <button onClick={()=>{const v=!hasMetaAI;setHasMetaAI(v);persist("forge-meta-ai-pref",v);}} style={{padding:"6px 14px",background:hasMetaAI?"rgba(30,144,255,0.2)":"var(--bg3)",border:`1px solid ${hasMetaAI?"rgba(30,144,255,0.6)":"var(--text4)"}`,borderRadius:20,cursor:"pointer",color:hasMetaAI?"#5EB1FF":"var(--text2)",fontSize:10,fontFamily:"var(--font-mono)",flexShrink:0,marginLeft:12}}>{hasMetaAI?"ON":"OFF"}</button>
        </div>}
        <div style={{...s.card,marginBottom:16}}>
          <span style={s.lbl}>Art Style</span>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>{ART_STYLES.map(a=><button key={a.id} style={s.chip(pStyle===a.id)} onClick={()=>setPStyle(a.id)}>{a.label}</button>)}</div>
        </div>
        {activeRoster.length===0&&<div style={{textAlign:"center",padding:"30px",color:"var(--text3)"}}>No members on {activeTeam.name} yet. Add some via Recruit first.</div>}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:10,marginBottom:14}}>
          {activeRoster.map(m=>(<div key={m.id} onClick={()=>generateCharPrompt(m)} style={{background:pSelected===m.id?`${m.color}12`:"var(--bg3)",border:`1px solid ${pSelected===m.id?m.color+"55":"rgba(255,255,255,0.06)"}`,borderRadius:10,padding:"14px 16px",cursor:"pointer"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              {images[m.id]?<div style={{position:"relative",flexShrink:0}}><img src={images[m.id]} alt="" style={{width:30,height:30,borderRadius:"50%",objectFit:"cover",objectPosition:"top"}}/><div style={{position:"absolute",bottom:-1,right:-1,width:10,height:10,background:"#0F6E56",borderRadius:"50%",border:"1px solid #09090F",display:"flex",alignItems:"center",justifyContent:"center",fontSize:6,color:"#fff"}}>✓</div></div>:<div style={{width:30,height:30,borderRadius:"50%",background:`${m.color}16`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:"bold",color:m.color,flexShrink:0}}>{m.initials}</div>}
              <div><div style={{fontSize:12,fontWeight:"bold",color:"var(--text-primary)"}}>{m.heroName}</div><div style={{fontSize:9,color:m.color}}>{m.realName}</div></div>
            </div>
            <div style={{fontSize:9,color:"rgba(255,255,255,0.26)",fontStyle:"italic",lineHeight:1.4}}>{m.consistencyNotes||"Consistent design"}</div>
            {pLoading&&pSelected===m.id&&<div style={{marginTop:7,fontSize:9,color:G}}>Generating...</div>}
          </div>))}
        </div>
        {/* ── Villain Portraits ── */}
        {villainPool.length>0&&<>
          <div style={{display:"flex",alignItems:"center",gap:10,margin:"20px 0 10px"}}>
            <div style={{flex:1,height:1,background:"rgba(139,26,26,0.3)"}}/>
            <span style={{fontSize:9,letterSpacing:"0.2em",color:"rgba(224,112,112,0.7)",textTransform:"uppercase",fontFamily:"var(--font-mono)",whiteSpace:"nowrap"}}>Villain Portraits</span>
            <div style={{flex:1,height:1,background:"rgba(139,26,26,0.3)"}}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:10,marginBottom:14}}>
            {villainPool.map(v=>(
              <div key={v.id} onClick={()=>generateVillainPrompt(v)} style={{background:pSelected===v.id?"rgba(139,26,26,0.12)":"rgba(139,26,26,0.05)",border:`1px solid ${pSelected===v.id?"rgba(224,112,112,0.4)":"rgba(139,26,26,0.25)"}`,borderRadius:10,padding:"14px 16px",cursor:"pointer",transition:"all 0.15s"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                  {images[v.id]
                    ?<div style={{position:"relative",flexShrink:0}}><img src={images[v.id]} alt="" style={{width:30,height:30,borderRadius:"50%",objectFit:"cover",objectPosition:"top"}}/></div>
                    :<div style={{width:30,height:30,borderRadius:"50%",background:"rgba(139,26,26,0.2)",border:"1px solid rgba(224,112,112,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:"bold",color:"#E07070",flexShrink:0}}>{v.initials||"??"}</div>}
                  <div>
                    <div style={{fontSize:12,fontWeight:"bold",color:"#E07070"}}>{v.heroName}</div>
                    <div style={{fontSize:9,color:"rgba(224,112,112,0.6)"}}>{v.realName}</div>
                  </div>
                </div>
                <div style={{fontSize:9,color:"rgba(224,112,112,0.45)",fontStyle:"italic",lineHeight:1.4}}>{v.tagline||v.role||"Villain"}</div>
                {pLoading&&pSelected===v.id&&<div style={{marginTop:7,fontSize:9,color:"#E07070"}}>Generating...</div>}
              </div>
            ))}
          </div>
        </>}
        {activeRoster.length>=2&&<div style={{...s.card,marginBottom:12}}>
          <div style={{fontSize:10,fontWeight:"bold",color:"var(--text3)",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:10}}>Duo Shot · Pick 2 Heroes</div>
          <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:10}}>
            <select value={duoA} onChange={e=>setDuoA(e.target.value)} style={{flex:1,padding:"7px 10px",background:"var(--bg2)",border:`1px solid ${duoA?(activeRoster.find(m=>m.id===duoA)?.color+"55")||"rgba(255,255,255,0.15)":"rgba(255,255,255,0.08)"}`,borderRadius:6,color:"var(--text-primary)",fontSize:11,fontFamily:"var(--font-mono)",cursor:"pointer"}}>
              <option value="">— Hero A —</option>
              {activeRoster.map(m=><option key={m.id} value={m.id}>{m.heroName}</option>)}
            </select>
            <span style={{color:"var(--text3)",fontSize:13,flexShrink:0}}>+</span>
            <select value={duoB} onChange={e=>setDuoB(e.target.value)} style={{flex:1,padding:"7px 10px",background:"var(--bg2)",border:`1px solid ${duoB?(activeRoster.find(m=>m.id===duoB)?.color+"55")||"rgba(255,255,255,0.15)":"rgba(255,255,255,0.08)"}`,borderRadius:6,color:"var(--text-primary)",fontSize:11,fontFamily:"var(--font-mono)",cursor:"pointer"}}>
              <option value="">— Hero B —</option>
              {activeRoster.filter(m=>m.id!==duoA).map(m=><option key={m.id} value={m.id}>{m.heroName}</option>)}
            </select>
          </div>
          <button style={s.bigBtn(!duoA||!duoB||pLoading)} onClick={generateDuoPrompt} disabled={!duoA||!duoB||pLoading}>{pLoading&&pSelected==="duo"?"Building duo shot...":"Generate Duo Shot"}</button>
        </div>}
        {activeRoster.length>1&&<button style={s.bigBtn(pLoading)} onClick={generateGroupPrompt} disabled={pLoading}>{pLoading&&pSelected==="group"?"Building group shot...":"Generate Full Team Group Shot"}</button>}
        {pResult&&!pResult.error&&(<div ref={pResultRef} style={{...s.card,marginTop:16}}>
          <div style={{fontSize:12,fontWeight:"bold",color:pResult.group||pResult.duo?G:pResult.isVillain?"#E07070":pResult.member?.color||G,marginBottom:10}}>{pResult.group?`Group Shot — ${pResult.teamName||activeTeam.name}`:pResult.duo?`Duo Shot — ${pResult.heroA?.heroName} + ${pResult.heroB?.heroName}`:pResult.isVillain?`${pResult.member?.heroName} · Villain Portrait`:`${pResult.member?.heroName} · Image Prompts`}</div>
          {pResult.metaAI&&<>
            <span style={s.lbl}>{(pResult.platform||pPlatform)==="midjourney"?"Midjourney /imagine Prompt":(pResult.platform||pPlatform)==="dalle"?"DALL-E 3 Prompt":"Meta AI Image Prompt"}</span>
            <div style={s.pBox}>{pResult.metaAI}</div>
            {(pResult.platform||pPlatform)==="midjourney"?(
              <div style={{display:"flex",alignItems:"center",gap:8,marginTop:8,marginBottom:12}}>
                <div style={{fontSize:9,color:"var(--text3)",flex:1}}>Paste into Discord with /imagine</div>
                <button style={s.cpyBtn(copied.pmeta)} onClick={()=>copy("pmeta",pResult.metaAI)}>{copied.pmeta?"Copied!":"Copy Prompt"}</button>
              </div>
            ):(pResult.platform||pPlatform)==="dalle"?(
              <div style={{display:"flex",gap:8,marginTop:8,flexWrap:"wrap",marginBottom:12}}>
                <button style={s.cpyBtn(copied.pmeta)} onClick={()=>copy("pmeta",pResult.metaAI)}>{copied.pmeta?"Copied!":"Copy"}</button>
                <button onClick={()=>{navigator.clipboard.writeText(pResult.metaAI).then(()=>{copy("pmeta",pResult.metaAI);window.open("https://chat.openai.com/","_blank");});}} style={{padding:"5px 14px",background:"rgba(16,163,127,0.12)",border:"1px solid rgba(16,163,127,0.4)",borderRadius:6,cursor:"pointer",fontSize:10,color:"#10A37F",fontFamily:"var(--font-mono)",display:"flex",alignItems:"center",gap:5}}>
                  <span style={{fontSize:12}}>✦</span> Copy & Open ChatGPT
                </button>
              </div>
            ):(
              hasMetaAI?<MetaAILauncher prompt={pResult.metaAI} label="Meta AI" copied={copied.pmeta} onCopy={()=>copy("pmeta",pResult.metaAI)}/>:<div style={{display:"flex",justifyContent:"flex-end",marginTop:6,marginBottom:12}}><button style={s.cpyBtn(copied.pmeta)} onClick={()=>copy("pmeta",pResult.metaAI)}>{copied.pmeta?"Copied!":"Copy"}</button></div>
            )}
          </>}
          {(pResult.group||pResult.duo)&&<div style={{marginTop:12}}>
            <button style={{...s.bigBtn(sheetLoading),background:sheetLoading?"var(--bg3)":"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.15)"}} onClick={()=>downloadTeamSheet(pResult.duo?[pResult.heroA,pResult.heroB]:undefined)} disabled={sheetLoading}>{sheetLoading?"Building reference sheet…":"📎 Download Reference Sheet"}</button>
            <div style={{fontSize:9,color:"var(--text3)",textAlign:"center",marginTop:6}}>
              {(pResult.platform||pPlatform)==="midjourney"?"Use as reference with --cref [image-url] for character consistency":(pResult.platform||pPlatform)==="dalle"?"Upload alongside the prompt in ChatGPT for best accuracy":"Upload alongside the prompt in Meta AI for best accuracy"}
            </div>
          </div>}
          {!pResult.group&&!pResult.duo&&pResult.member&&images[pResult.member.id]&&<div style={{marginTop:12}}>
            <button style={{...s.bigBtn(false),background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.15)"}} onClick={()=>downloadImg(pResult.member.id,pResult.member.heroName)}>📎 Download Reference Image</button>
            <div style={{fontSize:9,color:"var(--text3)",textAlign:"center",marginTop:6}}>
              {(pResult.platform||pPlatform)==="midjourney"?"Use as reference with --cref [image-url] for character consistency":(pResult.platform||pPlatform)==="dalle"?"Upload alongside the prompt in ChatGPT for best accuracy":"Upload alongside the prompt in Meta AI for best accuracy"}
            </div>
          </div>}
          {pResult.tripo3D&&<><span style={s.lbl}>Tripo3D Model Prompt</span><div style={s.pBox}>{pResult.tripo3D}</div><Tripo3DLauncher prompt={pResult.tripo3D} copied={copied.ptripo} onCopy={()=>copy("ptripo",pResult.tripo3D)}/></>}
        </div>)}
        {pResult?.error&&<div style={{marginTop:12,padding:"12px",background:"rgba(192,57,43,0.1)",border:"1px solid rgba(192,57,43,0.28)",borderRadius:8,fontSize:11,color:"#e74c3c"}}>Failed: {pResult.msg}</div>}
      </>)}

      {/* ── RECRUIT TAB ───────────────────────────────────────────────── */}
      {tab==="recruit"&&activeTeam&&(<>
        <div style={{padding:"10px 14px",background:`${activeTeam.color}0A`,border:`1px solid ${activeTeam.color}33`,borderRadius:8,fontSize:11,color:"var(--text2)",marginBottom:18}}>
          Recruiting for: <strong style={{color:activeTeam.color}}>{activeTeam.name}</strong> · Switch teams in the Teams tab to recruit for a different team.
        </div>
        {/* Mode toggle */}
        <div style={{display:"flex",gap:8,marginBottom:18}}>
          <button onClick={()=>{setDeepMode(false);setProfileMode(false);setDeepPhase(0);setDeepAnswers({});setProfileStep(0);setProfileAnswers({});setRStep(0);setRResult(null);}} style={{flex:1,padding:"10px",background:!deepMode&&!profileMode?`${activeTeam.color}16`:"var(--bg3)",border:`1px solid ${!deepMode&&!profileMode?activeTeam.color:"var(--border2)"}`,borderRadius:9,cursor:"pointer",fontFamily:"var(--font-mono)",textAlign:"center"}}>
            <div style={{fontSize:12,fontWeight:!deepMode&&!profileMode?"bold":"normal",color:!deepMode&&!profileMode?"var(--text-primary)":"var(--text2)"}}>⚡ Quick Forge</div>
            <div style={{fontSize:9,color:"var(--text3)",marginTop:2}}>6 questions, fast result</div>
          </button>
          <button onClick={()=>{setDeepMode(true);setProfileMode(false);setDeepPhase(0);setDeepAnswers({});setProfileStep(0);setProfileAnswers({});setRStep(0);setRResult(null);}} style={{flex:1,padding:"10px",background:deepMode?`${activeTeam.color}16`:"var(--bg3)",border:`1px solid ${deepMode?activeTeam.color:"var(--border2)"}`,borderRadius:9,cursor:"pointer",fontFamily:"var(--font-mono)",textAlign:"center"}}>
            <div style={{fontSize:12,fontWeight:deepMode?"bold":"normal",color:deepMode?"var(--text-primary)":"var(--text2)"}}>📚 Deep Forge</div>
            <div style={{fontSize:9,color:"var(--text3)",marginTop:2}}>7 lore phases, richer result</div>
          </button>
          <button onClick={()=>{setProfileMode(true);setDeepMode(false);setDeepPhase(0);setDeepAnswers({});setProfileStep(0);setProfileAnswers({});setRStep(0);setRResult(null);}} style={{flex:1,padding:"10px",background:profileMode?`${activeTeam.color}16`:"var(--bg3)",border:`1px solid ${profileMode?activeTeam.color:"var(--border2)"}`,borderRadius:9,cursor:"pointer",fontFamily:"var(--font-mono)",textAlign:"center"}}>
            <div style={{fontSize:12,fontWeight:profileMode?"bold":"normal",color:profileMode?"var(--text-primary)":"var(--text2)"}}>🧬 Personal Profile</div>
            <div style={{fontSize:9,color:"var(--text3)",marginTop:2}}>25 questions, built from you</div>
          </button>
        </div>
        <div style={{marginBottom:20}}>
          {/* Progress bar */}
          <div style={{height:3,background:"rgba(255,255,255,0.06)",borderRadius:2,marginBottom:6}}>
            <div style={{height:3,background:activeTeam.color,borderRadius:2,transition:"width 0.3s ease",
              width:rResult?"100%":profileMode
                ?`${(profileStep/6)*100}%`
                :deepMode
                  ?`${(deepPhase/(DEEP_LORE_PHASES.length+1))*100}%`
                  :`${(rStep/(RECRUIT_QUIZ.length+1))*100}%`
            }}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
            <span style={{fontSize:10,color:"var(--text2)"}}>
              {rResult?"Review recruit":profileMode
                ?(profileStep===0?"Identity":`${PERSONAL_PROFILE[profileStep-1]?.section} — ${profileStep} of 5`)
                :deepMode
                  ?(deepPhase===0?"Identity":`Phase ${deepPhase} of ${DEEP_LORE_PHASES.length} — ${DEEP_LORE_PHASES[deepPhase-1]?.title||""}`)
                  :(rStep===0?"Identity":`Question ${rStep} of ${RECRUIT_QUIZ.length}`)
              }
            </span>
            <span style={{fontSize:10,color:activeTeam.color}}>
              {rResult?"Complete":profileMode
                ?`${Math.round((profileStep/6)*100)}%`
                :deepMode
                  ?`${Math.round((deepPhase/(DEEP_LORE_PHASES.length+1))*100)}%`
                  :`${Math.round((rStep/(RECRUIT_QUIZ.length+1))*100)}%`
              }
            </span>
          </div>
        </div>

        {/* ── Step 0: Identity (all modes) ── */}
        {!rResult&&((!deepMode&&!profileMode&&rStep===0)||(deepMode&&deepPhase===0)||(profileMode&&profileStep===0))&&(<div style={s.card}>
          <div style={{fontSize:15,fontWeight:"bold",color:"var(--text-primary)",marginBottom:14}}>Who is this recruit?</div>
          <span style={s.lbl}>Hero Name <span style={{color:"#E07070"}}>*</span></span>
          <div style={{display:"flex",gap:6,marginBottom:14}}><input type="text" placeholder="e.g. Ironhawk" value={rHeroName} onChange={e=>setRHeroName(e.target.value)} style={{flex:1,borderColor:!rHeroName.trim()?"rgba(224,112,112,0.5)":undefined}}/><button onClick={()=>setRHeroName(randHeroName(rRace))} title="Random hero name (race-aware)" style={{padding:"0 12px",background:"var(--bg3)",border:"1px solid var(--border2)",borderRadius:8,cursor:"pointer",color:"var(--text2)",fontSize:16,flexShrink:0}}>⚄</button></div>
          <span style={s.lbl}>Real Name <span style={{color:"#E07070"}}>*</span></span>
          <input type="text" placeholder="e.g. Devon Marshall" value={rName} onChange={e=>setRName(e.target.value)} style={{marginBottom:14,borderColor:!rName.trim()?"rgba(224,112,112,0.5)":undefined}}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
            <div>
              <span style={s.lbl}>Gender</span>
              <select value={rGender} onChange={e=>setRGender(e.target.value)} style={{width:"100%",padding:"8px 10px",background:"var(--bg2)",border:"1px solid var(--border2)",borderRadius:7,color:"var(--text-primary)",fontSize:11,marginTop:4}}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-binary">Non-binary</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <span style={s.lbl}>Birth Year (optional)</span>
              <input type="number" placeholder="e.g. 1995" value={rBirthYear} onChange={e=>{setRBirthYear(e.target.value);setRAge(e.target.value?String(2026-parseInt(e.target.value)):"");}} style={{marginTop:4,padding:"8px 10px"}}/>
            </div>
            <div>
              <span style={s.lbl}>Age {rBirthYear&&rAge?`(${rAge} yrs)`:""} (optional)</span>
              <input type="text" placeholder="e.g. 25" value={rAge} onChange={e=>setRAge(e.target.value)} style={{marginTop:4,padding:"8px 10px"}}/>
            </div>
          </div>
          <div style={{marginBottom:14}}>
            <span style={s.lbl}>Story Direction (optional)</span>
            <textarea style={{height:52,fontSize:11,marginTop:4}} placeholder={`e.g. "Was exiled from their homeworld" · "Lost their powers once and had to earn them back" · "Reluctant hero who fights for one person, not the mission"`} value={rStoryDir} onChange={e=>setRStoryDir(e.target.value)}/>
          </div>
          <div style={{marginBottom:14}}>
            <span style={s.lbl}>Race <span style={{color:"#E07070"}}>*</span></span>
            <div style={{marginTop:6,outline:!rRace?"1px solid rgba(224,112,112,0.4)":undefined,borderRadius:8}}>
              <RaceSelector value={rRace} onChange={setRRace} color={rColors[0]||G}/>
            </div>
          </div>
          <span style={s.lbl}>Outfit Color Palette <span style={{color:"var(--text4)",fontWeight:"normal"}}>(up to 3)</span></span>
          <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:8}}>
            {ACCENT_COLORS.map(ac=>{const sel=rColors.includes(ac.hex);const idx=rColors.indexOf(ac.hex);return(<button key={ac.id} onClick={()=>toggleRColor(ac.hex)} style={{display:"flex",alignItems:"center",gap:7,padding:"6px 11px",background:sel?`${ac.hex}18`:"var(--bg3)",border:`1px solid ${sel?ac.hex:"var(--border2)"}`,borderRadius:20,cursor:"pointer",fontFamily:"var(--font-mono)",fontSize:11,color:sel?"var(--text-primary)":"var(--text2)",position:"relative"}}><div style={{width:10,height:10,borderRadius:"50%",background:ac.hex,flexShrink:0}}/>{ac.label}{sel&&<span style={{fontSize:8,background:ac.hex,color:"#fff",borderRadius:"50%",width:14,height:14,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:"bold",flexShrink:0}}>{idx+1}</span>}</button>);})}</div>
          <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:4}}>
            <input type="color" value={rCustomHex||"#ffffff"} onChange={e=>setRCustomHex(e.target.value)} style={{width:32,height:32,padding:2,border:"1px solid var(--border2)",borderRadius:6,cursor:"pointer",background:"var(--bg3)",flexShrink:0}}/>
            <input type="text" placeholder="#A3B2C1" value={rCustomHex} onChange={e=>setRCustomHex(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addCustomRColor()} style={{flex:1,padding:"6px 10px",fontFamily:"var(--font-mono)",fontSize:11}}/>
            <button onClick={addCustomRColor} disabled={rColors.length>=3} style={{padding:"6px 14px",background:rColors.length>=3?"var(--bg3)":`${G}14`,border:`1px solid ${rColors.length>=3?"var(--border2)":G}`,borderRadius:8,cursor:rColors.length>=3?"not-allowed":"pointer",color:rColors.length>=3?"var(--text4)":G,fontSize:10,fontFamily:"var(--font-mono)",flexShrink:0}}>+ Add</button>
          </div>
          {rColors.length>0&&<div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
            {rColors.map((c,i)=>{const acLabel=ACCENT_COLORS.find(a=>a.hex===c)?.label||"Custom";return(<div key={c} style={{display:"flex",alignItems:"center",gap:5,padding:"4px 10px",background:`${c}14`,border:`1px solid ${c}55`,borderRadius:20}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:c}}/>
              <span style={{fontSize:9,color:c,fontFamily:"var(--font-mono)"}}>{["Primary","Secondary","Tertiary"][i]}: {acLabel}</span>
              {(i>0||rColors.length>1)&&<button onClick={()=>setRColors(prev=>prev.filter(x=>x!==c))} style={{background:"none",border:"none",cursor:"pointer",color:`${c}99`,fontSize:12,padding:0,lineHeight:1,marginLeft:2}}>×</button>}
            </div>);})}
          </div>}
          {deepMode&&(<>
            <span style={{...s.lbl,marginTop:0}}>Visual References (optional)</span>
            <input type="text" placeholder="e.g. Batman's silhouette, Vegeta's stance, Trunks' sword" value={deepAnswers.visualRef||""} onChange={e=>setDeepAnswers(p=>({...p,visualRef:e.target.value}))} style={{marginBottom:12}}/>
            <span style={s.lbl}>Must-Have Visual Elements (optional)</span>
            <input type="text" placeholder="e.g. always has a hood, scar on right eye, mechanical left arm" value={deepAnswers.mustHave||""} onChange={e=>setDeepAnswers(p=>({...p,mustHave:e.target.value}))} style={{marginBottom:14}}/>
          </>)}
          <span style={{...s.lbl,marginTop:0}}>Team Rank</span>
          <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:14}}>
            {TEAM_RANKS.map(r=><button key={r.id} onClick={()=>setRTeamRank(r.id)} style={{fontSize:9,padding:"4px 11px",background:rTeamRank===r.id?`${r.color||G}18`:"var(--bg3)",border:`1px solid ${rTeamRank===r.id?(r.color||G):"var(--border2)"}`,borderRadius:20,cursor:"pointer",color:rTeamRank===r.id?(r.color||G):"var(--text2)",fontFamily:"var(--font-mono)"}}>{r.icon?`${r.icon} `:""}{r.label}</button>)}
          </div>
          {(<>
            <span style={{...s.lbl,marginTop:0}}>Team Alignment</span>
            <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:14}}>
              {NK_ALIGNMENTS.map(a=><button key={a.id} onClick={()=>setRNkAlign(a.id)} style={{fontSize:9,padding:"4px 11px",background:rNkAlign===a.id?`${a.color}18`:"var(--bg3)",border:`1px solid ${rNkAlign===a.id?a.color:"var(--border2)"}`,borderRadius:20,cursor:"pointer",color:rNkAlign===a.id?a.color:"var(--text2)",fontFamily:"var(--font-mono)"}}>{a.label}</button>)}
            </div>
          </>)}
          {(()=>{
            const recruitAllChars=[...Object.values(teamRosters||{}).flat(),...villainPool];
            const uniqueChars=Object.values(Object.fromEntries(recruitAllChars.map(c=>[c.id,c])));
            const selChar=uniqueChars.find(c=>c.id===rFamilyCharId);
            const selRel=FAMILY_RELATIONS.find(r=>r.id===rFamilyRelation);
            return(
              <div style={{marginBottom:14}}>
                <span style={s.lbl}>Family Connection (optional)</span>
                <select value={rFamilyCharId} onChange={e=>setRFamilyCharId(e.target.value)} style={{width:"100%",padding:"8px 10px",background:"var(--bg2)",border:"1px solid var(--border2)",borderRadius:7,color:"var(--text-primary)",fontFamily:"var(--font-mono)",fontSize:11,marginTop:6,marginBottom:rFamilyCharId?8:0}}>
                  <option value="">— No family connection —</option>
                  {uniqueChars.map(c=><option key={c.id} value={c.id}>{c.heroName}{c.isVillain?" ⚠":""} ({c.realName||"?"})</option>)}
                </select>
                {rFamilyCharId&&(<>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:6}}>
                    {FAMILY_RELATIONS.map(r=><button key={r.id} onClick={()=>setRFamilyRelation(r.id)} style={{padding:"4px 10px",background:rFamilyRelation===r.id?`${activeTeam.color}18`:"var(--bg3)",border:`1px solid ${rFamilyRelation===r.id?activeTeam.color:"var(--border2)"}`,borderRadius:14,cursor:"pointer",fontSize:9,color:rFamilyRelation===r.id?activeTeam.color:"var(--text2)",fontFamily:"var(--font-mono)"}}>{r.label}</button>)}
                  </div>
                  {selChar&&selRel&&<div style={{fontSize:9,color:"var(--text3)",fontStyle:"italic"}}>{rHeroName||"New hero"} is {selChar.heroName}'s <strong style={{color:activeTeam.color}}>{selRel.label}</strong> · {selChar.heroName} is their <strong style={{color:activeTeam.color}}>{selRel.inverse}</strong></div>}
                </>)}
              </div>
            );
          })()}
          {(()=>{
            const recruitAllChars=[...Object.values(teamRosters||{}).flat(),...villainPool];
            const uniqueChars=Object.values(Object.fromEntries(recruitAllChars.map(c=>[c.id,c])));
            const selAssocChar=uniqueChars.find(c=>c.id===rHeroAssocId);
            const selAssocType=HERO_ASSOC_TYPES.find(t=>t.id===rHeroAssocType);
            return(
              <div style={{marginBottom:14}}>
                <span style={s.lbl}>Hero Association (optional)</span>
                <div style={{fontSize:9,color:"var(--text3)",marginBottom:5}}>Sidekick, partner, legacy ally — outside of team alliances</div>
                <select value={rHeroAssocId} onChange={e=>setRHeroAssocId(e.target.value)} style={{width:"100%",padding:"8px 10px",background:"var(--bg2)",border:"1px solid var(--border2)",borderRadius:7,color:"var(--text-primary)",fontFamily:"var(--font-mono)",fontSize:11,marginTop:2,marginBottom:rHeroAssocId?8:0}}>
                  <option value="">— No hero association —</option>
                  {uniqueChars.map(c=><option key={c.id} value={c.id}>{c.heroName}{c.isVillain?" ⚠":""} ({c.realName||"?"})</option>)}
                </select>
                {rHeroAssocId&&(<>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:6}}>
                    {HERO_ASSOC_TYPES.map(t=><button key={t.id} onClick={()=>setRHeroAssocType(t.id)} style={{padding:"4px 10px",background:rHeroAssocType===t.id?`${activeTeam.color}18`:"var(--bg3)",border:`1px solid ${rHeroAssocType===t.id?activeTeam.color:"var(--border2)"}`,borderRadius:14,cursor:"pointer",fontSize:9,color:rHeroAssocType===t.id?activeTeam.color:"var(--text2)",fontFamily:"var(--font-mono)"}}>{t.label}</button>)}
                  </div>
                  {selAssocChar&&selAssocType&&<div style={{fontSize:9,color:"var(--text3)",fontStyle:"italic"}}>{rHeroName||"New hero"} is <strong style={{color:activeTeam.color}}>{selAssocType.label}</strong> {selAssocChar.heroName} · {selAssocChar.heroName} is their <strong style={{color:activeTeam.color}}>{selAssocType.inverse}</strong></div>}
                </>)}
              </div>
            );
          })()}
          {(!rHeroName.trim()||!rName.trim()||!rRace)&&<div style={{fontSize:10,color:"#E07070",marginBottom:8,fontFamily:"var(--font-mono)"}}>* Hero Name, Real Name, and Race are required</div>}
          <button style={s.bigBtn(!rHeroName.trim()||!rName.trim()||!rRace,activeTeam.color)} disabled={!rHeroName.trim()||!rName.trim()||!rRace} onClick={()=>deepMode?setDeepPhase(1):profileMode?setProfileStep(1):setRStep(1)}>
            {deepMode?"Begin Deep Forge →":profileMode?"Begin Profile →":"Begin Assessment →"}
          </button>
        </div>)}

        {/* ── Quick mode quiz ── */}
        {!rResult&&!deepMode&&rStep>=1&&rStep<=RECRUIT_QUIZ.length&&rCurrentQ&&(<div style={s.card}>
          <div style={{fontSize:15,fontWeight:"bold",color:"var(--text-primary)",marginBottom:18,lineHeight:1.4}}>{rCurrentQ.question}</div>
          {rCurrentQ.options.map(opt=><button key={opt.id} onClick={()=>{setRAnswers(p=>({...p,[rCurrentQ.id]:opt.id}));if(rStep<RECRUIT_QUIZ.length)setRStep(p=>p+1);}} style={s.optBtn(rAnswers[rCurrentQ.id]===opt.id,rHex)}>{opt.label}</button>)}
          <div style={{display:"flex",gap:10,marginTop:10}}>
            <button onClick={()=>setRStep(p=>Math.max(0,p-1))} style={{flex:1,padding:"10px",background:"var(--bg3)",border:"1px solid var(--border2)",borderRadius:8,cursor:"pointer",color:"var(--text3)",fontSize:10.5,fontFamily:"var(--font-mono)"}}>← Back</button>
            {rStep===RECRUIT_QUIZ.length&&rAnswers[rCurrentQ.id]&&<button onClick={generateRecruit} disabled={rLoading} style={{flex:2,...s.bigBtn(rLoading,rHex),marginTop:0}}>{rLoading?"Forging identity...":"Generate Recruit →"}</button>}
          </div>
        </div>)}

        {/* ── Deep mode phases ── */}
        {!rResult&&deepMode&&deepPhase>=1&&deepPhase<=DEEP_LORE_PHASES.length&&(()=>{
          const ph=DEEP_LORE_PHASES[deepPhase-1];
          const phaseComplete=ph.questions.every(q=>deepAnswers[q.id]);
          const isLast=deepPhase===DEEP_LORE_PHASES.length;
          return(<>
            <DeepLoreQuiz phase={deepPhase-1} answers={deepAnswers} onAnswer={(qid,oid)=>setDeepAnswers(p=>({...p,[qid]:oid}))} accentColor={rHex}/>
            <div style={{display:"flex",gap:10,marginTop:14}}>
              <button onClick={()=>setDeepPhase(p=>Math.max(0,p-1))} style={{flex:1,padding:"10px",background:"var(--bg3)",border:"1px solid var(--border2)",borderRadius:8,cursor:"pointer",color:"var(--text3)",fontSize:10.5,fontFamily:"var(--font-mono)"}}>← Back</button>
              {!isLast&&<button disabled={!phaseComplete} onClick={()=>setDeepPhase(p=>p+1)} style={{flex:2,...s.bigBtn(!phaseComplete,rHex),marginTop:0}}>
                {phaseComplete?`Next: ${DEEP_LORE_PHASES[deepPhase]?.title||"Generate"} →`:"Answer all questions to continue"}
              </button>}
              {isLast&&<button disabled={!phaseComplete||rLoading} onClick={generateDeepRecruit} style={{flex:2,...s.bigBtn(!phaseComplete||rLoading,rHex),marginTop:0}}>
                {rLoading?"Deep forging identity...":phaseComplete?"Generate Deep Recruit →":"Answer all questions"}
              </button>}
            </div>
          </>);
        })()}

        {/* ── Personal Profile sections ── */}
        {!rResult&&profileMode&&profileStep>=1&&profileStep<=5&&(()=>{
          const sec=PERSONAL_PROFILE[profileStep-1];
          const secComplete=sec.questions.every(q=>profileAnswers[q.id]);
          const isLast=profileStep===5;
          return(<div style={s.card}>
            <div style={{fontSize:9,letterSpacing:"0.12em",color:`${rHex}88`,textTransform:"uppercase",marginBottom:12}}>{sec.section} · {profileStep} of 5</div>
            {sec.questions.map(q=>(<div key={q.id} style={{marginBottom:14}}>
              <div style={{fontSize:13,fontWeight:"bold",color:"var(--text-primary)",marginBottom:8,lineHeight:1.4}}>{q.q}</div>
              {q.options.map(opt=><button key={opt.id} onClick={()=>setProfileAnswers(p=>({...p,[q.id]:opt.id}))} style={s.optBtn(profileAnswers[q.id]===opt.id,rHex)}>{opt.label}</button>)}
            </div>))}
            <div style={{display:"flex",gap:10,marginTop:6}}>
              <button onClick={()=>setProfileStep(p=>Math.max(0,p-1))} style={{flex:1,padding:"10px",background:"var(--bg3)",border:"1px solid var(--border2)",borderRadius:8,cursor:"pointer",color:"var(--text3)",fontSize:10.5,fontFamily:"var(--font-mono)"}}>← Back</button>
              {!isLast&&<button disabled={!secComplete} onClick={()=>setProfileStep(p=>p+1)} style={{flex:2,...s.bigBtn(!secComplete,rHex),marginTop:0}}>
                {secComplete?`Next: ${PERSONAL_PROFILE[profileStep]?.section} →`:"Answer all questions to continue"}
              </button>}
              {isLast&&<button disabled={!secComplete||rLoading} onClick={generatePersonalProfile} style={{flex:2,...s.bigBtn(!secComplete||rLoading,rHex),marginTop:0}}>
                {rLoading?"Forging your hero...":secComplete?"Generate My Hero →":"Answer all questions"}
              </button>}
            </div>
          </div>);
        })()}

        {rLoading&&<div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
          {aiStreamText&&<div style={{flex:1,padding:"10px 12px",background:"var(--bg2)",border:"1px solid var(--border2)",borderRadius:8,fontFamily:"var(--font-mono)",fontSize:9,color:"var(--text3)",maxHeight:72,overflowY:"auto",whiteSpace:"pre-wrap",wordBreak:"break-all",lineHeight:1.5}}>{aiStreamText}</div>}
          {!aiStreamText&&<div style={{flex:1,padding:"10px 12px",background:"var(--bg2)",border:"1px solid var(--border2)",borderRadius:8,fontSize:9,color:"var(--text3)",fontFamily:"var(--font-mono)"}}>Waiting for model response…</div>}
          <button onClick={()=>genControllerRef.current?.abort()} style={{flexShrink:0,padding:"8px 14px",background:"rgba(224,112,112,0.1)",border:"1px solid rgba(224,112,112,0.35)",borderRadius:8,cursor:"pointer",color:"#E07070",fontSize:9,fontFamily:"var(--font-mono)",whiteSpace:"nowrap"}}>✕ Cancel</button>
        </div>}

        {/* ── Result (both modes) ── */}
        {rResult&&!rResult.error&&(<>
          <div style={{marginBottom:12,padding:"12px 16px",background:`${rResult.color}0C`,border:`1px solid ${rResult.color}33`,borderRadius:10,display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:42,height:42,borderRadius:"50%",background:`${rResult.color}18`,border:`1px solid ${rResult.color}55`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:"bold",color:rResult.color,flexShrink:0}}>{rResult.initials}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:17,fontWeight:"bold",color:"var(--text-primary)"}}>{rResult.heroName}</div>
              <div style={{fontSize:11,color:rResult.color,marginTop:2}}>{rResult.realName} · {rResult.role}</div>
              {rResult.deepLore&&<div style={{fontSize:9,color:`${rResult.color}88`,marginTop:3,letterSpacing:"0.08em"}}>DEEP FORGE · {DEEP_LORE_PHASES.length} phases</div>}
              {rResult.profileLore&&<div style={{fontSize:9,color:`${rResult.color}88`,marginTop:3,letterSpacing:"0.08em"}}>🧬 PERSONAL PROFILE · {rResult.profileLore} answers</div>}
            </div>
            {rResult.nkAlignment&&rResult.nkAlignment!=="base"&&<AlignmentBadge alignment={rResult.nkAlignment}/>}
          </div>
          <CharacterPage member={rResult} imageUrl={null} teamName={activeTeam.name} teamColor={activeTeam.color}/>
          <div style={{display:"flex",gap:10,marginTop:14}}>
            <button onClick={()=>{setRResult(null);setRStep(0);setRAnswers({});setDeepPhase(0);setDeepAnswers({});setProfileStep(0);setProfileAnswers({});setRHeroAssocId("");setRHeroAssocType("sidekick");setRecruitSuggest(null);setRecruitSuggestLoading(false);}} style={{flex:1,padding:"11px",background:"var(--bg3)",border:"1px solid var(--border2)",borderRadius:8,cursor:"pointer",color:"var(--text2)",fontSize:10.5,fontFamily:"var(--font-mono)"}}>Regenerate</button>
            <button onClick={addRecruit} style={{flex:2,padding:"11px",background:`${activeTeam.color}16`,border:`1px solid ${activeTeam.color}`,borderRadius:8,cursor:"pointer",color:activeTeam.color,fontSize:10.5,letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"var(--font-mono)"}}>Add to {activeTeam.abbr} →</button>
          </div>
          <div style={{marginTop:10}}>
            {!recruitSuggest&&<button onClick={runAIRecruit} disabled={recruitSuggestLoading} style={{width:"100%",padding:"10px",background:"rgba(83,74,183,0.1)",border:"1px solid rgba(83,74,183,0.35)",borderRadius:8,cursor:recruitSuggestLoading?"default":"pointer",color:"#8B82E8",fontSize:10,letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"var(--font-mono)",opacity:recruitSuggestLoading?0.6:1}}>{recruitSuggestLoading?"Consulting AI...":"AI Suggest Next Recruit →"}</button>}
            {recruitSuggest&&!recruitSuggest._err&&(<div style={{padding:"12px 14px",background:"rgba(83,74,183,0.08)",border:"1px solid rgba(83,74,183,0.28)",borderRadius:8}}>
              <div style={{fontSize:9,letterSpacing:"0.14em",color:"rgba(139,130,232,0.65)",textTransform:"uppercase",marginBottom:8}}>AI Recruit Suggestion</div>
              <div style={{fontSize:15,fontWeight:"bold",color:"var(--text-primary)",marginBottom:2}}>{recruitSuggest.name}</div>
              {recruitSuggest.real_name&&<div style={{fontSize:10,color:"var(--text3)",marginBottom:4}}>{recruitSuggest.real_name}</div>}
              {recruitSuggest.role&&<div style={{fontSize:10,color:"#8B82E8",marginBottom:8,fontWeight:"bold"}}>{recruitSuggest.role}</div>}
              {recruitSuggest.why_recruit&&<div style={{fontSize:10,color:"var(--text2)",marginBottom:8,lineHeight:1.6}}>{recruitSuggest.why_recruit}</div>}
              {recruitSuggest.powers?.length>0&&<div style={{fontSize:9,color:"var(--text3)",lineHeight:1.6}}>{recruitSuggest.powers.join(" · ")}</div>}
              <button onClick={()=>setRecruitSuggest(null)} style={{marginTop:10,padding:"5px 12px",background:"transparent",border:"1px solid var(--border2)",borderRadius:6,cursor:"pointer",color:"var(--text3)",fontSize:9,fontFamily:"var(--font-mono)"}}>Dismiss</button>
            </div>)}
            {recruitSuggest?._err&&<div style={{fontSize:10,color:"#E07070",padding:"8px 12px",background:"rgba(224,112,112,0.08)",border:"1px solid rgba(224,112,112,0.25)",borderRadius:8}}>{recruitSuggest._err}</div>}
          </div>
        </>)}
        {rResult?.error&&(<div style={{padding:"14px",background:"rgba(192,57,43,0.08)",border:"1px solid rgba(192,57,43,0.28)",borderRadius:10}}>
          <div style={{fontSize:11,color:"#e74c3c",marginBottom:12,fontFamily:"var(--font-mono)"}}>AI generation failed: {rResult.msg}</div>
          <div style={{fontSize:10,color:"var(--text3)",marginBottom:14,lineHeight:1.6}}>Mandatory fields (Hero Name, Real Name, Race) are filled — you can save a basic profile now and fill in the details later via Edit.</div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>{setRResult(null);}} style={{flex:1,padding:"10px",background:"var(--bg3)",border:"1px solid var(--border2)",borderRadius:8,cursor:"pointer",color:"var(--text2)",fontSize:10.5,fontFamily:"var(--font-mono)"}}>↺ Try Again</button>
            <button onClick={saveBareRecruit} style={{flex:2,padding:"10px",background:`${activeTeam.color}14`,border:`1px solid ${activeTeam.color}55`,borderRadius:8,cursor:"pointer",color:activeTeam.color,fontSize:10.5,fontFamily:"var(--font-mono)",letterSpacing:"0.06em"}}>Save Without AI →</button>
          </div>
        </div>)}
      </>)}

      {/* ── VILLAINS TAB ──────────────────────────────────────────────── */}
      {tab==="villains"&&(<>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
          <div><div style={{fontSize:9,letterSpacing:"0.2em",color:"rgba(139,26,26,0.7)",textTransform:"uppercase",marginBottom:4}}>Villain Pool</div><div style={{fontSize:12,color:"var(--text2)"}}>Villains can threaten multiple teams. Create once, assign anywhere.</div></div>
        </div>

        {/* Active villain creator */}
        {(vStep>0||vDeepPhase>0||vProfileStep>0||vResult)&&(<>
          <div style={{marginBottom:20}}>
            <div style={{height:3,background:"rgba(255,255,255,0.06)",borderRadius:2,marginBottom:6}}>
              <div style={{height:3,background:"#8B1A1A",borderRadius:2,transition:"width 0.3s ease",
                width:vResult?"100%":vProfileMode?`${(vProfileStep/6)*100}%`:vDeepMode?`${(vDeepPhase/(DEEP_LORE_PHASES.length+1))*100}%`:`${(vStep/(VILLAIN_QUIZ.length+1))*100}%`
              }}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between"}}>
              <span style={{fontSize:10,color:"var(--text2)"}}>{vResult?"Review villain":vProfileMode?(vProfileStep===0?"Identity":`${PERSONAL_PROFILE[vProfileStep-1]?.section} — ${vProfileStep} of 5`):vDeepMode?(vDeepPhase===0?"Identity":`Phase ${vDeepPhase} of ${DEEP_LORE_PHASES.length} — ${DEEP_LORE_PHASES[vDeepPhase-1]?.title||""}`):(`Question ${vStep} of ${VILLAIN_QUIZ.length}`)}</span>
              <span style={{fontSize:10,color:"#E07070"}}>{vResult?"Complete":vProfileMode?`${Math.round((vProfileStep/6)*100)}%`:vDeepMode?`${Math.round((vDeepPhase/(DEEP_LORE_PHASES.length+1))*100)}%`:`${Math.round((vStep/(VILLAIN_QUIZ.length+1))*100)}%`}</span>
            </div>
          </div>
          {!vResult&&!vDeepMode&&!vProfileMode&&vStep>=1&&vStep<=VILLAIN_QUIZ.length&&vCurrentQ&&(<div style={s.card}>
            <div style={{fontSize:15,fontWeight:"bold",color:"var(--text-primary)",marginBottom:18,lineHeight:1.4}}>{vCurrentQ.question}</div>
            {vCurrentQ.options.map(opt=><button key={opt.id} onClick={()=>{setVAnswers(p=>({...p,[vCurrentQ.id]:opt.id}));if(vStep<VILLAIN_QUIZ.length)setVStep(p=>p+1);}} style={s.optBtn(vAnswers[vCurrentQ.id]===opt.id,"#8B1A1A")}>{opt.label}</button>)}
            <div style={{display:"flex",gap:10,marginTop:10}}>
              <button onClick={()=>{if(vStep===1){setVStep(0);}else setVStep(p=>p-1);}} style={{flex:1,padding:"10px",background:"var(--bg3)",border:"1px solid var(--border2)",borderRadius:8,cursor:"pointer",color:"var(--text3)",fontSize:10.5,fontFamily:"var(--font-mono)"}}>← Back</button>
              {vStep===VILLAIN_QUIZ.length&&vAnswers[vCurrentQ.id]&&<button onClick={generateVillain} disabled={vLoading} style={{flex:2,...s.bigBtn(vLoading,"#8B1A1A"),marginTop:0}}>{vLoading?"Forging threat...":"Generate Villain →"}</button>}
            </div>
          </div>)}
          {!vResult&&vDeepMode&&vDeepPhase>=1&&vDeepPhase<=DEEP_LORE_PHASES.length&&(()=>{
            const ph=DEEP_LORE_PHASES[vDeepPhase-1];
            const phaseComplete=ph.questions.every(q=>vDeepAnswers[q.id]);
            const isLast=vDeepPhase===DEEP_LORE_PHASES.length;
            return(<>
              <DeepLoreQuiz phase={vDeepPhase-1} answers={vDeepAnswers} onAnswer={(qid,oid)=>setVDeepAnswers(p=>({...p,[qid]:oid}))} accentColor="#8B1A1A"/>
              <div style={{display:"flex",gap:10,marginTop:14}}>
                <button onClick={()=>setVDeepPhase(p=>Math.max(0,p-1))} style={{flex:1,padding:"10px",background:"var(--bg3)",border:"1px solid var(--border2)",borderRadius:8,cursor:"pointer",color:"var(--text3)",fontSize:10.5,fontFamily:"var(--font-mono)"}}>← Back</button>
                {!isLast&&<button disabled={!phaseComplete} onClick={()=>setVDeepPhase(p=>p+1)} style={{flex:2,...s.bigBtn(!phaseComplete,"#8B1A1A"),marginTop:0}}>{phaseComplete?`Next: ${DEEP_LORE_PHASES[vDeepPhase]?.title||"Generate"} →`:"Answer all questions to continue"}</button>}
                {isLast&&<button disabled={!phaseComplete||vLoading} onClick={generateVillainDeep} style={{flex:2,...s.bigBtn(!phaseComplete||vLoading,"#8B1A1A"),marginTop:0}}>{vLoading?"Forging threat...":phaseComplete?"Generate Deep Villain →":"Answer all questions"}</button>}
              </div>
            </>);
          })()}
          {!vResult&&vProfileMode&&vProfileStep>=1&&vProfileStep<=5&&(()=>{
            const sec=PERSONAL_PROFILE[vProfileStep-1];
            const secComplete=sec.questions.every(q=>vProfileAnswers[q.id]);
            const isLast=vProfileStep===5;
            return(<div style={s.card}>
              <div style={{fontSize:9,letterSpacing:"0.12em",color:"rgba(139,26,26,0.6)",textTransform:"uppercase",marginBottom:12}}>{sec.section} · {vProfileStep} of 5</div>
              {sec.questions.map(q=>(<div key={q.id} style={{marginBottom:14}}>
                <div style={{fontSize:13,fontWeight:"bold",color:"var(--text-primary)",marginBottom:8,lineHeight:1.4}}>{q.q}</div>
                {q.options.map(opt=><button key={opt.id} onClick={()=>setVProfileAnswers(p=>({...p,[q.id]:opt.id}))} style={s.optBtn(vProfileAnswers[q.id]===opt.id,"#8B1A1A")}>{opt.label}</button>)}
              </div>))}
              <div style={{display:"flex",gap:10,marginTop:6}}>
                <button onClick={()=>setVProfileStep(p=>Math.max(0,p-1))} style={{flex:1,padding:"10px",background:"var(--bg3)",border:"1px solid var(--border2)",borderRadius:8,cursor:"pointer",color:"var(--text3)",fontSize:10.5,fontFamily:"var(--font-mono)"}}>← Back</button>
                {!isLast&&<button disabled={!secComplete} onClick={()=>setVProfileStep(p=>p+1)} style={{flex:2,...s.bigBtn(!secComplete,"#8B1A1A"),marginTop:0}}>{secComplete?`Next: ${PERSONAL_PROFILE[vProfileStep]?.section} →`:"Answer all questions to continue"}</button>}
                {isLast&&<button disabled={!secComplete||vLoading} onClick={generateVillainProfile} style={{flex:2,...s.bigBtn(!secComplete||vLoading,"#8B1A1A"),marginTop:0}}>{vLoading?"Forging threat...":secComplete?"Generate Villain →":"Answer all questions"}</button>}
              </div>
            </div>);
          })()}
          {vLoading&&<div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
            {aiStreamText&&<div style={{flex:1,padding:"10px 12px",background:"var(--bg2)",border:"1px solid rgba(139,26,26,0.3)",borderRadius:8,fontFamily:"var(--font-mono)",fontSize:9,color:"var(--text3)",maxHeight:72,overflowY:"auto",whiteSpace:"pre-wrap",wordBreak:"break-all",lineHeight:1.5}}>{aiStreamText}</div>}
            {!aiStreamText&&<div style={{flex:1,padding:"10px 12px",background:"var(--bg2)",border:"1px solid rgba(139,26,26,0.3)",borderRadius:8,fontSize:9,color:"var(--text3)",fontFamily:"var(--font-mono)"}}>Waiting for model response…</div>}
            <button onClick={()=>genControllerRef.current?.abort()} style={{flexShrink:0,padding:"8px 14px",background:"rgba(224,112,112,0.1)",border:"1px solid rgba(224,112,112,0.35)",borderRadius:8,cursor:"pointer",color:"#E07070",fontSize:9,fontFamily:"var(--font-mono)",whiteSpace:"nowrap"}}>✕ Cancel</button>
          </div>}
          {vResult&&!vResult.error&&(<>
            <CharacterPage member={vResult} imageUrl={null} isVillain={true}/>
            <div style={{display:"flex",gap:10,marginTop:14,marginBottom:20}}>
              <button onClick={()=>{setVResult(null);setVStep(0);setVAnswers({});setVDeepPhase(0);setVDeepAnswers({});setVProfileStep(0);setVProfileAnswers({});}} style={{flex:1,padding:"11px",background:"var(--bg3)",border:"1px solid var(--border2)",borderRadius:8,cursor:"pointer",color:"var(--text2)",fontSize:10.5,fontFamily:"var(--font-mono)"}}>Regenerate</button>
              <button onClick={addVillain} style={{flex:2,padding:"11px",background:"rgba(139,26,26,0.2)",border:"1px solid #8B1A1A",borderRadius:8,cursor:"pointer",color:"#E07070",fontSize:10.5,letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"var(--font-mono)"}}>Add to Pool →</button>
            </div>
          </>)}
          {vResult?.error&&(<div style={{padding:"14px",background:"rgba(192,57,43,0.08)",border:"1px solid rgba(192,57,43,0.28)",borderRadius:10,marginBottom:16}}>
            <div style={{fontSize:11,color:"#e74c3c",marginBottom:12,fontFamily:"var(--font-mono)"}}>AI generation failed: {vResult.msg}</div>
            <div style={{fontSize:10,color:"var(--text3)",marginBottom:14,lineHeight:1.6}}>You can save a basic villain profile now and fill in powers, origin, and stats later via Edit.</div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>{setVResult(null);}} style={{flex:1,padding:"10px",background:"var(--bg3)",border:"1px solid var(--border2)",borderRadius:8,cursor:"pointer",color:"var(--text2)",fontSize:10.5,fontFamily:"var(--font-mono)"}}>↺ Try Again</button>
              <button onClick={saveBareVillain} style={{flex:2,padding:"10px",background:"rgba(139,26,26,0.15)",border:"1px solid rgba(139,26,26,0.5)",borderRadius:8,cursor:"pointer",color:"#E07070",fontSize:10.5,fontFamily:"var(--font-mono)",letterSpacing:"0.06em"}}>Save Without AI →</button>
            </div>
          </div>)}
        </>)}

        {vStep===0&&vDeepPhase===0&&vProfileStep===0&&!vResult&&(<>
          {/* Villain creator setup */}
          <div style={{...s.card,marginBottom:20}}>
            <div style={{fontSize:13,fontWeight:"bold",color:"var(--text-primary)",marginBottom:12}}>Create New Villain</div>
            <div style={{display:"flex",gap:6,marginBottom:14}}>
              <button onClick={()=>{setVDeepMode(false);setVProfileMode(false);setVAnswers({});setVDeepAnswers({});setVProfileAnswers({});}} style={{flex:1,padding:"8px",background:!vDeepMode&&!vProfileMode?"rgba(139,26,26,0.15)":"var(--bg3)",border:`1px solid ${!vDeepMode&&!vProfileMode?"rgba(139,26,26,0.5)":"var(--border2)"}`,borderRadius:8,cursor:"pointer",fontFamily:"var(--font-mono)",textAlign:"center"}}>
                <div style={{fontSize:11,fontWeight:"bold",color:!vDeepMode&&!vProfileMode?"#E07070":"var(--text2)"}}>⚡ Quick</div>
                <div style={{fontSize:8.5,color:"var(--text3)",marginTop:1}}>5 threat questions</div>
              </button>
              <button onClick={()=>{setVDeepMode(true);setVProfileMode(false);setVStep(0);setVAnswers({});setVDeepAnswers({});setVProfileAnswers({});}} style={{flex:1,padding:"8px",background:vDeepMode?"rgba(139,26,26,0.15)":"var(--bg3)",border:`1px solid ${vDeepMode?"rgba(139,26,26,0.5)":"var(--border2)"}`,borderRadius:8,cursor:"pointer",fontFamily:"var(--font-mono)",textAlign:"center"}}>
                <div style={{fontSize:11,fontWeight:"bold",color:vDeepMode?"#E07070":"var(--text2)"}}>📚 Deep Forge</div>
                <div style={{fontSize:8.5,color:"var(--text3)",marginTop:1}}>7 lore phases</div>
              </button>
              <button onClick={()=>{setVProfileMode(true);setVDeepMode(false);setVStep(0);setVAnswers({});setVDeepAnswers({});setVProfileAnswers({});}} style={{flex:1,padding:"8px",background:vProfileMode?"rgba(139,26,26,0.15)":"var(--bg3)",border:`1px solid ${vProfileMode?"rgba(139,26,26,0.5)":"var(--border2)"}`,borderRadius:8,cursor:"pointer",fontFamily:"var(--font-mono)",textAlign:"center"}}>
                <div style={{fontSize:11,fontWeight:"bold",color:vProfileMode?"#E07070":"var(--text2)"}}>🧬 Personal</div>
                <div style={{fontSize:8.5,color:"var(--text3)",marginTop:1}}>25-answer profile</div>
              </button>
            </div>
            <span style={s.lbl}>Real Name (optional)</span>
            <input type="text" placeholder="e.g. Marcus Vane" value={vName} onChange={e=>setVName(e.target.value)} style={{marginBottom:10}}/>
            <span style={s.lbl}>Gender</span>
            <select value={vGender} onChange={e=>setVGender(e.target.value)} style={{width:"100%",padding:"8px 10px",background:"var(--bg2)",border:"1px solid var(--border2)",borderRadius:7,color:"var(--text-primary)",fontSize:11,marginTop:4,marginBottom:14}}>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Non-binary">Non-binary</option>
              <option value="Other">Other</option>
            </select>
            <span style={s.lbl}>Target Teams (who does this villain threaten?)</span>
            <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:14}}>
              {teams.map(t=><button key={t.id} onClick={()=>setVTargetTeams(p=>p.includes(t.id)?p.filter(x=>x!==t.id):[...p,t.id])} style={{display:"flex",alignItems:"center",gap:6,...s.chip(vTargetTeams.includes(t.id),t.color)}}><div style={{width:8,height:8,borderRadius:2,background:t.color,flexShrink:0}}/>{t.abbr}</button>)}
            </div>
            <button style={s.bigBtn(false,"#8B1A1A")} onClick={()=>vDeepMode?setVDeepPhase(1):vProfileMode?setVProfileStep(1):setVStep(1)}>
              {vDeepMode?"Begin Deep Forge →":vProfileMode?"Begin Profile →":"Begin Threat Assessment →"}
            </button>
          </div>

          {/* Existing villain pool */}
          {villainPool.length>0&&(<>
            <div style={{fontSize:9,letterSpacing:"0.2em",color:"rgba(139,26,26,0.7)",textTransform:"uppercase",marginBottom:12}}>Active Threats — {villainPool.length} villain{villainPool.length!==1?"s":""}</div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {villainPool.map(v=>(<div key={v.id} style={{background:"rgba(139,26,26,0.08)",border:"1px solid rgba(139,26,26,0.25)",borderRadius:10,padding:"14px 16px"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:36,height:36,borderRadius:"50%",background:"rgba(139,26,26,0.2)",border:"1px solid rgba(139,26,26,0.4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:"bold",color:"#E07070",flexShrink:0}}>{v.initials}</div>
                    <div><div style={{fontSize:13,fontWeight:"bold",color:"var(--text-primary)"}}>{v.heroName}</div><div style={{fontSize:10,color:"var(--text2)"}}>{v.realName} · {v.role}</div></div>
                  </div>
                  <div style={{display:"flex",gap:6}}>
                    <button onClick={()=>{if(editingVillainTarget===v.id){setEditingVillainTarget(null);}else{setVtDraft({teams:v.targetTeams||[],heroes:v.targetHeroes||[]});setEditingVillainTarget(v.id);setRedeemingVillain(null);}}} style={{fontSize:9,padding:"3px 9px",background:editingVillainTarget===v.id?"rgba(139,26,26,0.15)":"var(--bg3)",border:`1px solid ${editingVillainTarget===v.id?"rgba(139,26,26,0.5)":"var(--border)"}`,borderRadius:6,cursor:"pointer",color:editingVillainTarget===v.id?"#E07070":"var(--text3)",fontFamily:"var(--font-mono)"}}>Edit</button>
                    <button onClick={()=>setRedeemingVillain(redeemingVillain===v.id?null:v.id)} style={{fontSize:9,padding:"3px 9px",background:redeemingVillain===v.id?"rgba(93,202,165,0.12)":"var(--bg3)",border:`1px solid ${redeemingVillain===v.id?"rgba(93,202,165,0.4)":"var(--border)"}`,borderRadius:6,cursor:"pointer",color:redeemingVillain===v.id?"#5DCAA5":"var(--text3)",fontFamily:"var(--font-mono)"}}>Recruit</button>
                    <button onClick={()=>removeVillain(v.id)} style={{fontSize:9,padding:"3px 9px",background:"rgba(163,45,45,0.1)",border:"1px solid rgba(163,45,45,0.28)",borderRadius:6,cursor:"pointer",color:"#e74c3c",fontFamily:"var(--font-mono)"}}>Remove</button>
                  </div>
                </div>
                <div style={{fontSize:11,color:"var(--text2)",fontStyle:"italic",lineHeight:1.5,marginBottom:8}}>{v.tagline}</div>
                {(v.targetTeams?.length>0||v.targetHeroes?.length>0)&&!editingVillainTarget&&(<div style={{marginBottom:8}}>
                  {v.targetTeams&&v.targetTeams.length>0&&(<div style={{marginBottom:v.targetHeroes?.length>0?6:0}}>
                    <div style={{fontSize:9,letterSpacing:"0.12em",color:"rgba(139,26,26,0.6)",textTransform:"uppercase",marginBottom:5}}>Target Teams</div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      {v.targetTeams.map(tid=>{const t=teams.find(x=>x.id===tid);return t?<span key={tid} style={{fontSize:9,padding:"2px 9px",background:`${t.color}14`,border:`1px solid ${t.color}33`,borderRadius:20,color:t.color}}>{t.abbr} · {t.name}</span>:null;})}
                    </div>
                  </div>)}
                  {v.targetHeroes&&v.targetHeroes.length>0&&(<div>
                    <div style={{fontSize:9,letterSpacing:"0.12em",color:"rgba(139,26,26,0.6)",textTransform:"uppercase",marginBottom:5}}>Targeting</div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      {v.targetHeroes.map(hid=>{const h=allCharacters.find(x=>x.id===hid);return h?<span key={hid} style={{fontSize:9,padding:"2px 9px",background:`${h.color}14`,border:`1px solid ${h.color}33`,borderRadius:20,color:h.color}}>{h.heroName}</span>:null;})}
                    </div>
                  </div>)}
                </div>)}
                {editingVillainTarget===v.id&&(<div style={{borderTop:"1px solid rgba(139,26,26,0.2)",paddingTop:10,marginTop:4}}>
                  <div style={{fontSize:9,letterSpacing:"0.12em",color:"rgba(139,26,26,0.6)",textTransform:"uppercase",marginBottom:8}}>Target Teams</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
                    {teams.map(t=><button key={t.id} onClick={()=>setVtDraft(p=>({...p,teams:p.teams.includes(t.id)?p.teams.filter(x=>x!==t.id):[...p.teams,t.id]}))} style={{fontSize:9,padding:"3px 10px",background:vtDraft.teams.includes(t.id)?`${t.color}22`:"var(--bg3)",border:`1px solid ${vtDraft.teams.includes(t.id)?t.color:"var(--border)"}`,borderRadius:20,cursor:"pointer",color:vtDraft.teams.includes(t.id)?t.color:"var(--text3)",fontFamily:"var(--font-mono)"}}>{t.name}</button>)}
                  </div>
                  <div style={{fontSize:9,letterSpacing:"0.12em",color:"rgba(139,26,26,0.6)",textTransform:"uppercase",marginBottom:8}}>Specific Heroes</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
                    {allCharacters.map(h=><button key={h.id} onClick={()=>setVtDraft(p=>({...p,heroes:p.heroes.includes(h.id)?p.heroes.filter(x=>x!==h.id):[...p.heroes,h.id]}))} style={{fontSize:9,padding:"3px 10px",background:vtDraft.heroes.includes(h.id)?`${h.color}22`:"var(--bg3)",border:`1px solid ${vtDraft.heroes.includes(h.id)?h.color:"var(--border)"}`,borderRadius:20,cursor:"pointer",color:vtDraft.heroes.includes(h.id)?h.color:"var(--text3)",fontFamily:"var(--font-mono)"}}>{h.heroName}</button>)}
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={()=>setEditingVillainTarget(null)} style={{flex:1,fontSize:9,padding:"6px",background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:6,cursor:"pointer",color:"var(--text3)",fontFamily:"var(--font-mono)"}}>Cancel</button>
                    <button onClick={()=>saveVillainTarget(v.id)} style={{flex:2,fontSize:9,padding:"6px",background:"rgba(139,26,26,0.15)",border:"1px solid rgba(139,26,26,0.4)",borderRadius:6,cursor:"pointer",color:"#E07070",fontFamily:"var(--font-mono)"}}>Save Targets</button>
                  </div>
                </div>)}
                {redeemingVillain===v.id&&(<div style={{display:"flex",flexWrap:"wrap",gap:6,padding:"10px 0 2px",alignItems:"center"}}>
                  <span style={{fontSize:9,color:"#5DCAA5",letterSpacing:"0.1em",marginRight:4}}>RECRUIT TO:</span>
                  {teams.map(t=><button key={t.id} onClick={()=>redeemVillain(v,t.id)} style={{fontSize:9,padding:"3px 10px",background:`${t.color}14`,border:`1px solid ${t.color}44`,borderRadius:20,cursor:"pointer",color:t.color,fontFamily:"var(--font-mono)"}}>{t.name}</button>)}
                  <button onClick={()=>setRedeemingVillain(null)} style={{fontSize:9,padding:"3px 8px",background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:20,cursor:"pointer",color:"var(--text4)",fontFamily:"var(--font-mono)"}}>Cancel</button>
                </div>)}
              </div>))}
            </div>
          </>)}
          {villainPool.length===0&&<div style={{textAlign:"center",padding:"30px",color:"var(--text3)",fontSize:12}}>No villains created yet. Every hero team needs an antagonist.</div>}
        </>)}
      </>)}

      {/* ── STORY TAB ─────────────────────────────────────────────────── */}
      {tab==="story"&&(<>
        <p style={{fontSize:12,color:"var(--text2)",marginBottom:18,lineHeight:1.7}}>Generate a cinematic Meta AI scene prompt. Pull cast from any team.</p>
        <div style={s.card}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <span style={s.lbl}>Select Cast</span>
            <button onClick={()=>setCrossover(p=>!p)} style={{fontSize:9,padding:"3px 10px",background:crossover?"rgba(212,175,55,0.12)":"var(--bg3)",border:`1px solid ${crossover?G:"var(--border)"}`,borderRadius:20,cursor:"pointer",color:crossover?G:"var(--text2)",fontFamily:"var(--font-mono)"}}>
              {crossover?"🌐 Crossover ON":"🌐 Crossover OFF"}
            </button>
          </div>
          {crossover?(
            <div style={{marginBottom:18}}>
              {teams.map(t=>{
                const tr=getTeamRoster(t.id);
                if(!tr.length)return null;
                return(<div key={t.id} style={{marginBottom:12}}>
                  <div style={{fontSize:9,color:t.color,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:6}}>{t.name}</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>{tr.map(m=><button key={m.id} onClick={()=>setSCast(p=>p.includes(m.id)?p.filter(x=>x!==m.id):[...p,m.id])} style={{display:"flex",alignItems:"center",gap:5,...s.chip(sCast.includes(m.id),m.color),padding:"5px 10px"}}>{images[m.id]&&<img src={images[m.id]} alt="" style={{width:16,height:16,borderRadius:"50%",objectFit:"cover",objectPosition:"top"}}/>}{m.heroName}</button>)}</div>
                </div>);
              })}
              {villainPool.length>0&&<div><div style={{fontSize:9,color:"#E07070",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:6}}>Villains</div><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{villainPool.map(v=><button key={v.id} onClick={()=>setSCast(p=>p.includes(v.id)?p.filter(x=>x!==v.id):[...p,v.id])} style={{display:"flex",alignItems:"center",gap:5,...s.chip(sCast.includes(v.id),"#8B1A1A"),padding:"5px 10px"}}><span style={{fontSize:9}}>⚠</span>{v.heroName}</button>)}</div></div>}
            </div>
          ):(
            <div style={{marginBottom:18}}>
              <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                {[...activeRoster,...villainPool.filter(v=>v.targetTeams?.includes(activeTeamId))].map(m=><button key={m.id} onClick={()=>setSCast(p=>p.includes(m.id)?p.filter(x=>x!==m.id):[...p,m.id])} style={{display:"flex",alignItems:"center",gap:6,...s.chip(sCast.includes(m.id),m.isVillain?"#8B1A1A":m.color)}}>
                  {images[m.id]&&<img src={images[m.id]} alt="" style={{width:18,height:18,borderRadius:"50%",objectFit:"cover",objectPosition:"top"}}/>}
                  {m.isVillain&&<span style={{fontSize:9}}>⚠</span>}
                  {m.heroName}
                </button>)}
              </div>
            </div>
          )}
          <span style={s.lbl}>Scenario</span>
          <div className="fscenario-grid" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:18}}>
            {SCENARIOS.map(sc=><button key={sc.id} onClick={()=>setSScenario(sc.id)} style={{...s.chip(sScenario===sc.id),padding:"9px 11px",textAlign:"left",borderRadius:9,display:"flex",flexDirection:"column",gap:2}}><span style={{fontSize:14}}>{sc.icon}</span><span style={{fontSize:11,fontWeight:"bold"}}>{sc.label}</span><span style={{fontSize:9,opacity:0.55}}>{sc.desc}</span></button>)}
          </div>
          <span style={s.lbl}>Tone</span>
          <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:6}}>{TONES.map(t=><button key={t.id} style={s.chip(sTone===t.id)} onClick={()=>setSTone(t.id)}>{t.label}</button>)}</div>
          <button style={s.bigBtn(sCast.length<1||sLoading)} onClick={generateStory} disabled={sCast.length<1||sLoading}>{sLoading?"Generating scene...":"Generate Scene Prompt"}</button>
        </div>
        {sResult&&(<div style={{...s.card,marginTop:14}}>
          <span style={s.lbl}>Meta AI Scene Prompt</span>
          <div style={s.pBox}>{sResult}</div>
          <div style={{display:"flex",justifyContent:"flex-end",marginTop:8}}><button style={s.cpyBtn(copied.story)} onClick={()=>copy("story",sResult)}>{copied.story?"Copied!":"Copy"}</button></div>
        </div>)}
      </>)}

      {/* ── BATTLE TAB ────────────────────────────────────────────────── */}
      {tab==="battle"&&(()=>{
        const battlePool=[...allCharacters,...villainPool.map(v=>({...v,isVillain:true}))];
        return(<>
          <div style={{fontSize:9,letterSpacing:"0.2em",color:`${G}77`,textTransform:"uppercase",marginBottom:16}}>Battle Simulator — Select Two Fighters</div>
          <div className="fbattle-grid" style={{display:"grid",gridTemplateColumns:"1fr 44px 1fr",gap:10,alignItems:"start",marginBottom:16}}>
            <div>
              <div style={{fontSize:9,color:"var(--text4)",marginBottom:8,letterSpacing:"0.1em"}}>FIGHTER A</div>
              <select value={battleA?.id||""} onChange={e=>{setBattleA(battlePool.find(m=>m.id===e.target.value)||null);setBattleResult(null);}} style={{width:"100%",background:"var(--bg3)",border:`1px solid ${battleA?battleA.color+"55":"var(--border)"}`,borderRadius:8,padding:"10px 12px",color:"var(--text-primary)",fontSize:11,cursor:"pointer",marginBottom:8}}>
                <option value="">— Select —</option>
                {allCharacters.map(m=><option key={m.id} value={m.id}>{m.heroName}</option>)}
                {villainPool.map(v=><option key={v.id} value={v.id}>⚠ {v.heroName}</option>)}
              </select>
              {battleA&&<div style={{padding:"10px",background:`${battleA.color}0A`,border:`1px solid ${battleA.color}33`,borderRadius:8}}>
                {images[battleA.id]&&<img src={images[battleA.id]} alt="" style={{width:"100%",height:100,objectFit:"cover",objectPosition:"top",borderRadius:6,marginBottom:8}}/>}
                <div style={{fontSize:13,fontWeight:"bold",color:battleA.color,marginBottom:2}}>{battleA.heroName}</div>
                <div style={{fontSize:9,color:"var(--text3)",marginBottom:6}}>{battleA.realName}</div>
                {battleA.stats&&Object.entries(battleA.stats).map(([k,v])=><div key={k} style={{display:"flex",gap:6,alignItems:"center",marginBottom:3}}><div style={{fontSize:8,color:"var(--text4)",width:55}}>{k}</div><div style={{flex:1,height:3,background:"rgba(255,255,255,0.08)",borderRadius:2,overflow:"hidden"}}><div style={{width:`${v}%`,height:"100%",background:battleA.color,borderRadius:2}}/></div><div style={{fontSize:8,color:battleA.color,width:18,textAlign:"right"}}>{v}</div></div>)}
              </div>}
            </div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",paddingTop:36}}>
              <div style={{fontSize:15,fontWeight:"bold",color:G}}>VS</div>
            </div>
            <div>
              <div style={{fontSize:9,color:"var(--text4)",marginBottom:8,letterSpacing:"0.1em"}}>FIGHTER B</div>
              <select value={battleB?.id||""} onChange={e=>{setBattleB(battlePool.find(m=>m.id===e.target.value)||null);setBattleResult(null);}} style={{width:"100%",background:"var(--bg3)",border:`1px solid ${battleB?battleB.color+"55":"var(--border)"}`,borderRadius:8,padding:"10px 12px",color:"var(--text-primary)",fontSize:11,cursor:"pointer",marginBottom:8}}>
                <option value="">— Select —</option>
                {allCharacters.map(m=><option key={m.id} value={m.id}>{m.heroName}</option>)}
                {villainPool.map(v=><option key={v.id} value={v.id}>⚠ {v.heroName}</option>)}
              </select>
              {battleB&&<div style={{padding:"10px",background:`${battleB.color}0A`,border:`1px solid ${battleB.color}33`,borderRadius:8}}>
                {images[battleB.id]&&<img src={images[battleB.id]} alt="" style={{width:"100%",height:100,objectFit:"cover",objectPosition:"top",borderRadius:6,marginBottom:8}}/>}
                <div style={{fontSize:13,fontWeight:"bold",color:battleB.color,marginBottom:2}}>{battleB.heroName}</div>
                <div style={{fontSize:9,color:"var(--text3)",marginBottom:6}}>{battleB.realName}</div>
                {battleB.stats&&Object.entries(battleB.stats).map(([k,v])=><div key={k} style={{display:"flex",gap:6,alignItems:"center",marginBottom:3}}><div style={{fontSize:8,color:"var(--text4)",width:55}}>{k}</div><div style={{flex:1,height:3,background:"rgba(255,255,255,0.08)",borderRadius:2,overflow:"hidden"}}><div style={{width:`${v}%`,height:"100%",background:battleB.color,borderRadius:2}}/></div><div style={{fontSize:8,color:battleB.color,width:18,textAlign:"right"}}>{v}</div></div>)}
              </div>}
            </div>
          </div>
          <button style={s.bigBtn(!battleA||!battleB||battleLoading)} onClick={generateBattle} disabled={!battleA||!battleB||battleLoading}>{battleLoading?"Simulating...":"Run Battle"}</button>
          {battleResult&&!battleResult.error&&(<div style={{...s.card,marginTop:16}}>
            <div style={{textAlign:"center",padding:"12px 0 14px",marginBottom:14,borderBottom:"1px solid var(--border2)"}}>
              <div style={{fontSize:9,color:"var(--text4)",letterSpacing:"0.15em",marginBottom:4}}>WINNER</div>
              <div style={{fontSize:24,fontWeight:"bold",color:battleResult.winner===battleResult.a?.heroName?battleResult.a?.color:battleResult.b?.color}}>{battleResult.winner}</div>
              <div style={{fontSize:10,color:"var(--text3)",marginTop:2,fontStyle:"italic"}}>{battleResult.margin} victory</div>
            </div>
            {battleResult.narrative&&<><span style={s.lbl}>Narrative</span><div style={{...s.pBox,marginBottom:12}}>{battleResult.narrative}</div></>}
            {battleResult.keyMoment&&<><span style={s.lbl}>Key Moment</span><div style={{...s.pBox,marginBottom:12,fontStyle:"italic",color:G}}>{battleResult.keyMoment}</div></>}
            {battleResult.finisher&&<><span style={s.lbl}>Finishing Move</span><div style={{...s.pBox,marginBottom:12,color:"#e74c3c"}}>{battleResult.finisher}</div></>}
            {(battleResult.aEdge||battleResult.bEdge)&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:4}}>
              {battleResult.aEdge&&<div style={{background:`${battleResult.a.color}0A`,border:`1px solid ${battleResult.a.color}33`,borderRadius:8,padding:"10px 12px"}}><div style={{fontSize:8,color:battleResult.a.color,letterSpacing:"0.1em",marginBottom:6}}>{battleResult.a.heroName} EDGE</div>{battleResult.aEdge.map((e,i)=><div key={i} style={{fontSize:10,color:"var(--text2)",marginBottom:3}}>· {e}</div>)}</div>}
              {battleResult.bEdge&&<div style={{background:`${battleResult.b.color}0A`,border:`1px solid ${battleResult.b.color}33`,borderRadius:8,padding:"10px 12px"}}><div style={{fontSize:8,color:battleResult.b.color,letterSpacing:"0.1em",marginBottom:6}}>{battleResult.b.heroName} EDGE</div>{battleResult.bEdge.map((e,i)=><div key={i} style={{fontSize:10,color:"var(--text2)",marginBottom:3}}>· {e}</div>)}</div>}
            </div>}
            <div style={{display:"flex",justifyContent:"flex-end",marginTop:10}}><button style={s.cpyBtn(copied.battle)} onClick={()=>copy("battle",[battleResult.narrative,battleResult.keyMoment,battleResult.finisher].filter(Boolean).join("\n\n"))}>{copied.battle?"Copied!":"Copy"}</button></div>
          </div>)}
          {battleResult?.error&&<div style={{marginTop:12,padding:"12px",background:"rgba(192,57,43,0.1)",border:"1px solid rgba(192,57,43,0.28)",borderRadius:8,fontSize:11,color:"#e74c3c"}}>Battle simulation failed — check Ollama is running.</div>}
        </>);
      })()}

      {/* ── ARC TAB ───────────────────────────────────────────────────── */}
      {tab==="arc"&&(<>
        <div style={{fontSize:9,letterSpacing:"0.2em",color:`${G}77`,textTransform:"uppercase",marginBottom:16}}>Arc Generator — Build a Story Arc</div>
        <div style={s.card}>
          <span style={s.lbl}>Arc Title</span>
          <input type="text" value={arcTitle} onChange={e=>setArcTitle(e.target.value)} placeholder="e.g. The Omega Protocol" style={{marginBottom:16}}/>
          <span style={s.lbl}>Villain / Threat</span>
          <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
            {villainPool.map(v=><button key={v.id} onClick={()=>setArcVillain(arcVillain===v.heroName?"":v.heroName)} style={{...s.chip(arcVillain===v.heroName,"#8B1A1A"),padding:"5px 12px"}}>{v.heroName}</button>)}
            <input type="text" value={arcVillain} onChange={e=>setArcVillain(e.target.value)} placeholder="Or type a name..." style={{flex:1,minWidth:140}}/>
          </div>
          <span style={s.lbl}>Teams Involved</span>
          <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:16}}>
            {teams.map(t=><button key={t.id} onClick={()=>setArcTeams(p=>p.includes(t.id)?p.filter(x=>x!==t.id):[...p,t.id])} style={{...s.chip(arcTeams.includes(t.id),t.color),padding:"5px 12px"}}>{t.name}</button>)}
            {arcTeams.length===0&&<div style={{fontSize:9,color:"var(--text4)",padding:"6px 4px"}}>None selected — uses active team</div>}
          </div>
          <div style={{display:"flex",gap:16,marginBottom:16,flexWrap:"wrap"}}>
            <div style={{flex:1,minWidth:160}}>
              <span style={s.lbl}>Tone</span>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>{TONES.map(t=><button key={t.id} style={s.chip(arcTone===t.id)} onClick={()=>setArcTone(t.id)}>{t.label}</button>)}</div>
            </div>
            <div>
              <span style={s.lbl}>Issues</span>
              <div style={{display:"flex",gap:6}}>{[3,4,5].map(n=><button key={n} style={{...s.chip(arcIssues===n),padding:"6px 14px"}} onClick={()=>setArcIssues(n)}>{n}</button>)}</div>
            </div>
          </div>
          <button style={s.bigBtn(arcLoading||!ollamaOk)} onClick={generateArc} disabled={arcLoading||!ollamaOk}>{arcLoading?"Writing arc...":"Generate Arc"}</button>
        </div>
        {arcResult&&!arcResult.error&&(<div style={{marginTop:16}}>
          <div style={{padding:"16px 18px",background:"rgba(212,175,55,0.06)",border:"1px solid rgba(212,175,55,0.25)",borderRadius:10,marginBottom:14}}>
            <div style={{fontSize:20,fontWeight:"bold",color:G,marginBottom:4}}>{arcResult.arcTitle}</div>
            <div style={{fontSize:12,color:"var(--text2)",fontStyle:"italic",marginBottom:8}}>{arcResult.tagline}</div>
            {arcResult.villainGoal&&<div style={{fontSize:10,color:"var(--text3)"}}><span style={{color:"#e74c3c"}}>Threat: </span>{arcResult.villainGoal}</div>}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {(arcResult.issues||[]).map(issue=><div key={issue.number} style={{padding:"14px 16px",background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,flexWrap:"wrap",gap:6}}>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <div style={{fontSize:8,color:"var(--text4)",letterSpacing:"0.1em",background:"rgba(255,255,255,0.05)",padding:"2px 7px",borderRadius:20}}>#{issue.number}</div>
                  <div style={{fontSize:13,fontWeight:"bold",color:"var(--text-primary)"}}>{issue.title}</div>
                </div>
                {issue.spotlightHero&&<div style={{fontSize:9,padding:"2px 9px",background:`${G}12`,border:`1px solid ${G}44`,borderRadius:20,color:G}}>★ {issue.spotlightHero}</div>}
              </div>
              <div style={{fontSize:11,color:"var(--text2)",lineHeight:1.65,marginBottom:8}}>{issue.summary}</div>
              {issue.villainMove&&<div style={{fontSize:10,color:"#e07070",marginBottom:5}}>⚠ {issue.villainMove}</div>}
              {issue.cliffhanger&&<div style={{fontSize:10,color:"var(--text3)",fontStyle:"italic",borderTop:"1px solid var(--border)",paddingTop:6,marginTop:4}}>↳ {issue.cliffhanger}</div>}
            </div>)}
          </div>
          {arcResult.resolution&&<div style={{marginTop:10,padding:"14px 16px",background:"rgba(93,202,165,0.06)",border:"1px solid rgba(93,202,165,0.25)",borderRadius:10}}>
            <div style={{fontSize:8,color:"#5DCAA5",letterSpacing:"0.1em",marginBottom:4}}>RESOLUTION</div>
            <div style={{fontSize:11,color:"var(--text2)",lineHeight:1.65}}>{arcResult.resolution}</div>
          </div>}
          {arcResult.teaser&&<div style={{marginTop:8,padding:"12px 16px",background:"rgba(212,175,55,0.04)",border:"1px solid rgba(212,175,55,0.18)",borderRadius:10}}>
            <div style={{fontSize:8,color:G,letterSpacing:"0.1em",marginBottom:4}}>NEXT ARC</div>
            <div style={{fontSize:11,color:"var(--text2)",fontStyle:"italic"}}>{arcResult.teaser}</div>
          </div>}
          <div style={{display:"flex",justifyContent:"flex-end",marginTop:12}}>
            <button style={s.cpyBtn(copied.arc)} onClick={()=>{const txt=(arcResult.issues||[]).map(i=>`Issue #${i.number}: ${i.title}\n${i.summary}${i.cliffhanger?"\n↳ "+i.cliffhanger:""}`).join("\n\n");copy("arc",`${arcResult.arcTitle}\n${arcResult.tagline}\n\n${txt}${arcResult.resolution?"\n\nResolution: "+arcResult.resolution:""}`)}}>{copied.arc?"Copied!":"Copy Arc"}</button>
          </div>
        </div>)}
        {arcResult?.error&&<div style={{marginTop:12,padding:"12px",background:"rgba(192,57,43,0.1)",border:"1px solid rgba(192,57,43,0.28)",borderRadius:8,fontSize:11,color:"#e74c3c"}}>Arc generation failed — check Ollama is running.</div>}
      </>)}

      {/* ── TIERS TAB ─────────────────────────────────────────────────── */}
      {tab==="tiers"&&(()=>{
        const cycleTier=m=>{
          const cur=tierOverrides[m.id]||autoTierFn(m);
          const tl=["S","A","B","C"];
          const nn={...tierOverrides,[m.id]:tl[(tl.indexOf(cur)+1)%tl.length]};
          setTierOverrides(nn);try{localStorage.setItem("forge-tiers",JSON.stringify(nn));}catch{}
        };
        return(<>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div style={{fontSize:9,letterSpacing:"0.2em",color:`${G}77`,textTransform:"uppercase"}}>Power Tier Rankings — All Characters</div>
            <button onClick={()=>{setTierOverrides({});try{localStorage.removeItem("forge-tiers");}catch{}}} style={{fontSize:9,padding:"3px 10px",background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:20,cursor:"pointer",color:"var(--text3)",fontFamily:"var(--font-mono)"}}>Reset</button>
          </div>
          {TIER_DEFS.map(tier=>{
            const members=allCharacters.filter(m=>(tierOverrides[m.id]||autoTierFn(m))===tier.id);
            return(<div key={tier.id} style={{display:"flex",alignItems:"stretch",marginBottom:8,minHeight:76,border:`1px solid ${tier.color}22`,borderRadius:10,overflow:"hidden"}}>
              <div style={{width:46,background:`${tier.color}14`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <div style={{fontSize:22,fontWeight:"bold",color:tier.color}}>{tier.id}</div>
              </div>
              <div style={{flex:1,display:"flex",flexWrap:"wrap",gap:8,padding:"10px 12px",alignItems:"center"}}>
                {members.length===0&&<div style={{fontSize:10,color:"var(--text4)",fontStyle:"italic"}}>—</div>}
                {members.map(m=><div key={m.id} onClick={()=>cycleTier(m)} title="Click to move to next tier" style={{display:"flex",alignItems:"center",gap:7,padding:"6px 10px",background:`${m.color}10`,border:`1px solid ${m.color}33`,borderRadius:8,cursor:"pointer"}}>
                  {images[m.id]?<img src={images[m.id]} alt="" style={{width:26,height:26,borderRadius:"50%",objectFit:"cover",objectPosition:"top",flexShrink:0}}/>:<div style={{width:26,height:26,borderRadius:"50%",background:`${m.color}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:"bold",color:m.color,flexShrink:0}}>{m.initials}</div>}
                  <div><div style={{fontSize:11,fontWeight:"bold",color:"var(--text-primary)"}}>{m.heroName}</div><div style={{fontSize:8,color:m.color}}>{autoScore(m)} avg</div></div>
                </div>)}
              </div>
            </div>);
          })}
          <div style={{marginTop:8,fontSize:9,color:"var(--text4)",textAlign:"center"}}>Click any character to cycle tier · Auto-ranked by average stats · Overrides saved locally</div>
        </>);
      })()}

      {/* ── FAMILY TREE TAB ───────────────────────────────────────────── */}
      {tab==="family"&&(()=>{
        // Gather all characters across active team + all villains
        const allChars=[...getTeamRoster(activeTeamId),...villainPool];
        const getChar=id=>allChars.find(c=>c.id===id);

        // Build hierarchy from parent-type links for layout
        const PARENT_RELS=new Set(["Parent","Grandparent","Adoptive Parent"]);
        const childrenOf={},parentsOf={};
        familyLinks.forEach(link=>{
          const aIsParent=PARENT_RELS.has(link.aRelation);
          const bIsParent=PARENT_RELS.has(link.bRelation);
          if(aIsParent){
            childrenOf[link.a]=[...(childrenOf[link.a]||[]),link.b];
            parentsOf[link.b]=[...(parentsOf[link.b]||[]),link.a];
          } else if(bIsParent){
            childrenOf[link.b]=[...(childrenOf[link.b]||[]),link.a];
            parentsOf[link.a]=[...(parentsOf[link.a]||[]),link.b];
          }
        });

        const charIds=[...new Set(familyLinks.flatMap(l=>[l.a,l.b]))];

        // BFS to assign generation level (0=oldest)
        const gen={};
        const assignGen=(id,level,visited=new Set())=>{
          if(visited.has(id))return;
          visited.add(id);
          if(gen[id]===undefined||gen[id]>level)gen[id]=level;
          (childrenOf[id]||[]).forEach(cid=>assignGen(cid,level+1,new Set(visited)));
        };
        charIds.filter(id=>!(parentsOf[id]?.length)).forEach(id=>assignGen(id,0));
        charIds.filter(id=>gen[id]===undefined).forEach(id=>{gen[id]=0;});

        const maxGen=charIds.length?Math.max(...charIds.map(id=>gen[id]||0)):0;
        const byGen={};
        for(let g=0;g<=maxGen;g++)byGen[g]=charIds.filter(id=>(gen[id]||0)===g);

        // Layout
        const W=760,nodeR=26,HGAP=68,VGAP=110;
        const pos={};
        Object.entries(byGen).forEach(([gStr,ids])=>{
          const g=parseInt(gStr);
          const totalW=ids.length*(nodeR*2)+(ids.length-1)*HGAP;
          const startX=(W-totalW)/2+nodeR;
          ids.forEach((id,i)=>{pos[id]={x:startX+i*(nodeR*2+HGAP),y:52+g*VGAP};});
        });
        const svgH=Math.max(200,(maxGen+1)*VGAP+90);

        // Relation colors
        const REL_COLOR={"Parent":"#D4AF37","Child":"#D4AF37","Grandparent":"#BA7517","Grandchild":"#BA7517","Sibling":"#5BA3D4","Twin":"#378ADD","Spouse":"#E07070","Aunt / Uncle":"#8B5CF6","Niece / Nephew":"#8B5CF6","Cousin":"#1D9E75","Adoptive Parent":"#F0997B","Adopted Child":"#F0997B","Clone of":"#888780","Original of":"#888780"};
        const relColor=rel=>REL_COLOR[rel]||"#777";
        const isHierarchical=rel=>PARENT_RELS.has(rel)||rel==="Child"||rel==="Grandchild"||rel==="Adopted Child";

        return(<>
          <div style={{fontSize:9,letterSpacing:"0.2em",color:`${G}77`,textTransform:"uppercase",marginBottom:14}}>Family Tree</div>

          {/* SVG Tree */}
          {charIds.length>0?(
            <div style={{background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:12,overflow:"hidden",marginBottom:20}}>
              <svg viewBox={`0 0 ${W} ${svgH}`} style={{width:"100%",display:"block"}}>
                {/* Links */}
                {familyLinks.map(link=>{
                  const pa=pos[link.a],pb=pos[link.b];
                  if(!pa||!pb)return null;
                  const color=relColor(link.aRelation);
                  const mx=(pa.x+pb.x)/2,my=(pa.y+pb.y)/2;
                  const hier=isHierarchical(link.aRelation)||isHierarchical(link.bRelation);
                  const top=pa.y<pb.y?pa:pb,bot=pa.y<pb.y?pb:pa;
                  return(
                    <g key={link.id}>
                      {hier?(
                        <path d={`M${top.x},${top.y+nodeR} C${top.x},${my} ${bot.x},${my} ${bot.x},${bot.y-nodeR}`}
                          fill="none" stroke={color} strokeWidth={1.8} strokeOpacity={0.65}/>
                      ):(
                        <line x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
                          stroke={color} strokeWidth={1.6} strokeOpacity={0.55}
                          strokeDasharray={link.aRelation==="Sibling"||link.aRelation==="Twin"?"none":"5,3"}/>
                      )}
                      <rect x={mx-24} y={my-8} width={48} height={14} rx={4} fill="var(--bg)" opacity={0.8}/>
                      <text x={mx} y={my+4} textAnchor="middle" fontSize="7" fill={color} fontFamily="monospace" fontWeight="bold">{link.aRelation}</text>
                    </g>
                  );
                })}
                {/* Nodes */}
                {charIds.map(id=>{
                  const p=pos[id];if(!p)return null;
                  const char=getChar(id);if(!char)return null;
                  const color=char.color||G;
                  const isActive=ftActiveNode===id;
                  return(
                    <g key={id} style={{cursor:"pointer"}} onClick={()=>setFtActiveNode(ftActiveNode===id?null:id)}>
                      {isActive&&<circle cx={p.x} cy={p.y} r={nodeR+6} fill={`${color}22`} stroke={color} strokeWidth={1.5} strokeOpacity={0.8}/>}
                      {images[id]?(
                        <>
                          <defs><clipPath id={`ft-c-${id}`}><circle cx={p.x} cy={p.y} r={nodeR}/></clipPath></defs>
                          <image href={images[id]} x={p.x-nodeR} y={p.y-nodeR} width={nodeR*2} height={nodeR*2} clipPath={`url(#ft-c-${id})`} preserveAspectRatio="xMidYMin slice"/>
                          <circle cx={p.x} cy={p.y} r={nodeR} fill="none" stroke={color} strokeWidth={isActive?2:1.5} strokeOpacity={0.85}/>
                        </>
                      ):(
                        <>
                          <circle cx={p.x} cy={p.y} r={nodeR} fill={`${color}18`} stroke={color} strokeWidth={isActive?2:1.5}/>
                          <text x={p.x} y={p.y+5} textAnchor="middle" fontSize="12" fontWeight="bold" fill={color} fontFamily="monospace">{char.initials}</text>
                        </>
                      )}
                      <text x={p.x} y={p.y+nodeR+14} textAnchor="middle" fontSize="8.5" fill="var(--text-primary)" fontFamily="monospace" fontWeight="bold">{char.heroName}</text>
                      {char.isVillain&&<text x={p.x} y={p.y+nodeR+25} textAnchor="middle" fontSize="7" fill="#E07070" fontFamily="monospace">VILLAIN</text>}
                    </g>
                  );
                })}
              </svg>
              {/* Legend */}
              <div style={{display:"flex",flexWrap:"wrap",gap:10,padding:"8px 14px 12px",borderTop:"1px solid var(--border)"}}>
                {[["#D4AF37","Parent / Child"],["#5BA3D4","Sibling / Twin"],["#E07070","Spouse"],["#8B5CF6","Aunt / Uncle"],["#1D9E75","Cousin"],["#F0997B","Adoptive"],["#BA7517","Grandparent"]].map(([color,label])=>(
                  <div key={label} style={{display:"flex",alignItems:"center",gap:5}}>
                    <div style={{width:18,height:2,background:color,borderRadius:1}}/>
                    <span style={{fontSize:8.5,color:"var(--text3)",fontFamily:"var(--font-mono)"}}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          ):(
            <div style={{textAlign:"center",padding:"36px 0",color:"var(--text3)",marginBottom:20,border:"1px dashed var(--border)",borderRadius:12}}>
              <div style={{fontSize:14,marginBottom:6,color:"var(--text-secondary)"}}>No family connections yet</div>
              <div style={{fontSize:10}}>Link two characters below to start building the family tree.</div>
            </div>
          )}

          {/* Active node detail */}
          {ftActiveNode&&(()=>{
            const char=getChar(ftActiveNode);
            if(!char)return null;
            const links=familyLinks.filter(l=>l.a===ftActiveNode||l.b===ftActiveNode);
            return(
              <div style={{marginBottom:20,padding:"14px 16px",background:`${char.color||G}0C`,border:`1px solid ${char.color||G}33`,borderRadius:10}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                  {images[ftActiveNode]&&<img src={images[ftActiveNode]} style={{width:36,height:36,borderRadius:"50%",objectFit:"cover",objectPosition:"top"}} alt=""/>}
                  <div>
                    <div style={{fontSize:14,fontWeight:"bold",color:"var(--text-primary)"}}>{char.heroName}</div>
                    <div style={{fontSize:10,color:char.color||G}}>{char.realName}</div>
                  </div>
                </div>
                {links.length>0&&(
                  <div style={{display:"flex",flexDirection:"column",gap:5}}>
                    {links.map(link=>{
                      const otherId=link.a===ftActiveNode?link.b:link.a;
                      const rel=link.a===ftActiveNode?link.aRelation:link.bRelation;
                      const other=getChar(otherId);
                      const color=relColor(rel);
                      return(
                        <div key={link.id} style={{fontSize:10,color:"var(--text2)",display:"flex",alignItems:"center",gap:6}}>
                          <span style={{color,fontWeight:"bold"}}>{rel} of</span>
                          <span style={{color:"var(--text-primary)"}}>{other?.heroName||otherId}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Add connection form */}
          <div style={{background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:10,padding:"16px 18px",marginBottom:20}}>
            <div style={{fontSize:9,letterSpacing:"0.18em",color:`${G}88`,textTransform:"uppercase",marginBottom:12}}>Add Family Connection</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
              <div>
                <div style={{fontSize:9,color:"var(--text3)",marginBottom:5,letterSpacing:"0.1em",textTransform:"uppercase"}}>Character A</div>
                <select value={ftAddA} onChange={e=>setFtAddA(e.target.value)} style={{width:"100%",padding:"8px 10px",background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:7,color:"var(--text-primary)",fontFamily:"var(--font-mono)",fontSize:11}}>
                  <option value="">Select character…</option>
                  {allChars.map(c=><option key={c.id} value={c.id}>{c.heroName}{c.isVillain?" ⚠":""}</option>)}
                </select>
              </div>
              <div>
                <div style={{fontSize:9,color:"var(--text3)",marginBottom:5,letterSpacing:"0.1em",textTransform:"uppercase"}}>Character B</div>
                <select value={ftAddB} onChange={e=>setFtAddB(e.target.value)} style={{width:"100%",padding:"8px 10px",background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:7,color:"var(--text-primary)",fontFamily:"var(--font-mono)",fontSize:11}}>
                  <option value="">Select character…</option>
                  {allChars.filter(c=>c.id!==ftAddA).map(c=><option key={c.id} value={c.id}>{c.heroName}{c.isVillain?" ⚠":""}</option>)}
                </select>
              </div>
            </div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:9,color:"var(--text3)",marginBottom:7,letterSpacing:"0.1em",textTransform:"uppercase"}}>A is B's…</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {FAMILY_RELATIONS.map(r=>(
                  <button key={r.id} onClick={()=>setFtAddRelation(r.id)}
                    style={{padding:"5px 11px",background:ftAddRelation===r.id?`${G}18`:"var(--bg-card)",border:`1px solid ${ftAddRelation===r.id?G:"var(--border)"}`,borderRadius:16,cursor:"pointer",fontSize:10,color:ftAddRelation===r.id?G:"var(--text3)",fontFamily:"var(--font-mono)",transition:"all 0.1s"}}>
                    {r.label}
                  </button>
                ))}
              </div>
              {ftAddA&&ftAddB&&(()=>{
                const rel=FAMILY_RELATIONS.find(r=>r.id===ftAddRelation);
                const cA=getChar(ftAddA),cB=getChar(ftAddB);
                if(!rel||!cA||!cB)return null;
                return<div style={{marginTop:9,fontSize:10,color:"var(--text3)",fontStyle:"italic"}}>{cA.heroName} is {cB.heroName}'s <span style={{color:relColor(rel.label),fontWeight:"bold"}}>{rel.label}</span> · {cB.heroName} is {cA.heroName}'s <span style={{color:relColor(rel.inverse),fontWeight:"bold"}}>{rel.inverse}</span></div>;
              })()}
            </div>
            <button onClick={addFamilyLink} disabled={!ftAddA||!ftAddB||ftAddA===ftAddB}
              style={{width:"100%",padding:"11px",background:(!ftAddA||!ftAddB||ftAddA===ftAddB)?"var(--bg-card)":`${G}14`,border:`1px solid ${(!ftAddA||!ftAddB||ftAddA===ftAddB)?"var(--border)":G}`,borderRadius:8,cursor:(!ftAddA||!ftAddB||ftAddA===ftAddB)?"not-allowed":"pointer",color:(!ftAddA||!ftAddB||ftAddA===ftAddB)?"var(--text3)":G,fontSize:10.5,letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"var(--font-mono)"}}>
              Add Connection →
            </button>
          </div>

          {/* Connection list */}
          {familyLinks.length>0&&(<>
            <div style={{fontSize:9,letterSpacing:"0.18em",color:`${G}88`,textTransform:"uppercase",marginBottom:10}}>All Connections ({familyLinks.length})</div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {familyLinks.map(link=>{
                const cA=getChar(link.a),cB=getChar(link.b);
                const color=relColor(link.aRelation);
                return(
                  <div key={link.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:9}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:color,flexShrink:0}}/>
                    <div style={{flex:1,fontSize:11}}>
                      <span style={{color:"var(--text-primary)",fontWeight:"bold"}}>{cA?.heroName||link.a}</span>
                      <span style={{color:color,margin:"0 7px"}}>is {link.aRelation} of</span>
                      <span style={{color:"var(--text-primary)",fontWeight:"bold"}}>{cB?.heroName||link.b}</span>
                    </div>
                    <button onClick={()=>removeFamilyLink(link.id)} style={{padding:"3px 9px",background:"rgba(163,45,45,0.1)",border:"1px solid rgba(163,45,45,0.25)",borderRadius:6,cursor:"pointer",color:"#e74c3c",fontSize:9,fontFamily:"var(--font-mono)",flexShrink:0}}>Remove</button>
                  </div>
                );
              })}
            </div>
          </>)}

          {/* ── Hero Associations ─────────────────────────────────────── */}
          <div style={{marginTop:28}}>
            <div style={{fontSize:9,letterSpacing:"0.2em",color:`${G}77`,textTransform:"uppercase",marginBottom:14}}>Hero Associations</div>
            <div style={{fontSize:9,color:"var(--text3)",marginBottom:14}}>Sidekick, partner, legacy ally, mentor — outside of team alliances</div>

            {/* Association list */}
            {heroAssocs.length===0?(
              <div style={{textAlign:"center",padding:"28px 0",color:"var(--text3)",marginBottom:20,border:"1px dashed var(--border)",borderRadius:12}}>
                <div style={{fontSize:13,marginBottom:6,color:"var(--text-secondary)"}}>No hero associations yet</div>
                <div style={{fontSize:10}}>Link two characters below to define their association.</div>
              </div>
            ):(
              <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:20}}>
                {heroAssocs.map(assoc=>{
                  const cA=getChar(assoc.a),cB=getChar(assoc.b);
                  const ASSOC_COLOR={"Sidekick of":"#5BA3D4","Has Sidekick":"#5BA3D4","Partner of":"#1D9E75","Protégé of":"#8B5CF6","Mentor of":"#8B5CF6","Legacy Ally of":"#D4AF37","Legacy Predecessor of":"#D4AF37"};
                  const color=ASSOC_COLOR[assoc.aRelation]||"#888";
                  return(
                    <div key={assoc.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:9}}>
                      <div style={{width:8,height:8,borderRadius:2,background:color,flexShrink:0}}/>
                      <div style={{flex:1,fontSize:11}}>
                        <span style={{color:"var(--text-primary)",fontWeight:"bold"}}>{cA?.heroName||assoc.a}</span>
                        <span style={{color,margin:"0 7px"}}>is {assoc.aRelation}</span>
                        <span style={{color:"var(--text-primary)",fontWeight:"bold"}}>{cB?.heroName||assoc.b}</span>
                      </div>
                      <button onClick={()=>removeHeroAssoc(assoc.id)} style={{padding:"3px 9px",background:"rgba(163,45,45,0.1)",border:"1px solid rgba(163,45,45,0.25)",borderRadius:6,cursor:"pointer",color:"#e74c3c",fontSize:9,fontFamily:"var(--font-mono)",flexShrink:0}}>Remove</button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add form */}
            <div style={{background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:10,padding:"16px 18px"}}>
              <div style={{fontSize:9,letterSpacing:"0.18em",color:`${G}88`,textTransform:"uppercase",marginBottom:12}}>Add Hero Association</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
                <div>
                  <div style={{fontSize:9,color:"var(--text3)",marginBottom:5,letterSpacing:"0.1em",textTransform:"uppercase"}}>Character A</div>
                  <select value={haAddA} onChange={e=>setHaAddA(e.target.value)} style={{width:"100%",padding:"8px 10px",background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:7,color:"var(--text-primary)",fontFamily:"var(--font-mono)",fontSize:11}}>
                    <option value="">Select character…</option>
                    {allChars.map(c=><option key={c.id} value={c.id}>{c.heroName}{c.isVillain?" ⚠":""}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{fontSize:9,color:"var(--text3)",marginBottom:5,letterSpacing:"0.1em",textTransform:"uppercase"}}>Character B</div>
                  <select value={haAddB} onChange={e=>setHaAddB(e.target.value)} style={{width:"100%",padding:"8px 10px",background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:7,color:"var(--text-primary)",fontFamily:"var(--font-mono)",fontSize:11}}>
                    <option value="">Select character…</option>
                    {allChars.filter(c=>c.id!==haAddA).map(c=><option key={c.id} value={c.id}>{c.heroName}{c.isVillain?" ⚠":""}</option>)}
                  </select>
                </div>
              </div>
              <div style={{marginBottom:12}}>
                <div style={{fontSize:9,color:"var(--text3)",marginBottom:7,letterSpacing:"0.1em",textTransform:"uppercase"}}>A is B's…</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {HERO_ASSOC_TYPES.map(t=>(
                    <button key={t.id} onClick={()=>setHaAddType(t.id)}
                      style={{padding:"5px 11px",background:haAddType===t.id?`${G}18`:"var(--bg-card)",border:`1px solid ${haAddType===t.id?G:"var(--border)"}`,borderRadius:16,cursor:"pointer",fontSize:10,color:haAddType===t.id?G:"var(--text3)",fontFamily:"var(--font-mono)",transition:"all 0.1s"}}>
                      {t.label}
                    </button>
                  ))}
                </div>
                {haAddA&&haAddB&&(()=>{
                  const t=HERO_ASSOC_TYPES.find(x=>x.id===haAddType);
                  const cA=getChar(haAddA),cB=getChar(haAddB);
                  if(!t||!cA||!cB)return null;
                  return<div style={{marginTop:9,fontSize:10,color:"var(--text3)",fontStyle:"italic"}}>{cA.heroName} <span style={{color:G,fontWeight:"bold"}}>{t.label}</span> {cB.heroName} · {cB.heroName} is their <span style={{color:G,fontWeight:"bold"}}>{t.inverse}</span></div>;
                })()}
              </div>
              <button onClick={addHeroAssoc} disabled={!haAddA||!haAddB||haAddA===haAddB}
                style={{width:"100%",padding:"11px",background:(!haAddA||!haAddB||haAddA===haAddB)?"var(--bg-card)":`${G}14`,border:`1px solid ${(!haAddA||!haAddB||haAddA===haAddB)?"var(--border)":G}`,borderRadius:8,cursor:(!haAddA||!haAddB||haAddA===haAddB)?"not-allowed":"pointer",color:(!haAddA||!haAddB||haAddA===haAddB)?"var(--text3)":G,fontSize:10.5,letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"var(--font-mono)"}}>
                Add Association →
              </button>
            </div>
          </div>
        </>);
      })()}

      {/* ── UNIVERSE MAP TAB ──────────────────────────────────────────── */}
      {tab==="universe"&&(()=>{
        const primaryTeam=teams[0];
        const otherTeams=teams.slice(1);
        if(!primaryTeam)return(<div style={{textAlign:"center",padding:"40px",color:"var(--text3)",fontSize:12}}>Create your first team to see the universe map.</div>);
        const pC={x:400,y:258};
        const RAD=188;
        const teamPos=otherTeams.map((t,i)=>{
          const a=(i/Math.max(otherTeams.length,1))*Math.PI*2-Math.PI/2;
          return{...t,x:pC.x+Math.cos(a)*RAD,y:pC.y+Math.sin(a)*RAD};
        });
        const primaryRoster=getTeamRoster(primaryTeam.id).slice(0,6);
        const ALINE={allied:"#0F6E56",rival:"#BA7517",enemy:"#8B1A1A",neutral:"#555555",splinter:"#993C1D",base:"#534AB7",member:"#534AB7"};
        return(<>
          <div style={{fontSize:9,letterSpacing:"0.2em",color:`${G}77`,textTransform:"uppercase",marginBottom:12}}>Universe Map — All Teams & Relationships</div>
          <div style={{background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:12,overflow:"hidden",marginBottom:12}}>
            <svg viewBox="0 0 800 516" style={{width:"100%",display:"block"}}>
              {teamPos.map(t=>{
                const lc=ALINE[t.nkAlignment]||"#555";
                const dash=t.nkAlignment==="enemy"?"8,5":t.nkAlignment==="rival"?"5,4":undefined;
                return <line key={t.id+"-l"} x1={pC.x} y1={pC.y} x2={t.x} y2={t.y} stroke={lc} strokeWidth={1.5} strokeOpacity={0.45} strokeDasharray={dash}/>;
              })}
              <circle cx={pC.x} cy={pC.y} r={70} fill={`${primaryTeam.color}10`} stroke={primaryTeam.color} strokeWidth={1.5} strokeOpacity={0.7}/>
              <text x={pC.x} y={pC.y-78} textAnchor="middle" fontSize="11" fill={primaryTeam.color} fontFamily="monospace" fontWeight="bold">{primaryTeam.abbr}</text>
              {primaryRoster.map((m,i)=>{
                const a=(i/Math.max(primaryRoster.length,1))*Math.PI*2-Math.PI/2;
                const mx=pC.x+Math.cos(a)*45,my=pC.y+Math.sin(a)*45;
                return(<g key={m.id}>
                  <defs><clipPath id={`um-${m.id}`}><circle cx={mx} cy={my} r={14}/></clipPath></defs>
                  <circle cx={mx} cy={my} r={16} fill={`${m.color}22`} stroke={m.color} strokeWidth={1.2}/>
                  {images[m.id]?<image href={images[m.id]} x={mx-14} y={my-14} width={28} height={28} clipPath={`url(#um-${m.id})`} preserveAspectRatio="xMidYMin slice"/>:<text x={mx} y={my+4} textAnchor="middle" fontSize="7" fontWeight="bold" fill={m.color} fontFamily="monospace">{m.initials}</text>}
                </g>);
              })}
              {teamPos.map(t=>{
                const roster=getTeamRoster(t.id).slice(0,5);
                const lc=ALINE[t.nkAlignment]||"#555";
                return(<g key={t.id}>
                  <circle cx={t.x} cy={t.y} r={50} fill={`${t.color}0E`} stroke={t.color} strokeWidth={1} strokeOpacity={0.6}/>
                  <text x={t.x} y={t.y+(roster.length?-58:-8)} textAnchor="middle" fontSize="9.5" fill={t.color} fontFamily="monospace" fontWeight="bold">{t.abbr}</text>
                  {roster.length>0&&<text x={t.x} y={t.y-47} textAnchor="middle" fontSize="7" fill={lc} fontFamily="monospace">{t.nkAlignment}</text>}
                  {roster.map((m,i)=>{
                    const a=(i/Math.max(roster.length,1))*Math.PI*2-Math.PI/2;
                    const mx=t.x+Math.cos(a)*30,my=t.y+Math.sin(a)*30;
                    return(<g key={m.id}>
                      <defs><clipPath id={`um2-${m.id}`}><circle cx={mx} cy={my} r={10}/></clipPath></defs>
                      <circle cx={mx} cy={my} r={11} fill={`${m.color}20`} stroke={m.color} strokeWidth={0.8}/>
                      {images[m.id]?<image href={images[m.id]} x={mx-10} y={my-10} width={20} height={20} clipPath={`url(#um2-${m.id})`} preserveAspectRatio="xMidYMin slice"/>:<text x={mx} y={my+3} textAnchor="middle" fontSize="5.5" fontWeight="bold" fill={m.color} fontFamily="monospace">{m.initials}</text>}
                    </g>);
                  })}
                </g>);
              })}
            </svg>
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:8}}>
            {[["allied","#0F6E56"],["rival","#BA7517"],["enemy","#8B1A1A"],["splinter","#993C1D"],["neutral","#555555"]].map(([k,c])=><div key={k} style={{display:"flex",alignItems:"center",gap:5,padding:"3px 9px",background:`${c}10`,border:`1px solid ${c}33`,borderRadius:20}}>
              <div style={{width:14,height:2,background:c,borderRadius:1}}/>
              <span style={{fontSize:9,color:c,fontFamily:"var(--font-mono)"}}>{k}</span>
            </div>)}
          </div>
          {otherTeams.length===0&&<div style={{textAlign:"center",padding:"16px",color:"var(--text3)",fontSize:11}}>Create additional teams in the Teams tab to populate the map. The first team ({primaryTeam.name}) anchors the center.</div>}
        </>);
      })()}

      {/* ── CODEX TAB ─────────────────────────────────────────────────── */}
      {tab==="codex"&&(()=>{
        const CodexCard=({title,accent,sections,tagline})=>(
          <div style={{background:"var(--bg3)",border:`1px solid ${accent}33`,borderRadius:12,marginBottom:20,overflow:"hidden"}}>
            <div style={{padding:"16px 20px 12px",borderBottom:`1px solid ${accent}22`,background:`${accent}08`}}>
              <div style={{fontSize:15,fontWeight:"bold",color:accent,fontFamily:"var(--font-mono)",letterSpacing:"0.05em",marginBottom:4}}>{title}</div>
              {tagline&&<div style={{fontSize:11,color:"var(--text3)",fontStyle:"italic"}}>{tagline}</div>}
            </div>
            <div style={{padding:"16px 20px"}}>
              {sections.map(([label,text])=>text?(
                <div key={label} style={{marginBottom:14}}>
                  <div style={{fontSize:8.5,letterSpacing:"0.18em",textTransform:"uppercase",color:`${accent}99`,fontFamily:"var(--font-mono)",marginBottom:5}}>{label}</div>
                  <div style={{fontSize:11.5,color:"var(--text2)",lineHeight:1.65}}>{text}</div>
                </div>
              ):null)}
            </div>
          </div>
        );
        const {zyrenian,auranthi,dravosi}=RACE_TREE.alien.subs.reduce((a,s)=>({...a,[s.id]:s}),{});
        const agene=RACE_TREE.mutate.subs.find(s=>s.id==="a_gene_mutate");
        return(<>
          <div style={{fontSize:9,letterSpacing:"0.2em",color:`${G}77`,textTransform:"uppercase",marginBottom:4}}>NK Universe Codex</div>
          <div style={{fontSize:11,color:"var(--text3)",marginBottom:22}}>Canonical lore for the three alien species and the A-Gene mutation. These backstories are original to the NK universe.</div>

          <div style={{fontSize:10,letterSpacing:"0.18em",textTransform:"uppercase",color:`${G}66`,fontFamily:"var(--font-mono)",marginBottom:12,paddingBottom:6,borderBottom:"1px solid var(--border)"}}>— Alien Species —</div>

          <CodexCard title="ZYRENIAN" accent="#B04A1A" tagline="War is not what they do. War is what they are."
            sections={[
              ["Overview",zyrenian?.lore],
              ["Homeworld",zyrenian?.codex?.homeworld],
              ["Biology — The Bloodline Response",zyrenian?.codex?.biology],
              ["Culture",zyrenian?.codex?.culture],
              ["Powers",zyrenian?.codex?.powers],
              ["In the NK Universe",zyrenian?.codex?.note],
            ]}/>

          <CodexCard title="AURANTHI" accent="#D4A020" tagline="They carry a civilization that no longer exists — encoded in their blood."
            sections={[
              ["Overview",auranthi?.lore],
              ["Homeworld",auranthi?.codex?.homeworld],
              ["Biology — Solar Saturation",auranthi?.codex?.biology],
              ["Culture",auranthi?.codex?.culture],
              ["Powers",auranthi?.codex?.powers],
              ["In the NK Universe",auranthi?.codex?.note],
            ]}/>

          <CodexCard title="DRAVOSI" accent="#5A5AE0" tagline="They are not cruel. They are orderly. That distinction makes them more dangerous."
            sections={[
              ["Overview",dravosi?.lore],
              ["Homeworld",dravosi?.codex?.homeworld],
              ["Biology — Biological Peak",dravosi?.codex?.biology],
              ["Culture — The Supremacy",dravosi?.codex?.culture],
              ["Powers",dravosi?.codex?.powers],
              ["In the NK Universe",dravosi?.codex?.note],
            ]}/>

          <div style={{fontSize:10,letterSpacing:"0.18em",textTransform:"uppercase",color:`${G}66`,fontFamily:"var(--font-mono)",marginBottom:12,paddingBottom:6,borderBottom:"1px solid var(--border)",marginTop:8}}>— Genetic Mutations —</div>

          <CodexCard title="A-GENE MUTATION" accent="#0F9E75" tagline="It didn't give them power. It removed the locks on the power they already had."
            sections={[
              ["Overview",agene?.codex?.overview],
              ["Biology — What the Gene Actually Does",agene?.codex?.biology],
              ["Activation",agene?.codex?.activation],
              ["Discovery & the Nexus Foundation",agene?.codex?.discovery],
              ["What It Means",agene?.codex?.note],
            ]}/>
        </>);
      })()}

    </div>

    {/* ── Solo Hero Creator Modal ──────────────────────────────────────────── */}
    {showSoloCreator&&(
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:1100,overflowY:"auto",display:"flex",justifyContent:"center",padding:"40px 20px"}}>
        <div style={{background:"var(--bg-base)",border:"1px solid rgba(136,135,128,0.25)",borderRadius:16,width:"100%",maxWidth:580,padding:"28px",height:"fit-content",boxShadow:"0 20px 60px rgba(0,0,0,0.6)"}}>
          {/* Header */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:22}}>
            <div>
              <div style={{fontSize:8.5,letterSpacing:"0.24em",color:"rgba(136,135,128,0.65)",textTransform:"uppercase",marginBottom:5,fontFamily:"var(--font-mono)"}}>Independent Hero</div>
              <div style={{fontSize:19,fontWeight:"900",color:"var(--text-primary)",letterSpacing:"0.02em"}}>Solo Hero Forge</div>
              <div style={{fontSize:11,color:"var(--text3)",marginTop:3}}>No team. Personal mission. Their own rogues gallery.</div>
            </div>
            <button onClick={()=>{setShowSoloCreator(false);resetSoloCreator();}} style={{background:"none",border:"none",cursor:"pointer",color:"var(--text3)",fontSize:22,padding:"2px 6px",lineHeight:1,flexShrink:0}}>×</button>
          </div>
          {/* Mode selector */}
          {!scResult&&(scStep===0&&scDeepPhase===0&&scProfileStep===0)&&(
            <div style={{display:"flex",gap:6,marginBottom:14}}>
              <button onClick={()=>{setScDeepMode(false);setScProfileMode(false);setScStep(0);setScDeepPhase(0);setScProfileStep(0);setScDeepAnswers({});setScProfileAnswers({});}} style={{flex:1,padding:"8px",background:!scDeepMode&&!scProfileMode?"rgba(136,135,128,0.15)":"var(--bg3)",border:`1px solid ${!scDeepMode&&!scProfileMode?"rgba(136,135,128,0.5)":"var(--border2)"}`,borderRadius:8,cursor:"pointer",fontFamily:"var(--font-mono)",textAlign:"center"}}>
                <div style={{fontSize:11,fontWeight:"bold",color:!scDeepMode&&!scProfileMode?"var(--text-primary)":"var(--text2)"}}>⚡ Quick</div>
                <div style={{fontSize:8.5,color:"var(--text3)",marginTop:1}}>6 questions</div>
              </button>
              <button onClick={()=>{setScDeepMode(true);setScProfileMode(false);setScStep(0);setScDeepPhase(0);setScProfileStep(0);setScAnswers({});setScProfileAnswers({});}} style={{flex:1,padding:"8px",background:scDeepMode?"rgba(136,135,128,0.15)":"var(--bg3)",border:`1px solid ${scDeepMode?"rgba(136,135,128,0.5)":"var(--border2)"}`,borderRadius:8,cursor:"pointer",fontFamily:"var(--font-mono)",textAlign:"center"}}>
                <div style={{fontSize:11,fontWeight:"bold",color:scDeepMode?"var(--text-primary)":"var(--text2)"}}>📚 Deep Forge</div>
                <div style={{fontSize:8.5,color:"var(--text3)",marginTop:1}}>7 lore phases</div>
              </button>
              <button onClick={()=>{setScProfileMode(true);setScDeepMode(false);setScStep(0);setScDeepPhase(0);setScProfileStep(0);setScAnswers({});setScDeepAnswers({});}} style={{flex:1,padding:"8px",background:scProfileMode?"rgba(136,135,128,0.15)":"var(--bg3)",border:`1px solid ${scProfileMode?"rgba(136,135,128,0.5)":"var(--border2)"}`,borderRadius:8,cursor:"pointer",fontFamily:"var(--font-mono)",textAlign:"center"}}>
                <div style={{fontSize:11,fontWeight:"bold",color:scProfileMode?"var(--text-primary)":"var(--text2)"}}>🧬 Personal</div>
                <div style={{fontSize:8.5,color:"var(--text3)",marginTop:1}}>25-answer profile</div>
              </button>
            </div>
          )}
          {/* Progress */}
          <div style={{height:3,background:"rgba(255,255,255,0.06)",borderRadius:2,marginBottom:18}}>
            <div style={{height:3,width:scResult?"100%":scProfileMode?`${(scProfileStep/6)*100}%`:scDeepMode?`${(scDeepPhase/(DEEP_LORE_PHASES.length+1))*100}%`:`${(scStep/(RECRUIT_QUIZ.length+1))*100}%`,background:"#888780",borderRadius:2,transition:"width 0.3s ease"}}/>
          </div>
          {/* Step 0 — Identity */}
          {!scResult&&scStep===0&&scDeepPhase===0&&scProfileStep===0&&(
            <div>
              <div style={{fontSize:14,fontWeight:"bold",color:"var(--text-primary)",marginBottom:14}}>Who is this hero?</div>
              <span style={s.lbl}>Hero Name <span style={{color:"#E07070"}}>*</span></span>
              <div style={{display:"flex",gap:6,marginBottom:12}}><input type="text" placeholder="e.g. Ironhawk" value={scHeroName} onChange={e=>setScHeroName(e.target.value)} style={{flex:1}}/><button onClick={()=>setScHeroName(randHeroName(scRace))} style={{padding:"0 12px",background:"var(--bg3)",border:"1px solid var(--border2)",borderRadius:8,cursor:"pointer",color:"var(--text2)",fontSize:16,flexShrink:0}}>⚄</button></div>
              <span style={s.lbl}>Real Name</span>
              <input type="text" placeholder="e.g. Devon Marshall" value={scName} onChange={e=>setScName(e.target.value)} style={{marginBottom:12}}/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                <div>
                  <span style={s.lbl}>Gender</span>
                  <select value={scGender} onChange={e=>setScGender(e.target.value)} style={{width:"100%",padding:"8px 10px",background:"var(--bg2)",border:"1px solid var(--border2)",borderRadius:7,color:"var(--text-primary)",fontSize:11,marginTop:4}}>
                    <option value="Male">Male</option><option value="Female">Female</option><option value="Non-binary">Non-binary</option><option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <span style={s.lbl}>Birth Year (optional)</span>
                  <input type="number" placeholder="e.g. 1995" value={scBirthYear} onChange={e=>{setScBirthYear(e.target.value);setScAge(e.target.value?String(2026-parseInt(e.target.value)):"");}} style={{marginTop:4,padding:"8px 10px"}}/>
                </div>
              </div>
              <div style={{marginBottom:12}}>
                <span style={s.lbl}>Story Direction (optional)</span>
                <textarea style={{height:52,fontSize:11,marginTop:4}} placeholder={`e.g. "Vigilante protecting one neighborhood" · "Former gov agent gone rogue" · "Alien stranded on Earth"`} value={scStoryDir} onChange={e=>setScStoryDir(e.target.value)}/>
              </div>
              <div style={{marginBottom:12}}>
                <span style={s.lbl}>Race <span style={{color:"#E07070"}}>*</span></span>
                <div style={{marginTop:6}}><RaceSelector value={scRace} onChange={setScRace} color={scColors[0]||"#888780"}/></div>
              </div>
              <span style={s.lbl}>Color Palette <span style={{color:"var(--text4)",fontWeight:"normal"}}>(up to 3)</span></span>
              <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:8}}>
                {ACCENT_COLORS.map(ac=>{const sel=scColors.includes(ac.hex);const idx=scColors.indexOf(ac.hex);return(<button key={ac.id} onClick={()=>toggleScColor(ac.hex)} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 10px",background:sel?`${ac.hex}18`:"var(--bg3)",border:`1px solid ${sel?ac.hex:"var(--border2)"}`,borderRadius:20,cursor:"pointer",fontFamily:"var(--font-mono)",fontSize:10.5,color:sel?"var(--text-primary)":"var(--text2)"}}><div style={{width:9,height:9,borderRadius:"50%",background:ac.hex}}/>{ac.label}{sel&&<span style={{fontSize:7.5,background:ac.hex,color:"#fff",borderRadius:"50%",width:13,height:13,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:"bold"}}>{idx+1}</span>}</button>);})}
              </div>
              <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:16}}>
                <input type="color" value={scCustomHex||"#ffffff"} onChange={e=>setScCustomHex(e.target.value)} style={{width:32,height:32,padding:2,border:"1px solid var(--border2)",borderRadius:6,cursor:"pointer",background:"var(--bg3)",flexShrink:0}}/>
                <input type="text" placeholder="#A3B2C1" value={scCustomHex} onChange={e=>setScCustomHex(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addCustomScColor()} style={{flex:1,padding:"6px 10px",fontFamily:"var(--font-mono)",fontSize:11}}/>
                <button onClick={addCustomScColor} disabled={scColors.length>=3} style={{padding:"6px 12px",background:scColors.length>=3?"var(--bg3)":`${G}14`,border:`1px solid ${scColors.length>=3?"var(--border2)":G}`,borderRadius:8,cursor:scColors.length>=3?"not-allowed":"pointer",color:scColors.length>=3?"var(--text4)":G,fontSize:10,fontFamily:"var(--font-mono)",flexShrink:0}}>+ Add</button>
              </div>
              <button onClick={()=>{if(!scHeroName.trim()&&!scName.trim())return;if(scDeepMode)setScDeepPhase(1);else if(scProfileMode)setScProfileStep(1);else setScStep(1);}} disabled={!scHeroName.trim()&&!scName.trim()} style={{width:"100%",...s.bigBtn(!scHeroName.trim()&&!scName.trim(),"#888780")}}>
                {scDeepMode?"Begin Deep Forge →":scProfileMode?"Begin Profile →":"Begin Forge →"}
              </button>
            </div>
          )}
          {/* Quick quiz steps */}
          {!scResult&&!scDeepMode&&!scProfileMode&&scStep>=1&&scStep<=RECRUIT_QUIZ.length&&(()=>{const q=RECRUIT_QUIZ[scStep-1];return(
            <div>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:10,color:"var(--text2)"}}>Question {scStep} of {RECRUIT_QUIZ.length}</span><span style={{fontSize:10,color:"#888780"}}>{Math.round((scStep/(RECRUIT_QUIZ.length+1))*100)}%</span></div>
              <div style={s.card}>
                <div style={{fontSize:14,fontWeight:"bold",color:"var(--text-primary)",marginBottom:16,lineHeight:1.4}}>{q.question}</div>
                {q.options.map(opt=><button key={opt.id} onClick={()=>{setScAnswers(p=>({...p,[q.id]:opt.id}));if(scStep<RECRUIT_QUIZ.length)setScStep(p=>p+1);}} style={s.optBtn(scAnswers[q.id]===opt.id,"#888780")}>{opt.label}</button>)}
                <div style={{display:"flex",gap:10,marginTop:10}}>
                  <button onClick={()=>scStep===1?setScStep(0):setScStep(p=>p-1)} style={{flex:1,padding:"10px",background:"var(--bg3)",border:"1px solid var(--border2)",borderRadius:8,cursor:"pointer",color:"var(--text3)",fontSize:10.5,fontFamily:"var(--font-mono)"}}>← Back</button>
                  {scStep===RECRUIT_QUIZ.length&&scAnswers[q.id]&&<button onClick={generateSoloHero} disabled={scLoading} style={{flex:2,...s.bigBtn(scLoading,"#888780"),marginTop:0}}>{scLoading?"Forging hero...":"Generate Solo Hero →"}</button>}
                </div>
              </div>
            </div>
          );})()}
          {/* Deep Forge phases */}
          {!scResult&&scDeepMode&&scDeepPhase>=1&&scDeepPhase<=DEEP_LORE_PHASES.length&&(()=>{
            const ph=DEEP_LORE_PHASES[scDeepPhase-1];
            const phaseComplete=ph.questions.every(q=>scDeepAnswers[q.id]);
            const isLast=scDeepPhase===DEEP_LORE_PHASES.length;
            return(<>
              <DeepLoreQuiz phase={scDeepPhase-1} answers={scDeepAnswers} onAnswer={(qid,oid)=>setScDeepAnswers(p=>({...p,[qid]:oid}))} accentColor="#888780"/>
              <div style={{display:"flex",gap:10,marginTop:14}}>
                <button onClick={()=>setScDeepPhase(p=>Math.max(0,p-1))} style={{flex:1,padding:"10px",background:"var(--bg3)",border:"1px solid var(--border2)",borderRadius:8,cursor:"pointer",color:"var(--text3)",fontSize:10.5,fontFamily:"var(--font-mono)"}}>← Back</button>
                {!isLast&&<button disabled={!phaseComplete} onClick={()=>setScDeepPhase(p=>p+1)} style={{flex:2,...s.bigBtn(!phaseComplete,"#888780"),marginTop:0}}>{phaseComplete?`Next: ${DEEP_LORE_PHASES[scDeepPhase]?.title||"Generate"} →`:"Answer all questions to continue"}</button>}
                {isLast&&<button disabled={!phaseComplete||scLoading} onClick={generateSoloHeroDeep} style={{flex:2,...s.bigBtn(!phaseComplete||scLoading,"#888780"),marginTop:0}}>{scLoading?"Forging hero...":phaseComplete?"Generate Deep Solo Hero →":"Answer all questions"}</button>}
              </div>
            </>);
          })()}
          {/* Personal Profile sections */}
          {!scResult&&scProfileMode&&scProfileStep>=1&&scProfileStep<=5&&(()=>{
            const sec=PERSONAL_PROFILE[scProfileStep-1];
            const secComplete=sec.questions.every(q=>scProfileAnswers[q.id]);
            const isLast=scProfileStep===5;
            return(<div style={s.card}>
              <div style={{fontSize:9,letterSpacing:"0.12em",color:"rgba(136,135,128,0.7)",textTransform:"uppercase",marginBottom:12}}>{sec.section} · {scProfileStep} of 5</div>
              {sec.questions.map(q=>(<div key={q.id} style={{marginBottom:14}}>
                <div style={{fontSize:13,fontWeight:"bold",color:"var(--text-primary)",marginBottom:8,lineHeight:1.4}}>{q.q}</div>
                {q.options.map(opt=><button key={opt.id} onClick={()=>setScProfileAnswers(p=>({...p,[q.id]:opt.id}))} style={s.optBtn(scProfileAnswers[q.id]===opt.id,"#888780")}>{opt.label}</button>)}
              </div>))}
              <div style={{display:"flex",gap:10,marginTop:6}}>
                <button onClick={()=>setScProfileStep(p=>Math.max(0,p-1))} style={{flex:1,padding:"10px",background:"var(--bg3)",border:"1px solid var(--border2)",borderRadius:8,cursor:"pointer",color:"var(--text3)",fontSize:10.5,fontFamily:"var(--font-mono)"}}>← Back</button>
                {!isLast&&<button disabled={!secComplete} onClick={()=>setScProfileStep(p=>p+1)} style={{flex:2,...s.bigBtn(!secComplete,"#888780"),marginTop:0}}>{secComplete?`Next: ${PERSONAL_PROFILE[scProfileStep]?.section} →`:"Answer all questions to continue"}</button>}
                {isLast&&<button disabled={!secComplete||scLoading} onClick={generateSoloHeroProfile} style={{flex:2,...s.bigBtn(!secComplete||scLoading,"#888780"),marginTop:0}}>{scLoading?"Forging hero...":secComplete?"Generate My Hero →":"Answer all questions"}</button>}
              </div>
            </div>);
          })()}
          {/* Loading */}
          {scLoading&&<div style={{padding:"14px",background:"var(--bg2)",border:"1px solid rgba(136,135,128,0.2)",borderRadius:8,fontSize:10,color:"var(--text3)",fontFamily:"var(--font-mono)",marginTop:10}}>Forging independent hero…</div>}
          {/* Result */}
          {scResult&&!scResult.error&&(<>
            <CharacterPage member={scResult} imageUrl={null} isVillain={false} teamName="Independent"/>
            <div style={{display:"flex",gap:10,marginTop:14}}>
              <button onClick={resetSoloCreator} style={{flex:1,padding:"11px",background:"var(--bg3)",border:"1px solid var(--border2)",borderRadius:8,cursor:"pointer",color:"var(--text2)",fontSize:10.5,fontFamily:"var(--font-mono)"}}>Regenerate</button>
              <button onClick={saveSoloHero} style={{flex:2,padding:"11px",background:"rgba(136,135,128,0.12)",border:"1px solid rgba(136,135,128,0.4)",borderRadius:8,cursor:"pointer",color:"var(--text-primary)",fontSize:10.5,letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"var(--font-mono)"}}>Add to Independents →</button>
            </div>
          </>)}
          {scResult?.error&&(<div style={{padding:"14px",background:"rgba(192,57,43,0.08)",border:"1px solid rgba(192,57,43,0.28)",borderRadius:10,marginBottom:8}}>
            <div style={{fontSize:11,color:"#e74c3c",marginBottom:10,fontFamily:"var(--font-mono)"}}>Generation failed: {scResult.msg}</div>
            <button onClick={resetSoloCreator} style={{padding:"9px 18px",background:"var(--bg3)",border:"1px solid var(--border2)",borderRadius:8,cursor:"pointer",color:"var(--text2)",fontSize:10.5,fontFamily:"var(--font-mono)"}}>↺ Try Again</button>
          </div>)}
        </div>
      </div>
    )}

    {/* ── Solo Hero Profile Modal ──────────────────────────────────────────── */}
    {activeSoloId&&(()=>{
      const hero=soloHeroes.find(h=>h.id===activeSoloId);
      if(!hero)return null;
      const rogues=soloVillains[activeSoloId]||[];
      const heroColor=hero.color||"#888780";
      const isAddingRogue=rogueMode===activeSoloId;
      return(
        <div style={{position:"fixed",inset:0,background:"var(--bg-base)",zIndex:1050,overflowY:"auto"}}>
          {/* Top bar */}
          <div style={{position:"sticky",top:0,zIndex:10,background:"var(--header-bg)",borderBottom:`1px solid ${heroColor}25`,padding:"12px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",backdropFilter:"blur(8px)"}}>
            <div style={{display:"flex",alignItems:"center",gap:14}}>
              <button onClick={()=>{setActiveSoloId(null);setSoloHeroView("profile");setRogueMode(null);setVStep(0);setVResult(null);setVAnswers({});setVName("");setVGender("Male");}} style={{padding:"6px 14px",background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:8,cursor:"pointer",color:"var(--text2)",fontSize:10.5,fontFamily:"var(--font-mono)"}}>← Back</button>
              <div>
                <div style={{fontSize:8,letterSpacing:"0.22em",color:"rgba(136,135,128,0.65)",textTransform:"uppercase",fontFamily:"var(--font-mono)",marginBottom:2}}>Independent Hero</div>
                <div style={{fontSize:16,fontWeight:"900",color:heroColor}}>{hero.heroName}</div>
              </div>
            </div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <label style={{cursor:"pointer",padding:"6px 12px",background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:8,fontSize:10,color:"var(--text3)",fontFamily:"var(--font-mono)"}}>
                Upload Image <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>e.target.files?.[0]&&handleImg(hero.id,e.target.files[0])}/>
              </label>
              {images[hero.id]&&<button onClick={()=>downloadImg(hero.id,hero.heroName)} style={{padding:"6px 12px",background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:8,cursor:"pointer",color:"var(--text3)",fontSize:10,fontFamily:"var(--font-mono)"}}>⬇ Save Image</button>}
              <button onClick={()=>requirePin(`Delete ${hero.heroName}`,()=>removeSoloHeroFn(hero.id))} style={{padding:"6px 12px",background:"rgba(163,45,45,0.08)",border:"1px solid rgba(163,45,45,0.25)",borderRadius:8,cursor:"pointer",color:"#e74c3c",fontSize:10,fontFamily:"var(--font-mono)"}}>Delete</button>
            </div>
          </div>

          {/* Sub-nav */}
          <div style={{display:"flex",gap:2,padding:"0 20px",borderBottom:`1px solid ${heroColor}18`,background:"var(--header-bg)"}}>
            {[["profile","Profile"],["rogues",`Rogues${rogues.length?` (${rogues.length})`:""}`,],["story","Story"]].map(([id,label])=>(
              <button key={id} onClick={()=>{setSoloHeroView(id);if(id!=="rogues"){setRogueMode(null);setVStep(0);setVResult(null);setVAnswers({});setVName("");setVGender("Male");}}} style={{padding:"10px 18px",background:"none",border:"none",borderBottom:soloHeroView===id?`2px solid ${heroColor}`:"2px solid transparent",cursor:"pointer",color:soloHeroView===id?"var(--text-primary)":"var(--text3)",fontSize:11,fontFamily:"var(--font-mono)",marginBottom:-1,transition:"color 0.15s"}}>{label}</button>
            ))}
          </div>

          <div style={{maxWidth:920,margin:"0 auto",padding:"24px 20px"}}>

            {/* Profile view */}
            {soloHeroView==="profile"&&(
              <CharacterPage member={hero} imageUrl={images[hero.id]||null} isVillain={false} teamName="Independent"/>
            )}

            {/* Rogues Gallery */}
            {soloHeroView==="rogues"&&(<>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
                <div>
                  <div style={{fontSize:9,letterSpacing:"0.2em",color:"rgba(139,26,26,0.7)",textTransform:"uppercase",marginBottom:4}}>Rogues Gallery</div>
                  <div style={{fontSize:12,color:"var(--text3)"}}>Villains personally tied to {hero.heroName}. Their story is intertwined.</div>
                </div>
                {!isAddingRogue&&<button onClick={()=>{setRogueMode(activeSoloId);setVStep(0);setVResult(null);setVAnswers({});setVName("");setVGender("Male");}} style={{padding:"8px 16px",background:"rgba(139,26,26,0.1)",border:"1px solid rgba(139,26,26,0.35)",borderRadius:8,cursor:"pointer",color:"#E07070",fontSize:10.5,fontFamily:"var(--font-mono)",whiteSpace:"nowrap"}}>+ Add Rogue</button>}
              </div>

              {/* Villain creation flow (reused, in rogueMode) */}
              {isAddingRogue&&(<>
                <div style={{padding:"10px 14px",background:`${heroColor}0A`,border:`1px solid ${heroColor}25`,borderRadius:8,fontSize:11,color:"var(--text2)",marginBottom:18}}>
                  Creating rogue for: <strong style={{color:heroColor}}>{hero.heroName}</strong>
                  <button onClick={()=>{setRogueMode(null);setVStep(0);setVResult(null);setVAnswers({});setVName("");setVGender("Male");}} style={{float:"right",background:"none",border:"none",cursor:"pointer",color:"var(--text4)",fontSize:13}}>×</button>
                </div>
                <div style={{marginBottom:20}}>
                  <div style={{height:3,background:"rgba(255,255,255,0.06)",borderRadius:2,marginBottom:6}}><div style={{height:3,width:`${vResult?100:(vStep/(VILLAIN_QUIZ.length+1))*100}%`,background:"#8B1A1A",borderRadius:2}}/></div>
                  <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:10,color:"var(--text2)"}}>{vResult?"Review rogue":`Question ${vStep} of ${VILLAIN_QUIZ.length}`}</span><span style={{fontSize:10,color:"#E07070"}}>{vResult?"Complete":`${Math.round((vStep/(VILLAIN_QUIZ.length+1))*100)}%`}</span></div>
                </div>
                {!vResult&&vStep===0&&(
                  <div style={s.card}>
                    <div style={{fontSize:13,fontWeight:"bold",color:"var(--text-primary)",marginBottom:12}}>Who is this rogue?</div>
                    <span style={s.lbl}>Real Name (optional)</span>
                    <input type="text" placeholder="e.g. Marcus Vane" value={vName} onChange={e=>setVName(e.target.value)} style={{marginBottom:10}}/>
                    <span style={s.lbl}>Gender</span>
                    <select value={vGender} onChange={e=>setVGender(e.target.value)} style={{width:"100%",padding:"8px 10px",background:"var(--bg2)",border:"1px solid var(--border2)",borderRadius:7,color:"var(--text-primary)",fontSize:11,marginTop:4,marginBottom:14}}>
                      <option value="Male">Male</option><option value="Female">Female</option><option value="Non-binary">Non-binary</option><option value="Other">Other</option>
                    </select>
                    <button style={s.bigBtn(false,"#8B1A1A")} onClick={()=>setVStep(1)}>Begin Threat Assessment →</button>
                  </div>
                )}
                {!vResult&&vStep>=1&&vStep<=VILLAIN_QUIZ.length&&(()=>{const vq=VILLAIN_QUIZ[vStep-1];return(
                  <div style={s.card}>
                    <div style={{fontSize:14,fontWeight:"bold",color:"var(--text-primary)",marginBottom:16,lineHeight:1.4}}>{vq.question}</div>
                    {vq.options.map(opt=><button key={opt.id} onClick={()=>{setVAnswers(p=>({...p,[vq.id]:opt.id}));if(vStep<VILLAIN_QUIZ.length)setVStep(p=>p+1);}} style={s.optBtn(vAnswers[vq.id]===opt.id,"#8B1A1A")}>{opt.label}</button>)}
                    <div style={{display:"flex",gap:10,marginTop:10}}>
                      <button onClick={()=>vStep===1?setVStep(0):setVStep(p=>p-1)} style={{flex:1,padding:"10px",background:"var(--bg3)",border:"1px solid var(--border2)",borderRadius:8,cursor:"pointer",color:"var(--text3)",fontSize:10.5,fontFamily:"var(--font-mono)"}}>← Back</button>
                      {vStep===VILLAIN_QUIZ.length&&vAnswers[vq.id]&&<button onClick={generateVillain} disabled={vLoading} style={{flex:2,...s.bigBtn(vLoading,"#8B1A1A"),marginTop:0}}>{vLoading?"Forging rogue...":"Generate Rogue →"}</button>}
                    </div>
                  </div>
                );})()}
                {vLoading&&<div style={{padding:"12px",background:"var(--bg2)",border:"1px solid rgba(139,26,26,0.2)",borderRadius:8,fontSize:10,color:"var(--text3)",fontFamily:"var(--font-mono)",marginTop:10}}>Forging rogue for {hero.heroName}…</div>}
                {vResult&&!vResult.error&&(<>
                  <CharacterPage member={vResult} imageUrl={null} isVillain={true}/>
                  <div style={{display:"flex",gap:10,marginTop:14,marginBottom:20}}>
                    <button onClick={()=>{setVResult(null);setVStep(0);setVAnswers({});setVDeepPhase(0);setVDeepAnswers({});setVProfileStep(0);setVProfileAnswers({});}} style={{flex:1,padding:"11px",background:"var(--bg3)",border:"1px solid var(--border2)",borderRadius:8,cursor:"pointer",color:"var(--text2)",fontSize:10.5,fontFamily:"var(--font-mono)"}}>Regenerate</button>
                    <button onClick={addVillain} style={{flex:2,padding:"11px",background:"rgba(139,26,26,0.2)",border:"1px solid #8B1A1A",borderRadius:8,cursor:"pointer",color:"#E07070",fontSize:10.5,letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"var(--font-mono)"}}>Add to Rogues Gallery →</button>
                  </div>
                </>)}
                {vResult?.error&&(<div style={{padding:"14px",background:"rgba(192,57,43,0.08)",border:"1px solid rgba(192,57,43,0.28)",borderRadius:10,marginBottom:16}}>
                  <div style={{fontSize:11,color:"#e74c3c",marginBottom:10,fontFamily:"var(--font-mono)"}}>Generation failed: {vResult.msg}</div>
                  <div style={{display:"flex",gap:10}}>
                    <button onClick={()=>setVResult(null)} style={{flex:1,padding:"10px",background:"var(--bg3)",border:"1px solid var(--border2)",borderRadius:8,cursor:"pointer",color:"var(--text2)",fontSize:10.5,fontFamily:"var(--font-mono)"}}>↺ Try Again</button>
                    <button onClick={saveBareVillain} style={{flex:2,padding:"10px",background:"rgba(139,26,26,0.15)",border:"1px solid rgba(139,26,26,0.5)",borderRadius:8,cursor:"pointer",color:"#E07070",fontSize:10.5,fontFamily:"var(--font-mono)"}}>Save Without AI →</button>
                  </div>
                </div>)}
              </>)}

              {/* Existing rogues */}
              {rogues.length===0&&!isAddingRogue&&<div style={{textAlign:"center",padding:"40px 20px",color:"var(--text4)",fontSize:12,fontStyle:"italic"}}>No rogues yet. Every solo hero needs a nemesis.</div>}
              {rogues.length>0&&(
                <div style={{display:"flex",flexDirection:"column",gap:10,marginTop:isAddingRogue?24:0}}>
                  {rogues.map(v=>(
                    <div key={v.id} style={{background:"rgba(139,26,26,0.07)",border:"1px solid rgba(139,26,26,0.22)",borderRadius:10,padding:"14px 16px"}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <div style={{width:36,height:36,borderRadius:"50%",background:"rgba(139,26,26,0.18)",border:"1px solid rgba(139,26,26,0.38)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:"bold",color:"#E07070",flexShrink:0}}>{v.initials}</div>
                          <div><div style={{fontSize:13,fontWeight:"bold",color:"var(--text-primary)"}}>{v.heroName}</div><div style={{fontSize:10,color:"var(--text3)"}}>{v.realName} · {v.role}</div></div>
                        </div>
                        <button onClick={()=>removeSoloRogueFn(activeSoloId,v.id)} style={{fontSize:9,padding:"3px 9px",background:"rgba(163,45,45,0.08)",border:"1px solid rgba(163,45,45,0.25)",borderRadius:6,cursor:"pointer",color:"#e74c3c",fontFamily:"var(--font-mono)"}}>Remove</button>
                      </div>
                      <div style={{fontSize:11,color:"var(--text3)",fontStyle:"italic",lineHeight:1.5}}>{v.tagline}</div>
                    </div>
                  ))}
                </div>
              )}
            </>)}

            {/* Story Generator */}
            {soloHeroView==="story"&&(<>
              <div style={{marginBottom:20}}>
                <div style={{fontSize:9,letterSpacing:"0.2em",color:`${heroColor}77`,textTransform:"uppercase",marginBottom:4}}>Solo Story</div>
                <div style={{fontSize:12,color:"var(--text3)"}}>Generate a cinematic scene between {hero.heroName} and their rogues.</div>
              </div>
              {rogues.length===0&&(
                <div style={{...s.card,textAlign:"center",padding:"30px"}}>
                  <div style={{fontSize:13,color:"var(--text3)",marginBottom:14}}>No rogues in the gallery yet.</div>
                  <button onClick={()=>setSoloHeroView("rogues")} style={{padding:"9px 20px",background:"rgba(139,26,26,0.1)",border:"1px solid rgba(139,26,26,0.3)",borderRadius:8,cursor:"pointer",color:"#E07070",fontSize:11,fontFamily:"var(--font-mono)"}}>Add a Rogue First</button>
                </div>
              )}
              {rogues.length>0&&(<>
                <div style={s.card}>
                  <div style={{fontSize:12,fontWeight:"bold",color:"var(--text-primary)",marginBottom:12}}>Cast of Rogues</div>
                  <div style={{fontSize:11,color:"var(--text3)",marginBottom:12}}>Select which rogues appear (leave all unchecked for the full gallery):</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:20}}>
                    {rogues.map(v=>(
                      <button key={v.id} onClick={()=>setSoloStoryRogueIds(p=>p.includes(v.id)?p.filter(x=>x!==v.id):[...p,v.id])} style={{...s.chip(soloStoryRogueIds.includes(v.id),"#8B1A1A"),display:"flex",alignItems:"center",gap:6}}>
                        <div style={{width:7,height:7,borderRadius:1,background:"#8B1A1A",flexShrink:0}}/>
                        {v.heroName}
                      </button>
                    ))}
                  </div>
                  <button onClick={()=>generateSoloStory(hero,rogues)} disabled={soloStoryLoading} style={s.bigBtn(soloStoryLoading,heroColor)}>{soloStoryLoading?"Writing scene...":"Generate Scene"}</button>
                </div>
                {soloStoryResult&&!soloStoryResult.error&&(
                  <div style={{...s.card,marginTop:16}}>
                    <div style={{fontSize:15,fontWeight:"bold",color:heroColor,marginBottom:14}}>{soloStoryResult.title}</div>
                    <div style={{fontSize:12,color:"var(--text2)",lineHeight:1.8,whiteSpace:"pre-wrap",marginBottom:16}}>{soloStoryResult.scene}</div>
                    <div style={{borderTop:"1px solid var(--border2)",paddingTop:12,display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                      <div><div style={{fontSize:8.5,letterSpacing:"0.16em",color:"var(--text4)",textTransform:"uppercase",marginBottom:4}}>Outcome</div><div style={{fontSize:11,color:"var(--text2)"}}>{soloStoryResult.outcome}</div></div>
                      <div><div style={{fontSize:8.5,letterSpacing:"0.16em",color:"var(--text4)",textTransform:"uppercase",marginBottom:4}}>Next Chapter Hook</div><div style={{fontSize:11,color:heroColor,fontStyle:"italic"}}>{soloStoryResult.hook}</div></div>
                    </div>
                  </div>
                )}
                {soloStoryResult?.error&&<div style={{padding:"12px",background:"rgba(192,57,43,0.08)",border:"1px solid rgba(192,57,43,0.25)",borderRadius:8,marginTop:14,fontSize:11,color:"#e74c3c",fontFamily:"var(--font-mono)"}}>{soloStoryResult.error}</div>}
              </>)}
            </>)}

          </div>
        </div>
      );
    })()}

  </div>);
}
