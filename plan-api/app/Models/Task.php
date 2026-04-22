<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Task extends Model
{
    /**
     * The tasks table has no updated_at column.
     * Prevents Eloquent from writing it on create/update.
     */
    const UPDATED_AT = null;

    protected $fillable = [
        'title',
        'status',
        'assigned_date',
        'project_id',
    ];

    protected $casts = [
        'assigned_date' => 'date:Y-m-d',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
