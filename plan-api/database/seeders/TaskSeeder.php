<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TaskSeeder extends Seeder
{
    public function run(): void
    {
        // Skip if data already exists
        if (DB::table('tasks')->count() > 0) {
            $this->command->warn('tasks table already has data — skipping seed.');
            return;
        }

        DB::table('tasks')->insert([
            ['id'=>1,  'title'=>'Presentation fehama 100%',            'status'=>'done',        'assigned_date'=>'2026-03-11', 'project_id'=>null, 'created_at'=>now()],
            ['id'=>2,  'title'=>'diagrams de project',                 'status'=>'done',        'assigned_date'=>'2026-03-12', 'project_id'=>null, 'created_at'=>now()],
            ['id'=>3,  'title'=>'pfe',                                 'status'=>'todo',        'assigned_date'=>null,         'project_id'=>null, 'created_at'=>now()],
            ['id'=>4,  'title'=>'cc efm after the vacation',           'status'=>'done',        'assigned_date'=>'2026-03-13', 'project_id'=>null, 'created_at'=>now()],
            ['id'=>5,  'title'=>'english cc',                          'status'=>'done',        'assigned_date'=>'2026-03-13', 'project_id'=>null, 'created_at'=>now()],
            ['id'=>6,  'title'=>'the hackaton',                        'status'=>'todo',        'assigned_date'=>null,         'project_id'=>null, 'created_at'=>now()],
            ['id'=>7,  'title'=>'tp docker',                           'status'=>'done',        'assigned_date'=>'2026-03-10', 'project_id'=>null, 'created_at'=>now()],
            ['id'=>8,  'title'=>'soft skills tp',                      'status'=>'done',        'assigned_date'=>'2026-03-10', 'project_id'=>null, 'created_at'=>now()],
            ['id'=>9,  'title'=>'sprint laravel',                      'status'=>'done',        'assigned_date'=>'2026-03-10', 'project_id'=>null, 'created_at'=>now()],
            ['id'=>10, 'title'=>'change quick announce to vercel',     'status'=>'todo',        'assigned_date'=>null,         'project_id'=>null, 'created_at'=>now()],
            ['id'=>11, 'title'=>'Hdar me3a osad',                      'status'=>'done',        'assigned_date'=>'2026-03-10', 'project_id'=>null, 'created_at'=>now()],
            ['id'=>12, 'title'=>'make the portfolio more better',      'status'=>'todo',        'assigned_date'=>null,         'project_id'=>null, 'created_at'=>now()],
            ['id'=>13, 'title'=>'pfe design',                          'status'=>'done',        'assigned_date'=>'2026-03-18', 'project_id'=>null, 'created_at'=>now()],
            ['id'=>14, 'title'=>'softskills cc3',                      'status'=>'done',        'assigned_date'=>'2026-03-28', 'project_id'=>null, 'created_at'=>now()],
            ['id'=>15, 'title'=>'my maze video and finish it',         'status'=>'done',        'assigned_date'=>'2026-05-02', 'project_id'=>null, 'created_at'=>now()],
            ['id'=>16, 'title'=>'ai agent',                            'status'=>'todo',        'assigned_date'=>null,         'project_id'=>null, 'created_at'=>now()],
            ['id'=>17, 'title'=>'efm soft skills',                     'status'=>'done',        'assigned_date'=>'2026-04-03', 'project_id'=>null, 'created_at'=>now()],
            ['id'=>18, 'title'=>'pfe agile',                           'status'=>'done',        'assigned_date'=>'2026-04-04', 'project_id'=>null, 'created_at'=>now()],
            ['id'=>20, 'title'=>'find the design',                     'status'=>'done',        'assigned_date'=>'2026-04-07', 'project_id'=>null, 'created_at'=>now()],
            ['id'=>22, 'title'=>'laravel efm',                         'status'=>'done',        'assigned_date'=>'2026-04-20', 'project_id'=>null, 'created_at'=>now()],
            ['id'=>23, 'title'=>'start laravel and make the good map', 'status'=>'done',        'assigned_date'=>'2026-04-15', 'project_id'=>null, 'created_at'=>now()],
            ['id'=>26, 'title'=>'laravel moraja3a',                    'status'=>'done',        'assigned_date'=>'2026-04-16', 'project_id'=>null, 'created_at'=>now()],
            ['id'=>27, 'title'=>'tp excel',                            'status'=>'done',        'assigned_date'=>'2026-04-16', 'project_id'=>null, 'created_at'=>now()],
            ['id'=>28, 'title'=>'laravel morja3a',                     'status'=>'done',        'assigned_date'=>'2026-04-17', 'project_id'=>null, 'created_at'=>now()],
            ['id'=>29, 'title'=>'hdar me3a nabim',                     'status'=>'done',        'assigned_date'=>'2026-04-17', 'project_id'=>null, 'created_at'=>now()],
            ['id'=>30, 'title'=>'laravel moroja3a',                    'status'=>'done',        'assigned_date'=>'2026-04-18', 'project_id'=>null, 'created_at'=>now()],
            ['id'=>32, 'title'=>'laravel finish',                      'status'=>'done',        'assigned_date'=>'2026-04-19', 'project_id'=>null, 'created_at'=>now()],
            ['id'=>33, 'title'=>'efm calm',                            'status'=>'done',        'assigned_date'=>'2026-04-21', 'project_id'=>null, 'created_at'=>now()],
            ['id'=>34, 'title'=>'free day paper',                      'status'=>'todo',        'assigned_date'=>null,         'project_id'=>null, 'created_at'=>now()],
            ['id'=>36, 'title'=>'pfe front end',                       'status'=>'in_progress', 'assigned_date'=>now()->toDateString(), 'project_id'=>null, 'created_at'=>now()],
            ['id'=>37, 'title'=>'laravel finish',                      'status'=>'done',        'assigned_date'=>'2026-04-20', 'project_id'=>null, 'created_at'=>now()],
            ['id'=>38, 'title'=>'make this site more fucking better',  'status'=>'todo',        'assigned_date'=>null,         'project_id'=>null, 'created_at'=>now()],
        ]);

        // Reset AUTO_INCREMENT to 39 to match the original dump
        DB::statement('ALTER TABLE tasks AUTO_INCREMENT = 39');

        $this->command->info('✓ 32 tasks seeded.');
    }
}
