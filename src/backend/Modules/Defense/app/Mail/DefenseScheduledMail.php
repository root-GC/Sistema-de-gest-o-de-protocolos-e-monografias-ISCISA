<?php

namespace Modules\Defense\app\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Modules\Defense\app\Models\Defense;

class DefenseScheduledMail extends Mailable
{
    use SerializesModels;

    public Defense $defense;
    public string $role;

    public function __construct(Defense $defense, string $role = 'participant')
    {
        $this->defense = $defense;
        $this->role = $role;
    }

    public function build()
    {
        $monograph = $this->defense->monograph;

        return $this->subject('Defesa agendada — ' . $monograph->code)
            ->view('defense::emails.defense-scheduled')
            ->with([
                'defense' => $this->defense,
                'monograph' => $monograph,
                'role' => $this->role,
            ]);
    }
}
