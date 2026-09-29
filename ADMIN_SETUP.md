# Connexion administrateur avec Google

Tu n’as pas à créer un compte Firebase à la main ni à retenir un nouveau mot de passe. Active Google dans Firebase, puis connecte-toi avec ton compte Google habituel. Firebase crée automatiquement son identifiant technique lors de la première connexion. Le même compte fonctionne sur ton téléphone et tes deux PC.

## Configuration initiale

1. Dans Firebase Console, ouvre **Authentication → Sign-in method** et active **Google**. Choisis l’adresse d’assistance demandée par Firebase.
2. Dans **Authentication → Settings → Authorized domains**, vérifie que le domaine du site est autorisé. `localhost` est normalement déjà présent pour le développement local.
3. Copie `.env.example` vers `.env.local` et remplace `your-google-address@example.com` par l’adresse Google autorisée. Pour un site hébergé, configure la variable `VITE_ADMIN_EMAIL` dans les paramètres de build de l’hébergeur.
4. Dans `firestore.rules`, remplace `REPLACE_WITH_ADMIN_GOOGLE_EMAIL` par cette même adresse exacte, en minuscules.
5. Vérifie que les autres règles Firestore de ce projet sont incluses, puis déploie les règles depuis la racine du projet :

   ```sh
   firebase deploy --only firestore:rules
   ```

6. Redémarre le serveur local ou reconstruis le site hébergé pour charger `VITE_ADMIN_EMAIL`.

Les archives restent lisibles publiquement. Seule l’adresse Google vérifiée configurée dans les règles peut ajouter, modifier ou supprimer des sessions. Les autres chemins Firestore sont refusés par défaut par le fichier de règles fourni. Si ce projet Firebase contient d’autres collections ou sert à d’autres applications, fusionne leurs règles avant le déploiement.

## Connexion sur tes appareils

Ouvre **Administration**, puis choisis **Continuer avec Google** et sélectionne la même adresse sur chacun de tes appareils. La session reste enregistrée par Google/Firebase sur chaque appareil jusqu’à la déconnexion.
