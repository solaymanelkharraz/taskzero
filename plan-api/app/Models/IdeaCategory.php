<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IdeaCategory extends Model
{
    protected $fillable = ['name'];

    public function ideas()
    {
        return $this->hasMany(Idea::class, 'category_id');
    }
}
