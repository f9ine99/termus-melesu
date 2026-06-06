import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function POST(request: NextRequest) {
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 })
  }

  if (!supabaseServiceRoleKey) {
    return NextResponse.json(
      { error: "Account deletion is not configured on the server" },
      { status: 503 },
    )
  }

  const authHeader = request.headers.get("Authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const accessToken = authHeader.slice("Bearer ".length).trim()
  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: userData, error: userError } = await userClient.auth.getUser(accessToken)
  if (userError || !userData.user) {
    return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 })
  }

  const userId = userData.user.id
  const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  try {
    const { error: transactionsError } = await adminClient
      .from("transactions")
      .delete()
      .eq("user_id", userId)

    if (transactionsError) throw transactionsError

    const { error: customersError } = await adminClient
      .from("customers")
      .delete()
      .eq("user_id", userId)

    if (customersError) throw customersError

    const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(userId)
    if (deleteUserError) throw deleteUserError

    console.info(
      JSON.stringify({
        event: "account_delete_completed",
        userId,
        timestamp: new Date().toISOString(),
      }),
    )

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete account"
    console.error(
      JSON.stringify({
        event: "account_delete_failed",
        userId,
        timestamp: new Date().toISOString(),
        error: message,
      }),
    )
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
