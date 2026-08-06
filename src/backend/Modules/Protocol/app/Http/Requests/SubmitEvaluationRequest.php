<?php

namespace Modules\Protocol\app\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SubmitEvaluationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'decision' => 'required|string|in:approved,not_approved',
            'overall_comment' => 'nullable|string|max:5000',
        ];
    }
}
