import {
  createFoodClassifier,
  FoodCategory,
} from "../../src/services/classifier";

describe("Food Classifier Service", () => {
  describe("createFoodClassifier", () => {
    it("should create a classifier instance", () => {
      const classifier = createFoodClassifier();
      expect(classifier).toBeDefined();
      expect(typeof classifier.classify).toBe("function");
    });

    it("should classify food text correctly", async () => {
      const classifier = createFoodClassifier();

      const result = await classifier.classify(
        "These organic tomatoes are fresh ingredients"
      );

      expect(result).toBeDefined();
      expect(result.isFood).toBe(true);
      expect(result.category).toBe(FoodCategory.Ingredient);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it("should handle different food categories", async () => {
      const classifier = createFoodClassifier();

      const testCases = [
        {
          text: "This pizza dish is delicious",
          expectedCategory: FoodCategory.Dish,
        },
        {
          text: "This restaurant serves great food",
          expectedCategory: FoodCategory.Restaurant,
        },
        {
          text: "Mediterranean diet is healthy",
          expectedCategory: FoodCategory.Diet,
        },
      ];

      for (const testCase of testCases) {
        const result = await classifier.classify(testCase.text);
        expect(result.isFood).toBe(true);
        expect(result.category).toBe(testCase.expectedCategory);
      }
    });

    it("should provide keywords when available", async () => {
      const classifier = createFoodClassifier();

      const result = await classifier.classify("Fresh organic ingredients");

      expect(result.isFood).toBe(true);
      if (result.keywords) {
        expect(Array.isArray(result.keywords)).toBe(true);
        expect(result.keywords.length).toBeGreaterThan(0);
      }
    });
  });

  describe("FoodCategory enum", () => {
    it("should contain all required categories", () => {
      const categories = Object.values(FoodCategory);
      const expectedCategories = [
        "Ingredient",
        "Dish",
        "Diet",
        "Restaurant",
        "Consumption",
        "FoodPolicy",
        "Other",
      ];

      expectedCategories.forEach((category) => {
        expect(categories).toContain(category);
      });
    });
  });
});
