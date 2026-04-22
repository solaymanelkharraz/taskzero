<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Using raw SQL so it's safe even if the ideas table already exists in TiDB
        DB::statement("
            CREATE TABLE IF NOT EXISTS `ideas` (
              `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
              `content`    TEXT            NOT NULL,
              `created_at` TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
              PRIMARY KEY (`id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
    }

    public function down(): void
    {
        DB::statement('DROP TABLE IF EXISTS `ideas`');
    }
};
