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

interface CoAuthor {
  name: string;
  author_id?: string;
  affiliation?: string;
}

interface ScopusMetrics {
  h_index: number | null;
  document_count: number | null;
  citation_count: number | null;
  co_authors: CoAuthor[];
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

    // Fetch author metrics (h-index, document count, citations) from Author Retrieval API
    let scopusMetrics: ScopusMetrics = {
      h_index: null,
      document_count: null,
      citation_count: null,
      co_authors: [],
    };

    try {
      const authorApiUrl = `https://api.elsevier.com/content/author/author_id/${authorId}?view=ENHANCED`;
      const authorResponse = await fetch(authorApiUrl, {
        headers: {
          "Accept": "application/json",
          "X-ELS-APIKey": scopusApiKey,
        },
      });

      if (authorResponse.ok) {
        const authorData = await authorResponse.json();
        const authorProfile = authorData["author-retrieval-response"]?.[0];
        
        if (authorProfile) {
          // Extract h-index
          const hIndex = authorProfile["h-index"];
          scopusMetrics.h_index = hIndex ? parseInt(hIndex, 10) : null;

          // Extract document count
          const coredata = authorProfile["coredata"];
          if (coredata) {
            scopusMetrics.document_count = coredata["document-count"] 
              ? parseInt(coredata["document-count"], 10) 
              : null;
            scopusMetrics.citation_count = coredata["citation-count"]
              ? parseInt(coredata["citation-count"], 10)
              : null;
          }

          // Extract co-authors
          const coauthors = authorProfile["coauthor-count"];
          const coauthorList = authorProfile["author-profile"]?.["coauthor"]?.["coauthor-name"] || [];
          
          if (Array.isArray(coauthorList)) {
            scopusMetrics.co_authors = coauthorList.slice(0, 10).map((ca: Record<string, unknown>) => {
              const affiliationCurrent = ca["affiliation-current"] as Record<string, unknown> | undefined;
              return {
                name: (ca["indexed-name"] as string) || (ca["$"] as string) || "",
                author_id: ca["@auid"] as string || undefined,
                affiliation: affiliationCurrent?.["affiliation-name"] as string || undefined,
              };
            });
          }

          console.log(`Fetched author metrics: h-index=${scopusMetrics.h_index}, docs=${scopusMetrics.document_count}, citations=${scopusMetrics.citation_count}, co-authors=${scopusMetrics.co_authors.length}`);
        }
      } else {
        console.warn("Could not fetch author metrics:", authorResponse.status);
      }
    } catch (metricsError) {
      console.warn("Error fetching author metrics (continuing with publications):", metricsError);
    }

    // Fetch publications from Scopus API (use count=25 for basic API tier)
    const scopusApiUrl = `https://api.elsevier.com/content/search/scopus?query=AU-ID(${authorId})&count=25&sort=-coverDate`;
    
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

      // Handle service level limit errors
      if (scopusResponse.status === 400 && errorText.includes("Exceeds the maximum")) {
        return new Response(
          JSON.stringify({ error: "Scopus API limit exceeded. Your API key may have restricted access." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Failed to fetch data from Scopus. Please verify your API key has proper permissions." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    const scopusData = await scopusResponse.json();
    const entries: ScopusEntry[] = scopusData["search-results"]?.entry || [];
    const totalResults = parseInt(scopusData["search-results"]?.["opensearch:totalResults"] || "0", 10);
    
    console.log(`Found ${entries.length} publications from Scopus (total: ${totalResults})`);

    // Calculate total citations from publications
    let totalCitations = 0;
    const coAuthorMap = new Map<string, CoAuthor>();

    // Parse the publications
    const papers: ParsedPaper[] = entries
      .filter((entry) => entry["dc:title"]) // Filter out entries without titles
      .map((entry) => {
        // Build authors string and collect co-authors
        let authors = entry["dc:creator"] || "";
        if (entry.author && entry.author.length > 0) {
          authors = entry.author.map((a) => a.authname || "").filter(Boolean).join(", ");
          // Collect unique co-authors
          entry.author.forEach((a) => {
            const name = a.authname;
            if (name && !coAuthorMap.has(name)) {
              coAuthorMap.set(name, { name });
            }
          });
        }

        // Sum up citations
        if (entry["citedby-count"]) {
          totalCitations += parseInt(entry["citedby-count"], 10);
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

    // Update metrics from publication data if Author API failed
    if (scopusMetrics.document_count === null) {
      scopusMetrics.document_count = totalResults;
    }
    if (scopusMetrics.citation_count === null && totalCitations > 0) {
      scopusMetrics.citation_count = totalCitations;
    }
    if (scopusMetrics.co_authors.length === 0) {
      // Get up to 10 co-authors from publications (excluding first one which is usually the author)
      scopusMetrics.co_authors = Array.from(coAuthorMap.values()).slice(1, 11);
    }

    console.log(`Metrics from publications: docs=${scopusMetrics.document_count}, citations=${scopusMetrics.citation_count}, co-authors=${scopusMetrics.co_authors.length}`);

    // Update the user's profile with parsed publications and metrics
    // Transform to the format expected by the profile (include DOI and journal for clickable links)
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
        scopus_link: scopusUrl,
        scopus_metrics: scopusMetrics,
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Profile update error:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update profile with publications" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Updated profile for user ${user.id} with ${papers.length} publications and metrics`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        authorId,
        publications: papers,
        count: papers.length,
        metrics: scopusMetrics,
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
