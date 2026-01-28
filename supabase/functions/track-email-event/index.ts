import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const messageId = url.searchParams.get("id");
    const eventType = url.searchParams.get("event"); // 'open' or 'click'
    const redirectUrl = url.searchParams.get("url");

    if (!messageId || !eventType) {
      console.error("Missing required parameters:", { messageId, eventType });
      return new Response("Missing parameters", { status: 400 });
    }

    console.log(`Tracking ${eventType} event for message: ${messageId}`);

    // Create Supabase client with service role for updating
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (eventType === "open") {
      // Update open tracking
      const { error } = await supabase
        .from("recruiter_messages")
        .update({
          open_count: supabase.rpc("increment_open_count", { message_id: messageId }),
          opened_at: new Date().toISOString(),
        })
        .eq("id", messageId);

      // Fallback: direct increment if RPC doesn't exist
      if (error) {
        console.log("Using fallback increment method");
        const { data: msg } = await supabase
          .from("recruiter_messages")
          .select("open_count, opened_at")
          .eq("id", messageId)
          .single();

        if (msg) {
          await supabase
            .from("recruiter_messages")
            .update({
              open_count: (msg.open_count || 0) + 1,
              opened_at: msg.opened_at || new Date().toISOString(),
            })
            .eq("id", messageId);
        }
      }

      console.log("Open event tracked successfully");

      // Return a 1x1 transparent pixel
      const pixel = new Uint8Array([
        0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00,
        0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21, 0xf9, 0x04, 0x01, 0x00,
        0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
        0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3b,
      ]);

      return new Response(pixel, {
        status: 200,
        headers: {
          "Content-Type": "image/gif",
          "Cache-Control": "no-store, no-cache, must-revalidate, private",
          ...corsHeaders,
        },
      });
    } else if (eventType === "click") {
      // Update click tracking
      const { data: msg } = await supabase
        .from("recruiter_messages")
        .select("click_count")
        .eq("id", messageId)
        .single();

      if (msg) {
        await supabase
          .from("recruiter_messages")
          .update({
            click_count: (msg.click_count || 0) + 1,
            last_clicked_at: new Date().toISOString(),
          })
          .eq("id", messageId);
      }

      console.log("Click event tracked successfully");

      // Redirect to the original URL
      if (redirectUrl) {
        return new Response(null, {
          status: 302,
          headers: {
            Location: decodeURIComponent(redirectUrl),
            ...corsHeaders,
          },
        });
      }

      return new Response("Click tracked", { status: 200, headers: corsHeaders });
    }

    return new Response("Unknown event type", { status: 400, headers: corsHeaders });
  } catch (error: any) {
    console.error("Error tracking email event:", error);
    // Return a pixel anyway to not break email display
    const pixel = new Uint8Array([
      0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00,
      0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21, 0xf9, 0x04, 0x01, 0x00,
      0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
      0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3b,
    ]);

    return new Response(pixel, {
      status: 200,
      headers: {
        "Content-Type": "image/gif",
        ...corsHeaders,
      },
    });
  }
};

serve(handler);
