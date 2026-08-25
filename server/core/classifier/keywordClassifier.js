// =============================================================
// CampusFix - Rule-Based Keyword Classifier
// =============================================================
// Scores complaint text against department keyword sets
// and returns the best-matching department.
// Owner: Bhavishya (routing/classification)
// =============================================================

const Department = require('../../models/Department');

/**
 * Classify a complaint based on keyword matching.
 * 
 * @param {string} text - The complaint text (title + description)
 * @returns {object} - { departmentId, departmentName, confidence, method }
 */
const classifyByKeywords = async (text) => {
  try {
    // Get all active departments with their keywords
    const departments = await Department.find({ isActive: true });

    if (!departments.length) {
      return { departmentId: null, departmentName: null, confidence: 0, method: 'keyword' };
    }

    // Normalize the text: lowercase, remove punctuation
    const normalizedText = text.toLowerCase().replace(/[^\w\s]/g, '');
    const words = normalizedText.split(/\s+/);

    // Score each department
    const scores = departments.map(dept => {
      let matchCount = 0;
      let totalKeywords = dept.keywords.length || 1; // avoid division by zero

      dept.keywords.forEach(keyword => {
        // Check if the keyword (which could be a phrase) appears in the text
        if (normalizedText.includes(keyword.toLowerCase())) {
          matchCount++;
        }
      });

      return {
        department: dept,
        score: matchCount / totalKeywords, // Normalized score (0 to 1)
        matchCount,
      };
    });

    // Sort by score (highest first)
    scores.sort((a, b) => b.score - a.score);

    const best = scores[0];

    // If no keywords matched, return null (needs manual review)
    if (best.matchCount === 0) {
      return {
        departmentId: null,
        departmentName: null,
        confidence: 0,
        method: 'keyword',
      };
    }

    return {
      departmentId: best.department._id,
      departmentName: best.department.name,
      confidence: Math.min(best.score, 1),
      method: 'keyword',
    };

  } catch (error) {
    console.error('Keyword classifier error:', error);
    return { departmentId: null, departmentName: null, confidence: 0, method: 'keyword' };
  }
};

module.exports = { classifyByKeywords };
