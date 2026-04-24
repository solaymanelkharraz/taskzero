<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Habit extends Model
{
    protected $fillable = ['name', 'description', 'color'];

    public function logs()
    {
        return $this->hasMany(HabitLog::class);
    }
}
