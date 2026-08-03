<?php

// Modules/Monograph/app/Http/Requests/EndorseMonographRequest.php
namespace Modules\Monograph\app\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class EndorseMonographRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('endorse', $this->route('monograph'));
    }

    public function rules(): array
    {
        return [
            'approved' => ['required', 'boolean'],
            'reason'   => ['required_if:approved,false', 'nullable', 'string', 'max:2000'],
        ];
    }
}