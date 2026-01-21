import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ScopusEntry {
  "dc:title"?: string;
  "dc:creator"?: string;
  "prism:publicationName"?: string;
  "prism:coverDate"?: string;
  "prism:doi"?: string;
  "citedby-count"?: string;
  "author"?: Array<{ authname?: string }>;
}

interface ParsedPaper {
  title: string;
  authors: string;
  date: string;
  journal?: string;
  doi?: string;
  citations?: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const scopusApiKey = Deno.env.get("SCOPUS_API_KEY");

    if (!scopusApiKey) {
      console.error("SCOPUS_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Scopus API not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { scopusUrl } = await req.json();

    if (!scopusUrl) {
      return new Response(
        JSON.stringify({ error: "Scopus URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Fetching Scopus data for user ${user.id}: ${scopusUrl}`);

    // Extract author ID from Scopus URL
    // Examples:
    // https://www.scopus.com/authid/detail.uri?authorId=12345678
    // https://www.scopus.com/author/authid/detail.uri?authorId=12345678
    let authorId: string | null = null;

    const authorIdMatch = scopusUrl.match(/authorId=(\d+)/i);
    if (authorIdMatch) {
      authorId = authorIdMatch[1];
    }

    if (!authorId) {
      // Try to extract from other URL patterns
      const otherPatterns = [
        /\/author\/(\d+)/i,
        /au-id=(\d+)/i,
      ];
      for (const pattern of otherPatterns) {
        const match = scopusUrl.match(pattern);
        if (match) {
          authorId = match[1];
          break;
        }
      }
    }

    if (!authorId) {
      return new Response(
        JSON.stringify({ error: "Could not extract author ID from Scopus URL. Please use a URL with authorId parameter." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Extracted Scopus author ID: ${authorId}`);

    // Fetch publications from Scopus API
    const scopusApiUrl = `https://api.elsevier.com/content/search/scopus?query=AU-ID(${authorId})&count=50&sort=-coverDate`;
    
    const scopusResponse = await fetch(scopusApiUrl, {
      headers: {
        "Accept": "application/json",
        "X-ELS-APIKey": scopusApiKey,
      },
    });

    if (!scopusResponse.ok) {
      const errorText = await scopusResponse.text();
      console.error("Scopus API error:", scopusResponse.status, errorText);
      
      if (scopusResponse.status === 401 || scopusResponse.status === 403) {
        return new Response(
          JSON.stringify({ error: "Scopus API authentication failed. Please check API key." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (scopusResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Scopus API rate limit reached. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Failed to fetch data from Scopus" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const scopusData = await scopusResponse.json();
    const entries: ScopusEntry[] = scopusData["search-results"]?.entry || [];
    
    console.log(`Found ${entries.length} publications from Scopus`);

    // Parse the publications
    const papers: ParsedPaper[] = entries
      .filter((entry) => entry["dc:title"]) // Filter out entries without titles
      .map((entry) => {
        // Build authors string
        let authors = entry["dc:creator"] || "";
        if (entry.author && entry.author.length > 0) {
          authors = entry.author.map((a) => a.authname || "").filter(Boolean).join(", ");
        }

        // Parse date
        const coverDate = entry["prism:coverDate"] || "";
        const year = coverDate ? coverDate.split("-")[0] : "";

        return {
          title: entry["dc:title"] || "",
          authors: authors,
          date: year,
          journal: entry["prism:publicationName"] || undefined,
          doi: entry["prism:doi"] || undefined,
          citations: entry["citedby-count"] ? parseInt(entry["citedby-count"], 10) : undefined,
        };
      });

    // Update the user's profile with parsed publications
    if (papers.length > 0) {
      // Transform to the format expected by the profile
      const researchPapers = papers.map((p) => ({
        title: p.title,
        authors: p.authors,
        date: p.date,
      }));

      const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
      const { error: updateError } = await serviceClient
        .from("profiles")
        .update({ 
          research_papers: researchPapers,
          scopus_link: scopusUrl 
        })
        .eq("id", user.id);

      if (updateError) {
        console.error("Profile update error:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to update profile with publications" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Updated profile for user ${user.id} with ${papers.length} publications`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        authorId,
        publications: papers,
        count: papers.length
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Unexpected error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
