<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Habit;
use App\Models\HabitLog;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HabitController extends Controller
{
    /**
     * GET /api/habits
     */
    public function index(): JsonResponse
    {
        $habits = Habit::with('logs')->get()->map(function ($habit) {
            return [
                'id'          => $habit->id,
                'name'        => $habit->name,
                'description' => $habit->description,
                'color'       => $habit->color,
                'logs'        => $habit->logs->map(fn($log) => $log->completed_date),
            ];
        });

        return response()->json($habits);
    }

    /**
     * POST /api/habits
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string',
            'color'       => 'nullable|string',
        ]);

        $habit = Habit::create($data);

        return response()->json([
            'id'          => $habit->id,
            'name'        => $habit->name,
            'description' => $habit->description,
            'color'       => $habit->color,
            'logs'        => [],
        ], 201);
    }

    /**
     * POST /api/habits/{id}/log
     */
    public function log(Request $request, int $id): JsonResponse
    {
        $habit = Habit::findOrFail($id);

        $data = $request->validate([
            'date' => 'nullable|date',
        ]);

        $date = $data['date'] ?? Carbon::today()->toDateString();

        // Check if log exists
        $log = HabitLog::firstOrCreate([
            'habit_id'       => $habit->id,
            'completed_date' => $date,
        ]);

        return response()->json(['message' => 'Habit logged successfully', 'log' => $log]);
    }
}
