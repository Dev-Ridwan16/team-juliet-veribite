export declare enum FoodCategory {
    Ingredient = "Ingredient",
    Dish = "Dish",
    Diet = "Diet",
    Restaurant = "Restaurant",
    Consumption = "Consumption",
    FoodPolicy = "FoodPolicy",
    Other = "Other"
}
export interface ClassificationResult {
    isFood: boolean;
    category: FoodCategory;
    confidence: number;
    reasoning?: string;
    keywords?: string[];
}
export declare abstract class FoodClassifier {
    abstract name: string;
    abstract classify(text: string, metadata?: any): Promise<ClassificationResult>;
}
export declare class KeywordFoodClassifier extends FoodClassifier {
    name: string;
    private readonly categoryKeywords;
    private readonly generalFoodKeywords;
    classify(text: string, metadata?: any): Promise<ClassificationResult>;
    private extractWords;
    private hasKeywords;
    private calculateKeywordScore;
    private getMatchingKeywords;
}
export declare class MLServiceClassifier extends FoodClassifier {
    name: string;
    private serviceUrl;
    private apiKey?;
    private timeout;
    constructor(serviceUrl: string, apiKey?: string);
    classify(text: string, metadata?: any): Promise<ClassificationResult>;
}
export declare function createFoodClassifier(): FoodClassifier;
export declare function validateClassificationResult(result: ClassificationResult): boolean;
//# sourceMappingURL=classifier.d.ts.map