import {
  KeywordFoodClassifier,
  createFoodClassifier,
  FoodCategory,
} from "../../src/services/classifier";

describe("Food Classifier Service", () => {
  let classifier: KeywordFoodClassifier;

  beforeEach(() => {
    process.env.FOOD_CLASSIFIER = "keyword";
    classifier = createFoodClassifier() as KeywordFoodClassifier;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("classify", () => {
    it("should classify ingredients correctly", async () => {
      const testCases = [
        "This organic flour contains gluten",
        "These tomatoes are fresh and locally grown",
        "The milk has added vitamin D",
        "These eggs are from free-range chickens",
      ];

      for (const text of testCases) {
        const result = await classifier.classify(text);
        expect(result.isFood).toBe(true);
        expect(result.category).toBe(FoodCategory.Ingredient);
        expect(result.confidence).toBeGreaterThan(0);
        if (result.keywords) {
          expect(result.keywords.length).toBeGreaterThan(0);
        }
      }
    });

    it("should classify dishes correctly", async () => {
      const testCases = [
        "This pizza tastes amazing and fresh",
        "The pasta has perfect texture",
        "Great burger with excellent flavor",
        "Delicious soup with great aroma",
      ];

      for (const text of testCases) {
        const result = await classifier.classify(text);
        expect(result.isFood).toBe(true);
        expect(result.category).toBe(FoodCategory.Dish);
        expect(result.confidence).toBeGreaterThan(0);
      }
    });

    it("should classify diet correctly", async () => {
      const testCases = [
        "This vegan diet is very healthy",
        "Keto diet helps with weight loss",
        "Mediterranean diet has many benefits",
        "Gluten-free diet is necessary for some people",
      ];

      for (const text of testCases) {
        const result = await classifier.classify(text);
        expect(result.isFood).toBe(true);
        expect(result.category).toBe(FoodCategory.Diet);
        expect(result.confidence).toBeGreaterThan(0);
      }
    });

    it("should classify restaurants correctly", async () => {
      const testCases = [
        "This restaurant has excellent service",
        "Great dining experience at this place",
        "The chef at this restaurant is amazing",
        "Fast food chain with good quality",
      ];

      for (const text of testCases) {
        const result = await classifier.classify(text);
        expect(result.isFood).toBe(true);
        expect(result.category).toBe(FoodCategory.Restaurant);
        expect(result.confidence).toBeGreaterThan(0);
      }
    });

    it("should handle mixed content", async () => {
      const mixedText =
        "This fresh organic chicken dish from a great restaurant has high nutrition value";

      const result = await classifier.classify(mixedText);
      expect(result.isFood).toBe(true);
      expect(Object.values(FoodCategory)).toContain(result.category);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it("should handle non-food content", async () => {
      const testCases = [
        "The weather is nice today",
        "I need to buy a new car",
        "Technology trends in 2024",
        "Sports team performance analysis",
      ];

      for (const text of testCases) {
        const result = await classifier.classify(text);
        // Non-food content should either be classified as not food or assigned Other category
        if (result.isFood) {
          expect(result.category).toBe(FoodCategory.Other);
        }
        expect(result.confidence).toBeGreaterThanOrEqual(0);
      }
    });

    it("should handle empty or invalid input", async () => {
      const testCases = ["", "   ", "xyz123!@#"];

      for (const text of testCases) {
        const result = await classifier.classify(text);
        expect(Object.values(FoodCategory)).toContain(result.category);
        expect(result.confidence).toBeGreaterThanOrEqual(0);
      }
    });

    it("should return keyword matches when available", async () => {
      const text = "Fresh organic ingredients make a delicious dish";

      const result = await classifier.classify(text);
      expect(result.isFood).toBe(true);
      if (result.keywords) {
        expect(result.keywords.length).toBeGreaterThan(0);
        expect(
          result.keywords.some((keyword) =>
            text.toLowerCase().includes(keyword.toLowerCase())
          )
        ).toBe(true);
      }
    });
  });

  describe("confidence scoring", () => {
    it("should give higher confidence for multiple keyword matches", async () => {
      const highMatchText =
        "Fresh organic ingredients make delicious dishes at premium restaurants";
      const lowMatchText = "This item exists somewhere";

      const highResult = await classifier.classify(highMatchText);
      const lowResult = await classifier.classify(lowMatchText);

      if (highResult.isFood && lowResult.isFood) {
        expect(highResult.confidence).toBeGreaterThan(lowResult.confidence);
      }
    });

    it("should normalize confidence scores", async () => {
      const text =
        "Premium quality ingredients with excellent taste and nutrition";

      const result = await classifier.classify(text);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe("factory function", () => {
    it("should create keyword classifier by default", () => {
      const classifier = createFoodClassifier();
      expect(classifier).toBeInstanceOf(KeywordFoodClassifier);
    });

    it("should create keyword classifier when specified", () => {
      process.env.FOOD_CLASSIFIER = "keyword";
      const classifier = createFoodClassifier();
      expect(classifier).toBeInstanceOf(KeywordFoodClassifier);
    });

    it("should fallback to keyword classifier for unknown types", () => {
      process.env.FOOD_CLASSIFIER = "unknown";
      const classifier = createFoodClassifier();
      expect(classifier).toBeInstanceOf(KeywordFoodClassifier);
    });
  });

  describe("category validation", () => {
    it("should only return valid food categories", async () => {
      const testTexts = [
        "Random text content",
        "Food related content with ingredients",
        "Quality and taste testing",
        "Restaurant and dining information",
      ];

      for (const text of testTexts) {
        const result = await classifier.classify(text);
        expect(Object.values(FoodCategory)).toContain(result.category);
      }
    });
  });
});
