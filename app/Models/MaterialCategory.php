<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MaterialCategory extends Model
{
    protected $fillable = [
        'category_id',
        'material_id',
        'analysis',
        'score'
    ];


    public function material(){
        return $this->belongsTo(Material::class);
    }


    public function category(){
        return $this->belongsTo(Category::class);
    }
}
