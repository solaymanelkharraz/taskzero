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
        $ideas = Idea::with('category')->orderByDesc('created_at')->get()->map(function($idea) {
            return [
                'id' => $idea->id,
                'content' => $idea->content,
                'category_id' => $idea->category_id,
                'category_name' => $idea->category?->name,
                'created_at' => $idea->created_at?->toISOString()
            ];
        });
        return response()->json($ideas);
    }

    /**
     * POST /api/ideas
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'content'  => 'required|string',
            'category_id' => 'nullable|integer|exists:idea_categories,id',
        ]);

        $idea = Idea::create($data);

        return response()->json($idea->load('category'), 201);
    }

    /**
     * PUT /api/ideas/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $idea = Idea::findOrFail($id);

        $data = $request->validate([
            'content'  => 'sometimes|string',
            'category_id' => 'nullable|integer|exists:idea_categories,id',
        ]);

        $idea->update($data);

        return response()->json($idea->load('category'));
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
            'status'        => 'not_done',
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
