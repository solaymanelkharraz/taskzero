<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('name', 120);
            $table->text('description')->nullable();
            $table->timestamp('created_at')->useCurrent();
            // No updated_at — matches the existing schema
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
