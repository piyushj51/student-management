import { connection } from 'next/server';
import { jsonResponse } from '@/lib/http';
import { getDashboardStats } from '@/lib/students';

/** GET /api/stats — aggregated numbers for the dashboard. */
export async function GET() {
  await connection();
  return jsonResponse(getDashboardStats());
}
