import logger from "../utils/logger";

export interface SentimentResult {
  score: number; // -1 to 1, where -1 is most negative, 1 is most positive
  label: "positive" | "negative" | "neutral";
  confidence: number; // 0 to 1
}

export interface PredictionAnalysis {
  sentiment: SentimentResult;
  keyWords: string[];
  complexity: "low" | "medium" | "high";
  category: string;
}

// Simple sentiment analysis (in production, you'd use a proper NLP service)
class AnalysisService {
  private positiveWords = [
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

  private negativeWords = [
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

  private uncertainWords = [
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

  // Analyze sentiment of prediction text
  analyzeSentiment(text: string): SentimentResult {
    try {
      const words = text.toLowerCase().split(/\s+/);
      let positiveScore = 0;
      let negativeScore = 0;
      let uncertainScore = 0;

      // Count sentiment indicators
      words.forEach((word) => {
        if (this.positiveWords.includes(word)) positiveScore++;
        if (this.negativeWords.includes(word)) negativeScore++;
        if (this.uncertainWords.includes(word)) uncertainScore++;
      });

      // Calculate overall sentiment
      const totalSentimentWords =
        positiveScore + negativeScore + uncertainScore;

      if (totalSentimentWords === 0) {
        return {
          score: 0,
          label: "neutral",
          confidence: 0.5,
        };
      }

      // Calculate normalized scores
      const normalizedPositive = positiveScore / totalSentimentWords;
      const normalizedNegative = negativeScore / totalSentimentWords;
      const normalizedUncertain = uncertainScore / totalSentimentWords;

      // Calculate sentiment score (-1 to 1)
      let score = normalizedPositive - normalizedNegative;

      // Reduce confidence if there's uncertainty
      let confidence = Math.abs(score);
      if (normalizedUncertain > 0.3) {
        confidence *= 1 - normalizedUncertain;
        score *= 1 - normalizedUncertain * 0.5;
      }

      // Determine label
      let label: "positive" | "negative" | "neutral";
      if (score > 0.1) {
        label = "positive";
      } else if (score < -0.1) {
        label = "negative";
      } else {
        label = "neutral";
      }

      // Ensure confidence is between 0 and 1
      confidence = Math.max(0.1, Math.min(1, confidence));

      return {
        score: Math.max(-1, Math.min(1, score)),
        label,
        confidence,
      };
    } catch (error: any) {
      logger.error("Error in sentiment analysis:", error);
      return {
        score: 0,
        label: "neutral",
        confidence: 0.5,
      };
    }
  }

  // Extract key words from text
  extractKeyWords(text: string): string[] {
    try {
      // Simple keyword extraction (in production, use proper NLP)
      const words = text
        .toLowerCase()
        .replace(/[^\w\s]/g, " ")
        .split(/\s+/)
        .filter((word) => word.length > 3);

      // Remove common stop words
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

      // Count word frequency
      const wordCount: Record<string, number> = {};
      filteredWords.forEach((word) => {
        wordCount[word] = (wordCount[word] || 0) + 1;
      });

      // Return top keywords
      return Object.entries(wordCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([word]) => word);
    } catch (error: any) {
      logger.error("Error extracting keywords:", error);
      return [];
    }
  }

  // Determine prediction complexity
  assessComplexity(text: string): "low" | "medium" | "high" {
    try {
      const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
      const avgWordsPerSentence = text.split(/\s+/).length / sentences.length;

      const complexWords = text
        .split(/\s+/)
        .filter((word) => word.length > 8).length;
      const totalWords = text.split(/\s+/).length;
      const complexWordRatio = complexWords / totalWords;

      // Technical/financial terms indicate higher complexity
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
      const hasTechnicalTerms = technicalTerms.some((term) =>
        text.toLowerCase().includes(term)
      );

      if (
        avgWordsPerSentence > 20 ||
        complexWordRatio > 0.3 ||
        hasTechnicalTerms
      ) {
        return "high";
      } else if (avgWordsPerSentence > 12 || complexWordRatio > 0.15) {
        return "medium";
      } else {
        return "low";
      }
    } catch (error: any) {
      logger.error("Error assessing complexity:", error);
      return "medium";
    }
  }

  // Categorize prediction
  categorize(text: string): string {
    try {
      const content = text.toLowerCase();

      // Define category keywords
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

      // Count matches for each category
      Object.entries(categories).forEach(([category, keywords]) => {
        const matches = keywords.filter((keyword) =>
          content.includes(keyword)
        ).length;
        if (matches > maxMatches) {
          maxMatches = matches;
          bestCategory = category;
        }
      });

      return bestCategory;
    } catch (error: any) {
      logger.error("Error categorizing prediction:", error);
      return "General";
    }
  }

  // Full analysis of a prediction
  analyzePrediction(question: string, prediction: string): PredictionAnalysis {
    try {
      const fullText = `${question} ${prediction}`;

      const sentiment = this.analyzeSentiment(prediction);
      const keyWords = this.extractKeyWords(fullText);
      const complexity = this.assessComplexity(fullText);
      const category = this.categorize(fullText);

      logger.info("Prediction analysis completed", {
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
    } catch (error: any) {
      logger.error("Error in full prediction analysis:", error);
      // Return safe defaults
      return {
        sentiment: { score: 0, label: "neutral", confidence: 0.5 },
        keyWords: [],
        complexity: "medium",
        category: "General",
      };
    }
  }

  // Batch analysis for multiple predictions
  async batchAnalyze(
    predictions: Array<{ question: string; prediction: string }>
  ): Promise<PredictionAnalysis[]> {
    try {
      const results: PredictionAnalysis[] = [];

      for (const pred of predictions) {
        const analysis = this.analyzePrediction(pred.question, pred.prediction);
        results.push(analysis);

        // Small delay to prevent overwhelming the system
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      logger.info(
        `Batch analysis completed for ${predictions.length} predictions`
      );
      return results;
    } catch (error: any) {
      logger.error("Error in batch analysis:", error);
      throw error;
    }
  }
}

// Export singleton instance
const analysisService = new AnalysisService();
export default analysisService;
