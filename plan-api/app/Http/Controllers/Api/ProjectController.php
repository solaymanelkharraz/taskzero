<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    /**
     * GET /api/projects
     */
    public function index(): JsonResponse
    {
        $projects = Project::whereNull('completed_at')
            ->with(['tasks' => function ($query) {
                $query->orderBy('created_at', 'desc');
            }])->withCount([
                'tasks as total_tasks',
                'tasks as done_tasks' => function ($query) {
                    $query->where('status', 'done');
                }
            ])->orderByRaw("FIELD(priority, 'high', 'medium', 'low')")
            ->orderBy('name')
            ->get()
            ->map(fn($p) => $this->format($p));

        return response()->json($projects);
    }

    /**
     * GET /api/projects/{id}
     */
    public function show(int $id): JsonResponse
    {
        $project = Project::with(['tasks' => function ($query) {
            $query->orderBy('created_at', 'desc');
        }])->withCount([
            'tasks as total_tasks',
            'tasks as done_tasks' => function ($query) {
                $query->where('status', 'done');
            }
        ])->findOrFail($id);

        return response()->json($this->format($project));
    }

    /**
     * POST /api/projects/{id}/complete
     */
    public function complete(Request $request, int $id): JsonResponse
    {
        $project = Project::findOrFail($id);

        $data = $request->validate([
            'completion_link'    => 'nullable|string',
            'completion_summary' => 'nullable|string',
        ]);

        $project->update([
            'completed_at'       => now(),
            'completion_link'    => $data['completion_link'],
            'completion_summary' => $data['completion_summary'],
        ]);

        return response()->json($this->format($project->load('tasks')));
    }

    /**
     * GET /api/projects/history
     */
    public function history(): JsonResponse
    {
        $projects = Project::whereNotNull('completed_at')
            ->with(['tasks'])
            ->withCount([
                'tasks as total_tasks',
                'tasks as done_tasks' => function ($query) {
                    $query->where('status', 'done');
                }
            ])
            ->orderBy('completed_at', 'desc')
            ->get()
            ->map(fn($p) => $this->format($p));

        return response()->json($projects);
    }

    /**
     * POST /api/projects
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'        => 'required|string|max:120',
            'description' => 'nullable|string',
            'priority'    => 'nullable|in:high,medium,low',
        ]);

        $data['priority'] = $data['priority'] ?? 'medium';

        $project = Project::create($data);

        return response()->json($this->format($project->load('tasks')), 201);
    }

    /**
     * PUT /api/projects/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $project = Project::findOrFail($id);

        $data = $request->validate([
            'name'        => 'sometimes|required|string|max:120',
            'description' => 'nullable|string',
            'priority'    => 'nullable|in:high,medium,low',
        ]);

        $project->update($data);

        return response()->json($this->format($project->load('tasks')));
    }

    /**
     * DELETE /api/projects/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $project = Project::findOrFail($id);
        $project->tasks()->update(['project_id' => null]);
        $project->delete();

        return response()->json(['message' => 'Project deleted.']);
    }

    // ── Format helper ─────────────────────────────────────────
    private function format(Project $project): array
    {
        $total = $project->total_tasks ?? $project->tasks()->count();
        $done  = $project->done_tasks  ?? $project->tasks()->where('status', 'done')->count();

        $stats = [
            'total' => $total,
            'done'  => $done,
            'pct'   => $total > 0 ? round($done / $total * 100) : 0,
        ];

        $lastActivity = $project->tasks->first()?->created_at?->toISOString() ?? null;

        return [
            'id'                 => $project->id,
            'name'               => $project->name,
            'description'        => $project->description,
            'priority'           => $project->priority ?? 'medium',
            'created_at'         => $project->created_at?->toISOString(),
            'completed_at'       => $project->completed_at?->toISOString(),
            'completion_link'    => $project->completion_link,
            'completion_summary' => $project->completion_summary,
            'stats'              => $stats,
            'tasks'              => $project->tasks->map(fn($t) => [
                'id'            => $t->id,
                'title'         => $t->title,
                'status'        => $t->status,
                'assigned_date' => $t->assigned_date?->format('Y-m-d'),
                'created_at'    => $t->created_at?->toISOString(),
                'project_id'    => $t->project_id,
            ]),
            'last_activity'      => $lastActivity,
        ];
    }
}
