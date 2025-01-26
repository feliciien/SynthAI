/** @format */

"use client";

import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { ToolPage } from "@/components/tool-page";
import { tools } from "../dashboard/config";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import api, { Slide } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import {
  Loader2,
  ChevronRight,
  ChevronLeft,
  Copy,
  RefreshCw,
  FileDown,
  LayoutTemplate,
  Presentation,
  Palette // Added icon for color scheme
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

// Templates for different presentation styles
const PRESENTATION_TEMPLATES = [
  {
    id: "business",
    name: "Business Presentation",
    description: "Professional and formal style"
  },
  {
    id: "educational",
    name: "Educational",
    description: "Clear and instructional format"
  },
  {
    id: "creative",
    name: "Creative",
    description: "Dynamic and engaging style"
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Clean and simple design"
  },
  {
    id: "modern",
    name: "Modern",
    description: "Sleek and contemporary design"
  },
  {
    id: "illustrative",
    name: "Illustrative",
    description: "Rich visuals and illustrations"
  },
  {
    id: "corporate",
    name: "Corporate",
    description: "Professional design suited for corporate presentations"
  }
];

// Color schemes for presentations
const COLOR_SCHEMES = [
  {
    id: "default",
    name: "Default",
    description: "Standard color scheme"
  },
  {
    id: "light",
    name: "Light",
    description: "Light and airy colors"
  },
  {
    id: "dark",
    name: "Dark",
    description: "Dark and bold colors"
  },
  {
    id: "colorful",
    name: "Colorful",
    description: "Vibrant and diverse colors"
  }
];

// Styles for different color schemes
const colorSchemeStyles: Record<
  string,
  { backgroundColor: string; color: string }
> = {
  default: {
    backgroundColor: "#FFFFFF",
    color: "#000000"
  },
  light: {
    backgroundColor: "#F9F9F9",
    color: "#000000"
  },
  dark: {
    backgroundColor: "#1F1F1F",
    color: "#FFFFFF"
  },
  colorful: {
    backgroundColor: "#FFD700",
    color: "#000000"
  }
};

export default function PresentationPage() {
  // Tool loading state
  const [isLoadingTool, setIsLoadingTool] = useState(true);
  const [tool, setTool] = useState(
    tools.find((t) => t.href === "/presentation")
  );

  // Form states
  const [topic, setTopic] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("business");
  const [file, setFile] = useState<File | null>(null);
  const [colorScheme, setColorScheme] = useState("default");

  // Presentation states
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [currentSlide, setCurrentSlide] = useState<Slide | null>(null);

  // Loading and progress states
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Initialize tool
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoadingTool(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Update current slide
  useEffect(() => {
    if (slides.length > 0 && currentSlideIndex < slides.length) {
      setCurrentSlide(slides[currentSlideIndex]);
    } else {
      setCurrentSlide(null);
    }
  }, [slides, currentSlideIndex]);

  if (isLoadingTool) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center space-y-4'>
          <Loader2 className='w-8 h-8 animate-spin mx-auto' />
          <p className='text-sm text-muted-foreground'>
            Loading presentation tool...
          </p>
        </div>
      </div>
    );
  }

  if (!tool) {
    return (
      <div className='p-8 text-center'>
        <h2 className='text-2xl font-bold text-red-500'>Configuration Error</h2>
        <p className='mt-2 text-muted-foreground'>
          Unable to load presentation tool configuration.
        </p>
        <Button
          variant='outline'
          className='mt-4'
          onClick={() => window.location.reload()}>
          <RefreshCw className='w-4 h-4 mr-2' />
          Retry
        </Button>
      </div>
    );
  }

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setProgress(0);

    if (!topic.trim() && !file) {
      toast.error("Please enter a topic or upload a document");
      return;
    }

    if (topic.length > 1000) {
      toast.error("Topic is too long. Maximum length is 1000 characters");
      return;
    }

    if (
      file &&
      file.type !==
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      toast.error("Please upload a valid Word (.docx) document");
      return;
    }

    try {
      setIsLoading(true);
      setSlides([]);
      setCurrentSlideIndex(0);

      // Simulate progress while generating
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 5, 90));
      }, 500);

      let response;
      if (file) {
        const formData = new FormData();
        formData.append("template", selectedTemplate);
        formData.append("colorScheme", colorScheme);
        formData.append("file", file);

        response = await fetch("/api/presentation", {
          method: "POST",
          body: formData
        }).then((res) => res.json());
      } else {
        const apiResponse = await api.generatePresentation(
          topic,
          selectedTemplate,
          colorScheme
        );
        if (!apiResponse.success || !apiResponse.data?.slides) {
          throw new Error(
            apiResponse.error || "Failed to generate presentation"
          );
        }
        response = apiResponse.data;
      }

      clearInterval(progressInterval);
      setProgress(100);

      if (!response?.slides || response.slides.length === 0) {
        throw new Error("No slides generated. Please try again.");
      }

      setSlides(response.slides);
      toast.success("Presentation generated successfully!");
    } catch (err: any) {
      console.error("Error generating presentation:", err);
      toast.error(err.message || "Failed to generate presentation");
      setError(err.message || "Failed to generate presentation");
    } finally {
      setIsLoading(false);
    }
  };

  const clearForm = () => {
    setTopic("");
    setFile(null);
    setSlides([]);
    setError(null);
    setCurrentSlideIndex(0);
    setCurrentSlide(null);
    setColorScheme("default");
    setSelectedTemplate("business");
  };

  const nextSlide = () => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex((prev) => prev + 1);
    }
  };

  const previousSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex((prev) => prev - 1);
    }
  };

  const generatePowerPoint = async () => {
    if (!slides.length) return;

    try {
      // Dynamically import pptxgenjs only when needed
      const pptxgen = await import("pptxgenjs");
      const PptxGenJS = pptxgen.default;

      const pres = new PptxGenJS();

      // Set presentation properties
      pres.author = "WorkFusion";
      pres.company = "WorkFusion";
      pres.revision = "1";
      pres.subject = topic || "Generated Presentation";
      pres.title = topic || "Generated Presentation";

      // Add slides
      slides.forEach((slide) => {
        const pptSlide = pres.addSlide();

        // Apply color scheme
        let backgroundColor =
          colorSchemeStyles[colorScheme]?.backgroundColor || "#FFFFFF";
        pptSlide.background = { fill: backgroundColor };

        // Add title to all slides
        pptSlide.addText(slide.title, {
          x: "5%",
          y: "5%",
          w: "90%",
          h: "15%",
          fontSize: slide.type === "title" ? 44 : 32,
          bold: true,
          align: "center",
          color: colorSchemeStyles[colorScheme]?.color || "363636"
        });

        // Add content based on slide type
        if (typeof slide.content === "string") {
          // Title slide subtitle
          pptSlide.addText(slide.content, {
            x: "10%",
            y: "30%",
            w: "80%",
            h: "40%",
            fontSize: 28,
            align: "center",
            color: colorSchemeStyles[colorScheme]?.color || "666666"
          });
        } else {
          // Bullet points for other slides
          const bulletPoints = slide.content.map((point) => ({ text: point }));
          pptSlide.addText(bulletPoints, {
            x: "10%",
            y: "25%",
            w: "80%",
            h: "70%",
            fontSize: 24,
            bullet: { type: "bullet" },
            color: colorSchemeStyles[colorScheme]?.color || "363636",
            lineSpacing: 32
          });
        }

        // Add slide number except for title slide
        if (slide.type !== "title") {
          pptSlide.addText(`${slides.indexOf(slide)}/${slides.length - 1}`, {
            x: "90%",
            y: "95%",
            w: "10%",
            h: "5%",
            fontSize: 12,
            color: colorSchemeStyles[colorScheme]?.color || "666666",
            align: "right"
          });
        }
      });

      // Save the presentation
      const fileName = `${(topic || "presentation")
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase()}_presentation.pptx`;
      await pres.writeFile({ fileName });
      toast.success("PowerPoint presentation downloaded!");
    } catch (error) {
      console.error("Error generating PowerPoint:", error);
      toast.error("Failed to generate PowerPoint presentation");
    }
  };

  const copyToClipboard = () => {
    if (!slides.length) return;

    const presentationText = slides
      .map(
        (slide) =>
          `${slide.title}\n\n${
            Array.isArray(slide.content)
              ? slide.content.join("\n")
              : slide.content
          }`
      )
      .join("\n\n---\n\n");

    navigator.clipboard.writeText(presentationText);
    toast.success("Copied to clipboard!");
  };

  return (
    <ToolPage tool={tool} isLoading={isLoading} error={error}>
      {/* Improved design starts here */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <form onSubmit={onSubmit} className='mt-8'>
          <div className='grid grid-cols-1 md:grid-cols-12 gap-6'>
            {/* Input Section */}
            <div className='md:col-span-6'>
              <div className='flex flex-col space-y-4'>
                <Input
                  placeholder='Enter your presentation topic...'
                  value={topic}
                  onChange={(e) => {
                    setTopic(e.target.value);
                    if (e.target.value && file) {
                      setFile(null);
                    }
                  }}
                  disabled={isLoading || !!file}
                  className='w-full'
                />
                <div>
                  <label className='block text-sm font-medium text-gray-700'>
                    Or upload a Word document (.docx)
                  </label>
                  <Input
                    type='file'
                    accept='.docx'
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      if (e.target.files && e.target.files[0]) {
                        setFile(e.target.files[0]);
                        setTopic("");
                      } else {
                        setFile(null);
                      }
                    }}
                    disabled={isLoading || topic.trim() !== ""}
                  />
                </div>
              </div>
            </div>
            {/* Template Selection */}
            <div className='md:col-span-3'>
              <Select
                value={selectedTemplate}
                onValueChange={setSelectedTemplate}
                disabled={isLoading}>
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Select template' />
                </SelectTrigger>
                <SelectContent>
                  {PRESENTATION_TEMPLATES.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className='flex items-center'>
                        <LayoutTemplate className='w-4 h-4 mr-2' />
                        <div>
                          <div className='font-medium'>{template.name}</div>
                          <div className='text-xs text-gray-500'>
                            {template.description}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Color Scheme Selection */}
            <div className='md:col-span-3'>
              <Select
                value={colorScheme}
                onValueChange={setColorScheme}
                disabled={isLoading}>
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Select color scheme' />
                </SelectTrigger>
                <SelectContent>
                  {COLOR_SCHEMES.map((scheme) => (
                    <SelectItem key={scheme.id} value={scheme.id}>
                      <div className='flex items-center'>
                        <Palette className='w-4 h-4 mr-2' />
                        <div>
                          <div className='font-medium'>{scheme.name}</div>
                          <div className='text-xs text-gray-500'>
                            {scheme.description}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Submit Button */}
            <div className='md:col-span-12 flex items-end'>
              <Button
                type='submit'
                disabled={isLoading}
                className='w-full md:w-auto'>
                {isLoading ? (
                  <>
                    <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                    Generating...
                  </>
                ) : (
                  <>
                    <Presentation className='w-4 h-4 mr-2' />
                    Generate
                  </>
                )}
              </Button>
            </div>
          </div>
          {isLoading && (
            <div className='mt-4'>
              <Progress value={progress} className='h-2' />
              <p className='text-sm text-gray-500 mt-2'>
                Generating your presentation...
              </p>
            </div>
          )}
        </form>

        {error && (
          <div className='mt-4 p-4 text-red-500 bg-red-50 rounded-lg'>
            {error}
          </div>
        )}

        {currentSlide && (
          <div className='relative mt-10'>
            <div className='flex justify-center'>
              <AnimatePresence mode='wait'>
                <motion.div
                  key={currentSlideIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className='w-full md:w-3/4 lg:w-1/2'>
                  <Card
                    className='p-8 min-h-[400px] relative'
                    style={{
                      backgroundColor:
                        colorSchemeStyles[colorScheme]?.backgroundColor,
                      color: colorSchemeStyles[colorScheme]?.color
                    }}>
                    <div
                      className='absolute top-4 right-4 text-sm'
                      style={{ color: colorSchemeStyles[colorScheme]?.color }}>
                      Slide {currentSlideIndex + 1} of {slides.length}
                    </div>
                    <div className='space-y-4'>
                      <h2
                        className='text-2xl font-bold mb-4 text-center'
                        style={{
                          color: colorSchemeStyles[colorScheme]?.color
                        }}>
                        {currentSlide.title}
                      </h2>
                      {Array.isArray(currentSlide.content) ? (
                        <ul className='space-y-2 list-disc pl-6'>
                          {currentSlide.content.map((item, index) => (
                            <motion.li
                              key={index}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              style={{
                                color: colorSchemeStyles[colorScheme]?.color
                              }}>
                              {item}
                            </motion.li>
                          ))}
                        </ul>
                      ) : (
                        <p
                          className='text-center'
                          style={{
                            color: colorSchemeStyles[colorScheme]?.color
                          }}>
                          {currentSlide.content}
                        </p>
                      )}
                    </div>
                  </Card>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className='absolute top-1/2 -translate-y-1/2 left-0'>
              <Button
                variant='ghost'
                size='icon'
                onClick={previousSlide}
                disabled={currentSlideIndex === 0}
                className='transition-opacity opacity-75 hover:opacity-100'>
                <ChevronLeft className='h-8 w-8' />
              </Button>
            </div>
            <div className='absolute top-1/2 -translate-y-1/2 right-0'>
              <Button
                variant='ghost'
                size='icon'
                onClick={nextSlide}
                disabled={currentSlideIndex === slides.length - 1}
                className='transition-opacity opacity-75 hover:opacity-100'>
                <ChevronRight className='h-8 w-8' />
              </Button>
            </div>
          </div>
        )}

        {slides.length > 0 && (
          <div className='flex flex-col md:flex-row justify-between items-center mt-8 space-y-4 md:space-y-0'>
            <div className='flex space-x-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setCurrentSlideIndex(0)}
                disabled={currentSlideIndex === 0}>
                First Slide
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setCurrentSlideIndex(slides.length - 1)}
                disabled={currentSlideIndex === slides.length - 1}>
                Last Slide
              </Button>
            </div>
            <div className='flex space-x-2'>
              <Button variant='outline' size='sm' onClick={copyToClipboard}>
                <Copy className='h-4 w-4 mr-2' />
                Copy All
              </Button>
              <Button variant='outline' size='sm' onClick={generatePowerPoint}>
                <FileDown className='h-4 w-4 mr-2' />
                Download PPTX
              </Button>
            </div>
            <Button variant='outline' size='sm' onClick={clearForm}>
              <RefreshCw className='h-4 w-4 mr-2' />
              New Presentation
            </Button>
          </div>
        )}

        {slides.length > 0 && (
          <div className='mt-10 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6'>
            {slides.map((slide, index) => (
              <Card
                key={index}
                className={`p-4 cursor-pointer transition-all hover:shadow-lg ${
                  index === currentSlideIndex ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setCurrentSlideIndex(index)}
                style={{
                  backgroundColor:
                    colorSchemeStyles[colorScheme]?.backgroundColor,
                  color: colorSchemeStyles[colorScheme]?.color
                }}>
                <div
                  className='text-xs font-medium mb-2'
                  style={{ color: colorSchemeStyles[colorScheme]?.color }}>
                  Slide {index + 1}
                </div>
                <h3
                  className='text-sm font-medium truncate'
                  style={{ color: colorSchemeStyles[colorScheme]?.color }}>
                  {slide.title}
                </h3>
                <div
                  className='text-xs mt-1 line-clamp-2'
                  style={{ color: colorSchemeStyles[colorScheme]?.color }}>
                  {Array.isArray(slide.content)
                    ? slide.content[0] + (slide.content.length > 1 ? "..." : "")
                    : slide.content}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ToolPage>
  );
}
