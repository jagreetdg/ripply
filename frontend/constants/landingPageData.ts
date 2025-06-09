import { Feather } from "@expo/vector-icons";

export const features = [
  {
    icon: "mic" as React.ComponentProps<typeof Feather>["name"],
    title: "Record a Ripple",
    description:
      "Create a voice note in seconds. Express yourself with the power of your voice.",
    color: "#6B2FBC",
  },
  {
    icon: "share-2" as React.ComponentProps<typeof Feather>["name"],
    title: "Share with the world",
    description:
      "Publish your Ripples to your followers or the public timeline.",
    color: "#9D7BC7",
  },
  {
    icon: "repeat" as React.ComponentProps<typeof Feather>["name"],
    title: "Get heard and interact",
    description:
      "Receive likes, comments, and build a community around your voice.",
    color: "#D4C1EC",
  },
  {
    icon: "trending-up" as React.ComponentProps<typeof Feather>["name"],
    title: "Get Discovered",
    description:
      "Gain exposure and build a fan following with your unique voice and talent.",
    color: "#8A4FD0",
  },
];

export const testimonials = [
  {
    quote:
      "Ripply has completely changed how I share my thoughts online. It's so much more personal than text.",
    name: "Alex Johnson",
    role: "Content Creator",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg"
  },
  {
    quote:
      "As a musician, I use Ripply to share song snippets and get instant feedback from fans.",
    name: "Maya Williams",
    role: "Indie Artist",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg"
  },
  {
    quote:
      "The voice-first approach makes social media feel human again. I'm addicted!",
    name: "Jamal Thompson",
    role: "Podcast Host",
    avatar: "https://randomuser.me/api/portraits/men/56.jpg"
  },
]; 