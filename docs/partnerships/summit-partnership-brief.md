# Summit Partnership Brief — TailorNow

**Status:** Draft for internal brainstorm
**Owner:** _(add name)_
**Date:** 2026-08-03
**Summit:** _(add name / date / location — needed before any outreach so the opener is credible)_

---

## 1. Why this document exists

We met five organisations at the summit and want to open partnership conversations with each.
This doc is here so that:

1. Everyone on the team knows **who these companies are** without having to Google them.
2. We can brainstorm, for each one, **what we want from them** and **what they get from us** — a partnership only survives if both columns are full.
3. We arrive at each first meeting with **one specific ask**, not a vague "let's explore synergies".

**How to use it:** read §2 (our own pitch — we must all tell the same story), skim the table in §3,
then go deep on the company you own. Add your thinking directly under the "Team brainstorm"
prompts in each section. Unresolved items are collected in §7.

> ⚠️ **Accuracy note.** Company facts below come from public sources (linked in §8) and are marked
> with a confidence level. Two entries — **Norsh** and **Open Data Center** — could not be
> positively identified from the note alone and need confirming before we send anything. Do not
> paste unverified figures into an email to the company itself.

---

## 2. Our side of the table: what TailorNow is

**One-liner:** TailorNow is Nigeria's marketplace for custom fashion — it connects customers to
verified tailors and fashion creatives, and handles the whole order end to end: booking,
measurements, pricing, escrow-style payment, production tracking, pickup/delivery, and reviews.

**Live at:** https://tailornow.shop

**What the product actually does today**

| Capability | Detail |
| --- | --- |
| Discovery | Browse/filter creatives by city, service and rating; portfolios and verified badges |
| Social feed | Style feed with fashion categories (Style of the Week, Ankara, Bridal, Street Wear, Alte) |
| Ordering | Order request → creative accepts → agreed price → payment → production stages → delivery |
| Measurements | Customer stores measurements once, reused on every order |
| Payments | Card / bank-transfer collection with automatic split settlement to the creative's own bank account |
| Trust | Mutual ratings (customer ↔ creative), disputes flow, admin-verified onboarding of creatives |
| Logistics | Fabric pickup and finished-garment delivery |
| Group orders | Aso-ebi / group and uniform ordering |
| Admin | Full back office: onboarding, payouts, disputes, moderation, broadcast messaging |

**Unit economics as configured today:** 20% platform commission on the agreed order price, plus a
3% service charge on top of the customer's total. Both are single constants in the codebase, so
partner-specific pricing is a config change, not a rebuild.

**Stack:** Next.js 16 / React 19, Supabase (Postgres, auth, storage), Paystack for payments and
split settlement, Resend for transactional email, deployed on Vercel.

**What we are genuinely short of** — this is what partnerships need to solve, in priority order:

1. **Supply and demand density.** More verified creatives per city, and a repeatable channel to
   paying customers. Everything else is secondary.
2. **Payment coverage and cost.** Card + transfer only reaches part of the market. USSD and QR
   would reach customers who don't complete a card checkout, and lower switching cost improves
   creative take-home.
3. **Distribution through someone else's customer base.** We convert far better inside an existing
   trusted relationship (a bank's app, a telco bundle, an employer's staff portal) than from cold ads.
4. **Cloud, infrastructure and AI cost.** We are self-funding compute; credits or sponsored
   infrastructure directly extends runway.
5. **Credibility and capital.** Investor-readiness, governance, and a name to put in a deck.

**What we can offer a partner** — worth internalising, because we lead with this, not with our ask:

- A **greenfield merchant category**: thousands of small tailoring businesses that are almost
  entirely cash-based and outside the formal digital economy. We aggregate them; a partner reaching
  them one by one cannot.
- **Transaction volume** routed through whichever rails we integrate.
- **A consumer-facing brand and a young audience** — useful to a partner whose own brand is B2B
  and invisible to end users.
- **A reference case study** in a sector (creative economy / fashion) that every corporate
  sustainability, financial-inclusion and SME-empowerment report wants to feature.
- **Co-marketing**: our feed, our creatives' social reach, joint launch events.
- **A live testbed**: we ship weekly and can integrate and publicly validate a partner's new
  product faster than an enterprise customer can get through procurement.

---

## 3. The five at a glance

| Company | What they are | Their strategic value to us | Our headline ask | Their headline win | Priority |
| --- | --- | --- | --- | --- | --- |
| **CoralPay** | CBN-licensed payment switch & PSSP | Payment rails: USSD, QR, bank transfer, acquiring | Merchant/switching deal + USSD & NQR checkout | A whole new merchant category (tailors) onboarded in bulk | **High** |
| **Snapnet** | Enterprise tech consultancy, Tier 1 Microsoft CSP | Cloud/AI credits, enterprise uniform channel | Azure credits via CSP + intro to their corporate clients for uniforms | Consumer showcase for their AI/cloud practice; SME digitisation story | **High** |
| **Open Data Center** (assumed OADC) | Pan-African carrier-neutral data centres | Hosting, edge/CDN, low-latency Nigerian delivery | Sponsored/discounted colocation or edge caching | Startup-programme case study; ecosystem anchor tenant | Medium |
| **LSEG** | London Stock Exchange Group — global markets infrastructure | Credibility, investor network, growth programmes (ELITE) | A place in a growth/scale-up programme or intro to their Africa network | Africa creative-economy story for their SME/inclusion agenda | Medium (long game) |
| **Norsh** | ⚠️ Not yet identified | TBD | TBD | TBD | Blocked — see §7 |

---

## 4. Company briefs

### 4.1 CoralPay — payment rails

- **Website:** http://www.coralpay.com
- **LinkedIn:** https://ng.linkedin.com/company/coralpay-technology-nig-limited
- **HQ:** Lagos, Nigeria
- **Confidence:** High — clear public profile.

**What they do.** CoralPay Technology (Nig) Ltd is a payment technology company operating in
Nigeria since the mid-2000s, licensed by the Central Bank of Nigeria as a Payment Solutions Service
Provider (PSSP), a non-bank acquirer, and — since 2018 — a **payment switching company**. Their
stated vision is to be "the gold standard for payment and processing in Africa".

**Products that matter to us.**

| Product | Why it matters to TailorNow |
| --- | --- |
| **C'Gate USSD** | Checkout on a feature phone or with no data. Reaches customers *and* tailors who never finish a card checkout. |
| **NQR** (QR payments) | A tailor's shop can take an in-person deposit by QR that lands inside our order record — bridges offline walk-ins into the platform. |
| **Pay-With-Bank-Transfer** | Nigeria's highest-trust consumer payment method. |
| **Payment gateway, card issuing & acquiring** | Alternative or second rail to our current gateway; non-bank acquiring may improve pricing. |
| **Instant Pay (interbank transfers)** | Creative payouts. |
| **Fast Channel (bulk payments)** | Batch payouts to many creatives — directly relevant to group/aso-ebi and uniform contracts. |
| **VAS API (bill payments)** | Optional future revenue line inside our app. |

**What we want from them (the ask).**

1. A **merchant/PSSP agreement with switching pricing that reflects aggregated volume** across all
   our creatives, rather than each tailor being priced as a standalone micro-merchant.
2. **USSD (C'Gate) and NQR added as checkout options** on TailorNow, alongside card and transfer.
3. **Bulk payout / Fast Channel access** for settling many creatives at once.
4. Sandbox + integration engineering support, and a named technical contact.
5. Nice-to-have: co-branded launch ("Pay for your tailor with *code*") and their compliance team's
   guidance on our escrow-style flow.

**What they get.**

- **A merchant category they cannot reach one-by-one.** Tailors are numerous, cash-based, and
  individually too small to acquire profitably. We hand them a pre-verified, KYC'd cohort through
  one integration.
- **Transaction volume with a young, repeat-purchase consumer base** — custom fashion is a
  recurring, occasion-driven spend, not one-off.
- **A flagship use case for USSD and NQR in the creative economy** — exactly the financial-inclusion
  narrative a switch wants in its regulator and press conversations.
- **Genuine product feedback** from a partner shipping weekly.

**Watch-outs.** We already run on Paystack with split settlement; migrating or dual-railing has
engineering cost, so the ask should be framed as *adding reach* (USSD/QR) first and re-pricing
second. Confirm whether their split/subaccount-equivalent supports automatic settlement to the
tailor, or whether we take custody and pay out — a custody model changes our regulatory and
reconciliation position and is worth avoiding.

**Team brainstorm prompts.**
- What % of our checkout drop-off would USSD plausibly recover? Do we have the funnel numbers to
  quote in the meeting?
- Is dual-rail (Paystack + CoralPay) worth the reconciliation complexity, or do we pick one?
- Would in-shop NQR let us onboard tailors who currently take cash — i.e. is this a *supply*
  acquisition tool as much as a payment feature?

---

### 4.2 Snapnet — cloud, AI, and the enterprise channel

- **Website:** https://snapnetsolutions.com (also https://snapnet.tech)
- **LinkedIn:** https://ng.linkedin.com/company/snapnetnigeria
- **Offices:** Lagos and Abuja
- **Leadership:** Chuma Ukeagu, CEO / Principal Consultant
- **Confidence:** High.

**What they do.** Snapnet is a Nigerian enterprise technology consultancy and SaaS firm — cloud,
AI, data, security, ERP and business applications — serving financial services, oil & gas, energy,
telecoms, manufacturing and government. They position themselves as one of Nigeria's foremost
**Tier 1 Microsoft Cloud Solution Providers**, with a partner roster including Microsoft, Cisco,
Dell, IBM, HP, Oracle and Check Point. They also do managed services, custom software and training.

**Why they're interesting — two very different plays.**

*Play A — we are their customer/beneficiary (infrastructure).* As a Tier 1 Microsoft CSP they can
sponsor or resell Azure capacity and, importantly, nominate startups for Microsoft partner benefits
and credits. Our AI features (portfolio polish, and more we want to build — style search, automatic
measurement guidance, demand forecasting for creatives) run on paid inference today.

*Play B — they are our channel (enterprise uniforms).* This is the bigger prize. Snapnet's client
list is exactly who buys **corporate uniforms, staff wear and branded apparel at scale** — banks,
oil & gas, telcos, government agencies, manufacturers. We already support group and uniform orders.
Every corporate uniform contract we win is worth hundreds of individual consumer orders and gives
our creatives predictable, high-volume work.

**What we want from them.**

1. **Microsoft/Azure credits or sponsored cloud** through their CSP relationship, plus a nomination
   into Microsoft's startup programme if they can make one.
2. **Warm introductions to their enterprise clients** for uniform and staff-wear supply — positioned
   as them bringing a client a local, verified, tech-managed supplier.
3. **A referral or revenue-share arrangement** so the intro is worth their while — they take a cut
   of uniform contracts they originate.
4. Optional: technical advisory / architecture review, and access to their training arm for
   upskilling our creatives on the digital side.

**What they get.**

- **Referral revenue** on uniform contracts, from a category they don't currently monetise.
- **A consumer-facing AI/cloud showcase.** Their portfolio is enterprise back-office; a live
  consumer marketplace running AI on their sponsored stack is a far better demo and press story.
- **An SME-digitisation narrative with real numbers** — "we're putting N thousand informal
  tailoring businesses on the cloud" — useful for their Microsoft partner standing and their own CSR
  and marketing.
- **Consumption growth**: as a CSP they earn on the cloud we consume, so our growth is their growth.
  Credits now, annuity later — say this explicitly.
- A friendly proving ground for their new AI/data offerings.

**Watch-outs.** They are a consultancy: their default instinct may be to *sell us services*. Steer
the conversation to credits and channel, not billable hours. Also make sure we can actually deliver
on an enterprise uniform contract (capacity, QC, lead times, invoicing, possibly 30–60 day payment
terms) before we ask for the intro — a fumbled first corporate order costs us the channel and
embarrasses them.

**Team brainstorm prompts.**
- Can we service a 500-unit uniform order today? What's the honest max, and what breaks first?
- What referral % is defensible against our 20% commission on a large, low-margin bulk order?
- Do we want their training arm running "digital skills for creatives" sessions as a supply-side
  acquisition hook?

---

### 4.3 Open Data Center — hosting, connectivity and edge

> ⚠️ **Identity to confirm.** The note says "Open data center". The strongest match in the Nigerian
> market is **Open Access Data Centres (OADC)**. Confirm from the badge/card you collected before
> using this section, and correct the name and facts if it was a different company.

- **Website (assumed):** https://openaccessdc.net — Lagos site: https://openaccessdc.net/lagos
- **Parent:** WIOCC (West Indian Ocean Cable Company)
- **Confidence:** Medium on identity, high on the facts below *if* it is OADC.

**What they do.** OADC operates pan-African **carrier-neutral data centres**. Their flagship Nigerian
facility is in Lekki, Lagos (opened 2022) and is the **landing station for the Equiano subsea cable**
in Nigeria — which is a large part of why Nigerian bandwidth got faster and cheaper. Public reporting
in 2025 put an announced ~$240m expansion to 24MW in Lagos on the roadmap. They serve cloud and
content providers, carriers, banks, ISPs, government and large enterprises, and also market edge
sites closer to end users.

**Why they matter to us.** Our users are in Nigeria; a meaningful share of our stack is not. Every
image in the style feed, every portfolio photo and fabric shot, is served over that distance. Our
product is image-heavy and mobile-first, on data plans people pay for by the megabyte.

1. **Latency and page weight** — in-country hosting or edge caching makes the feed noticeably faster
   for the exact audience we're trying to retain.
2. **Data residency** — a credible answer on where Nigerian customers' data (including
   measurements, which are personal data under the NDPA) physically lives. This becomes a hard
   requirement the moment we sign a bank or government uniform contract.
3. **Cost** — sponsored colocation or CDN/egress relief is a direct saving.
4. **Ecosystem access** — a carrier-neutral facility is where the ISPs, banks and cloud providers
   already are. Introductions are part of the value.

**What we want from them.**

1. **Sponsored or heavily discounted colocation / cloud capacity**, or entry to any startup or
   ecosystem programme they run.
2. **Edge caching / CDN for our media** so images are served in-country.
3. Peering/connectivity guidance and introductions to ISPs and telcos in the facility.
4. Co-marketing as a homegrown platform running on Nigerian infrastructure.

**What they get.**

- **An anchor local success story.** Their commercial pitch is that African digital products should
  be hosted in Africa; a fast-growing consumer marketplace proving it is a better case study than
  another enterprise migration.
- **Growth into a paying tenant** as we scale — sponsorship now, real spend later.
- **Consumer-brand visibility.** Data centres are invisible to end users; we put their name in front
  of a young consumer audience.
- Ecosystem credibility with the startup community they want colocating with them.

**Watch-outs.** Colocation is a heavier commitment than managed cloud and pulls us away from our
current Vercel/Supabase setup — a full migration is almost certainly not worth it. Scope this to
**media/CDN and data residency** first, which we can adopt without re-architecting. Also check
minimum contract terms; "discounted" colo with a 24-month commitment is a liability, not a gift.

**Team brainstorm prompts.**
- What's our actual monthly image egress and Nigerian median load time? Measure before the meeting.
- Does data residency block any deal we're currently chasing? If yes, this jumps to high priority.
- Is there a lighter version of this — just CDN — that gets 80% of the benefit?

---

### 4.4 LSEG — credibility, capital and the long game

- **Website:** https://www.lseg.com
- **Confidence:** High on the company; **their specific reason for being at the summit needs
  confirming**, since LSEG spans exchanges, data and analytics, and post-trade — very different
  conversations.

**What they do.** London Stock Exchange Group is a 300-year-old global financial markets
infrastructure and data business, operating in ~65 countries. Beyond the exchange itself it runs one
of the world's largest financial data and analytics businesses (Refinitiv), post-trade services, and
technology that powers exchanges worldwide — including LSEG Technology, which has supplied trading
systems to African exchanges.

**Relevant Africa activity.** LSEG has a long record of supporting African capital markets: it hosts
the **London Africa Advisory Group**, has published the **"Companies to Inspire Africa"** reports
profiling high-growth African businesses, and runs **ELITE** — a growth-company programme giving
ambitious private companies training, mentoring, an investor network and preparation for raising
capital. ELITE has expanded into Africa (Morocco, West Africa/UEMOA via BRVM, an MoU with Nairobi
Securities Exchange and FSD Africa) with dozens of African companies on the programme.

**Be realistic.** LSEG is not going to integrate with a tailoring marketplace. The value here is
**not commercial — it is credibility, network and capital readiness**, and it is a 12–36 month play.
That does not make it low value: one line about an LSEG programme in a fundraising deck changes how
investors read us.

**What we want from them.**

1. **A place on ELITE** (or whatever their current growth-company programme is for our region) —
   this is the concrete, askable thing.
2. **Consideration for "Companies to Inspire Africa"** or equivalent visibility, if it's still running.
3. **Introductions into their Africa network** — the advisory group, their development-finance
   partners (e.g. FSD Africa), and investors who follow their programmes.
4. **Guidance on capital-markets readiness**: governance, reporting, and what a company like us
   needs to look like to raise institutional money.
5. If it's LSEG's data/analytics arm we met: market and sector data access on startup terms.

**What they get.**

- **Pipeline.** Their programmes exist to find and develop the next generation of high-growth
  companies; Nigeria's creative economy is a sector they have almost no exposure to.
- **A financial-inclusion and creative-economy story** for their Africa agenda and sustainability
  reporting — informal artisans formalising through a digital platform is precisely the narrative
  their Africa work is built on.
- **Nigerian market intelligence** from the ground on how digital commerce and payments actually work.
- Low cost to them: a programme place and introductions, not capital or engineering.

**Watch-outs.** Do not open with an ask for money — that reads as naïve and burns the contact. Open
with the sector insight and ask about the programme. Also: identify *which part* of LSEG we spoke to
and get the individual's actual remit; a wrong-department follow-up will simply be ignored. This
relationship is nurtured, not transacted.

**Team brainstorm prompts.**
- Who on the team owns this, and can they credibly hold a capital-markets conversation?
- Are we ELITE-eligible? (Check current revenue/stage criteria on elite-network.com.)
- What's the one insight about Nigerian creative commerce we can offer that they can't buy?

---

### 4.5 Norsh — ⚠️ needs identification

- **Confidence:** Low. **Do not send outreach until resolved.**

Public searches did not return a company clearly matching "Norsh" in the Nigerian tech or fashion
ecosystem. Candidates found, none confirmed:

| Candidate | Note |
| --- | --- |
| https://norsh.org | Site exists; content not retrievable, purpose unconfirmed |
| https://bynorsh.com | Site exists; content not retrievable, appears to be a separate brand |
| Norsh Luxury Homes Ltd (Lagos) | Real-estate company, Lagos — plausible if the summit had a property/lifestyle track |
| Norrsken / Norrsken22 | Impact-investing group and VC fund — **possible misspelling**, and if so this is a *high-value* contact (Norrsken22 is an Africa-focused growth fund) |

**Action:** check the badge, business card, LinkedIn connections, or the summit exhibitor list from
that day and confirm the exact legal name. If it turns out to be **Norrsken22**, treat it as a
priority investor conversation, not a commercial partnership, and reframe accordingly.

Once identified, fill in: what they do → why they matter → our ask → their win → watch-outs.

---

## 5. Cross-cutting brainstorm — questions for the whole team

**On the asks**
1. If we could only land **one** of these five, which one and why? (Forces us to rank effort honestly.)
2. Which of our five needs from §2 does each partner actually solve — and which need is still
   unaddressed by all five?
3. Where are we asking for something we're not ready to receive? (Enterprise uniform contracts are
   the obvious risk.)

**On what we're giving**
4. Are we over-promising co-marketing reach? What are our real audience numbers, and are we
   comfortable quoting them?
5. Is there a partner where we should offer **exclusivity** (e.g. sole payment rail) in exchange for
   materially better terms — and would we regret it in 18 months?

**On sequencing**
6. Payments and cloud are quick wins; LSEG is a slow burn. Should two people run the fast track
   while one nurtures the slow one?
7. Which conversations are cheap to have in parallel, and which need a result from another first?
   (E.g. do we want a payments story settled before we approach enterprise clients through Snapnet?)

**On risk**
8. What does each partner learn about our business that we'd rather they didn't? Any of them close
   enough to build this themselves?
9. What's our walk-away point in each case — the terms at which the partnership costs more than it
   returns?

---

## 6. Outreach plan

**Sequence.** Send within a week of the summit while recall is warm. Order:
CoralPay and Snapnet first (fastest concrete value) → Open Data Center → LSEG → Norsh once identified.

**Before sending, we need:**

- [ ] Confirmed summit name, date and the name of the person we actually spoke to at each company
- [ ] A one-page TailorNow PDF (pull from §2) — brand, traction, the ask
- [ ] Current traction numbers we're willing to share (creatives onboarded, orders, cities, GMV)
- [ ] Norsh identified
- [ ] Open Data Center identity confirmed
- [ ] Owner assigned per company

**Email skeleton** — keep it short, lead with them, one ask, one clear next step:

> **Subject:** Following up from _[summit]_ — TailorNow x _[Company]_
>
> Hi _[Name]_,
>
> Great to meet you at _[summit]_ — I enjoyed our conversation about _[specific thing they said]_.
>
> Quick context: TailorNow (tailornow.shop) is a marketplace for custom fashion in Nigeria. We
> connect customers to verified tailors and handle the full order — booking, measurements, payment,
> production tracking and delivery. _[One sentence of traction.]_
>
> The reason I'm reaching out: _[one specific ask, in one sentence]_. In return, _[the single
> clearest thing they get — their win, not ours]_.
>
> Would a 30-minute call in the next two weeks make sense? Happy to work around your calendar.
>
> Best,
> _[Name]_ — _[role]_, TailorNow

**Per-company one-liners for that middle paragraph:**

| Company | The ask | The win we lead with |
| --- | --- | --- |
| CoralPay | Adding C'Gate USSD and NQR to our checkout, on aggregated merchant pricing | An entire merchant category — thousands of cash-based tailoring businesses — onboarded through one integration |
| Snapnet | Azure credits via your CSP relationship, and intros to clients who buy staff uniforms | Referral revenue on uniform contracts, plus a consumer-facing showcase for your AI and cloud practice |
| Open Data Center | Edge caching / in-country hosting for our media, on startup terms | A local consumer platform proving the case for hosting African products in Africa — and a tenant that grows |
| LSEG | A place on ELITE, or an intro into your Africa network | First-hand exposure to Nigeria's creative economy, a sector your Africa growth agenda has little coverage of |
| Norsh | _TBD_ | _TBD_ |

---

## 7. Open items

| # | Item | Owner | Blocking |
| --- | --- | --- | --- |
| 1 | Identify **Norsh** — exact legal name and what they do | | All Norsh outreach |
| 2 | Confirm **Open Data Center** = OADC (or correct it) | | §4.3 outreach |
| 3 | Confirm **which LSEG division** we met and the contact's remit | | §4.4 outreach |
| 4 | Add summit name, date, and per-company contact names | | All outreach |
| 5 | Agree the traction numbers we're willing to share externally | | One-pager and all emails |
| 6 | Assess our real capacity for a bulk enterprise uniform order | | Snapnet channel ask |
| 7 | Measure Nigerian median page-load and monthly image egress | | Open Data Center ask |
| 8 | Check current ELITE eligibility criteria | | LSEG ask |
| 9 | Assign an owner per company | | Everything |

---

## 8. Sources

Company facts above are drawn from these public sources, retrieved 2026-08-03. Third-party
directory figures (revenue, headcount) are estimates and should not be quoted back to the company.

**CoralPay**
- [About Our Company | CoralPay Technologies](http://www.coralpay.com/about.html)
- [CoralPay Technology (Nig) Limited | LinkedIn](https://ng.linkedin.com/company/coralpay-technology-nig-limited)
- [CoralPay: Impacting Nigerian Financial Industry Through Cutting Edge Technology — The Guardian Nigeria](https://guardian.ng/sponsored/coralpay-impacting-nigerian-financial-industry-through-cutting-edge-technology/)
- [CoralPay Technology — Crunchbase](https://www.crunchbase.com/organization/coralpay)

**Snapnet**
- [Enterprise Technology Solutions for Africa | Snapnet](https://snapnetsolutions.com/)
- [About Snapnet — Cloud, AI & Enterprise](https://snapnetsolutions.com/about-us/)
- [About Snapnet — snapnet.tech](https://snapnet.tech/about-snapnet/)
- [Snapnet Limited | LinkedIn](https://ng.linkedin.com/company/snapnetnigeria)

**Open Access Data Centres (assumed match for "Open data center")**
- [Open Access Data Centres (OADC)](https://openaccessdc.net/)
- [OADC Lagos](https://openaccessdc.net/lagos)
- [OADC plans $240m data center in Lagos — Data Centre Dynamics](https://www.datacenterdynamics.com/en/news/open-access-data-centres-plans-240m-data-center-in-lagos-nigeria-report/)
- [OADC to invest US$240m to expand Lagos data centre to 24MW — Developing Telecoms](https://developingtelecoms.com/telecom-technology/data-centres-networks/18230-oadc-to-invest-us-240m-to-expand-lagos-data-centre-to-24mw-by-2027.html)

**LSEG**
- [LSEG](https://www.lseg.com)
- [ELITE — LSEG's growth company programme](https://www.elite-network.com/news/lseg-s-growth-company-programme-elite-launches-in-morocco)
- [ELITE launches across West Africa — LSEG press release](https://lseg.com/en/media-centre/press-releases/2017/elite-launches-across-west-africa)
- [ELITE, Nairobi Securities Exchange and FSD Africa sign MoU — LSEG](https://www.lseg.com/en/media-centre/press-releases/2018/elite-nairobi-securities-exchange-fsd-africa-sign-mou)
- [LSEG strengthens partnership in Kenya — LSEG](https://lseg.com/en/media-centre/press-releases/2018/london-stock-exchange-group-strengthens-partnership-kenya)
- [Companies to Inspire Africa 2017 (PDF, AfDB)](https://www.afdb.org/fileadmin/uploads/afdb/Documents/Generic-Documents/LSEG_Companies_to_Inspire_Africa-_full_report.pdf)

**Norsh** — unresolved; candidates listed in §4.5.
