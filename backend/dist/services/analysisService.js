"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("../utils/logger"));
class AnalysisService {
    constructor() {
        this.positiveWords = [
            "good",
            "great",
            "excellent",
            "positive",
            "up",
            "rise",
            "increase",
            "bullish",
            "growth",
            "success",
            "win",
            "profit",
            "gain",
            "strong",
            "confident",
            "optimistic",
            "likely",
            "probable",
            "definitely",
        ];
        this.negativeWords = [
            "bad",
            "terrible",
            "negative",
            "down",
            "fall",
            "decrease",
            "drop",
            "bearish",
            "decline",
            "loss",
            "lose",
            "fail",
            "weak",
            "doubt",
            "pessimistic",
            "unlikely",
            "improbable",
            "never",
            "impossible",
        ];
        this.uncertainWords = [
            "maybe",
            "perhaps",
            "might",
            "could",
            "possibly",
            "uncertain",
            "unclear",
            "ambiguous",
            "depends",
            "varies",
            "fluctuate",
        ];
    }
    analyzeSentiment(text) {
        try {
            const words = text.toLowerCase().split(/\s+/);
            let positiveScore = 0;
            let negativeScore = 0;
            let uncertainScore = 0;
            words.forEach((word) => {
                if (this.positiveWords.includes(word))
                    positiveScore++;
                if (this.negativeWords.includes(word))
                    negativeScore++;
                if (this.uncertainWords.includes(word))
                    uncertainScore++;
            });
            const totalSentimentWords = positiveScore + negativeScore + uncertainScore;
            if (totalSentimentWords === 0) {
                return {
                    score: 0,
                    label: "neutral",
                    confidence: 0.5,
                };
            }
            const normalizedPositive = positiveScore / totalSentimentWords;
            const normalizedNegative = negativeScore / totalSentimentWords;
            const normalizedUncertain = uncertainScore / totalSentimentWords;
            let score = normalizedPositive - normalizedNegative;
            let confidence = Math.abs(score);
            if (normalizedUncertain > 0.3) {
                confidence *= 1 - normalizedUncertain;
                score *= 1 - normalizedUncertain * 0.5;
            }
            let label;
            if (score > 0.1) {
                label = "positive";
            }
            else if (score < -0.1) {
                label = "negative";
            }
            else {
                label = "neutral";
            }
            confidence = Math.max(0.1, Math.min(1, confidence));
            return {
                score: Math.max(-1, Math.min(1, score)),
                label,
                confidence,
            };
        }
        catch (error) {
            logger_1.default.error("Error in sentiment analysis:", error);
            return {
                score: 0,
                label: "neutral",
                confidence: 0.5,
            };
        }
    }
    extractKeyWords(text) {
        try {
            const words = text
                .toLowerCase()
                .replace(/[^\w\s]/g, " ")
                .split(/\s+/)
                .filter((word) => word.length > 3);
            const stopWords = [
                "this",
                "that",
                "with",
                "have",
                "will",
                "from",
                "they",
                "know",
                "want",
                "been",
                "good",
                "much",
                "some",
                "time",
                "very",
                "when",
                "come",
                "here",
                "just",
                "like",
                "long",
                "make",
                "many",
                "over",
                "such",
                "take",
                "than",
                "them",
                "well",
                "were",
            ];
            const filteredWords = words.filter((word) => !stopWords.includes(word));
            const wordCount = {};
            filteredWords.forEach((word) => {
                wordCount[word] = (wordCount[word] || 0) + 1;
            });
            return Object.entries(wordCount)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([word]) => word);
        }
        catch (error) {
            logger_1.default.error("Error extracting keywords:", error);
            return [];
        }
    }
    assessComplexity(text) {
        try {
            const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
            const avgWordsPerSentence = text.split(/\s+/).length / sentences.length;
            const complexWords = text
                .split(/\s+/)
                .filter((word) => word.length > 8).length;
            const totalWords = text.split(/\s+/).length;
            const complexWordRatio = complexWords / totalWords;
            const technicalTerms = [
                "algorithm",
                "blockchain",
                "cryptocurrency",
                "economic",
                "financial",
                "market",
                "analysis",
                "prediction",
                "probability",
                "statistics",
            ];
            const hasTechnicalTerms = technicalTerms.some((term) => text.toLowerCase().includes(term));
            if (avgWordsPerSentence > 20 ||
                complexWordRatio > 0.3 ||
                hasTechnicalTerms) {
                return "high";
            }
            else if (avgWordsPerSentence > 12 || complexWordRatio > 0.15) {
                return "medium";
            }
            else {
                return "low";
            }
        }
        catch (error) {
            logger_1.default.error("Error assessing complexity:", error);
            return "medium";
        }
    }
    categorize(text) {
        try {
            const content = text.toLowerCase();
            const categories = {
                Finance: [
                    "price",
                    "market",
                    "stock",
                    "crypto",
                    "bitcoin",
                    "ethereum",
                    "trading",
                    "investment",
                    "financial",
                    "economy",
                ],
                Sports: [
                    "game",
                    "match",
                    "player",
                    "team",
                    "sport",
                    "football",
                    "basketball",
                    "soccer",
                    "championship",
                    "tournament",
                ],
                Technology: [
                    "tech",
                    "software",
                    "ai",
                    "artificial intelligence",
                    "computer",
                    "internet",
                    "digital",
                    "innovation",
                    "startup",
                ],
                Politics: [
                    "election",
                    "political",
                    "government",
                    "policy",
                    "candidate",
                    "vote",
                    "democracy",
                    "legislation",
                ],
                Weather: [
                    "weather",
                    "temperature",
                    "rain",
                    "snow",
                    "storm",
                    "climate",
                    "forecast",
                    "sunny",
                    "cloudy",
                ],
                Entertainment: [
                    "movie",
                    "film",
                    "music",
                    "celebrity",
                    "entertainment",
                    "show",
                    "concert",
                    "album",
                    "actor",
                ],
                Science: [
                    "research",
                    "study",
                    "scientific",
                    "discovery",
                    "experiment",
                    "data",
                    "analysis",
                    "theory",
                ],
            };
            let bestCategory = "General";
            let maxMatches = 0;
            Object.entries(categories).forEach(([category, keywords]) => {
                const matches = keywords.filter((keyword) => content.includes(keyword)).length;
                if (matches > maxMatches) {
                    maxMatches = matches;
                    bestCategory = category;
                }
            });
            return bestCategory;
        }
        catch (error) {
            logger_1.default.error("Error categorizing prediction:", error);
            return "General";
        }
    }
    analyzePrediction(question, prediction) {
        try {
            const fullText = `${question} ${prediction}`;
            const sentiment = this.analyzeSentiment(prediction);
            const keyWords = this.extractKeyWords(fullText);
            const complexity = this.assessComplexity(fullText);
            const category = this.categorize(fullText);
            logger_1.default.info("Prediction analysis completed", {
                category,
                complexity,
                sentimentLabel: sentiment.label,
                sentimentScore: sentiment.score.toFixed(2),
                keyWordCount: keyWords.length,
            });
            return {
                sentiment,
                keyWords,
                complexity,
                category,
            };
        }
        catch (error) {
            logger_1.default.error("Error in full prediction analysis:", error);
            return {
                sentiment: { score: 0, label: "neutral", confidence: 0.5 },
                keyWords: [],
                complexity: "medium",
                category: "General",
            };
        }
    }
    async batchAnalyze(predictions) {
        try {
            const results = [];
            for (const pred of predictions) {
                const analysis = this.analyzePrediction(pred.question, pred.prediction);
                results.push(analysis);
                await new Promise((resolve) => setTimeout(resolve, 10));
            }
            logger_1.default.info(`Batch analysis completed for ${predictions.length} predictions`);
            return results;
        }
        catch (error) {
            logger_1.default.error("Error in batch analysis:", error);
            throw error;
        }
    }
}
const analysisService = new AnalysisService();
exports.default = analysisService;
//# sourceMappingURL=analysisService.js.map