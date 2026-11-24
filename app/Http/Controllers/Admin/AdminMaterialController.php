<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Http\JsonResponse;
use App\Models\Material;
use App\Models\MaterialChunk;
use App\Models\MaterialCategory;
use App\Models\ActivityLog;
use App\Http\Controllers\Base\MaterialController;
use App\Services\TextChunker;
use App\Services\OllamaEmbeddingService;
use App\Services\QdrantService;
use App\Jobs\ChunkMaterial;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class AdminMaterialController extends MaterialController
{
    public function index(){
        return Inertia::render('admin/admin-material/admin-material-index', [
            'title' => 'Material Management'
        ]);
    }


    public function getData(Request $req) : JsonResponse
    {

        $validated = $req->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'perpage' => ['nullable', 'numeric']
        ]);

        $search = trim($validated['search'] ?? '');
        $perPage = $validated['perpage'] ?? 10;

        $data = Material::with(['materialCategories.category'])
            ->when($search, function ($q) use ($search) {
            $q->where('title', 'like', "%{$search}%");
        })
        ->orderBy('created_at', 'desc')
        ->paginate($perPage);

        return response()->json($data);
    }

    public function create(){
        return Inertia::render('admin/admin-material/admin-material-add-edit', [
            'material' => null,
            'vectorStatus' => null,
            'ckLicense' => config('app.ck_license')
        ]);
    }


    public function edit($id){
        $material = Material::with(['materialCategories.category'])->findOrFail($id);

        $chunks = $material->chunks()->orderBy('chunk_index')->get();
        $qdrant = app(QdrantService::class);
        $embeddings = app(OllamaEmbeddingService::class);
        $hash = $material->contentHash();

        $qdrantSynced = false;
        if ($chunks->isNotEmpty()) {
            try {
                $qdrantSynced = $qdrant->hasCurrentPoints(
                    $material->id,
                    $chunks->pluck('qdrant_point_id')->all(),
                    $hash,
                    $embeddings->model()
                );
            } catch (\Throwable) {
                $qdrantSynced = false;
            }
        }

        $vectorStatus = [
            'is_vectorized' => (bool) $material->is_vectorized,
            'qdrant_synced' => $qdrantSynced,
            'chunks_count' => $chunks->count(),
            'content_hash' => $hash,
            'embedding_model' => $embeddings->model(),
        ];

        return Inertia::render('admin/admin-material/admin-material-add-edit', [
            'material' => $material,
            'vectorStatus' => $vectorStatus,
            'ckLicense' => config('app.ck_license')
        ]);
    }

    public function destroy($id){
        $material = Material::findOrFail($id);
        $materialId = (int) $material->id;
        $title = $material->title;

        // 1. Delete vector points from Qdrant directly and synchronously
        $qdrantDeleted = false;
        try {
            app(QdrantService::class)->deleteMaterial($materialId);
            $qdrantDeleted = true;
        } catch (\Throwable $e) {
            Log::warning("Failed to delete Qdrant vectors for material {$materialId}: " . $e->getMessage());
        }

        // 2. Transactionally delete database chunks, categories, and the material record
        $chunksDeleted = 0;
        DB::transaction(function () use ($material, &$chunksDeleted, $title) {
            $chunksDeleted = MaterialChunk::where('material_id', $material->id)->delete();
            MaterialCategory::where('material_id', $material->id)->delete();

            ActivityLog::create([
                'user_id' => Auth::id(),
                'action' => 'delete',
                'description' => "Material [{$material->id}] \"{$title}\" and {$chunksDeleted} chunks deleted along with Qdrant vectors.",
            ]);

            $material->delete();
        });

        return response()->json([
            'success' => true,
            'message' => "Material \"{$title}\", {$chunksDeleted} chunks, and Qdrant vectors successfully deleted.",
            'chunks_deleted' => $chunksDeleted,
            'qdrant_deleted' => $qdrantDeleted,
        ]);
    }

    /**
     * Inspect vectorization status, chunks, and Qdrant sync for a material.
     */
    public function getVectorStatus($id): JsonResponse
    {
        $material = Material::findOrFail($id);
        $chunks = $material->chunks()->orderBy('chunk_index')->get();
        $hash = $material->contentHash();

        $qdrant = app(QdrantService::class);
        $embeddings = app(OllamaEmbeddingService::class);

        $qdrantSynced = false;
        if ($chunks->isNotEmpty()) {
            try {
                $qdrantSynced = $qdrant->hasCurrentPoints(
                    $material->id,
                    $chunks->pluck('qdrant_point_id')->all(),
                    $hash,
                    $embeddings->model()
                );
            } catch (\Throwable) {
                $qdrantSynced = false;
            }
        }

        return response()->json([
            'success' => true,
            'material_id' => $material->id,
            'title' => $material->title,
            'is_vectorized' => (bool) $material->is_vectorized,
            'qdrant_synced' => $qdrantSynced,
            'chunks_count' => $chunks->count(),
            'content_hash' => $hash,
            'embedding_model' => $embeddings->model(),
            'chunks' => $chunks->map(fn ($c) => [
                'id' => $c->id,
                'chunk_index' => $c->chunk_index,
                'qdrant_point_id' => $c->qdrant_point_id,
                'char_count' => mb_strlen($c->content),
                'preview' => Str::limit($c->content, 220),
                'content' => $c->content,
                'vectorized_at' => $c->vectorized_at?->format('Y-m-d H:i:s'),
            ]),
        ]);
    }

    /**
     * Re-vectorize a material and override Qdrant vector points to ensure fresh data.
     */
    public function vectorize(Request $req, $id): JsonResponse
    {
        $material = Material::findOrFail($id);
        $override = $req->boolean('override', true);

        $chunker = app(TextChunker::class);
        $embeddings = app(OllamaEmbeddingService::class);
        $qdrant = app(QdrantService::class);

        try {
            $hash = $material->contentHash();

            // 1. Chunk content text
            $chunkData = $chunker->chunk(
                (string) $material->content_text,
                config('vectorization.chunk_size'),
                config('vectorization.chunk_overlap')
            );

            if (empty($chunkData)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Material text is empty or could not be chunked.',
                ], 422);
            }

            // 2. Sync to material_chunks table
            $pointRecords = [];
            foreach ($chunkData as $c) {
                $record = MaterialChunk::firstOrNew([
                    'material_id' => $material->id,
                    'chunk_index' => $c['chunk_index'],
                ]);

                // When overriding, assign a fresh UUID to guarantee fresh points in Qdrant
                if ($override || $record->content_hash !== $hash || $record->content !== $c['content'] || ! $record->qdrant_point_id) {
                    $record->fill([
                        'content' => $c['content'],
                        'content_hash' => $hash,
                        'qdrant_point_id' => (string) Str::uuid(),
                        'embedding_model' => $embeddings->model(),
                        'vectorized_at' => now(),
                    ]);
                    $record->save();
                }

                $pointRecords[] = $record;
            }

            // Delete obsolete chunks
            MaterialChunk::where('material_id', $material->id)
                ->where('chunk_index', '>=', count($chunkData))
                ->delete();

            // 3. Embed and upsert to Qdrant
            $vectors = $embeddings->embedDocuments(
                collect($pointRecords)->map(fn ($r) => $material->title . "\n\n" . $r->content)->all()
            );

            $qdrant->ensureCollection();

            $points = [];
            foreach ($pointRecords as $i => $rec) {
                $points[] = [
                    'id' => $rec->qdrant_point_id,
                    'vector' => $vectors[$i],
                    'payload' => [
                        'material_id' => $material->id,
                        'chunk_index' => $rec->chunk_index,
                        'content_hash' => $hash,
                        'embedding_model' => $embeddings->model(),
                    ],
                ];
            }

            $qdrant->replaceMaterialPoints($material->id, $points);

            // 4. Mark material as vectorized
            $material->update([
                'is_vectorized' => 1,
            ]);

            // 5. Activity log
            ActivityLog::create([
                'user_id' => Auth::id(),
                'action' => 'vectorize',
                'description' => "Material [{$material->id}] \"{$material->title}\" vectorized and synced into " . count($points) . " chunks.",
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Material successfully vectorized and synced to Qdrant.',
                'chunks_count' => count($points),
                'is_vectorized' => 1,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Vectorization failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Batch vectorize published materials.
     */
    public function batchVectorize(Request $req): JsonResponse
    {
        $override = $req->boolean('override', false);

        $query = Material::published();
        if (! $override) {
            $query->where('is_vectorized', 0);
        }

        $materials = $query->get();

        if ($materials->isEmpty()) {
            return response()->json([
                'success' => true,
                'message' => 'All published materials are already vectorized.',
                'queued_count' => 0,
            ]);
        }

        foreach ($materials as $m) {
            ChunkMaterial::dispatch($m->id, $m->contentHash(), true)
                ->onQueue(config('vectorization.queue'));
        }

        ActivityLog::create([
            'user_id' => Auth::id(),
            'action' => 'vectorize',
            'description' => "Batch vectorization queued for {$materials->count()} materials.",
        ]);

        return response()->json([
            'success' => true,
            'message' => "Successfully queued {$materials->count()} materials for AI vectorization.",
            'queued_count' => $materials->count(),
        ]);
    }
}
