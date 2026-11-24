<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminActivityLogController extends Controller
{
    public function index(): Response
    {
        $today = now()->startOfDay();

        $stats = [
            'total_logs' => ActivityLog::count(),
            'today_logs' => ActivityLog::where('created_at', '>=', $today)->count(),
            'vector_logs' => ActivityLog::where('action', 'vectorize')->count(),
            'publish_logs' => ActivityLog::where('action', 'publish')->count(),
        ];

        $actions = ActivityLog::select('action')
            ->distinct()
            ->orderBy('action')
            ->pluck('action');

        return Inertia::render('admin/activity-log/admin-activity-log-index', [
            'title' => 'Activity Logs',
            'stats' => $stats,
            'actions' => $actions,
        ]);
    }

    public function getData(Request $request): JsonResponse
    {
        $perPage = max(5, min(100, (int) $request->input('per_page', 15)));
        $search = trim((string) $request->input('search', ''));
        $action = trim((string) $request->input('action', ''));
        $fromDate = $request->input('from_date');
        $toDate = $request->input('to_date');

        $query = ActivityLog::with([
            'user' => fn ($q) => $q->select('id', 'fname', 'lname', 'mname', 'username', 'role')
        ])->latest('id');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                    ->orWhere('action', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($uq) use ($search) {
                        $uq->where('fname', 'like', "%{$search}%")
                            ->orWhere('lname', 'like', "%{$search}%")
                            ->orWhere('username', 'like', "%{$search}%");
                    });
            });
        }

        if ($action !== '' && $action !== 'all') {
            $query->where('action', $action);
        }

        if ($fromDate) {
            $query->whereDate('created_at', '>=', $fromDate);
        }

        if ($toDate) {
            $query->whereDate('created_at', '<=', $toDate);
        }

        $paginated = $query->paginate($perPage);

        return response()->json($paginated);
    }
}
