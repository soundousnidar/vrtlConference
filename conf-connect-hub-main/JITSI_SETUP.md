# Configuration Jitsi Meet pour VRTL Conference

## 🎯 Vue d'ensemble

Ce projet utilise **Jitsi Meet** pour le streaming live des conférences. Jitsi Meet est une solution open-source gratuite qui ne nécessite pas de carte de crédit.

## 🚀 Avantages de Jitsi Meet

- ✅ **100% gratuit** - Pas de limite de temps ou de participants
- ✅ **Open source** - Contrôle total sur vos données
- ✅ **Sans inscription** - Les participants rejoignent directement
- ✅ **Fonctionnalités complètes** - Chat, partage d'écran, enregistrement
- ✅ **Interface en français** - Support multilingue intégré

## 🔧 Configuration

### 1. **Aucune configuration requise !**

Jitsi Meet utilise le serveur public `meet.jit.si` qui est automatiquement disponible.

### 2. **URLs des rooms**

Les rooms sont générées automatiquement selon le format :
```
https://meet.jit.si/vrtlconf-conference-{ID}
```

Exemple :
- Conférence ID 1 → `https://meet.jit.si/vrtlconf-conference-1`
- Conférence ID 5 → `https://meet.jit.si/vrtlconf-conference-5`

### 3. **Fonctionnalités disponibles**

#### Pour tous les participants :
- 🎥 Vidéo et audio en temps réel
- 💬 Chat textuel intégré
- 📺 Partage d'écran
- ✋ Lever la main
- 🎤 Contrôle audio/vidéo
- 📱 Interface responsive

#### Pour les modérateurs :
- 👥 Gestion des participants
- 🔇 Mute/Unmute participants
- 🚫 Expulser des participants
- 📹 Contrôle des caméras
- 🔒 Verrouiller la room

## 🧪 Test en local

### Test solo :
1. Lance ton application
2. Va sur une page de conférence (ex: `/conferences/1`)
3. Clique sur "🎥 Rejoindre la session live"
4. Autorise la webcam/microphone
5. Tu es connecté à la room Jitsi !

### Test multi-participants :
1. Ouvre un autre onglet (ou navigateur différent)
2. Va sur la même URL `/conferences/1/live`
3. Tu verras les deux participants dans la room

## 🎨 Personnalisation

### Interface Jitsi
L'interface est configurée pour :
- Masquer les watermarks Jitsi
- Afficher le nom de la conférence
- Interface en français
- Barre d'outils complète

### Intégration avec ton app
- Le nom d'utilisateur est automatiquement transmis
- Le QAPanel guide vers les fonctionnalités Jitsi
- Bouton "Quitter" intégré

## 🔒 Sécurité

### Rooms publiques vs privées
- **Actuellement** : Rooms publiques (accessible à tous)
- **Pour la production** : Ajouter une authentification

### Options de sécurisation :
1. **Mot de passe** : Ajouter un mot de passe à la room
2. **Authentification** : Vérifier l'inscription à la conférence
3. **Modération** : Contrôle des participants

## 📱 Mobile

Jitsi Meet fonctionne parfaitement sur mobile :
- Interface responsive automatique
- Applications iOS/Android disponibles
- Même URL, même fonctionnalités

## 🆚 Comparaison avec Daily.co

| Fonctionnalité | Jitsi Meet | Daily.co |
|----------------|------------|----------|
| **Coût** | Gratuit | Payant après 40min |
| **Limite participants** | Illimitée | Limite selon le plan |
| **Configuration** | Aucune | Dashboard requis |
| **Open source** | ✅ | ❌ |
| **Fonctionnalités** | Complètes | Complètes |
| **Support** | Communauté | Support officiel |

## 🚀 Déploiement

Aucune configuration spéciale requise pour le déploiement. Jitsi Meet fonctionne immédiatement en production.

## 📞 Support

- **Documentation Jitsi** : https://jitsi.github.io/handbook/
- **API Reference** : https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-iframe
- **Communauté** : https://community.jitsi.org/

---

**Note** : Cette configuration est prête à l'emploi. Aucune modification supplémentaire n'est nécessaire pour commencer à utiliser Jitsi Meet dans ton application ! 