import { createRequire } from 'module'
import { asyncHandler } from '../utils/asyncHandler.js'
import { extractSkillsFromResume } from '../services/groqService.js'

const require = createRequire(import.meta.url)
const PDFParser = require('pdf2json')

export const parseResume = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' })
  }

  if (req.file.mimetype !== 'application/pdf') {
    return res.status(400).json({ message: 'Only PDF files are accepted' })
  }

  let text = ''
  try {
    text = await new Promise((resolve, reject) => {
      const parser = new PDFParser(null, 1)
      parser.on('pdfParser_dataReady', () => {
        resolve(parser.getRawTextContent())
      })
      parser.on('pdfParser_dataError', (err) => {
        reject(new Error(err.parserError || 'Parse failed'))
      })
      parser.parseBuffer(req.file.buffer)
    })
  } catch (err) {
    console.error('pdf2json error:', err.message)
    return res.status(500).json({ message: 'Could not extract text from PDF' })
  }

  if (!text || text.trim().length === 0) {
    return res.status(400).json({ message: 'PDF appears empty or scanned. Use a text-based PDF.' })
  }

  const skills = await extractSkillsFromResume(text)
  res.json({ skills })
})