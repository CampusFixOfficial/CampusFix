const Department = require('../../models/Department');
const { DEFAULT_DEPARTMENTS } = require('../../config/departments');

function scoreText(text, department) {
  const normalized = String(text || '').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ');
  const matches = department.keywords.filter((keyword) => normalized.includes(keyword.toLowerCase()));
  return { department, matchCount: matches.length, score: matches.length ? matches.length / Math.sqrt(department.keywords.length) : 0 };
}

async function classifyByKeywords(text) {
  try {
    const records = await Department.find({ name: { $in: DEFAULT_DEPARTMENTS.map((item) => item.name) }, isActive: true });
    const recordByName = new Map(records.map((record) => [record.name, record]));
    const scores = DEFAULT_DEPARTMENTS.map((department) => {
      const record = recordByName.get(department.name);
      const liveRules = record?.keywords?.length ? { ...department, keywords: record.keywords } : department;
      return { ...scoreText(text, liveRules), record };
    })
      .filter((item) => item.matchCount > 0)
      .sort((a, b) => b.score - a.score || b.matchCount - a.matchCount);

    if (!scores.length) return { departmentId: null, departmentName: null, confidence: 0, method: 'keyword' };

    const best = scores[0];
    const record = best.record;
    return {
      departmentId: record?._id || null,
      departmentName: best.department.name,
      confidence: Math.min(best.matchCount / 3, 1),
      method: 'keyword',
      slaHours: record?.slaHours || best.department.slaHours,
    };
  } catch (error) {
    console.error('Keyword classifier error:', error);
    return { departmentId: null, departmentName: null, confidence: 0, method: 'keyword' };
  }
}

module.exports = { classifyByKeywords };
