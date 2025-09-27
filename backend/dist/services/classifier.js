"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MLServiceClassifier = exports.KeywordFoodClassifier = exports.FoodClassifier = exports.FoodCategory = void 0;
exports.createFoodClassifier = createFoodClassifier;
exports.validateClassificationResult = validateClassificationResult;
const axios_1 = __importDefault(require("axios"));
const logger_1 = __importDefault(require("../utils/logger"));
var FoodCategory;
(function (FoodCategory) {
    FoodCategory["Ingredient"] = "Ingredient";
    FoodCategory["Dish"] = "Dish";
    FoodCategory["Diet"] = "Diet";
    FoodCategory["Restaurant"] = "Restaurant";
    FoodCategory["Consumption"] = "Consumption";
    FoodCategory["FoodPolicy"] = "FoodPolicy";
    FoodCategory["Other"] = "Other";
})(FoodCategory || (exports.FoodCategory = FoodCategory = {}));
class FoodClassifier {
}
exports.FoodClassifier = FoodClassifier;
class KeywordFoodClassifier extends FoodClassifier {
    constructor() {
        super(...arguments);
        this.name = "keyword-classifier";
        this.categoryKeywords = {
            [FoodCategory.Ingredient]: [
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
                "opening",
                "closing",
                "expansion",
                "menu-change",
                "new-location",
                "bankruptcy",
            ],
            [FoodCategory.Consumption]: [
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
                "increase",
                "decrease",
                "growth",
                "decline",
                "popular",
                "unpopular",
            ],
            [FoodCategory.FoodPolicy]: [
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
                "standard",
                "guideline",
                "requirement",
                "compliance",
                "certification",
            ],
        };
        this.generalFoodKeywords = [
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
    }
    async classify(text, metadata) {
        try {
            logger_1.default.info("Classifying text for food content");
            const lowerText = text.toLowerCase();
            const words = this.extractWords(lowerText);
            const hasFoodKeywords = this.hasKeywords(words, this.generalFoodKeywords);
            if (!hasFoodKeywords) {
                let categoryMatch = null;
                let maxScore = 0;
                for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
                    const score = this.calculateKeywordScore(words, keywords);
                    if (score > maxScore) {
                        maxScore = score;
                        categoryMatch = category;
                    }
                }
                if (maxScore < 0.1) {
                    return {
                        isFood: false,
                        category: FoodCategory.Other,
                        confidence: 0.95,
                        reasoning: "No food-related keywords detected",
                    };
                }
            }
            let bestCategory = FoodCategory.Other;
            let bestScore = 0;
            const categoryScores = {};
            for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
                const score = this.calculateKeywordScore(words, keywords);
                categoryScores[category] = score;
                if (score > bestScore) {
                    bestScore = score;
                    bestCategory = category;
                }
            }
            const confidence = Math.min(0.95, Math.max(0.6, bestScore + 0.3));
            const keywordsList = this.categoryKeywords[bestCategory] || [];
            const matchingKeywords = this.getMatchingKeywords(words, keywordsList);
            const result = {
                isFood: true,
                category: bestCategory,
                confidence: confidence,
                reasoning: `Detected ${matchingKeywords.length} food-related keywords in ${bestCategory} category`,
                keywords: matchingKeywords,
            };
            logger_1.default.info(`Classification result: ${bestCategory} (confidence: ${confidence.toFixed(2)})`);
            return result;
        }
        catch (error) {
            logger_1.default.error("Food classification failed:", error);
            return {
                isFood: true,
                category: FoodCategory.Other,
                confidence: 0.5,
                reasoning: `Classification error: ${error.message}`,
                keywords: [],
            };
        }
    }
    extractWords(text) {
        return text
            .replace(/[^\w\s-]/g, " ")
            .split(/\s+/)
            .filter((word) => word.length > 2)
            .map((word) => word.toLowerCase());
    }
    hasKeywords(words, keywords) {
        return words.some((word) => keywords.some((keyword) => word.includes(keyword) || keyword.includes(word)));
    }
    calculateKeywordScore(words, keywords) {
        let matches = 0;
        let totalRelevance = 0;
        for (const word of words) {
            for (const keyword of keywords) {
                if (word.includes(keyword) || keyword.includes(word)) {
                    matches++;
                    totalRelevance += keyword.length / 10;
                }
            }
        }
        if (matches === 0)
            return 0;
        const normalizedScore = Math.min(1, (matches * totalRelevance) / (words.length + 5));
        return normalizedScore;
    }
    getMatchingKeywords(words, keywords) {
        const matches = [];
        for (const word of words) {
            for (const keyword of keywords) {
                if ((word.includes(keyword) || keyword.includes(word)) &&
                    !matches.includes(keyword)) {
                    matches.push(keyword);
                }
            }
        }
        return matches;
    }
}
exports.KeywordFoodClassifier = KeywordFoodClassifier;
class MLServiceClassifier extends FoodClassifier {
    constructor(serviceUrl, apiKey) {
        super();
        this.name = "ml-service-classifier";
        this.timeout = 5000;
        this.serviceUrl = serviceUrl;
        this.apiKey = apiKey;
    }
    async classify(text, metadata) {
        try {
            logger_1.default.info(`Calling ML classification service: ${this.serviceUrl}`);
            const requestData = {
                text,
                metadata,
                options: {
                    return_keywords: true,
                    return_confidence: true,
                },
            };
            const headers = {
                "Content-Type": "application/json",
            };
            if (this.apiKey) {
                headers["Authorization"] = `Bearer ${this.apiKey}`;
            }
            const response = await axios_1.default.post(this.serviceUrl, requestData, {
                headers,
                timeout: this.timeout,
            });
            if (!response.data || typeof response.data.isFood !== "boolean") {
                throw new Error("Invalid response format from ML service");
            }
            const result = {
                isFood: response.data.isFood,
                category: response.data.category || FoodCategory.Other,
                confidence: response.data.confidence || 0.5,
                reasoning: response.data.reasoning,
                keywords: response.data.keywords,
            };
            logger_1.default.info(`ML Classification: ${result.category} (confidence: ${result.confidence})`);
            return result;
        }
        catch (error) {
            logger_1.default.error("ML classification service failed:", error);
            logger_1.default.info("Falling back to keyword classifier");
            const keywordClassifier = new KeywordFoodClassifier();
            return await keywordClassifier.classify(text, metadata);
        }
    }
}
exports.MLServiceClassifier = MLServiceClassifier;
function createFoodClassifier() {
    const classifierType = process.env.FOOD_CLASSIFIER_TYPE?.toLowerCase() || "keyword";
    switch (classifierType) {
        case "ml-service":
        case "microservice":
            const serviceUrl = process.env.CLASSIFIER_SERVICE_URL;
            const apiKey = process.env.CLASSIFIER_API_KEY;
            if (!serviceUrl) {
                logger_1.default.warn("ML service URL not configured, falling back to keyword classifier");
                return new KeywordFoodClassifier();
            }
            logger_1.default.info(`Creating ML service classifier: ${serviceUrl}`);
            return new MLServiceClassifier(serviceUrl, apiKey);
        case "keyword":
        default:
            logger_1.default.info("Creating keyword-based food classifier");
            return new KeywordFoodClassifier();
    }
}
function validateClassificationResult(result) {
    return (typeof result.isFood === "boolean" &&
        Object.values(FoodCategory).includes(result.category) &&
        typeof result.confidence === "number" &&
        result.confidence >= 0 &&
        result.confidence <= 1);
}
//# sourceMappingURL=classifier.js.map