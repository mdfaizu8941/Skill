const similarity = (a, b) => {
  a = a.toLowerCase().trim()
  b = b.toLowerCase().trim()
  if (a === b) return 1
  if (a.includes(b) || b.includes(a)) return 0.9
  const tokenize = str => new Set(str.split(/[\s.\\/\-_]+/).filter(Boolean))
  const setA = tokenize(a)
  const setB = tokenize(b)
  const intersection = [...setA].filter(x => setB.has(x)).length
  const union = new Set([...setA, ...setB]).size
  return union === 0 ? 0 : intersection / union
}

const MATCH_THRESHOLD = 0.5

export const analyseGap = (studentSkills, careerRole) => {
  const requiredSkills = careerRole.requiredSkills || []
  const matchedSkills = []
  const missingSkills = []
  let sumMatchedWeights = 0
  let sumTotalWeights = 0

  for (const req of requiredSkills) {
    const weight = req.weight || 5
    sumTotalWeights += weight

    const isMatched = studentSkills.some(
      s => similarity(s, req.skillName) >= MATCH_THRESHOLD
    )

    if (isMatched) {
      matchedSkills.push(req.skillName)
      sumMatchedWeights += weight
    } else {
      missingSkills.push({
        skillName: req.skillName,
        level: req.level || 'beginner',
        weight,
      })
    }
  }

  const compatibilityScore =
    sumTotalWeights > 0
      ? Math.round((sumMatchedWeights / sumTotalWeights) * 100 * 10) / 10
      : 0

  return { compatibilityScore, matchedSkills, missingSkills }
}

export const runGapEngine = (studentSkills, roleOrSkills) => {
  if (Array.isArray(roleOrSkills)) {
    return analyseGap(studentSkills, { requiredSkills: roleOrSkills })
  }
  return analyseGap(studentSkills, roleOrSkills)
}