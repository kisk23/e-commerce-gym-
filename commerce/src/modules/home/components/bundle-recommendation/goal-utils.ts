import { StoreBundle } from "@lib/types/bundle"

export type FitnessGoal = string

export interface GoalOption {
  id: FitnessGoal
  title: string
  description: string
  icon: string
}

// Custom metadata for known bundle types
const goalMetadata: Record<string, Omit<GoalOption, "id">> = {
  bulk: {
    title: "Build Muscle (Bulk)",
    description: "Gain muscle mass with high-calorie, protein-rich meals",
    icon: "💪",
  },
  cut: {
    title: "Lose Fat (Cut)",
    description:
      "Reduce body fat while maintaining muscle with controlled calories",
    icon: "🔥",
  },
  maintenance: {
    title: "Maintain Weight",
    description: "Keep your current physique with balanced nutrition",
    icon: "⚖️",
  },
  performance: {
    title: "Athletic Performance",
    description: "Optimize energy and recovery for peak performance",
    icon: "🏃",
  },
  general: {
    title: "General Health",
    description: "Healthy, balanced meals for overall wellness",
    icon: "🥗",
  },
}

// Default icon for unknown bundle types
const DEFAULT_ICON = "🎯"

/**
 * Extract unique bundle types from bundles array
 */
export function extractUniqueBundleTypes(bundles: StoreBundle[]): string[] {
  const types = new Set<string>()
  
  bundles.forEach((bundle) => {
    if (bundle.bundle_type) {
      types.add(bundle.bundle_type.toLowerCase())
    }
  })
  
  return Array.from(types).sort()
}

/**
 * Generate fallback metadata for unknown bundle types
 */
function generateFallbackMetadata(bundleType: string): Omit<GoalOption, "id"> {
  const capitalized = bundleType
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
  
  return {
    title: capitalized,
    description: `Recommended bundles for ${capitalized.toLowerCase()}`,
    icon: DEFAULT_ICON,
  }
}

/**
 * Map bundle types to goal options with metadata
 */
export function mapBundleTypesToGoals(bundleTypes: string[]): GoalOption[] {
  return bundleTypes.map((type) => {
    const metadata = goalMetadata[type] || generateFallbackMetadata(type)
    
    return {
      id: type,
      ...metadata,
    }
  })
}

/**
 * Extract and map bundle types to goal options in one step
 */
export function getDynamicGoalsFromBundles(bundles: StoreBundle[]): GoalOption[] {
  const uniqueTypes = extractUniqueBundleTypes(bundles)
  return mapBundleTypesToGoals(uniqueTypes)
}
