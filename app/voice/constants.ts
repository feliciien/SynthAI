import * as z from "zod";

export const formSchema = z.object({
  prompt: z.string().min(1, {
    message: "Voice prompt is required."
  }),
  voice: z.string().min(1),
});
