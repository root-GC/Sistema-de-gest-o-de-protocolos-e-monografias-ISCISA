<?php

// Modules/Monograph/app/Http/Requests/SubmitMonographRequest.php
namespace Modules\Monograph\app\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SubmitMonographRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('submit', $this->route('monograph'));
    }

    public function rules(): array
    {
        return ['file' => ['required', 'file', 'mimes:pdf', 'max:20480']];
    }
}