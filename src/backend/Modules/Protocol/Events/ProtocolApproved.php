<?php

// Backwards-compat shim: some parts of the codebase reference
// Modules\Protocol\Events\ProtocolApproved (without the `app` segment).
// The canonical event class lives at Modules\Protocol\app\Events\ProtocolApproved
// and this file provides a class alias so either namespace resolves to the
// same runtime class and avoids type-hint mismatches in listeners.

if (! class_exists('Modules\\Protocol\\Events\\ProtocolApproved')) {
    class_alias(
        \Modules\Protocol\app\Events\ProtocolApproved::class,
        'Modules\\Protocol\\Events\\ProtocolApproved'
    );
}
