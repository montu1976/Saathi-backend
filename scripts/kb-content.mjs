/**
 * Content libraries for Saathi knowledge base generation.
 * Each category has situation banks, empathy phrases, and cultural notes.
 */

export const CATEGORY_META = {
  relationships: {
    label: "Relationships",
    context: "romantic and dating relationships",
    cultural: [
      "Many Indian families still prefer knowing about relationships before commitment; secrecy can add stress but autonomy is valid.",
      "Public displays of affection and solo dating may be judged in smaller towns; safety and reputation concerns are real, not just 'old thinking'.",
      "Caste, religion, language, and region often matter to families even when the couple feels compatible.",
      "Marriage is often seen as a family alliance, not only a personal choice—expect mixed feelings from relatives.",
      "Women may face disproportionate scrutiny about dating history; men may face pressure to 'settle' by a certain age.",
      "Living together before marriage is still uncommon and may be legally or socially complicated in some states.",
      "Parents may conflate dating with imminent marriage; clear communication about timeline helps.",
      "Festival seasons and weddings can trigger comparison and pressure to commit faster.",
      "WhatsApp, Instagram, and family group chats amplify relationship news quickly.",
      "Seeking therapy or counselling for relationship issues is growing but still stigmatised in many homes."
    ],
    relatedPool: ["Communication", "Trust", "Boundaries", "Breakups", "Commitment", "Love marriage"]
  },
  family: {
    label: "Family",
    context: "family dynamics and intergenerational relationships",
    cultural: [
      "Joint family living means decisions about space, money, and parenting are rarely only between two people.",
      "Respect for elders is a core value; disagreeing may need to be framed as seeking guidance, not rebellion.",
      "Daughters-in-law and sons-in-law often navigate unspoken household rules set by in-laws.",
      "Property and inheritance disputes frequently involve emotional loyalty, not just legal documents.",
      "Sons are often expected to support parents financially; daughters may face different expectations after marriage.",
      "Festival obligations, rituals, and guest hosting can become flashpoints between generations.",
      "Comparing siblings and cousins ('Sharma ji ka beta') is common and can damage self-worth.",
      "Elder care may fall disproportionately on one sibling, especially daughters or daughters-in-law.",
      "Privacy in shared homes is limited; boundaries must be negotiated practically, not only ideally.",
      "Moving abroad or to another city can be seen as abandoning family duty."
    ],
    relatedPool: ["Parents", "Siblings", "Joint family", "Respect and boundaries", "Elder care", "Marriage pressure"]
  },
  career: {
    label: "Career",
    context: "work, profession, and livelihood decisions",
    cultural: [
      "Government jobs and PSU roles are still seen as highest stability, especially by parents.",
      "Engineering and medicine remain default 'safe' paths in many middle-class families.",
      "UPSC and civil services carry prestige that can outweigh personal interest or work-life balance.",
      "Job changes may be viewed as instability; staying in one company is often praised.",
      "Women's careers are sometimes deprioritised after marriage or childbirth without explicit discussion.",
      "Family businesses may expect children to join regardless of personal ambition.",
      "Networking through relatives and community is common and can feel obligatory.",
      "Remote work and freelancing are gaining acceptance but may worry parents used to office jobs.",
      "Salary discussions at home may compare with cousins and neighbours.",
      "Burnout is sometimes dismissed as laziness or lack of 'adjustment'."
    ],
    relatedPool: ["Career choice", "Burnout", "Salary negotiation", "Job loss", "Work stress", "Financial independence"]
  },
  education: {
    label: "Education",
    context: "schooling, exams, and academic pressure",
    cultural: [
      "Board exams, JEE, NEET, and UPSC are treated as life-defining events in many households.",
      "Coaching culture in Kota, Hyderabad, and Delhi-NCR normalises extreme study hours.",
      "Failure in competitive exams can carry intense shame for the whole family.",
      "Parents may invest heavily in education loans or savings, increasing pressure to succeed.",
      "Girls' education is valued but mobility and hostel life may still face restrictions.",
      "Private school fees and tuition create financial stress that students absorb emotionally.",
      "Rank and percentile are discussed openly at family gatherings.",
      "Gap years are often misunderstood as 'wasting time'.",
      "Bullying and mental health struggles may be minimised as 'phase' or 'weakness'.",
      "Scholarships and studying abroad are aspirational but visa and cost fears are real."
    ],
    relatedPool: ["Board exams", "Study habits", "Parents' expectations", "Fear of failure", "Career confusion", "Academic stress"]
  },
  friendship: {
    label: "Friendship",
    context: "peer friendships and social belonging",
    cultural: [
      "Friend groups often form around school, coaching, colony, or workplace—moving cities can reset social life.",
      "Best-friend loyalty is strong; betrayals feel deeply personal in close-knit circles.",
      "Gender segregation in some schools and towns limits mixed friendships.",
      "Parents may monitor who you spend time with, especially for teenagers.",
      "Borrowing money or favours among friends can complicate relationships in tight communities.",
      "Wedding and festival guest lists become friendship tests in adulthood.",
      "Online friendships via gaming, Discord, or Instagram are common among youth.",
      "Office friendships may conflict with hierarchy and gossip culture.",
      "Neighbour relationships blend friendship and obligation—saying no is awkward.",
      "Exclusion from WhatsApp groups can feel like public rejection."
    ],
    relatedPool: ["Trust", "Setting boundaries", "Toxic friendships", "Conflict resolution", "Peer pressure", "Loneliness"]
  },
  marriage: {
    label: "Marriage",
    context: "marriage, partnership, and marital life",
    cultural: [
      "Arranged and semi-arranged marriages remain common; love marriages may still need family acceptance.",
      "Wedding scale and guest lists often involve extended family expectations and debt.",
      "Living with in-laws after marriage is normal in many regions; privacy must be negotiated.",
      "Division of household labour often falls unevenly on women without explicit agreement.",
      "Having children is frequently expected within the first few years of marriage.",
      "Interfaith and intercaste marriages may require legal and social navigation.",
      "Divorce and separation carry stigma; support systems may be limited.",
      "Second marriage and widowhood face unique judgment, especially for women.",
      "Financial transparency between spouses may conflict with family money secrets.",
      "Intimacy and infertility are often private topics with heavy silence around them."
    ],
    relatedPool: ["Communication", "Living with in-laws", "Financial planning", "Conflict resolution", "Having children", "Career after marriage"]
  },
  "mental-wellbeing": {
    label: "Mental Wellbeing",
    context: "emotional coping and everyday wellbeing",
    cultural: [
      "Distress is often described as tension, weakness, or overthinking rather than seeking support.",
      "Family may advise prayer, rest, or marriage as solutions rather than professional help.",
      "Therapy is growing in cities but remains expensive and stigmatised elsewhere.",
      "Academic and career pressure are major contributors to chronic stress.",
      "Women may have less alone time in joint families to decompress.",
      "Men are often discouraged from expressing vulnerability.",
      "Sleep disruption from late-night scrolling is common across age groups.",
      "Comparing yourself to others on social media intensifies anxiety.",
      "Grief rituals exist culturally but personal grief timelines vary.",
      "Wellbeing practices like yoga and meditation are familiar and can be framed positively."
    ],
    relatedPool: ["Stress", "Anxiety", "Sleep habits", "Emotional regulation", "Building resilience", "Digital overload"]
  },
  money: {
    label: "Money",
    context: "personal and family finances",
    cultural: [
      "Gold, property, and FDs are trusted; stocks and mutual funds may feel risky to elders.",
      "Supporting parents and siblings financially is often a moral expectation.",
      "Wedding and education expenses frequently involve family pooling and loans.",
      "Talking openly about salary at home can be awkward or competitive.",
      "Joint bank accounts after marriage vary by region and family tradition.",
      "Credit card debt may be hidden from family due to shame.",
      "Renting vs buying is debated with strong bias toward ownership.",
      "Insurance is under-purchased until a health scare occurs.",
      "Women may have less visibility into household finances in some homes.",
      "Business loans within families can destroy relationships if undocumented."
    ],
    relatedPool: ["Budgeting", "Saving", "Emergency fund", "Joint finances", "Education loans", "Talking about money"]
  },
  health: {
    label: "Health",
    context: "physical health and healthy routines",
    cultural: [
      "Home remedies and elder advice often mix with modern medicine—integration needs respect.",
      "Women's health topics like periods, PCOS, and menopause may be discussed quietly or not at all.",
      "Men may avoid checkups until symptoms are severe.",
      "Vegetarian households need planned protein and B12 awareness.",
      "Festival foods and social eating make consistent nutrition challenging.",
      "Caregiver burden for sick parents often falls on one family member.",
      "Postpartum recovery expectations may underestimate rest and mental adjustment.",
      "Gym culture is growing but body image pressure affects youth.",
      "Ayurveda, yoga, and allopathy coexist—users may want balanced framing.",
      "Air pollution, heat, and monsoon illnesses affect routines in many cities."
    ],
    relatedPool: ["Healthy eating", "Exercise", "Sleep", "Preventive health", "Stress management", "Work-life balance"]
  },
  "self-growth": {
    label: "Self Growth",
    context: "personal development and life skills",
    cultural: [
      "Ambition may be praised in sons and questioned in daughters depending on family outlook.",
      "Public speaking and leadership are valued in careers but under-practised in school.",
      "Discipline is often taught through authority; self-motivation is harder to build.",
      "Failure in exams or jobs can shrink confidence for years.",
      "Purpose and passion talk may feel luxury when immediate income is needed.",
      "Creativity is encouraged in children but sidelined for 'serious' careers later.",
      "Forgiveness within family is expected quickly, sometimes before hurt is processed.",
      "Consistency is hard with unpredictable family obligations and festivals.",
      "Criticism from elders may be framed as care, making boundaries confusing.",
      "Learning English and soft skills is seen as gateway to opportunity."
    ],
    relatedPool: ["Confidence", "Habits", "Goal setting", "Resilience", "Time management", "Emotional intelligence"]
  }
};

export const AGE_ADVICE = {
  teenager: (topic, cat) => [
    `At this age, ${topic.toLowerCase()} often feels all-consuming because identity and belonging are forming.`,
    "Parents and school rules may limit choices; focus on what you can control and who you can safely talk to.",
    "Avoid permanent decisions based on temporary intensity; give situations a few weeks before big moves.",
    "Journaling or voice notes can help when you cannot speak freely at home.",
    "If an adult is pressuring you, tell a trusted teacher, cousin, or helpline—you do not have to handle it alone."
  ],
  college: (topic, cat) => [
    `College brings new freedom and new pressure around ${topic.toLowerCase()}; comparison with peers is common.`,
    "Hostel life and new cities mean you are building habits without daily parental oversight.",
    "Use campus counsellors, seniors, or clubs as low-stakes support before crises build.",
    "Balance experimentation with sleep, grades, and finances—burnout starts quietly.",
    "Family may still expect updates; decide what you share and how often, on your terms."
  ],
  professional: (topic, cat) => [
    `Early career years mix ambition, income stress, and ${topic.toLowerCase()} alongside long work hours.`,
    "Financial independence changes family dynamics; expectations to contribute at home may rise.",
    "Office culture and relocation decisions affect relationships and mental bandwidth.",
    "Say no to overtime or social obligations sometimes—consistency beats heroic bursts.",
    "Build a small emergency fund before major lifestyle upgrades."
  ],
  married: (topic, cat) => [
    `Marriage adds shared decisions about ${topic.toLowerCase()}, in-laws, and sometimes children.`,
    "Align with your partner in private before presenting a united front to family.",
    "Schedule regular check-ins—not only during fights—to prevent resentment buildup.",
    "Division of chores and money should be explicit, not assumed by gender.",
    "It is okay to seek couples counselling; it is maintenance, not failure."
  ],
  parent: (topic, cat) => [
    `Parenting reshapes priorities; ${topic.toLowerCase()} must fit around children's needs and your energy limits.`,
    "Guilt about not doing enough is common; good enough parenting is real parenting.",
    "Ask for help from partner, family, or paid support without treating it as defeat.",
    "Model healthy boundaries so children learn them too.",
    "Keep a sliver of identity outside parenthood—friendships, hobbies, or work matter."
  ],
  senior: (topic, cat) => [
    `Later life brings perspective on ${topic.toLowerCase()}, but also health, loss, and changing roles.`,
    "Retirement or empty nest can trigger loneliness; maintain social rituals deliberately.",
    "Accept help from children without feeling you have lost authority—interdependence is healthy.",
    "Stay physically active within medical limits; mobility affects mood strongly.",
    "Legacy, property, and care planning conversations are kinder when done early."
  ]
};

export function slugify(name) {
  return name
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function buildSituations(topic, category, count = 22) {
  const t = topic.toLowerCase();
  const templates = [
    `Feeling unsure how to talk about ${t} with family who may not understand`,
    `A friend or relative gave unsolicited advice about ${t} that felt hurtful`,
    `Comparing your situation with others on social media regarding ${t}`,
    `Wanting change but fearing conflict if you bring up ${t}`,
    `Your partner or family member dismisses your concerns about ${t} as overthinking`,
    `Past experiences with ${t} make it hard to trust your own judgment now`,
    `Cultural expectations clash with what you personally want around ${t}`,
    `You said yes to something about ${t} to keep peace and now regret it`,
    `A major life event (exam, wedding, job) intensified stress around ${t}`,
    `You feel alone because nobody in your circle talks openly about ${t}`,
    `Money constraints are limiting your options related to ${t}`,
    `You are carrying guilt about a choice you made involving ${t}`,
    `Someone shared private details about your ${t} situation without consent`,
    `You oscillate between hope and hopelessness about ${t}`,
    `Sleep, appetite, or focus have slipped since ${t} became an issue`,
    `You want practical steps but only find judgmental opinions about ${t}`,
    `A long-distance or busy schedule makes addressing ${t} harder`,
    `You fear being labelled if you seek help for ${t}`,
    `Generational gap: elders see ${t} differently than you do`,
    `You are trying to repair something related to ${t} after a hurtful incident`,
    `Balancing your needs with someone else's regarding ${t}`,
    `Planning a conversation about ${t} but not knowing where to start`,
    `Feeling stuck in a pattern that keeps repeating around ${t}`,
    `Success in one area (work/study) masking distress in ${t}`
  ];
  return templates.slice(0, count);
}

export function buildEmpathy(topic, count = 22) {
  const t = topic.toLowerCase();
  const lines = [
    `It makes sense that ${t} feels heavy right now—you are not overreacting.`,
    "Many people in similar situations feel torn between heart and duty; that conflict is real.",
    "You have been trying to handle this thoughtfully, even if it does not look perfect from outside.",
    "Feeling confused does not mean you are incapable—it means the situation is genuinely complex.",
    "It is okay to want both family peace and your own happiness; they are not always opposites.",
    "You deserve to be heard without being shamed for your feelings.",
    "Carrying this quietly for so long would exhaust anyone.",
    "Wanting clarity before acting is wise, not weakness.",
    "Your boundaries matter even when others are older or more experienced.",
    "One difficult chapter does not define your whole story.",
    "It is normal to need time before you know what you want.",
    "You are allowed to change your mind as you learn more.",
    "Feeling angry or sad about this does not make you a bad person.",
    "You have shown resilience already by reaching out and reflecting.",
    "Comparison with others rarely captures the full truth of anyone's life.",
    "Small steps count when big leaps feel impossible.",
    "You do not have to justify every feeling to make it valid.",
    "Seeking support is a sign of strength in a culture that often praises silent endurance.",
    "It is understandable if trust feels fragile right now.",
    "You can honour your values while still choosing a path that fits you.",
    "Rest and self-compassion are part of solving problems, not distractions from them.",
    "Whatever you decide, you deserve dignity in how you are treated."
  ];
  return lines.slice(0, count);
}

export function buildAdviceSnippets(topic, category, count = 22) {
  const t = topic.toLowerCase();
  const snippets = [
    `"Before a big decision about ${t}, write down what you fear losing and what you hope to gain—clarity often appears on paper."`,
    `"Try one honest conversation using 'I feel… because…' instead of blame; notice if the other person can hear you."`,
    `"Set a 48-hour pause rule for messages or calls made in anger about ${t}."`,
    `"Identify one person who can listen without fixing—venting safely reduces impulsive choices."`,
    `"If family pressure is high, prepare a short script: what you can share, what is private, and what you need from them."`,
    `"Schedule a weekly 20-minute check-in with your partner or trusted friend about ${t}, not only during crises."`,
    `"List non-negotiables vs flexible areas; not every battle needs the same energy."`,
    `"If ${t} involves money, put numbers on paper together before emotions escalate."`,
    `"Reduce social media scrolling if it fuels comparison about ${t}—muting triggers is self-care."`,
    `"When stuck, ask: what would I advise a close friend in this exact situation?"`,
    `"Practice saying 'I need time to think' without guilt—it prevents rushed yeses."`,
    `"If apology is needed, name the impact specifically rather than a vague sorry."`,
    `"For recurring arguments about ${t}, track triggers in a notes app for two weeks to spot patterns."`,
    `"Seek one professional opinion (counsellor, lawyer, doctor) if stakes are high—facts reduce panic."`,
    `"Celebrate one small win related to ${t} each week to rebuild agency."`,
    `"If safety is a concern, prioritise exit plans and trusted contacts over keeping appearances."`,
    `"Reconciliation may be possible, but only with changed behaviour—not only promises."`,
    `"Long distance needs explicit agreements about communication frequency and visit plans."`,
    `"Boundaries can be kind: 'I care about you AND I cannot discuss this daily.'"`
  ];
  const extra = [
    `"Document agreements about ${t} in writing when family or money is involved—memory differs under stress."`,
    `"Use festival or wedding seasons to observe family dynamics before committing to major choices."`,
    `"If children are affected, keep adult conflicts away from their ears and never use them as messengers."`,
    `"Build an emergency fund before taking financial risks tied to ${t}."`
  ];
  return [...snippets, ...extra].slice(0, count);
}

export function buildFollowUps(topic, count = 32) {
  const t = topic.toLowerCase();
  const qs = [
    `How long has ${t} been bothering you?`,
    "Who else is involved, and what role do they play?",
    "What outcome would feel like a relief, even if it is not perfect?",
    "Have you spoken to anyone about this yet? How did it go?",
    "What are you most afraid might happen if you speak up?",
    "What are you most afraid might happen if you stay silent?",
    "Is there any immediate safety or health concern I should know about?",
    "How is your sleep and appetite these days?",
    "Does your family know about this situation? Do you want them to?",
    "What have you already tried that helped even a little?",
    "What made things worse when you tried it?",
    "Are there cultural or religious factors I should keep in mind?",
    "Is money part of this? Roughly how much pressure is there?",
    "Are children affected, directly or indirectly?",
    "Do you live with the people involved or separately?",
    "What would a good first step look like this week—something small?",
    "Is there someone you trust who could sit with you during a hard conversation?",
    "How would you know things are improving?",
    "What is non-negotiable for you here?",
    "Where do you feel you have room to compromise?",
    "Have there been similar situations in your past? What did you learn?",
    "Are you feeling pressured to decide quickly? By whom?",
    "How much of this is visible on social media or to friends?",
    "What does your gut say when you are calm, not panicked?",
    "Would you prefer practical steps, emotional support, or both right now?",
    "Is work or studies being affected? How?",
    "Do you want help drafting words for a conversation?",
    "Are you hoping to repair, exit, or just survive this phase?",
    "What support would feel respectful—not preachy—to you?",
    "Is there legal or official paperwork involved?",
    "How do festivals, weddings, or family events affect this?",
    "What would you want your future self to thank you for doing today?"
  ];
  return qs.slice(0, count);
}

export function buildRootCauses(topic) {
  return [
    "Unmet emotional needs or poor communication habits",
    "Mismatch in expectations without explicit discussion",
    "Financial stress amplifying other tensions",
    "Cultural or generational values clashing with personal goals",
    "Past hurt or betrayal affecting present trust",
    "Lack of boundaries leading to resentment",
    "Social comparison and pressure from relatives or social media",
    "Major life transitions (marriage, job, move, parenthood)",
    "Unequal division of labour or decision-making power",
    "Avoidance of difficult conversations until crisis point"
  ];
}

export function buildEmotions() {
  return [
    "Anxiety", "Sadness", "Anger", "Guilt", "Shame", "Confusion",
    "Loneliness", "Hope", "Relief", "Frustration", "Jealousy", "Fear of rejection"
  ];
}

export function buildWarningSigns(topic) {
  const t = topic.toLowerCase();
  return [
    `Thoughts about ${t} dominate most of your day`,
    "Sleep or eating patterns change noticeably for weeks",
    "You feel afraid of someone you should feel safe with",
    "Frequent crying, panic, or numbness",
    "Isolating from friends and activities you used to enjoy",
    "Substance use or reckless behaviour increasing",
    "Physical symptoms: headaches, stomach issues, fatigue",
    "Difficulty concentrating at work or studies",
    "Feeling hopeless about the future",
    "Repeated arguments escalating to insults or threats",
    "Secrets piling up and eroding self-respect",
    "Children showing stress signs if they are in the home"
  ];
}

export function buildHealthyPrinciples() {
  return [
    "Honesty with kindness beats silent resentment",
    "Boundaries protect relationships; they do not destroy them",
    "Both people's dignity matters—not only tradition or only rebellion",
    "Slow, informed decisions beat impulsive ones made in fear or anger",
    "Listen to understand before persuading",
    "Apologise for impact, not only intent",
    "Seek facts (medical, legal, financial) before catastrophising",
    "Rest and routine stabilise emotional decisions",
    "Children should not be weapons or messengers in adult conflicts",
    "Professional support is a tool, not a last resort for 'broken' people"
  ];
}

export function buildFirstSteps(topic) {
  return [
    "Name the core issue in one sentence—clarity first",
    "Choose one safe person to talk to or journal privately",
    "Pause major decisions for 72 hours if you are in acute distress",
    "List what is in your control this week vs what is not",
    "Schedule self-care basics: sleep, meals, short walk",
    "If needed, gather documents or facts before family meetings",
    "Draft talking points for one conversation—not ten at once",
    "Set a digital boundary (mute triggers, limit late-night scrolling)",
    "Identify one small boundary to practice saying aloud",
    "If harm is possible, contact a trusted adult, helpline, or local support"
  ];
}

export function buildLongTerm(topic) {
  return [
    "Build regular check-in rituals with key people",
    "Develop financial literacy and shared budgets where relevant",
    "Strengthen communication skills (active listening, I-statements)",
    "Create a support network beyond one person",
    "Review boundaries yearly as life stages change",
    "Invest in skills, health, and friendships independent of the issue",
    "Document agreements to reduce recurring misunderstandings",
    "Learn early signs of stress in yourself and act sooner",
    "Consider counselling as preventive maintenance",
    "Align daily choices with stated values—not only crisis reactions"
  ];
}

export function buildAvoid() {
  return [
    "Making permanent decisions in temporary anger",
    "Public shaming on social media or family WhatsApp groups",
    "Using silent treatment for days instead of structured pause",
    "Involving children in adult conflicts",
    "Threats, surveillance, or revenge as 'proof' of care",
    "Ignoring bank statements, legal notices, or health symptoms",
    "Promising reconciliation without changed behaviour",
    "Comparing your partner or child harshly to others",
    "Self-medicating with alcohol, drugs, or endless scrolling",
    "Isolating completely with no trusted contact"
  ];
}

export function buildAiQuestions(topic) {
  return [
    "What is your age and living situation?",
    "Who are the main people involved?",
    "What happened most recently that brought this up?",
    "What outcome are you hoping for?",
    "Is anyone's safety at risk?",
    "How is this affecting sleep, work, or studies?",
    "What does your family expect vs what do you want?",
    "Have you tried talking to them? What was the response?",
    "Is money or property involved?",
    "Are children affected?",
    "Do you want to repair, set boundaries, or exit?",
    "What timeline are you under?",
    "What would feel like a respectful next step to you?"
  ];
}

export function buildMistakes(topic) {
  return [
    "Assuming others can read your mind",
    "Winning the argument instead of solving the problem",
    "Involving too many relatives too early",
    "Making threats you do not intend to keep",
    "Sacrificing all boundaries to avoid short-term conflict",
    "Ignoring small resentments until they explode",
    "Taking advice from social media over your lived context",
    "Rushing marriage, breakup, or job quit to escape discomfort",
    "Hiding financial debt or health issues from partner",
    "Expecting one apology to erase repeated patterns"
  ];
}

export function buildConversationStyle() {
  return [
    "Warm, calm, and non-judgmental—like a wise older sibling",
    "Validate emotion before offering practical steps",
    "Ask permission before giving direct advice",
    "Use simple Hindi-English mix only if user does; mirror their language",
    "Avoid diagnosing; describe coping and options",
    "Never guarantee outcomes; use 'may', 'could', 'often helps'",
    "Acknowledge Indian family realities without stereotyping",
    "Encourage healthy communication over heroic sacrifice or rebellion",
    "Slow down impulsive decisions; suggest concrete small steps",
    "Close with one question to keep dialogue open"
  ];
}

export function childrenSection(topic, category) {
  return `If children are present, shield them from adult conflict about ${topic.toLowerCase()}. Avoid criticising the other parent or relative in front of them. Maintain routines—school, meals, sleep—as stability anchors. Watch for behaviour changes: withdrawal, aggression, or school refusal. Co-parenting or blended-family situations need explicit agreements on what kids are told and when. Never use children to deliver messages or spy. If custody, schooling, or relocation is involved, document decisions and seek legal guidance where appropriate. Children's emotional safety comes before adults' desire to 'win' a dispute.`;
}

export function financesSection(topic) {
  return `Money often sits underneath stress about ${topic.toLowerCase()}. Put income, expenses, debts, and obligations on paper together if sharing finances. Build or protect an emergency fund before irreversible choices. Wedding, education, medical, and elder-care costs are common flashpoints in Indian families—discuss who contributes what. Avoid secret loans or guarantor signatures for relatives without understanding risk. If property or inheritance is involved, written records and legal advice prevent decades of resentment. Financial transparency between spouses/partners is a form of respect, not suspicion.`;
}

export function mentalHealthSection(topic) {
  return `This guidance supports everyday coping around ${topic.toLowerCase()}—it is not a diagnosis. Persistent low mood, panic, sleep loss, or hopelessness lasting weeks deserve attention from a qualified professional. Tele-counselling, campus services, and helplines (e.g. iCall, Vandrevala Foundation) exist in India. Yoga, breathing, walks, and routine help many people but do not replace medical care when symptoms are severe. If someone expresses self-harm or harm to others, prioritise immediate safety and local emergency resources. Encourage help-seeking without shame; families can learn alongside the person struggling.`;
}

export function buildOverview(topic, category, meta) {
  return `${topic} is a common concern within ${meta.context}. Indian users often navigate ${topic.toLowerCase()} alongside family expectations, financial realities, and social visibility. This knowledge base helps an AI companion offer balanced, empathetic, practical support—without judging, diagnosing, or pushing impulsive decisions. The focus is on understanding emotions, clarifying choices, improving communication, and taking small actionable steps while respecting both individual autonomy and family values where possible.`;
}

export function pickRelated(topic, category, allTopics, meta) {
  const pool = meta.relatedPool.filter((t) => t !== topic);
  const sameCat = allTopics.filter((t) => t !== topic).slice(0, 3);
  const combined = [...new Set([...pool.slice(0, 4), ...sameCat])];
  return combined.slice(0, 6);
}
