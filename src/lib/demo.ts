/**
 * Canned demo data: a fully populated CaseFile and pre-baked AI outputs
 * for every feature so the app demos well with zero API keys.
 */

import type {
  CaseFile,
  Authority,
  LegalClaim,
  Deadline,
} from "./types";
import type { ResearchResult } from "./ai";

/* ------------------------------------------------------------------ */
/*  Demo CaseFile                                                     */
/* ------------------------------------------------------------------ */

export const demoCase: CaseFile = {
  title: "Security Deposit Dispute — Reyes v. Brightwater Properties",
  jurisdiction: "California — Los Angeles County Small Claims Court",
  caseType: "landlord-tenant",
  role: "plaintiff",
  caseNumber: "24SC-04821",
  hearingDate: "2026-07-08",
  summary:
    "I rented an apartment at 1420 Maple St, Los Angeles CA from Brightwater Properties LLC for " +
    "2.5 years (Sept 2023 – March 2026). I paid a $2,400 security deposit at move-in. I gave " +
    "proper 30-day written notice and moved out on March 31, 2026, leaving the unit clean and " +
    "undamaged (I took dated move-out photos). The landlord returned only $1,200 on May 5, 2026 — " +
    "35 days after move-out — with NO itemized statement of deductions. California law requires " +
    "return or itemization within 21 days. I sent a written demand on May 12 but received no " +
    "response.",
  desiredOutcome:
    "Full return of the $2,400 deposit plus up to 2× statutory bad-faith penalty ($4,800) under " +
    "Cal. Civ. Code § 1950.5(l).",
  charges:
    "Wrongful withholding of security deposit; failure to provide itemized statement within 21 days.",
  parties: [
    { id: "p1", name: "Maria Reyes", role: "Plaintiff (you / tenant)", notes: "" },
    { id: "p2", name: "Brightwater Properties LLC", role: "Defendant (landlord)", notes: "Property management company" },
    { id: "p3", name: "Daniel Cho", role: "Property manager / witness", notes: "Handed me the partial refund check" },
  ],
  timeline: [
    { id: "t1", date: "September 1, 2023", description: "Signed lease; paid $2,400 security deposit" },
    { id: "t2", date: "February 28, 2026", description: "Gave 30-day written notice to vacate" },
    { id: "t3", date: "March 31, 2026", description: "Moved out; unit clean; took dated photos" },
    { id: "t4", date: "May 5, 2026", description: "Received $1,200 partial refund (35 days later, no itemization)" },
    { id: "t5", date: "May 12, 2026", description: "Sent written demand letter via certified mail" },
    { id: "t6", date: "June 2, 2026", description: "No response received; filed SC-100 small-claims form" },
  ],
  evidence: [
    { id: "e1", label: "Signed lease agreement", type: "document", description: "Shows $2,400 deposit amount and lease term", supports: "Deposit paid", exhibitId: "A" },
    { id: "e2", label: "Move-in condition photos", type: "photo", description: "Timestamped photos showing unit condition at move-in", supports: "Baseline condition", exhibitId: "B" },
    { id: "e3", label: "Move-out condition photos", type: "photo", description: "Timestamped photos taken March 31, 2026 showing clean unit", supports: "No damage beyond normal wear", exhibitId: "C" },
    { id: "e4", label: "Bank record of deposit payment", type: "document", description: "Shows $2,400 payment to Brightwater on Sept 1, 2023", supports: "Deposit amount", exhibitId: "D" },
    { id: "e5", label: "Partial refund check ($1,200)", type: "document", description: "Check dated May 5, 2026 — 35 days after move-out", supports: "Late return, no itemization", exhibitId: "E" },
    { id: "e6", label: "Text messages with property manager", type: "message", description: "Texts asking about deposit; Daniel Cho says 'still processing'", supports: "Landlord awareness of obligation", exhibitId: "F" },
    { id: "e7", label: "Demand letter (certified mail receipt)", type: "document", description: "Written demand sent May 12 with tracking showing delivery", supports: "Good-faith attempt to resolve", exhibitId: "G" },
  ],
  claims: [
    {
      id: "cl1",
      name: "Wrongful withholding of security deposit",
      byParty: "Plaintiff (you)",
      elements: [
        { id: "el1", text: "A security deposit was paid to the landlord", status: "conceded", evidenceIds: ["e1", "e4"], notes: "" },
        { id: "el2", text: "The tenancy terminated", status: "conceded", evidenceIds: [], notes: "Both sides agree move-out was March 31" },
        { id: "el3", text: "Landlord failed to return or provide itemized statement within 21 days", status: "disputed", evidenceIds: ["e5", "e6"], notes: "Refund came at day 35 with no itemization" },
        { id: "el4", text: "Amounts withheld were not for allowable deductions (damage, unpaid rent)", status: "disputed", evidenceIds: ["e2", "e3"], notes: "Photos show only normal wear and tear" },
      ],
    },
    {
      id: "cl2",
      name: "Bad-faith penalty (up to 2× deposit)",
      byParty: "Plaintiff (you)",
      elements: [
        { id: "el5", text: "Landlord's retention was in bad faith", status: "disputed", evidenceIds: ["e5", "e6", "e7"], notes: "No itemization, ignored demand letter, 35-day delay" },
        { id: "el6", text: "Penalty amount is reasonable (up to 2× deposit)", status: "unaddressed", evidenceIds: [], notes: "Court discretion" },
      ],
    },
  ],
  deadlines: [
    { id: "d1", title: "File SC-100 Plaintiff's Claim", date: "2026-06-02", detail: "Small claims filing form", done: true, source: "manual" },
    { id: "d2", title: "Serve defendant (min 15 days before hearing)", date: "2026-06-23", detail: "Personal service or certified mail; keep proof of service (SC-104)", done: false, source: "ai" },
    { id: "d3", title: "Prepare evidence copies (2 sets)", date: "2026-07-01", detail: "One for the court, one for the other side; organize by exhibit label", done: false, source: "ai" },
    { id: "d4", title: "Practice your opening statement", date: "2026-07-05", detail: "Keep it under 3 minutes: who you are, what happened, what you want", done: false, source: "ai" },
    { id: "d5", title: "Hearing date", date: "2026-07-08", detail: "LA County Small Claims — arrive 30 min early, dress formally, bring all originals + copies", done: false, source: "manual" },
  ],
  documents: [
    {
      id: "doc1",
      name: "Demand_Letter_May12.pdf",
      kind: "application/pdf",
      text: "May 12, 2026\n\nBrightwater Properties LLC\n742 Commerce Dr, Suite 200\nLos Angeles, CA 90015\n\nRe: Return of Security Deposit — 1420 Maple St, Apt 3B\n\nDear Brightwater Properties:\n\nI vacated the above premises on March 31, 2026 and am entitled to a full refund of my $2,400 security deposit. California Civil Code § 1950.5 requires a landlord to return the deposit or provide an itemized statement of deductions within 21 calendar days. As of today — 42 days after move-out — I have received only a $1,200 partial refund with no written itemization.\n\nI demand the return of the remaining $1,200 within 7 days. Failure to do so will result in my filing a claim in Small Claims Court, where I will also seek the bad-faith penalty of up to twice the deposit amount as allowed under § 1950.5(l).\n\nSincerely,\nMaria Reyes",
      addedAt: 1717500000000,
    },
  ],
  updatedAt: Date.now(),
};

/* ------------------------------------------------------------------ */
/*  Canned Research result                                            */
/* ------------------------------------------------------------------ */

export const demoResearch: ResearchResult = {
  content: `## Key Laws for Your Security Deposit Claim

**California Civil Code § 1950.5** is the primary statute governing residential security deposits in California. Here are the provisions most relevant to your case:

### 1. 21-Day Return Rule (§ 1950.5(g))
After a tenant vacates, the landlord must return the full deposit **or** mail/deliver an itemized statement of deductions with any remaining balance within **21 calendar days**. In your case the partial refund came at day 35 with no itemization — a clear violation.

### 2. Allowable Deductions (§ 1950.5(b))
A landlord may only deduct for:
- Unpaid rent
- Cleaning (beyond what's reasonably clean)
- Repair of damages **beyond normal wear and tear**
- Restoration if the tenant fails to restore items per a contractual obligation

Your move-out photos showing the unit in clean, undamaged condition undercut any deduction defense.

### 3. Bad-Faith Penalty (§ 1950.5(l))
If the landlord retained the deposit in **bad faith**, the court may award the tenant up to **twice the deposit amount** as a penalty — in your case up to **$4,800** on top of the $1,200 still owed.

### 4. Burden of Proof
The **landlord** bears the burden of proving any deduction was reasonable (§ 1950.5(l)). You don't have to prove the unit was perfect; they have to prove each dollar withheld was justified.

### 5. Small Claims Procedure
Los Angeles County Small Claims allows claims up to **$12,500** for individuals. You filed SC-100 correctly. Serve the defendant at least 15 days before the hearing (personal service) or 20 days (service by certified mail).

### What to Verify
- Confirm the exact hearing rules at **lacourt.org** (LA County Superior Court self-help).
- Double-check that your service timeline meets the minimum under CCP § 116.340.`,
  citations: [
    "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=1950.5&lawCode=CIV",
    "https://www.courts.ca.gov/selfhelp-smallclaims.htm",
    "https://selfhelp.courts.ca.gov/small-claims/prepare-for-hearing",
    "https://www.nolo.com/legal-encyclopedia/california-security-deposits-36199.html",
    "https://lacourt.org/division/smallclaims/smallclaims.aspx",
  ],
};

export const demoAuthorities: Authority[] = [
  {
    id: "a1",
    citation: "California Civil Code § 1950.5",
    url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=1950.5&lawCode=CIV",
    quote: "The landlord may claim of the amount of a deposit only those amounts as are reasonably necessary for rent, cleaning, repair of damages beyond normal wear and tear…",
    status: "verified",
    note: "Primary statute for security deposit rights. Verified on official CA legislature site.",
  },
  {
    id: "a2",
    citation: "California Civil Code § 1950.5(g)",
    url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=1950.5&lawCode=CIV",
    quote: "…the landlord shall furnish the tenant, by personal delivery or by first-class mail, postage prepaid, a copy of an itemized statement… within 21 calendar days after the tenant has vacated…",
    status: "verified",
    note: "21-day return/itemization deadline confirmed.",
  },
  {
    id: "a3",
    citation: "California Civil Code § 1950.5(l)",
    url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=1950.5&lawCode=CIV",
    quote: "…the bad faith claim or retention by a landlord… may subject the landlord to statutory damages of up to twice the amount of the security…",
    status: "verified",
    note: "Bad-faith penalty provision confirmed (up to 2× deposit).",
  },
  {
    id: "a4",
    citation: "CCP § 116.340",
    url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=116.340&lawCode=CCP",
    quote: "Service of the claim shall be made by personal delivery… not less than 15 days before the hearing date…",
    status: "verified",
    note: "Service deadline for small claims confirmed.",
  },
  {
    id: "a5",
    citation: "Granberry v. Islay Investments",
    url: "",
    quote: "",
    status: "failed",
    note: "Could not locate this case citation — it may be incorrectly cited or a hallucination. Verify independently before using.",
  },
];

/* ------------------------------------------------------------------ */
/*  Canned Argument draft                                             */
/* ------------------------------------------------------------------ */

export const demoArgument = `## Theory of the Case

Brightwater Properties wrongfully withheld half of Maria Reyes's $2,400 security deposit, returned the other half 14 days late, and never provided the itemized statement required by California law — entitling Ms. Reyes to the full deposit plus a bad-faith penalty.

## Key Points

### 1. The Deposit Was Paid and the Tenancy Ended Properly
I paid a $2,400 security deposit on September 1, 2023 (Exhibit A — signed lease; Exhibit D — bank record). I gave proper 30-day written notice on February 28, 2026 and vacated on March 31, 2026. These facts are undisputed.

### 2. The Landlord Violated the 21-Day Rule
Cal. Civ. Code § 1950.5(g) requires the landlord to return the deposit or provide an itemized statement within **21 calendar days**. The partial refund check is dated May 5, 2026 — **35 days** after move-out (Exhibit E). No itemized statement was ever provided.

### 3. The Unit Was Left in Good Condition
I have timestamped move-in photos (Exhibit B) and move-out photos (Exhibit C) showing the unit was clean and undamaged — only normal wear and tear after 2.5 years. The landlord cannot justify withholding $1,200 without evidence of actual damage.

### 4. The Landlord Acted in Bad Faith
I sent a written demand on May 12 via certified mail (Exhibit G). Despite confirmed delivery, I received no response. The combination of: (a) missing the 21-day deadline, (b) providing no itemization, and (c) ignoring my demand letter demonstrates bad faith, which entitles me to a penalty of up to **2× the deposit** under § 1950.5(l).

## Closing Ask

Your Honor, I respectfully request:
1. Return of the remaining **$1,200** withheld from my deposit
2. A **bad-faith penalty of $4,800** (2× the full $2,400 deposit)
3. Total judgment of **$6,000** in my favor

The evidence is clear: the deposit was paid, the unit was left in good condition, and the landlord violated every timeline and notice requirement in the statute.`;

/* ------------------------------------------------------------------ */
/*  Canned Mock Hearing turns + feedback                              */
/* ------------------------------------------------------------------ */

export interface DemoTurn {
  speaker: "Judge" | "Opposing Counsel" | "You";
  text: string;
}

export const demoHearingTurns: DemoTurn[] = [
  { speaker: "Judge", text: "Good morning. This is case number 24SC-04821, Reyes versus Brightwater Properties. Is the plaintiff present?" },
  { speaker: "You", text: "Yes, Your Honor. Maria Reyes, appearing for myself." },
  { speaker: "Judge", text: "Thank you. And for the defendant?" },
  { speaker: "Opposing Counsel", text: "Daniel Cho, property manager for Brightwater Properties, Your Honor." },
  { speaker: "Judge", text: "Very well. Ms. Reyes, as the plaintiff this is your case. Please give a brief opening statement — what happened and what you're asking for." },
  { speaker: "You", text: "Thank you, Your Honor. I rented an apartment from Brightwater for two and a half years. I paid a $2,400 security deposit. I gave proper notice, moved out, and left the unit in good condition — I have photos. California law says the landlord has 21 days to return the deposit or explain the deductions. They didn't do either. They sent me half the money back after 35 days with no written explanation. I'm asking for the full deposit back plus the bad-faith penalty the statute allows." },
  { speaker: "Judge", text: "Mr. Cho, your response?" },
  { speaker: "Opposing Counsel", text: "Your Honor, there was damage to the kitchen countertop and the bathroom needed deep cleaning. We estimated $1,200 in repairs. We returned the remainder in good faith." },
  { speaker: "Judge", text: "Mr. Cho, did you provide Ms. Reyes with an itemized statement of the deductions?" },
  { speaker: "Opposing Counsel", text: "We… intended to, but it was delayed due to getting contractor quotes." },
  { speaker: "Judge", text: "Ms. Reyes, do you have your evidence organized?" },
  { speaker: "You", text: "Yes, Your Honor. I have seven exhibits labeled A through G. Exhibit A is the signed lease showing the $2,400 deposit. Exhibits B and C are timestamped photos from move-in and move-out — the unit was in the same condition. Exhibit E is the refund check dated 35 days after I moved out. And Exhibit G is my demand letter that was ignored." },
];

export interface DemoFeedback {
  score: number;
  strengths: string[];
  improvements: string[];
  missedObjections: string[];
}

export const demoFeedback: DemoFeedback = {
  score: 78,
  strengths: [
    "Clear, concise opening statement that hit all key facts",
    "Well-organized exhibits — labeled A through G and referenced by letter",
    "Good command of the statute and the 21-day timeline",
  ],
  improvements: [
    "State the specific statute (Cal. Civ. Code § 1950.5) by name in your opening — it signals preparation",
    "When opposing counsel claimed 'damage to the countertop,' you could have asked: 'Do you have photos or a contractor invoice?'",
    "Slow down slightly — judges appreciate a measured pace, especially when presenting evidence",
  ],
  missedObjections: [
    "Opposing counsel's claim of 'deep cleaning' is vague — you could object: 'Your Honor, normal wear and tear is not a valid deduction under § 1950.5(b). I'd like to see their cleaning invoice.'",
    "When counsel said the itemization was 'delayed,' you could note: 'The statute sets a hard 21-day deadline, not a best-effort guideline.'",
  ],
};

/* ------------------------------------------------------------------ */
/*  Canned Form body (Declaration)                                    */
/* ------------------------------------------------------------------ */

export const demoFormBody = `DECLARATION OF MARIA REYES IN SUPPORT OF CLAIM

I, Maria Reyes, declare under penalty of perjury under the laws of the State of California that the following is true and correct:

1. I am the plaintiff in this action. I have personal knowledge of the facts stated herein.

2. On or about September 1, 2023, I entered into a residential lease agreement with Brightwater Properties LLC for the premises located at 1420 Maple St, Apt 3B, Los Angeles, CA 90026.

3. At the time of signing the lease, I paid a security deposit of $2,400.00 to Brightwater Properties LLC. (See Exhibit A — Lease Agreement; Exhibit D — Bank Record.)

4. I provided written 30-day notice of my intent to vacate on February 28, 2026, and moved out of the premises on March 31, 2026.

5. On March 31, 2026, I took timestamped photographs of every room in the apartment documenting its condition. The unit was clean, free of damage beyond normal wear and tear after 2.5 years of occupancy. (See Exhibits B and C — Move-In and Move-Out Photos.)

6. Under California Civil Code § 1950.5(g), the landlord was required to return my security deposit or provide an itemized statement of deductions within 21 calendar days after I vacated — that is, by April 21, 2026.

7. On May 5, 2026 — 35 days after I vacated — I received a check for $1,200.00 from Brightwater Properties LLC. The check was not accompanied by any itemized statement of deductions. (See Exhibit E — Partial Refund Check.)

8. On May 12, 2026, I sent a written demand letter via certified mail requesting the return of the remaining $1,200.00. (See Exhibit G — Demand Letter and Certified Mail Receipt.)

9. As of the date of this declaration, I have received no response to my demand and no itemized statement of deductions.

10. I believe the landlord's retention of $1,200.00 of my deposit is in bad faith, as they have provided no justification and have violated the statutory timeline.

I declare under penalty of perjury under the laws of the State of California that the foregoing is true and correct.

Executed on [DATE], at Los Angeles, California.

____________________________
Maria Reyes, Plaintiff`;

/* ------------------------------------------------------------------ */
/*  Canned Claims (for CaseTheory simulation)                        */
/* ------------------------------------------------------------------ */

export const demoClaims: LegalClaim[] = demoCase.claims;

/* ------------------------------------------------------------------ */
/*  Canned Deadlines (for Deadlines simulation)                       */
/* ------------------------------------------------------------------ */

export const demoDeadlines: Deadline[] = demoCase.deadlines;
