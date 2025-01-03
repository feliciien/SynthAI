import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { checkSubscription } from "@/lib/subscription";
import { Redis } from '@upstash/redis';
import { checkFeatureLimit, incrementFeatureUsage } from "@/lib/feature-limit";
import { FEATURE_TYPES } from "@/constants";

// Initialize Redis client for caching
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || ''
});

// Verify Redis connection
const verifyRedisConnection = async () => {
  try {
    // Try to set and get a test value
    const testKey = 'test-connection';
    await redis.set(testKey, 'test-value');
    const testValue = await redis.get(testKey);
    await redis.del(testKey);
    return testValue === 'test-value';
  } catch (error: any) {
    console.error('[REDIS_CONNECTION_ERROR]:', {
      error: error?.message || 'Unknown error',
      stack: error?.stack || '',
      url: !!process.env.UPSTASH_REDIS_REST_URL,
      token: !!process.env.UPSTASH_REDIS_REST_TOKEN
    });
    return false;
  }
};

// Style enhancements for different image types
const stylePrompts = {
  "realistic": "ultra realistic, photorealistic, highly detailed, 8k resolution, professional photography, masterpiece quality",
  "artistic": "artistic style, creative interpretation, vibrant colors, expressive brushstrokes, masterpiece quality, trending on artstation",
  "digital": "digital art style, modern aesthetic, sleek design, perfect lighting, high-tech feel, trending digital art",
  "vintage": "vintage style, retro aesthetic, aged look, film grain, nostalgic atmosphere, classic photography",
  "minimalist": "minimalist style, clean and simple, elegant, refined composition, subtle details, perfect balance",
  "fantasy": "fantasy art style, magical and ethereal, mystical atmosphere, enchanted scenery, epic fantasy art",
  "comic": "comic book style, bold colors and lines, dynamic composition, cel shading, manga influence",
  "cinematic": "cinematic style, dramatic lighting and composition, movie-like quality, epic scene, professional cinematography"
};

// Negative prompts to improve image quality
const globalNegativePrompt = "blur, haze, deformed, disfigured, bad anatomy, extra limbs, missing limbs, floating limbs, disconnected limbs, mutation, mutated, ugly, disgusting, blurry, out of focus, bad quality, watermark, signature, text";

// Helper function to process and enhance the prompt
const processPrompt = (prompt: string, style: string = "realistic") => {
  try {
    // Clean and validate the prompt
    let processedPrompt = prompt.trim();
    if (!processedPrompt) {
      throw new Error("Empty prompt provided");
    }

    // Get style enhancement
    const styleEnhancement = stylePrompts[style as keyof typeof stylePrompts] || stylePrompts.realistic;
    
    // Add composition and lighting improvements
    const compositionBoost = "perfect composition, professional lighting, golden ratio";
    
    // Add technical quality improvements
    const qualityBoost = "best quality, highly detailed, sharp focus, 8K UHD, high resolution";
    
    // Combine all enhancements
    processedPrompt = `${processedPrompt}, ${styleEnhancement}, ${compositionBoost}, ${qualityBoost}. 
    Negative prompt: ${globalNegativePrompt}`;

    return processedPrompt;
  } catch (error) {
    console.error("Error processing prompt:", error);
    throw error;
  }
};

// Helper function to generate cache key
const generateCacheKey = (prompt: string, style: string, resolution: string) => {
  return `image:${prompt}:${style}:${resolution}`.toLowerCase();
};

// Retry mechanism for API calls
const retryWithExponentialBackoff = async (
  fn: () => Promise<any>,
  maxRetries: number = 2,
  baseDelay: number = 1000
) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      // Add timeout using AbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 50000); // 50 second timeout

      try {
        const result = await Promise.race([
          fn(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Operation timed out')), 50000)
          )
        ]);
        
        clearTimeout(timeoutId);
        return result;
      } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError' || error.message === 'Operation timed out') {
          throw new Error('Request timed out after 50 seconds');
        }
        throw error;
      }
    } catch (error: any) {
      lastError = error;
      
      if (i === maxRetries - 1) break;
      
      if (error?.response?.status === 429 || error.message.includes('timeout')) {
        const delay = baseDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      throw error;
    }
  }
  
  throw lastError;
};

const CACHE_TTL = 24 * 60 * 60; // 24 hours in seconds

// Enhanced error handling for OpenAI API
const handleOpenAIError = (error: any) => {
  console.error('[OPENAI_ERROR]:', {
    status: error?.status,
    message: error?.message,
    type: error?.type,
    code: error?.code
  });

  if (error?.status === 429) {
    return new NextResponse("Rate limit exceeded. Please try again later.", { status: 429 });
  }
  
  if (error?.message?.includes('billing')) {
    return new NextResponse("OpenAI API billing error. Please check your account.", { status: 402 });
  }

  return new NextResponse(error?.message || "Internal server error", { 
    status: error?.status || 500 
  });
};

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    const body = await req.json();
    const { prompt, amount = 1, resolution = "1024x1024", style = "realistic" } = body;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!prompt) {
      return new NextResponse("Prompt is required", { status: 400 });
    }

    if (!resolution) {
      return new NextResponse("Resolution is required", { status: 400 });
    }

    // Verify Redis connection early
    const redisConnected = await verifyRedisConnection();
    if (!redisConnected) {
      console.warn('[REDIS_WARNING] Redis connection failed, proceeding without caching');
    }

    // Check for cached result
    const cacheKey = generateCacheKey(prompt, style, resolution);
    let cachedResult = null;
    
    if (redisConnected) {
      try {
        cachedResult = await redis.get(cacheKey);
      } catch (error: any) {
        console.error('[REDIS_CACHE_ERROR]:', error?.message || 'Unknown error');
        // Continue without cache on error
      }
    }
    
    if (cachedResult) {
      console.log('[CACHE_HIT] Returning cached result');
      return new NextResponse(JSON.stringify(cachedResult));
    }

    const isPro = await checkSubscription();
    const hasAvailableUsage = await checkFeatureLimit(FEATURE_TYPES.IMAGE_GENERATION);

    if (!hasAvailableUsage && !isPro) {
      return new NextResponse("Free usage limit reached. Please upgrade to pro for unlimited access.", { status: 403 });
    }

    let result;
    try {
      result = await retryWithExponentialBackoff(async () => {
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });

        const enhancedPrompt = processPrompt(prompt, style);
        const response = await openai.images.generate({
          model: "dall-e-3",
          prompt: `${prompt}. Style: ${style}.`,
          n: Number(amount),
          size: resolution === "1024x1024" ? "1024x1024" : 
                resolution === "1792x1024" ? "1792x1024" :
                "1024x1024", // Default to square if unsupported size
          quality: "standard",
        });

        return response;
      });
    } catch (error: any) {
      return handleOpenAIError(error);
    }

    if (!isPro) {
      await incrementFeatureUsage(FEATURE_TYPES.IMAGE_GENERATION);
    }

    // Cache the successful result
    if (redisConnected) {
      try {
        await redis.set(cacheKey, JSON.stringify(result.data), {
          ex: CACHE_TTL
        });
      } catch (error: any) {
        console.error('[REDIS_CACHE_SET_ERROR]:', error?.message || 'Unknown error');
        // Continue without caching on error
      }
    }

    return new NextResponse(JSON.stringify(result.data));
  } catch (error: any) {
    console.error('[GENERAL_ERROR]:', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
