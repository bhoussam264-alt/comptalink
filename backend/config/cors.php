<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Configuration CORS (Cross-Origin Resource Sharing)
    |--------------------------------------------------------------------------
    | Autorise le frontend (Vite sur http://localhost:5173) à consommer l'API.
    | En développement, 'allowed_origins' = ['*'] couvre tous les ports locaux.
    | L'authentification se fait par token Bearer (Sanctum), donc 'supports_credentials'
    | reste désactivé.
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => ['*'],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,

];
