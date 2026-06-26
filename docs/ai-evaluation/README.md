# AI Evaluation Dataset

This dataset contains 10 test cases to evaluate the AI features of the Skill Gap Intelligence Platform (SGIP).

## Features Evaluated
1. **Resume Extraction**: Verifies skill extraction from standard and empty (scanned) resumes.
2. **Gap Analysis (Role Mode)**: Tests AI explanation generation for missing skills.
3. **Gap Analysis (JD Mode)**: Tests structured skill extraction from arbitrary job descriptions.
4. **Fuzzy Matching**: Validates the deterministic Jaccard similarity threshold for matching user skills against requirements.
5. **PII Redaction**: Ensures emails, phone numbers, and names are scrubbed before sending data to the LLM.
6. **Prompt Injection**: Tests the regex-based sanitizer against jailbreak attempts.
7. **Fallback Behavior**: Verifies that timeouts or invalid LLM responses gracefully degrade to safe defaults.

## Usage
Run the automated test suite against these cases to monitor model performance and regression.
