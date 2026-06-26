<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# Find me webs and data which helps understand how to calculate if an Electric vehicle is a good investment to change an old diesel/petrol vehicle, or if needing to buy a new vehicle shall I buy a ICE or EV , thinking about also being able to distinguish second hand vehicles and new vehicles for the one being bought, the ones being left behind being all ICE . We are talking cars, suvs, and family cars, and alike, not trucks or vans.

You can treat this as a total‑cost‑of‑ownership (TCO) problem: use EV vs petrol/diesel calculators to compare fuel/electricity, tax, maintenance, insurance and depreciation over your expected ownership period, separately for new and used cars. The decision then becomes: “Which option has the lowest full cost per year/per mile for my mileage and charging pattern?”, not just “Which sticker price is lower.”

## Core decision framework

For each option (keep current ICE, buy new ICE, buy new EV, buy used ICE, buy used EV) you want to estimate: purchase cost (or lease), fuel/electricity, maintenance, tax/charges (VED, ULEZ, congestion), insurance, and resale value at the end of ownership.[^1][^2]
Most modern calculators let you input annual mileage, mpg or miles/kWh, energy prices, ownership years and sometimes tax/maintenance assumptions, then output total cost and cost per mile so you can compare scenarios directly.[^3][^4][^1]

## Key UK calculators and tools

Here are UK‑relevant tools that give you numbers rather than hand‑waving:


| Tool | What it compares | Notable features |
| :-- | :-- | :-- |
| [HSBC EV Cost Comparison](https://www.hsbc.co.uk/sustainability/electric-vehicles/cost-calculator/) | EV vs ICE running (fuel only) | Simple UK fuel vs electricity cost for different car sizes and mileage; good quick sanity check. [^5] |
| [The EV Pros Running Cost Calculator](https://theevpros.com/tools/ev-running-cost-calculator) | EV vs petrol running cost | Uses miles per kWh vs mpg, home/public charging mix, current 2026 UK prices; outputs annual and per‑mile cost. [^6] |
| [SmartMoneyTools Electric vs Petrol Calculator](https://smartmoneytools.co.uk/tools/electric-vs-petrol-calculator/) | Annual running cost EV vs petrol/diesel | Lets you plug your own mileage, efficiency and energy prices; outputs annual saving and cost per mile. [^7] |
| [UK Finance Toolkit EV vs Petrol Cost Calculator](https://financetool.co.uk/tools/ev-vs-petrol-cost) | 5‑year TCO EV vs ICE | Includes purchase, fuel/electricity, BIK tax, maintenance, insurance, VED and depreciation; shows when EV becomes cheaper. [^1] |
| [EV Calculator UK](https://theevcalculator.co.uk) | New \& used EV vs petrol/diesel | Has specific mode for “Used EV vs Used Petrol/Diesel”; includes running costs, depreciation, insurance and finance. [^4] |
| [Calks EV vs Petrol Running Cost Calculator](https://calks.uk/calculator/ev-savings-calculator/) | 3–5 year TCO EV vs petrol | Includes purchase/lease, fuel/charging, insurance, road tax, MOT and maintenance; shows annual and 5‑year savings plus CO₂. [^2] |
| [Admiral EV Cost Calculator](https://www.admiral.com/car-insurance/car-cost-calculator) | Existing ICE vs potential EV | Compares running costs over 1, 3 and 5 years based on your spending patterns. [^8] |
| [Select Car Leasing Fuel Cost Calculator](https://www.selectcarleasing.co.uk/fuel-cost-calculator) | Fuel cost EV vs petrol/diesel | Quick “£ per year” view of fuel savings if you switch. [^9] |

These tools are largely UK‑priced and will align with your local tariffs, fuel prices and tax rules, which matters for a realistic investment view.[^6][^2][^1]

## Running‑cost formulas (fuel vs electricity)

Several calculators document the underlying formulas, which you can reuse in your own model or notes:

- ICE annual fuel cost:
$\text{Annual fuel (£)} = \frac{\text{annual miles}}{\text{mpg}} \times 4.54609 \times \text{fuel price per litre}$.
This uses UK gallons (4.54609 litres) and multiplies yearly litres by your petrol/diesel price.[^7][^6]
- EV annual electricity cost (single tariff):
$\text{Annual electricity (kWh)} = \frac{\text{annual miles}}{\text{miles per kWh}}$,
$\text{Annual electricity (£)} = \text{kWh} \times \text{price per kWh}$.[^6][^7]
- EV annual electricity cost (home vs public mix):
Blended price = (home% × home price) + (public% × public price), then multiply by kWh used.[^10][^6]

The EV Pros and SmartMoneyTools calculators describe this explicitly, and let you adjust home/public charging percentages so you can see how relying on rapid chargers changes the economics.[^7][^6]

## Typical per‑mile and annual savings

UK‑focused tools consistently show EVs are cheaper per mile if you can charge mostly at home:

- Typical EV cost per mile: around 4–7p on standard home tariffs, dropping to 2–3p on off‑peak EV tariffs.[^11][^2][^10]
- Typical petrol/diesel cost per mile: around 14–20p per mile at current UK fuel prices.[^2][^11]

TopCharger’s 2025 update suggests most UK drivers save roughly £800–£1,500 per year on fuel alone when switching from petrol to EV, depending on mileage and tariff.[^11]
Calks’ 2026 example shows a 12,000‑mile driver saving about £537 on fuel and £737 total per year once servicing savings are included, with a 5‑year saving around £3,700.[^2]

## Including tax, maintenance and depreciation

Basic calculators only cover energy, but comprehensive TCO tools add other components:

- Tax and charges: EVs registered before April 2025 have £0 VED, and many are exempt or discounted for congestion/ULEZ; newer EVs move to standard VED, which TCO tools now model.[^8][^2]
- Maintenance and servicing: EVs generally need less routine maintenance; some calculators add a fixed annual servicing saving (e.g., £200/year) into the comparison.[^2]

UK Finance Toolkit and Calks both include depreciation and residual value: they combine purchase or lease cost, then subtract expected resale value after 3–5 years to show true ownership cost; this is crucial for comparing new vs used and EV vs ICE on equal footing.[^1][^2]

## New ICE vs new EV

To decide between a new ICE and a new EV:

- Use a TCO tool where you can set ownership period (e.g., 5–10 years), annual mileage, car prices and tariffs; UK Finance Toolkit and EV Calculator UK are built for this.[^4][^1]
- Input: on‑the‑road price of each car, your likely insurance costs, realistic mpg and miles/kWh, home/public charging mix, and whether you benefit from company‑car BIK advantages for EVs.[^12][^1]

These tools will show whether the higher purchase price of an EV (if any) is paid back by lower running costs within your planned ownership horizon, and at which year the EV overtakes the ICE in cumulative cost.[^1][^2]

## Keeping an old ICE vs buying an EV

For “do I keep the old diesel/petrol or replace it with an EV?” you effectively compare:

- Scenario A: keep current ICE, model fuel, maintenance, tax, any upcoming big repairs, and depreciation to scrap/resale value.[^1][^2]
- Scenario B: sell the ICE now, buy EV; model purchase minus resale of ICE, then EV TCO over the same horizon (e.g., 5 years).[^4][^1]

EV Calculator UK and Admiral’s EV cost calculator are useful because they let you compare an existing vehicle against a candidate EV, rather than just two new cars; you plug in your current annual costs and see multi‑year EV vs “carry on as you are”.[^8][^4]

## Used ICE vs used EV

Your question explicitly includes second‑hand vehicles, which are where depreciation and reliability risk matter most:

- EV Calculator UK has a specific “Used EV vs Used Petrol/Diesel” mode that asks for each car’s current value/asking price, expected future value, insurance/servicing and your electricity tariff.[^4]
- Calks and UK Finance Toolkit can also be used with used vehicles by entering realistic purchase prices and shorter ownership periods (e.g., 3 years) to capture remaining depreciation.[^2][^1]

This lets you see, for example, whether a used EV with high initial depreciation but cheap running costs beats a cheaper used ICE that still has high fuel and future ULEZ/road‑tax exposure over the 3–5 years you plan to keep it.[^4][^1][^2]

## How to practically structure your analysis

A practical workflow that matches how you document decisions:

1. **Shortlist candidates**: For each “keep/buy” option, identify a specific model (e.g., your current car, a new EV SUV, a used ICE estate) and gather mpg, miles/kWh, real‑world insurance and servicing estimates.[^1][^4]
2. **Run quick fuel‑only comparisons**: Use HSBC, The EV Pros, SmartMoneyTools or Select Car Leasing to sanity‑check running costs and cost per mile based on your mileage and tariff.[^5][^9][^6][^7]
3. **Run full TCO scenarios**: For the 2–3 most realistic options, use UK Finance Toolkit, EV Calculator UK or Calks to model 5–10 year ownership including purchase, fuel/electricity, tax, maintenance, insurance and resale value, both for new and used candidates.[^4][^2][^1]
4. **Capture outputs in your notes**: Record cost per year and cost per mile for each scenario, plus break‑even year where EV overtakes ICE; this gives you an investment‑style comparison, including the option value of avoiding future ULEZ/tax changes.[^11][^2][^1]

If you’d like, I can next help you turn this into an Obsidian‑friendly template (inputs, formulas, and links to specific calculators) so you can plug in actual models you’re considering and compare “keep current ICE vs buy new EV vs buy used EV/ICE” in a repeatable way.
<span style="display:none">[^13][^14][^15]</span>

<div align="center">⁂</div>

[^1]: https://financetool.co.uk/tools/ev-vs-petrol-cost

[^2]: https://calks.uk/calculator/ev-savings-calculator/

[^3]: https://calculory.com/calculators/sustainability/ev-total-cost-of-ownership-calculator

[^4]: https://theevcalculator.co.uk

[^5]: https://www.hsbc.co.uk/sustainability/electric-vehicles/cost-calculator/

[^6]: https://theevpros.com/tools/ev-running-cost-calculator

[^7]: https://smartmoneytools.co.uk/tools/electric-vs-petrol-calculator/

[^8]: https://www.admiral.com/car-insurance/car-cost-calculator

[^9]: https://www.selectcarleasing.co.uk/fuel-cost-calculator

[^10]: https://nhs.motorsourcegroup.com/electric-cars/ev-savings-calculator

[^11]: https://topcharger.co.uk/electric-car-calculator-vs-petrol/

[^12]: https://www.dsautomobiles.co.uk/models/compare-models.html

[^13]: https://www.cenhud.com/en/my-energy/save-energy-money/energy-calculators/ev-calculator/

[^14]: https://www.skoda.co.uk/apps/fuelsavings

[^15]: https://gofikaev.com/tco-tool/

