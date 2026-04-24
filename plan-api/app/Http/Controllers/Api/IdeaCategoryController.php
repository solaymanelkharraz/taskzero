<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\IdeaCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class IdeaCategoryController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(IdeaCategory::orderBy('name')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255|unique:idea_categories,name',
        ]);

        $category = IdeaCategory::create($data);

        return response()->json($category, 201);
    }
}
