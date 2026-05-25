<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Auth;

class RoleMiddleware
{
    /**
     * Ensure the authenticated user has one of the required roles.
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        //$user = $request->user();
        $user = Auth::user();

        if (! $user) {
            abort(401);
        }

        $userRole = strtolower((string) $user->role);
        $allowedRoles = array_map(static fn (string $role): string => strtolower($role), $roles);

        if (! in_array($userRole, $allowedRoles, true)) {
            abort(403);
        }

        return $next($request);
    }
}
