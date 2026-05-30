<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Material extends Model
{
    protected $fillable = [
        'title',
        'content',
        'content_text',
        'status',
        'submitted_at',
        'published_at',
        'is_publish',
        'is_trash',
        'uploaded_file',
        'encoded_by_id',
        'updated_by_id'
    ];


    public function category(){
        return $this->belongsTo(Category::class);
    }

    public function material_caetegories(){
        return $this->hasMany(MaterialCategory::class);
    }
}
