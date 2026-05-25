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
        'is_publish'
    ];
}
