<?php

namespace Modules\Protocol\app\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DecideEvaluationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'decision' => 'required|string|in:approved,not_approved',
            'conclusion_summary' => 'nullable|string|max:5000',
        ];
    }
}
