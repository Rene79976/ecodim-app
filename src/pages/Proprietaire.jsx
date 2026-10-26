import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import ProgressRing from '../components/ProgressRing'

const fcfa = (n) => Number(n || 0).toLocaleString('fr-FR') + ' FCFA'
const dateFr = (d) => (d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—')
const ecartJours = (d) => (d ? Math.floor((Date.now() - new Date(d).getTime()) / 86400000) : null)

const etiquette = { fontSize: 11.5, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em' }

const STATUTS = {
  actif: ['Actif', 'var(--accent-soft)', 'var(--accent)'],
  impaye: ['Impayé', 'var(--danger-soft)', 'var(--danger)'],
  expire: ['Expiré', '#FFF1D6', '#8A5A00'],
  annule: ['Annulé', '#E8EDF5', '#8A93A6'],
}

function BadgeAbo({ statut }) {
  const [txt, bg, fg] = STATUTS[statut] || ['Sans abonnement', '#E8EDF5', '#8A93A6']
  return <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 999, background: bg, color: fg, whiteSpace: 'nowrap' }}>{txt}</span>
}

function Stat({ n, label, couleur }) {
  return (
    <div className="card" style={{ padding: 14 }}>
      <div style={{ fontSize: 24, fontWeight: 800, color: couleur || 'var(--accent)' }}>{n}</div>
      <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{label}</div>
    </div>
  )
}

function Surveillance({ titre, couleur, lignes }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8, borderColor: lignes.length ? couleur : 'var(--border)' }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: lignes.length ? couleur : 'var(--ink)' }}>{titre} ({lignes.length})</div>
      {lignes.length === 0 && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Rien à signaler.</div>}
      {lignes.map((l) => (
        <div key={l.id} style={{ fontSize: 13 }}>
          <strong>{l.nom}</strong> <span style={{ color: 'var(--muted)' }}>· {l.raison}</span>
        </div>
      ))}
    </div>
  )
}

export default function Proprietaire() {
  const [etat, setEtat] = useState({ chargement: true })
  const [edition, setEdition] = useState(null)
  const [form, setForm] = useState({ plafond: '100', montant: '4900', statut: 'actif', renouvellement: '' })
  const [enregistrement, setEnregistrement] = useState(false)
  const [message, setMessage] = useState('')
  const [messageErreur, setMessageErreur] = useState(false)

  async function charger() {
    const { data, error } = await supabase.rpc('metriques_proprietaire')
    if (error) {
      setEtat({ chargement: false, erreur: error.message })
      return
    }
    setEtat({ chargement: false, d: data })
  }

  useEffect(() => {
    charger()
  }, [])

  function ouvrirEdition(e) {
    setForm({
      plafond: String(e.plafond_enfants || 100),
      montant: String(e.montant_mensuel != null ? e.montant_mensuel : 4900),
      statut: e.abo_statut || 'actif',
      renouvellement: e.date_renouvellement || '',
    })
    setMessage('')
    setEdition(e.id)
  }

  async function enregistrerAbonnement(ev, ecoleId) {
    ev.preventDefault()
    setEnregistrement(true)
    setMessage('')
    const { error } = await supabase.rpc('definir_abonnement', {
      p_ecole: ecoleId,
      p_plafond: parseInt(form.plafond, 10),
      p_montant: parseFloat(form.montant),
      p_statut: form.statut,
      p_renouvellement: form.renouvellement || null,
    })
    setEnregistrement(false)
    if (error) {
      setMessageErreur(true)
      setMessage("L'abonnement n'a pas pu être enregistré : " + error.message)
      return
    }
    setMessageErreur(false)
    setMessage('Abonnement enregistré.')
    setEdition(null)
    charger()
  }

  if (etat.chargement) return <div className="page"><div style={{ color: 'var(--muted)' }}>Chargement…</div></div>

  if (etat.erreur) {
    return (
      <div className="page" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h1 style={{ fontSize: 20 }}>Espace propriétaire</h1>
        <div className="card" style={{ fontSize: 14, color: 'var(--muted)' }}>
          {etat.erreur.includes('Accès refusé')
            ? "Cet espace est réservé au propriétaire d'EcodimPlus."
            : "Impossible de charger les données : " + etat.erreur}
        </div>
        <a href="/" className="btn-outline" style={{ textAlign: 'center' }}>Retour</a>
      </div>
    )
  }

  const d = etat.d
  const ecoles = d.ecoles || []

  const inactives = ecoles
    .filter((e) => ecartJours(e.created_at) > 14 && (e.dernier_rapport == null || ecartJours(e.dernier_rapport) > 21))
    .map((e) => ({ id: e.id, nom: e.nom, raison: e.dernier_rapport ? `dernier rapport il y a ${ecartJours(e.dernier_rapport)} jours` : 'aucun rapport transmis' }))

  const prochesPlafond = ecoles
    .filter((e) => e.plafond_enfants && e.enfants >= 0.9 * e.plafond_enfants)
    .map((e) => ({ id: e.id, nom: e.nom, raison: `${e.enfants} enfants pour un plafond de ${e.plafond_enfants}` }))

  const abonnementsASuivre = ecoles
    .filter((e) => e.abo_statut === 'impaye' || e.abo_statut === 'expire' || (e.abo_statut === 'actif' && e.date_renouvellement && ecartJours(e.date_renouvellement) >= -14))
    .map((e) => ({
      id: e.id,
      nom: e.nom,
      raison: e.abo_statut === 'impaye' ? 'abonnement impayé' : e.abo_statut === 'expire' ? 'abonnement expiré' : `renouvellement le ${dateFr(e.date_renouvellement)}`,
    }))

  const pctActives = d.ecoles_total > 0 ? Math.round((d.ecoles_actives_dimanche / d.ecoles_total) * 100) : 0

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 22 }}>Espace propriétaire</h1>
          <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>Vue d'ensemble d'EcodimPlus</div>
        </div>
        <button className="btn-outline" style={{ padding: '8px 14px' }} onClick={() => { setEtat({ chargement: true }); charger() }}>Actualiser</button>
      </div>

      {message && <div style={{ fontSize: 13, color: messageErreur ? 'var(--danger)' : 'var(--accent)' }}>{message}</div>}

      <div style={etiquette}>Croissance</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
        <Stat n={d.ecoles_total} label="ECODIM inscrits" />
        <Stat n={`+${d.ecoles_30j}`} label="Nouveaux (30 jours)" couleur="var(--clay)" />
        <Stat n={d.moniteurs_total} label="Moniteurs" />
        <Stat n={d.enfants_total} label="Enfants suivis" />
        <Stat n={`+${d.enfants_30j}`} label="Enfants ajoutés (30 jours)" couleur="var(--clay)" />
        <Stat n={d.classes_total} label="Classes" />
      </div>

      <div style={etiquette}>Usage</div>
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <ProgressRing value={pctActives} color="var(--clay)" size={84} />
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>
          <strong style={{ color: 'var(--ink)' }}>{d.ecoles_actives_dimanche} sur {d.ecoles_total}</strong> ECODIM ont transmis au moins un rapport le dimanche {dateFr(d.dernier_dimanche)}.
        </div>
      </div>

      <div style={etiquette}>Revenus</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
        <div style={{ gridColumn: 'span 2' }}><Stat n={fcfa(d.mrr)} label="Revenu mensuel récurrent (abonnements actifs)" /></div>
        <Stat n={d.abonnements_actifs} label="Abonnements actifs" couleur="var(--clay)" />
        <Stat n={d.abonnements_impayes} label="Impayés" couleur="var(--danger)" />
      </div>
      {d.ecoles_sans_abonnement > 0 && (
        <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>{d.ecoles_sans_abonnement} ECODIM n'ont pas encore d'abonnement enregistré.</div>
      )}

      <div style={etiquette}>À surveiller</div>
      <Surveillance titre="ECODIM inactifs" couleur="var(--danger)" lignes={inactives} />
      <Surveillance titre="Proches de leur plafond d'enfants" couleur="var(--clay)" lignes={prochesPlafond} />
      <Surveillance titre="Abonnements à suivre" couleur="var(--danger)" lignes={abonnementsASuivre} />

      <div style={etiquette}>Tous les ECODIM</div>
      {ecoles.map((e) => {
        const chiffres = String(e.directeur_whatsapp || '').replace(/[^0-9]/g, '')
        return (
          <div key={e.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800 }}>{e.nom}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Inscrit le {dateFr(e.created_at)}</div>
              </div>
              <BadgeAbo statut={e.abo_statut} />
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div>{e.classes} classes · {e.moniteurs} moniteurs · {e.enfants} enfants{e.plafond_enfants ? ` (plafond ${e.plafond_enfants})` : ''}</div>
              <div>Dernier rapport : {e.dernier_rapport ? dateFr(e.dernier_rapport) : 'aucun'}</div>
              {e.montant_mensuel != null && <div>Abonnement : {fcfa(e.montant_mensuel)} par mois{e.date_renouvellement ? ` · renouvellement le ${dateFr(e.date_renouvellement)}` : ''}</div>}
              <div>Directeur : {e.directeur || '—'}{e.directeur_email ? ` · ${e.directeur_email}` : ''}</div>
            </div>

            {edition === e.id ? (
              <form onSubmit={(ev) => enregistrerAbonnement(ev, e.id)} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label>Plafond d'enfants</label>
                    <input type="number" min="1" required value={form.plafond} onChange={(ev) => setForm({ ...form, plafond: ev.target.value })} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label>Montant mensuel (FCFA)</label>
                    <input type="number" min="0" required value={form.montant} onChange={(ev) => setForm({ ...form, montant: ev.target.value })} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label>Statut</label>
                    <select value={form.statut} onChange={(ev) => setForm({ ...form, statut: ev.target.value })}>
                      <option value="actif">Actif</option>
                      <option value="impaye">Impayé</option>
                      <option value="expire">Expiré</option>
                      <option value="annule">Annulé</option>
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label>Renouvellement</label>
                    <input type="date" value={form.renouvellement} onChange={(ev) => setForm({ ...form, renouvellement: ev.target.value })} />
                  </div>
                </div>
                <button className="btn-primary" type="submit" disabled={enregistrement}>{enregistrement ? 'Enregistrement…' : "Enregistrer l'abonnement"}</button>
                <button type="button" className="btn-outline" onClick={() => setEdition(null)}>Annuler</button>
              </form>
            ) : (
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn-outline" style={{ flex: 1 }} onClick={() => ouvrirEdition(e)}>Abonnement</button>
                {chiffres && (
                  <a className="btn-outline" style={{ flex: 1, textAlign: 'center' }} href={`https://wa.me/${chiffres}`} target="_blank" rel="noreferrer">WhatsApp</a>
                )}
              </div>
            )}
          </div>
        )
      })}
      {ecoles.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 14 }}>Aucun ECODIM pour le moment.</div>}

      <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
        Cet espace n'affiche que des totaux et la fiche de contact du directeur : jamais les noms des enfants.
      </div>
      <a href="/" className="btn-outline" style={{ textAlign: 'center' }}>Retour à mon espace</a>
    </div>
  )
}
