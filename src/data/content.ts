// Texte și prețuri editabile din admin. TODO(real): vin din admin (tabel „texte site” + „prețuri studio”).

export const studioPrices = [
  { id: 'acte', name: 'Poze buletin, pașaport, permis', note: '4 sau 6 poze, gata în 10 minute', price: '30 lei' },
  { id: 'viza', name: 'Poze viză SUA, Canada, UK', note: 'format specific fiecărei ambasade', price: '40 lei' },
  { id: 'print', name: 'Printare foto 10 × 15 cm', note: 'hârtie lucioasă sau mată, de pe telefon sau stick', price: 'de la 1,50 lei' },
  { id: 'print-mare', name: 'Printare 20 × 30 cm', note: 'și 30 × 40, 40 × 60 la comandă', price: 'de la 12 lei' },
  { id: 'sedinta', name: 'Ședință foto în studio', note: 'familie, copii, cuplu, 30 de minute, 10 poze editate', price: 'de la 250 lei' },
  { id: 'restaurare', name: 'Restaurare poze vechi', note: 'scanare, retuș zgârieturi și culoare', price: 'de la 40 lei' },
  { id: 'casete', name: 'Transfer casete video pe stick', note: 'VHS, MiniDV, Video8', price: '35 lei / casetă' },
  { id: 'eveniment', name: 'Foto la botez și cununie', note: 'în biserică și la restaurant', price: 'la cerere' },
];

export const reviews = [
  {
    name: 'Adrian M.',
    product: 'Suport sticlă „La vânătoare”',
    text: 'L-am luat pentru socrul meu, vânător de 30 de ani. E mult mai frumos în realitate decât în poză, pictat fin.',
  },
  {
    name: 'Ioana P.',
    product: 'Poze pașaport',
    text: 'Am venit fără programare pentru pozele de pașaport ale copilului. În 10 minute eram gata, au refăcut până a ieșit bine.',
  },
  {
    name: 'Cristina D.',
    product: 'Mașinuță din lemn cu pahare',
    text: 'Au gravat numărul de înmatriculare al tatălui meu pe mașinuță. A plâns de emoție când a văzut-o.',
  },
  {
    name: 'Mihai R.',
    product: 'Cutie cadou cu vin',
    text: 'Comandat seara pe site, ridicat a doua zi dimineață, gata ambalat cu fundă. Exact ce aveam nevoie pentru nași.',
  },
];
