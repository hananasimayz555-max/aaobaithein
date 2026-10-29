# WhatSales platform research

**Captured:** 29–30 Oct 2026, read-only session on a live client account (UK multichannel seller, Amazon plus eBay, Etsy, Shopify, TikTok and others).
**Scope:** the 6 products active on this client: Profitability, Performance, Inventory, Engage, Flow, Workspace. Repricer and MCP are not in the app on this account; they are deferred to a later pass.

**How to read this report**
- Exact UI labels are in **bold**. Copy shown as "quoted" is verbatim from the screen.
- (certain) = seen on screen. (likely) = strong inference from labels. (guessing) = gap-filling, to be confirmed by Sir Usman.
- No customer data, client brand names, account names or real revenue/profit figures are recorded. Examples use placeholders.
- Nothing was saved, sent, connected, exported, disputed or changed. Only navigation, search, filters and opening menus.
- Screenshots were skipped: real data could not be hidden reliably. Layouts are described instead.

**Read this first: five things the team should know**
1. **Recovery is not a separate product in this app.** It is a page under Profitability › P&L. It does load on this account. If Recovery is "not activated" for the client, check whether that is a plan flag or just the design decision. (certain: page exists; guessing: plan gating)
2. **There is no Repricer page and no MCP page.** The page index returns nothing for MCP. "Repricer" only matches **Buy Box Analysis**, which suggests repricing is either a future feature there or lives elsewhere. (certain: search result; guessing: meaning)
3. **Bug on the dashboard:** the notifications panel shows a failed export: "Invalid web service call, missing value for parameter: 'fromDate'." Worth passing to the dev team.
4. **Hard-coded greeting:** Performance Tree greets the user with a different first name from the logged-in user ("Hi Martyn. Browse performance by hierarchy…"). (certain) This looks like a template left in. Do not copy that line to the website.
5. **Several heavy pages did not finish loading** within about 30 seconds: Buy Box Analysis, Ad Insights, All Campaigns, BSR Changes, Supplier Performance, Refunds Insights, Listing Health (partly). Their data sections are described from headers and loading copy only. See Open questions.

---

## 1. App shell

### Navigation
- **New menu** with a **Use classic** switch ("Prefer the old one?"). A collapsed icon rail opens into a full sidebar.
- Top of sidebar: WhatSales logo, **Keep menu open [** toggle, **Jump to…** search (shortcut **Ctrl K**).
- **Quick access**: "Pin any page to keep it here." Every page has a **Pin to Quick access** button.
- **Dashboard** link, then a **Workspaces** group with six products. Each has a one-line tagline and sub-tabs:

| Product | Tagline | Sub-tabs |
|---|---|---|
| **Profitability** | Profit, orders & costs | **P&L**, **Orders**, **Expenses**, **Reports** |
| **Performance** | Sales, ads & growth | **Analytics**, **Hierarchy**, **Health**, **Ads** |
| **Inventory** | Stock, planning & POs | **Stock**, **Planning**, **Setup** |
| **Engage** | Support & reviews | **Helpdesk**, **Reviews**, **Settings** |
| **Flow** | Listings & publishing | **Publish**, **Catalogue** |
| **Workspace** | Tasks & team | **Board**, **Tasks** |

- Bottom of sidebar: **Support** (opens a new-ticket page), **Log out**.
- Clicking a sub-tab opens the first page of that tab and lists the other pages beneath it.

### Full page map (labels as shown in Jump search; NEW/BETA tags are the app's own)

**Profitability**
- P&L: **P&L Statement**, **Recovery**, **Shipping Choice** (NEW)
- Orders: **Orders**, **Refunds**
- Expenses: **Expenses**
- Reports: **Scheduled Reports**, **Export to Excel**

**Performance**
- Analytics: **SKU Performance**, **Product Diagnostics** (NEW), **Refunds Insights** (BETA), **Listing Health** (NEW), **Comparison Charts**
- Hierarchy: **Performance Tree** (NEW), **Hierarchy Mapping**
- Health: **BSR Changes** (BETA), **Pricing Health** (BETA), **Buy Box Analysis** (NEW)
- Ads: **Ad Insights** (NEW), **Budget Rules** (BETA), **All Campaigns**, **TikTok LIVE Insights** (NEW)

**Inventory**
- Stock: **Stock Overview**, **Product Catalogue**
- Planning & Buying: **Inventory Planning**, **Purchase Orders**, **Suppliers**, **Supplier Performance** (BETA), **Price Checks** (BETA)
- Setup: **Warehouses**, **Inventory Settings**

**Engage**
- Helpdesk: **Overview**, **Tickets**, **AI Support** (NEW), **Rules** (NEW), **Auto Responders**, **Process Refunds**
- Reviews: **Feedback Automation** (NEW), **Negative Seller Feedback**, **Product Reviews**
- Settings: **Engage Settings**

**Flow**
- Publish: **Flow Dashboard**, **Flow Publisher**, **Bulk Publisher** (BETA), **Bulk Publisher (old)**
- Catalogue: **Product Studio**, **Channel Profiles**, **Amazon Brand Stories**

**Workspace**
- Board: **Board**
- Tasks: **My Tasks**, **Support Tasks**, **Listing Content**

### Top bar
- **Account switcher:** a dropdown with 8 accounts, including a master account. (certain)
- **Connection chip:** "1 needs attention" opens a **Platform Connection** panel.
- **Billing:** an **Upgrade Plan** button and a **Create New Ticket** shortcut.
- **Notifications bell** with a count badge.
- **User menu** ("Secondary Account" label): **Profile**, **Subscription**, **Secondary Users**, **Fiscal Year**, **Tax/VAT & Claimback**, **Update Password**, **Notifications**.
- **Language picker:** "Powered by" Google-Translate-style, 250+ languages.
- **Footer:** Contact Us, Review us on, **Submit Facebook Review**, **Suggest a Feature**, **Report a Bug**, **Enable Support**, Terms, Privacy, Cookies. "All rights reserved. WhatSales Ltd ©".
- **Floating chat bubble** (bottom right) and a yellow "pinwheel" widget on the right edge (purpose not checked).
- **Jump to a page** (Ctrl K) searches **Pages** and **Knowledge Base** tabs. Hint row: "↑ ↓ move · Enter open · [ keep menu open · Tab switch tab". When nothing matches: "Nothing matches “mcp”".

### Filters used across the app
- Date range picker.
- **All Brands (32)**, **All Platforms (13)**, **All Countries (56)**, and on some pages **All Fulfillment**, **All Products**.
- Account switching changes the data for the whole app. Many pages also have a per-**STORE** chooser with an **All stores** option.
- A row of marketplace logos on the dashboard (Amazon, eBay, Etsy, Shopify, TikTok and others, with "+N more") doubles as a platform filter.

### Dashboard (home)
- **Headline KPI strip:** Orders, Units, Gross Sales, Refunds, Ad Spend, TACOS, Profit, VAT/Tax, Margin. Each has a % change chip and the strip has a **next arrow**.
- **Combined chart:** columns plus lines by hour for the day, with a share icon.
- **Live Stream Manager panel:** tabs **Notifications**, **Live Stream**, **Other**, **Exports**; sub-tabs **Orders**, **Refunds**, **Reviews**, **Inventory**. Shows "Latest Activities", **Gross Sales**, **Total Orders**, **Units Sold**, a feed of recent orders with "Sold Today", price, "Total Qty", "FBM/FBA" tags, and an **Open Orders** button.
- **Sales Comparison: Today / Yesterday / Month to Date / Last Month:** four colour-coded cards, each with Sales Revenue, Est Net Profit, Orders/Units, Est Gross Profit and a % change arrow.
- **Aged Inventory** card appears in the Exports/notifications feed.

### Connections panel (labels only)
- Grouped per account/store, one row per connection, each with a status.
- **Statuses seen:** "Sync complete", "Syncing", "Loading orders and finance history", "Checking Offers", "Waiting for status", "Needs attention", "Connection configured", "Reminder off".
- **Marketplaces and tools shown:** Amazon (UK, EU, US, Far East), Amazon Ads, eBay, Etsy, Shopify, BigCommerce, Linnworks, TikTok Shop, TikTok Ads, Wayfair, The Range (direct and via Mirakl), Debenhams, B&Q, Temu, Tesco, OnBuy, Fruugo, Google Ads.
- Linnworks sits under almost every account, so it looks like the order and stock backbone. (likely)
- **Good copy (verbatim):**
  - "Reconnect TikTok Ads" / "No advertiser account was approved. Reconnect TikTok Ads and select the account you want WhatSales t…"
  - "Temu Ads reports unavailable" / "Your sales connection is unaffected. If you use Temu Ads, contact support to check advertising acces…"
  - "Brand Analytics unavailable" / "Sales are connected and up to date. Listing performance needs the Brand Analytics role (Brand Regist…"
  - Button: **Turn on Temu Ads reminder**
- The panel separates "sales connected" from "ads/analytics connected" and says so in plain words. This is a trust signal.

### First impressions (shell)
- **Impressed:** the menu is organised by job ("Profit, orders & costs") rather than by feature. The **Ctrl K** page search and **Quick access** pinning are a power-user touch. Status copy is written for sellers, not engineers.
- **Confusing:** there are two menus ("New menu" and "classic"); page names are not always the menu names (e.g. **Hierarchy Mapping** opens a page titled "Native Product Catalogue"); some pages use the older purple/pink card style and some the newer cleaner style (see Icons & brand).

---

## 2. Profitability

### What it does
Shows what the business actually earns after every cost, and recovers money lost to fees, shipping and refunds.

It builds a monthly P&L from sales, marketplace fees, ad spend, refunds, product cost and shipping across channels. Orders and Refunds pages let sellers see profit order by order. Expenses brings in costs that no marketplace reports. Recovery finds money Amazon owes the seller and prices that are losing money. Reports exports it all or schedules it by email.

### Who uses it
Finance managers, owners and operations leads who need to know true margin, not revenue. Also account managers presenting results to clients.

### Screens
1. **P&L Statement** (`/ProfitLossStatement`), titled "Monthly Profit Loss Statement".
2. **Recovery** (`/FeeRecovery`).
3. **Shipping Choice** (`/ShippingChoice`), tag NEW.
4. **Orders** (`/Orders`), titled "Orders Summary".
5. **Refunds** (`/Refunds`), tab title "Top Refund Reasons".
6. **Expenses** (`/Expenses`).
7. **Scheduled Reports** and **Export to Excel**, both inside `/ExportReports`.

### Key features
- **Monthly P&L with month-on-month columns.** Current month to date plus five prior months side by side. Toggles: **Show Per Unit Details**, **Show Detailed MoM**, **Show Monthly Target Achieved**. A **Search By:** box with **Apply**. Why a seller cares: one screen answers "did we make money this month vs last?"
- **Recovery.** Subtitle: "Money Amazon owes you — with the evidence to claim it back." Two groups of tabs (below).
- **Shipping Choice.** "When the same product goes out on a more expensive service than it usually does, you pay the difference for nothing. This page adds up what that cost." Cards: **Extra paid**, **Sent a pricier way**, **Products doing it**. Chart: "Money lost each day" ("One bar per day. Taller means more was spent on pricier services than usual that day."). Filter chips: **All products**, **Flat items sent as parcels**, **Wrong size on record**. Table: PRODUCT · SHOP · USUAL WAY · IT WAS SENT · HOW OFTEN · A PRICIER WAY · EXTRA PAID. Footnote: "Counts orders of one item only, on standard delivery. Next-day and other paid-for upgrades are left out."
- **Orders Summary.** Order-level profit with fees. Summary line: **Total Orders**, **Pending Orders**, **Shipped Orders**, **Cancelled Orders**, **Missing Shipping Charges**, **Missing COGS**. Table columns: Order Info · Product Info · Units · Order Total · Charges & Expenses · Profit · Margin · Details. Sort: **Order Date**, **Direction**, **Apply**.
- **Refunds.** KPIs: **Total Refunds**, **Total Refunded Value**, **Most Refunded Reason**, **Orders**, **Loss**. Chart: "Refunds Trends Over Time". Filter: **All Refund Reasons**. Setting note: "%age of COGs to be credited on each refund when refund condition is not set". Group by **Linnworks Id**.
- **Expenses.** **Add Expense** button; **Show By:** **Expense Category (Top 5)** / **Individual Expense Top(5)** / **Individual Products Top(5)**; **Group By:** **By Day** / **By Week** / **By Month**; **Show Deleted Expenses** toggle. Table: Expense Latest Posted On · Expense Name · Amount · Marketplace · Frequency · Country · Expense Entries · Expense Category · Products · Action.
- **Export reports** (catalogue of 27 reports; see Data shown).

### Data shown
- **P&L rows (in order):** Orders; Units Sold; Refund Units; Refund Ratio; Gross Revenue (with "Out of which Tax/VAT Liability"); Order Related Fee; Other Fees; External Shipping; Ad Spend; Refunds; Refund Comission [sic]; Product Buying Cost; Operational Cost; Internal Shipping Cost; Other Internal Expenses; OPEX; Total Expense; Profit before TAX/VAT; Profit after TAX/VAT; Margin before TAX/VAT; Margin after TAX/VAT; TACos; MoM; Monthly Sales Target.
- **P&L filters:** date range, **All Brands (32)**, **All Platforms (13)**, **All Countries (56)**, **All Fulfillment**.
- **Recovery:** KPI cards **Can dispute now**, **Expiring in 30 days**, **Disputes in progress**, **Recovered to date**. Status filters: **Can still dispute**, Missed, Disputed, Recovered, Dismissed. Sorts: "most owed", "expiring soonest", "most units", "worst paid". Table: PRODUCT · PAID PER UNIT · SHORT BY · DISPUTE WINDOW.
- **Shipping Choice** and **Refunds Insights** use 30-day and 3/6/12-month windows respectively.

### Actions (described, not clicked)
- P&L **Actions** menu: **Export to Excel**, **Send PLS in Email**, **Export Tax Liability Report**, **Add Costs & Expenses**.
- Recovery: **Export**; per-row dispute and dismiss controls (labels not opened). (likely)
- Orders and Refunds: **Export to Excel**; Orders also has **Shipping Status** filter.
- Expenses: **Add Expense**; row **Action** column.
- Reports: **Schedule**, **Configure & Export**, **Start export** per report.

### Automations & AI
- Scheduled report emails: "Open any report and press Schedule to have it emailed on a timer." Page shows "0 scheduled reports" with "Nothing scheduled yet".
- Recovery runs checks on a timer: header shows "Checked 16 hours ago".
- (guessing) Recovery finds claims automatically; no mention of AI on these pages.

### Settings & rules
- P&L: monthly sales target, per-unit view, tax/VAT liability treatment (via the user-menu **Tax/VAT & Claimback** and **Fiscal Year** pages).
- Refunds: COGS credit percentage when no refund condition is set.
- Shipping Choice: picks the "usual" service per product and flags "Wrong size on record".

### Integrations used
Amazon (primary for Recovery), eBay, Etsy, Shopify, Temu, TikTok. **Recovery tabs show Amazon active and eBay, Etsy, Shopify, Temu, TikTok marked "SOON".** Linnworks for order and cost data. Amazon Ads for ad spend.

### Terminology
- **Recovery** · "Claim from Amazon" group: **Underpaid reimbursements**, **Fee overcharges**, **Lost & damaged**, **Customer returns** (NEW), **Seller-shipped returns** (NEW).
- "Fix your pricing" group: **Selling at a loss**, **Margin squeezed**, **Room to move**.
- **COGS**, **TACOS**, **OPEX**, **Missing COGS**, **Missing Shipping Charges**, **Shipping Choice**, **Pricier way**, **MoM**.
- "3 stores share this account's data" (store scope note on Recovery).

### Copy captured (verbatim)
- Recovery header: "Money Amazon owes you — with the evidence to claim it back."
- Recovery empty state: "Nothing to dispute." / "No lost or damaged stock was reimbursed in the last [period]" / "When Amazon pays for stock it lost or damaged, we check the payment against your recorded cost."
- KPI sublines: "Nothing expiring yet", "Sent to Amazon, awaiting outcome", "Confirmed back in your account".
- Shipping Choice, Expenses empty state: "Not enough data for graph". Table: "No data available in table".
- Export reports: "Configure, generate, schedule and track your reports"; "Nothing scheduled yet"; "Open any report and press Schedule to have it emailed on a timer."
- Export catalogue lines (excellent website copy):
  - "Product Fix List: Products ranked by the money at stake, with each listing's problem, cause, action and the sales, stock, ads, search and Buy Box evidence behind it."
  - "Low Stock: What is running out. With the Inventory Planner, its buying list: order late, order now, order by a date, with quantities."
  - "Not Selling: Stock that has not sold: units and value tied up, to clear, discount or remove."
  - "Missing COGS: Products held or selling with no unit cost, so stock cannot be valued and profit is overstated."
  - "SKU Coverage by Brand: Which SKUs are missing from which channels: coverage % per channel and per brand, gaps where each brand already sells, and one sheet per brand for its owner."
- **Report catalogue (27, grouped):** Advertising Campaigns; PPC & Listing Performance; Inventory (Low Stock, Stock-outs & Lost Sales, Not Selling, Overstock, Aged Inventory, Stock Value, Stock at Amazon, Missing COGS, Missing VAT, Suppressed Products, Inventory Plan); Performance (Product Performance, Product Bundles, Units Sold Over Time); Products (Product Diagnostics, Product Fix List, SKU Platform Coverage, SKU Coverage by Brand, Low Performing SKUs); Finance (Profit & Loss Statement, Tax Liability); Orders (Orders, Missing Shipping Costs, Refunds). All export as **XLSX**. Tabs: **All**, **Advertising**, **Inventory**, **Performance**, **Products**, **Finance**, **Orders**, **Scheduled**.

### First impressions
- **Impressed:** the P&L is the real hook: ad spend, refunds and product cost on one page. The Recovery and Shipping Choice pages turn "find lost money" into a named feature with evidence. Report descriptions explain the "so what" in one line.
- **Confusing:** "Refund Comission" typo in the P&L; Orders and Refunds use older table-style layouts compared to Recovery and Shipping Choice; Recovery's eBay/Etsy/Shopify/Temu/TikTok tabs say SOON, so website copy must say Amazon only for now.

---

## 3. Performance

### What it does
Shows which products, brands and campaigns are winning or losing, and what to fix next.

SKU Performance gives a sortable per-product view. Product Diagnostics ranks problems by money at stake. Hierarchy pages roll results up by brand, category and gender. Health pages watch rank, pricing and the Buy Box. The Ads tab explains where ad money goes and lets sellers set budget rules.

### Who uses it
Marketplace managers, ad managers, brand managers and merchandisers who own sales growth.

### Screens
**Analytics:** **SKU Performance** (`/ProductPerformance`), **Product Diagnostics** (`/ProductDiagnostics`), **Refunds Insights** (`/RefundsInsights`), **Listing Health** (`/ListingHealth`), **Comparison Charts** (`/ComparisonCharts`).
**Hierarchy:** **Performance Tree** (`/HierarchicalReporting/HierarchicalPerformance`), **Hierarchy Mapping** (`/ProductsCatalogue.aspx`, titled "Native Product Catalogue").
**Health:** **BSR Changes** (`/BSRChanges`), **Pricing Health** (`/PricingHealth`), **Buy Box Analysis** (`/BuyBoxAnalysis`).
**Ads:** **Ad Insights** (`/AdInsights`), **Budget Rules** (`/BudgetRules`), **All Campaigns** (`/AllCampaigns`), **TikTok LIVE Insights** (`/LiveInsights`).

### Key features
- **SKU Performance.** Filters: **Groups & Brands**, **Show Advanced Filters**, **Preset Reports** (**Select Report**), **Additional Settings (0)**, **Linnworks Category**, **Bundle Recommendations**, **Collective Goals**, **Watch Credits Remaining**, **Select Multiple Items**. Section: **Performance Breakdown**. Table columns: Product · Region · Rating / Alerts · Order Info · PPC Details · Action. Loading line: "Building the performance cache from daily facts".
- **Product Diagnostics** ("PROFIT SYSTEM"). Subtitle: "What is costing you money, on which products, and who should fix it." Has a **Take the tour** button, **Settings**, **Export**. Top banner: money "at stake" across products, with "Last checked" and "fixes sent". Problem tiles: **Total products**, **Selling products**, **Products with no sales**, **Selling less**, **Losing money**, **Ads not paying off**, **Listing hijacked**, **Too many returns**, **Shoppers not buying**, **Dead stock**. Filter: **Why:** with causes (see Terminology). Table: PRODUCT · WHAT IS WRONG · UNITS · SALES · AT STAKE. Links into Workspace: "Turn diagnostics into owned, trackable work" (**Action Plan**, **Open Workspace**).
- **Refunds Insights** (BETA). "What refunds cost you, why customers ask for them, and what you can still claim back." Windows: **3 months / 6 months / 12 months / Custom**. Loading story: "Reading your refunds · Matching Amazon reimbursements and SAFE-T payouts · Working out what came back and what it cost · Adding up each product's sales".
- **Listing Health** (NEW). "Is every product listed on your channels, live, and up to each channel's rules?" Filter: a **Flow** picker (links this to Flow publishing batches). Cards: **NEEDS ATTENTION**, **PRODUCTS**, **Not live**, **Suppressed or blocked**, **Marketplace errors**, **Changes not showing**, **Breaks channel rules**, **Not listed**. Row states: **Live**, **Live with problems**, **Suppressed (not in search)**, **Blocked or rejected**, **No stock**, **Gap (brand sells there)**. Sorts: **Best sellers first**, **Most problems first**. Buttons: **Channel rules**, **Settings**.
- **Comparison Charts.** Metric chooser: **Sales, Profit, Orders, Units, Charges & Fees, Refunds, Ad Spend, ACOS**. Charts: **Sales by Product**, **Comparison Chart**. Compare options: "By “Previous Period”", "By “Same Time Last Year”", "By “Same Time Last Month”", "By “Same Time Last Week”". Toggle: **Include VAT/Tax in PL**. Extra metrics: Gross Sales, VAT/Tax, Margin, AOV, APO, AMO.
- **Performance Tree** (NEW). Subtitle: "Browse performance by hierarchy, then drill into the products behind each group." KPI row with comparison (**Compare By**: Previous Period, Same Time Last Month, Same Time Last Year): **Revenue** ("Sales generated"), **Profit** ("After tax"), **Margin** ("Efficiency"), **Orders** ("Demand count"), **Units** ("Volume sold"), **SKUs** ("Coverage"). **More metrics:** Refunds, Ad Spend, TACOS, VAT/Tax, AOV, APO, AMO, AOPD, ROAS. Chart: "PERFORMANCE TREND · Revenue by day" with **Daily / Weekly / Monthly / Yearly**. Hierarchy levels: **Brand / Category / Gender**. Sort groups: **Revenue share / Sales rate (units/day) / Profit share / Loss / ACOS / Problem SKUs / ASINs / BSR (not available)**.
  - **Performance Copilot ("ASK WHATSALES").** Chat panel with status "Ready", greeting "Hi — how can I help with your store performance today?" and suggested question "What was my revenue yesterday?". Answers include sales, comparison day, risks and trend. (certain) This is the clearest AI feature on the platform.
- **Hierarchy Mapping / Native Product Catalogue** ("INVENTORY SYSTEM"). "Manage your master inventory and map sales channels." Header note: "Inventory managed by Linnworks". Tabs: **Master Catalog**, **AI Mapping Hub**, **Reporting Hierarchy**. KPI tiles: **Total Products**, **Listing Coverage**, **Reporting Coverage**, **Incomplete Products**. Section **AI MAPPING** → "Your reporting tree" with **Map**, **View tree**, **Notes for the AI**, **Rebuild**; **Manual mapping** with **Edit categories**. Buttons: **Import & Sync**. Statuses: **Ready to map**, **Not mappable**, **Mapped**.
- **BSR Changes** (BETA). "How your products' Amazon Best Seller Rank moved this week, what it did to sales, and what to do next." Loading: "The first visit of the day works out every product's rank and sales; on a big account that can take up to a minute."
- **Pricing Health** (BETA). Input: **Minimum Margin percentage(%)**. Table: SKU Info · Sale Price · Platform Fee · Shipping Fee · Total Cost Per Unit · Estimated Margin · Actions.
- **Buy Box Analysis** (NEW). "Why you win and lose the Buy Box, what it's costing you, and what to do next." Tabs: **Overview**, **Competitors**, **Market activity**, **Tracking**. Input: **Target margin**: "The net margin you want after every cost: fees, shipping, refunds, ads and VAT. The price for your target margin and the money short of it use this." Buttons: **Export**, **Take the tour**. Loading: "Getting your Buy Box analysis ready — This store has a very large catalogue, so the first load takes about a minute. The page fills in by itself."
- **Ad Insights** (NEW). "Where your ad money goes, brand by brand, and which campaigns pull your return down." Windows: **Today / 7 days / 30 days / 90 days**. Loading: "Gathering your ad figures — Every campaign, what it advertises, and the sales it sits against."
- **Budget Rules** (BETA). "Your own rules for your ad campaigns: raise budgets when they run low, pause campaigns at set hours, or shape spending through the day." Rule types: **Raise budgets**, **Pause at set hours**, **Shape the day**. Scope: campaign conditions (**Country**, **Ad type** such as Sponsored Products). Summary tiles: **Rules switched on**, **Campaigns covered**, **Raises today**, **Budget added today**. Tabs: **Rules**, **Activity**. Buttons: **New rule**, **Edit rule**, priority control and an **On** switch. Pause UI: an hour-by-hour **"Your day, hour by hour"** grid with "Off from … to …", **Every day / Only on**, "In each marketplace's own time".
- **All Campaigns.** "Every campaign, product and keyword for the period and the one before, with what each one earns after all costs."
- **TikTok LIVE Insights** (NEW). "Is going LIVE worth it? Your LIVE sales and profit, side by side with selling normally." Windows **7 days / 30 days / 90 days**. Tabs: **Videos**, **Product card**, **LIVE**. Empty state: "No LIVE sales in these [days]" / "You did not go LIVE." / "Your shop sold …" / **See those**.

### Data shown
- **Charts:** hourly/daily/weekly/monthly revenue lines and columns; per-product comparison charts; "Revenue by day" trend. Axes: time on X, currency on Y.
- **Metrics:** Revenue, Profit, Margin, Orders, Units, SKUs, Refunds, Ad Spend, TACOS, ACOS, ROAS, VAT/Tax, AOV, APO, AMO, AOPD, BSR, Buy Box share, Estimated Margin.
- **Grouping:** Brand / Category / Gender; Linnworks Id; ASIN; Parent.

### Actions (described, not clicked)
**Export** and **Export to Excel** on most pages; **Take the tour**; **Settings** (Diagnostics, Listing Health); **Channel rules** (Listing Health); **New rule** / **Edit rule** (Budget Rules); **Rebuild**, **Map**, **Edit categories** (Hierarchy Mapping); "fixes sent" and **Action Plan** to hand work to Workspace; Copilot chat.

### Automations & AI
- **Performance Copilot** (chat).
- **AI Mapping Hub** with **Notes for the AI** to build the reporting tree.
- **Budget Rules** that act on Amazon Ads: "We check with Amazon that each one is back on, and keep trying until it is. Campaigns you pause yourself stay paused."
- Nightly rebuilds: "These figures are rebuilt every night. After this first look, the page opens straight away on this device."
- Diagnostics "causes" are system-generated.

### Settings & rules
**Minimum Margin percentage(%)** (Pricing Health); **Target margin** (Buy Box Analysis); Budget Rules rule builder (type, campaigns, conditions, pause hours, priority); Diagnostics **Settings**; Listing Health **Channel rules**; Hierarchy **Notes for the AI**.

### Integrations used
Amazon (sales, ads, Brand Analytics, SP-API), Amazon Ads, TikTok Shop, TikTok Ads, Linnworks (catalogue). **Budget Rules says:** "Works with Amazon Ads … beta and run on your Amazon campaigns only, for now." Coming soon: **eBay**, **TikTok**, **Walmart**, **Google**.

### Terminology
**Money at stake**; **Fix list**; **Why:** causes: "Your listing had no Buy Box", "Ran out of stock", "Fewer shoppers saw it", "No clear reason yet", "Fewer visitors bought it", "Ad spend was cut", "You put the price up", "Slipped down its category", "Nearly out of stock", "Another seller took the Buy Box"; problem states: Losing money, Ads not paying off, Listing hijacked, Too many returns, Shoppers not buying, Dead stock; **BSR**, **ACOS**, **TACOS**, **ROAS**, **AOV**, **APO**, **AMO**, **AOPD**, **Performance Copilot**, **Reporting Hierarchy**, **Collective Goals**.

### Copy captured (verbatim)
- "What is costing you money, on which products, and who should fix it."
- "Is every product listed on your channels, live, and up to each channel's rules?"
- "Why you win and lose the Buy Box, what it's costing you, and what to do next."
- "Is going LIVE worth it? Your LIVE sales and profit, side by side with selling normally."
- "Which suppliers earn their place, and which are costing you." (Inventory; kept here for the same style)
- "In these hours the campaigns are switched off on Amazon (they show as Paused) and switched back on at the end."
- "Still working through product facts. This can take a few seconds on large date ranges."
- "DID YOU KNOW? Next tip" (loading-screen tips).

### First impressions
- **Impressed:** Product Diagnostics is the best-written page: it ranks by money, names a cause in plain English and a hand-off to Workspace. Budget Rules is a clean no-code rule builder. Performance Copilot is a ready-made demo moment.
- **Confusing:** the **Hierarchy Mapping** menu label opens a page called "Native Product Catalogue" and is marked "INVENTORY SYSTEM". Loading times of 30–60 seconds on big accounts could hurt any live demo. Beta/new labels on almost every page make the maturity of each hard to judge.

---

## 4. Inventory

### What it does
Tells a seller what stock they hold, what to reorder from suppliers and what to send to Amazon, and when.

It reads stock from Linnworks, forecasts demand per product, and turns that into a buying list. Purchase Orders tracks supplier orders and arrival dates. Suppliers, Supplier Performance and Price Checks keep a record of who delivers, who costs more and when prices jumped.

### Who uses it
Buyers, purchasing managers, supply-chain and warehouse leads for multichannel sellers.

### Screens
**Stock:** **Stock Overview** (`/StockOverview.aspx`), **Product Catalogue** (same master catalogue page as Hierarchy Mapping above).
**Planning & Buying:** **Inventory Planning** (`/InventoryPlanner`), **Purchase Orders** (`/PurchaseOrders`), **Suppliers** (`/Suppliers`), **Supplier Performance** (`/SupplierPerformance`), **Price Checks** (`/PriceChecks`).
**Setup:** **Warehouses** (`/Warehouses`), **Inventory Settings** (`/InventorySettings`).

### Key features
- **Stock Overview.** "What you hold, where it is, what it is worth and how fast it sells." Buttons: **Plan stock**, **Actions**. KPI cards: **Stock value at cost** (with split warehouse vs Amazon), **Stock at Amazon** (available, inbound), **Out of stock**, **Stock-outs (90 days)** (sales lost, products ran out), **Under…** (low stock), **Not selling (60 days)** (money tied up), **Missing COGS**, **missing VAT**. **Group by:** **Product**, **None (listings)**, **ASIN**, **Parent**. Chips: **All stock**, **Went out of stock**, **Low stock / depleting in…**, **Overstock**, **At Amazon**, **Non moving**, **Missing VAT / sales tax**, **Suppressed listings**, **Ignored SKUs**. Filters: **Preset report: all stock**, **All channels**, **All countries**, **FBA and FBM / Fulfilled by Amazon / Fulfilled by you**, brand, store, category.
- **Inventory Planning.** "What to order from suppliers and send to Amazon, and when." Header note: "Inventory managed by Linnworks". Tabs: **Supplier Purchasing (FBM)** and **Amazon Restock (FBA)**. Buttons: **Setup**, **Export plan**, **Actions**. KPI cards: **Order now**, **Order in the next…** (days), **Runs out before stock arrives** ("sales at risk"), **Overstock** (money tied up), **Needs set-up** ("no supplier"), **On order**. Status chips: **All statuses**, **Out of stock**, **Waiting on a late order**, **Do not order or snoozed**, **Over-ordered**, **No order needed**. Filters: supplier, brand, **Group variations**, **Sort: best sellers / most urgent / largest order**. **PRODUCT CLASSES:** **All / Best sellers / Regular / Slow movers**: "Ranked by sales value; best sellers get the most safety stock." Row columns: PRODUCT DETAILS · SALES & FORECAST · STOCK · WHEN TO ORDER · WHAT TO ORDER. Row details: sold per day, forecast per day, "Slowing · Low confidence" / "Steady · High confidence", days of stock, "Next order around", lead time, "STOCK COVERED", "Estimated PO cost", **Draft supplier order**, **Do not order**.
- **Purchase Orders.** "Plan supplier orders, track delivery dates, and receive stock into your inventory." Buttons: **Sync from Linnworks**, **New purchase order**. Tiles: **FBA transfers**, **On order**, **Arriving in…**, **Late**, **Pending, not placed**, **Drafts in WhatSales**, **Arrives after stock-out**. Notice: "Inventory controlled by Linnworks — Stock-changing actions are read-only. Planning and purchase orders remain available." Filters: **All suppliers**, **All locations**, **Sort: needs attention**.
- **Suppliers.** "Manage supplier contacts and assign products for purchase planning." Buttons: **Add supplier**, **Sync from Linnworks**. "Supplier directory: Keep supplier details current so purchase orders and receiving records stay clear." Table: SUPPLIER · CONTACT · DETAILS · ADDRESS · NOTES · ACTIONS (**Edit**).
- **Supplier Performance** (BETA). "Which suppliers earn their place, and which are costing you." Windows **3 months / 6 months / 12 months**, **Refresh**. Loading: "Working out how each supplier did — Sales, refunds, returns, stock and deliveries for every supplier. The first time takes a few seconds."
- **Price Checks** (BETA). "Every time you paid a supplier a different price for the same product than on your order before. Most changes are normal - but a price that jumps for one product only, goes up and straight back, is dearer than another supplier charges, or is suddenly the cheapest ever is worth a look. Give each one a reason so there's a record of why it changed." Cards: **Worth a look** ("extra paid on them"), **Price rises** ("more than the order before"), **Went up, then back** ("A one-off higher price"), **Cheapest ever** ("Check it's the same product"), **Reason given**. Row flags: "Big rise", "Whole order went up", "Only this product went up", "Cheapest ever - same product?", button "Give a reason".
- **Warehouses.** "Manage warehouses, bins, and the stock control system for this account." Note: "Warehouses and imported stock are read-only." Badge: **LINNWORKS READ-ONLY**, **Change**. Table: WAREHOUSE NAME · SYNC STATUS ("Linnworks managed", "Sync enabled"/"Sync disabled" with Enable/Disable sync). Buttons: **Add warehouse**.
- **Inventory Settings.** "Configure global forecasting rules and fulfillment routing." Buttons: **Discard changes**, **Save Configuration**. Left tabs: **Inventory Control**, **Fulfillment & Routing**, **FBA Networks**, **Stock Locations**, **Planning Warehouses**, **Forecast**, **Planning Defaults**, **Freight & Purchasing**, **Product Classes**, **Seasonal Events**. First panel: "Which system owns your stock…" with two options **Linnworks** ("Warehouses and stock stay read-only here. You can still plan and raise purchase orders.") and **WhatSales** ("Receiving, adjustments and transfers in WhatSales. We are finishing this — your stock stays with Linnworks until then." tagged **COMING SOON**). Warning: "Changing this affects stock operations for the whole account, so we ask you to confirm it."

### Data shown
Stock value (cost), units by location (warehouse, Amazon available/inbound/reserved/unfulfillable), days of stock, sold per day, forecast per day (with confidence), lead times, stock-out lost sales, non-moving stock value, supplier price change %, PO status and lateness. Charts: not prominent; mostly tiles and tables.

### Actions (described, not clicked)
**Plan stock**, **Export plan**, **Draft supplier order**, **Do not order** / snooze, **New purchase order**, **Sync from Linnworks**, **Add supplier**, **Edit** supplier, **Give a reason** (Price Checks), **Add warehouse**, **Enable sync / Disable sync**, **Save Configuration**.

### Automations & AI
- Forecasts per SKU with a stated confidence ("Low / Medium / High confidence") and a trend word ("Slowing", "Steady").
- Automatic safety stock by product class.
- Automatic flags: Price Checks, "Arrives after stock-out", "Waiting on a late order".
- (guessing) The forecast is statistical, not a language model. The UI does not call it AI.

### Settings & rules
Stock owner (Linnworks or WhatSales); fulfilment routing; FBA networks; stock locations; planning warehouses; forecast; planning defaults (lead time default: "30d lead (default)"); freight and purchasing; product classes (best sellers / regular / slow movers); seasonal events.

### Integrations used
**Linnworks** (stock, POs, suppliers, warehouses; read-only here), Amazon FBA (inbound, reserved, unfulfillable, restock), plus eBay/Shopify/other channels for sales velocity. A "Google Sheet" is not used here.

### Terminology
**Days of stock**, **Order now**, **Runs out before stock arrives**, **Sales at risk**, **Tied up**, **Needs set-up**, **Stock covered**, **Lead time**, **Safety stock**, **FBM (Supplier Purchasing)**, **FBA (Amazon Restock)**, **Non-moving**, **Stock-outs**, **Over-ordered**, **Snoozed**, **Product classes**.

### Copy captured (verbatim)
See above for subtitles. Also:
- "Which system owns your stock. It decides whether receiving, adjustments and transfers happen in WhatSales or stay in Linnworks — planning and purchase orders work either way."
- "Linnworks owns stock; warehouses and imported stock are read-only here."
- "Imported locations stay connected to their source system." (Warehouses)
- "Ranked by sales value; best sellers get the most safety stock."

### First impressions
- **Impressed:** Inventory Planning is the strongest page in the app: one list with "order now / order by / runs out before stock arrives", a confidence label on each forecast, and "sales at risk" in money. Price Checks is genuinely original (it catches supplier price jumps).
- **Confusing:** the tabs mix product areas ("Stock Overview" is labelled "INVENTORY SYSTEM" while the same word is used for Catalogue); a WhatSales-owned stock mode is "COMING SOON" so the site must not claim WhatSales replaces Linnworks.

---

## 5. Engage

### What it does
A shared inbox for customer messages across marketplaces, with AI-drafted replies, rules, auto-responders, refund approval and review requests.

Messages from connected stores arrive in one inbox. Rules assign, reply and set status. AI Support drafts replies for the team to check. Process Refunds sends refund requests to finance for approval. Feedback Automation asks Amazon buyers for reviews and seller feedback using Amazon's own tools.

### Who uses it
Customer-service agents and team leads; finance staff approving refunds; brand managers watching reviews.

### Screens
**Helpdesk:** **Overview** (`/Engage/Dashboard`), **Tickets** (`/Engage/Tickets`, titled "Inbox"), **AI Support** (`/Engage/AI-Support`), **Rules** (`/Engage/Rules`), **Auto Responders** (`/Engage/AutoResponders`), **Process Refunds** (`/Engage/ProcessRefunds`, titled "Refunds").
**Reviews & Feedback:** **Feedback Automation** (`/AutomatedFeedbackCampaigns`, titled "Feedback requests"), **Negative Seller Feedback** (`/NegativeSellerFeedback`), **Product Reviews** (`/ProductReviews`).
**Settings:** **Engage Settings** (`/Engage/Settings`).

### Key features
- **Engage Overview.** "How customer service is going, and what needs you." Windows: **Today / 7 days / 30 days / 90 days / Custom**. Platform filter: Amazon, B&Q, Debenhams, eBay, Tesco, The Range. Buttons: **Take the tour**, **Open inbox**. Setup checklist: **Finish setting up Engage** (4/5 shown) with steps **Engage switched on**, **Connect your stores**, **Add your team**, **Return address and courier links**, **Reply templates** ("Type _ in a reply to use one."), **AI Support** (Optional). KPI strip: **New tickets**, **Still open**, **In progress**, **Overdue**, **Resolved**, **Customers**, **Tickets per order**. Chart: "Activity" (Tickets vs Messages vs Opened by day). **Open right now:** "every open ticket, by time left to reply". **How fast you reply:** **First reply**, **Time to resolve**, **Solved in one reply**. **People answering**, **Team** ("who is answering"), **Manage**, **Add people**. **Latest tickets**, **View all**.
- **Inbox (Tickets).** "Every customer message, with what needs you first." Buttons: **Overview**, **Create ticket**. Status chips: **Open** ("open and in progress"), **Overdue**, **Unassigned**, **Handed to you** ("the AI needs a person"), **AI drafts ready** ("read, then send"), **Proof of delivery** ("waiting for your check"), **In progress**, **Snoozed**, **Resolved**, **All**. Filters: **All Brands**, per store.
- **AI Support** (NEW). "Choose how AI helps your team answer customers, and which requests it may take on." Tabs: **Suggest replies**, **Human checks**, **Activity**. **RESPONSE MODE:** **Off** ("Standard support only"), **AI drafts, your team sends**, **Live responses** ("AI answers supported tickets"). **SUPPORTED REQUESTS** (toggle each): **Delivery and tracking** ("Tracking links, courier updates, delivery status"), **Invoices and payments** ("Invoice copies and straightforward payment questions"), **Returns and refunds** ("Return instructions and sorting refund requests"), **Product questions** ("Product details, specifications and compatibility"), **General enquiries** ("Account, website and everyday support questions"). **AI RESULTS:** "Recent performance": **Estimated share AI could handle**, **Tickets reviewed**, **Ready for AI**, **Needs your team**. **HUMAN HAND-OFF:** "Your team stays in control — Unclear, sensitive or unsupported requests go back to your team." (**Always on**). Note: "Settings are managed by the account owner. You can see them here but not change them."
- **Rules** (NEW). "Act on every new buyer message: reply, assign, set the status and more. Rules run in the order below." Filters: **Active / Inactive**. Table: ORDER · RULE · SETTINGS · ACTIONS. Templates offered: **Blank rule**, **Reply when the subject says…**, **Reply out of hours**, **Share new conversations**, **Flag long conversations**.
- **Auto Responders.** "Send an instant reply when a message matches a rule." Platform filter: Amazon, eBay, Shopify, Direct email. Table: RULE · PLATFORM · REPLY TEMPLATE · LIMITS · TIMES RUN · STATUS · ACTIONS. Tip: a "Weekends only" rule with a template that says you will reply within…
- **Process Refunds.** "Refund requests from your team, waiting for finance to approve." Buttons: **Refresh**, **Download refund sheet**. Tiles: **Waiting**, **To refund**, **Oldest request**. Sections: **eBay refunds** ("Paid through eBay when approved"). Table: REQUESTED · AGENT · ORDER AND TICKET · SKU · REASON · AMOUNT · ACTIONS (**Refund on eBay**, **Reject**).
- **Feedback Automation** (NEW). "Amazon asks your buyers for a product review and seller feedback, in their own language, after the order arrives." Headline state: **Switched off** / "Not asking for reviews". Explainer: "WhatSales checks your Amazon orders every hour and presses Amazon's own "Request a Review" for you on the day you choose below. Amazon writes the email, so it always follows Amazon's rules." Facts: "Amazon's own email", "Once per order", "Buyers who opted out are never asked". Cards: **Requests sent**, **Waiting** ("checked daily until Amazon allows it"), **New seller feedback**. **IS IT WORKING**: "Your seller feedback over time", "BEFORE AND AFTER". **WHERE:** per-marketplace on/off table (UK, US, CA and 13 more Amazon sites). **WHEN:** **Send on day** control. **EXCEPTIONS:** "Orders not to ask about" by fulfilment (**FBA and FBM / FBA only / FBM only**), products (**All products / Only these / All except these**), and **Skip orders with optional** 1–5 star feedback, a refund, an item discount, a shipping discount. **WHAT BUYERS GET:** "Amazon sends it from Amazon, in the buyer's language. No seller or tool can change the wording."
- **Negative Seller Feedback.** Table: Date · Order No · Customer · Comment · Your Response · Rating.
- **Product Reviews.** **Product Review Summary**, **Review Distribution**, **Review Category** (**All / Good / Neutral / Bad Reviews**), **Your Product Review Sentiments**, **Top Recurring Words** and "Popular Phrases in Customer Sentiment" (word cloud: "This word cloud is made based on the most used Words in your reviews. Click on any word to see the reviews it resides in.").
- **Engage Settings.** "Addresses, tracking links, invoices and refund rules used across Engage." Sections: **Return address** ("Fills the {{return_address}} placeholder in your reply templates."), **Tracking links** ("One link per courier"), **Invoice template** ("PDF attached to replies"), **Refunds** ("How eBay refunds are sent"), **Snooze** ("When a snoozed ticket comes back"), **Reply limit** ("Flag long conversations"). Button: **Save settings**.

### Data shown
Ticket counts and ages, time-left-to-reply buckets, first-reply time, time to resolve, solved-in-one-reply %, tickets per order, per-agent load, AI "ready" vs "needs team", review counts, sentiment words, feedback count and positive-rating % per Amazon marketplace.

### Actions (described, not clicked)
**Create ticket**, **Open inbox**, **New rule**, rule edit/reorder, **Refund on eBay**, **Reject**, **Download refund sheet**, **Add people**, **Connect stores**, **Save settings**, switching **Response mode**, toggling supported requests, switching Feedback Automation on.

### Automations & AI
- **AI Support** with three modes and an explicit human hand-off.
- **Rules** and **Auto Responders** (no-code).
- **Feedback Automation**: hourly check, one request per order, uses Amazon's own "Request a Review", excludes opted-out buyers.
- **Reply templates** with placeholders.
- Per-ticket automatic status ("AI drafts ready", "Handed to you").

### Settings & rules
Return address, courier tracking links, invoice PDF, eBay refund method, snooze return time, reply-limit flag, AI mode and request scope, rule order, auto-responder limits and schedules, Feedback Automation timing, marketplace on/off and exceptions.

### Integrations used
Amazon, eBay, Shopify, direct email; also B&Q, Debenhams, Tesco, The Range (Mirakl) in the Overview filter. eBay for refunds. Amazon's "Request a Review" tool for feedback.

### Terminology
**Inbox**, **Handed to you**, **AI drafts ready**, **Proof of delivery**, **Snoozed**, **Overdue**, **Solved in one reply**, **Tickets per order**, **Human checks**, **Human hand-off**, **Supported requests**, **Response mode**, **Request a Review**, **Send on day**.

### Copy captured (verbatim)
- "Customer messages from your connected stores come into one inbox."
- "AI reads new tickets and drafts replies for your team to check."
- "Your team stays in control — Unclear, sensitive or unsupported requests go back to your team."
- "A rule acts on new buyer messages for you: reply with a template, pass the ticket to the right person, set its status and more."
- "Add a rule to send an instant reply, for example at weekends."
- "No satisfaction score: Engage doesn't survey customers yet." (honest limitation)
- "Asking every buyer is what Amazon's own button does, and it is the safe choice."
- "Nothing is ever sent twice."
- Empty states: "No rules yet", "No one assigned yet — People show here once tickets are assigned to them."

### First impressions
- **Impressed:** the AI story is unusually careful: three modes, per-request toggles, a permanent human hand-off, and a plain note when a limit exists. Feedback Automation explains compliance clearly. Setup checklist is a good onboarding pattern.
- **Confusing:** no customer satisfaction survey yet (stated on the page); AI Support settings are view-only for non-owners; one overview stat showed a very long "Time to resolve" next to a 0.0h first reply, which would raise questions in a demo. (certain: seen on this account; guessing: cause)

---

## 6. Flow

### What it does
Creates, checks and publishes product listings to marketplaces from one place, then shows whether they went live and whether they helped sales.

A Flow is a batch of listings prepared in a master catalogue, validated against channel rules and sent to marketplaces. The Flow Dashboard tracks what the marketplace accepted, what is live as sent and whether search and sales improved after the publish.

### Who uses it
Listing and catalogue managers, content teams and agencies that publish hundreds of listings at once.

### Screens
**Publish:** **Flow Dashboard** (`/FlowDashboard`), **Flow Publisher** (`/FlowPublisher`), **Bulk Publisher** (`/BulkPublisher`, BETA), **Bulk Publisher (old)** (`/PIMBulkEditor`).
**Catalogue:** **Product Studio** (`/PIMStudio`, titled "Product catalogue"), **Channel Profiles** (`/PIMProfiles`), **Amazon Brand Stories** (`/AmazonBrandStories`).

### Key features
- **Flow Dashboard.** "Did your Flows go through on the marketplaces, and did they help?" Buttons: **Tour**. Switches: **SHOW** options **Flow / Marketplace / Brand / Category** and **Published / Went through / Helped**. Tiles: **Flow published**, **Published by Flow** ("not published yet"), **Live as sent**, **Listed, can't be bought** ("no buyable offer on that site"), **Need a fix** (errors), **Shown in Amazon search** ("after the publish vs before"). Panel **Did it go through?**: "Flow's latest check of each listing on its marketplace" with a funnel **IN FLOWS → PUBLISHED → ACCEPTED → WHERE THE ACCEPTED ONES ARE NOW** (**Live, content differs**, **Waiting on the marketplace**, **Needs a fix**), plus **By marketplace**. Panel **Did it help?**: **Amazon search, weekly** ("Shown in search", "Clicks", "Purchases"), **Traffic and sales, daily**, **Best Seller Rank, after vs before**. Result labels: **Shown more / About the same / Shown less / Too early to tell / Nothing before to compare / No traffic data**. Table **Your Flows**: FLOW · WENT THROUGH · HELPED · SEARCH · UNITS · RANK.
- **Flow Publisher.** "Prepare, validate, translate, and publish marketplace listings from one Flow." Buttons: **Take the tour**; tabs **Dashboard**, **Product Studio**, **Publishing Flow** ("Select a publishing Flow"). Filters: **Marketplace**, **Issue** (**All issue states / Any current issue / Not touched yet**). Buttons: **Search**, **Import CSV**, **More Options**. Issues are shown with Amazon's own error codes and plain-English explanations (e.g. a "NOT_BUYABLE" state: "Likely buyability blockers: Amazon returned no active offer for this marketplace.").
- **Bulk Publisher** (BETA). "Change hundreds of listings at once. We check every one before anything is sent, and follow the marketplace's answer after." Tabs: **Listings**, **Jobs**, **Master data**; buttons **Product Studio**, **Refresh**, **Upload a list**. Pipeline cards: **Changes waiting** ("Nothing saved yet"), **Ready to send** ("Nothing checked yet"), **Sent, waiting for…** ("Nothing in flight"), **Needs you** ("Nothing failed"). "Click a card to see those listings". Filters: **Any category**, **Any brand**, **Quick filters**.
- **Product Studio.** "Select a product to work on." Button: **Import from Amazon**. Filters: **ALL / LINKED / IN STOCK / NO MASTER**, **Group families**, **Show deleted**. Each product shows a count of channels it is on.
- **Channel Profiles.** "Manage reusable category, policy, fulfilment, stock, and pricing defaults." Filters: All marketplaces, Amazon, eBay, Mirakl, Temu, Shopify, OnBuy. **New Profile**: scope fields **Profile name**, **Marketplace** (Mirakl-based retailers listed), **Country** (UK, US, AU, BE, CA, DE, ES, FR, IE, IT, NL, PL, SA, SE), **Store / account**, **Brand** ("With a brand, new listings of that brand use this profile automatically."). Status: **Draft**. Empty: "No matching profiles — Change the filters or create a profile."
- **Amazon Brand Stories.** "The "From the brand" strip Amazon shows above your A+ content. One story per brand, on that brand's products." Filters: **ACCOUNT**, **MARKETPLACE** (14 Amazon sites). Buttons: **Refresh from Amazon**, **Create a Brand Story**. Error shown: "Missing refresh token for region 'EU'." (an unfinished Amazon connection)

### Data shown
Counts of Flows, listings, publishes, accepted, live-as-sent, errors; weekly search impressions, clicks, purchases and rank before vs after; per-Flow listing counts. Charts: weekly line charts and a funnel-style bar. Table columns above.

### Actions (described, not clicked)
**Import CSV**, **Upload a list**, **Import from Amazon**, **New Profile**, **Create a Brand Story**, **Refresh from Amazon**, publishing from a Flow and bulk-send (labels not opened), **Take the tour**.

### Automations & AI
- Validation before every send ("We check every one before anything is sent, and follow the marketplace's answer after.").
- Translation is part of Publisher ("Prepare, validate, translate, and publish").
- Automatic profile pick by brand.
- (guessing) Translation is machine-driven; the UI does not say.

### Settings & rules
Channel Profiles (category, policy, fulfilment, stock, pricing defaults per marketplace, country, store, brand). Listing Health also uses **Channel rules** (from Performance).

### Integrations used
Amazon (listings, A+, Brand Stories, Brand Analytics), eBay, Temu, Shopify, OnBuy, Mirakl retailers (Tesco, Superdrug, Debenhams, Boots, B&Q, Perfumes Club). Linnworks for the master catalogue.

### Terminology
**Flow** (a publishing batch); **Publishing Flow**; **Live as sent**; **Live, content differs**; **Listed, can't be bought**; **Need a fix**; **Shown in search**; **Master data**; **Channel Profile**; **Product Studio**; **Jobs**.

### Copy captured (verbatim)
- "Did your Flows go through on the marketplaces, and did they help?"
- "Every listing from the Flow to the marketplace, and where it ended up. Click any part to see those listings."
- "Each published listing's result, after its publish against before."
- "Change hundreds of listings at once. We check every one before anything is sent, and follow the marketplace's answer after."
- Empty states: "Nothing saved yet", "Nothing checked yet", "Nothing in flight", "Nothing failed".

### First impressions
- **Impressed:** the "Did it go through? / Did it help?" framing is a strong and rare idea: it proves a listing change worked using Amazon's own search data. Channel errors are translated into plain language.
- **Confusing:** two Bulk Publishers (one BETA, one old) with the same name; Product Studio appears in both the sidebar and as a tab inside Flow Publisher; some Amazon connection errors (like the missing EU token) show raw API text. Note for sales: the Flow Dashboard data seen here is mostly from one marketplace (Amazon UK).

---

## 7. Workspace

### What it does
A task board and task lists so teams can turn findings into owned, trackable work.

The board shows tasks as cards moving through stages, with an inbox of notifications. My Tasks and Support Tasks list work by person. Listing Content tracks listing image and content tasks and can sync from a Google Sheet.

### Who uses it
Team leads, designers, content and support teams doing client work; account managers tracking handoffs.

### Screens
**Board** (`/Kanban`, shown with a board name), **My Tasks** (`/MyTasks`), **Support Tasks** (not opened), **Listing Content** (`/ListingContent`).

### Key features
- **Board (Kanban).** Filters: **All Dates**, **Overdue Tasks**, **My Tasks**, **Compact**, **Actions**. An **Inbox** feed of notifications such as "Task ready for review", "Task review requested", "Ball With handoff requested" and "Ball With handoff accepted". (certain) Handoffs between people are modelled as "passing the ball" ("Ball With").
- **My Tasks.** Table: Task · Entity · Task Description · Assigned On · Status · Priority · Actions; filters **Task Priority**, **Task Status**; search and "Show N entries".
- **Listing Content.** **Sync from Google Sheet** and **Google Sheet Settings**. Table: ASIN · SKU · Priority · Uploaded · Total Images · Status · Action. Empty state: "No data available in table".
- **Hand-off from Performance.** Product Diagnostics links in with "Workspace Action Plan: Turn diagnostics into owned, trackable work" (**Action Plan**, **Open Workspace**), and some exports say "where each fix is in Workspace".

### Data shown
Task cards by stage, due dates, priorities, statuses, assignees, review requests, listing-image counts per ASIN.

### Actions (described, not clicked)
Add/move tasks, review and accept hand-offs, **Sync from Google Sheet**, **Actions** menu on the board (not opened).

### Automations & AI
- Automatic notifications on review and "Ball With" handoffs.
- Task creation from Product Diagnostics (via **Action Plan**). (likely)
- No AI labels seen here.

### Settings & rules
**Google Sheet Settings** (Listing Content), board filters and views. No other settings seen.

### Integrations used
Google Sheets (Listing Content), Product Diagnostics and Performance exports (hand-off links).

### Terminology
**Ball With** (handoff), **Task ready for review**, **Board**, **Action Plan**, **Entity**, **Listing Content**.

### Copy captured (verbatim)
- "Turn diagnostics into owned, trackable work"
- "Task ready for review" / "Task review requested" / "Ball With handoff accepted" / "Ball With handoff requested"
- Empty table: "No data available in table"

### First impressions
- **Impressed:** linking findings to tasks closes the loop from "problem found" to "problem fixed". "Ball With" is a distinctive, memorable handoff concept.
- **Confusing:** the board on this account is used as a customer-onboarding and design-task board, so it reads as a generic task tool rather than a seller-specific one. My Tasks and Listing Content were empty on this login, so their real use cases were not visible. **Support Tasks** was not opened.

---

## 8. Cross-product observations (for the website)

- **The story across products:** Profitability = "what did we really make", Performance = "what to fix", Inventory = "what to buy and when", Engage = "keep customers happy", Flow = "list it right and prove it worked", Workspace = "turn findings into owned tasks". Product Diagnostics → Workspace and Listing Health → Flow are the strongest cross-links.
- **Trust signals worth using:** every page says what it did, when it last checked, and what it could not do. Examples: "Your sales connection is unaffected", "Nothing is ever sent twice", "Estimated share AI could handle".
- **Honest limits to respect on the site:** Recovery is Amazon-only today (other marketplaces say SOON); Budget Rules is Amazon-only beta; WhatSales-owned stock control is "COMING SOON"; Engage has no customer satisfaction survey yet; many pages are labelled NEW or BETA.
- **Naming issues a visitor could trip on:** two menus; two Bulk Publishers; "Hierarchy Mapping" vs "Native Product Catalogue" vs "Product Catalogue"; "Profit & Loss" vs "Monthly Profit Loss Statement"; "Orders" vs "Orders Summary"; "Tickets" vs "Inbox".

---

## 9. Icons & brand

(certain) Product icons are **font icons from the Phosphor Icons "bold" set**, not inline SVGs. There is no SVG markup to copy; the class names are below and the same icons can be rebuilt from the open-source Phosphor set. Each icon sits on a very light tinted tile.

| Product | Icon (Phosphor, bold) | Icon colour | Tile colour |
|---|---|---|---|
| **Profitability** | `ph-bold ph-currency-gbp` | #0891B2 (rgb 8,145,178) | #ECFEFF |
| **Performance** | `ph-bold ph-gauge` | #EA580C (rgb 234,88,12) | #FFF7ED |
| **Inventory** | `ph-bold ph-package` | #0D9488 (rgb 13,148,136) | #F0FDFA |
| **Engage** | `ph-bold ph-chats-circle` | #E11D48 (rgb 225,29,72) | #FFF1F2 |
| **Flow** | `ph-bold ph-share-network` | #2563EB (rgb 37,99,235) | #EFF6FF |
| **Workspace** | `ph-bold ph-briefcase` | #7C3AED (rgb 124,58,237) | #F5F3FF |

- (certain) These colours match the Tailwind 600 shades (cyan, orange, teal, rose, blue, violet) with the Tailwind 50 shades as tiles. That makes the six products a ready-made colour system for the website.
- **App logo:** an `<img>` served as `WhatSales_New.svg` from the app's own assets, linked in the top-left of the sidebar. The full URL was not copied because the page tools blocked reading URLs with query strings; pick it up from the browser's "Inspect" on the sidebar logo, or ask the dev team for the original SVG.
- **Fonts:** the page declares **Inter, Poppins, Helvetica, Arial, sans-serif** for the body. Computed fonts on elements also include **Lato** and **Montserrat** (older pages). (certain: declared; likely: Inter is the main current font, Lato/Montserrat from legacy pages)
- **Palette (from computed styles):**
  - App background: #F0F2F5 (rgb 240,242,245)
  - Body text: #344767 (rgb 52,71,103)
  - Primary CSS variable `--primary`: #666EE8 (soft indigo)
  - Legacy button colour on older pages: #E91E63 (pink)
  - Product tints: see table above
- (likely) The app mixes an older "Material dashboard" look (pink buttons, indigo accents) with the newer sidebar and cleaner cards, so brand colours are not yet fully consistent. Confirm the current brand palette with the owner before using it on the website.

---

## 10. Open questions

1. **Repricer, MCP:** confirm what they are and where they will live. They are not in the app on this account. Is **Recovery** meant to be one of the three "not activated" products, given it loads here?
2. **Pages that did not finish loading:** Buy Box Analysis, Ad Insights, All Campaigns, BSR Changes, Supplier Performance, Refunds Insights. Their data sections, KPI cards and tabs need a second pass on an account with a smaller catalogue or a longer wait.
3. **Not opened:** **Support Tasks**, **Bulk Publisher (old)**, tabs inside Buy Box Analysis (**Competitors**, **Market activity**, **Tracking**), Inventory Settings sub-panels beyond the first, the Recovery "Fix your pricing" tabs, Diagnostics **Settings**, and the Platform Connection detail per marketplace. Their contents are described from labels only.
4. **Tooltips:** hover tooltips were not captured on any page, only visible text.
5. **Screenshots:** none taken, as real client data was on screen. A clean demo account would allow proper product shots.
6. **Hard-coded greeting** ("Hi Martyn.") on Performance Tree: confirm it is a bug before any copy uses a greeting.
7. **Failed export** on the dashboard ("missing value for parameter: 'fromDate'"): report to dev.
8. **Legacy pages** (P&L, Orders, Refunds, Expenses) have a different visual style from the newer ones (Recovery, Shipping Choice, Product Diagnostics). Which look is the target brand for the redesign?
9. **Plan gating:** which of these pages are included in each plan? The account shows an **Upgrade Plan** button, but nothing indicated which features sit behind it.
10. **Account-specific content:** some figures (e.g. 8 accounts in the switcher, 32 brands, 13 platforms) are specific to this client's setup and should not be used as product claims.

**Compliance statement:** every rule in the brief was followed. The session was read-only: no Save, Send, Publish, Dispute, Reprice, Reorder, Apply, Confirm, Delete, Connect or Export button was clicked; no credentials were entered or copied; no customer messages were opened; and nothing was changed in the account.
