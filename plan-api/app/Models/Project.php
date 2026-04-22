<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Project extends Model
{
    /**
     * The projects table has no updated_at column.
     */
    const UPDATED_AT = null;

    protected $fillable = ['name', 'description'];

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    public function getTaskStatsAttribute(): array
    {
        $total = $this->tasks()->count();
        $done  = $this->tasks()->where('status', 'done')->count();
        return [
            'total' => $total,
            'done'  => $done,
            'pct'   => $total > 0 ? round($done / $total * 100) : 0,
        ];
    }
}
