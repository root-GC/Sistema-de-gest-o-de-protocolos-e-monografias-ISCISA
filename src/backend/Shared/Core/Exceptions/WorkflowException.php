<?php

namespace Shared\Core\Exceptions;

use RuntimeException;

/**
 * Lançada quando uma transição de estado é inválida no workflow.
 *
 * Exemplo: tentar aprovar um protocolo que está em estado 'pending'
 * antes de ter sido submetido.
 */
class WorkflowException extends RuntimeException
{
    public function __construct(
        string $message,
        private readonly string $currentState,
        private readonly string $attemptedTransition,
    ) {
        parent::__construct($message);
    }

    public function getCurrentState(): string      { return $this->currentState; }
    public function getAttemptedTransition(): string { return $this->attemptedTransition; }

    /**
     * Converte para array para resposta JSON.
     */
    public function toArray(): array
    {
        return [
            'message'              => $this->getMessage(),
            'current_state'        => $this->currentState,
            'attempted_transition' => $this->attemptedTransition,
        ];
    }
}