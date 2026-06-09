export const G="#D4AF37";

export const TEAM_COLORS=[
  {id:"violet",label:"Void Violet",hex:"#534AB7"},{id:"teal",label:"Cipher Teal",hex:"#0F6E56"},
  {id:"crimson",label:"Crimson",hex:"#A32D2D"},{id:"navy",label:"Resolve Blue",hex:"#185FA5"},
  {id:"amber",label:"Ember Amber",hex:"#BA7517"},{id:"jade",label:"Jade",hex:"#1D9E75"},
  {id:"rust",label:"Rust",hex:"#993C1D"},{id:"midnight",label:"Midnight",hex:"#2D1B69"},
  {id:"gunmetal",label:"Gunmetal",hex:"#3D4A5C"},{id:"magenta",label:"Magenta",hex:"#8B1A8B"},
  {id:"electric",label:"Electric",hex:"#0066CC"},{id:"forest",label:"Forest",hex:"#1A5C2A"},
];

export const TEAM_TYPES=[
  {id:"street",label:"Street Level"},
  {id:"urban",label:"Urban / City Scale"},
  {id:"regional",label:"Regional / National"},
  {id:"global",label:"Global Threat"},
  {id:"cosmic",label:"Cosmic / Supernatural"},
  {id:"government",label:"Government Agency"},{id:"underground",label:"Underground"},
  {id:"legacy",label:"Legacy Heroes"},{id:"tech",label:"Tech / Corporate"},
  {id:"international",label:"International"},{id:"vigilante",label:"Vigilante Network"},
];

export const NK_ALIGNMENTS=[
  {id:"allied",label:"Allied",color:"#0F6E56",desc:"Work together toward common goals"},
  {id:"rival",label:"Rivals",color:"#BA7517",desc:"Competing interests, not outright enemies"},
  {id:"enemy",label:"Enemies",color:"#8B1A1A",desc:"Active conflict"},
  {id:"neutral",label:"Neutral",color:"#888780",desc:"No established relationship"},
  {id:"splinter",label:"Splinter Cell",color:"#993C1D",desc:"Broke away from the primary team"},
];

export const ALIGN_META={
  base:{label:"Member",color:"#534AB7"},member:{label:"Member",color:"#534AB7"},
  allied:{label:"Allied",color:"#0F6E56"},rival:{label:"Rival",color:"#BA7517"},
  enemy:{label:"Enemy",color:"#8B1A1A"},neutral:{label:"Neutral",color:"#888780"},
  splinter:{label:"Splinter",color:"#993C1D"},
};

export const RACE_TREE={
  human:{label:"Human",hint:"Standard biological human. No innate powers — ability comes from training, gear, or external modification.",subs:[
    {id:"human",label:"Human",lore:"No biological enhancements — power comes entirely from discipline, skill, and will."},
    {id:"enhanced_human",label:"Enhanced Human",lore:"Biologically modified — serum, experiment, or gene therapy unlocked their abilities. Their humanity is intact but upgraded."},
    {id:"cybernetic_human",label:"Cybernetic Human",lore:"Technology fused into the body — part machine, part human, navigating identity between both worlds."},
  ]},
  mutate:{label:"Mutate",hint:"Human with a genetic mutation as the power source. The mutation may be inherited, triggered, or forced — but it defines who they are.",subs:[
    {id:"a_gene_mutate",label:"A-Gene Mutate",lore:"Born with a dormant aggression gene that activated — power is in the blood, not earned. They never asked for this.",
     codex:{overview:"The A-gene (Aggressive Gene) is a dormant sequence found in approximately 1 in 1.8 million humans. In its dormant state it reads as noncoding DNA. When activated, it does not create new biology — it removes the biological limiters that prevent the human body from exceeding its own structural limits.",biology:"The standard human body runs well below its theoretical performance ceiling. Muscular output is capped to prevent structural damage. Neural processing speed is throttled to prevent heat damage. Adrenaline response is metered to prevent cardiac events. The A-gene turns those protections off. An activated carrier has access to full biological output with no automatic cutoff — physical capability that outpaces any trained human. The body was not designed to run in this state indefinitely, so the A-gene compensates with an accelerated healing factor that emerges alongside activation. Powers are specific to each individual's baseline physiology and psychology; no two carriers are identical, but all trend toward aggression-expressing outputs: raw force, kinetic projection, speed, durability.",activation:"Every confirmed activation event was triggered by extreme stress — physiological, psychological, or both. The activation is not conscious. Carriers consistently describe blacking out or entering a dissociative state, then returning to awareness having done something they couldn't explain and couldn't immediately replicate. Initial activation is violent, disorienting, and dangerous. The first weeks are described as learning to drive something already going 90 mph.",discovery:"The A-gene was first isolated in 2019 by a research team funded through the Nexus Foundation — a private science organization later linked to classified government enhancement programs. The original paper was published, then quietly retracted. The researchers scattered. Multiple A-gene carriers have since reported contact from unknown parties shortly before their activation events — suggesting at minimum that someone has a list, and at most, that some activations were not spontaneous.",note:"A-gene carriers didn't choose this. That fact shapes nearly every carrier's psychological relationship to their power. It was not earned, not trained, not discovered willingly. It simply arrived. What they do with it is their only real choice."}},
    {id:"experiment_mutate",label:"Experiment Mutate",lore:"Deliberately altered by outside forces — a test subject who survived and turned the results into identity."},
    {id:"accident_mutate",label:"Accident Mutate",lore:"An unplanned event rewrote their biology — disaster became origin, mutation became purpose."},
  ]},
  alien:{label:"Alien",hint:"Not of this world. Power comes from biology, not modification. Three distinct species — each with a different relationship to strength, civilization, and purpose.",subs:[
    {id:"zyrenian",label:"Zyrenian",lore:"Battle-bred warrior race — power scales with combat experience, pride is genetic, and losing is not in their vocabulary. War is culture.",
     codex:{homeworld:"Zyrak (destroyed) — high-gravity volcanic world once ruled by 12 warring clans for ten millennia. Two centuries ago the clans escalated past the point of survival and burned the planet uninhabitable. Survivors scattered across the galaxy.",biology:"The Bloodline Response: every time a Zyrenian survives a genuine near-death combat event, their cells encode it — power ceiling increases permanently. A Zyrenian who has never truly been tested is weaker than their age suggests. One who has survived a hundred genuine battles is something else entirely. Atrophy is real: combat is biological fuel. Without conflict stimulus, enhanced capabilities slowly degrade.",culture:"Zyrenians have no word for surrender — only 'strategic withdrawal to return stronger,' which is considered intelligent. What they cannot tolerate is quitting. Deep clan loyalty earned through proven capability; once you've earned it, it is absolute and lifelong. They cannot follow someone they don't respect. But if you earn that respect in battle — or through courage they can read as battle — they will die for you without question.",powers:"Scaling strength ceiling, accelerated regeneration, extreme structural durability, combat-instinct neural processing that reads fights in real time.",note:"Displaced Zyrenians in the NK universe are mercenaries, exiles, or soldiers still searching for something worth fighting for. The rare ones who find a cause and redirect their full biology toward it are among the most dangerous beings on the planet."}},
    {id:"auranthi",label:"Auranthi",lore:"Solar-absorbing species from a dead world — immense power drawn from starlight, haunted by a lost civilization they carry alone.",
     codex:{homeworld:"Aureth Prime (destroyed) — twin-sun world whose civilization lasted 40,000 years. The Auranthi did not go to war. They built: libraries, architectures, sciences, medicines. Their civilization was two centuries ahead of any known parallel at the time of the end. The twin suns underwent spectral shift — a natural astronomical event that changed radiation frequency beyond what Auranthi biology could process. There was no enemy. Just physics.",biology:"Auranthi bodies are biological solar cells: they absorb stellar radiation and convert it into metabolic and physical energy. Under a yellow or blue-white star they enter solar saturation — enhanced strength, speed, flight, cellular regeneration, and energy projection. Without solar exposure, these capabilities decay. They do not rely on food as primary fuel. The civilizational archive of Aureth Prime is encoded in Auranthi DNA — not as accessible memory but as intuition. A carrier with no formal education may inexplicably understand advanced physics. The archive speaks through them.",culture:"The survivors carry their grief quietly. They understand on a cellular level that civilization is temporary — which makes them precise about what they do with their time. Many develop deep attachments to the worlds they settle on, not as replacement but as genuine love for what new civilizations can become. They protect what they care about with everything they have.",powers:"Solar saturation under yellow/blue star — flight, enhanced strength and speed, cellular regeneration, solar energy projection. Capabilities scale with star proximity and exposure time.",note:"Auranthi restraint is not weakness. It is philosophy. They have seen what power without purpose looks like. It looks like the spectral shift."}},
    {id:"dravosi",label:"Dravosi",lore:"Apex-predator empire builders — genetically perfected through 40,000 years of deliberate self-selection, driven by dominance, legacy, and the belief that strength is the only honest currency.",
     codex:{homeworld:"Dravoss — capital world of the Dravosi Supremacy, a 40-star-system empire that has expanded continuously for eight millennia. Built not on ideology but on one principle: the capable govern the rest.",biology:"Dravosi physiology represents the deliberate peak of biological development — 40,000 years of selective breeding amplified every natural advantage and eliminated every weakness. High-gravity origin gave them dense cellular structure and efficient musculature. Selective pressure removed disease susceptibility, pain tolerance limitations, and regenerative caps. They live 400-600 years aging past 30 almost imperceptibly, maintaining full physical capability until their final decades. They can survive brief vacuum exposure and process damage that would kill most species.",culture:"The Supremacy runs on one axiom: the capable govern the rest. What has no place in Dravosi society is voluntary weakness — failure to improve is a social transgression. What complicates the reading is that many Dravosi genuinely believe they are doing the galaxy a service. Subjugated worlds under the Supremacy are stable. Infrastructure is maintained. They are not wrong that their occupation produces order. They are not capable of understanding why that is insufficient. A Dravosi who encounters genuine resistance escalates immediately — not out of anger but out of curiosity. They want to know where the ceiling is.",powers:"Peak biological performance: strength, speed, and durability at the functional limit of biological life. Extended lifespan, vacuum resistance, rapid cellular repair. No exotic powers — just biology pushed to its absolute ceiling.",note:"Dravosi in the NK universe are scouts, exiles, or defectors. Exiles — cast out for failing the Supremacy's standards — have all the capability and none of the backing. They may be trying to prove something. Or they may have decided the Supremacy was wrong. Both make them unpredictable."}},
  ]},
  hybrid:{label:"Hybrid",hint:"Mixed heritage of two races. Choose both bloodlines — biology and history from each side shape who they are. The combination creates something entirely new.",subs:[]},
};

export function raceLabel(r){
  if(!r)return"";
  if(typeof r==="string")return r;
  if(r.main==="hybrid"){
    const l1=r.sub1?((RACE_TREE[r.sub1.main]?.subs||[]).find(s=>s.id===r.sub1.sub)?.label||r.sub1.sub||""):"";
    const l2=r.sub2?((RACE_TREE[r.sub2.main]?.subs||[]).find(s=>s.id===r.sub2.sub)?.label||r.sub2.sub||""):"";
    return l1&&l2?`Hybrid (${l1} · ${l2})`:"Hybrid";
  }
  return(RACE_TREE[r.main]?.subs||[]).find(s=>s.id===r.sub)?.label||r.sub||r.main||"";
}
export function raceLore(r){
  if(!r||typeof r==="string")return"";
  if(r.main==="hybrid"){
    const l1=r.sub1?((RACE_TREE[r.sub1.main]?.subs||[]).find(s=>s.id===r.sub1.sub)?.lore||""):"";
    const l2=r.sub2?((RACE_TREE[r.sub2.main]?.subs||[]).find(s=>s.id===r.sub2.sub)?.lore||""):"";
    return[l1,l2].filter(Boolean).join(" Their hybrid heritage blends both bloodlines.");
  }
  return(RACE_TREE[r.main]?.subs||[]).find(s=>s.id===r.sub)?.lore||"";
}

export const RECRUIT_QUIZ=[
  {id:"background",question:"What's your background?",options:[{id:"military",label:"Military / Law enforcement",value:"military discipline, tactical training, command instincts"},{id:"science",label:"Science / Academia",value:"scientific genius, analytical mind, research-driven"},{id:"tech",label:"Tech / Engineering",value:"tech prodigy, builder mindset, solves problems by creating tools"},{id:"street",label:"Street / Self-taught",value:"self-taught fighter, street survivor, raw resourcefulness"},{id:"athletics",label:"Athletics / Sports",value:"elite athlete, peak conditioning, competitive instinct"},{id:"arts",label:"Arts / Performance",value:"performer background, reads people instinctively"},]},
  {id:"fightStyle",question:"How do you approach a fight?",options:[{id:"brawler",label:"Head-on — overwhelming force",value:"aggressive frontline brawler"},{id:"tactician",label:"Calculate first, then strike",value:"tactical and precise, waits for the right moment"},{id:"adaptive",label:"Adapt to whatever comes",value:"fluid and adaptive, reads the fight in real-time"},{id:"support",label:"Hold the line, protect others",value:"defensive anchor, absorbs pressure"},{id:"stealth",label:"Unseen until it's over",value:"stealth-based, patient"},]},
  {id:"motivation",question:"What drives you to fight?",options:[{id:"vengeance",label:"Personal vendetta",value:"fueled by personal injustice"},{id:"protection",label:"Protect the people I love",value:"protective instinct is the core driver"},{id:"system",label:"Fix a broken system",value:"fights the structures that created the problem"},{id:"duty",label:"Pure sense of duty",value:"duty-driven, no personal reason needed"},{id:"curiosity",label:"Curiosity / Thrill of it",value:"drawn to danger"},]},
  {id:"powerOrigin",question:"What power origin fits?",options:[{id:"energy",label:"Energy / Ki / Cosmic",value:"internal energy or ki-based powers, aura projection"},{id:"tech",label:"Tech / Suit / Gadgets",value:"technology-based abilities, engineered suit"},{id:"bio",label:"Biology / Mutation",value:"biological enhancement, genetic mutation"},{id:"will",label:"Willpower / Manifestation",value:"willpower made physical"},{id:"elemental",label:"Elemental",value:"elemental control — fire, ice, lightning, earth, shadow, or light"},{id:"psychic",label:"Psychic / Mental",value:"telepathy, telekinesis, precognition"},]},
  {id:"personality",question:"Your personality type:",options:[{id:"proud",label:"Intense / Proud / Competitive",value:"intense pride and competitive drive"},{id:"strategic",label:"Strategic / Quiet / Calculated",value:"calm and calculating, speaks rarely but meaningfully"},{id:"chaotic",label:"Chaotic / Unpredictable / Brilliant",value:"brilliant chaos energy, unpredictable"},{id:"loyal",label:"Warm / Loyal / Unbreakable",value:"deeply loyal and warm, emotional anchor"},{id:"dark",label:"Brooding / Haunted / Driven",value:"haunted by something, controlled fury"},]},
  {id:"weakness",question:"Biggest weakness?",options:[{id:"ego",label:"Pride / Ego",value:"pride can blind them under pressure"},{id:"attachment",label:"Attachment to loved ones",value:"deeply vulnerable when someone is threatened"},{id:"toofar",label:"Going too far",value:"tendency to escalate beyond necessity"},{id:"doubt",label:"Self-doubt",value:"inner uncertainty that can freeze them"},{id:"control",label:"Loss of control over power",value:"power not fully stable — stress risks overload"},]},
];

export const VILLAIN_QUIZ=[
  {id:"scale",question:"Threat scale — how much damage can they actually do?",options:[
    {id:"personal",label:"Street-level — hunts individuals, surgical and personal",value:"personal-scale threat — hunts and destroys specific targets with surgical precision, leaves a trail of specific ruined lives"},
    {id:"city",label:"City-level — destabilizes whole neighborhoods or cities",value:"city-scale threat — commands operations that destabilize cities, controls territory through fear and force"},
    {id:"systemic",label:"Systemic — corrupts institutions, governments, economies",value:"systemic threat — infiltrates and corrupts governments, economies, and power structures from within"},
    {id:"apocalyptic",label:"Apocalyptic — mass casualties, global or existential stakes",value:"apocalyptic-scale threat — capable of mass casualties, operates on global or existential stakes, extinction-level ambition"},
    {id:"shadow",label:"The hand behind every crisis — unseen, never implicated",value:"shadow threat — the unseen architect behind catastrophes, puppeteers events while remaining invisible"},
  ]},
  {id:"evil",question:"How evil are they — where is the actual line?",options:[
    {id:"calculated",label:"Calculated — only destroys what serves the goal, no wasted cruelty",value:"calculated evil — cold and precise, harm is a tool not a pleasure, no unnecessary cruelty"},
    {id:"absolute",label:"Absolute — no lines remain, will burn everything without hesitation",value:"absolute evil — no moral floor left, destroys anyone and anything that stands in the way without pause or remorse"},
    {id:"convinced",label:"Convinced they're right — ideological certainty is the most dangerous evil",value:"ideologically certain villain — genuinely believes their cause is just, the conviction makes them incapable of doubt"},
    {id:"enjoys",label:"Enjoys it — cruelty is not a side effect, it is the point",value:"sadistic villain — derives real satisfaction from suffering, cruelty is the method and the reward"},
    {id:"reluctant",label:"Reluctant — knows exactly what they are and hates it",value:"reluctant villain — fully aware of their own evil, haunted by it, but cannot or will not stop"},
  ]},
  {id:"origin",question:"Root cause — what made them this?",options:[
    {id:"rage",label:"Rage — something was taken and everything has burned since",value:"rage-origin — something irreplaceable was destroyed, the grief calcified into fury that consumes everything"},
    {id:"ideology",label:"Ideology — a belief they will end the world to prove right",value:"ideology-driven — operates from a coherent but catastrophically wrong worldview, the cause justifies any atrocity"},
    {id:"survival",label:"Survival — crossed lines to protect themselves or someone they love",value:"survival-origin — became this to protect what they couldn't lose, crossed lines that could never be uncrossed"},
    {id:"ambition",label:"Ambition — wanted power and found this was the fastest path",value:"ambition-driven — pure hunger for power and dominance, the evil is just the most efficient route"},
    {id:"despair",label:"Despair — once believed in something, lost it completely, then broke everything",value:"despair-origin — former idealist who lost faith in the world being good, now actively dismantles what they couldn't save"},
  ]},
  {id:"method",question:"Primary weapon — how do they actually operate?",options:[
    {id:"force",label:"Direct force — overwhelming personal power, removes obstacles visibly",value:"direct-force operator — overwhelming personal power, confronts and destroys obstacles head-on"},
    {id:"manipulation",label:"Manipulation — uses people against each other, never the last face you see",value:"manipulation-based operator — weaponizes trust and relationships, the real threat is always indirect"},
    {id:"organization",label:"Organization — commands a network, strength in scale and structure",value:"organizational power — commands a network of operatives and assets, the threat multiplies through numbers"},
    {id:"terror",label:"Terror — psychological and emotional destruction is the weapon",value:"terror-based operator — psychological obliteration, fear is the primary weapon and the goal"},
    {id:"systemic",label:"Systematic — erodes safe structures from the inside",value:"systemic operator — dismantles institutions, economies, and stability from within, the enemy of every safe thing"},
  ]},
  {id:"selfimage",question:"Do they think they're the villain?",options:[
    {id:"hero",label:"No — completely convinced they are the hero of this story",value:"self-perceived hero — has fully rewritten their own narrative, their evil is heroism in their mind"},
    {id:"owns",label:"Yes — and they've made peace with it, the label is liberating",value:"self-aware villain at peace — acknowledges the evil, finds freedom in it, the villain label doesn't sting anymore"},
    {id:"irrelevant",label:"The label doesn't matter — good and evil are just constraints for the weak",value:"post-moral villain — operates beyond ethics entirely, good and evil are fictions useful for controlling others"},
    {id:"necessary",label:"Necessary evil — someone has to do what others won't",value:"necessary-evil self-image — believes they are doing what no one else has the stomach for, a burden they carry"},
    {id:"buried",label:"In too deep — the guilt is there but buried under everything else",value:"buried-guilt villain — knows what they are, suppressed the awareness to function, the guilt is a weapon waiting to be found"},
  ]},
];

export const SCENARIOS=[{id:"ambush",label:"Ambush",icon:"⚡",desc:"Caught off-guard"},{id:"infiltration",label:"Infiltration",icon:"👁",desc:"Stealth mission"},{id:"rescue",label:"Rescue",icon:"🔗",desc:"One hero captured"},{id:"confrontation",label:"Confrontation",icon:"💥",desc:"Direct face-off"},{id:"revelation",label:"Revelation",icon:"📁",desc:"Dark truth surfaces"},{id:"heist",label:"Heist",icon:"🎯",desc:"Extract a target"},{id:"crossover",label:"Crossover",icon:"🌐",desc:"Two teams collide"}];
export const TONES=[{id:"intense",label:"Intense"},{id:"dark",label:"Dark & Gritty"},{id:"triumphant",label:"Triumphant"},{id:"desperate",label:"Desperate"}];
export const TEAM_RANKS=[
  {id:"leader",label:"Leader",icon:"★",color:"#D4AF37"},
  {id:"second",label:"Second in Command",icon:"◆",color:"#AFA9EC"},
  {id:"vanguard",label:"Vanguard",icon:"▲",color:"#5DCAA5"},
  {id:"operative",label:"Operative",icon:null,color:"#888780"},
];

export const FAMILY_RELATIONS=[
  {id:"parent",label:"Parent",inverse:"Child"},
  {id:"child",label:"Child",inverse:"Parent"},
  {id:"sibling",label:"Sibling",inverse:"Sibling"},
  {id:"twin",label:"Twin",inverse:"Twin"},
  {id:"spouse",label:"Spouse",inverse:"Spouse"},
  {id:"grandparent",label:"Grandparent",inverse:"Grandchild"},
  {id:"grandchild",label:"Grandchild",inverse:"Grandparent"},
  {id:"aunt-uncle",label:"Aunt / Uncle",inverse:"Niece / Nephew"},
  {id:"niece-nephew",label:"Niece / Nephew",inverse:"Aunt / Uncle"},
  {id:"cousin",label:"Cousin",inverse:"Cousin"},
  {id:"adopted-parent",label:"Adoptive Parent",inverse:"Adopted Child"},
  {id:"adopted-child",label:"Adopted Child",inverse:"Adoptive Parent"},
  {id:"clone",label:"Clone of",inverse:"Original of"},
];
export const HERO_ASSOC_TYPES=[
  {id:"sidekick",  label:"Sidekick of",      inverse:"Has Sidekick"},
  {id:"partner",   label:"Partner of",        inverse:"Partner of"},
  {id:"protege",   label:"Protégé of",        inverse:"Mentor of"},
  {id:"mentor",    label:"Mentor of",         inverse:"Protégé of"},
  {id:"legacy",    label:"Legacy Ally of",    inverse:"Legacy Predecessor of"},
];
export const ART_STYLES=[{id:"comic",label:"Comic Art",text:"cinematic comic book character art, flat color with sharp ink lines, Marvel/DC quality"},{id:"rendered",label:"3D Render",text:"hyper-realistic CGI character render, cinematic lighting"},{id:"anime",label:"Anime",text:"high-quality anime illustration, dynamic shading, Shonen Jump style"},{id:"statue",label:"Statue",text:"collectible resin statue render, museum-quality painted figurine"}];
export const ACCENT_COLORS=[{id:"crimson",label:"Crimson",hex:"#A32D2D"},{id:"jade",label:"Jade",hex:"#1D9E75"},{id:"amber",label:"Amber",hex:"#BA7517"},{id:"silver",label:"Silver",hex:"#888780"},{id:"indigo",label:"Indigo",hex:"#4A3FA0"},{id:"copper",label:"Copper",hex:"#8B4513"},{id:"frost",label:"Frost",hex:"#378ADD"},{id:"violet",label:"Violet",hex:"#8B2FC9"}];
export const TIER_DEFS=[{id:"S",label:"S",color:"#D4AF37"},{id:"A",label:"A",color:"#5DCAA5"},{id:"B",label:"B",color:"#5EB1FF"},{id:"C",label:"C",color:"#888780"}];

export const _rp=a=>a[Math.floor(Math.random()*a.length)];
export const _NAMES={
  zyrenian:{
    single:["Karath","Vexor","Ziran","Drakan","Thorvex","Krazon","Razik","Volkar","Zeth","Kurath","Sazir","Braxon","Tavar","Gorex","Vraxis","Kazon","Zarkon","Rekath","Vaxis","Drakath","Khorven","Zarex","Brakthor","Vezrak","Kazoth"],
    prefix:["War","Blood","Iron","Ash","Void","Scar","Bone","Rage","Storm","Dusk","Hollow","Grim","Blaze","Crush","Rend"],
    suffix:["Breaker","Fang","Crest","Kin","Scar","Strike","Fall","Reign","Vex","Thorn","Crash","Born","Split","Mark","Burn"],
  },
  auranthi:{
    single:["Solenne","Auris","Lumenar","Caelian","Novaris","Solaris","Lumaire","Aurevan","Solveyn","Caelix","Novael","Auren","Celestrix","Lumanis","Aurael","Solmira","Caelum","Luminex","Novane","Aurevyn","Solvara","Caelris","Lumael","Aurenne","Solvanir"],
    prefix:["Solar","Nova","Star","Lume","Aure","Cael","Dawn","Solis","Lux","Veil","Astral","Caelo","Solus","Auric","Novan"],
    suffix:["born","veil","arc","prime","sol","flare","aris","mire","light","crest","rise","fall","shine","watch","burn"],
  },
  dravosi:{
    single:["Valdris","Korrath","Supremax","Dravaxis","Imperion","Vaelkor","Korven","Maldrix","Supremon","Vaeldross","Orthax","Maxerath","Valdrix","Supremar","Dravos","Maldaxis","Vaelthor","Orthomax","Supremek","Korrath","Valdrek","Dravosk","Imperak","Maxorath","Vaelkrath"],
    prefix:["Prime","Apex","Dread","Grand","Iron","Vael","Krath","Orth","Max","Supra","Arch","High","Steel","Drav","Kor"],
    suffix:["Dross","Axis","Rex","Rath","Fist","Mark","Thorn","Kor","Prime","Vex","Reign","Crush","Fall","Claw","Edge"],
  },
  a_gene:{
    single:["Fracture","Severance","Rend","Override","Threshold","Rampart","Faultline","Catalyst","Breakpoint","Overdrive","Zero Hour","Rupture","Shatter","Overload","Redline","Blowback","Incident","Surge","Flashpoint","Trigger","Cascade","Apex","Raw","Unbound","Unhinged"],
  },
  human:{
    prefix:["Iron","Shadow","Void","Crimson","Onyx","Silver","Neon","Apex","Titan","Nova","Obsidian","Midnight","Scarlet","Ghost","Forge","Static","Prism","Storm","Cipher","Null","Relic","Vex","Sable","Chrome","Dusk","Ember","Wraith","Pulse","Rift","Crest","Lance","Shade","Hollow","Razor","Signal","Carbon","Flux","Slate","Ash","Frost"],
    suffix:["Hawk","Strike","Claw","Edge","Fist","Bolt","Veil","Surge","Shade","Blade","Gate","Prime","Shift","Arc","Pulse","Drift","Wraith","Rift","Crest","Fang","Lance","Reign","Tempest","Mark","Coil","Beam","Spark","Watch","Cross","Lock","Burn","Wire","Crest","Fall","Point"],
  },
};
export const _TS=["Covenant","Legion","Vanguard","Order","Collective","Guard","Division","Syndicate","Brigade","Alliance","Phalanx","Corps","Council","Squadron","Force","Crew","Conclave","Unit","Compact","Watch"];
export const randTeamName=()=>`${_rp(_NAMES.human.prefix)} ${_rp(_TS)}`;
export function randHeroName(race){
  const sub=race?.sub||race;
  const main=race?.main;
  const r=Math.random();
  if(sub==="zyrenian"||main==="zyrenian"){const n=_NAMES.zyrenian;if(r<0.45)return _rp(n.single);if(r<0.75)return _rp(n.prefix)+_rp(n.suffix);return _rp(n.single);}
  if(sub==="auranthi"||main==="auranthi"){const n=_NAMES.auranthi;if(r<0.5)return _rp(n.single);if(r<0.78)return _rp(n.prefix)+_rp(n.suffix);return _rp(n.single);}
  if(sub==="dravosi"||main==="dravosi"){const n=_NAMES.dravosi;if(r<0.45)return _rp(n.single);if(r<0.75)return _rp(n.prefix)+" "+_rp(n.suffix);return _rp(n.single);}
  if(sub==="a_gene_mutate"||sub==="a_gene"){return _rp(_NAMES.a_gene.single);}
  const h=_NAMES.human;
  if(r<0.55)return _rp(h.prefix)+_rp(h.suffix);
  if(r<0.78)return _rp(h.prefix);
  return _rp(h.suffix);
}

export const DEEP_LORE_PHASES=[
  { id:"comicDNA", phase:1, title:"Comic DNA", subtitle:"Where does your hero come from?",
    questions:[
      { id:"universe", label:"Which comic universe is closest to your hero's world?",
        options:[{id:"marvel",label:"Marvel — grounded heroes with real problems"},{id:"dc",label:"DC — iconic symbols and mythic scale"},{id:"indie",label:"Image/Indie — dark, creator-driven, no rules"},{id:"shonen",label:"Manga / Shonen — power growth, rivalries, bonds"},{id:"seinen",label:"Manga / Seinen — mature, psychological, brutal"},{id:"mixed",label:"Mixed universe — pulls from everything"}]},
      { id:"keyInspo", label:"Pick the character whose energy most matches your hero:",
        options:[{id:"batman",label:"Batman — obsession, discipline, fear as a tool"},{id:"spiderman",label:"Spider-Man — responsibility, wit, never enough"},{id:"wolverine",label:"Wolverine — rage, survival, reluctant heart"},{id:"vegeta",label:"Vegeta — pride, rivalry, earned redemption"},{id:"deku",label:"Deku / Naruto — underdog, heart over power"},{id:"moonknight",label:"Moon Knight — fractured identity, brutal justice"},{id:"venom",label:"Venom / Anti-Venom — symbiotic chaos, gray morality"},{id:"blackpanther",label:"Black Panther — duty, nation, silent excellence"}]},
    ]},
  { id:"archetype", phase:2, title:"Archetype & Identity", subtitle:"Who are they beneath the mask?",
    questions:[
      { id:"heroArchetype", label:"What is their hero archetype?",
        options:[{id:"tragic",label:"Tragic Hero — greatness shadowed by loss"},{id:"reluctant",label:"Reluctant Hero — pulled in, never asked for this"},{id:"born",label:"Born Warrior — this is what they were always meant to be"},{id:"reformed",label:"Reformed Villain — trying to undo what they've done"},{id:"fallen",label:"Fallen Hero — was great, fell, fighting back up"},{id:"legacy",label:"Legacy Bearer — carrying someone else's mantle"},{id:"antihero",label:"Anti-Hero Vigilante — right goals, wrong methods"}]},
      { id:"secretID", label:"Do they have a secret identity?",
        options:[{id:"full",label:"Completely hidden — nobody knows"},{id:"partial",label:"Partially known — rumors exist"},{id:"trusted",label:"Known only to the inner circle"},{id:"none",label:"No secret — they are exactly who they appear to be"}]},
    ]},
  { id:"powerPhilosophy", phase:3, title:"Power Philosophy", subtitle:"How dangerous are they, really?",
    questions:[
      { id:"powerScale", label:"Power scale?",
        options:[{id:"street",label:"Street Level — one city block, personal scale"},{id:"urban",label:"Urban Level — a whole city feels it"},{id:"regional",label:"Regional — multiple cities, national news"},{id:"global",label:"Global Threat — world-altering potential"},{id:"cosmic",label:"Cosmic — reality itself bends"}]},
      { id:"powerCost", label:"How do their powers cost them?",
        options:[{id:"physical",label:"Physical toll — body breaks down under use"},{id:"mental",label:"Mental/emotional drain — clarity erodes"},{id:"timelimited",label:"Time-limited — bursts only, needs recovery"},{id:"emotional",label:"Emotional trigger — stronger when desperate, dangerous when angry"},{id:"nocost",label:"No cost — raw power, but that's almost scarier"}]},
    ]},
  { id:"visualID", phase:4, title:"Visual Identity", subtitle:"What does the world see?",
    questions:[
      { id:"build", label:"Physical presence?",
        options:[{id:"lean",label:"Lean and agile — speed reads before power"},{id:"athletic",label:"Athletic and balanced — nothing wasted"},{id:"powerhouse",label:"Powerhouse and imposing — rooms go quiet"},{id:"ethereal",label:"Graceful and ethereal — unsettling beauty"},{id:"monstrous",label:"Partially shifted — humanity and something else"}]},
      { id:"costume", label:"Costume philosophy?",
        options:[{id:"minimal",label:"Minimal and practical — nothing decorative"},{id:"armored",label:"Heavily armored — protection is the message"},{id:"symbolic",label:"Symbolic and iconic — the symbol IS the point"},{id:"stealth",label:"Stealth-focused — designed to disappear"},{id:"manifested",label:"Manifested — the costume IS the power taking form"}]},
    ]},
  { id:"powerVisual", phase:5, title:"Power Visual Style", subtitle:"What does it look like when they let loose?",
    questions:[
      { id:"fxStyle", label:"How do their powers look when active?",
        options:[{id:"energy",label:"Pure energy / light — brilliant, visible for blocks"},{id:"shadow",label:"Shadow / darkness — consumes light around them"},{id:"elemental",label:"Elemental — fire, ice, lightning, earth responding to them"},{id:"tech",label:"Tech-based — precise, mechanical, engineered"},{id:"bio",label:"Biological — the body visibly transforming in real time"},{id:"subtle",label:"Almost invisible — you only see the damage afterward"}]},
      { id:"auraPresence", label:"What does their aura / presence communicate?",
        options:[{id:"dread",label:"Dread — enemies hesitate before the first move"},{id:"hope",label:"Hope — allies fight harder just being near them"},{id:"unpredictability",label:"Unpredictability — nobody knows what they'll do next"},{id:"authority",label:"Authority — this person is in charge and everyone knows it"},{id:"wrongness",label:"Something is wrong with them — power that shouldn't exist"}]},
    ]},
  { id:"storyEngine", phase:6, title:"Story Engine", subtitle:"What drives the narrative?",
    questions:[
      { id:"coreArc", label:"Core narrative arc?",
        options:[{id:"revenge",label:"Revenge arc — someone wronged them and they remember everything"},{id:"redemption",label:"Redemption arc — they wronged someone and they know it"},{id:"discovery",label:"Discovery arc — still learning who they really are"},{id:"legacy",label:"Legacy arc — living up to or escaping a predecessor"},{id:"survival",label:"Survival arc — just trying to not lose what they have left"}]},
      { id:"lineTheyWontCross", label:"What would push them across the line they swore never to cross?",
        options:[{id:"harmteam",label:"Someone hurting the people they protect"},{id:"betrayal",label:"A betrayal by someone they trusted completely"},{id:"poweroverwhelm",label:"Power overwhelming their self-control"},{id:"noother",label:"Absolute certainty there is no other way"},{id:"alreadycrossed",label:"They already crossed it once. They're pretending they didn't."}]},
    ]},
  { id:"teamRole", phase:7, title:"Team Role & Motivation", subtitle:"Where do they fit and what do they want?",
    questions:[
      { id:"teamFunction", label:"What is their function on the team?",
        options:[{id:"muscle",label:"The Muscle — raw power, the threat that ends fights"},{id:"brain",label:"The Brain — the plan is always theirs"},{id:"heart",label:"The Heart — the reason everyone else keeps going"},{id:"wildcard",label:"The Wild Card — unpredictable, indispensable, terrifying"},{id:"specialist",label:"The Specialist — one thing, done perfectly, every time"}]},
      { id:"deepWant", label:"What do they want that the team cannot give them?",
        options:[{id:"absolution",label:"Absolution for something they did"},{id:"belonging",label:"A real home — somewhere they actually belong"},{id:"recognition",label:"Recognition from one specific person who hasn't given it"},{id:"normal",label:"To feel normal again — just once"},{id:"equal",label:"A worthy equal — someone who truly understands what they are"}]},
    ]},
];

export const PERSONAL_PROFILE=[
  {section:"Identity & Presence",questions:[
    {id:"pp_entry",q:"How do people first notice you when you walk in?",options:[{id:"a",label:"The energy shifts — people feel it before they see you",value:"commanding presence, the air changes when they enter"},{id:"b",label:"You're already talking to someone — you pulled them in immediately",value:"magnetic, immediately connecting, draws people in"},{id:"c",label:"You find a corner and observe everything first",value:"quiet watcher, strategic observer, reads the room before engaging"},{id:"d",label:"You come in loudly — there's no question you arrived",value:"disruptive force, loud arrival, impossible to ignore"}]},
    {id:"pp_energy",q:"What word do people use to describe your energy to someone who hasn't met you?",options:[{id:"a",label:"Intense — there's a weight to you even when you're relaxed",value:"intense, heavy gravity, focused energy"},{id:"b",label:"Warm — you make people feel seen immediately",value:"warm, disarming, people trust them instantly"},{id:"c",label:"Sharp — they'll say you're perceptive to the point of unsettling",value:"sharp, perceptive, reads people in seconds"},{id:"d",label:"Unpredictable — you keep people on their toes and they like it",value:"unpredictable, electric, hard to pin down"}]},
    {id:"pp_role",q:"What role do you naturally fill in a group?",options:[{id:"a",label:"The anchor — people stabilize around you",value:"anchor, stabilizer, the constant others orbit"},{id:"b",label:"The spark — you set things in motion",value:"catalyst, ignites action, shifts the group's momentum"},{id:"c",label:"The strategist — you're already three steps ahead",value:"strategist, sees the angles others miss"},{id:"d",label:"The truth-teller — you say what no one else will",value:"truth-teller, cuts through noise, says the hard thing"}]},
    {id:"pp_stress",q:"How do you carry stress — what does that look like on the outside?",options:[{id:"a",label:"You get quieter. Stillness before the storm.",value:"controlled stillness under pressure, silence before action"},{id:"b",label:"You get sharper. Every word has a purpose.",value:"precision increases under stress, calculated and deliberate"},{id:"c",label:"You keep moving. Action is how you process.",value:"kinetic processor, movement-driven, stress becomes momentum"},{id:"d",label:"You laugh. Humor is your armor.",value:"uses humor as armor, disarms tension with wit"}]},
    {id:"pp_hidden",q:"What version of you do people rarely see?",options:[{id:"a",label:"The vulnerable one — you carry more than you show",value:"carries hidden weight, deeper vulnerability beneath the exterior"},{id:"b",label:"The ruthless one — you can make the hard call without hesitation",value:"capable of ruthlessness when it matters, the cold decision"},{id:"c",label:"The playful one — you're much funnier than you let on",value:"genuine playfulness hidden behind the serious front"},{id:"d",label:"The terrified one — a fear you've built your whole identity around",value:"core fear driving everything, built strength over original terror"}]}
  ]},
  {section:"Strengths & Skills",questions:[
    {id:"pp_flow",q:"What can you do for hours without noticing time pass?",options:[{id:"a",label:"Build or create something with your hands or mind",value:"builder, creator, flow state through making"},{id:"b",label:"Solve a problem — the harder, the better",value:"problem-solver, thrives in complexity and challenge"},{id:"c",label:"Move your body — train, compete, perform",value:"physical mastery, body as primary instrument"},{id:"d",label:"Connect — conversation, coaching, leading people",value:"human connector, thrives in interpersonal depth"}]},
    {id:"pp_gift",q:"What do people come to you for that you take for granted?",options:[{id:"a",label:"Making sense of chaos — you organize the unseen",value:"pattern recognition, turns chaos into clarity"},{id:"b",label:"Reading people — you know what someone needs before they say it",value:"emotional intelligence, reads subtext and intent instantly"},{id:"c",label:"Getting things done — you execute when others theorize",value:"executer, action over analysis, gets it moving"},{id:"d",label:"Being honest — people trust your read",value:"trusted advisor, radical honesty people rely on"}]},
    {id:"pp_solve",q:"How do you solve problems — instinct or system?",options:[{id:"a",label:"Pure instinct — you trust your gut and it's usually right",value:"instinct-driven, gut-trusting, rapid accurate reads"},{id:"b",label:"System first — you map it before you move",value:"systematic thinker, maps before acting, structured approach"},{id:"c",label:"Both — you run the system to confirm what your gut already said",value:"hybrid, uses system to validate instinct"},{id:"d",label:"Neither — you improvise in the moment",value:"improvisational, present-moment solver, adapts on the fly"}]},
    {id:"pp_exceptional",q:"What physical or mental trait do you know is exceptional?",options:[{id:"a",label:"Endurance — you outlast everyone",value:"extraordinary endurance, built to outlast"},{id:"b",label:"Speed of thought — you process faster than the room",value:"exceptional processing speed, fastest thinker in range"},{id:"c",label:"Physical ability — strength, precision, or agility",value:"physical excellence, body performs at peak in one key domain"},{id:"d",label:"Memory or pattern recognition — you see what others miss",value:"photographic or pattern memory, notices what others overlook"}]},
    {id:"pp_team_super",q:"What's your superpower in a team setting?",options:[{id:"a",label:"You make everyone around you better without trying",value:"elevates others, natural team multiplier"},{id:"b",label:"You stay calm when everyone else breaks",value:"unbreakable composure, steadies the team under fire"},{id:"c",label:"You see the winning move when everyone else sees the problem",value:"finds the path when others see a wall"},{id:"d",label:"You take the hit so others don't have to",value:"shield, absorbs the worst so others can keep going"}]}
  ]},
  {section:"Conflict & Combat",questions:[
    {id:"pp_pushed",q:"When you're truly pushed — what actually comes out?",options:[{id:"a",label:"Focused fury — everything sharpens, you become the threat",value:"focused wrath, everything sharpens under extreme pressure"},{id:"b",label:"Cold calm — you go completely still and terrifying",value:"cold calm under fire, stillness becomes the threat"},{id:"c",label:"Primal force — something older and rawer takes over",value:"primal surge, raw force from a deeper layer of self"},{id:"d",label:"Strategy — pressure makes you smarter, not angrier",value:"pressure-forged intelligence, threat unlocks strategic clarity"}]},
    {id:"pp_conflict_type",q:"What kind of conflict brings out your best?",options:[{id:"a",label:"A worthy opponent — someone who actually challenges you",value:"thrives against worthy opposition, match brings out full capacity"},{id:"b",label:"Protecting something — a person, a principle, a promise",value:"protector mode unlocks peak performance"},{id:"c",label:"Impossible odds — when the math says you can't win",value:"performs best when the situation is statistically hopeless"},{id:"d",label:"Unfinished business — something personal is on the line",value:"motivated by personal stakes, old wounds become fuel"}]},
    {id:"pp_underestimated",q:"How do you respond when someone underestimates you?",options:[{id:"a",label:"You let them — then you end the conversation",value:"weaponizes being underestimated, patience then precision"},{id:"b",label:"It fuels you — that doubt becomes your energy source",value:"underestimation as fuel, converts doubt into drive"},{id:"c",label:"You correct it immediately — you don't play games",value:"refuses to be underestimated, asserts immediately"},{id:"d",label:"You don't notice — you're focused on what you're doing",value:"mission-focused, immune to external perception"}]},
    {id:"pp_line",q:"What crosses the line for you? What ends your restraint?",options:[{id:"a",label:"Someone hurting someone who can't defend themselves",value:"protector trigger, ends restraint when the vulnerable are threatened"},{id:"b",label:"Betrayal — someone breaking trust they were given",value:"betrayal is the unforgivable trigger, trust violation ends mercy"},{id:"c",label:"Being lied to or manipulated",value:"deception is the line, manipulation ends patience"},{id:"d",label:"Injustice — the wrong person paying the price",value:"injustice is the trigger, when the wrong person suffers"}]},
    {id:"pp_odds",q:"When the odds are completely stacked against you — what's your move?",options:[{id:"a",label:"Narrow the problem — find the one angle they didn't account for",value:"collapses the problem to the one exploitable edge"},{id:"b",label:"Absorb the pressure and outlast — they'll crack first",value:"outlasts the opposition, endurance becomes the weapon"},{id:"c",label:"Go bigger — if you're going to lose, make it legendary",value:"escalates into it, legendary effort over safe retreat"},{id:"d",label:"Change the rules — redefine what winning means",value:"reframes the game entirely, changes what success looks like"}]}
  ]},
  {section:"Emotional Core",questions:[
    {id:"pp_proving",q:"What are you still proving — and to who?",options:[{id:"a",label:"That you belong here — there's still a voice that says you don't",value:"belonging wound, drives everything — still earning the seat"},{id:"b",label:"That you're more than what they wrote you off as",value:"underdog origin, rewriting someone else's verdict"},{id:"c",label:"That you made the right call on the thing that cost you",value:"justifying a sacrifice or choice that changed everything"},{id:"d",label:"Nothing — you stopped caring what anyone thinks",value:"fully self-defined, liberated from external validation"}]},
    {id:"pp_wound",q:"What loss or wound still quietly shapes your decisions?",options:[{id:"a",label:"A person you couldn't protect or keep",value:"loss of a person, the one they couldn't save"},{id:"b",label:"A version of yourself you left behind",value:"identity loss, mourning who they were before"},{id:"c",label:"A moment you failed when it mattered most",value:"failure at the critical moment, reshapes every decision since"},{id:"d",label:"Something that was taken that you didn't get to choose",value:"stolen — opportunity, identity, time — core wound is the theft"}]},
    {id:"pp_protects",q:"What do you protect at all costs?",options:[{id:"a",label:"A person or people — specific, named, irreplaceable",value:"specific protectee, the mission is always ultimately this person"},{id:"b",label:"A principle — something you will not compromise even if it costs you",value:"principle-bound, will sacrifice anything before compromising it"},{id:"c",label:"Your inner world — no one gets full access",value:"guards inner self fiercely, keeps the core shielded"},{id:"d",label:"The future — what you're building, what's possible",value:"future-protector, sacrifices the present for what's possible"}]},
    {id:"pp_walk",q:"What would make you walk away from the mission entirely?",options:[{id:"a",label:"The mission becoming what you were fighting against",value:"moral corruption of the mission itself"},{id:"b",label:"Losing the person the whole thing was for",value:"loses the anchor — the one who made it worth doing"},{id:"c",label:"Discovering the truth was a lie from the start",value:"foundational deception, the mission was built on false premise"},{id:"d",label:"You're the weapon and the collateral is people you love",value:"when the cost falls on the ones they protect"}]},
    {id:"pp_promise",q:"What promise have you made to yourself that you will not break?",options:[{id:"a",label:"Never lose yourself in the role you've been given",value:"remains human, never becomes the mask"},{id:"b",label:"Never stop fighting, even when the reason gets complicated",value:"relentless — the fight continues even when the reason blurs"},{id:"c",label:"Make it mean something — the sacrifice has to count",value:"the cost demands purpose, will not let it be wasted"},{id:"d",label:"Come back — no matter what it takes, you come back",value:"survival promise, always comes back from the impossible"}]}
  ]},
  {section:"Visual Identity",questions:[
    {id:"pp_color_feel",q:"What color or combination feels like you — not what you like, but what you are?",options:[{id:"a",label:"Deep absorbing darks — black, charcoal, void",value:"deep darks, void palette, absence as presence"},{id:"b",label:"Charged metallics — silver, gold, bronze, chrome",value:"metallic charge, earned brightness, forged quality"},{id:"c",label:"Rich saturated single color — one dominant tone",value:"single dominant saturated color, unwavering identity"},{id:"d",label:"Contrast — two colors in tension, neither wins",value:"high-contrast duality, two forces held in tension"}]},
    {id:"pp_movement",q:"How do you move your body when things get real?",options:[{id:"a",label:"Controlled and minimal — nothing wasted, everything deliberate",value:"economic movement, zero wasted motion, deliberate"},{id:"b",label:"Explosive and direct — shortest path, maximum force",value:"explosive directness, straight-line force, no ceremony"},{id:"c",label:"Fluid and adaptive — you redirect rather than resist",value:"fluid adaptation, redirects force, movement like water"},{id:"d",label:"Unpredictable — you break patterns on purpose",value:"pattern-breaking, unpredictable movement, impossible to read"}]},
    {id:"pp_power_visual",q:"What does your power leave behind when it touches the world?",options:[{id:"a",label:"Marks — scorch, fracture, echo, afterimage",value:"leaves marks: scorched ground, fractured surfaces, afterimages"},{id:"b",label:"Stillness — things simply stop, or never move again",value:"absolute stillness, things stop or cease — absence as power"},{id:"c",label:"Light or energy — visible, dramatic, lit up",value:"visible energy signature, dramatic light, seen from distance"},{id:"d",label:"Disruption — things nearby react to you, not just your target",value:"environmental disruption, proximity effect, field presence"}]},
    {id:"pp_power_texture",q:"If your power had a material or texture — what is it made of?",options:[{id:"a",label:"Something forged — steel, obsidian, iron",value:"forged material, hard-edged, formed under pressure"},{id:"b",label:"Something living — bone, vine, organism",value:"organic, living material, biological and primal"},{id:"c",label:"Something elemental — fire, void, lightning, water",value:"elemental, ancient force, natural phenomenon as weapon"},{id:"d",label:"Something built — circuitry, data, engineered systems",value:"constructed, technological, engineered precision"}]},
    {id:"pp_symbol",q:"What symbol, shape, or icon captures your identity?",options:[{id:"a",label:"Something unbreakable — shield, wall, anchor",value:"unbreakable symbol, shield or anchor, immovable object"},{id:"b",label:"Something sharp — blade, arrow, fracture line",value:"sharp symbol, blade or fracture, cutting through"},{id:"c",label:"Something in motion — wave, spiral, orbit",value:"kinetic symbol, continuous motion, never at rest"},{id:"d",label:"Something rare — eclipse, storm, singularity",value:"rare phenomenon symbol, unique in the world, singular event"}]}
  ]}
];

export const DEEP_VILLAIN_PHASES=[
  { id:"villainDNA", phase:1, title:"Villain DNA", subtitle:"What lineage of evil are they descended from?",
    questions:[
      { id:"universe", label:"Which villain archetype does their world feel closest to?",
        options:[{id:"marvel",label:"Marvel — grounded corruption, real consequences"},{id:"dc",label:"DC — symbolic evil, mythic scale, world-ending stakes"},{id:"indie",label:"Image/Indie — brutal, no rules, no redemption arc"},{id:"shonen",label:"Manga / Shonen — obsessive rivalry, overwhelming power"},{id:"seinen",label:"Manga / Seinen — psychological, systemic, disturbing"},{id:"mixed",label:"Mixed — borrows from everything, bows to nothing"}]},
      { id:"keyInspo", label:"Pick the villain whose presence most matches this threat:",
        options:[{id:"thanos",label:"Thanos — ideological certainty, galactic scale, quiet menace"},{id:"joker",label:"Joker — agent of chaos, weaponizes sanity itself"},{id:"magneto",label:"Magneto — righteous rage, history as justification"},{id:"killmonger",label:"Killmonger — grievance forged into revolution"},{id:"doom",label:"Doctor Doom — ego as a worldview, empire as self-expression"},{id:"lex",label:"Lex Luthor — ambition wearing the mask of progress"},{id:"ozymandias",label:"Ozymandias — the most dangerous villain: a genuine idealist"},{id:"venom",label:"Venom/Carnage — symbiotic hunger, chaos without cause"}]},
    ]},
  { id:"threatShape", phase:2, title:"Shape of the Threat", subtitle:"How does their evil actually move through the world?",
    questions:[
      { id:"threatArchetype", label:"Which threat archetype are they?",
        options:[{id:"architect",label:"The Architect — the plan is always three wars ahead"},{id:"warlord",label:"The Warlord — commands force, destroys opposition directly"},{id:"manipulator",label:"The Manipulator — everyone is a piece, no one is a person"},{id:"ideologue",label:"The Ideologue — believes the atrocity is necessary and righteous"},{id:"monster",label:"The Monster — power without restraint, destruction as identity"},{id:"fallen",label:"The Fallen — was something better once, now the exact opposite"}]},
      { id:"publicFace", label:"Does the world know they're the threat?",
        options:[{id:"known",label:"Fully exposed — the threat is the point, fear is the brand"},{id:"suspected",label:"Suspected but unproven — close enough to be dangerous"},{id:"hidden",label:"Completely hidden — operating from inside trusted structures"},{id:"legend",label:"Mythologized — most people think they're a story, not real"}]},
    ]},
  { id:"destructionPhilosophy", phase:3, title:"Power of Destruction", subtitle:"What do they break, and how?",
    questions:[
      { id:"weaponType", label:"What is their primary instrument of harm?",
        options:[{id:"physical",label:"Physical force — overwhelming power that ends resistance directly"},{id:"psychological",label:"Psychological — breaks the mind before the body"},{id:"systemic",label:"Systemic — corrodes institutions, economies, trust itself"},{id:"technological",label:"Technological — engineered weapons, data, infrastructure attacks"},{id:"biological",label:"Biological — the body is the battlefield"},{id:"relational",label:"Relational — turns people against each other, poisons bonds"}]},
      { id:"collateral", label:"How do they treat collateral damage?",
        options:[{id:"avoided",label:"Minimized — efficient evil avoids waste"},{id:"irrelevant",label:"Irrelevant — acceptable cost, unexamined"},{id:"intentional",label:"Intentional — the collateral IS the message"},{id:"enjoyed",label:"Enjoyed — suffering beyond the target is a bonus"},{id:"grieves",label:"Grieves it — knows the cost and carries it anyway"}]},
    ]},
  { id:"visualThreat", phase:4, title:"Visual Menace", subtitle:"What does the world see before it's too late?",
    questions:[
      { id:"physicalPresence", label:"Physical presence — what does a room feel when they enter?",
        options:[{id:"dominating",label:"Dominating — the room reorganizes around them"},{id:"unsettling",label:"Unsettling — something is wrong and no one knows what"},{id:"invisible",label:"Invisible — they look completely ordinary, and that's the threat"},{id:"magnificent",label:"Magnificent — genuinely beautiful in a disturbing way"},{id:"inhuman",label:"Inhuman — the body reads as wrong, power made physical"}]},
      { id:"costume", label:"How do they present themselves visually?",
        options:[{id:"armored",label:"Armored and imposing — the suit is a statement of invulnerability"},{id:"elegant",label:"Elegant and refined — evil has excellent taste"},{id:"civilian",label:"Civilian — they want to look like everyone else"},{id:"symbolic",label:"Symbolic — the design is propaganda, every detail intentional"},{id:"manifested",label:"Manifested — the power expresses itself through what they wear"}]},
    ]},
  { id:"psychologicalDamage", phase:5, title:"The Wound", subtitle:"What made them this way?",
    questions:[
      { id:"originalSin", label:"What was the original wound — the moment that started it?",
        options:[{id:"betrayal",label:"Betrayal — trusted someone completely, was destroyed by it"},{id:"injustice",label:"Injustice — were on the right side once, got the wrong outcome"},{id:"loss",label:"Loss — something irreplaceable was taken, and nothing filled the gap"},{id:"contempt",label:"Contempt — were dismissed, underestimated, never taken seriously"},{id:"born",label:"Born this way — the wound is constitutional, they were always like this"},{id:"transformation",label:"Transformation — became something, and the person they were died in it"}]},
      { id:"neverForget", label:"What can they never forgive?",
        options:[{id:"weakness",label:"Weakness — in themselves or anyone else"},{id:"hypocrisy",label:"Hypocrisy — the people calling themselves good aren't"},{id:"loss_specific",label:"The specific people or systems that created them"},{id:"hero",label:"The hero or figure who represents everything they became the opposite of"},{id:"world",label:"The world itself — it was always going to produce them"}]},
    ]},
  { id:"operationalStyle", phase:6, title:"Method of Domination", subtitle:"How do they build and maintain control?",
    questions:[
      { id:"organization", label:"How is their operation structured?",
        options:[{id:"solo",label:"Solo — pure individual threat, no infrastructure needed"},{id:"cult",label:"Cult — devoted followers who would die for them"},{id:"criminal",label:"Criminal network — organized, profit-driven, hierarchical"},{id:"infiltrated",label:"Infiltrated institution — already inside every system that matters"},{id:"army",label:"Army — numbers and force, the threat is scale"},{id:"shadow",label:"Shadow council — operates through proxies, never directly touched"}]},
      { id:"loyalty", label:"How do they maintain loyalty or control over others?",
        options:[{id:"fear",label:"Fear — the consequences of disloyalty are absolute"},{id:"belief",label:"Belief — followers genuinely agree with the mission"},{id:"obligation",label:"Obligation — everyone owes them something they can't repay"},{id:"love",label:"Love or devotion — they inspire genuine attachment"},{id:"leverage",label:"Leverage — something held over everyone that matters"}]},
    ]},
  { id:"endgame", phase:7, title:"The Endgame", subtitle:"What does their victory actually look like?",
    questions:[
      { id:"winCondition", label:"What does winning look like to them?",
        options:[{id:"domination",label:"Domination — control everything that matters, shape the world"},{id:"destruction",label:"Destruction — burn what exists, let whatever survives rebuild"},{id:"revenge",label:"Revenge — specific people pay a specific price"},{id:"proof",label:"Proof — vindication, the world finally acknowledges they were right"},{id:"transcendence",label:"Transcendence — become something beyond what they are now"},{id:"nothing",label:"Nothing — there is no winning, only the fight itself"}]},
      { id:"heroResponse", label:"How do they view the heroes opposing them?",
        options:[{id:"worthy",label:"Worthy opponents — the only ones worth bothering with"},{id:"obstacles",label:"Obstacles — inconveniences that slow the plan"},{id:"tools",label:"Tools — useful until they aren't, replaceable"},{id:"mirrors",label:"Mirrors — reflections of what the villain was or could have been"},{id:"contempt",label:"Contempt — they are not serious people and do not deserve serious attention"}]},
    ]},
];

export const VILLAIN_PERSONAL_PROFILE=[
  {section:"Presence & Command",questions:[
    {id:"vp_enter",q:"When you walk into an enemy's space — what happens?",options:[{id:"a",label:"They go quiet. They already know.",value:"commands silence, presence precedes arrival"},{id:"b",label:"They scramble. Your appearance means their plan has failed.",value:"arrival signals failure, causes immediate disruption"},{id:"c",label:"Nothing changes. You want it that way.",value:"invisible menace, the threat is undetected until it's too late"},{id:"d",label:"They pretend not to notice. Everyone notices.",value:"acknowledged but ignored — the performance of calm that fools no one"}]},
    {id:"vp_reputation",q:"What is said about you when you're not in the room?",options:[{id:"a",label:"Don't say the name. Someone might hear.",value:"feared by name, rumors are the first weapon"},{id:"b",label:"Nobody talks about you. Nobody would dare.",value:"silence is the reputation — absence of mention IS the threat"},{id:"c",label:"Conflicting accounts — nobody agrees on what you actually are",value:"mythologized, stories contradict, the legend is more dangerous than the fact"},{id:"d",label:"Admiration. Even the people who hate you respect you.",value:"commands respect even from enemies, reluctant admiration"}]},
    {id:"vp_power_display",q:"How do you establish dominance in a confrontation?",options:[{id:"a",label:"You don't — you already had it before it started",value:"enters dominant, dominance was established before the encounter began"},{id:"b",label:"You name what they're afraid of. Out loud. Calmly.",value:"weaponizes their fear, names it precisely and without hesitation"},{id:"c",label:"You demonstrate. Once. That's all it takes.",value:"single demonstration ends the question of who's in charge"},{id:"d",label:"You wait. Patience is the most unsettling thing you own.",value:"patience as dominance, outlasts all attempts at defiance"}]},
    {id:"vp_emotion",q:"What emotion do you use most deliberately?",options:[{id:"a",label:"Nothing — absence of affect is the most unnerving thing",value:"affectless, emotional void, the silence where feeling should be"},{id:"b",label:"Controlled warmth — it makes people drop their guard faster",value:"strategic warmth, disarms before striking"},{id:"c",label:"Rage — real, targeted, and terrifying when it surfaces",value:"real rage, rare and precisely deployed"},{id:"d",label:"Contempt — makes the target doubt themselves before you've moved",value:"contempt as destabilizer, erodes confidence before action"}]},
  ]},
  {section:"Methods & Weapons",questions:[
    {id:"vp_tool",q:"What is the most dangerous thing you carry that isn't physical?",options:[{id:"a",label:"Information — you know things people didn't know could be known",value:"weaponized intelligence, knows what should be unknowable"},{id:"b",label:"Patience — you've been preparing this for longer than they've been paying attention",value:"long-game patience, prepared while others were oblivious"},{id:"c",label:"Understanding — you know exactly what they'll do before they do",value:"predictive insight, opponent's behavior is already mapped"},{id:"d",label:"Conviction — you genuinely believe, and belief is armor",value:"unshakeable conviction, certainty as weapon and shield"}]},
    {id:"vp_method",q:"What is your preferred method when time is not a constraint?",options:[{id:"a",label:"Infiltration — become trusted, then become the threat from inside",value:"long-con infiltration, earns trust specifically to weaponize it"},{id:"b",label:"Erosion — weaken the structure until it collapses on its own",value:"systemic erosion, removes load-bearing elements incrementally"},{id:"c",label:"Demonstration — one public, undeniable act that reframes everything",value:"decisive demonstration, one action that changes the frame"},{id:"d",label:"Construction — build your own infrastructure, make them dependent",value:"builds dependency, creates the system they become reliant on"}]},
    {id:"vp_response",q:"When something goes wrong — when they actually land a hit — what happens?",options:[{id:"a",label:"Nothing. You already had a second plan.",value:"plans layered, failure of one activates another automatically"},{id:"b",label:"You adapt in real time. Rigidity is a weakness you don't carry.",value:"real-time adaptation, threat actually improves under pressure"},{id:"c",label:"You file it. You'll remember this. The response will be calibrated.",value:"catalogues the hit, calibrates precise and patient retaliation"},{id:"d",label:"You escalate. They wanted a fight. They get a war.",value:"escalation response, proportionality is not a concept that applies"}]},
    {id:"vp_weakness",q:"What is the thing they could actually use against you — if they were smart enough?",options:[{id:"a",label:"The mission. You need it to succeed more than you need yourself to survive.",value:"mission above self, will sacrifice everything including life for the goal"},{id:"b",label:"The one person or thing you would not sacrifice.",value:"one protected target, single un-weaponizable attachment"},{id:"c",label:"The wound. Someone who knows your origin knows the lever.",value:"origin wound is the exploit, the wound is still open under everything"},{id:"d",label:"Nothing. If there was one, you already burned it.",value:"deliberately eliminated all exploits, severed every attachment"}]},
  ]},
  {section:"Control & Manipulation",questions:[
    {id:"vp_people",q:"How do you see the people around you?",options:[{id:"a",label:"Assets — useful for specific functions, not irreplaceable",value:"transactional view of people, assets to be deployed"},{id:"b",label:"Variable threats — everyone is a potential problem you haven't solved yet",value:"sees latent threat in everyone, pre-emptive risk assessment"},{id:"c",label:"Puzzles — interesting to solve, occasionally surprising",value:"intellectual curiosity about people, engagement as study"},{id:"d",label:"Mirrors — reflections of failure, weakness, or what you're fighting against",value:"people as reflecting surfaces, reveals their own origin and motivation"}]},
    {id:"vp_recruitment",q:"How do you get people to do what you want?",options:[{id:"a",label:"You give them something they couldn't get anywhere else",value:"exclusive value provision, irreplaceable offer"},{id:"b",label:"You show them the truth they were pretending not to know",value:"reveals suppressed truth, makes the uncomfortable undeniable"},{id:"c",label:"You make the alternative unthinkable",value:"eliminates options, compliance through foreclosed alternatives"},{id:"d",label:"You make them believe it was their idea",value:"manufactured consent, targets feel autonomous while controlled"}]},
    {id:"vp_breakpoint",q:"What is your response when someone defies you?",options:[{id:"a",label:"Curiosity first. Why? What do they know that makes them think they can?",value:"analyses defiance before responding, strategic evaluation"},{id:"b",label:"Examples. One response so definitive nobody else asks the question.",value:"exemplary punishment, the response is designed to be witnessed"},{id:"c",label:"Patience. Let them believe it worked. Then show them it didn't.",value:"delayed response, allows false victory before absolute correction"},{id:"d",label:"Nothing immediately. You'll dismantle what they care about instead.",value:"indirect retaliation, targets what defiant person protects"}]},
  ]},
  {section:"The Wound",questions:[
    {id:"vp_made",q:"What is the moment that completed you as a threat?",options:[{id:"a",label:"When you realized the systems weren't broken — they worked exactly as designed",value:"systemic disillusionment, recognized the machine as intentional"},{id:"b",label:"When you did the thing you said you never would, and found it felt correct",value:"crossed the line and felt no remorse — that was the completion"},{id:"c",label:"When someone who should have protected you didn't",value:"abandonment or failure of the protector, defines the wound"},{id:"d",label:"When you won and it cost you the one thing you were doing it for",value:"pyrrhic victory as origin — won and lost everything in the same moment"}]},
    {id:"vp_regret",q:"Is there anything left that functions like a conscience?",options:[{id:"a",label:"No. That was the last thing surrendered, and it was a relief.",value:"no conscience remaining, the relief of its absence was the final transformation"},{id:"b",label:"Yes — one thing. One person or memory that still has weight.",value:"single preserved conscience anchor, one thing that hasn't been destroyed"},{id:"c",label:"Something that looks like it from certain angles, but isn't",value:"mimics conscience for functional purposes, reads as moral when useful"},{id:"d",label:"It's buried. Not gone, but inaccessible. You've made sure of that.",value:"buried conscience, deliberately suppressed and insulated from influence"}]},
    {id:"vp_mirror",q:"What would the person you were before say if they could see you now?",options:[{id:"a",label:"Nothing. You're what they were always heading toward.",value:"former self was always this — continuity, not departure"},{id:"b",label:"They would not recognize you. The person is gone.",value:"complete identity rupture, former self would see a stranger"},{id:"c",label:"They'd understand. They'd know exactly why every step made sense.",value:"former self would recognize the logic, grief without surprise"},{id:"d",label:"They'd be terrified — and then they'd be proud.",value:"former self would fear and then admire, complexity of the transformation"}]},
  ]},
  {section:"Physical Menace",questions:[
    {id:"vp_palette",q:"What color or palette communicates what you are without words?",options:[{id:"a",label:"Void — deep black, total absence, swallows everything",value:"void palette, black dominance, presence as absence of light"},{id:"b",label:"Corrupted — a color that should be clean but isn't, wrong brightness",value:"corrupted color, familiar hue made wrong, off-register menace"},{id:"c",label:"Blood-tones — reds and deep crimsons, the color of consequence",value:"blood palette, crimson and deep red, unmistakable consequence"},{id:"d",label:"Power-tones — gold, electric, charged — wealth or dominance made visible",value:"power palette, charged metallics or saturated status colors"}]},
    {id:"vp_movement",q:"How do you move — what does the body communicate before you speak?",options:[{id:"a",label:"Economy — zero wasted motion, everything deliberate, nothing telegraphed",value:"zero wasted motion, deliberate economy, impossible to read intent"},{id:"b",label:"Weight — each step communicates mass and consequence",value:"physical weight communicated, movement signals consequence"},{id:"c",label:"Wrong — something is slightly off, and it's more disturbing than overtly monstrous",value:"uncanny movement, something subtly wrong about it"},{id:"d",label:"Stillness — you barely move, and that's the most threatening thing",value:"stillness as threat, the absence of motion is the signal"}]},
    {id:"vp_power_signature",q:"What does your power leave on the world when you use it?",options:[{id:"a",label:"Marks that don't heal — scars, absences, things permanently changed",value:"permanent marks, the world changed by passage cannot recover"},{id:"b",label:"Silence — the power removes something rather than adding",value:"removes rather than adds — silence, absence, cessation"},{id:"c",label:"Visible spectacle — the display is part of the terror",value:"visible spectacular display, power designed to be witnessed"},{id:"d",label:"Nothing visible — you only see what it did, never what it was",value:"invisible signature, consequences without visible cause"}]},
  ]},
];

