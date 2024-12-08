"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { Video } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Empty } from "@/components/empty";
import { Heading } from "@/components/heading";
import { Loader } from "@/components/loader";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import useProModal from "@/hooks/use-pro-modal";
import { toast } from "react-hot-toast";

// Create or update `constants.ts` with a suitable schema:
import { formSchema } from "./constants";

const VideoPage = () => {
  const router = useRouter();
  const proModal = useProModal();
  const [video, setVideo] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
    },
  });

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setVideo("");
      const response = await axios.post("/api/video", {
        prompt: values.prompt,
      });
      setVideo(response.data.video);
      form.reset();
    } catch (error: any) {
      console.error("Error generating video:", error);
      if (error?.response?.status === 403) {
        proModal.onOpen();
      } else {
        toast.error("Something went wrong generating the video.");
      }
    } finally {
      router.refresh();
    }
  };

  return (
    <div>
      <Heading
        title="Video Generation"
        description="Generate AI-driven videos from your prompt."
        icon={Video}
        iconColor="text-orange-700"
        bgColor="bg-orange-700/10"
      />
      <div className="px-4 lg:px-8">
        <div>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="rounded-lg border w-full p-4 px-3 md:px-6 focus-within:shadow-sm grid grid-cols-12 gap-2"
            >
              <FormField
                name="prompt"
                render={({ field }) => (
                  <FormItem className="col-span-12 lg:col-span-10">
                    <FormControl className="m-0 p-0">
                      <Input
                        {...field}
                        placeholder="Describe the video scene..."
                        className="border-0 outline-none focus-visible:ring-0 focus-visible:ring-transparent"
                        disabled={isLoading}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button className="col-span-12 lg:col-span-2 w-full" disabled={isLoading}>
                {isLoading ? "Generating..." : "Generate"}
              </Button>
            </form>
          </Form>
        </div>
        <div className="space-y-4 mt-4">
          {isLoading && (
            <div className="p-8 rounded-lg w-full flex items-center justify-center bg-muted">
              <Loader />
            </div>
          )}
          {!video && !isLoading && <Empty label="Enter a prompt to generate a video." />}
          {video && (
            <video className="w-full aspect-video mt-8 rounded-lg border bg-black" controls>
              <source src={video} type="video/mp4" />
              Your browser does not support the video element.
            </video>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoPage;