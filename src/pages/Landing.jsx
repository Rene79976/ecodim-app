import { Link } from 'react-router-dom'
import Icone from '../components/Icone'
import ProgressRing from '../components/ProgressRing'

// Numéro WhatsApp affiché sur la page : indicatif du pays inclus, sans "+" ni espaces
// (exemple : 2250700000000). Laisse vide ('') pour masquer le bouton WhatsApp.
const WHATSAPP = ''

const conteneur = { maxWidth: 1000, margin: '0 auto', padding: '0 20px' }
const titreSection = { fontSize: 'clamp(24px, 4vw, 32px)', textAlign: 'center', margin: '0 0 10px' }
const sousTitre = { textAlign: 'center', color: 'var(--muted)', fontSize: 15, lineHeight: 1.55, margin: '0 auto 36px', maxWidth: 560 }
const grille = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }

const boutonOr = {
  display: 'inline-block', background: 'var(--gold)', color: 'var(--navy-dark)',
  fontWeight: 800, fontSize: 15, padding: '15px 26px', borderRadius: 14,
}
const boutonContour = {
  display: 'inline-block', border: '1.5px solid rgba(255,255,255,0.55)', color: '#fff',
  fontWeight: 700, fontSize: 15, padding: '13.5px 24px', borderRadius: 14,
}

const problemes = [
  ['Combien d\'enfants étaient là dimanche ?', 'Sans appel suivi chaque semaine, les chiffres restent des impressions.'],
  ['Qui n\'est plus revenu depuis trois semaines ?', 'Un enfant absent passe vite inaperçu quand personne n\'a la liste sous les yeux.'],
  ['Tous les moniteurs ont-ils fait leur rapport ?', 'Offrande, thème, leçon : tout est dispersé dans des carnets et des messages.'],
  ['Votre école du dimanche grandit-elle ?', 'Sans synthèse, difficile de répondre à votre pasteur ou à votre responsable régional.'],
]

const fonctions = [
  ['check', 'L\'appel en un geste', 'Les moniteurs cochent les présents sur leur téléphone. Les totaux garçons et filles se calculent tout seuls.'],
  ['file', 'Le rapport du dimanche', 'Offrande, dirigeant, prédicateur, thème, texte biblique et leçon : le rapport part directement chez le directeur.'],
  ['alert', 'Les absences qui comptent', 'Un enfant absent trois dimanches de suite passe en rouge, avec un message WhatsApp prêt à envoyer aux parents.'],
  ['users', 'Vos classes, votre équipe', 'Créez vos classes, invitez vos moniteurs par email et affectez-les. Chacun retrouve sa classe en se connectant.'],
  ['chart', 'Une synthèse pour le pasteur', 'Fréquentation, croissance, offrandes et répartition par classe, à imprimer ou à enregistrer en PDF.'],
  ['home', 'Chaque école chez soi', 'Chaque école du dimanche ne voit que ses propres données. Les autres n\'y ont pas accès.'],
]

const etapes = [
  ['Créez votre école', 'Donnez le nom de votre école du dimanche et créez votre compte directeur.'],
  ['Invitez vos moniteurs', 'Chaque moniteur reçoit un email, choisit son mot de passe et retrouve sa classe.'],
  ['Suivez vos dimanches', 'Appel, rapports, absences et chiffres : tout est au même endroit, sur téléphone.'],
]

function Apercu() {
  return (
    <div style={{ background: 'var(--surface)', borderRadius: 24, padding: 18, boxShadow: '0 20px 50px rgba(0,0,0,0.25)', color: 'var(--ink)', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 800 }}>École du dimanche (exemple)</div>
        <span style={{ fontSize: 10.5, fontWeight: 700, padding: '4px 10px', borderRadius: 999, background: 'var(--accent-soft)', color: 'var(--accent)' }}>Aperçu fictif</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
        {[['3', 'Classes'], ['2', 'Moniteurs'], ['20', 'Enfants']].map(([n, l]) => (
          <div key={l} style={{ background: 'var(--bg)', borderRadius: 14, padding: '12px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent)' }}>{n}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500 }}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'var(--bg)', borderRadius: 14, padding: 12 }}>
        <ProgressRing value={67} color="var(--clay)" size={64} />
        <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.4 }}>
          <strong style={{ color: 'var(--ink)' }}>Rapports du dimanche</strong><br />2 classes sur 3 ont transmis.
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--danger-soft)', color: 'var(--danger)', borderRadius: 14, padding: 12 }}>
        <Icone nom="alert" taille={22} />
        <div style={{ fontSize: 12.5, fontWeight: 700 }}>2 enfants à suivre en priorité</div>
      </div>
    </div>
  )
}

export default function Landing() {
  const lienWhatsapp = WHATSAPP
    ? `https://wa.me/${WHATSAPP}?text=${encodeURIComponent("Bonjour, je voudrais en savoir plus sur IctusKid.")}`
    : null

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <header style={{ background: 'var(--navy-dark)' }}>
        <div style={{ ...conteneur, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 64 }}>
          <div className="logo">Ictus<span>Kid</span></div>
          <Link to="/login" style={{ color: '#fff', fontWeight: 700, fontSize: 14, border: '1.5px solid rgba(255,255,255,0.45)', padding: '8px 16px', borderRadius: 12 }}>
            Se connecter
          </Link>
        </div>
      </header>

      <section style={{ background: 'var(--navy-dark)', borderRadius: '0 0 36px 36px', padding: '40px 0 64px', color: '#fff' }}>
        <div style={{ ...conteneur, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 40, alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(30px, 6vw, 44px)', lineHeight: 1.15, color: '#fff', margin: '0 0 16px' }}>
              Mesurez, accompagnez, faites grandir votre école du dimanche.
            </h1>
            <p style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.85, margin: '0 0 26px' }}>
              IctusKid aide les directeurs et les moniteurs à suivre la fréquentation, les rapports du dimanche et les enfants absents, depuis un simple téléphone.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              <Link to="/inscription" style={boutonOr}>Créer mon ECODIM</Link>
              <Link to="/login" style={boutonContour}>Se connecter</Link>
            </div>
            {lienWhatsapp && (
              <p style={{ margin: '18px 0 0', fontSize: 14, opacity: 0.85 }}>
                Une question ? <a href={lienWhatsapp} target="_blank" rel="noreferrer" style={{ color: 'var(--gold)', fontWeight: 700 }}>Écrivez-nous sur WhatsApp</a>
              </p>
            )}
          </div>
          <Apercu />
        </div>
      </section>

      <section style={{ padding: '64px 0 24px' }}>
        <div style={conteneur}>
          <h2 style={titreSection}>Ce que l'on ne mesure pas toujours</h2>
          <p style={sousTitre}>Quatre questions que se posent souvent les directeurs d'école du dimanche.</p>
          <div style={grille}>
            {problemes.map(([q, r]) => (
              <div key={q} className="card">
                <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 8, lineHeight: 1.35 }}>{q}</div>
                <div style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.5 }}>{r}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '48px 0 24px' }}>
        <div style={conteneur}>
          <h2 style={titreSection}>Ce que IctusKid change</h2>
          <p style={sousTitre}>Les gestes du dimanche, simplifiés pour le moniteur, et la vue d'ensemble pour le directeur.</p>
          <div style={grille}>
            {fonctions.map(([icone, titre, texte]) => (
              <div key={titre} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="badge-icone"><Icone nom={icone} /></div>
                <div style={{ fontSize: 16, fontWeight: 800 }}>{titre}</div>
                <div style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.5 }}>{texte}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '48px 0 64px' }}>
        <div style={conteneur}>
          <h2 style={titreSection}>Comment ça marche</h2>
          <p style={sousTitre}>Trois étapes, sans rien installer.</p>
          <div style={grille}>
            {etapes.map(([titre, texte], i) => (
              <div key={titre} style={{ textAlign: 'center', padding: '8px 12px' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--gold)', color: 'var(--navy-dark)', fontWeight: 800, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>{i + 1}</div>
                <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>{titre}</div>
                <div style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.5 }}>{texte}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ background: 'var(--navy-dark)', color: '#fff', padding: '56px 0', textAlign: 'center' }}>
        <div style={conteneur}>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 32px)', color: '#fff', margin: '0 0 12px' }}>Prêt à voir vos dimanches autrement ?</h2>
          <p style={{ fontSize: 15, opacity: 0.85, margin: '0 auto 24px', maxWidth: 520, lineHeight: 1.55 }}>
            Créez votre école du dimanche en quelques minutes et invitez vos moniteurs.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
            <Link to="/inscription" style={boutonOr}>Créer mon ECODIM</Link>
            {lienWhatsapp && <a href={lienWhatsapp} target="_blank" rel="noreferrer" style={boutonContour}>Poser une question</a>}
          </div>
        </div>
      </section>

      <footer style={{ padding: '24px 0', textAlign: 'center', fontSize: 12.5, color: 'var(--muted)' }}>
        © {new Date().getFullYear()} IctusKid · <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 700 }}>Se connecter</Link>
      </footer>
    </div>
  )
}
