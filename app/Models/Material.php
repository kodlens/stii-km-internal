<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Jobs\ChunkMaterial;
use App\Jobs\DeleteMaterialVectors;
use App\Jobs\ExtractMaterialMetadata;


class Material extends Model
{

    protected static function booted(): void
    {
        static::saving(function (Material $material) {
            if (! $material->exists || $material->isDirty(['title', 'content_text'])) {
                $material->is_ai_summarized = 0;
                $material->is_vectorized = 0;
            }
        });

        static::saved(function (Material $material) {
            if (($material->wasRecentlyCreated && $material->getOriginal('id') === null)
                || $material->wasChanged(['title', 'content_text'])) {
                $hash = $material->contentHash();
                ExtractMaterialMetadata::dispatch($material->id, $hash)
                    ->onQueue('metadata')->afterCommit();
                ChunkMaterial::dispatch($material->id, $hash)
                    ->onQueue(config('vectorization.queue'))->afterCommit();
            }
        });

        static::deleted(function (Material $material) {
            DeleteMaterialVectors::dispatch($material->id)
                ->onQueue(config('vectorization.queue'))->afterCommit();
        });
    }

    public function contentHash(): string
    {
        return hash('sha256', json_encode([
            (string) $this->title,
            (string) $this->content_text,
        ], JSON_THROW_ON_ERROR));
    }

    protected $fillable = [
        'title',
        'slug',
        'content',
        'content_text',
        'status',
        'submitted_at',
        'published_at',
        'publish_date',
        'is_publish',
        'is_trash',
        'uploaded_file',
        'original_filename',
        'access_level',
        'encoded_by_id',
        'updated_by_id',
        'is_ojt',
        'is_categorized',
        'is_vectorized',
        'is_ai_summarized'
    ];



    public function materialCategories(){
        return $this->hasMany(MaterialCategory::class);
    }

    // public function contributions()
    // {
    //     return $this->hasMany(MaterialContribution::class);
    // }


    public function chunks()
    {
        return $this->hasMany(MaterialChunk::class);
    }
}
