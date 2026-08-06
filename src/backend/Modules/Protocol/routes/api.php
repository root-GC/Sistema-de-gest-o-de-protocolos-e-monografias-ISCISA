<?php

use Illuminate\Support\Facades\Route;
use Modules\Protocol\app\Http\Controllers\ComiteCientificoController;
use Modules\Protocol\app\Http\Controllers\TopicController;
use Modules\Protocol\app\Http\Controllers\EvaluationFormController;
use Modules\Protocol\app\Http\Controllers\OnlyOfficeController;
use Modules\Protocol\app\Http\Controllers\SupervisorController;
use Modules\Protocol\app\Http\Controllers\ProtocolApiController;
use Modules\Protocol\app\Http\Controllers\DashboardController;

Route::prefix('api')->middleware(['api'])->group(function () {
    Route::get('/onlyoffice/config',
        [OnlyOfficeController::class, 'config']
    );
    Route::post('/protocolo/onlyoffice/callback',
        [OnlyOfficeController::class, 'callback']
    );
});

Route::prefix('api')->middleware(['api', 'auth:sanctum'])->group(function () {
    Route::get('/onlyoffice/config/{protocol}',
        [OnlyOfficeController::class, 'configForProtocol']
    )->name('onlyoffice.config.protocol');
});

Route::prefix('api')->middleware(['api'])->group(function () {
 Route::middleware('auth:sanctum')
    ->get('/dashboard/my-protocols', [DashboardController::class, 'myProtocols']);
});


Route::prefix('api/v1')->middleware(['api', 'auth:sanctum'])->group(function () {

    //Seus proprios temas
     Route::get(
        '/topics/my-approved',
        [TopicController::class, 'getMyApprovedTopics']
    );

    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard.index');
   

    Route::post('topics', [TopicController::class, 'store'])->name('topic.store');
    Route::get('topics', [TopicController::class, 'index'])->name('topic.index');

    Route::patch('topics/{topic}/supervisor-approve', [TopicController::class, 'approveBySupervisor'])->name('topic.approve');
    Route::patch('topics/{topic}/supervisor-reject', [TopicController::class, 'rejectBySupervisor'])->name('topic.reject');
    Route::get('supervisor/supervisees', [SupervisorController::class, 'supervisees'])->name('supervisor.supervisees.list');
    Route::get('supervisor/topics', [TopicController::class, 'getForSupervisor'])->name('supervisor.topics.list');

    // Secretary operations: list topics for assignment, get eligible reviewers, assign reviewers
    Route::get('secretary/topics', [TopicController::class, 'getForSecretary'])->name('secretary.topics.list');
    Route::get('topics/{topic}/eligible-reviewers', [TopicController::class, 'getEligibleReviewers'])->name('topic.eligible-reviewers');
    Route::get('topics/{topic}/reviewers', [TopicController::class, 'getAssignedReviewers'])->name('topic.reviewers.index');
    Route::post('topics/{topic}/assign-reviewers', [TopicController::class, 'assignReviewers'])->name('topic.assign-reviewers');
    Route::get('reviewer/topics', [TopicController::class, 'getForReviewer'])->name('reviewer.topics.list');
    Route::get('topics/{topic}/comments', [TopicController::class, 'getComments'])->name('topic.comments.index');
    Route::post('topics/{topic}/comments', [TopicController::class, 'submitComment'])->name('topic.comments.store');
    Route::post('topics/{topic}/evaluations', [TopicController::class, 'submitEvaluation'])->name('topic.evaluations.store');


     Route::get('supervisor/protocols', 'Modules\\Protocol\\app\\Http\\Controllers\\ProtocolApiController@getForSupervisor')->name('supervisor.protocols.list');
    Route::post('protocols', 'Modules\\Protocol\\app\\Http\\Controllers\\ProtocolApiController@store')->name('protocol.store');
    Route::get('protocols', 'Modules\\Protocol\\app\\Http\\Controllers\\ProtocolApiController@index')->name('protocol.index');
    Route::get('protocols/{protocol}', 'Modules\\Protocol\\app\\Http\\Controllers\\ProtocolApiController@show')->name('protocol.show');
    Route::get('protocols/{protocol}/history', [ProtocolApiController::class, 'history'])->name('protocol.history');
    Route::patch('protocols/{protocol}/supervisor-approve', 'Modules\\Protocol\\app\\Http\\Controllers\\ProtocolApiController@approveBySupervisor')->name('protocol.supervisor-approve');
    Route::patch('protocols/{protocol}/supervisor-reject', 'Modules\\Protocol\\app\\Http\\Controllers\\ProtocolApiController@rejectBySupervisor')->name('protocol.supervisor-reject');

    // Document download
    Route::get('protocols/{protocol}/download', 'Modules\\Protocol\\app\\Http\\Controllers\\ProtocolApiController@downloadDocument')->name('protocols.document.download');
    Route::get('protocols/{protocol}/required-documents', [ProtocolApiController::class, 'listRequiredDocuments'])->name('protocols.required-documents.list');
    Route::post('protocols/{protocol}/required-documents/{requirement}/upload', [ProtocolApiController::class, 'uploadRequiredDocument'])->name('protocols.required-documents.upload');
    Route::patch('protocols/{protocol}/required-documents/{requirement}/approve', [ProtocolApiController::class, 'approveRequiredDocument'])->name('protocols.required-documents.approve');
    Route::patch('protocols/{protocol}/required-documents/{requirement}/reject', [ProtocolApiController::class, 'rejectRequiredDocument'])->name('protocols.required-documents.reject');
    Route::get('protocols/{protocol}/required-documents/{requirement}/download', [ProtocolApiController::class, 'downloadRequiredDocument'])->name('protocols.required-documents.download');

    // Opinions (pareceres)
    Route::get('opinions/{opinion}/download', [EvaluationFormController::class, 'downloadOpinion'])->name('opinions.download');
    Route::get('opinions/{opinion}/signed-download', [EvaluationFormController::class, 'downloadSignedOpinion'])->name('opinions.signed-download');
    Route::get('protocols/{protocol}/opinions', [EvaluationFormController::class, 'listOpinionsForProtocol'])->name('protocols.opinions.list');
    Route::post('protocols/{protocol}/opinions/{opinion}/sign', [ProtocolApiController::class, 'submitSignedParecer'])->name('protocols.opinions.sign');

    // Evaluation forms - shared (download PDF)
    Route::get('evaluation-forms/{form}/download', [EvaluationFormController::class, 'downloadEvaluationForm'])->name('evaluation-forms.download');

    // === NÚCLEO CIENTÍFICO (NC) ===
    Route::prefix('nucleo')->group(function () {
        Route::get('evaluation-forms/{form}', [EvaluationFormController::class, 'show'])->name('nucleo.evaluation-forms.show');
        Route::post('evaluation-forms/{form}/criteria/{formCriterion}/review', [EvaluationFormController::class, 'saveCriterionReview'])->name('nucleo.evaluation-forms.criteria.review');
        Route::post('evaluation-forms/{form}/submit', [EvaluationFormController::class, 'submit'])->name('nucleo.evaluation-forms.submit');
        Route::post('evaluation-forms/{form}/schedule-deliberation', [EvaluationFormController::class, 'scheduleDeliberation'])->name('nucleo.evaluation-forms.schedule-deliberation');
        Route::post('evaluation-forms/{form}/start-deliberation', [EvaluationFormController::class, 'startDeliberation'])->name('nucleo.evaluation-forms.start-deliberation');
        Route::post('evaluation-forms/{form}/submit-deliberation', [EvaluationFormController::class, 'submitDeliberation'])->name('nucleo.evaluation-forms.submit-deliberation');

        // NOVO: encerrar reunião (deliberated | not_deliberated)
        Route::post('evaluation-forms/{form}/close-meeting', [EvaluationFormController::class, 'closeMeeting'])->name('nucleo.evaluation-forms.close-meeting');

        Route::post('evaluation-forms/{form}/decide', [EvaluationFormController::class, 'decide'])->name('nucleo.evaluation-forms.decide');

        // NOVO: listagem para a aba de decisões finais pendentes (status = deliberated)
        Route::get('final-decisions', [EvaluationFormController::class, 'getPendingFinalDecision'])->name('nucleo.final-decisions.list');

        Route::get('reviewer/evaluations', [EvaluationFormController::class, 'getForReviewer'])->name('nucleo.reviewer.evaluations.list');
        Route::get('secretary/evaluations', [EvaluationFormController::class, 'getForSecretary'])->name('nucleo.secretary.evaluations.list');

        Route::get('protocols/{protocol}/eligible-reviewers', [ProtocolApiController::class, 'getEligibleReviewersNucleo'])->name('nucleo.protocols.eligible-reviewers');
        Route::get('protocols/{protocol}/reviewers', [ProtocolApiController::class, 'getAssignedReviewersNucleo'])->name('nucleo.protocols.reviewers');
        Route::post('protocols/{protocol}/assign-reviewers', [ProtocolApiController::class, 'assignReviewersNucleo'])->name('nucleo.protocols.assign-reviewers');

        Route::get('reviewer/protocols', [ProtocolApiController::class, 'getForReviewer'])->name('reviewer.protocols.list');
        Route::get('secretary/protocols', [ProtocolApiController::class, 'getForSecretary'])->name('secretary.protocols.list');
    });

    // === COMITÉ CIENTÍFICO (CC) ===
    Route::prefix('comite-cientifico')->group(function () {
        Route::get('evaluation-forms/{form}', [EvaluationFormController::class, 'show'])->name('cc.evaluation-forms.show');
        Route::post('evaluation-forms/{form}/criteria/{formCriterion}/review', [EvaluationFormController::class, 'saveCriterionReview'])->name('cc.evaluation-forms.criteria.review');
        Route::post('evaluation-forms/{form}/mark-evaluated', [EvaluationFormController::class, 'markEvaluated'])->name('cc.evaluation-forms.mark-evaluated');
        Route::post('evaluation-forms/{form}/submit', [EvaluationFormController::class, 'submit'])->name('cc.evaluation-forms.submit');
        Route::post('evaluation-forms/{form}/schedule-deliberation', [EvaluationFormController::class, 'scheduleDeliberation'])->name('cc.evaluation-forms.schedule-deliberation');
        Route::post('evaluation-forms/{form}/start-deliberation', [EvaluationFormController::class, 'startDeliberation'])->name('cc.evaluation-forms.start-deliberation');
        Route::post('evaluation-forms/{form}/submit-deliberation', [EvaluationFormController::class, 'submitDeliberation'])->name('cc.evaluation-forms.submit-deliberation');

        // NOVO
        Route::post('evaluation-forms/{form}/close-meeting', [EvaluationFormController::class, 'closeMeeting'])->name('cc.evaluation-forms.close-meeting');

        Route::post('evaluation-forms/{form}/decide', [EvaluationFormController::class, 'decide'])->name('cc.evaluation-forms.decide');

        // NOVO
        Route::get('final-decisions', [EvaluationFormController::class, 'getPendingFinalDecision'])->name('cc.final-decisions.list');

        Route::get('reviewer/evaluations', [EvaluationFormController::class, 'getForReviewer'])->name('cc.reviewer.evaluations.list');
        Route::get('secretary/evaluations', [EvaluationFormController::class, 'getForSecretary'])->name('cc.secretary.evaluations.list');
        Route::get('reviewer/works', [ComiteCientificoController::class, 'reviewerWorks'])->name('cc.reviewer.works');

        Route::get('protocols/{protocol}/eligible-reviewers', [ProtocolApiController::class, 'getEligibleReviewersCC'])->name('cc.protocols.eligible-reviewers');
        Route::get('protocols/{protocol}/reviewers', [ProtocolApiController::class, 'getAssignedReviewersCC'])->name('cc.protocols.reviewers');
        Route::post('protocols/{protocol}/assign-reviewers', [ProtocolApiController::class, 'assignReviewersCC'])->name('cc.protocols.assign-reviewers');
        Route::get('secretary/protocols', [ProtocolApiController::class, 'getForSecretary'])->name('cc.secretary.protocols.list');
    });

    // === Comité de Bioética ===
    Route::prefix('comite-bioetica')->group(function () {
        Route::get('evaluation-forms/{form}', [EvaluationFormController::class, 'show'])->name('bioetica.evaluation-forms.show');
        Route::post('evaluation-forms/{form}/criteria/{formCriterion}/review', [EvaluationFormController::class, 'saveCriterionReview'])->name('bioetica.evaluation-forms.criteria.review');
        Route::post('evaluation-forms/{form}/mark-evaluated', [EvaluationFormController::class, 'markEvaluated'])->name('bioetica.evaluation-forms.mark-evaluated');
        Route::post('evaluation-forms/{form}/submit', [EvaluationFormController::class, 'submit'])->name('bioetica.evaluation-forms.submit');
        Route::post('evaluation-forms/{form}/schedule-deliberation', [EvaluationFormController::class, 'scheduleDeliberation'])->name('bioetica.evaluation-forms.schedule-deliberation');
        Route::post('evaluation-forms/{form}/start-deliberation', [EvaluationFormController::class, 'startDeliberation'])->name('bioetica.evaluation-forms.start-deliberation');
        Route::post('evaluation-forms/{form}/submit-deliberation', [EvaluationFormController::class, 'submitDeliberation'])->name('bioetica.evaluation-forms.submit-deliberation');
        Route::post('evaluation-forms/{form}/close-meeting', [EvaluationFormController::class, 'closeMeeting'])->name('bioetica.evaluation-forms.close-meeting');
        Route::post('evaluation-forms/{form}/decide', [EvaluationFormController::class, 'decide'])->name('bioetica.evaluation-forms.decide');
        Route::get('final-decisions', [EvaluationFormController::class, 'getPendingFinalDecision'])->name('bioetica.final-decisions.list');
        Route::get('reviewer/evaluations', [EvaluationFormController::class, 'getForReviewer'])->name('bioetica.reviewer.evaluations.list');
        Route::get('secretary/evaluations', [EvaluationFormController::class, 'getForSecretary'])->name('bioetica.secretary.evaluations.list');
        Route::get('protocols/{protocol}/eligible-reviewers', [ProtocolApiController::class, 'getEligibleReviewersBioetica'])->name('bioetica.protocols.eligible-reviewers');
        Route::get('protocols/{protocol}/reviewers', [ProtocolApiController::class, 'getAssignedReviewersBioetica'])->name('bioetica.protocols.reviewers');
        Route::post('protocols/{protocol}/assign-reviewers', [ProtocolApiController::class, 'assignReviewersBioetica'])->name('bioetica.protocols.assign-reviewers');
        Route::get('secretary/protocols', [ProtocolApiController::class, 'getForSecretary'])->name('bioetica.secretary.protocols.list');
    });
});
