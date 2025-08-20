## Note au correcteur

Bonjour,

Concernant vos remarques :

1. **Architecture du middleware d'authentification** : Même si le middleware d'authentification (`/middlewares/auth.js`) n'assigne que l'objet décodé du JWT à `req.user` (qui contient uniquement `userId`), vous pouvez constater dans les méthodes `update` et `delete` du contrôleur des articles (`/api/articles/articles.controller.js` lignes 48 et 72) que nous récupérons explicitement les informations complètes de l'utilisateur via `User.findById(req.user.userId)` avant de vérifier son rôle. Cette approche est volontaire et permet de s'assurer que les données utilisateur sont toujours à jour lors des opérations critiques.

2. **Tests** : Tous les tests passent de mon côté (15 tests au total). Cela suggère qu'il y ait une différence d'environnement ou de configuration entre nos setups respectifs.

![Résultat des tests](/tests_result.png)

Cordialement,

Flavien GAUJARD
