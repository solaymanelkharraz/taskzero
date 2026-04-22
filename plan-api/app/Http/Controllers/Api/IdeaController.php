<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Idea;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class IdeaController extends Controller
{
    /**
     * GET /api/ideas
     */
    public function index(): JsonResponse
    {
        $ideas = Idea::orderByDesc('created_at')->get();
        return response()->json($ideas);
    }

    /**
     * POST /api/ideas
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'content' => 'required|string',
        ]);

        $idea = Idea::create($data);

        return response()->json($idea, 201);
    }

    /**
     * POST /api/ideas/{id}/convert  — Convert idea to task and delete idea
     */
    public function convert(Request $request, int $id): JsonResponse
    {
        $idea = Idea::findOrFail($id);

        $data = $request->validate([
            'title'         => 'required|string|max:255',
            'assigned_date' => 'nullable|date',
            'project_id'    => 'nullable|integer|exists:projects,id',
        ]);

        $task = Task::create([
            'title'         => $data['title'],
            'status'        => 'todo',
            'assigned_date' => $data['assigned_date'] ?? null,
            'project_id'    => $data['project_id'] ?? null,
        ]);

        $idea->delete();

        return response()->json([
            'message' => 'Idea converted to task.',
            'task'    => $task,
        ], 201);
    }

    /**
     * DELETE /api/ideas/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        Idea::findOrFail($id)->delete();
        return response()->json(['message' => 'Idea deleted.']);
    }
}
