<?php

namespace Modules\Defense\app\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Modules\Defense\app\Models\DefenseJuryAssignment;

class JuryAssignmentMail extends Mailable
{
    use SerializesModels;

    public DefenseJuryAssignment $assignment;
    public string $downloadLink;

    public function __construct(DefenseJuryAssignment $assignment, string $downloadLink)
    {
        $this->assignment = $assignment;
        $this->downloadLink = $downloadLink;
    }

    public function build()
    {
        return $this->subject('Atribuição de Júri — Monografia')
            ->view('defense::emails.jury-assignment')
            ->with([
                'assignment' => $this->assignment,
                'downloadLink' => $this->downloadLink,
            ]);
    }
}
