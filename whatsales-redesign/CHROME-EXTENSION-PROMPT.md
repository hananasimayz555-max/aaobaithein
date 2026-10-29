# Prompt for Claude in Chrome: WhatSales product research

Paste everything below the line into Claude in Chrome while logged in to the WhatSales platform.

---

You are helping me document the WhatSales platform so we can redesign the marketing website and write a page for each product. I am logged in to a **live client account**. Your job is to **observe and document only**.

## Strict rules (follow all of them, at all times)

1. **Read-only.** Never click anything that saves, sends, publishes, deletes, disputes, reprices, reorders, connects, disconnects, exports, invites, pays or changes a setting. That includes buttons like Save, Send, Publish, Dispute, Reprice, Create PO, Reorder, Apply, Confirm, Delete, Archive, Connect, Upgrade. If you are unsure whether a click changes anything, **do not click it**. Note what the button does from its label and tooltip instead.
2. **Navigating is fine:** sidebar links, tabs, filters, date pickers, dropdowns that only change the view, and opening detail panels or drawers. Close any modal with Cancel, Close or Escape, never with a confirm button.
3. **No customer data in your notes.** Never write down real customer names, emails, phone numbers, addresses, order numbers, message contents, the client's brand names, or the account's real revenue or profit figures. Describe things instead, for example "a table of SKUs with columns X, Y, Z" or "a KPI card showing net profit in £". Use invented placeholders like `SKU-001` or `£0,000` if you need an example.
4. **Do not open or read individual customer messages** in the helpdesk beyond the list view and ticket categories.
5. **Never type, reveal or copy any password, API key, token or connection credential.**
6. If anything asks for a login, 2FA, payment or confirmation, **stop and tell me**.

## What to document

Go through the platform section by section. The products are: **Profitability, Performance, Inventory, Engage, Flow, Workspace, Repricer, Recovery, MCP**. Also cover the overall app shell (navigation, dashboard home, account switcher, settings and integrations pages).

### A. App shell (once)
- Sidebar and top navigation: every menu item and sub-item, in order, with the exact labels.
- The home or dashboard screen: every widget or card and what it shows.
- How brands, accounts and marketplaces are switched or filtered.
- The integrations or connections page: the full list of marketplaces and tools shown, which look connected and which are available. Names only, no credentials.
- Notifications, alerts and search: what they show and how they work.

### B. For EACH of the 9 products, write:
1. **What it does:** one sentence in plain English, then a 3–5 sentence explanation.
2. **Who uses it:** the type of user and the job they're doing.
3. **Screens:** every page, tab and sub-view, with the exact labels and in navigation order.
4. **Key features:** each feature with its exact UI name, what it does, and why a seller would care.
5. **Data shown:** columns, metrics, KPI cards, charts (type plus what's on each axis), filters, date ranges, groupings.
6. **Actions available:** every button or action and what it would do. **Describe them, don't click them.**
7. **Automations and AI:** anything automated, AI-generated or scheduled, and how it's explained in the UI.
8. **Settings and rules:** configurable options such as targets, thresholds, margin floors and auto-reply rules. Labels only.
9. **Integrations it relies on:** which marketplaces or tools feed this product.
10. **Terminology:** the product's own words for things, such as "Buy Box share", "margin floor" or "days of cover".
11. **Empty states, tooltips and onboarding text:** copy them **word for word**. This is great raw material for website copy.
12. **What impressed you, and what's confusing:** your honest view as a first-time user.

### C. Product icons and brand details (important)
For each of the 9 products, find the icon used in the sidebar or page header.
1. Open DevTools (Inspect), select the icon element, and copy its **full SVG markup** (`outerHTML`). If it's an `<img>`, give me the image URL instead.
2. Record its **colour**: the exact hex from the computed styles of the icon and its background tile.
3. Also capture the **WhatSales app logo** SVG or URL, and the app's main **fonts** and **colour palette** from computed styles: primary, accent and background colours, and the font family names.

### D. Screenshots
For each product, take **one clean screenshot of its main screen**, but only after you have hidden real data. Use the browser's DevTools to replace real figures, names and SKUs with placeholders, or crop to an area with no customer data. If you can't hide the data reliably, **skip the screenshot** and just describe the layout in detail.

## Output format

Produce one Markdown report with this structure, and keep exact UI labels in **bold**:

```
# WhatSales platform research

## 1. App shell
...

## 2. Profitability
### What it does
### Who uses it
### Screens
### Key features
### Data shown
### Actions
### Automations & AI
### Settings & rules
### Integrations used
### Terminology
### Copy captured (tooltips, empty states, onboarding), verbatim
### First impressions

## 3. Performance
... (same sections for all 9 products)

## 11. Icons & brand
| Product | Icon SVG / URL | Icon colour | Tile colour |
...
- App logo:
- Fonts:
- Palette:

## 12. Open questions
Anything you couldn't see, weren't sure about, or that needs a human to explain.
```

Work through it product by product. If the report gets long, give it to me in parts and say "PART X of Y" at the top of each. Before you finish, confirm that you followed every rule above and changed nothing in the account.
