export type SampleCampaign = { name: string; keyword: string };

const FALLBACK: SampleCampaign[] = [
  { name: "Parks — Family", keyword: "public park visit" },
  { name: "Museums", keyword: "museum tickets" },
  { name: "Home cooking", keyword: "family dinner recipes" },
];

const THEMES: Record<string, SampleCampaign[]> = {
  AE: [
    { name: "Desert parks", keyword: "desert park visit" },
    { name: "Dates and spices", keyword: "fresh dates" },
    { name: "Falconry", keyword: "falcon show" },
  ],
  AT: [
    { name: "Alpine lakes", keyword: "alpine lake walk" },
    { name: "Concert halls", keyword: "family concert" },
    { name: "Mountain trains", keyword: "mountain train ride" },
  ],
  AU: [
    { name: "Beaches", keyword: "family beach day" },
    { name: "Wildlife parks", keyword: "koala park tickets" },
    { name: "Reef visits", keyword: "great barrier reef" },
  ],
  BE: [
    { name: "Waffles", keyword: "brussels waffle" },
    { name: "Chocolate shops", keyword: "chocolate shop" },
    { name: "Comics", keyword: "comic museum" },
  ],
  BR: [
    { name: "Football", keyword: "football match tickets" },
    { name: "Rainforest", keyword: "rainforest walk" },
    { name: "Beaches", keyword: "family beach day" },
  ],
  BW: [
    { name: "Safari", keyword: "okavango safari" },
    { name: "Wildlife", keyword: "wildlife viewing" },
    { name: "Craft markets", keyword: "craft market" },
  ],
  CA: [
    { name: "Maple", keyword: "maple syrup farm" },
    { name: "Hockey", keyword: "hockey game tickets" },
    { name: "Lakes", keyword: "lake canoe trip" },
  ],
  CH: [
    { name: "Alps", keyword: "alpine hike" },
    { name: "Chocolate", keyword: "chocolate factory" },
    { name: "Trains", keyword: "scenic train ride" },
  ],
  CN: [
    { name: "Pandas", keyword: "panda reserve" },
    { name: "Tea", keyword: "tea house visit" },
    { name: "Gardens", keyword: "classical garden" },
  ],
  CY: [
    { name: "Ancient sites", keyword: "ancient site tour" },
    { name: "Beaches", keyword: "family beach day" },
    { name: "Halloumi", keyword: "halloumi recipe" },
  ],
  DE: [
    { name: "Castles", keyword: "castle tour" },
    { name: "Bakeries", keyword: "bakery pretzels" },
    { name: "Forests", keyword: "forest walking trail" },
  ],
  DK: [
    { name: "Bicycles", keyword: "city bicycle" },
    { name: "Pastries", keyword: "danish pastry" },
    { name: "Design museums", keyword: "design museum" },
  ],
  EE: [
    { name: "Old town", keyword: "old town walk" },
    { name: "Forests", keyword: "forest trail" },
    { name: "Islands", keyword: "island ferry" },
  ],
  ES: [
    { name: "Football", keyword: "football match tickets" },
    { name: "Museums", keyword: "art museum" },
    { name: "Beaches", keyword: "family beach day" },
  ],
  FI: [
    { name: "Lakes", keyword: "lake cottage" },
    { name: "Northern lights", keyword: "northern lights tour" },
    { name: "Design", keyword: "design shop" },
  ],
  FR: [
    { name: "Bakeries", keyword: "fresh bakery bread" },
    { name: "Museums", keyword: "museum tickets" },
    { name: "Gardens", keyword: "public garden" },
  ],
  GB: [
    { name: "Tea", keyword: "afternoon tea" },
    { name: "Gardens", keyword: "botanic garden" },
    { name: "Football", keyword: "football match tickets" },
  ],
  GR: [
    { name: "Islands", keyword: "island ferry" },
    { name: "Ancient sites", keyword: "ancient site tour" },
    { name: "Olives", keyword: "olive grove visit" },
  ],
  HK: [
    { name: "Dim sum", keyword: "dim sum lunch" },
    { name: "Harbour", keyword: "harbour ferry" },
    { name: "Trams", keyword: "tram ride" },
  ],
  IE: [
    { name: "Music", keyword: "traditional music" },
    { name: "Green walks", keyword: "coastal walk" },
    { name: "Stories", keyword: "storytelling festival" },
  ],
  IN: [
    { name: "Cricket", keyword: "cricket match tickets" },
    { name: "Tea", keyword: "tea garden visit" },
    { name: "Festivals", keyword: "festival lights" },
  ],
  IT: [
    { name: "Gelato", keyword: "gelato shop" },
    { name: "Pasta", keyword: "fresh pasta class" },
    { name: "Art museums", keyword: "art museum tickets" },
  ],
  JP: [
    { name: "Cherry blossom", keyword: "cherry blossom park" },
    { name: "Trains", keyword: "scenic train ride" },
    { name: "Temples", keyword: "temple visit" },
  ],
  KE: [
    { name: "Safari", keyword: "safari park" },
    { name: "Tea", keyword: "tea farm visit" },
    { name: "Athletics", keyword: "athletics meet" },
  ],
  KR: [
    { name: "Palaces", keyword: "palace visit" },
    { name: "Street food", keyword: "family street food" },
    { name: "Hiking trails", keyword: "weekend hiking trail" },
  ],
  LT: [
    { name: "Amber", keyword: "amber museum" },
    { name: "Old town", keyword: "old town walk" },
    { name: "Basketball", keyword: "basketball tickets" },
  ],
  LU: [
    { name: "Castles", keyword: "castle tour" },
    { name: "Forests", keyword: "forest trail" },
    { name: "Cycling", keyword: "cycling path" },
  ],
  LV: [
    { name: "Old town", keyword: "old town walk" },
    { name: "Song festival", keyword: "song festival" },
    { name: "Forests", keyword: "forest trail" },
  ],
  MT: [
    { name: "Islands", keyword: "island ferry" },
    { name: "History", keyword: "history museum" },
    { name: "Sea walks", keyword: "coastal walk" },
  ],
  MX: [
    { name: "Family food", keyword: "family taco recipe" },
    { name: "Ancient sites", keyword: "ancient site tour" },
    { name: "Beaches", keyword: "family beach day" },
  ],
  NA: [
    { name: "Desert", keyword: "desert dunes" },
    { name: "Wildlife", keyword: "wildlife viewing" },
    { name: "Crafts", keyword: "craft market" },
  ],
  NG: [
    { name: "Football", keyword: "football match tickets" },
    { name: "Jollof", keyword: "jollof rice recipe" },
    { name: "Music", keyword: "family concert" },
  ],
  NL: [
    { name: "Tulips — Spring", keyword: "tulip fields" },
    { name: "Bicycles — City", keyword: "city bicycle" },
    { name: "Cheese markets", keyword: "gouda cheese market" },
  ],
  NO: [
    { name: "Fjords", keyword: "fjord boat trip" },
    { name: "Skiing", keyword: "family ski day" },
    { name: "Northern lights", keyword: "northern lights tour" },
  ],
  NZ: [
    { name: "Landscapes", keyword: "scenic walk" },
    { name: "Rugby", keyword: "rugby match tickets" },
    { name: "Hiking", keyword: "day hike" },
  ],
  PL: [
    { name: "Pierogi", keyword: "pierogi cooking class" },
    { name: "Old towns", keyword: "old town walk" },
    { name: "Mountains", keyword: "mountain trail" },
  ],
  PT: [
    { name: "Pastries", keyword: "custard tart" },
    { name: "Football", keyword: "football match tickets" },
    { name: "Tiles and towns", keyword: "historic town walk" },
  ],
  SE: [
    { name: "Forests", keyword: "forest walk" },
    { name: "Meatballs", keyword: "meatball recipe" },
    { name: "Midsummer", keyword: "midsummer flowers" },
  ],
  SG: [
    { name: "Gardens", keyword: "botanic garden" },
    { name: "Hawker food", keyword: "chicken rice" },
    { name: "Harbour", keyword: "harbour walk" },
  ],
  SI: [
    { name: "Lakes", keyword: "lake boat ride" },
    { name: "Mountains", keyword: "mountain trail" },
    { name: "Honey", keyword: "local honey" },
  ],
  SK: [
    { name: "Castles", keyword: "castle tour" },
    { name: "Mountains", keyword: "mountain trail" },
    { name: "Folk crafts", keyword: "folk craft market" },
  ],
  US: [
    { name: "National parks", keyword: "national park visit" },
    { name: "Baseball", keyword: "baseball tickets" },
    { name: "Road trips", keyword: "family road trip" },
  ],
  ZA: [
    { name: "Safari — Kruger", keyword: "kruger park safari" },
    { name: "Table Mountain", keyword: "table mountain cableway" },
    { name: "Rugby", keyword: "rugby match tickets" },
  ],
};

export function sampleCampaigns(country: string): SampleCampaign[] {
  const themes = THEMES[country];
  return themes && themes.length === 3 ? themes : FALLBACK;
}
