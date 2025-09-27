export interface SentimentResult {
    score: number;
    label: "positive" | "negative" | "neutral";
    confidence: number;
}
export interface PredictionAnalysis {
    sentiment: SentimentResult;
    keyWords: string[];
    complexity: "low" | "medium" | "high";
    category: string;
}
declare class AnalysisService {
    private positiveWords;
    private negativeWords;
    private uncertainWords;
    analyzeSentiment(text: string): SentimentResult;
    extractKeyWords(text: string): string[];
    assessComplexity(text: string): "low" | "medium" | "high";
    categorize(text: string): string;
    analyzePrediction(question: string, prediction: string): PredictionAnalysis;
    batchAnalyze(predictions: Array<{
        question: string;
        prediction: string;
    }>): Promise<PredictionAnalysis[]>;
}
declare const analysisService: AnalysisService;
export default analysisService;
//# sourceMappingURL=analysisService.d.ts.map