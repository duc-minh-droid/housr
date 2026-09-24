# Quick Start: AI Financial Analysis

## What This Does

Analyzes a tenant's complete financial data (expenses, bills, rent payments) using Google's Gemini AI and provides:

- Financial health assessment
- Spending pattern analysis
- Personalized tips and recommendations
- Budget suggestions
- Savings opportunities

## Setup (3 steps)

### 1. Get Gemini API Key (Free)

Visit: https://makersuite.google.com/app/apikey

- Sign in with Google
- Click "Create API Key"
- Copy the key

### 2. Add to .env

```bash
GEMINI_API_KEY=your_api_key_here
```

### 3. Install & Test

```bash
npm install
npm run dev
```

In another terminal:

```bash
./setup-ai-analysis.sh
```

## API Usage

### Endpoint

```
POST /api/ai/analyze
Authorization: Bearer {tenant_token}
```

### Example Response

```json
{
  "success": true,
  "userData": {
    "expenses": { "total": 1250, "count": 15 },
    "bills": { "paid": { "total": 4500, "count": 3 } }
  },
  "analysis": "## Financial Health Overview\nYour financial...",
  "generatedAt": "2025-11-09T10:30:00.000Z"
}
```

## Frontend Integration

```javascript
const getAIAnalysis = async (token) => {
  const response = await fetch("http://localhost:5001/api/ai/analyze", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  return response.json();
};
```

## Files Added

- `src/controllers/aiController.js` - AI analysis logic
- `src/routes/aiRoutes.js` - Route definitions
- `test-ai-analysis.sh` - Test script
- `AI_ANALYSIS_FEATURE.md` - Full documentation

## Troubleshooting

**"Failed to generate AI analysis"**

- Check GEMINI_API_KEY in .env
- Verify API key at https://makersuite.google.com/app/apikey

**"Only tenants can analyze"**

- Login as a tenant user (not landlord)

**Server not responding**

- Make sure server is running: `npm run dev`

## Security Notes

- ✅ Tenant authentication required
- ✅ Users can only see their own data
- ✅ No data stored by AI service
- ✅ API key secured in environment variables

---

For detailed documentation, see: [AI_ANALYSIS_FEATURE.md](./AI_ANALYSIS_FEATURE.md)
