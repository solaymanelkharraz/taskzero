<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class SetupSchema extends Command
{
    protected $signature   = 'db:setup';
    protected $description = 'Create TaskZero tables and seed initial data on TiDB Cloud';

    public function handle(): int
    {
        $this->info('Creating tables...');

        // ── projects ─────────────────────────────────────────
        DB::statement("
            CREATE TABLE IF NOT EXISTS `projects` (
              `id`          INT(11)      NOT NULL AUTO_INCREMENT,
              `name`        VARCHAR(120) NOT NULL,
              `description` TEXT         DEFAULT NULL,
              `created_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
              PRIMARY KEY (`id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
        $this->line('  ✓ projects');

        // ── tasks ─────────────────────────────────────────────
        DB::statement("
            CREATE TABLE IF NOT EXISTS `tasks` (
              `id`            INT(11)      NOT NULL AUTO_INCREMENT,
              `title`         VARCHAR(255) NOT NULL,
              `status`        VARCHAR(20)  NOT NULL DEFAULT 'todo',
              `assigned_date` DATE         DEFAULT NULL,
              `project_id`    INT(11)      DEFAULT NULL,
              `created_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
              PRIMARY KEY (`id`),
              KEY `idx_assigned_date` (`assigned_date`),
              KEY `idx_status`        (`status`),
              KEY `idx_project_id`    (`project_id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
        $this->line('  ✓ tasks');

        // ── ideas ─────────────────────────────────────────────
        DB::statement("
            CREATE TABLE IF NOT EXISTS `ideas` (
              `id`         INT(11)   NOT NULL AUTO_INCREMENT,
              `content`    TEXT      NOT NULL,
              `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
              PRIMARY KEY (`id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
        $this->line('  ✓ ideas');

        // ── Seed tasks ────────────────────────────────────────
        $this->info('Seeding tasks...');

        $exists = DB::table('tasks')->count();
        if ($exists > 0) {
            $this->warn("  tasks table already has {$exists} rows — skipping seed.");
        } else {
            DB::table('tasks')->insert([
                ['id'=>1,  'title'=>'Presentation fehama 100%',            'status'=>'done',        'assigned_date'=>'2026-03-11', 'project_id'=>null],
                ['id'=>2,  'title'=>'diagrams de project',                 'status'=>'done',        'assigned_date'=>'2026-03-12', 'project_id'=>null],
                ['id'=>3,  'title'=>'pfe',                                 'status'=>'todo',        'assigned_date'=>null,         'project_id'=>null],
                ['id'=>4,  'title'=>'cc efm after the vacation',           'status'=>'done',        'assigned_date'=>'2026-03-13', 'project_id'=>null],
                ['id'=>5,  'title'=>'english cc',                          'status'=>'done',        'assigned_date'=>'2026-03-13', 'project_id'=>null],
                ['id'=>6,  'title'=>'the hackaton',                        'status'=>'todo',        'assigned_date'=>null,         'project_id'=>null],
                ['id'=>7,  'title'=>'tp docker',                           'status'=>'done',        'assigned_date'=>'2026-03-10', 'project_id'=>null],
                ['id'=>8,  'title'=>'soft skills tp',                      'status'=>'done',        'assigned_date'=>'2026-03-10', 'project_id'=>null],
                ['id'=>9,  'title'=>'sprint laravel',                      'status'=>'done',        'assigned_date'=>'2026-03-10', 'project_id'=>null],
                ['id'=>10, 'title'=>'change quick announce to vercel',     'status'=>'todo',        'assigned_date'=>null,         'project_id'=>null],
                ['id'=>11, 'title'=>'Hdar me3a osad',                      'status'=>'done',        'assigned_date'=>'2026-03-10', 'project_id'=>null],
                ['id'=>12, 'title'=>'make the portfolio more better',      'status'=>'todo',        'assigned_date'=>null,         'project_id'=>null],
                ['id'=>13, 'title'=>'pfe design',                          'status'=>'done',        'assigned_date'=>'2026-03-18', 'project_id'=>null],
                ['id'=>14, 'title'=>'softskills cc3',                      'status'=>'done',        'assigned_date'=>'2026-03-28', 'project_id'=>null],
                ['id'=>15, 'title'=>'my maze video and finish it',         'status'=>'done',        'assigned_date'=>'2026-05-02', 'project_id'=>null],
                ['id'=>16, 'title'=>'ai agent',                            'status'=>'todo',        'assigned_date'=>null,         'project_id'=>null],
                ['id'=>17, 'title'=>'efm soft skills',                     'status'=>'done',        'assigned_date'=>'2026-04-03', 'project_id'=>null],
                ['id'=>18, 'title'=>'pfe agile',                           'status'=>'done',        'assigned_date'=>'2026-04-04', 'project_id'=>null],
                ['id'=>20, 'title'=>'find the design',                     'status'=>'done',        'assigned_date'=>'2026-04-07', 'project_id'=>null],
                ['id'=>22, 'title'=>'laravel efm',                         'status'=>'done',        'assigned_date'=>'2026-04-20', 'project_id'=>null],
                ['id'=>23, 'title'=>'start laravel and make the good map', 'status'=>'done',        'assigned_date'=>'2026-04-15', 'project_id'=>null],
                ['id'=>26, 'title'=>'laravel moraja3a',                    'status'=>'done',        'assigned_date'=>'2026-04-16', 'project_id'=>null],
                ['id'=>27, 'title'=>'tp excel',                            'status'=>'done',        'assigned_date'=>'2026-04-16', 'project_id'=>null],
                ['id'=>28, 'title'=>'laravel morja3a',                     'status'=>'done',        'assigned_date'=>'2026-04-17', 'project_id'=>null],
                ['id'=>29, 'title'=>'hdar me3a nabim',                     'status'=>'done',        'assigned_date'=>'2026-04-17', 'project_id'=>null],
                ['id'=>30, 'title'=>'laravel moroja3a',                    'status'=>'done',        'assigned_date'=>'2026-04-18', 'project_id'=>null],
                ['id'=>32, 'title'=>'laravel finish',                      'status'=>'done',        'assigned_date'=>'2026-04-19', 'project_id'=>null],
                ['id'=>33, 'title'=>'efm calm',                            'status'=>'done',        'assigned_date'=>'2026-04-21', 'project_id'=>null],
                ['id'=>34, 'title'=>'free day paper',                      'status'=>'todo',        'assigned_date'=>null,         'project_id'=>null],
                ['id'=>36, 'title'=>'pfe front end',                       'status'=>'in_progress', 'assigned_date'=>date('Y-m-d'),'project_id'=>null],
                ['id'=>37, 'title'=>'laravel finish ',                     'status'=>'done',        'assigned_date'=>'2026-04-20', 'project_id'=>null],
                ['id'=>38, 'title'=>'make this site more fucking better',  'status'=>'todo',        'assigned_date'=>null,         'project_id'=>null],
            ]);
            DB::statement('ALTER TABLE `tasks` AUTO_INCREMENT = 39');
            $this->line('  ✓ 32 tasks seeded');
        }

        $this->info('Done! TaskZero database is ready.');
        return Command::SUCCESS;
    }
}
