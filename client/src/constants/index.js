export const G="#D4AF37";

export const NK_TEAM={id:"nocturnal-knights",name:"Nocturnal Knights",abbr:"NK",color:"#534AB7",colorLight:"#AFA9EC",type:"global",nkAlignment:"base",isDefault:false,description:"Dark urban anti-heroes operating in the shadows between crime and justice.",motto:"We are the dark between the lights.",origin:"Founded by Kareem Carter after surviving a government black-site experiment. The Knights exist because the organization responsible is still operating — and no legitimate hero was stopping them."};

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
     codex:{overview:"The A-gene (Aggressive Gene) is a dormant sequence found in approximately 1 in 1.8 million humans. In its dormant state it reads as noncoding DNA. When activated, it does not create new biology — it removes the biological limiters that prevent the human body from exceeding its own structural limits.",biology:"The standard human body runs well below its theoretical performance ceiling. Muscular output is capped to prevent structural damage. Neural processing speed is throttled to prevent heat damage. Adrenaline response is metered to prevent cardiac events. The A-gene turns those protections off. An activated carrier has access to full biological output with no automatic cutoff — physical capability that outpaces any trained human. The body was not designed to run in this state indefinitely, so the A-gene compensates with an accelerated healing factor that emerges alongside activation. Powers are specific to each individual's baseline physiology and psychology; no two carriers are identical, but all trend toward aggression-expressing outputs: raw force, kinetic projection, speed, durability.",activation:"Every confirmed activation event was triggered by extreme stress — physiological, psychological, or both. The activation is not conscious. Carriers consistently describe blacking out or entering a dissociative state, then returning to awareness having done something they couldn't explain and couldn't immediately replicate. Initial activation is violent, disorienting, and dangerous. The first weeks are described as learning to drive something already going 90 mph.",discovery:"The A-gene was first isolated in 2019 by a research team funded through the Nexus Foundation — a private science organization later linked to the same government program that produced Wakháŋ. The original paper was published, then quietly retracted. The researchers scattered. Multiple A-gene carriers have since reported contact from unknown parties shortly before their activation events — suggesting at minimum that someone has a list, and at most, that some activations were not spontaneous.",note:"A-gene carriers didn't choose this. That fact shapes nearly every carrier's psychological relationship to their power. It was not earned, not trained, not discovered willingly. It simply arrived. What they do with it is their only real choice."}},
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

export const DEFAULT_NK=[
  {id:"darkstar",teamId:"nocturnal-knights",heroName:"Wakháŋ",realName:"Kareem Carter",gender:"Male",species:"Human (Enhanced)",race:{main:"human",sub:"enhanced_human"},role:"Leader · Powerhouse",color:"#534AB7",colorLight:"#AFA9EC",initials:"KC",number:"01",isCore:true,nkAlignment:"base",teamRank:"leader",
   tagline:"The night bends to his will.",
   powers:[{name:"Dark Ki Projection",desc:"Concentrated void-violet energy blasts that crack the air on release."},{name:"Shadow Threading",desc:"Dark energy tendrils for grappling, binding, and high-speed traversal."},{name:"Gravity Surge",desc:"Overrides gravity — flight, aerial combat, concussive ground launches."},{name:"Final Surge",desc:"Full aura release multiplying strength and speed. Visible cost when it fades."}],
   origin:"Former Division I athlete and physics prodigy. Survived a government black-site dark energy experiment that killed every other subject. He didn't form the Knights out of heroism — he formed them because the organization was still operating and no one was stopping them.",
   dna:["Vegeta","Spider-Man","Superman"],stats:{Power:100,Speed:97,Tech:60,Intellect:90,Will:99},
   costumeDesc:"sleek void-black bodysuit with deep violet (#534AB7) glowing circuit lines on chest and forearms, NK crest",
   powerFX:"void-violet aura radiating from both hands and faintly from eyes, floating 2 feet off the ground",
   consistencyNotes:"Suit ALWAYS void-black with violet accent lines only. Faint violet eye glow. No capes. No wings."},
  {id:"phantom-edge",teamId:"nocturnal-knights",heroName:"Null/Void",realName:"Jon Bethea",gender:"Male",species:"Human",race:{main:"human",sub:"human"},role:"Second in Command · Tech Striker",color:"#0F6E56",colorLight:"#5DCAA5",initials:"JB",number:"02",isCore:true,nkAlignment:"base",teamRank:"second",
   tagline:"Every battle is already solved before it starts.",
   powers:[{name:"Chrono Blade",desc:"Vibranium-alloy energy sword that phases through non-organic matter. Trails teal afterimages."},{name:"Adaptive Nanosuit",desc:"Reconfigures in real-time — absorbs damage, shifts to offense, deploys micro-drones mid-combat."},{name:"Elastic Form",desc:"Limbs stretch, coil, and rebound for unpredictable strikes and instant distance closing."},{name:"Battlefield IQ",desc:"Visor HUD analyzes enemy patterns in seconds and feeds tactical data to the whole team."}],
   origin:"Top engineering graduate who discovered his employer was a front for the same organization that experimented on Kareem. He walked into their server room alone, copied everything, burned the rest, and rebuilt his tech from scratch.",
   dna:["Trunks","Mr. Fantastic","Black Panther"],stats:{Power:88,Speed:100,Tech:100,Intellect:100,Will:92},
   costumeDesc:"adaptive nanosuit in void-black with glowing teal (#0F6E56) circuit lines, full helmet with data visor",
   powerFX:"teal energy sword with afterimage trail, one arm elastically stretched, HUD data visible inside visor",
   consistencyNotes:"Helmet ALWAYS on with teal visor glow. No bare face in armored mode."},
  {id:"chimera",teamId:"nocturnal-knights",heroName:"Catalix",realName:'Jesus "Omar" Fernandez',gender:"Male",species:"Human (Genetically Modified)",race:{main:"mutate",sub:"experiment_mutate"},role:"Scientist · Genetic Brawler",color:"#993C1D",colorLight:"#F0997B",initials:"JF",number:"03",isCore:true,nkAlignment:"base",
   tagline:"He rewrote the rules of his own biology.",
   powers:[{name:"Live Gene-Shift",desc:"Rewrites his own DNA on the fly — bone plating, razor claws, enhanced senses on demand."},{name:"Catalyst Spheres",desc:"Self-guided orbs that detonate, emit EMP bursts, or form reactive barriers."},{name:"Precision Strike",desc:"Baseball-honed reflexes plus enhanced genetics — lethal throwing accuracy at any range."},{name:"Beast Intellect",desc:"Monstrous physical form doesn't dull the mind. Processes combat and science simultaneously."}],
   origin:"A geneticist whose research was stolen and weaponized without his knowledge. He administered his own prototype to himself. The process was supposed to be reversible. Most of it was.",
   dna:["Mr. Terrific","The Beast","Baseball Precision"],stats:{Power:96,Speed:94,Tech:98,Intellect:100,Will:95},
   costumeDesc:"tactical void-black bodysuit with torn sleeves revealing reinforced dark bone plating on arms, NK crest",
   powerFX:"razor bone claws on one hand, rust-orange (#993C1D) catalyst orb mid-throw, second orb orbiting shoulder",
   consistencyNotes:"Arms always show bone plating. Rust-orange ONLY accent color."},
  {id:"paladin",teamId:"nocturnal-knights",heroName:"Bastion Prime",realName:"Mario Richardson",gender:"Male",species:"Human",race:{main:"human",sub:"human"},role:"Heart of the Team · Clutch Factor",color:"#185FA5",colorLight:"#85B7EB",initials:"MR",number:"04",isCore:true,nkAlignment:"base",
   tagline:"He doesn't have the most power. He has the most heart.",
   powers:[{name:"Resolve Shield",desc:"Nearly unbreakable energy barrier fueled by pure willpower. Glows brighter as odds stack higher."},{name:"Rally Aura",desc:"Pulse that restores focus and stamina to downed teammates. The team fights harder near him."},{name:"Last Stand Surge",desc:"Strength and durability spike dramatically when the mission is truly on the brink."},{name:"Unbreakable Will",desc:"Immune to mental attacks, fear, and manipulation. His calm steadies everyone around him."}],
   origin:"No experiment. No accident. Mario stood beside Kareem when everyone else backed away. His power has no scientific explanation — a will so unbreakable it bends physics slightly.",
   dna:["Captain America","Heart of the team"],stats:{Power:92,Speed:85,Tech:50,Intellect:88,Will:100},
   costumeDesc:"reinforced void-black tactical suit with blue (#185FA5) energy lines, broad chest plate with NK crest glowing blue",
   powerFX:"large semi-transparent blue energy shield radiating soft pulsing light, warm blue aura surrounding entire body",
   consistencyNotes:"Shield ALWAYS large and present. Blue aura is warm/pulsing. Face always visible — no helmet."},
];

export const NK_DYNAMICS=[
  {a:"darkstar",b:"phantom-edge",label:"Volatile Alliance",color:"#E8A020",desc:"The loudest tension on the team. They argue constantly and efficiently — fights last under 90 seconds because they both know the other is usually half right."},
  {a:"darkstar",b:"chimera",label:"Unspoken Bond",color:"#8B5CF6",desc:"Both were changed by the same organization. Omar reads Kareem's anger as grief and calls it out — and Kareem lets him."},
  {a:"darkstar",b:"paladin",label:"Leader & Conscience",color:"#185FA5",desc:"Kareem leads. Mario decides where the line is. There is an unspoken rule: if Mario won't do it, it doesn't happen."},
  {a:"phantom-edge",b:"chimera",label:"The Think Tank",color:"#0F6E56",desc:"Jon identifies the structural weakness, Omar deploys the solution before Jon finishes the sentence."},
  {a:"phantom-edge",b:"paladin",label:"Tactical Trust",color:"#5BA3D4",desc:"Jon plans for every contingency. Mario executes when every plan has failed. Trust is absolute and unspoken."},
  {a:"chimera",b:"paladin",label:"Heart & Mind",color:"#F0997B",desc:"The most different members who understand each other best. Omar makes Mario laugh mid-mission."},
];

export const RECRUIT_QUIZ=[
  {id:"background",question:"What's your background?",options:[{id:"military",label:"Military / Law enforcement",value:"military discipline, tactical training, command instincts"},{id:"science",label:"Science / Academia",value:"scientific genius, analytical mind, research-driven"},{id:"tech",label:"Tech / Engineering",value:"tech prodigy, builder mindset, solves problems by creating tools"},{id:"street",label:"Street / Self-taught",value:"self-taught fighter, street survivor, raw resourcefulness"},{id:"athletics",label:"Athletics / Sports",value:"elite athlete, peak conditioning, competitive instinct"},{id:"arts",label:"Arts / Performance",value:"performer background, reads people instinctively"},]},
  {id:"fightStyle",question:"How do you approach a fight?",options:[{id:"brawler",label:"Head-on — overwhelming force",value:"aggressive frontline brawler"},{id:"tactician",label:"Calculate first, then strike",value:"tactical and precise, waits for the right moment"},{id:"adaptive",label:"Adapt to whatever comes",value:"fluid and adaptive, reads the fight in real-time"},{id:"support",label:"Hold the line, protect others",value:"defensive anchor, absorbs pressure"},{id:"stealth",label:"Unseen until it's over",value:"stealth-based, patient"},]},
  {id:"motivation",question:"What drives you to fight?",options:[{id:"vengeance",label:"Personal vendetta",value:"fueled by personal injustice"},{id:"protection",label:"Protect the people I love",value:"protective instinct is the core driver"},{id:"system",label:"Fix a broken system",value:"fights the structures that created the problem"},{id:"duty",label:"Pure sense of duty",value:"duty-driven, no personal reason needed"},{id:"curiosity",label:"Curiosity / Thrill of it",value:"drawn to danger"},]},
  {id:"powerOrigin",question:"What power origin fits?",options:[{id:"energy",label:"Energy / Ki / Cosmic",value:"internal energy or ki-based powers, aura projection"},{id:"tech",label:"Tech / Suit / Gadgets",value:"technology-based abilities, engineered suit"},{id:"bio",label:"Biology / Mutation",value:"biological enhancement, genetic mutation"},{id:"will",label:"Willpower / Manifestation",value:"willpower made physical"},{id:"elemental",label:"Elemental",value:"elemental control — fire, ice, lightning, earth, shadow, or light"},{id:"psychic",label:"Psychic / Mental",value:"telepathy, telekinesis, precognition"},]},
  {id:"personality",question:"Your personality type:",options:[{id:"proud",label:"Intense / Proud / Competitive",value:"intense pride and competitive drive"},{id:"strategic",label:"Strategic / Quiet / Calculated",value:"calm and calculating, speaks rarely but meaningfully"},{id:"chaotic",label:"Chaotic / Unpredictable / Brilliant",value:"brilliant chaos energy, unpredictable"},{id:"loyal",label:"Warm / Loyal / Unbreakable",value:"deeply loyal and warm, emotional anchor"},{id:"dark",label:"Brooding / Haunted / Driven",value:"haunted by something, controlled fury"},]},
  {id:"weakness",question:"Biggest weakness?",options:[{id:"ego",label:"Pride / Ego",value:"pride can blind them under pressure"},{id:"attachment",label:"Attachment to loved ones",value:"deeply vulnerable when someone is threatened"},{id:"toofar",label:"Going too far",value:"tendency to escalate beyond necessity"},{id:"doubt",label:"Self-doubt",value:"inner uncertainty that can freeze them"},{id:"control",label:"Loss of control over power",value:"power not fully stable — stress risks overload"},]},
];

export const VILLAIN_QUIZ=[
  {id:"role",question:"Role in the organization?",options:[{id:"architect",label:"The Architect — designed the experiments",value:"mastermind who designed the experiments"},{id:"director",label:"The Director — runs field operations",value:"tactical director, thinks in acceptable losses"},{id:"soldier",label:"The Soldier turned Commander",value:"former field operative, still prefers direct violence"},{id:"scientist",label:"The Scientist — chose org over ethics",value:"genius who chose the org deliberately"},{id:"handler",label:"The Handler — controlled subjects",value:"psychologist who studied and manipulated subjects"},]},
  {id:"drive",question:"What drives them?",options:[{id:"believer",label:"True believer",value:"genuinely believes the org's work will save the world"},{id:"loss",label:"Lost someone because of the heroes",value:"grief has become a weapon"},{id:"power",label:"Pure hunger for power",value:"uses the org as vehicle for personal power"},{id:"subject",label:"Also a test subject — broken by it",value:"survived the same experiment, shattered"},{id:"protection",label:"Protecting someone inside the org",value:"does terrible things to shield someone they love"},]},
  {id:"connection",question:"Connection to the heroes?",options:[{id:"creator",label:"Caused or enabled what made the heroes",value:"directly responsible for what the heroes became"},{id:"betrayal",label:"Was once on the team",value:"former ally who knows every weakness"},{id:"counter",label:"Built specifically to counter the heroes",value:"engineered after the heroes became a threat"},{id:"personal",label:"Deep personal history with a hero",value:"deep pre-origin personal history with a hero"},{id:"collateral",label:"Lost someone in the crossfire",value:"civilian caught in the crossfire"},]},
  {id:"power",question:"Power source?",options:[{id:"corrupted",label:"Mirror power — same source as a hero, corrupted",value:"wields the same power type as the strongest hero, without restraint"},{id:"superior_tech",label:"Tech that makes a hero's feel obsolete",value:"tech so advanced it renders the team's best gadgets obsolete"},{id:"bio_weapon",label:"Weaponized biology",value:"biological weaponry built to neutralize the most powerful hero"},{id:"psychic",label:"Psychic assault",value:"breaks minds, rewrites memories"},{id:"army",label:"Commands an army",value:"commands hundreds of operatives"},]},
  {id:"flaw",question:"Fatal flaw?",options:[{id:"hero",label:"Believes they are the real hero",value:"genuine conviction they are right"},{id:"grief",label:"Grief made them irrational",value:"the thing they lost has distorted all judgment"},{id:"orders",label:"Following orders they stopped believing",value:"too deep in the org to leave"},{id:"pride",label:"Underestimates the heroes",value:"contempt for the heroes is their blindspot"},{id:"mercy",label:"Still mercy left in them",value:"one hero means something to them — cannot fully commit"},]},
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
