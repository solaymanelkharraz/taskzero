<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Task;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class WeekController extends Controller
{
    /**
     * GET /api/week  — Next 7 days with task counts
     */
    public function index(): JsonResponse
    {
        $week = [];
        $startDate = Carbon::today();
        $endDate = Carbon::today()->addDays(6);

        $counts = Task::whereBetween('assigned_date', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')])
            ->where('status', '!=', 'done')
            ->selectRaw('assigned_date, count(*) as count')
            ->groupBy('assigned_date')
            ->get()
            ->pluck('count', 'assigned_date');

        for ($i = 0; $i < 7; $i++) {
            $date  = Carbon::today()->addDays($i);
            $dateStr = $date->format('Y-m-d');
            
            $week[] = [
                'date'  => $dateStr,
                'dow'   => $i === 0 ? 'Today' : ($i === 1 ? 'Tmrw' : $date->format('D')),
                'day'   => $date->format('j'),
                'month' => $date->format('M'),
                'count' => $counts[$dateStr] ?? 0,
            ];
        }

        return response()->json($week);
    }
}
