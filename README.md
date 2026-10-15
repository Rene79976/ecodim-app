# ECODIM — MVP

## 1. Créer le projet Supabase (une seule fois)
1. Va sur https://supabase.com et crée un compte + un nouveau projet.
2. Dans **SQL Editor**, colle tout le contenu de `supabase/schema.sql` et clique sur "Run".
   → Cela crée toutes les tables, la sécurité (RLS) et l'automatisation des comptes.
3. Dans **Project Settings > API**, note :
   - "Project URL" → c'est ta `VITE_SUPABASE_URL`
   - "anon public" key → c'est ta `VITE_SUPABASE_ANON_KEY`

## 2. Créer ta première École du Dimanche + ton compte Directeur
Pour l'instant (MVP), cette étape se fait manuellement dans Supabase :
1. Table Editor > `ecoles_dimanche` > Insert row → renseigne le nom de ton école.
2. Authentication > Users > Add user → crée ton compte (email + mot de passe).
3. Table Editor > `utilisateurs` > Insert row → id = l'id de l'utilisateur créé,
   ecole_dimanche_id = l'id de l'école, role = "directeur", + ton nom/prénoms.

(Une vraie page d'inscription pourra être ajoutée ensuite si besoin.)

## 3. Configurer le projet en local
```
cp .env.example .env.local
```
Remplis `.env.local` avec ton URL et ta clé Supabase.

```
npm install
npm run dev
```
Ouvre le lien affiché (ex: http://localhost:5173) — connecte-toi avec le compte directeur créé à l'étape 2.

## 4. Déployer l'invitation par email (Edge Function)
```
npx supabase login
npx supabase link --project-ref TON_PROJECT_REF
npx supabase functions deploy invite-moniteur
```

## 5. Mettre en ligne sur Netlify
1. Pousse ce dossier sur un dépôt GitHub.
2. Sur https://netlify.com, "Add new site" > "Import an existing project" > connecte ton dépôt GitHub.
3. Build command : `npm run build` — Publish directory : `dist`
4. Dans "Environment variables", ajoute `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`.
5. Déploie. Ensuite, chaque `git push` redéploie automatiquement le site.

## Ce qui est déjà fonctionnel
- Connexion / déconnexion
- Dashboard Directeur avec vraies statistiques (classes, moniteurs, enfants)
- Liste des moniteurs + invitation par email
- Dashboard Moniteur avec ses classes affectées

## Prochaines étapes
- Classes (création, affectation des moniteurs)
- Enfants (ajout, liste, fiche)
- Rapport du dimanche (appel, offrande, prédication)
- Absences (moniteur + directeur) avec liens WhatsApp
- Rapports (PDF / impression), Statistiques détaillées, Responsables
