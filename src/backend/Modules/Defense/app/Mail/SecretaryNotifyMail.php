<?php

namespace Modules\Defense\app\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Modules\Defense\app\Models\Defense;

class SecretaryNotifyMail extends Mailable
{
    use SerializesModels;

    public Defense $defense;

    public function __construct(Defense $defense)
    {
        $this->defense = $defense;
    }

    public function build()
    {
        $monograph = $this->defense->monograph;
        $link = config('app.url') . "/api/defenses/{$monograph->code}/schedule/set-by-secretary";

        return $this->subject('Ação requerida: Agendar defesa')
            ->view('defense::emails.secretary-notify')
            ->with([
                'defense' => $this->defense,
                'monograph' => $monograph,
                'link' => $link,
            ]);
    }
}
