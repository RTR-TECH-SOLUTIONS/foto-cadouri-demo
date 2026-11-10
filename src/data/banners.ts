// Bannerele de campanie din prima pagină. Admin-ul demo le poate edita (vezi src/lib/overrides.ts).
// TODO(real): vin din admin (bază de date), cu perioadă de afișare și produs ales.

export type Tone = 'ink' | 'forest' | 'sand' | 'wine' | 'cream';
export interface Banner { slug: string; tone: Tone; label: string; title: string; text: string; cta: string; href?: string }

export const banners: Banner[] = [
  {
    slug: 'suport-sticla-vanatoare-mistret',
    tone: 'ink',
    label: 'Black Friday · până pe 30 noiembrie',
    title: 'Până la -20% la cadourile de pe raft',
    text: 'Suporturi de sticlă pictate manual și statuete de servire, la preț redus. Avem câte 2-3 bucăți din fiecare model.',
    cta: 'Vezi reducerile',
    href: '/cadouri',
  },
  {
    slug: 'suport-sticla-caine-rata',
    tone: 'forest',
    label: 'Pentru vânători',
    title: 'Cadoul pe care îl pune pe raft, la cabană',
    text: 'Retrieverul cu rața în gură, turnat din rășină și pictat fir cu fir. Ține o sticlă de 0,75 l.',
    cta: 'Vezi produsul',
  },
  {
    slug: 'masina-retro-lemn-pahare-shot',
    tone: 'sand',
    label: 'Gravură gratuită, în aceeași zi',
    title: 'Numărul lui de mașină, gravat pe lemn',
    text: 'Mașinuța anilor 70 cu pahare de shot pe plafon. Scrii numărul sau numele la comandă și îl gravăm la noi în atelier.',
    cta: 'Personalizează',
  },
  {
    slug: 'cutie-cadou-rosie-vin-pahare',
    tone: 'wine',
    label: 'Gata de dat',
    title: 'Cutia cu vin pentru nași, ambalată cu fundă',
    text: 'Vin roșu sec și două pahare, cu etichetă „La mulți ani”. O ridici din magazin în drum spre petrecere.',
    cta: 'Vezi produsul',
  },
  {
    slug: 'suport-servire-bulldog-verde',
    tone: 'cream',
    label: 'Black Friday · decor și servire',
    title: 'Bulldogul care ține prăjiturile de sărbători',
    text: 'Două farfurii aurii, papion și ochelari de soare. Atrage privirile pe orice masă.',
    cta: 'Vezi produsul',
  },
];
