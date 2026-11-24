<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    //

    protected $fillable = [
        'category',
        'slug',
        'active'
    ];

    public function materialCategories()
    {
        return $this->hasMany(MaterialCategory::class, 'category_id');
    }

    public function materials()
    {
        return $this->belongsToMany(Material::class, 'material_categories', 'category_id', 'material_id');
    }


}
