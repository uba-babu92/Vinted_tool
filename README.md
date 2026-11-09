# Colis Vinted

Appli : https://uba-babu92.github.io/Vinted_tool/

1. **Photos** : glisse les photos de l'article. L'appli fait 3 photos fond blanc et 3 photos portées (Gemini), plus la description (Groq).
2. **Ventes** : tes ventes arrivent toutes seules depuis tes mails Vinted, avec le statut, le numéro du colis et la compta.
3. **Bordereaux** : les bordereaux reçus par mail sont tamponnés avec la photo, le numéro et le pseudo de l'acheteur.

## Brancher Gmail (une seule fois, 3 minutes)

1. Va sur https://script.google.com et clique sur **Nouveau projet**.
2. Efface tout et colle le contenu de `apps-script/Code.gs`.
3. Clique sur **Déployer**, puis **Nouveau déploiement**.
4. Type : **Application Web**. Exécuter en tant que : **Moi**. Accès : **Tout le monde**.
5. Clique sur **Déployer** et autorise l'accès à Gmail.
6. Copie le lien qui finit par `/exec` et colle-le dans ⚙️ de l'appli.

Garde ce lien pour toi : il donne accès à tes ventes Vinted.

## Clés

- Gemini : https://aistudio.google.com/apikey
- Groq : https://console.groq.com/keys

Les clés restent sur ton téléphone. Elles ne sont jamais envoyées ailleurs que chez Google et Groq.
