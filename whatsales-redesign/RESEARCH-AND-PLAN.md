# WhatSales homepage redesign: research, teardown and plan

> **Limitation of method.** The session's network blocked direct access to whatsales.com and orbix.studio. Everything below comes from search-engine indexes of those sites, third-party listings and review platforms. Every claim is tagged with a confidence level. Anything marked *confirm* must be checked with the client before it goes live.

---

## 1. What WhatSales actually is

**WhatSales is a profit analytics platform for multichannel ecommerce sellers. It is not a WhatsApp or sales-chat tool**, whatever the name suggests. (certain)

| Fact | Source | Confidence |
|---|---|---|
| WhatSales Ltd, a company registered in London. Contact: hello@whatsales.io | Privacy policy | certain |
| Tracks profit per SKU and per sales channel | Our Company page | certain |
| Channels: Amazon, eBay, Shopify, Walmart, B&Q (via Mirakl), Temu, OnBuy, WooCommerce, Etsy; "30+ other channels" | Integration pages | likely (full list *confirm*) |
| Deep Linnworks integration: COGS, fees and shipping manifests; splits bundles and composite orders into their parts | whatsales.io/linnworks | certain |
| Consolidated multi-brand dashboard; drill down into any single account with a click | Insights article | certain |
| OPEX module: one-time, recurring and ad-hoc expenses; automated alerts to the accounts team | Features page | certain |
| Tracks refunds, ad overspend, fees and hidden costs | Site copy | certain |
| "70+ types of sales fees, costs, taxes" | ~4-year-old page | likely outdated (*confirm*) |
| VAT settings (IOSS, HMRC, US/EU) and VAT export reports | Old whatsales.io pricing table | guessing whether still offered (*confirm*) |
| Team permission settings | Features page | certain |
| Android mobile app | Google Play | certain |
| Linnworks pricing: about $250/month, billed monthly, no lock-in | Linnworks landing page | likely (*confirm before showing*) |
| Customer count: "3000+ sellers" on one page, "1000+ brands" on another | Site | **conflicting: do NOT publish until confirmed** |
| Testimonial claim: saves 1–2 hours a day | Testimonials page | vendor claim |
| Exhibited at ChannelX World 2025 | Events page | certain |

### Who buys it (likely)
UK-first, small to mid-sized multichannel sellers, often already on Linnworks, with an ops or finance person who rebuilds P&L spreadsheets every month. Buyers: the founder or MD (wants the truth about profit) and the finance or ops lead (wants no manual reconciliation).

### The reputation problem
- Trustpilot shows about 3.2/5. Google Play shows about 2.9–3.1. (likely)
- Repeated complaints: **data accuracy and sync delays outside Linnworks setups**, plus slow support. (likely)
- **Design implication:** a profit tool lives or dies on whether people trust its numbers. The homepage therefore has to **sell trust in the data**, not just show a pretty dashboard. That drives the "Every number shows its working" section in the plan.

---

## 2. Competitor scan

| Competitor | Positioning | What they do well | Gap WhatSales can own |
|---|---|---|---|
| **sellerboard** | Profit analytics for Amazon sellers, from about $15/month | Simple promise: real-time profit after every Amazon fee | Amazon-only. WhatSales is multichannel. |
| **TrueProfit / BeProfit** | Net profit for Shopify stores | "Net profit, not revenue" message; first-party Shopify app trust | Shopify-only. No marketplaces, no Linnworks. |
| **Triple Whale** | DTC "control centre": attribution plus profit | Premium product UI in the hero; confident, short copy | Built for DTC ad buyers, not marketplace sellers. |
| **Conjura / Niblin** | Amazon plus Shopify unified analytics | Omnichannel story | Weaker on UK marketplaces (B&Q, OnBuy) and Linnworks. |
| **Linnworks (native)** | Order management with basic SKU/channel profit reports | Owns the operations | Reporting is a side feature. WhatSales can be the profit layer *on top of* Linnworks. |

**Patterns across the category (certain):**
1. The hero shows the real product UI, not abstract illustrations.
2. The core line is "Net profit, not revenue."
3. Channel logo strip right under the hero.
4. A fee breakdown or waterfall to make "hidden costs" visible.
5. Social proof as specific numbers and named sellers.
6. Free trial plus demo as two CTAs.

**WhatSales' sharpest position:** *the only profit layer built for UK multichannel sellers, Linnworks-native, covering marketplaces the US tools ignore (B&Q, OnBuy, Temu).*

---

## 3. Why Orbix (and similar sites) feel modern and minimal

What makes Orbix and its peers (Linear, Attio, Ramp, Mercury) feel modern comes down to a few repeatable rules:

1. **One typeface family, tight tracking at large sizes.** Big headlines (56–80px), letter-spacing about −0.03em, short line lengths. Hierarchy comes from size and weight, not colour.
2. **Near-white background with off-white cards.** Never pure #FFF on #FFF. Hairline 1px borders instead of shadows.
3. **One accent colour, used sparingly.** Everything else is ink and grey. For a profit product the accent means something: green = profit, red = loss.
4. **Bento grids.** Feature cards of mixed sizes, each with a live mini-UI rather than an icon.
5. **Generous, consistent spacing.** Sections at 120–160px vertical rhythm. Content capped at about 1200px.
6. **Pill eyebrows and pill buttons.** Small uppercase or mono labels above headlines.
7. **Motion only where it explains.** Things enter once on scroll, numbers count, lines draw. No parallax, no cursor trails, no 3D blobs.

**What I removed from the Orbix style for WhatSales:** decorative scroll-jacking, oversized portfolio motion, agency showreel energy. A finance buyer reads heavy animation as "style over substance". **Every animation on this page demonstrates a product capability.**

---

## 4. Homepage plan (section by section)

| # | Section | Job | Animation (and what it proves) |
|---|---|---|---|
| 1 | Nav | Product · Integrations · Linnworks · Pricing · Resources · Log in · **Book a demo** | Blurs on scroll |
| 2 | Hero | "Revenue is a vanity number. Know your real profit." Two CTAs | Dashboard mock: profit counts up, sparkline draws, channel bars grow (*one place for every channel*) |
| 3 | Channel strip | Proves breadth | Slow marquee |
| 4 | The £100 sale | The core problem, felt | Waterfall: £100 sale loses VAT, fees, ads, refunds and COGS, leaving £19.53 (*hidden costs made visible*) |
| 5 | Bento: what you get | The 6 core services | SKU table flags a loss-maker · channels converge into one node · fee ticker · bundle splits into parts · expense alert slides in · brand drill-down |
| 6 | Every number shows its working | Fixes the trust problem | Click a profit figure to see every line item behind it |
| 7 | Built for Linnworks | Their strongest wedge | Order flows from Linnworks into WhatSales into P&L |
| 8 | How it works | Connect, reconcile, decide | Steps light up in sequence |
| 9 | Proof | Stats plus testimonials | **Placeholders until the client confirms** |
| 10 | FAQ | Objection handling (accuracy, sync, VAT, pricing) | Accordion |
| 11 | Final CTA plus footer | Convert | None |

### Copy rules
- Speak in the seller's numbers: SKU, margin, fees, payouts, COGS. No "unlock", "supercharge" or "revolutionise".
- Short sentences. Every headline must be a claim the product can prove.

### Open items for the client (must close before launch)
1. Real customer count (3000+ or 1000+?)
2. Current full channel list
3. Whether VAT reporting is live
4. Whether the "70+ fee types" claim is still accurate
5. Pricing to display (or "from £X")
6. Two or three real testimonials with name, company and permission
7. Brand colours and logo files (the concept uses a proposed palette)
8. Whether sync frequency is real-time or a fixed interval (the FAQ copy depends on it)
9. Whether a free trial exists, and how long (the CTAs say "Start free trial")
10. Real channel names for the illustrative dashboard (or keep them as clearly marked sample data)
