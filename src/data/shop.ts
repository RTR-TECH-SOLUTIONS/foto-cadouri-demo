// Datele magazinului, într-un singur loc. TODO(real): nume firmă, oraș, adresă, program reale (de la clientă).

export const shop = {
  name: 'Foto & Cadouri',
  tagline: 'magazin de cadouri și studio foto',
  phone: '0723 704 217',
  phoneHref: 'tel:+40723704217',
  whatsapp: 'https://wa.me/40723704217',
  email: 'comenzi@fotosicadouri.ro',
  address: 'Str. Exemplu nr. 12, parter',
  city: 'centrul orașului',
  hours: [
    { days: 'Luni - Vineri', time: '09:00 - 19:00' },
    { days: 'Sâmbătă', time: '09:00 - 14:00' },
    { days: 'Duminică', time: 'închis' },
  ],
  hoursShort: 'L-V 9-19, S 9-14',
  rating: { score: '4,9', count: 126 },
  freeShipping: 250,
  shipping: 19,
};

export const waLink = (text: string) => `${shop.whatsapp}?text=${encodeURIComponent(text)}`;

// Google Maps fără cheie API (embed public). TODO(real): adresa exactă a magazinului sau link-ul din Google Business Profile.
const mapQuery = 'Piața Unirii, București';
export const mapEmbed = `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=16&hl=ro&output=embed`;
export const mapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;
export const mapDirections = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapQuery)}`;
