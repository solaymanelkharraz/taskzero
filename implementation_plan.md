# Implementation Plan - Project Priority System

Integrate a priority system (High, Medium, Low) into the project management flow, including backend storage and frontend organization.

## User Review Required

> [!NOTE]
> I will use a string-based priority system ('high', 'medium', 'low') with 'medium' as the default.
> I will also add a `priority` update capability to the `ProjectController` as requested, even though the `update` method was previously missing.

## Proposed Changes

### Backend (Laravel 11)

---

#### [NEW] [2026_04_27_214500_add_priority_to_projects_table.php](file:///c:/backups/Desktop/projects/plan/plan-api/database/migrations/2026_04_27_214500_add_priority_to_projects_table.php)
- Create migration to add `priority` column (string, default: 'medium') to `projects` table.

#### [MODIFY] [Project.php](file:///c:/backups/Desktop/projects/plan/plan-api/app/Models/Project.php)
- Add `priority` to `$fillable` array.

#### [MODIFY] [ProjectController.php](file:///c:/backups/Desktop/projects/plan/plan-api/app/Http/Controllers/Api/ProjectController.php)
- Update `store` method to validate and save `priority`.
- Add `update` method to handle project updates including `priority`.
- Update `format` helper to include `priority` in the JSON response.

### Frontend (React)

---

#### [MODIFY] [Dashboard.jsx](file:///c:/backups/Desktop/projects/plan/plan-ui/src/pages/Dashboard.jsx)
- Update `newProject` state to include `priority: 'medium'`.
- Add Priority Selection (pill-style toggle) to the "Add Project" modal.
- In the "Projects" tab, group projects into:
    - **Critical Focus** (High)
    - **Standard** (Medium)
    - **Backlog** (Low)
- Add color-coded badges to project cards:
    - High: Neon Red/Pink (`#ff0055`)
    - Medium: Neon Orange/Yellow (`#ffaa00`)
    - Low: Neon Blue/Cyan (`#00f2ff`)
- Ensure React Query cache is invalidated after project creation/update.

## Verification Plan

### Automated Tests
- Run `php artisan migrate` to verify the migration.
- Manual API testing via `curl` or browser to verify `priority` is saved and returned.

### Manual Verification
- Open the "Add Project" modal and verify the priority selection works.
- Create projects with different priorities and check if they are correctly grouped in the "Projects" tab.
- Verify the neon badges appear with the correct colors.
- Confirm the list refreshes automatically after adding a project.
