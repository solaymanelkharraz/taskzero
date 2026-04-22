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
        $projects = Project::withCount([
            'tasks as total_tasks',
            'tasks as done_tasks' => function ($query) {
                $query->where('status', 'done');
            }
        ])->orderBy('name')->get()->map(fn($p) => $this->format($p));

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
        ]);

        $project = Project::create($data);

        return response()->json($this->format($project), 201);
    }

    /**
     * DELETE /api/projects/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $project = Project::findOrFail($id);
        // Unlink tasks (set project_id = null)
        $project->tasks()->update(['project_id' => null]);
        $project->delete();

        return response()->json(['message' => 'Project deleted.']);
    }

    // ── Format helper ─────────────────────────────────────────
    private function format(Project $project): array
    {
        $total = $project->total_tasks ?? $project->tasks()->count();
        $done  = $project->done_tasks ?? $project->tasks()->where('status', 'done')->count();

        $stats = [
            'total' => $total,
            'done'  => $done,
            'pct'   => $total > 0 ? round($done / $total * 100) : 0,
        ];

        return [
            'id'          => $project->id,
            'name'        => $project->name,
            'description' => $project->description,
            'created_at'  => $project->created_at?->toISOString(),
            'stats'       => $stats,
        ];
    }
}
