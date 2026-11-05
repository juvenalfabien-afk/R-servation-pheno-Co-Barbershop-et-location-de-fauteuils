# PHENO&CO — réservation et location de fauteuils

Application Next.js du salon PHENO&CO : réservation de rendez-vous individuels ou groupés, demandes de location de fauteuil, espace client, planning et tableau de bord administrateur.

## Technologies

- Next.js 15, React 19 et TypeScript
- PostgreSQL et Supabase (accès serveur uniquement avec la service role)
- Resend pour les e-mails transactionnels
- Twilio pour les SMS transactionnels
- Vitest, ESLint et TypeScript pour la validation
- Déploiement prévu sur Netlify

## Prérequis et installation locale

- Node.js `>=20.19 <21` ou `>=22.12`
- npm
- Un projet Supabase isolé pour le développement

Ne connectez jamais un poste de développement ou la suite de tests à la base de production.

```bash
npm ci
npm run validate:env
npm run dev
```

Créez `.env.local` depuis votre gestionnaire de secrets. Ce fichier ne doit pas être commité.

## Variables d’environnement

Les éléments ci-dessous sont des noms de variables, pas des valeurs utilisables.

| Variable | Obligatoire | Usage |
|---|---:|---|
| `SUPABASE_URL` | oui | URL HTTPS du projet Supabase isolé |
| `SUPABASE_SERVICE_ROLE_KEY` | oui | Clé serveur, jamais exposée au navigateur |
| `ADMIN_PASSWORD` | oui | Mot de passe administrateur |
| `ADMIN_SECRET` | oui | Signature des sessions admin, 32 caractères minimum |
| `ADMIN_SESSION_VERSION` | oui | Entier positif invalidant les anciennes sessions |
| `RATE_LIMIT_SECRET` | oui | Secret distinct du rate limiting distribué |
| `MARKETING_UNSUBSCRIBE_SECRET` | oui | Signature des liens de désinscription |
| `CRON_SECRET` | oui | Authentification Bearer des tâches planifiées |
| `RESEND_API_KEY` | oui | Clé Resend au format `re_…` |
| `EMAIL_FROM` | oui | Expéditeur vérifié par Resend |
| `NEXT_PUBLIC_SITE_URL` | oui | URL HTTPS publique |
| `HOSTING_PLATFORM` | oui | `none`, `netlify`, `vercel` ou `cloudflare` |
| `TRUST_PROXY` | oui | `true` uniquement derrière le proxy déclaré |
| `NOTIFICATION_TIMEOUT_MS` | non | Timeout de 1 000 à 30 000 ms (8 000 par défaut) |
| `BOOKING_MIN_LEAD_MINUTES` | non | Délai minimal avant un rendez-vous |
| `TWILIO_ACCOUNT_SID` | non | SID Twilio ; les trois variables vont ensemble |
| `TWILIO_AUTH_TOKEN` | non | Jeton Twilio |
| `TWILIO_FROM_NUMBER` | non | Numéro E.164 autorisé par Twilio |

`HOSTING_PLATFORM=netlify` autorise uniquement l’en-tête IP produit par Netlify ; utilisez alors `TRUST_PROXY=false`. `TRUST_PROXY=true` est réservé à un proxy auto-hébergé qui supprime l’en-tête entrant et le réécrit lui-même. En production, une identité sans source IP approuvée est refusée.

`npm run validate:env` contrôle formats, longueurs et séparation des secrets sans afficher leurs valeurs.

## Configuration Supabase

Sur une nouvelle base isolée :

1. Appliquer `supabase/schema.sql`.
2. Appliquer les migrations dans l’ordre : `002_clients.sql`, `003_security_hardening.sql`, `004_phone_and_client_search_fixes.sql`, `005_reliable_deliveries_and_idempotency.sql`, puis `006_notification_outbox.sql`.
3. Exécuter les tests de `supabase/tests` sur cette base isolée.
4. Vérifier les politiques RLS et les droits `service_role`.

Les migrations ne sont jamais lancées automatiquement sur la production. La migration 006 ajoute l’outbox `notification_jobs`, les claims avec lease et les triggers transactionnels.

### Seeds

`supabase/seeds.sql` ne contient que des contacts `example.test` et des numéros manifestement fictifs. Le script refuse toute cible non explicitement isolée :

```sql
set pheno.environment = 'development';
\i supabase/seeds.sql
```

Les cibles autorisées sont `development`, `staging` et `test`. Le mode seed désactive les triggers de notifications. Le script est transactionnel et réexécutable avec `ON CONFLICT`. Ne définissez jamais ce paramètre sur la production.

## Notifications

### Resend

Vérifier le domaine et l’expéditeur de `EMAIL_FROM`, utiliser une clé dédiée par environnement et restreindre le staging à des destinataires contrôlés. Les e-mails utilisent des clés d’idempotence. Un succès n’est enregistré qu’après une réponse positive du fournisseur.

### Twilio

Configurer ensemble les trois variables Twilio. Sans elles, les SMS sont désactivés de manière contrôlée. Un timeout est marqué `uncertain` et n’est pas rejoué automatiquement, car la création d’un message Twilio ne garantit pas l’idempotence.

### Outbox et cron

Après la migration 006, chaque réservation crée un job dans la même transaction PostgreSQL. Planifier toutes les cinq minutes :

```text
POST /api/cron/notifications
Authorization: Bearer <CRON_SECRET>
```

Le worker utilise des claims atomiques, leases, retries avec backoff et les états `pending`, `processing`, `sent`, `failed`, `uncertain`. `/api/cron/reminders` gère séparément les rappels.

Une réservation déjà insérée reste confirmée même si Resend ou Twilio est lent ou indisponible. L’état des notifications est suivi séparément et repris par l’outbox lorsque cela est techniquement sûr.

## Scripts npm

| Commande | Description |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build Next.js de production |
| `npm start` | Démarrage précédé de la validation d’environnement |
| `npm run typecheck` | Vérification TypeScript |
| `npm run lint` | ESLint sans avertissement autorisé |
| `npm test` | Suite Vitest complète |
| `npm run test:watch` | Vitest en mode watch |
| `npm run validate:env` | Validation stricte de la configuration |
| `npm run audit:secrets` | Audit des secrets |
| `npm run check` | TypeScript, ESLint, tests et build |

## Tests et CI

Vitest couvre les routes, l’authentification, le rate limiting distribué, les claims concurrents, les timeouts, les migrations, les seeds et la confidentialité. Les tests utilisent des mocks et des identifiants non opérationnels ; ils ne doivent contacter ni Supabase, ni Resend, ni Twilio.

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm audit --omit=dev
npm audit
npm run audit:secrets
```

`.github/workflows/ci.yml` valide l’environnement avec des identifiants fictifs bien formés, puis exécute TypeScript, ESLint, Vitest, le build, l’audit des secrets et l’audit des dépendances. Une réussite locale ne prouve pas la réussite GitHub distante : vérifier GitHub Actions avant production.

Les tests PostgreSQL nécessitent un conteneur ou un projet Supabase local explicitement isolé.

## Netlify et tâches planifiées

- Utiliser une version Node compatible avec `package.json`.
- Déclarer les secrets dans Netlify, jamais dans le dépôt.
- Définir `HOSTING_PLATFORM=netlify` et `TRUST_PROXY=false` sur Netlify.
- Planifier `/api/cron/notifications` toutes les cinq minutes et `/api/cron/reminders` selon la fréquence métier.
- Superviser les erreurs et le volume des jobs en attente.

Le wrapper `netlify/functions/notifications-cron.mjs` exécute ce planning sur les déploiements publiés. Les crons Netlify utilisent UTC, ne s’exécutent pas automatiquement sur les Deploy Previews et sont limités à 30 secondes. Le wrapper abandonne à 25 secondes ; les leases permettent au passage suivant de reprendre un job interrompu.

Une promesse lancée après une réponse HTTP n’est pas une garantie d’exécution serverless. Les appels fournisseurs ont donc un timeout et le travail fiable est repris par l’outbox persistante. La fonction planifiée ne transmet aucune donnée client : elle appelle seulement le endpoint interne avec `CRON_SECRET`.

## Déploiement

1. Sauvegarder la base et vérifier une restauration isolée.
2. Appliquer les migrations en staging dans l’ordre.
3. Exécuter les contrôles npm et tests SQL isolés.
4. Tester Resend, Twilio et les crons avec des destinataires contrôlés.
5. Appliquer les migrations de production pendant une fenêtre prévue.
6. Déployer l’application.
7. Vérifier les logs, jobs en attente et parcours de réservation.

Le déploiement du code et les migrations sont deux opérations séparées. Ne jamais utiliser les seeds en production.

## Sauvegarde, restauration et rollback

Avant toute migration : sauvegarder PostgreSQL, vérifier que la sauvegarde est restaurable, relever les compteurs de réservations/jobs et suspendre le cron si le rollback touche l’outbox.

Les procédures de rollback sont placées près des migrations : `003_security_hardening.rollback.md`, `005_reliable_deliveries_and_idempotency.rollback.md` et `006_notification_outbox.rollback.md`.

Pour la migration 006, arrêter le cron et exporter les jobs non terminés. Son rollback supprime l’outbox et ferait perdre les jobs restants.

## Confidentialité

La mémorisation des coordonnées est facultative, désactivée par défaut et limitée à 30 jours sur l’appareil. Les anciens enregistrements sans preuve de consentement sont supprimés. Le formulaire permet l’effacement immédiat. L’API publique de planning ne divulgue jamais les motifs internes de fermeture.

## Résolution des problèmes

### `validate:env` échoue

Vérifier uniquement les noms signalés, leur format, longueur et unicité. Ne jamais copier une valeur secrète dans un ticket ou un log.

### Une réservation existe mais aucune notification ne part

Vérifier les migrations 005/006, le cron, les jobs `pending/failed/uncertain`, puis les fournisseurs. Ne jamais passer manuellement un job à `sent` sans preuve fournisseur.

### Des jobs restent `processing`

Vérifier le cron et les erreurs de finalisation. Les leases expirées sont récupérables automatiquement. Toujours passer par la RPC de claim.

### Le rate limiting refuse les requêtes en production

C’est le comportement attendu si Supabase ou `RATE_LIMIT_SECRET` est indisponible. Restaurer le service ou la configuration ; ne pas activer de fallback mémoire en production.

### Un SMS est `uncertain`

Contrôler le SID et les logs Twilio avant toute relance manuelle. Une relance aveugle peut produire un doublon.

### Build Windows verrouillé

Arrêter les processus Next.js utilisant le même dossier `.next`, puis relancer le build. Ne pas supprimer de changements utilisateur pour contourner le verrou.
