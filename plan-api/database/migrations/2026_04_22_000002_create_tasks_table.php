<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->string('title', 255);
            $table->string('status', 20)->default('todo');
            $table->date('assigned_date')->nullable();
            $table->unsignedBigInteger('project_id')->nullable();
            $table->timestamp('created_at')->useCurrent();
            // No updated_at — matches the existing schema

            $table->index('assigned_date', 'idx_assigned_date');
            $table->index('status',        'idx_status');
            $table->index('project_id',    'idx_project_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
