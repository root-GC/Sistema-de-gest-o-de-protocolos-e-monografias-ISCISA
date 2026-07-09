<?php

return [

    'paths' => [
        'api/*',
        'sanctum/csrf-cookie',
    ],

    'allowed_methods' => [
        '*',
    ],

    'allowed_origins' => [
        'https://iscisamonografias.vercel.app',
    ],

    'allowed_headers' => [
        '*',
    ],

    'supports_credentials' => true,

];