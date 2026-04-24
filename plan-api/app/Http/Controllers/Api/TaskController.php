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
        $query = Task::with('project')->orderByRaw("FIELD(status,'not_done','done')");

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

        if ($request->boolean('exclude_done')) {
            $query->where('status', '!=', 'done');
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
            'status'        => 'sometimes|in:not_done,done',
            'assigned_date' => 'nullable|date',
            'project_id'    => 'nullable|integer|exists:projects,id',
        ]);

        $task = Task::create([
            'title'         => $data['title'],
            'status'        => $data['status'] ?? 'not_done',
            'assigned_date' => $data['assigned_date'] ?? null,
            'project_id'    => $data['project_id'] ?? null,
            'completed_at'  => (isset($data['status']) && $data['status'] === 'done') ? now() : null,
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
            'status'        => 'sometimes|in:not_done,done',
            'assigned_date' => 'nullable|date',
            'project_id'    => 'nullable|integer|exists:projects,id',
        ]);

        if (isset($data['status'])) {
            if ($data['status'] === 'done' && $task->status !== 'done') {
                $data['completed_at'] = now();
            } elseif ($data['status'] !== 'done') {
                $data['completed_at'] = null;
            }
        }

        $task->update($data);

        return response()->json($this->format($task->fresh('project')));
    }

    /**
     * GET /api/tasks/{id}
     */
    public function show(int $id): JsonResponse
    {
        $task = Task::with('project')->findOrFail($id);
        return response()->json($this->format($task));
    }

    /**
     * PATCH /api/tasks/{id}/cycle  — not_done <-> done
     */
    public function cycle(int $id): JsonResponse
    {
        $task = Task::findOrFail($id);

        $next = $task->status === 'done' ? 'not_done' : 'done';

        $updateData = [
            'status' => $next,
            'completed_at' => $next === 'done' ? now() : null,
        ];

        $task->update($updateData);

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
            'completed_at'  => $task->completed_at?->toISOString(),
        ];
    }
}
