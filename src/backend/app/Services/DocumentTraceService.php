<?php

namespace App\Services;

use App\Models\DocumentRevision;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;
use Modules\User\app\Models\User;

class DocumentTraceService
{
    /**
     * Captures immutable metadata for one stored document revision. Existing
     * source rows are never rewritten; unavailable files remain visible.
     */
    public function capture(
        Model $subject,
        string $sourceTable,
        int $sourceId,
        string $fileName,
        ?string $filePath,
        ?int $submissionNumber = null,
        ?string $documentKey = null,
        ?User $actor = null,
        ?int $organId = null,
        string $disk = 'public',
        int $revisionNumber = 1,
        ?int $parentRevisionId = null,
    ): DocumentRevision {
        $storage = Storage::disk($disk);
        $exists = $filePath !== null && $storage->exists($filePath);

        $attributes = [
            'documentable_type' => $subject::class,
            'documentable_id' => $subject->getKey(),
            'source_table' => $sourceTable,
            'source_id' => $sourceId,
            'submission_number' => $submissionNumber,
            'revision_number' => $revisionNumber,
            'document_key' => $documentKey,
            'file_name' => $fileName,
            'storage_disk' => $disk,
            'file_path' => $filePath,
            'mime_type' => $exists ? $this->mimeType($disk, $filePath) : null,
            'file_size' => $exists ? $storage->size($filePath) : null,
            'sha256' => $exists ? $this->checksum($disk, $filePath) : null,
            'availability' => $exists ? DocumentRevision::AVAILABILITY_AVAILABLE : DocumentRevision::AVAILABILITY_MISSING,
            'captured_by' => $actor?->id,
            'organ_id' => $organId,
            'parent_revision_id' => $parentRevisionId,
            'captured_at' => now(),
        ];

        return DocumentRevision::query()->firstOrCreate([
            'source_table' => $sourceTable,
            'source_id' => $sourceId,
            'revision_number' => $revisionNumber,
        ], $attributes);
    }

    public function captureReplacement(
        Model $subject,
        string $sourceTable,
        int $sourceId,
        string $fileName,
        ?string $filePath,
        ?int $submissionNumber = null,
        ?string $documentKey = null,
        ?User $actor = null,
        ?int $organId = null,
        string $disk = 'public',
    ): DocumentRevision {
        $previous = DocumentRevision::query()
            ->where('source_table', $sourceTable)
            ->where('source_id', $sourceId)
            ->latest('revision_number')
            ->first();

        return $this->capture(
            $subject,
            $sourceTable,
            $sourceId,
            $fileName,
            $filePath,
            $submissionNumber,
            $documentKey,
            $actor,
            $organId,
            $disk,
            ($previous?->revision_number ?? 0) + 1,
            $previous?->id,
        );
    }

    public function fingerprint(string $disk, ?string $path): array
    {
        $storage = Storage::disk($disk);
        $exists = $path !== null && $storage->exists($path);

        return [
            'availability' => $exists ? DocumentRevision::AVAILABILITY_AVAILABLE : DocumentRevision::AVAILABILITY_MISSING,
            'file_size' => $exists ? $storage->size($path) : null,
            'mime_type' => $exists ? $this->mimeType($disk, $path) : null,
            'sha256' => $exists ? $this->checksum($disk, $path) : null,
        ];
    }

    private function checksum(string $disk, string $path): ?string
    {
        $stream = Storage::disk($disk)->readStream($path);

        if (! is_resource($stream)) {
            return null;
        }

        try {
            $context = hash_init('sha256');
            hash_update_stream($context, $stream);

            return hash_final($context);
        } finally {
            fclose($stream);
        }
    }

    private function mimeType(string $disk, string $path): ?string
    {
        try {
            return Storage::disk($disk)->mimeType($path);
        } catch (\Throwable) {
            return null;
        }
    }
}
