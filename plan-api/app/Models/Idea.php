<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Idea extends Model
{
    /**
     * The ideas table has no updated_at column.
     */
    const UPDATED_AT = null;

    protected $fillable = ['content'];
}
