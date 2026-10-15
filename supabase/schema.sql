-- ============================================================
-- ECODIM — Schéma de base de données (Supabase / PostgreSQL)
-- À exécuter dans : Supabase > SQL Editor > New query
-- ============================================================

-- 1. ÉCOLES DU DIMANCHE ---------------------------------------
create table ecoles_dimanche (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  adresse text,
  statut text not null default 'actif' check (statut in ('actif','inactif')),
  created_at timestamptz not null default now()
);

-- 2. UTILISATEURS (directeurs + moniteurs) --------------------
create table utilisateurs (
  id uuid primary key references auth.users(id) on delete cascade,
  ecole_dimanche_id uuid not null references ecoles_dimanche(id) on delete cascade,
  role text not null check (role in ('directeur','moniteur')),
  nom text not null,
  prenoms text not null,
  email text not null,
  whatsapp text,                 -- format E.164, ex: +2250700000000
  lieu_habitation text,
  bapteme_eau boolean not null default false,
  bapteme_saint_esprit boolean not null default false,
  statut text not null default 'actif' check (statut in ('actif','inactif')),
  created_at timestamptz not null default now()
);

-- 3. CLASSES ----------------------------------------------------
create table classes (
  id uuid primary key default gen_random_uuid(),
  ecole_dimanche_id uuid not null references ecoles_dimanche(id) on delete cascade,
  nom text not null,
  description text,
  statut text not null default 'actif' check (statut in ('actif','inactif')),
  created_at timestamptz not null default now()
);

-- 4. AFFECTATION MONITEUR <-> CLASSE (many-to-many) -----------
create table classe_moniteurs (
  classe_id uuid not null references classes(id) on delete cascade,
  moniteur_id uuid not null references utilisateurs(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (classe_id, moniteur_id)
);

-- 5. ENFANTS ------------------------------------------------------
create table enfants (
  id uuid primary key default gen_random_uuid(),
  ecole_dimanche_id uuid not null references ecoles_dimanche(id) on delete cascade,
  classe_id uuid not null references classes(id) on delete cascade,
  nom text not null,
  prenoms text not null,
  sexe text check (sexe in ('M','F')),
  age integer,
  classe_scolaire text,
  classe_ecodim text,
  lieu_habitation text,
  parent1_nom text,
  parent1_tel text,
  parent2_nom text,
  parent2_tel text,
  created_by uuid references utilisateurs(id),
  created_at timestamptz not null default now()
);

-- 6. RESPONSABLES (dirigeants / prédicateurs) ------------------
-- 7. RAPPORTS (un par classe / dimanche) --------------------------
-- dirigeant_id / predicateur_id : ce sont des moniteurs affectés à la
-- classe (table utilisateurs), pas une liste séparée.
create table rapports (
  id uuid primary key default gen_random_uuid(),
  ecole_dimanche_id uuid not null references ecoles_dimanche(id) on delete cascade,
  classe_id uuid not null references classes(id) on delete cascade,
  moniteur_id uuid not null references utilisateurs(id),
  dimanche_date date not null,
  statut text not null default 'brouillon' check (statut in ('brouillon','transmis')),
  offrande numeric(12,2),
  dirigeant_id uuid references utilisateurs(id),
  predicateur_id uuid references utilisateurs(id),
  theme text,
  texte_biblique text,
  lecon_spirituelle text,
  transmis_at timestamptz,
  created_at timestamptz not null default now(),
  unique (classe_id, dimanche_date)
);

-- 8. PRÉSENCES (une ligne par enfant et par rapport) -----------
create table presences (
  id uuid primary key default gen_random_uuid(),
  rapport_id uuid not null references rapports(id) on delete cascade,
  enfant_id uuid not null references enfants(id) on delete cascade,
  present boolean not null default false,
  unique (rapport_id, enfant_id)
);

-- ============================================================
-- FONCTIONS UTILITAIRES POUR LES POLICIES RLS
-- ============================================================
create or replace function current_ecole_id() returns uuid as $$
  select ecole_dimanche_id from utilisateurs where id = auth.uid()
$$ language sql security definer stable;

create or replace function current_role_app() returns text as $$
  select role from utilisateurs where id = auth.uid()
$$ language sql security definer stable;

create or replace function is_moniteur_de_classe(p_classe_id uuid) returns boolean as $$
  select exists (
    select 1 from classe_moniteurs
    where classe_id = p_classe_id and moniteur_id = auth.uid()
  )
$$ language sql security definer stable;

-- ============================================================
-- ACTIVATION RLS
-- ============================================================
alter table ecoles_dimanche enable row level security;
alter table utilisateurs enable row level security;
alter table classes enable row level security;
alter table classe_moniteurs enable row level security;
alter table enfants enable row level security;
alter table rapports enable row level security;
alter table presences enable row level security;

-- ---- ecoles_dimanche : lecture uniquement de sa propre école
create policy "voir sa propre ecole" on ecoles_dimanche
  for select using (id = current_ecole_id());

-- ---- utilisateurs : voir les membres de sa propre école
create policy "voir utilisateurs de son ecole" on utilisateurs
  for select using (ecole_dimanche_id = current_ecole_id());

create policy "directeur gere les moniteurs" on utilisateurs
  for all using (
    ecole_dimanche_id = current_ecole_id()
    and current_role_app() = 'directeur'
  );

-- ---- classes
create policy "voir classes de son ecole" on classes
  for select using (ecole_dimanche_id = current_ecole_id());

create policy "directeur gere les classes" on classes
  for insert with check (ecole_dimanche_id = current_ecole_id() and current_role_app() = 'directeur');

create policy "directeur modifie les classes" on classes
  for update using (ecole_dimanche_id = current_ecole_id() and current_role_app() = 'directeur');

-- ---- classe_moniteurs
create policy "voir affectations de son ecole" on classe_moniteurs
  for select using (
    exists (select 1 from classes c where c.id = classe_id and c.ecole_dimanche_id = current_ecole_id())
  );

create policy "directeur gere les affectations" on classe_moniteurs
  for all using (
    current_role_app() = 'directeur'
    and exists (select 1 from classes c where c.id = classe_id and c.ecole_dimanche_id = current_ecole_id())
  );

-- ---- enfants : directeur voit tout, moniteur voit ses classes
create policy "acces enfants" on enfants
  for select using (
    ecole_dimanche_id = current_ecole_id()
    and (current_role_app() = 'directeur' or is_moniteur_de_classe(classe_id))
  );

create policy "moniteur ajoute des enfants dans sa classe" on enfants
  for insert with check (
    ecole_dimanche_id = current_ecole_id()
    and (current_role_app() = 'directeur' or is_moniteur_de_classe(classe_id))
  );

create policy "modification enfants" on enfants
  for update using (
    ecole_dimanche_id = current_ecole_id()
    and (current_role_app() = 'directeur' or is_moniteur_de_classe(classe_id))
  );

-- ---- rapports
create policy "acces rapports" on rapports
  for select using (
    ecole_dimanche_id = current_ecole_id()
    and (current_role_app() = 'directeur' or is_moniteur_de_classe(classe_id))
  );

create policy "moniteur cree son rapport" on rapports
  for insert with check (
    ecole_dimanche_id = current_ecole_id()
    and is_moniteur_de_classe(classe_id)
    and moniteur_id = auth.uid()
  );

create policy "moniteur modifie son rapport" on rapports
  for update using (
    ecole_dimanche_id = current_ecole_id()
    and is_moniteur_de_classe(classe_id)
    and moniteur_id = auth.uid()
  );

-- ---- presences (héritent de l'accès au rapport parent)
create policy "acces presences" on presences
  for select using (
    exists (
      select 1 from rapports r
      where r.id = rapport_id
      and r.ecole_dimanche_id = current_ecole_id()
      and (current_role_app() = 'directeur' or is_moniteur_de_classe(r.classe_id))
    )
  );

create policy "moniteur renseigne les presences" on presences
  for all using (
    exists (
      select 1 from rapports r
      where r.id = rapport_id
      and r.ecole_dimanche_id = current_ecole_id()
      and is_moniteur_de_classe(r.classe_id)
    )
  );

-- ============================================================
-- CRÉATION AUTOMATIQUE DE LA LIGNE "utilisateurs" À L'INSCRIPTION
-- (déclenché après une invitation par email envoyée avec des
--  métadonnées : ecole_dimanche_id, role, nom, prenoms)
-- ============================================================
create or replace function handle_new_user() returns trigger as $$
begin
  if new.raw_user_meta_data->>'ecole_dimanche_id' is null then
    return new;
  end if;

  insert into utilisateurs (id, ecole_dimanche_id, role, nom, prenoms, email, whatsapp, lieu_habitation, bapteme_eau, bapteme_saint_esprit)
  values (
    new.id,
    (new.raw_user_meta_data->>'ecole_dimanche_id')::uuid,
    coalesce(new.raw_user_meta_data->>'role', 'moniteur'),
    coalesce(new.raw_user_meta_data->>'nom', ''),
    coalesce(new.raw_user_meta_data->>'prenoms', ''),
    new.email,
    new.raw_user_meta_data->>'whatsapp',
    new.raw_user_meta_data->>'lieu_habitation',
    coalesce((new.raw_user_meta_data->>'bapteme_eau')::boolean, false),
    coalesce((new.raw_user_meta_data->>'bapteme_saint_esprit')::boolean, false)
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
