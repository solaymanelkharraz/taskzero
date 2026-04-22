<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Task;
use Illuminate\Http\JsonResponse;

class SweepController extends Controller
{
    /**
     * POST /api/sweep  — Trigger Midnight Sweep manually
     */
    public function __invoke(): JsonResponse
    {
        $swept = Task::where('assigned_date', '<', now()->toDateString())
            ->where('status', '!=', 'done')
            ->update(['assigned_date' => null]);

        return response()->json([
            'swept'   => $swept,
            'message' => "{$swept} task(s) moved to backlog.",
        ]);
    }
}
