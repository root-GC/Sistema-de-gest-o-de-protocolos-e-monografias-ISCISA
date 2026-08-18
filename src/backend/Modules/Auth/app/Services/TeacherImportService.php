<?php

namespace Modules\Auth\app\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Validator;
use PhpOffice\PhpSpreadsheet\IOFactory;

class TeacherImportService
{
    public function __construct(private TeacherInviteService $inviteService) {}

    /**
     * @return array{created: array, failed: array}
     */
    public function importFromFile(UploadedFile $file, int $scientificAreaId): array
    {
        $rows = $this->parseRows($file);

        $created = [];
        $failed  = [];

        foreach ($rows as $lineNumber => $row) {
            $name  = trim($row['name'] ?? '');
            $email = trim($row['email'] ?? '');

            $validator = Validator::make(
                ['name' => $name, 'email' => $email],
                ['name' => ['required', 'string', 'max:255'], 'email' => ['required', 'email', 'unique:users,email']],
            );

            if ($validator->fails()) {
                $failed[] = [
                    'line'   => $lineNumber,
                    'row'    => $row,
                    'errors' => $validator->errors()->all(),
                ];
                continue;
            }

            try {
                $user = $this->inviteService->invite([
                    'name'                => $name,
                    'email'               => $email,
                    'scientific_area_id'  => $scientificAreaId,
                ]);

                $created[] = ['line' => $lineNumber, 'id' => $user->id, 'name' => $name, 'email' => $email];
            } catch (\Throwable $e) {
                $failed[] = ['line' => $lineNumber, 'row' => $row, 'errors' => [$e->getMessage()]];
            }
        }

        return compact('created', 'failed');
    }

    /**
     * Lê .xlsx/.xls/.csv e devolve linhas normalizadas para ['name' => ..., 'email' => ...],
     * fazendo match do cabeçalho por nome (aceita "nome"/"name" e "email"/"e-mail").
     */
    private function parseRows(UploadedFile $file): array
    {
        $factoryClass = '\\PhpOffice\\PhpSpreadsheet\\IOFactory';

        if (!class_exists($factoryClass)) {
            throw new \RuntimeException('A biblioteca PhpSpreadsheet não está instalada. Execute: composer require phpoffice/phpspreadsheet');
        }

        $spreadsheet = $factoryClass::load($file->getRealPath());
        $sheet       = $spreadsheet->getActiveSheet();
        $data        = $sheet->toArray(null, true, true, false);

        if (empty($data)) return [];

        $header = array_map(fn ($h) => strtolower(trim((string) $h)), array_shift($data));

        $nameCol  = array_search('name', $header) !== false ? array_search('name', $header) : array_search('nome', $header);
        $emailCol = array_search('email', $header) !== false ? array_search('email', $header) : array_search('e-mail', $header);

        if ($nameCol === false || $emailCol === false) {
            throw new \RuntimeException('O ficheiro precisa de colunas "name" (ou "nome") e "email".');
        }

        $rows = [];
        foreach ($data as $i => $line) {
            if (empty(array_filter($line))) continue; // ignora linhas vazias
            $rows[$i + 2] = [ // +2: compensa header + índice base 0, para o número de linha bater com o Excel
                'name'  => $line[$nameCol]  ?? null,
                'email' => $line[$emailCol] ?? null,
            ];
        }

        return $rows;
    }
}