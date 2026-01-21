import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrcidWork {
  "work-summary"?: Array<{
    title?: { title?: { value?: string } };
    "publication-date"?: { year?: { value?: string } };
    "journal-title"?: { value?: string };
    "external-ids"?: {
      "external-id"?: Array<{
        "external-id-type"?: string;
        "external-id-value"?: string;
      }>;
    };
  }>;
}

interface ParsedPaper {
  title: string;
  authors: string;
  date: string;
  journal?: string;
  doi?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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

    const { orcidId } = await req.json();

    if (!orcidId) {
      return new Response(
        JSON.stringify({ error: "ORCID ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clean and validate ORCID format (XXXX-XXXX-XXXX-XXXX)
    const cleanOrcid = orcidId.replace(/[^0-9X-]/gi, "").toUpperCase();
    const orcidPattern = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;
    
    if (!orcidPattern.test(cleanOrcid)) {
      return new Response(
        JSON.stringify({ error: "Invalid ORCID format. Expected: XXXX-XXXX-XXXX-XXXX" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Fetching ORCID works for user ${user.id}: ${cleanOrcid}`);

    // Fetch works from ORCID public API (no API key required)
    const orcidApiUrl = `https://pub.orcid.org/v3.0/${cleanOrcid}/works`;
    
    const orcidResponse = await fetch(orcidApiUrl, {
      headers: {
        "Accept": "application/json",
      },
    });

    if (!orcidResponse.ok) {
      const errorText = await orcidResponse.text();
      console.error("ORCID API error:", orcidResponse.status, errorText);
      
      if (orcidResponse.status === 404) {
        return new Response(
          JSON.stringify({ error: "ORCID profile not found. Please check your ORCID ID." }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Failed to fetch data from ORCID" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const orcidData = await orcidResponse.json();
    const groups = orcidData.group || [];
    
    console.log(`Found ${groups.length} work groups from ORCID`);

    // Also fetch author name for better attribution
    let authorName = "";
    try {
      const personResponse = await fetch(`https://pub.orcid.org/v3.0/${cleanOrcid}/person`, {
        headers: { "Accept": "application/json" },
      });
      if (personResponse.ok) {
        const personData = await personResponse.json();
        const givenNames = personData.name?.["given-names"]?.value || "";
        const familyName = personData.name?.["family-name"]?.value || "";
        authorName = `${givenNames} ${familyName}`.trim();
      }
    } catch (e) {
      console.warn("Could not fetch author name:", e);
    }

    // Parse the publications (limit to 25 most recent)
    const papers: ParsedPaper[] = [];
    
    for (const group of groups.slice(0, 25)) {
      const workSummaries = (group as OrcidWork)["work-summary"] || [];
      if (workSummaries.length === 0) continue;
      
      const work = workSummaries[0]; // Take the first (primary) version
      
      const title = work.title?.title?.value;
      if (!title) continue;

      // Extract DOI from external IDs
      let doi: string | undefined;
      const externalIds = work["external-ids"]?.["external-id"] || [];
      for (const extId of externalIds) {
        if (extId["external-id-type"]?.toLowerCase() === "doi") {
          doi = extId["external-id-value"];
          break;
        }
      }

      const year = work["publication-date"]?.year?.value || "";
      const journal = work["journal-title"]?.value;

      papers.push({
        title,
        authors: authorName || "Author",
        date: year,
        journal: journal || undefined,
        doi: doi || undefined,
      });
    }

    console.log(`Parsed ${papers.length} publications from ORCID`);

    // Update the user's profile with parsed publications
    if (papers.length > 0) {
      const researchPapers = papers.map((p) => ({
        title: p.title,
        authors: p.authors,
        date: p.date,
        doi: p.doi,
        journal: p.journal,
      }));

      const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
      const { error: updateError } = await serviceClient
        .from("profiles")
        .update({ 
          research_papers: researchPapers,
          orcid_id: cleanOrcid
        })
        .eq("id", user.id);

      if (updateError) {
        console.error("Profile update error:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to update profile with publications" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Updated profile for user ${user.id} with ${papers.length} publications from ORCID`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        orcidId: cleanOrcid,
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
