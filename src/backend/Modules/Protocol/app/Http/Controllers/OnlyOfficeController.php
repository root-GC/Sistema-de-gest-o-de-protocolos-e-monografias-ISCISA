<?php

namespace Modules\Protocol\app\Http\Controllers;

use App\Http\Controllers\Controller;
use Firebase\JWT\JWT;
use Illuminate\Support\Facades\Log;
class OnlyOfficeController extends Controller
{
    public function config()
    {
        $config = [
            "documentType" => "word",

            "document" => [
                "title" => "teste.docx",
                "fileType" => "docx",
                "key" => "teste_001",
                "url" => env('ONLYOFFICE_DOCUMENT_URL') . "/storage/documents/teste.docx"
            ],

            "editorConfig" => [
                "callbackUrl" => env('ONLYOFFICE_DOCUMENT_URL') . "/api/protocolo/onlyoffice/callback"
            ]
        ];

        $token = JWT::encode(
            $config,
            env('ONLYOFFICE_JWT_SECRET'),
            'HS256'
        );

        return response()->json([
            'config' => $config,
            'token' => $token
        ]);
    }

    public function callback()
{
    $data = request()->all();

    Log::info('OnlyOffice callback:', $data);

    return response()->json([
        'error' => 0
    ]);
}
}