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
        'http://localhost:5173'
    ],

    'allowed_headers' => [
        '*',
    ],

    'supports_credentials' => true,

];