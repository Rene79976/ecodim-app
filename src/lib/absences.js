// Calcule, pour une liste d'enfants, le nombre de dimanches
// consécutifs d'absence (en repartant du rapport le plus récent).
// rapportsTries : rapports transmis de la classe, triés du plus
//                 récent au plus ancien : [{ id, dimanche_date }]
// presencesData : [{ rapport_id, enfant_id, present }]
// enfants       : [{ id, nom, prenoms, parent1_nom, parent1_tel, parent2_nom, parent2_tel }]
export function calculerAbsences(rapportsTries, presencesData, enfants) {
  const parEnfant = {}
  for (const p of presencesData) {
    if (!parEnfant[p.enfant_id]) parEnfant[p.enfant_id] = {}
    parEnfant[p.enfant_id][p.rapport_id] = p.present
  }

  const resultats = []
  for (const enfant of enfants) {
    let streak = 0
    for (const rapport of rapportsTries) {
      const valeur = parEnfant[enfant.id]?.[rapport.id]
      if (valeur === undefined) break // pas de donnée = on arrête le calcul ici
      if (valeur === false) streak += 1
      else break
    }
    if (streak > 0) resultats.push({ enfant, streak })
  }

  return resultats.sort((a, b) => b.streak - a.streak)
}

export function lienWhatsapp(tel, message) {
  if (!tel) return null
  const numero = tel.replace(/[^0-9]/g, '')
  if (!numero) return null
  return `https://wa.me/${numero}?text=${encodeURIComponent(message)}`
}

export function nomParent(enfant) {
  return enfant.parent1_nom || enfant.parent2_nom || 'un parent'
}

export function telParent(enfant) {
  return enfant.parent1_tel || enfant.parent2_tel || null
}
