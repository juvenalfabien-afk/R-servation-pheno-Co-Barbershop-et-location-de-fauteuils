# Déploiement PHENO&CO sur OVH VPS

## Pourquoi VPS et pas hébergement mutualisé ?

Ce projet utilise **Next.js avec des routes API et des cookies serveur** (`next/headers`).
Un hébergement mutualisé OVH ne supporte que PHP et les sites statiques — il ne peut pas
faire tourner un serveur Node.js permanent. Il faut donc un **VPS** (ou Cloud Web Node.js).

---

## Prérequis OVH

- Un **VPS OVH** (starter ou supérieur) sous Ubuntu 22.04 ou Debian 12
- Un nom de domaine pointé vers l'IP du VPS (enregistrement A dans la zone DNS OVH)
- Accès SSH root au VPS

---

## Étape 1 — Connexion SSH et mise à jour du serveur

```bash
ssh root@IP_DU_VPS
apt update && apt upgrade -y
```

---

## Étape 2 — Installer Node.js 20 LTS via nvm

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
node -v   # doit afficher v20.x.x
```

---

## Étape 3 — Installer PM2 (gestionnaire de processus)

```bash
npm install -g pm2
```

---

## Étape 4 — Installer Nginx (reverse proxy)

```bash
apt install nginx -y
systemctl enable nginx
systemctl start nginx
```

---

## Étape 5 — Uploader le projet sur le VPS

### Option A — via Git (recommandé)

```bash
# Sur le VPS
git clone https://github.com/TON_USER/TON_REPO.git /var/www/phenoandco
cd /var/www/phenoandco
```

### Option B — via FTP/SCP depuis ton PC

```bash
# Depuis ton PC Windows (PowerShell)
scp -r "C:\Pheno\R-servation-pheno-Co-Barbershop-et-location-de-fauteuils" root@IP_DU_VPS:/var/www/phenoandco
```

> Dans les deux cas, ne jamais uploader `node_modules/`, `.next/`, ou `.env.local`.

---

## Étape 6 — Créer le fichier .env.local sur le VPS

```bash
cd /var/www/phenoandco
nano .env.local
```

Colle et remplis avec tes vraies valeurs :

```env
SUPABASE_URL=https://enmziyvurukskadgtoxt.supabase.co
SUPABASE_SERVICE_ROLE_KEY=VOTRE_CLE_SERVICE_ROLE
ADMIN_PASSWORD=VOTRE_MOT_DE_PASSE_ADMIN
ADMIN_SECRET=VOTRE_SECRET_64_CARACTERES
```

Pour générer un ADMIN_SECRET :
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Étape 7 — Installer les dépendances et builder

```bash
cd /var/www/phenoandco
npm install
npm run build
```

> Le build lit `.env.local` et prépare l'application pour la production.

---

## Étape 8 — Lancer l'application avec PM2

```bash
cd /var/www/phenoandco
pm2 start ecosystem.config.js
pm2 save
pm2 startup   # copie-colle la commande affichée pour démarrer PM2 au reboot
```

Vérifier que ça tourne :
```bash
pm2 status
pm2 logs phenoandco
```

L'application écoute sur le port **3000** en local.

---

## Étape 9 — Configurer Nginx comme reverse proxy

```bash
nano /etc/nginx/sites-available/phenoandco
```

Colle cette configuration (remplace `ton-domaine.com`) :

```nginx
server {
    listen 80;
    server_name ton-domaine.com www.ton-domaine.com;

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Activer le site et recharger Nginx :
```bash
ln -s /etc/nginx/sites-available/phenoandco /etc/nginx/sites-enabled/
nginx -t          # vérifie la config
systemctl reload nginx
```

---

## Étape 10 — SSL gratuit avec Let's Encrypt

```bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d ton-domaine.com -d www.ton-domaine.com
```

Certbot modifie automatiquement la config Nginx pour HTTPS.
Le certificat se renouvelle automatiquement.

---

## Étape 11 — Vérifier Supabase

Avant de déployer, s'assurer que la table existe dans Supabase :
1. Aller sur supabase.com > ton projet > **SQL Editor**
2. Coller le contenu de `supabase/schema.sql` et cliquer **Run**

---

## Commandes utiles après déploiement

```bash
# Voir les logs en temps réel
pm2 logs phenoandco

# Redémarrer après une mise à jour du code
cd /var/www/phenoandco
git pull
npm install
npm run build
pm2 restart phenoandco

# Statut de l'application
pm2 status

# Redémarrer Nginx
systemctl reload nginx
```

---

## Résumé des variables d'environnement

| Variable | Côté | Description |
|---|---|---|
| `SUPABASE_URL` | Serveur uniquement | URL du projet Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Serveur uniquement | Clé admin Supabase (jamais exposée au client) |
| `ADMIN_PASSWORD` | Serveur uniquement | Mot de passe de la page /admin |
| `ADMIN_SECRET` | Serveur uniquement | Clé de signature des cookies de session |
| `NEXT_PUBLIC_EMAILJS_KEY` | Client (public) | Clé EmailJS — peut être publique |

> Toutes les variables sans préfixe `NEXT_PUBLIC_` sont **invisibles dans le navigateur**.

---

## Points bloquants éventuels

| Problème | Cause | Solution |
|---|---|---|
| Port 3000 inaccessible | Pare-feu OVH | Activer le port 3000 dans le Network Security Group OVH (pas nécessaire si Nginx est devant) |
| `npm run build` échoue | Variables manquantes | Vérifier que `.env.local` est bien présent sur le VPS |
| Cookies ne persistent pas | `secure: true` sans HTTPS | Mettre HTTPS en place (étape 10) avant de tester la connexion admin |
| Fonts Google lentes | Première requête réseau | Normal — Next.js les met en cache après le premier build |

---

## Architecture finale

```
Internet
    │
    ▼
Nginx (port 80/443) ──── SSL Let's Encrypt
    │
    ▼
Next.js via PM2 (port 3000, local uniquement)
    │
    ├── Routes API (/api/*)  ──── Supabase (cloud)
    └── Pages SSR            ──── Variables .env.local (serveur uniquement)
```
