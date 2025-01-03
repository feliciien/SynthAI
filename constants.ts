import { 
  Code, 
  ImageIcon, 
  LayoutDashboard, 
  MessageSquare, 
  Music, 
  Settings, 
  VideoIcon,
  Mic2,
  Palette,
  Brain,
  History,
  Network,
  FileText,
  PresentationIcon,
  Lightbulb
} from "lucide-react";

export const FREE_LIMITS = {
  IMAGE_GENERATION: 100,
  CODE_GENERATION: 100,
  VOICE_SYNTHESIS: 100,
  CONTENT_WORD_LIMIT: 500,
  PRESENTATION_SLIDES: 100,
  IDEA_LIMIT: 30
};

export const MAX_FREE_COUNTS = Object.values(FREE_LIMITS).reduce((a, b) => a + b, 0);

export const FREE_CONTENT_WORD_LIMIT = FREE_LIMITS.CONTENT_WORD_LIMIT;
export const FREE_IDEA_LIMIT = FREE_LIMITS.IDEA_LIMIT;

export const FEATURE_TYPES = {
  IMAGE_GENERATION: 'image',
  CODE_GENERATION: 'code',
  VOICE_SYNTHESIS: 'voice',
  CONTENT_WRITER: 'content',
  PRESENTATION: 'presentation',
  IDEA_GENERATOR: 'idea',
  VIDEO_GENERATION: 'video',
  MUSIC_CREATION: 'music',
  ART_STUDIO: 'art',
  TRANSLATION: 'translation',
  DATA_INSIGHTS: 'data',
  NETWORK_ANALYSIS: 'network',
  STUDY_ASSISTANT: 'study',
  RESEARCH_ASSISTANT: 'research',
  API_USAGE: 'api'
} as const;

export const tools = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
    color: "text-sky-500",
    bgColor: "bg-sky-500/10",
    description: "Overview of your AI workspace and activities.",
    free: true,
    core: true
  },
  {
    label: 'Network Monitor',
    icon: Network,
    href: '/network',
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    description: "Monitor and analyze network performance metrics.",
    free: true,
    core: true
  },
  {
    label: 'Conversation',
    icon: MessageSquare,
    href: '/conversation',
    color: "text-violet-500",
    bgColor: "bg-violet-500/10",
    description: "Chat with our AI assistant to brainstorm ideas.",
    free: true,
    core: true
  },
  {
    label: 'History',
    icon: History,
    href: '/history',
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/10",
    description: "View your past conversations and interactions.",
    free: true,
    core: true
  },
  {
    label: 'Image Generation',
    icon: ImageIcon,
    href: '/image',
    color: "text-pink-700",
    bgColor: "bg-pink-700/10",
    description: "Generate stunning images with 100 free generations.",
    free: true,
    limitedFree: true,
    freeLimit: FREE_LIMITS.IMAGE_GENERATION
  },
  {
    label: 'Code Generation',
    icon: Code,
    href: '/code',
    color: "text-green-700",
    bgColor: "bg-green-700/10",
    description: "Generate code using basic templates.",
    free: true,
    limitedFree: true,
    freeLimit: FREE_LIMITS.CODE_GENERATION
  },
  {
    label: 'Voice Synthesis',
    icon: Mic2,
    href: '/voice',
    color: "text-purple-700",
    bgColor: "bg-purple-700/10",
    description: "Convert text to speech with basic voices.",
    free: true,
    limitedFree: true,
    freeLimit: FREE_LIMITS.VOICE_SYNTHESIS
  },
  {
    label: 'Art Generation',
    icon: Palette,
    href: '/art',
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    description: "Create artwork with basic styles.",
    free: true,
    limitedFree: true
  },
  {
    label: 'Content Writer',
    icon: FileText,
    href: '/writer',
    color: "text-blue-700",
    bgColor: "bg-blue-700/10",
    description: "Generate content up to 500 words.",
    free: true,
    limitedFree: true,
    freeLimit: FREE_LIMITS.CONTENT_WORD_LIMIT
  },
  {
    label: 'Presentation Creator',
    icon: PresentationIcon,
    href: '/presentation',
    color: "text-yellow-700",
    bgColor: "bg-yellow-700/10",
    description: "Create presentations with basic templates.",
    free: true,
    limitedFree: true,
    freeLimit: FREE_LIMITS.PRESENTATION_SLIDES
  },
  {
    label: 'Idea Generator',
    icon: Lightbulb,
    href: '/ideas',
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    description: "Generate up to 30 ideas per request.",
    free: true,
    limitedFree: true,
    freeLimit: FREE_LIMITS.IDEA_LIMIT
  },
  {
    label: 'Video Creation',
    icon: VideoIcon,
    href: '/video',
    color: "text-orange-700",
    bgColor: "bg-orange-700/10",
    description: "Create engaging videos from text prompts.",
    free: false,
    proOnly: true
  },
  {
    label: 'Music Synthesis',
    icon: Music,
    href: '/music',
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    description: "Create original music and audio tracks.",
    free: false,
    proOnly: true
  },
  {
    label: 'Custom Models',
    icon: Brain,
    href: '/models',
    color: "text-red-700",
    bgColor: "bg-red-700/10",
    description: "Train and use custom AI models.",
    free: false,
    proOnly: true
  }
];
