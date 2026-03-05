import { useQuery } from "@tanstack/react-query";
import {
  Heart,
  Smile,
  Scissors,
  Bone,
  Sparkles,
  Sun,
  Zap,
  Pill,
  Users,
  Droplet,
  Shield,
  Move,
  AlertTriangle,
  Stethoscope,
  Activity,
  Filter,
  Brain,
  Baby,
  Target,
  Eye,
  AlignJustify,
  MessageCircle,
  Ear,
  Wind,
  Camera
} from "lucide-react";

// API base URL
const _apiBaseRaw = import.meta.env.VITE_API_URL || "http://localhost:3000";
const _apiBase = _apiBaseRaw.replace(/\/+$/, "");
const API_BASE_URL = _apiBase.endsWith("/api") ? _apiBase : `${_apiBase}/api`;

// Icon mapping for specialties
const iconMap = {
  Heart,
  Smile,
  Scissors,
  Bone,
  Sparkles,
  Sun,
  Zap,
  Pill,
  Users,
  Droplet,
  Shield,
  Move,
  AlertTriangle,
  Stethoscope,
  Activity,
  Filter,
  Brain,
  Baby,
  Target,
  Eye,
  AlignJustify,
  MessageCircle,
  Ear,
  Wind,
  Camera
};

/**
 * Custom hook to fetch medical specialties from the database
 * @returns {Object} React Query object with specialties data, loading, and error states
 */
export const useSpecialties = () => {
  return useQuery({
    queryKey: ["specialties"],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/specialties`, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch specialties");
      }

      const specialties = await response.json();

      // Transform API data to match the expected format
      return specialties.map(specialty => ({
        id: specialty.id,
        name: specialty.name,
        icon: iconMap[specialty.icon] || Heart, // Default to Heart component if not found
        color: specialty.color || "text-primary", // Default color if not provided
      }));
    },
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
    cacheTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
  });
};
