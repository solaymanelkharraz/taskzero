<?php

use App\Http\Controllers\Api\IdeaController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\SweepController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\WeekController;
use Illuminate\Support\Facades\Route;

// ── Tasks ────────────────────────────────────────────────────
Route::get('/tasks',              [TaskController::class, 'index']);
Route::post('/tasks',             [TaskController::class, 'store']);
Route::get('/tasks/{id}',         [TaskController::class, 'show']);
Route::match(['put', 'patch'], '/tasks/{id}', [TaskController::class, 'update']);
Route::patch('/tasks/{id}/cycle', [TaskController::class, 'cycle']);
Route::delete('/tasks/{id}',      [TaskController::class, 'destroy']);

// ── Projects ─────────────────────────────────────────────────
Route::get('/projects',          [ProjectController::class, 'index']);
Route::post('/projects',         [ProjectController::class, 'store']);
Route::delete('/projects/{id}',  [ProjectController::class, 'destroy']);

// ── Ideas (Brain Dump) ───────────────────────────────────────
Route::get('/ideas',                     [IdeaController::class, 'index']);
Route::post('/ideas',                    [IdeaController::class, 'store']);
Route::put('/ideas/{id}',                [IdeaController::class, 'update']);
Route::post('/ideas/{id}/convert',       [IdeaController::class, 'convert']);
Route::delete('/ideas/{id}',             [IdeaController::class, 'destroy']);

// ── Idea Categories ──────────────────────────────────────────
Route::get('/idea-categories',           [\App\Http\Controllers\Api\IdeaCategoryController::class, 'index']);
Route::post('/idea-categories',          [\App\Http\Controllers\Api\IdeaCategoryController::class, 'store']);

// ── Habits ───────────────────────────────────────────────────
Route::get('/habits',                    [\App\Http\Controllers\Api\HabitController::class, 'index']);
Route::post('/habits',                   [\App\Http\Controllers\Api\HabitController::class, 'store']);
Route::post('/habits/{id}/log',          [\App\Http\Controllers\Api\HabitController::class, 'log']);

// ── Events ───────────────────────────────────────────────────
Route::get('/events',                    [\App\Http\Controllers\Api\EventController::class, 'index']);
Route::post('/events',                   [\App\Http\Controllers\Api\EventController::class, 'store']);

// ── Misc ─────────────────────────────────────────────────────
Route::get('/week',   [WeekController::class, 'index']);
Route::post('/sweep', SweepController::class);
