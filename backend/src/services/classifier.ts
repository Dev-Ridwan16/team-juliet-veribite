import axios from "axios";
import logger from "../utils/logger";

/**
 * Food prediction categories matching the smart contract enum
 */
export enum FoodCategory {
  Ingredient = "Ingredient",
  Dish = "Dish",
  Diet = "Diet",
  Restaurant = "Restaurant",
  Consumption = "Consumption",
  FoodPolicy = "FoodPolicy",
  Other = "Other",
}

/**
 * Classification result interface
 */
export interface ClassificationResult {
  isFood: boolean;
  category: FoodCategory;
  confidence: number;
  reasoning?: string;
  keywords?: string[];
}

/**
 * Abstract base class for food classifiers
 */
export abstract class FoodClassifier {
  abstract name: string;

  /**
   * Classify text to determine if it's food-related and what category
   * @param text The prediction text to classify
   * @param metadata Optional additional metadata for classification
   */
  abstract classify(
    text: string,
    metadata?: any
  ): Promise<ClassificationResult>;
}

/**
 * Keyword-based food classifier stub implementation
 * This is a simple rule-based classifier that can be replaced with ML models
 */
export class KeywordFoodClassifier extends FoodClassifier {
  public name = "keyword-classifier";

  // Food-related keyword mappings
  private readonly categoryKeywords = {
    [FoodCategory.Ingredient]: [
      // Basic ingredients
      "avocado",
      "tomato",
      "onion",
      "garlic",
      "pepper",
      "salt",
      "sugar",
      "flour",
      "rice",
      "wheat",
      "beef",
      "chicken",
      "pork",
      "fish",
      "salmon",
      "tuna",
      "shrimp",
      "lobster",
      "crab",
      "milk",
      "cheese",
      "butter",
      "cream",
      "yogurt",
      "eggs",
      "apple",
      "banana",
      "orange",
      "lemon",
      "lime",
      "berry",
      "grape",
      "mango",
      "pineapple",
      "potato",
      "carrot",
      "broccoli",
      "spinach",
      "lettuce",
      "cucumber",
      "corn",
      "oil",
      "olive",
      "coconut",
      "spice",
      "herb",
      "basil",
      "oregano",
      "thyme",
      // Ingredient trends
      "ingredient",
      "supply",
      "harvest",
      "crop",
      "farming",
      "organic",
      "price",
      "cost",
      "availability",
    ],

    [FoodCategory.Dish]: [
      // Popular dishes
      "pizza",
      "burger",
      "sandwich",
      "pasta",
      "noodle",
      "soup",
      "salad",
      "steak",
      "sushi",
      "tacos",
      "burrito",
      "curry",
      "stir-fry",
      "barbecue",
      "grilled",
      "fried",
      "baked",
      "breakfast",
      "lunch",
      "dinner",
      "dessert",
      "cake",
      "pie",
      "cookie",
      "bread",
      // Dish trends
      "popular",
      "trending",
      "viral",
      "menu",
      "recipe",
      "cooking",
      "cuisine",
      "dish",
    ],

    [FoodCategory.Diet]: [
      // Diet types
      "keto",
      "paleo",
      "vegan",
      "vegetarian",
      "mediterranean",
      "atkins",
      "carnivore",
      "gluten-free",
      "dairy-free",
      "low-carb",
      "high-protein",
      "intermittent fasting",
      "plant-based",
      "raw",
      "organic",
      "clean eating",
      "whole30",
      // Diet trends
      "diet",
      "nutrition",
      "health",
      "wellness",
      "lifestyle",
      "weight",
      "fitness",
      "trend",
    ],

    [FoodCategory.Restaurant]: [
      // Restaurant types
      "restaurant",
      "cafe",
      "bistro",
      "diner",
      "fast-food",
      "chain",
      "franchise",
      "fine-dining",
      "casual",
      "takeout",
      "delivery",
      "drive-through",
      "mcdonalds",
      "starbucks",
      "subway",
      "kfc",
      "pizza-hut",
      "dominos",
      // Restaurant trends
      "opening",
      "closing",
      "expansion",
      "menu-change",
      "new-location",
      "bankruptcy",
    ],

    [FoodCategory.Consumption]: [
      // Consumption patterns
      "consumption",
      "demand",
      "sales",
      "market",
      "consumer",
      "eating-habits",
      "food-waste",
      "portion",
      "serving",
      "appetite",
      "hunger",
      "craving",
      "seasonal",
      "holiday",
      "celebration",
      "festival",
      "tradition",
      // Market trends
      "increase",
      "decrease",
      "growth",
      "decline",
      "popular",
      "unpopular",
    ],

    [FoodCategory.FoodPolicy]: [
      // Policy and regulation
      "regulation",
      "policy",
      "law",
      "government",
      "fda",
      "usda",
      "health-department",
      "food-safety",
      "inspection",
      "recall",
      "ban",
      "approval",
      "labeling",
      "nutrition-facts",
      "calories",
      "sugar-tax",
      "trans-fat",
      "additive",
      // Standards
      "standard",
      "guideline",
      "requirement",
      "compliance",
      "certification",
    ],
  };

  private readonly generalFoodKeywords = [
    "food",
    "eat",
    "meal",
    "hunger",
    "taste",
    "flavor",
    "delicious",
    "tasty",
    "recipe",
    "cooking",
    "kitchen",
    "chef",
    "culinary",
    "gastronomy",
    "nutrition",
    "calorie",
    "vitamin",
    "protein",
    "carbohydrate",
    "fat",
    "grocery",
    "supermarket",
    "market",
    "store",
    "shopping",
  ];

  async classify(text: string, metadata?: any): Promise<ClassificationResult> {
    try {
      logger.info("Classifying text for food content");

      const lowerText = text.toLowerCase();
      const words = this.extractWords(lowerText);

      // Check if it contains any general food-related terms
      const hasFoodKeywords = this.hasKeywords(words, this.generalFoodKeywords);

      if (!hasFoodKeywords) {
        // Check specific categories for edge cases
        let categoryMatch = null;
        let maxScore = 0;

        for (const [category, keywords] of Object.entries(
          this.categoryKeywords
        )) {
          const score = this.calculateKeywordScore(words, keywords);
          if (score > maxScore) {
            maxScore = score;
            categoryMatch = category as FoodCategory;
          }
        }

        // If no significant category match, it's likely not food-related
        if (maxScore < 0.1) {
          return {
            isFood: false,
            category: FoodCategory.Other,
            confidence: 0.95,
            reasoning: "No food-related keywords detected",
          };
        }
      }

      // Determine the best category
      let bestCategory = FoodCategory.Other;
      let bestScore = 0;
      const categoryScores: Record<string, number> = {};

      for (const [category, keywords] of Object.entries(
        this.categoryKeywords
      )) {
        const score = this.calculateKeywordScore(words, keywords);
        categoryScores[category] = score;

        if (score > bestScore) {
          bestScore = score;
          bestCategory = category as FoodCategory;
        }
      }

      // Calculate overall confidence
      const confidence = Math.min(0.95, Math.max(0.6, bestScore + 0.3));

      // Extract matching keywords for transparency
      const keywordsList =
        this.categoryKeywords[
          bestCategory as keyof typeof this.categoryKeywords
        ] || [];
      const matchingKeywords = this.getMatchingKeywords(words, keywordsList);

      const result: ClassificationResult = {
        isFood: true,
        category: bestCategory,
        confidence: confidence,
        reasoning: `Detected ${matchingKeywords.length} food-related keywords in ${bestCategory} category`,
        keywords: matchingKeywords,
      };

      logger.info(
        `Classification result: ${bestCategory} (confidence: ${confidence.toFixed(
          2
        )})`
      );
      return result;
    } catch (error: any) {
      logger.error("Food classification failed:", error);

      // Fail safely - assume it's food but categorize as Other
      return {
        isFood: true,
        category: FoodCategory.Other,
        confidence: 0.5,
        reasoning: `Classification error: ${error.message}`,
        keywords: [],
      };
    }
  }

  /**
   * Extract meaningful words from text
   */
  private extractWords(text: string): string[] {
    return text
      .replace(/[^\w\s-]/g, " ") // Replace punctuation with spaces
      .split(/\s+/)
      .filter((word) => word.length > 2) // Filter out short words
      .map((word) => word.toLowerCase());
  }

  /**
   * Check if text contains any keywords from the list
   */
  private hasKeywords(words: string[], keywords: string[]): boolean {
    return words.some((word) =>
      keywords.some(
        (keyword) => word.includes(keyword) || keyword.includes(word)
      )
    );
  }

  /**
   * Calculate keyword match score (0-1)
   */
  private calculateKeywordScore(words: string[], keywords: string[]): number {
    let matches = 0;
    let totalRelevance = 0;

    for (const word of words) {
      for (const keyword of keywords) {
        if (word.includes(keyword) || keyword.includes(word)) {
          matches++;
          // Longer keywords get higher relevance
          totalRelevance += keyword.length / 10;
        }
      }
    }

    if (matches === 0) return 0;

    // Normalize score based on text length and keyword relevance
    const normalizedScore = Math.min(
      1,
      (matches * totalRelevance) / (words.length + 5)
    );
    return normalizedScore;
  }

  /**
   * Get list of matching keywords for transparency
   */
  private getMatchingKeywords(words: string[], keywords: string[]): string[] {
    const matches: string[] = [];

    for (const word of words) {
      for (const keyword of keywords) {
        if (
          (word.includes(keyword) || keyword.includes(word)) &&
          !matches.includes(keyword)
        ) {
          matches.push(keyword);
        }
      }
    }

    return matches;
  }
}

/**
 * ML Microservice Food Classifier
 * Calls external machine learning service for classification
 */
export class MLServiceClassifier extends FoodClassifier {
  public name = "ml-service-classifier";

  private serviceUrl: string;
  private apiKey?: string;
  private timeout = 5000; // 5 seconds

  constructor(serviceUrl: string, apiKey?: string) {
    super();
    this.serviceUrl = serviceUrl;
    this.apiKey = apiKey;
  }

  async classify(text: string, metadata?: any): Promise<ClassificationResult> {
    try {
      logger.info(`Calling ML classification service: ${this.serviceUrl}`);

      const requestData = {
        text,
        metadata,
        options: {
          return_keywords: true,
          return_confidence: true,
        },
      };

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (this.apiKey) {
        headers["Authorization"] = `Bearer ${this.apiKey}`;
      }

      const response = await axios.post(this.serviceUrl, requestData, {
        headers,
        timeout: this.timeout,
      });

      // Validate response structure
      if (!response.data || typeof response.data.isFood !== "boolean") {
        throw new Error("Invalid response format from ML service");
      }

      const result: ClassificationResult = {
        isFood: response.data.isFood,
        category: response.data.category || FoodCategory.Other,
        confidence: response.data.confidence || 0.5,
        reasoning: response.data.reasoning,
        keywords: response.data.keywords,
      };

      logger.info(
        `ML Classification: ${result.category} (confidence: ${result.confidence})`
      );
      return result;
    } catch (error: any) {
      logger.error("ML classification service failed:", error);

      // Fallback to keyword classifier
      logger.info("Falling back to keyword classifier");
      const keywordClassifier = new KeywordFoodClassifier();
      return await keywordClassifier.classify(text, metadata);
    }
  }
}

/**
 * Factory function to create classifier based on configuration
 */
export function createFoodClassifier(): FoodClassifier {
  const classifierType =
    process.env.FOOD_CLASSIFIER_TYPE?.toLowerCase() || "keyword";

  switch (classifierType) {
    case "ml-service":
    case "microservice":
      const serviceUrl = process.env.CLASSIFIER_SERVICE_URL;
      const apiKey = process.env.CLASSIFIER_API_KEY;

      if (!serviceUrl) {
        logger.warn(
          "ML service URL not configured, falling back to keyword classifier"
        );
        return new KeywordFoodClassifier();
      }

      logger.info(`Creating ML service classifier: ${serviceUrl}`);
      return new MLServiceClassifier(serviceUrl, apiKey);

    case "keyword":
    default:
      logger.info("Creating keyword-based food classifier");
      return new KeywordFoodClassifier();
  }
}

/**
 * Validate classification result
 */
export function validateClassificationResult(
  result: ClassificationResult
): boolean {
  return (
    typeof result.isFood === "boolean" &&
    Object.values(FoodCategory).includes(result.category) &&
    typeof result.confidence === "number" &&
    result.confidence >= 0 &&
    result.confidence <= 1
  );
}
