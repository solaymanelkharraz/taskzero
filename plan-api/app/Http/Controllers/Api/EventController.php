<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EventController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Event::all());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'     => 'required|string|max:255',
            'category' => 'required|string|max:100',
            'date'     => 'required|date',
        ]);

        $event = Event::create($data);

        return response()->json($event, 201);
    }
}
