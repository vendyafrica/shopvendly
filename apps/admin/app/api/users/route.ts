import { NextResponse } from "next/server";
import { adminService } from "@/features/super-admin/lib/admin-service";

/**
 * GET /api/users
 * Get all users (super-admin only)
 */
export async function GET() {
    try {
        // TODO: Add super-admin auth check
        const userList = await adminService.getAllUsers();
        return NextResponse.json(userList);
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }
}
