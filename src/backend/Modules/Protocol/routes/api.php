<?php

use Illuminate\Support\Facades\Route;
use Modules\Protocol\app\Http\Controllers\TopicController;
use Modules\Protocol\app\Http\Controllers\EvaluationFormController;
use Modules\Protocol\app\Http\Controllers\OnlyOfficeController;


Route::prefix('api')->middleware(['api'])->group(function () {
  
    Route::get('/onlyoffice/config',
        [OnlyOfficeController::class, 'config']
    );
    Route::post('/protocolo/onlyoffice/callback',
    [OnlyOfficeController::class, 'callback']
);
});


Route::prefix('api/v1')->middleware(['api', 'auth:sanctum'])->group(function () {
    Route::post('topics', [TopicController::class, 'store'])->name('topic.store');
    Route::get('topics', [TopicController::class, 'index'])->name('topic.index');

    Route::patch('topics/{topic}/supervisor-approve', [TopicController::class, 'approveBySupervisor'])->name('topic.approve');
    Route::patch('topics/{topic}/supervisor-reject', [TopicController::class, 'rejectBySupervisor'])->name('topic.reject');
    Route::get('supervisor/topics', [TopicController::class, 'getForSupervisor'])->name('supervisor.topics.list');

    // Secretary operations: list topics for assignment, get eligible reviewers, assign reviewers
    Route::get('secretary/topics', [TopicController::class, 'getForSecretary'])->name('secretary.topics.list');
    Route::get('topics/{topic}/eligible-reviewers', [TopicController::class, 'getEligibleReviewers'])->name('topic.eligible-reviewers');
    Route::post('topics/{topic}/assign-reviewers', [TopicController::class, 'assignReviewers'])->name('topic.assign-reviewers');
    Route::get('reviewer/topics', [TopicController::class, 'getForReviewer'])->name('reviewer.topics.list');
    Route::get('topics/{topic}/comments', [TopicController::class, 'getComments'])->name('topic.comments.index');
    Route::post('topics/{topic}/comments', [TopicController::class, 'submitComment'])->name('topic.comments.store');
    Route::post('topics/{topic}/evaluations', [TopicController::class, 'submitEvaluation'])->name('topic.evaluations.store');

    Route::post('protocols', 'Modules\\Protocol\\app\\Http\\Controllers\\ProtocolApiController@store')->name('protocol.store');
    Route::get('protocols', 'Modules\\Protocol\\app\\Http\\Controllers\\ProtocolApiController@index')->name('protocol.index');
    Route::get('protocols/{protocol}', 'Modules\\Protocol\\app\\Http\\Controllers\\ProtocolApiController@show')->name('protocol.show');
    Route::patch('protocols/{protocol}/supervisor-approve', 'Modules\\Protocol\\app\\Http\\Controllers\\ProtocolApiController@approveBySupervisor')->name('protocol.supervisor-approve');
    Route::patch('protocols/{protocol}/supervisor-reject', 'Modules\\Protocol\\app\\Http\\Controllers\\ProtocolApiController@rejectBySupervisor')->name('protocol.supervisor-reject');

    // Secretary operations: list protocols for nucleus, get eligible reviewers, assign reviewers
    Route::get('secretary/protocols', 'Modules\\Protocol\\app\\Http\\Controllers\\ProtocolApiController@getForSecretary')->name('secretary.protocols.list');
    Route::get('protocols/{protocol}/eligible-reviewers', 'Modules\\Protocol\\app\\Http\\Controllers\\ProtocolApiController@getEligibleReviewers')->name('protocol.eligible-reviewers');
    Route::post('protocols/{protocol}/assign-reviewers', 'Modules\\Protocol\\app\\Http\\Controllers\\ProtocolApiController@assignReviewers')->name('protocol.assign-reviewers');

    // Reviewer operations: list assigned protocols for evaluation
    Route::get('reviewer/protocols', 'Modules\\Protocol\\app\\Http\\Controllers\\ProtocolApiController@getForReviewer')->name('reviewer.protocols.list');

    // Evaluation forms
    Route::get('evaluation-forms/{form}', [EvaluationFormController::class, 'show'])->name('evaluation-forms.show');
    Route::post('evaluation-forms/{form}/criteria/{formCriterion}/review', [EvaluationFormController::class, 'saveCriterionReview'])->name('evaluation-forms.criteria.review');
    Route::post('evaluation-forms/{form}/submit', [EvaluationFormController::class, 'submit'])->name('evaluation-forms.submit');
    Route::post('evaluation-forms/{form}/decide', [EvaluationFormController::class, 'decide'])->name('evaluation-forms.decide');
    Route::get('reviewer/evaluations', [EvaluationFormController::class, 'getForReviewer'])->name('reviewer.evaluations.list');
    Route::get('secretary/evaluations', [EvaluationFormController::class, 'getForSecretary'])->name('secretary.evaluations.list');

    // Opinions (pareceres)
    Route::get('opinions/{opinion}/download', [EvaluationFormController::class, 'downloadOpinion'])->name('opinions.download');
    Route::get('protocols/{protocol}/opinions', [EvaluationFormController::class, 'listOpinionsForProtocol'])->name('protocols.opinions.list');
});
