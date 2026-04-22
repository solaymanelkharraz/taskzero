<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Carbon\Carbon;

class TaskController extends Controller
{
    /**
     * GET /api/tasks
     * Filters: ?date=YYYY-MM-DD | ?status=todo|in_progress|done | ?project_id=N | ?backlog=1
     */
    public function index(Request $request): JsonResponse
    {
        $query = Task::with('project')->orderByRaw("FIELD(status,'in_progress','todo','done')");

        if ($request->filled('date')) {
            $query->whereDate('assigned_date', $request->date);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('project_id')) {
            $query->where('project_id', $request->project_id);
        }

        if ($request->boolean('backlog')) {
            $query->whereNull('assigned_date');
        }

        $tasks = $query->get()->map(fn($t) => $this->format($t));

        return response()->json($tasks);
    }

    /**
     * POST /api/tasks
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title'         => 'required|string|max:255',
            'status'        => 'sometimes|in:todo,in_progress,done',
            'assigned_date' => 'nullable|date',
            'project_id'    => 'nullable|integer|exists:projects,id',
        ]);

        $task = Task::create([
            'title'         => $data['title'],
            'status'        => $data['status'] ?? 'todo',
            'assigned_date' => $data['assigned_date'] ?? null,
            'project_id'    => $data['project_id'] ?? null,
        ]);

        return response()->json($this->format($task->load('project')), 201);
    }

    /**
     * PUT /api/tasks/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $task = Task::findOrFail($id);

        $data = $request->validate([
            'title'         => 'sometimes|string|max:255',
            'status'        => 'sometimes|in:todo,in_progress,done',
            'assigned_date' => 'nullable|date',
            'project_id'    => 'nullable|integer|exists:projects,id',
        ]);

        $task->update($data);

        return response()->json($this->format($task->fresh('project')));
    }

    /**
     * PATCH /api/tasks/{id}/cycle  — todo→in_progress→done→todo
     */
    public function cycle(int $id): JsonResponse
    {
        $task = Task::findOrFail($id);

        $next = match ($task->status) {
            'todo'        => 'in_progress',
            'in_progress' => 'done',
            default       => 'todo',
        };

        $task->update(['status' => $next]);

        return response()->json($this->format($task->fresh('project')));
    }

    /**
     * DELETE /api/tasks/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        Task::findOrFail($id)->delete();
        return response()->json(['message' => 'Task deleted.']);
    }

    // ── Format helper ─────────────────────────────────────────
    private function format(Task $task): array
    {
        return [
            'id'            => $task->id,
            'title'         => $task->title,
            'status'        => $task->status,
            'assigned_date' => $task->assigned_date?->format('Y-m-d'),
            'project_id'    => $task->project_id,
            'project_name'  => $task->project?->name ?? 'Standalone',
            'created_at'    => $task->created_at?->toISOString(),
        ];
    }
}
