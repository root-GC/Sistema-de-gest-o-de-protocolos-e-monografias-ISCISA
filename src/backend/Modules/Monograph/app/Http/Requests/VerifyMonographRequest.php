<?php

// Modules/Monograph/app/Http/Requests/VerifyMonographRequest.php
namespace Modules\Monograph\app\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class VerifyMonographRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('verifyDocuments', $this->route('monograph'));
    }

    public function rules(): array
    {
        return [
            'approved' => ['required', 'boolean'],
            'reason'   => ['required_if:approved,false', 'nullable', 'string', 'max:2000'],
            'role'     => ['required', 'in:secretary,coordinator'],
        ];
    }
}