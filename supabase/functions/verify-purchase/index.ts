import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

const APPLE_VERIFY_URL = Deno.env.get('NODE_ENV') === 'production'
    ? "https://buy.itunes.apple.com/verifyReceipt"
    : "https://sandbox.itunes.apple.com/verifyReceipt";

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST',
                'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            }
        })
    }

    try {
        const { receipt, platform, userId } = await req.json()

        if (!receipt || !userId) {
            return new Response(JSON.stringify({ error: "Missing receipt or userId" }), {
                status: 400,
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            })
        }

        console.log(`[verify-purchase] Verifying ${platform} purchase for user ${userId}`)

        let isValid = false;

        if (platform === 'ios') {
            isValid = await verifyApplePurchase(receipt);
        } else if (platform === 'android') {
            isValid = await verifyGooglePurchase(receipt);
        } else {
            // Fallback for simple testing if needed, though typically one of the above
            isValid = !!receipt;
        }

        if (!isValid) {
            return new Response(JSON.stringify({ error: "Invalid receipt" }), {
                status: 401,
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            })
        }

        // Update user to PRO
        const { error } = await supabaseAdmin
            .from('user_profiles')
            .update({
                subscription_status: 'pro',
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)

        if (error) throw error

        return new Response(JSON.stringify({ success: true }), {
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        })

    } catch (error) {
        console.error("[verify-purchase] Error:", error.message)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        })
    }
})

async function verifyApplePurchase(receipt: string): Promise<boolean> {
    const password = Deno.env.get('APPLE_SHARED_SECRET');
    if (!password) {
        console.warn("[verify-purchase] APPLE_SHARED_SECRET not set, allowing receipt in development mode");
        return true;
    }

    try {
        const response = await fetch(APPLE_VERIFY_URL, {
            method: 'POST',
            body: JSON.stringify({ "receipt-data": receipt, password }),
        });
        const data = await response.json();
        return data.status === 0;
    } catch (err) {
        console.error("[verify-purchase] Apple verification request failed:", err);
        return false;
    }
}

async function verifyGooglePurchase(receipt: string): Promise<boolean> {
    // Google verification typically requires OAuth2 and a more complex flow 
    // involving the Google Play Developer API.
    // For now, we provide the structure and allow if it looks like a valid token.
    console.log("[verify-purchase] Google verification requested (Token received)");

    // In production, you'd use something like:
    // https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.subscriptions/get

    return true; // Simplified for now until service account is configured
}

