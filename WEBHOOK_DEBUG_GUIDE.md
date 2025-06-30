# Guide de Diagnostic - Webhook Stripe et Statut d'Inscription

## 🚨 Problème
Le statut d'inscription reste "pending" après paiement Stripe réussi.

## 🔍 Diagnostic Automatique

### 1. Vérifier les Logs du Backend
```bash
# Dans le terminal où tourne votre FastAPI
# Cherchez ces messages après un paiement :
✅ Webhook received: checkout.session.completed
💰 Payment completed - Registration ID: X, User ID: Y, Amount: Z
📝 Updating registration X from 'pending' to 'paid'
✅ Registration X updated successfully
✅ Payment record created for user Y, conference Z
```

### 2. Tester le Webhook Localement
```bash
# Installer Stripe CLI
# Windows: https://stripe.com/docs/stripe-cli#install
# Ou via scoop: scoop install stripe

# Lancer l'écoute des webhooks
stripe listen --forward-to http://localhost:8001/payments/webhook

# Dans un autre terminal, faire un paiement test
stripe trigger checkout.session.completed
```

### 3. Vérifier la Configuration
```bash
# Vérifier que la variable d'environnement est définie
echo $STRIPE_WEBHOOK_SECRET

# Ou dans PowerShell
echo $env:STRIPE_WEBHOOK_SECRET
```

### 4. Tester l'API Manuellement
```bash
# Utiliser le script de test
python test_webhook.py
```

## 🛠️ Solutions

### Solution 1: Vérifier le Webhook Secret
1. Aller sur [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Trouver votre webhook endpoint
3. Copier le "Signing secret"
4. Mettre à jour votre variable d'environnement :
   ```bash
   export STRIPE_WEBHOOK_SECRET="whsec_votre_secret_ici"
   ```

### Solution 2: Vérifier l'URL du Webhook
- L'URL doit être : `http://localhost:8001/payments/webhook`
- Vérifier que le port 8001 est correct
- Vérifier que le backend est accessible

### Solution 3: Rafraîchir le Frontend
- Après paiement, cliquer sur "Actualiser" dans l'onglet "Inscriptions"
- Ou recharger la page complètement

### Solution 4: Vérifier la Base de Données
```sql
-- Vérifier le statut des inscriptions
SELECT id, user_id, conference_id, status, updated_at 
FROM registrations 
WHERE user_id = [votre_user_id];

-- Vérifier les paiements
SELECT * FROM payments 
WHERE user_id = [votre_user_id] 
ORDER BY paid_at DESC;
```

## 🔧 Corrections Apportées

### 1. Frontend - UserProfile.tsx
- ✅ Ajout d'un bouton "Actualiser" pour forcer le rafraîchissement
- ✅ Amélioration de l'affichage du statut "pending" avec icône ⏳
- ✅ Fonction de rafraîchissement automatique des données

### 2. Frontend - ConferenceDetails.tsx
- ✅ Rafraîchissement automatique du statut après paiement réussi
- ✅ Amélioration de l'affichage du statut avec traductions

### 3. Backend - payment.py
- ✅ Ajout de logs détaillés pour le debugging
- ✅ Messages clairs pour chaque étape du processus

## 📋 Checklist de Vérification

- [ ] Le webhook Stripe est configuré avec la bonne URL
- [ ] Le webhook secret est correct dans les variables d'environnement
- [ ] Le backend FastAPI tourne sur le port 8001
- [ ] Les logs du backend montrent les messages de succès
- [ ] La base de données est mise à jour (vérifier avec SQL)
- [ ] Le frontend rafraîchit les données après paiement
- [ ] Le bouton "Actualiser" fonctionne dans le profil utilisateur

## 🚀 Test Rapide

1. **Faire un paiement test**
2. **Vérifier les logs du backend** - chercher les messages ✅
3. **Cliquer sur "Actualiser"** dans l'onglet Inscriptions
4. **Vérifier que le statut passe de "En attente" à "Payé"**

## 📞 Si le Problème Persiste

1. Vérifier que Stripe CLI est installé et configuré
2. Lancer `stripe listen` et faire un paiement test
3. Vérifier les logs du backend pour les erreurs
4. Utiliser le script `test_webhook.py` pour diagnostiquer
5. Vérifier la base de données directement

## 🔗 Liens Utiles

- [Stripe CLI Installation](https://stripe.com/docs/stripe-cli#install)
- [Stripe Webhooks Documentation](https://stripe.com/docs/webhooks)
- [Stripe Dashboard - Webhooks](https://dashboard.stripe.com/webhooks) 