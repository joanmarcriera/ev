// links.js — the "Next steps" outbound links. These are affiliate/referral links: outbound only,
// no tracking scripts, no backend. To EARN from them, the site owner signs up to each program once
// and swaps the `href` below for their own tracked/referral URL — see AFFILIATE-SETUP.md.
//
// Each entry's `href` ships pointing at a real, reputable UK destination so the links are useful
// from day one; they only start earning once you replace them with your affiliate-tracked version.
// `when(ctx)` decides if the link is relevant to the current comparison.
//
// ctx = { anyEv, winnerIsEv, anySolar }

export const AFFILIATE_LINKS = [
  {
    key: "charger",
    label: "Compare home-charger install quotes",
    blurb: "A home charge point is a one-off — get a few quotes before you commit.",
    href: "https://pod-point.com/", // REPLACE with your installer affiliate/referral URL
    when: (c) => c.anyEv,
  },
  {
    key: "tariff",
    label: "Switch to an EV energy tariff",
    blurb: "A cheap overnight EV rate is what makes home charging 2–3p/mile.",
    href: "https://octopus.energy/", // REPLACE with your Octopus referral link (share.octopus.energy/...)
    when: (c) => c.anyEv,
  },
  {
    key: "solar",
    label: "Get solar & battery quotes",
    blurb: "Charging from your own roof drops EV running cost close to zero.",
    href: "https://www.theecoexperts.co.uk/", // REPLACE with your solar-quotes affiliate URL
    when: (c) => c.anyEv || c.anySolar,
  },
  {
    key: "car",
    label: "Find or lease the car",
    blurb: "Compare new, used and lease deals once you've picked a direction.",
    href: "https://www.carwow.co.uk/", // REPLACE with your Carwow / leasing affiliate URL
    when: () => true,
  },
];

/** The links relevant to the current comparison, in declared order. */
export function relevantLinks(ctx) {
  return AFFILIATE_LINKS.filter((l) => l.when(ctx));
}

/** The single dashboard nudge link (charger), shown only when an EV is the cheaper choice. */
export function nudgeLink() {
  return AFFILIATE_LINKS.find((l) => l.key === "charger");
}
