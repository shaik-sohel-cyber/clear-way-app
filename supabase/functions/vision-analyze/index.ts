import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VisionRequest {
  image: string; // base64 encoded image
  mode: 'describe' | 'navigate' | 'read' | 'detect' | 'location' | 'obstacle' | 'general';
  query?: string; // optional user query for context
}

const getModePrompt = (mode: string, query?: string): string => {
  const baseContext = `You are VisionAI for blind users. RULES:
- Use SHORT bullet points only (max 3-5 points)
- Use clock positions from USER's perspective (YOUR left = user's right, so flip it)
- Distances in steps or feet
- If view is blocked or unclear, say "Please step back" or "Turn slightly left"
- Safety warnings FIRST, one line only
- NO lengthy descriptions, NO paragraphs
- Be direct and helpful`;

  const modePrompts: Record<string, string> = {
    describe: `${baseContext}

TASK: Quick scene summary.
Format:
• [Safety if any]
• Location type
• 2-3 key items with positions
• Path ahead`,

    navigate: `${baseContext}

TASK: Navigation help from USER's viewpoint.
• If path unclear: "Please turn/step [direction] for better view"
• Give ONE direction at a time
• Use: "Ahead", "Your left", "Your right", "Behind you"
• Warn obstacles FIRST
${query ? `Going to: ${query}` : ''}`,

    read: `${baseContext}

TASK: Read visible text.
• List text items briefly
• Most important first
• Skip decorative text`,

    detect: `${baseContext}

TASK: List objects nearby.
• Object - position - distance
• Max 5 most relevant items
• Hazards first`,

    location: `${baseContext}

TASK: Where is user?
• One line: [Indoor/Outdoor] - [Place type]
• Key landmark
• If unclear: "Move forward for better view"`,

    obstacle: `${baseContext}

TASK: SAFETY CHECK
• Immediate hazard or "Path clear"
• Distance to nearest obstacle
• Safe direction to move`,

    general: `${baseContext}

Question: ${query || 'What do you see?'}
Answer in 2-3 bullet points max.`,
  };

  return modePrompts[mode] || modePrompts.general;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image, mode, query }: VisionRequest = await req.json();
    
    if (!image) {
      return new Response(
        JSON.stringify({ error: 'No image provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing vision request: mode=${mode}, hasQuery=${!!query}`);

    const prompt = getModePrompt(mode, query);

    // Use Gemini for vision analysis (best for image understanding)
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`
                }
              }
            ]
          }
        ],
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add more credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'AI analysis failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content || 'Unable to analyze the image.';

    console.log('Vision analysis completed successfully');

    return new Response(
      JSON.stringify({ 
        analysis,
        mode,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Vision analyze error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
