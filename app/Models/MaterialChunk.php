<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MaterialChunk extends Model
{
    protected $fillable = [
        'material_id',
        'chunk_index',
        'content',
        'qdrant_point_id',
        'content_hash',
        'embedding_model',
        'vectorized_at',
    ];

    protected $casts = [
        'vectorized_at' => 'datetime',
    ];

    public function material()
    {
        return $this->belongsTo(Material::class);
    }
}
