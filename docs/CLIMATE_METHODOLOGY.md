# Méthodologie climat

## Normales

Périodes : 1961-1990, 1971-2000, 1981-2010, **1991-2020** (défaut configurable), plus périodes officielles futures.

Anomalie = valeur − normale **de la même variable, même grain, même source ou méthode déclarée**. Toujours citer la période.

Normale V1 affichable : au moins **24** années climatiques complètes dans la période (80 % de 30 ans). Défaut **1991-2020**. C’est la moyenne des **moyennes annuelles** des années complètes — pas une normale homogénéisée LSH. Si la station climatique de la commune n’atteint pas 24 ans sur 1991-2020, on n’invente pas la période : on l’indique, et on peut montrer la normale d’**un autre poste unique** sans l’appliquer en anomalie sur la première série.

Normale **mensuelle** V1 (`month-normal-1991-2020-v1`) : même période et même seuil **24**, mais par mois calendaire, à partir des `monthly_statistics` déjà calculées (mois complet ≥ 25 jours). Les 12 mois doivent chacun atteindre 24 mois complets pour afficher le profil. LVD Grenoble n’a que 21–22 mois complets sur 1991-2020 → profil **CHATTE_SAPC**, sans anomalie sur LVD. Ce n’est pas la normale officielle Météo-France.

Records d’année : parmi les années climatiques de **cette** station (période de la série). Record observé ≠ maximum ERA5 de cellule.

## Agrégats

- Quotidien : respecter le jour source (MF UTC métropole). Ne pas reconstruire Tmin/Tmax horaires sans doc source.
- Mensuel : Tmin/Tmax/Tmoy moyennes, RR, jours de pluie, seuils 25/30/35/40 °C, gel, nuits tropicales — **si la donnée existe**. Mois complet V1 = au moins **25** jours de Tmin **et** Tmax connus. Pluie mensuelle stockée seulement si ≥ 25 jours de précipitation connus (sinon `NULL`, jamais 0).
- Saisonnier : saisons météorologiques **nord** pour la V1 France (DJF / MAM / JJA / SON). L’hiver DJF est étiqueté par l’année de janvier (décembre compte pour l’hiver suivant). Saison complète V1 = au moins **75** jours de Tmin **et** Tmax connus. Pluie saisonnière : même seuil, sinon `NULL`.
- Annuel : année complète V1 = au moins **330** jours de Tmin **et** Tmax. Pluie annuelle : `NULL` si < 330 jours connus.
- UI mois : mêmes seuils. Records de mois = mois complets d’**un** poste. Normale mensuelle 1991-2020 : moyenne des mois complets, ≥ 24 par calendrier, un seul poste ; pas d’anomalie croisée. Un mois incomplet n’est pas tracé comme 0.
- UI saisons : DJF / MAM / JJA / SON à l’écran, **un** poste, saisons complètes seulement. On ne compare pas un hiver à un été.
- Une page vue ne calcule pas ces agrégats (`npm run stats:compute` seulement).
- Tendances **avec méthode** (pas une pente unique silencieuse). « Quand j’étais enfant » = moyenne des **maximales/minimales annuelles** d’années complètes, fenêtres sans chevauchement — ce n’est pas une température quotidienne d’enfance ni une expertise certifiée.

## Records

Record **observé** (station) ≠ maximum **ERA5** de cellule. Classements séparés, source sur chaque record.

Outlier : flag. Un record réel peut paraître aberrant. Pas de suppression silencieuse.

## Ce jour dans l’histoire

Un **seul** poste (la station du jour). Tous les mêmes jour-mois observés.

- Moyenne Tmin / Tmax et percentile Tmax seulement si **≥ 5** valeurs **connues**. Un trou n’est pas 0.
- Records = min Tmin / max Tmax de ces jours, à cette station.
- Ce n’est **pas** une normale climatique 1991-2020.

Preuve Grenoble 12 mai (CORENC, n=8) : moyenne 7,3 / 21,6 °C ; 1983 plus chaud que 50 % ; records 5,1 °C (1982) / 32,1 °C (1986).

## Épisodes de forte chaleur

Méthode V1 : `heat-streak-tmax-v1`.

- Un **seul** poste (la station climatique de la commune).
- Épisode = au moins **3** jours calendaires consécutifs avec une Tmax **mesurée** ≥ 30 °C (mêmes règles à 35 °C et 40 °C).
- Un trou ou une Tmax manquante **coupe** l’épisode. On n’invente pas le jour manquant.
- Ce n’est **pas** la canicule officielle Météo-France (seuils départementaux de Tmin **et** Tmax). Pas d’ERA5 dans ce classement.

## Comparaison point ERA5 (sans fusion)

Preuve V1 : Grenoble 45,1885 / 5,7245, **1983-05-12**.

- Observation : station **CORENC LA REVIREE** (`38126001`), 6,6 / 21,6 °C, **0,1 mm**.
- Réanalyse : maille la plus proche **45,25°N, 5,75°E**, 24 heures UTC. `2m_temperature` min/max → 3,4 / 14,2 °C. Point de rosée `2m_dewpoint_temperature` min/max → **2,0 / 6,9 °C**. Pluie `total_precipitation` : somme des 24 pas horaires ARCO (**0,00032344 m** → **0,3 mm**). Ce n’est **pas** le Tmin/Tmax/Td d’abri ni un pluviomètre.
- Écart = estimation − mesure (2t seulement dans le bandeau) : Tmin **−3,2 °C**, Tmax **−7,4 °C**. Pluie : **+0,2 mm** (0,3 − 0,1), seulement dans « En savoir plus ». Affiché, **pas fusionné**, pas corrigé par un gradient. Rosée et pluie ERA5 n’entrent pas dans le JSON-LD.
- `method_version` point : `era5-point-nearest-hourly-2t-d2m-tp-v1`. Quotidien France un jour : `era5-france-daily-2t-minmax-v1` (JSON, pas SQL). Version jeu : ERA5 finale (1983).
- ERA5 assimile des observations : elle **n’augmente pas** le score de confiance comme une source indépendante. Un |ΔTmax| > 2 °C n’ajoute pas de bonus de cohérence.
- Bbox France à l’extracteur. Un jour 2t quotidien bbox France (2709 mailles) est stocké en JSON ; pas l’archive 1940–2026, pas ERA5-Land, pas de grille mondiale en base. Chunks ARCO = 1 h × globe : le quotidien un jour ne réduit pas le téléchargement horaire mondial, seulement le stockage.

## Tendance « ma ville se réchauffe ? »

Méthode V1 documentée : `ols-complete-years-v1`.

- Un **seul** poste (la station climatique de la commune). Pas de concaténation.
- Années climatiques seulement (≥ 330 jours de Tmin et Tmax). Une année incomplète n’entre pas dans la pente.
- Régression linéaire (moindres carrés) des moyennes annuelles ou des compteurs ; pente affichée en **°C ou jours par 10 ans**.
- Seuil : **15** années climatiques. En dessous : pas de pente.
- Fenêtre simple : **10** premières vs **10** dernières années climatiques, **sans chevauchement**.
- Série **brute**, pas LSH. Moins de 30 ans = série courte, pas une climatologie classique.
- Gel = jours à Tmin < 0 °C. Nuit tropicale = Tmin ≥ 20 °C. Un trou n’est pas zéro.
- Ce n’est **pas** une expertise certifiée, ni la tendance de la commune entière.

## Indice « France » du prototype

Moyenne arithmétique des stations **importées**. Ce n’est **pas** l’indicateur national Météo-France. À ne pas promouvoir comme climat officiel.
