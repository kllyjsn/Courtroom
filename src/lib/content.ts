export interface Objection {
  name: string;
  trigger: string;
  say: string;
  note: string;
}

/**
 * Common evidentiary objections. Phrasing is generic/common-law style (US-leaning).
 * Always verify against your jurisdiction's rules of evidence.
 */
export const OBJECTIONS: Objection[] = [
  {
    name: "Hearsay",
    trigger: "A witness repeats an out-of-court statement to prove it's true.",
    say: "Objection, hearsay.",
    note: "Many exceptions exist (e.g. admissions, business records, excited utterances). Be ready for the other side to claim one.",
  },
  {
    name: "Relevance",
    trigger: "The testimony or exhibit has nothing to do with the issues in the case.",
    say: "Objection, relevance.",
    note: "Evidence must make a fact of consequence more or less probable.",
  },
  {
    name: "Leading question",
    trigger: "On direct examination, the questioner suggests the answer.",
    say: "Objection, leading.",
    note: "Leading is usually allowed on cross-examination, not direct.",
  },
  {
    name: "Speculation",
    trigger: "The witness is asked to guess about something they don't know.",
    say: "Objection, calls for speculation.",
    note: "Witnesses generally testify only to what they personally perceived.",
  },
  {
    name: "Lack of foundation",
    trigger: "An exhibit/testimony is offered without showing it's authentic or the witness has personal knowledge.",
    say: "Objection, lack of foundation.",
    note: "Force the other side to establish who/what/when before the evidence comes in.",
  },
  {
    name: "Argumentative",
    trigger: "The 'question' is really the lawyer arguing or badgering.",
    say: "Objection, argumentative.",
    note: "Questions should seek facts, not pick a fight with the witness.",
  },
  {
    name: "Asked and answered",
    trigger: "The same question is repeated after it was already answered.",
    say: "Objection, asked and answered.",
    note: "Prevents harassment and wasting the court's time.",
  },
  {
    name: "Compound question",
    trigger: "Two or more questions are jammed into one.",
    say: "Objection, compound question.",
    note: "Ask the questioner to break it into separate questions.",
  },
  {
    name: "Vague / ambiguous",
    trigger: "The question is unclear and can't be fairly answered.",
    say: "Objection, vague and ambiguous.",
    note: "You can also simply say you don't understand the question.",
  },
  {
    name: "Improper character evidence",
    trigger: "The other side attacks character to prove someone 'acted in line with it.'",
    say: "Objection, improper character evidence.",
    note: "Character evidence is restricted; there are narrow exceptions.",
  },
  {
    name: "Best evidence rule",
    trigger: "Someone describes a document's contents instead of producing the document.",
    say: "Objection, best evidence rule.",
    note: "Generally the original writing should be produced to prove its contents.",
  },
  {
    name: "Privilege",
    trigger: "A question seeks attorney-client, spousal, or other privileged communication.",
    say: "Objection, privileged.",
    note: "Privileged communications are protected from disclosure.",
  },
];

export interface GuideSection {
  id: string;
  title: string;
  body: string[];
}

export const RIGHTS_GUIDE: GuideSection[] = [
  {
    id: "before",
    title: "Before the hearing",
    body: [
      "Read the rules: find your court's local rules and the rules of civil/criminal procedure online. Search '[your court] self-represented' or '[your court] pro se handbook'.",
      "Know your deadlines: filing responses, exchanging evidence (discovery), and witness lists often have strict dates. Missing them can lose your case automatically.",
      "Organize your file: keep one binder/folder with the complaint, your response, evidence (labeled), and a one-page outline of what you want to prove.",
      "Visit or watch the courtroom beforehand if you can, so the setting is familiar.",
      "Ask about free help: legal aid, court self-help centers, and law-school clinics often assist for free.",
    ],
  },
  {
    id: "etiquette",
    title: "Courtroom etiquette",
    body: [
      "Address the judge as 'Your Honor.' Stand when you speak to the judge or when they enter.",
      "Speak only when it's your turn. Don't interrupt the judge or the other side — note what you want to respond to and wait.",
      "Be calm and factual. Judges respond to organized, respectful, fact-focused presentation, not emotion or insults.",
      "Bring copies: usually one for the judge, one for the other side, and one for yourself.",
      "Silence your phone. Check whether recording or phones are even allowed — many courts prohibit them.",
    ],
  },
  {
    id: "burden",
    title: "Burden of proof (who has to prove what)",
    body: [
      "Civil cases: usually 'preponderance of the evidence' — more likely than not (>50%).",
      "Criminal cases: the prosecution must prove guilt 'beyond a reasonable doubt' — a much higher bar. As a defendant you do not have to prove innocence.",
      "Some matters use 'clear and convincing evidence,' an intermediate standard.",
      "Figure out who carries the burden on each issue — it changes your strategy. If the other side has the burden, you can win simply by showing they failed to meet it.",
    ],
  },
  {
    id: "structure",
    title: "How a hearing/trial usually flows",
    body: [
      "Opening statements: a brief roadmap of what you'll show (not argument).",
      "Plaintiff/prosecution case: they call witnesses (direct examination); then you cross-examine.",
      "Your case: you testify and/or call witnesses; the other side cross-examines.",
      "Evidence: each exhibit must be 'introduced' and admitted before the judge considers it.",
      "Closing arguments: tie the facts to what the law requires and ask for your outcome.",
    ],
  },
  {
    id: "testifying",
    title: "Examining witnesses & testifying",
    body: [
      "Direct examination: ask open questions (who/what/when/where/why) — no leading.",
      "Cross-examination: you may ask leading (yes/no) questions to control the witness. Keep them short and aim at specific facts.",
      "When you testify: tell the truth, stick to what you personally know, and don't volunteer beyond the question.",
      "If you don't know or don't remember, say so. Don't guess.",
    ],
  },
  {
    id: "rights",
    title: "Core rights to remember (general)",
    body: [
      "You generally have the right to be heard, to present evidence, and to question the other side's witnesses.",
      "In criminal matters you typically have the right to remain silent, the right to an attorney (and to court-appointed counsel if you can't afford one), and the presumption of innocence.",
      "You can ask the judge to explain a procedure: 'Your Honor, I'm representing myself — may I ask how to introduce this document?' Judges often accommodate good-faith questions.",
      "These are general principles. Exact rights vary by country, state, and court — verify yours.",
    ],
  },
];
