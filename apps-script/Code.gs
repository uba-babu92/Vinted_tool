// Colis Vinted — lit tes mails Vinted et les donne à l'appli.
// À coller dans script.google.com (voir README.md).

const JOURS = 90; // on regarde les mails des 90 derniers jours

function doGet(e) {
  const p = e.parameter || {};
  let out;
  try {
    if (p.action === 'label') out = getLabel(p.id);
    else if (p.action === 'img') out = getImg(p.url);
    else out = { sales: getSales() };
  } catch (err) {
    out = { error: String(err) };
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

function getSales() {
  const cache = CacheService.getUserCache();
  const hit = cache.get('sales');
  if (hit) return JSON.parse(hit);

  const q = 'from:vinted.fr newer_than:' + JOURS + 'd ' +
    '(subject:"s\'est vendu" OR subject:"Bordereau d\'envoi" OR subject:"Commande mise à jour" OR subject:"transaction est finalisée")';
  const threads = GmailApp.search(q, 0, 300);
  const sales = [], events = [];

  threads.forEach(t => t.getMessages().forEach(m => {
    if (!/vinted/i.test(m.getFrom())) return;
    const subj = m.getSubject();
    const date = m.getDate().getTime();
    const plain = m.getPlainBody().replace(/\*/g, '').replace(/\s+/g, ' ');

    if (/s'est vendu/.test(subj)) {
      const r = plain.match(/([^\s,]+) a acheté (.+?) ([\d.,]+) ?€/);
      if (!r) return;
      const img = m.getBody().match(/src="(https:\/\/images\d*\.vinted\.net\/[^"]+)"/);
      sales.push({
        id: m.getId(), date, buyer: r[1], title: r[2].trim(),
        price: parseFloat(r[3].replace(',', '.')),
        image: img ? decode(img[1]) : null,
        status: 'vendu', labelId: null,
      });
    } else if (/^Bordereau d'envoi/.test(subj)) {
      const r = subj.match(/ pour (.+)$/);
      const pdf = m.getAttachments().some(a => /pdf/i.test(a.getContentType()));
      if (r && pdf) events.push({ date, title: r[1], type: 'bordereau', labelId: m.getId() });
    } else if (/^Commande mise à jour pour /.test(subj)) {
      const title = subj.replace(/^Commande mise à jour pour /, '');
      let type = null;
      if (/a reçu sa commande/.test(plain)) type = 'livre';
      else if (/commande (a été|est) annulée|renvoyé au vendeur/i.test(plain)) type = 'annule';
      else if (/déposé|a été expédié|est en route|en chemin/i.test(plain)) type = 'envoye';
      if (type) events.push({ date, title, type });
    } else if (/transaction est finalisée/.test(subj)) {
      const r = plain.match(/La vente de (.+?) a été réalisée/);
      if (r) events.push({ date, title: r[1], type: 'paye' });
    }
  }));

  // Chaque événement va à la dernière vente du même article avant lui.
  const RANG = { vendu: 0, bordereau: 1, envoye: 2, livre: 3, paye: 4, annule: 5 };
  sales.sort((a, b) => a.date - b.date);
  events.sort((a, b) => a.date - b.date).forEach(ev => {
    const n = norm(ev.title);
    let s = null;
    sales.forEach(x => {
      const nx = norm(x.title);
      if (x.date <= ev.date && (nx === n || nx.startsWith(n) || n.startsWith(nx))) s = x;
    });
    if (!s) return;
    if (ev.labelId) s.labelId = ev.labelId;
    if (RANG[ev.type] > RANG[s.status]) s.status = ev.type;
  });

  cache.put('sales', JSON.stringify(sales), 120);
  return sales;
}

function getLabel(id) {
  const m = GmailApp.getMessageById(id);
  if (!m || !/vinted/i.test(m.getFrom())) return { error: 'introuvable' };
  const a = m.getAttachments().find(x => /pdf/i.test(x.getContentType()));
  if (!a) return { error: 'pas de PDF' };
  return { b64: Utilities.base64Encode(a.getBytes()) };
}

function getImg(url) {
  if (!/^https:\/\/images\d*\.vinted\.net\//.test(url || '')) return { error: 'url refusée' };
  const r = UrlFetchApp.fetch(url);
  return { b64: Utilities.base64Encode(r.getContent()), type: r.getHeaders()['Content-Type'] || 'image/jpeg' };
}

function norm(s) { return String(s).toLowerCase().replace(/\s+/g, ' ').trim(); }
function decode(s) { return s.replace(/&amp;/g, '&'); }
