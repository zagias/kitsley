// Safety-first guides for the "Urgent issues & safety" category.
// Structure: when to call 911 → safety briefing → steps to follow safely → when to call a pro → disclaimer → sources.
// Wording follows the cited public safety sources. Never instruct anyone to enter water near electrical
// equipment or to shut off gas themselves.

const S = {
  esa: ["Electrical Safety Authority (Ontario): flood safety", "https://esasafe.com/safety/storm-safety/flood-safety/"],
  hydroOttawa: ["Hydro Ottawa: staying safe during basement flooding", "https://hydroottawa.com/en/blog/when-heavy-rain-hits-staying-safe-during-basement-flooding"],
  kingston: ["Utilities Kingston: what to do if your basement floods", "https://utilitieskingston.com/wastewater/basementflooding/flooded"],
  canada: ["Government of Canada: floods — get prepared", "https://www.canada.ca/en/services/policing/emergencies/preparedness/get-prepared/hazards-emergencies/floods/how-prepare.html"],
  redcross: ["Canadian Red Cross: 10 steps to take after a flood", "https://www.redcross.ca/blog/2022/9/10-steps-to-take-after-a-flood"],
  intact: ["Intact Insurance: what to do after water damage", "https://www.intact.ca/en/personal-insurance/home/house-insurance/water-damage-what-to-do"],
  york: ["York Region: sewage backup — health risks and what to do", "https://www.york.ca/media/100996/download"],
  squareone: ["Square One Insurance: after a sewer backup", "https://www.squareone.ca/resource-centres/home-personal-safety/after-a-water-backup"],
  toronto: ["City of Toronto: prevent or thaw frozen pipes", "https://www.toronto.ca/services-payments/water-environment/your-water-pipes-meter/water-related-help-advice/prevent-or-thaw-frozen-pipes/"],
  nfpa: ["NFPA: electrical safety tips", "https://www.ssfca.gov/files/assets/public/v/1/fire/documents/electrical_safety_tips.pdf"],
  massfire: ["Massachusetts Dept. of Fire Services: preventing electrical fires", "https://www.mass.gov/doc/preventing-electrical-fires-at-home-english/download"]
};

const POWER_RULE = "Don’t go near standing water that could reach outlets, cords, baseboard heaters, the furnace or the electrical panel. Call your electric utility to disconnect the power. Don’t switch off breakers yourself if you’d have to walk through water or stand on a wet floor to reach the panel.";
const GAS_RULE = "Smell gas (rotten eggs) or hear hissing? Leave right away. Don’t touch light switches, use a lighter or start anything electrical. Call 911 and your gas utility from outside. Never try to shut off the gas yourself.";

export const safetyDisclaimer = [
  "This is general safety information to help you act calmly and in the right order. It is not professional, medical, legal or insurance advice, and it can’t see your home.",
  "If anyone is in danger, or you see fire, smoke or sparks, or smell gas, leave and call 911 from a safe place. Do that before anything on this page.",
  "Never enter water that could touch electrical equipment, and never shut off gas yourself. Leave electrical, gas, structural and sewer repairs to licensed professionals.",
  "Local rules, utilities and insurance policies differ. Instructions from emergency services, your utility or your insurer come before this guide."
];

export const safetyGuides = {
  "basement-flood": {
    emergency: [
      GAS_RULE,
      "Water is rising fast, or you see fire, smoke or sparking.",
      "Someone is hurt, or is in water near electrical equipment. Don’t go in after them — call 911."
    ],
    briefing: [
      "Don’t go into the basement if water is above the outlets, baseboard heaters or furnace, or is near the electrical panel. Call your electric utility to disconnect the power.",
      "Don’t switch off breakers yourself if you’d have to walk through water or stand on a wet floor to reach the panel.",
      "Treat the water as dirty. Floodwater can carry sewage and bacteria, so keep children and pets out.",
      "If the water came in from outside (a river or overland flooding), wait until local authorities say it’s safe to go back in. Flooded buildings can be structurally unsafe."
    ],
    steps: [
      { title: "Make the power safe", body: "Let the utility disconnect the power. Only if the panel is in a dry area you can reach without touching water, switch off the main breaker while standing on a dry floor.", safety: "Don’t use, plug in or unplug anything that has been in the water." },
      { title: "Stop more water coming in", body: "If a burst pipe or appliance is the source, close the main water shut-off — only if you can reach it from a dry area. If water is coming up through floor drains, stop flushing and running any drain and use the sewage backup guide." },
      { title: "Call the right people", body: "Your electric utility if power needs disconnecting, a plumber for pipes, your city if the sewer is backing up, and your insurer to open a claim." },
      { title: "Take photos before you clean", body: "Photograph and video each area, the water line on the walls and the source. Keep receipts for anything you spend on emergency work." },
      { title: "Gear up", body: "Wear rubber boots, waterproof gloves, safety glasses and an N95 mask for any cleanup." },
      { title: "Remove the water", body: "Once the area is confirmed electrically safe, remove water with a pump or wet/dry vacuum, or call a water-restoration company.", safety: "Only run electric pumps or vacuums after the utility or a licensed electrician says the area is safe." },
      { title: "Dry it within 48 hours", body: "Open windows, run fans and a dehumidifier, and aim to keep humidity below 60%. Mould starts to grow quickly after about two days." },
      { title: "Clear out what can’t be saved", body: "Throw out food that touched floodwater. Photograph wet carpet, cardboard and soft furnishings, and check with your insurer before you discard them." },
      { title: "Get it checked before you use it", body: "A licensed electrician must inspect the wiring before power is restored. Gas appliances that were in water — furnace, water heater — are not safe to use until a registered heating contractor checks them." },
      { title: "Watch for mould", body: "You can usually clean small patches yourself. Get professional help for larger or returning growth." }
    ],
    pro: [
      "Water reached outlets, the electrical panel, the furnace or the water heater.",
      "The water smells of sewage, or came up through floor drains.",
      "You see cracks, bowing walls or sagging floors.",
      "Mould covers a large area or keeps coming back."
    ],
    sources: [S.esa, S.hydroOttawa, S.kingston, S.canada, S.redcross, S.intact]
  },
  "ceiling-leak": {
    emergency: [
      "The ceiling is bulging, cracking or sagging — get everyone out of the room and close the door.",
      "Water is coming through a light fixture and you see sparks or smell burning — leave and call 911."
    ],
    briefing: [
      "Don’t stand under a sagging or bulging ceiling, and don’t poke holes in it. Wet drywall can come down all at once.",
      "Don’t touch light switches, fixtures or outlets that are wet.",
      "If water is near lights or wiring, switch that circuit off at the panel — only if the panel is dry and you can reach it without touching water. Otherwise call an electrician.",
      "Wet floors are slippery. Move carefully."
    ],
    steps: [
      { title: "Clear the area", body: "Move people, pets and belongings away from under the leak." },
      { title: "Cut power to wet fixtures", body: "At a dry panel, switch off the breaker for the affected lights or outlets. Tape a note on it so no one switches it back on." },
      { title: "Stop the water", body: "If it’s coming from plumbing above — a bathroom, pipe or appliance — close that fixture’s shut-off valve or the main water shut-off.", safety: "If it’s rain or ice from the roof, stay off the roof. Call a roofer." },
      { title: "Catch it and protect your things", body: "Put buckets and towels under the drips and cover furniture with plastic." },
      { title: "Take photos", body: "Photograph the ceiling, the source and any damaged belongings before you clean up." },
      { title: "Call for repairs", body: "A plumber or roofer to fix the source, and your insurer if you plan to claim." },
      { title: "Dry it out", body: "Run fans and a dehumidifier and aim to dry the area within 48 hours. Ceiling drywall that sagged or stayed wet usually needs replacing — that’s a job for a professional." }
    ],
    pro: [
      "The ceiling is sagging, bulging or cracked.",
      "Water is near lights, wiring or the electrical panel.",
      "You can’t find the source, or it’s coming from the roof.",
      "Stains keep spreading after the water is off."
    ],
    sources: [S.intact]
  },
  "sewage-backup": {
    emergency: [
      GAS_RULE,
      "Sewage has reached outlets, heaters or the electrical panel — stay out and call your electric utility.",
      "Someone gets a fever, vomiting or diarrhea after contact, or a cut exposed to sewage turns red or swollen — see a doctor."
    ],
    briefing: [
      "Sewage carries germs that can make people sick. Keep children and pets away.",
      POWER_RULE,
      "Stop using water. Don’t flush, or run the washer, dishwasher or any drain — it adds to the backup.",
      "Never mix bleach with other cleaners, especially anything containing ammonia. It gives off toxic fumes."
    ],
    steps: [
      { title: "Make the power safe", body: "Let the utility disconnect power to the flooded area. Only switch off breakers yourself if the panel is dry and you can reach it without touching water." },
      { title: "Stop using water", body: "No flushing, showers, laundry or dishwasher until the drain is cleared." },
      { title: "Call the right people", body: "A plumber if it’s one drain, your city or sewer utility if it’s the main line, and your insurer to open a claim." },
      { title: "Take photos first", body: "Photograph the damage and the water level before cleanup starts." },
      { title: "Gear up", body: "Rubber boots, thick rubber gloves, eye protection and an N95 mask." },
      { title: "Let air in", body: "Open windows and doors. Once power is confirmed safe, run fans and a dehumidifier." },
      { title: "Throw out what can’t be cleaned", body: "Food that touched sewage, including fridge and freezer contents, cans, jars and bottled drinks. Mattresses, pillows, stuffed toys, paper, carpet and drywall that stayed wet. Check with your insurer and photograph items before you discard them." },
      { title: "Clean, then disinfect", body: "Wash hard surfaces with hot soapy water first. Then disinfect with 500 mL (2 cups) of household bleach (5.25%) in 4.5 L (18 cups) of water, and leave it on for at least 10 minutes.", safety: "Add bleach to water, not water to bleach. Ventilate the area." },
      { title: "Wash up", body: "Wash your hands with soap after every session. Wash work clothes separately and shower when you finish." }
    ],
    pro: [
      "More than a small area is affected, or sewage soaked into drywall or insulation.",
      "You have a private septic system.",
      "It keeps happening — ask about a backwater valve."
    ],
    sources: [S.york, S.kingston, S.squareone, S.esa]
  },
  "burning-outlet": {
    emergency: [
      "Smoke, flames, sparks, buzzing or sizzling, or a burning smell you can’t trace: leave, close doors behind you and call 911 from outside.",
      "Never throw water on an electrical fire."
    ],
    briefing: [
      "Don’t touch an outlet, plug or cord that is hot, melted, scorched or smoking.",
      "Don’t open the outlet or switch cover to look inside.",
      "Don’t keep resetting a breaker that trips again."
    ],
    steps: [
      { title: "Stop using it", body: "Switch off whatever is plugged in, using its own switch. If the plug and cord are cool and undamaged, unplug it by the plug body.", safety: "If anything is hot, melted or scorched, leave it where it is and go to the next step." },
      { title: "Cut the power", body: "If the panel is dry and away from any smoke or heat, switch off the breaker for that outlet — or the main if you’re not sure which one. Tape a note on it so no one switches it back on." },
      { title: "Keep watch", body: "Check your smoke alarms work and keep the area around the outlet clear. If you smell burning again, leave and call 911." },
      { title: "Call a licensed electrician", body: "Tell them which outlet, what you noticed (heat, smell, discolouring) and what was plugged in. In Ontario, use a Licensed Electrical Contractor." },
      { title: "Keep it off until it’s fixed", body: "Don’t use that outlet or circuit, and don’t run extension cords around it in the meantime." }
    ],
    pro: [
      "Always. A warm or discoloured outlet, or a burning smell, needs a qualified electrician."
    ],
    sources: [S.nfpa, S.massfire]
  },
  "frozen-pipe": {
    emergency: [
      "The pipe has burst and water is near outlets, heaters or the electrical panel — stay out of the water and call your electric utility."
    ],
    briefing: [
      "Find your main water shut-off before you start. If the pipe has split, it will leak as it thaws and you’ll need to close the valve fast.",
      "Never use a torch or open flame, or a propane or kerosene heater or charcoal stove, to thaw a pipe. It’s a fire hazard.",
      "Don’t leave a hair dryer, heating pad or space heater unattended, and keep it away from water."
    ],
    steps: [
      { title: "Find the main shut-off", body: "Know where it is and make sure you can turn it." },
      { title: "Open a tap", body: "Turn on the cold tap closest to the frozen section, or the lowest tap in the house, such as the laundry tub." },
      { title: "Warm the pipe gently", body: "Use a hair dryer, electric heating pad, space heater or warm towels. Start near the open tap and work back along the pipe.", safety: "Stay with any electrical heater while it runs." },
      { title: "Give it time", body: "Thawing can take one to six hours, depending on the cold and how much is frozen." },
      { title: "Check for leaks", body: "When water flows, turn the supply back on slowly and look for cracks or drips." },
      { title: "If it has burst", body: "Close the main shut-off right away, keep clear of water near electrical equipment, and call a plumber. Then use the water damage guides." },
      { title: "If you can’t find or thaw it", body: "Call a licensed plumber, or your city’s water service. In Toronto, call 311 — the City checks its side of the property line." }
    ],
    pro: [
      "You can’t find the frozen section, or it’s inside a wall or ceiling.",
      "The pipe has burst or is leaking.",
      "There’s no water anywhere in the house."
    ],
    sources: [S.toronto]
  },
  "water-damage-record": {
    emergency: [
      GAS_RULE,
      "Water is near outlets, heaters or the electrical panel — stay out and call your electric utility."
    ],
    briefing: [
      "Only photograph areas you can enter safely. Stay away from sagging ceilings and standing water near electrical equipment.",
      "Sewage-contaminated areas need boots, gloves, eye protection and a mask.",
      "Stopping further damage comes first. Insurers expect you to take reasonable steps to limit it."
    ],
    steps: [
      { title: "Call your insurer early", body: "Ask what they need from you and write down your claim number." },
      { title: "Photograph before you clean", body: "Take time-stamped photos and video of each room, the source and the water line. Include brand, model and serial labels on damaged items." },
      { title: "List what’s damaged", body: "Make an inventory as you go: item, where it was, rough age and value." },
      { title: "Limit further damage", body: "Stop the water, move belongings to a dry place and start drying. Keep receipts for emergency repairs, supplies and any hotel stay." },
      { title: "Keep damaged items", body: "Don’t throw things out until your insurer says it’s OK — they may want samples. Food and anything that’s a health hazard: photograph it, then discard it safely." },
      { title: "Keep a log", body: "Record dates, who you spoke to and what was agreed." }
    ],
    pro: [
      "Damage covers a large area, or involves sewage or mould.",
      "You’re unsure what your policy covers — ask your insurer or broker."
    ],
    sources: [S.intact]
  }
};
