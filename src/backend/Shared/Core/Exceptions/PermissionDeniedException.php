<?php

namespace Shared\Core\Exceptions;

use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * Lançada quando um utilizador tenta uma acção sem a permission necessária.
 * Resulta em HTTP 403 — tratada pelo Handler global do Laravel.
 */
class PermissionDeniedException extends HttpException
{
    public function __construct(string $permission)
    {
        parent::__construct(403, "Sem permissão para executar: {$permission}");
    }
}