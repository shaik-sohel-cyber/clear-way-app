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
  const baseContext = `You are VisionAI, an assistive AI companion for visually impaired users. 
  You must be extremely helpful, precise, and safety-focused. Always speak in clear, simple language.
  Describe distances in feet/meters. Use clock positions (e.g., "at 3 o'clock") for directions.
  Be warm and reassuring while remaining concise. Safety warnings should come FIRST.`;

  const modePrompts: Record<string, string> = {
    describe: `${baseContext}
    
    TASK: Describe the scene in detail for a blind person.
    - Start with immediate safety concerns if any
    - Describe the overall environment (indoor/outdoor, lighting)
    - List key objects and their positions using clock directions
    - Mention people, their approximate distance and activity
    - Note pathways and obstacles
    - Be specific about colors, sizes, and distances`,

    navigate: `${baseContext}
    
    TASK: Provide navigation assistance.
    - Identify clear pathways and walking routes
    - Point out obstacles, stairs, curbs, or hazards
    - Give turn-by-turn guidance using clock positions
    - Mention doors, exits, and entrances
    - Describe floor surfaces and level changes
    ${query ? `User wants to navigate to: ${query}` : ''}`,

    read: `${baseContext}
    
    TASK: Read and transcribe all visible text.
    - Read text from signs, labels, screens, documents
    - Include menu items, prices, product names
    - Read in logical order (top to bottom, left to right)
    - Describe the type of text (sign, label, screen, etc.)
    - Note any important warnings or instructions`,

    detect: `${baseContext}
    
    TASK: Detect and identify all objects in the scene.
    - List each object with its position (clock direction) and distance
    - Identify potential hazards or obstacles
    - Note moving objects or people
    - Describe furniture, electronics, household items
    - Mention anything that could be grabbed or interacted with`,

    location: `${baseContext}
    
    TASK: Identify the current location/room type.
    - Determine if indoor or outdoor
    - Identify the type of space (kitchen, office, street, store, etc.)
    - Note distinctive features that help identify the location
    - Describe the general layout
    - Mention any visible signs or landmarks`,

    obstacle: `${baseContext}
    
    TASK: SAFETY ALERT - Detect obstacles and hazards.
    - PRIORITY: Identify immediate obstacles in the path
    - Warn about floor hazards (wet floors, cables, steps)
    - Note overhead obstacles at head height
    - Identify moving hazards (people walking, vehicles)
    - Provide safe navigation suggestions
    - Be URGENT if danger is immediate`,

    general: `${baseContext}
    
    TASK: Answer the user's question about what you see.
    User question: ${query || 'What do you see?'}
    
    Provide a helpful, detailed response focused on the user's specific question.`,
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
