<?php

namespace App\Console\Commands;

use App\Models\Task;
use Illuminate\Console\Command;
use Carbon\Carbon;

class MidnightSweep extends Command
{
    protected $signature   = 'tasks:sweep';
    protected $description = 'Move past unfinished tasks back to the backlog (assigned_date = null)';

    public function handle(): int
    {
        $swept = Task::where('assigned_date', '<', Carbon::today())
            ->where('status', '!=', 'done')
            ->update(['assigned_date' => null]);

        $this->info("Midnight Sweep: {$swept} task(s) moved to backlog.");

        return Command::SUCCESS;
    }
}
