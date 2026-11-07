// Catalog demo. Primele 9 produse sunt cele trimise de clientă (poze din magazinul ei).
// TODO(real): vine din admin (bază de date), nu din fișier.

export type Category = 'suporturi-sticle' | 'seturi-lemn' | 'decor-servire' | 'cutii-cadou' | 'rame-albume';
export type Recipient = 'el' | 'ea' | 'vanatori' | 'casa-noua' | 'botez-nunta';

export interface Product {
  slug: string;
  name: string;
  short: string;
  price: number;
  oldPrice?: number;
  category: Category;
  for: Recipient[];
  image: string;
  badge?: string;
  engravable?: boolean;
  material: string;
  size: string;
  description: string[];
  stock: 'in-stoc' | 'ultimele' | 'la-comanda';
}

export const categories: { id: Category; name: string; blurb: string; image: string }[] = [
  {
    id: 'suporturi-sticle',
    name: 'Suporturi sticle și bar',
    blurb: 'Rășină pictată manual, scene de vânătoare și animale',
    image: '/img/p/suport-sticla-vanatoare-mistret.webp',
  },
  {
    id: 'seturi-lemn',
    name: 'Seturi din lemn',
    blurb: 'Tăiate la laser, cu pahare și loc pentru sticlă',
    image: '/img/p/masina-retro-lemn-pahare-shot.webp',
  },
  {
    id: 'decor-servire',
    name: 'Decor și servire',
    blurb: 'Statuete cu farfurii aurii pentru masa de sărbători',
    image: '/img/p/suport-servire-bulldog-verde.webp',
  },
  {
    id: 'cutii-cadou',
    name: 'Cutii și seturi cadou',
    blurb: 'Gata ambalate, cu vin și pahare',
    image: '/img/p/cutie-cadou-rosie-vin-pahare.webp',
  },
];

export const recipients: { id: Recipient; name: string; title: string }[] = [
  { id: 'el', name: 'Pentru el', title: 'Pentru cel care le are pe toate' },
  { id: 'vanatori', name: 'Vânători și pescari', title: 'Cadouri cu care se laudă la cabană' },
  { id: 'ea', name: 'Pentru ea', title: 'Pentru masa pe care o pregătește ea' },
  { id: 'casa-noua', name: 'Casă nouă', title: 'Primul lucru pus pe raft în casa nouă' },
  { id: 'botez-nunta', name: 'Nași, botez și nuntă', title: 'Cadouri pentru nași și părinți' },
];

export const products: Product[] = [
  {
    slug: 'suport-sticla-vanatoare-mistret',
    name: 'Suport sticlă din rășină „La vânătoare”, cu mistreț, binoclu și corn',
    short: 'Rășină pictată manual, ține o sticlă de 0,75 l',
    price: 159,
    oldPrice: 189,
    category: 'suporturi-sticle',
    for: ['el', 'vanatori'],
    image: '/img/p/suport-sticla-vanatoare-mistret.webp',
    badge: 'Cel mai cerut',
    material: 'Polirășină pictată manual',
    size: '34 × 20 × 14 cm, pentru sticle de 0,75 l',
    description: [
      'Scena e turnată dintr-o bucată: mistrețul lângă trunchi, binoclul și cornul de vânătoare, toate pictate de mână. Sticla stă înclinată, sprijinită în coadă și pe trunchi, așa că se poate turna direct din suport.',
      'Îl dăm cu sticla goală sau, la cerere, cu un vin roșu sec ales de noi.',
    ],
    stock: 'in-stoc',
  },
  {
    slug: 'suport-sticla-caine-rata',
    name: 'Suport sticlă din rășină, câine de vânătoare cu rața în gură',
    short: 'Pentru vânătorii cu câine, pictat manual',
    price: 149,
    oldPrice: 179,
    category: 'suporturi-sticle',
    for: ['el', 'vanatori'],
    image: '/img/p/suport-sticla-caine-rata.webp',
    material: 'Polirășină pictată manual',
    size: '30 × 22 × 13 cm, pentru sticle de 0,75 l',
    description: [
      'Un retriever care aduce rața în gură, cu blana pictată fir cu fir. Sticla se așază lângă câine și rămâne stabilă și pe raft, și pe masă.',
      'Merge bine cu un vin sau o țuică de casă, pentru cine iese la baltă și la vânat.',
    ],
    stock: 'in-stoc',
  },
  {
    slug: 'suport-sticla-cerb',
    name: 'Suport sticlă din rășină, cerb culcat pe rădăcini',
    short: 'Cerb cu coarne mari, finisaj bronz',
    price: 149,
    category: 'suporturi-sticle',
    for: ['el', 'vanatori', 'casa-noua'],
    image: '/img/p/suport-sticla-cerb.webp',
    material: 'Polirășină pictată manual',
    size: '36 × 21 × 14 cm, pentru sticle de 0,75 l',
    description: [
      'Cerbul stă culcat pe o bază sculptată ca rădăcinile unui copac, iar sticla se sprijină pe spatele lui. E unul dintre cele mai frumoase modele pe care le avem pe raft.',
      'Avem în magazin și varianta cu căprioară; întreabă-ne pe WhatsApp.',
    ],
    stock: 'ultimele',
  },
  {
    slug: 'cutie-cadou-rosie-vin-pahare',
    name: 'Cutie cadou roșie cu vin roșu și 2 pahare',
    short: 'Gata ambalată, cu satin în interior',
    price: 129,
    category: 'cutii-cadou',
    for: ['el', 'ea', 'botez-nunta'],
    image: '/img/p/cutie-cadou-rosie-vin-pahare.webp',
    badge: 'Gata de dat',
    material: 'Carton rigid, interior din satin, pahare din sticlă',
    size: '36 × 26 × 10 cm',
    description: [
      'Cutie roșie cu ornament auriu și trei ferestre: sticla de vin roșu sec la mijloc, câte un pahar de o parte și de alta, toate cu etichetă „La mulți ani”. Are mâner, n-ai nimic de ambalat.',
      'Putem schimba eticheta cu numele sau cu data evenimentului.',
    ],
    stock: 'in-stoc',
  },
  {
    slug: 'suport-servire-bulldog-verde',
    name: 'Suport de servire bulldog cu ochelari, cu 2 farfurii aurii',
    short: 'Pentru prăjituri, fructe sau bomboane',
    price: 139,
    oldPrice: 169,
    category: 'decor-servire',
    for: ['ea', 'casa-noua'],
    image: '/img/p/suport-servire-bulldog-verde.webp',
    material: 'Rășină lăcuită, farfurii din metal auriu',
    size: '38 cm înălțime, farfurii Ø 20 și 16 cm',
    description: [
      'Bulldogul turcoaz, cu papion și ochelari de soare, ține o farfurie aurie sus și una într-o parte. Arată bine gol, pe bufet, și și mai bine plin cu prăjituri la o aniversare.',
      'Farfuriile se scot și se spală separat.',
    ],
    stock: 'in-stoc',
  },
  {
    slug: 'suport-servire-panda',
    name: 'Suport de servire panda cu ochelari, cu farfurie aurie',
    short: 'Statuetă cu farfurie pentru bomboane',
    price: 99,
    oldPrice: 124,
    category: 'decor-servire',
    for: ['ea', 'casa-noua'],
    image: '/img/p/suport-servire-panda.webp',
    material: 'Rășină lăcuită, farfurie din metal auriu',
    size: '30 cm înălțime, farfurie Ø 18 cm',
    description: [
      'Un panda cu ochelari de soare care ține farfuria deasupra capului. Copiii îl adoră, iar pe masa de Crăciun ține bomboanele la vedere.',
    ],
    stock: 'in-stoc',
  },
  {
    slug: 'barca-lemn-suport-sticla',
    name: 'Barcă din lemn tăiată la laser, cu loc pentru sticlă',
    short: 'Placaj de mesteacăn, se poate grava numele',
    price: 119,
    category: 'seturi-lemn',
    for: ['el', 'vanatori'],
    image: '/img/p/barca-lemn-suport-sticla.webp',
    engravable: true,
    material: 'Placaj de mesteacăn 4 mm, tăiat și gravat la laser',
    size: '42 × 14 × 18 cm',
    description: [
      'Barca e tăiată la laser din placaj, cu cabină, hublouri și ancoră gravată pe bordaj. Sticla stă pe punte, într-un suport rotund.',
      'Pe bordaj gravăm gratuit un nume sau un mesaj scurt. Gravura e gata în aceeași zi.',
    ],
    stock: 'in-stoc',
  },
  {
    slug: 'masina-retro-lemn-pahare-shot',
    name: 'Mașinuță retro din lemn cu pahare de shot pe plafon',
    short: 'Mașina românească a anilor 70, din lemn',
    price: 129,
    category: 'seturi-lemn',
    for: ['el'],
    image: '/img/p/masina-retro-lemn-pahare-shot.webp',
    badge: 'Nou',
    engravable: true,
    material: 'Placaj de mesteacăn, pahare de shot din sticlă',
    size: '32 × 13 × 14 cm, pahare de 40 ml',
    description: [
      'Mașina pe care a condus-o tata, în lemn, cu pahare de shot prinse pe portbagajul de plafon.',
      'Pe portieră gravăm un număr de înmatriculare personalizat sau un nume.',
    ],
    stock: 'in-stoc',
  },
  {
    slug: 'camion-lemn-vin-pahare',
    name: 'Camion din lemn cu suport pentru pahare de vin',
    short: 'Pentru șoferi de TIR și pasionați de mașini',
    price: 149,
    category: 'seturi-lemn',
    for: ['el', 'casa-noua'],
    image: '/img/p/camion-lemn-vin-pahare.webp',
    engravable: true,
    material: 'Placaj de mesteacăn, pahare din sticlă',
    size: '44 × 15 × 20 cm',
    description: [
      'Un camion cu remorcă, din lemn vopsit gri. Paharele de vin stau agățate cu piciorul în fantele remorcii, gata de servit.',
      'Pe cabină putem grava numele firmei sau al șoferului. Cadou bun și pentru o pensionare.',
    ],
    stock: 'la-comanda',
  },
];

export type Material = 'rasina' | 'lemn' | 'carton';
export type Occasion = 'aniversare' | 'craciun' | 'nunta' | 'pensionare' | 'casa';
export const materials: { id: Material; name: string }[] = [
  { id: 'rasina', name: 'Rășină pictată' },
  { id: 'lemn', name: 'Lemn tăiat la laser' },
  { id: 'carton', name: 'Cutie cadou' },
];
export const occasions: { id: Occasion; name: string }[] = [
  { id: 'aniversare', name: 'Zi de naștere' },
  { id: 'craciun', name: 'Crăciun și sărbători' },
  { id: 'nunta', name: 'Nuntă și botez' },
  { id: 'pensionare', name: 'Pensionare' },
  { id: 'casa', name: 'Casă nouă' },
];
export const meta: Record<string, { mat: Material; occ: Occasion[] }> = {
  'suport-sticla-vanatoare-mistret': { mat: 'rasina', occ: ['aniversare', 'craciun', 'pensionare'] },
  'suport-sticla-caine-rata': { mat: 'rasina', occ: ['aniversare', 'craciun'] },
  'suport-sticla-cerb': { mat: 'rasina', occ: ['aniversare', 'casa', 'pensionare'] },
  'cutie-cadou-rosie-vin-pahare': { mat: 'carton', occ: ['aniversare', 'nunta', 'craciun'] },
  'suport-servire-bulldog-verde': { mat: 'rasina', occ: ['casa', 'craciun', 'aniversare'] },
  'suport-servire-panda': { mat: 'rasina', occ: ['casa', 'craciun'] },
  'barca-lemn-suport-sticla': { mat: 'lemn', occ: ['aniversare', 'pensionare'] },
  'masina-retro-lemn-pahare-shot': { mat: 'lemn', occ: ['aniversare', 'craciun'] },
  'camion-lemn-vin-pahare': { mat: 'lemn', occ: ['pensionare', 'aniversare'] },
};

export const bySlug = (slug: string) => products.find((p) => p.slug === slug);
export const categoryName = (id: Category) => categories.find((c) => c.id === id)?.name ?? 'Rame și albume';
export const discount = (p: Product) => (p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0);
export const stockLabel: Record<Product['stock'], string> = {
  'in-stoc': 'În stoc în magazin',
  ultimele: 'Ultimele bucăți',
  'la-comanda': 'La comandă, 2-3 zile',
};
