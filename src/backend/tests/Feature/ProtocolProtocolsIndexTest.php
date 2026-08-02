<?php

namespace Tests\Feature;

use Illuminate\Support\Carbon;
use Modules\Protocol\app\Models\Document;
use Modules\Protocol\app\Models\Protocol;
use Modules\Protocol\app\Models\Topic;
use Modules\Protocol\app\Services\ProtocolService;
use Modules\User\app\Models\User;
use Tests\TestCase;

class ProtocolProtocolsIndexTest extends TestCase
{
    public function test_it_returns_the_student_protocols_with_documents(): void
    {
        $student = new User();
        $student->forceFill([
            'id' => 10,
            'name' => 'Estudante de Teste',
            'email' => 'estudante.teste@example.com',
            'status' => 'active',
        ]);
        $student->setRelation('roles', collect());

        $topic = new Topic();
        $topic->forceFill([
            'id' => 6,
            'title' => 'Tema de teste do protocolo',
            'status' => Topic::STATUS_APPROVED_NUCLEO,
        ]);

        $firstDocument = new Document();
        $firstDocument->forceFill([
            'id' => 1,
            'document_type' => 'protocol',
            'file_name' => 'protocol-1-S1.docx',
            'file_path' => 'protocols/1/protocol-1-S1.docx',
            'pages' => 10,
            'version' => 1,
            'status' => Document::STATUS_ACTIVE,
        ]);
        $firstDocument->created_at = Carbon::parse('2026-07-07 14:30:00');

        $secondDocument = new Document();
        $secondDocument->forceFill([
            'id' => 2,
            'document_type' => 'protocol',
            'file_name' => 'protocol-1-S2.docx',
            'file_path' => 'protocols/1/protocol-1-S2.docx',
            'pages' => 12,
            'version' => 2,
            'status' => Document::STATUS_ACTIVE,
        ]);
        $secondDocument->created_at = Carbon::parse('2026-07-07 15:00:00');

        $protocol = new Protocol();
        $protocol->forceFill([
            'id' => 1,
            'student' => $student->id,
            'code' => 'PTM-TEST-001',
            'current_organ_id' => 3,
            'topic_id' => $topic->id,
            'approved_by_supervisor' => true,
            'protocol_type' => 'protocol',
            'submission_number' => '1',
            'status' => Protocol::STATUS_PENDING_NUCLEO,
            'version' => 'NC_V1',
            'submitted_at' => Carbon::parse('2026-07-07 14:30:00'),
        ]);
        $protocol->setRelation('topic', $topic);
        $protocol->setRelation('documents', collect([$firstDocument, $secondDocument]));

        $this->mock(ProtocolService::class, function ($mock) use ($student, $protocol): void {
            $mock->shouldReceive('listForStudent')
                ->once()
                ->with($student)
                ->andReturn(collect([$protocol]));
        });

        $response = $this->actingAs($student, 'sanctum')->getJson('/api/v1/protocols');

        $response->assertOk()
            ->assertJsonCount(1, 'protocols')
            ->assertJsonPath('protocols.0.id', 1)
            ->assertJsonPath('protocols.0.documents.0.file_name', 'protocol-1-S1.docx')
            ->assertJsonPath('protocols.0.documents.0.version_label', 'V1')
            ->assertJsonPath('protocols.0.documents.1.file_url', url('storage/protocols/1/protocol-1-S2.docx'));
    }
}
