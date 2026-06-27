# Making the site pay for itself — what *you* need to do

The site has a small **"Next steps"** section (in the detailed report) plus one discreet nudge on the
dashboard. These point to things a visitor naturally needs next — a charger installer, an EV energy
tariff, solar quotes, a place to buy/lease the car.

Right now those links go to real, reputable sites but earn **nothing**. To make them earn, you sign
up to a few **existing affiliate programs** (no contacting local firms, no ongoing admin) and paste
your personal tracked link in **one file**. Do it once; it then earns on autopilot.

> **You don't have to do any of this for the site to work.** If you skip it, the links still send
> people somewhere useful — you just don't get a commission. There's nothing to maintain.

---

## The one file you edit: `js/links.js`

It holds four links. Each has an `href` you replace with *your* tracked affiliate URL:

| Key in `links.js` | What it's for | Sign up to… | How you get your link |
|---|---|---|---|
| `tariff` | EV energy tariff | **Octopus Energy referral** (easiest — no application) | Octopus account → *Refer a friend* → copy your `share.octopus.energy/…` link |
| `charger` | Home charger install | An installer's scheme **or Awin** (see below) | Awin → search "EV charger" merchants → *Get a link* |
| `solar` | Solar & battery quotes | A solar **quote-comparison** affiliate (e.g. The Eco Experts) or **Awin** | Their affiliate signup → copy your tracked link |
| `car` | Buy / lease the car | **Carwow / LeaseLoco / Select Car Leasing** (usually via Awin) | Awin → that merchant → *Get a link* |

### The single biggest shortcut: join Awin once
[Awin](https://www.awin.com/) is an affiliate **network** — one signup (small, refundable ~£1
deposit) gives you access to *many* of the merchants above (car leasing, solar, some charger firms).
Apply to the merchants you want inside Awin, then use its "Get a link" tool to create your tracked
URL for each. That covers `charger`, `solar` and `car` from one account. Add the Octopus referral
for `tariff` and you're done.

### How to swap a link (≈30 seconds each)
1. Open `js/links.js`.
2. Find the entry (e.g. `key: "tariff"`).
3. Replace the `href: "https://octopus.energy/"` value with your tracked link.
4. Commit & push to `main` — it auto-deploys. (Or edit the file directly on GitHub and commit.)

That's it. The link earns from the next visitor who clicks and converts.

---

## Honest expectations

- **The limiter is traffic, not these links.** With little traffic, expect "covers the domain",
  not "income". The links are in place so that *if* traffic grows, money follows with zero extra work.
- **Commission varies** by program (energy referrals are a flat credit; lead-gen/solar can be a few
  £ to tens of £ per qualified lead; car/lease varies). Check each program's current terms — they
  change, and I can't guarantee any specific rate or that a given program is still open.
- **Tax:** affiliate commission is normal income — record it. No Merchant-of-Record needed (that's
  only for the "buy me a coffee" / product side); these are just referral payouts.
- **Disclosure is already on the page** ("some links may earn a small commission, at no cost to
  you") and links use `rel="sponsored"`, which is what Google and the ASA expect. Keep it.

## If you'd rather earn more later

The bigger idea — a searchable directory of *local* solar/charger/car firms with paid listings — is
deliberately **not** built yet, because it's real ongoing work (gathering firms, keeping them
current, selling listings) and only pays once you have an audience. The affiliate links above are
the low-effort version of the same thing. If the click stats ever justify it, that's the moment to
build the directory — not before.
