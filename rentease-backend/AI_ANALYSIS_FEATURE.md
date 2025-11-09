# AI Financial Analysis Feature

## Overview

This feature leverages Google's Gemini AI to analyze tenant financial data and provide personalized insights, tips, and recommendations to help users better manage their finances.

## Endpoint

### POST `/api/ai/analyze`

**Authentication**: Required (Tenant only)

**Description**: Analyzes the authenticated tenant's complete financial data including expenses, bills, rent plan, and payment history. Uses Gemini AI to generate personalized financial insights and recommendations.

**Request**: No body required (uses authenticated user's data)

**Response Structure**:

```json
{
  "success": true,
  "userData": {
    "user": {
      "name": "string",
      "memberSince": "timestamp",
      "rewardPoints": number
    },
    "rentPlan": {
      "monthlyRent": number,
      "deposit": number,
      "duration": number
    },
    "expenses": {
      "total": number,
      "count": number,
      "byCategory": {
        "category_name": number
      },
      "last30Days": {
        "total": number,
        "count": number
      },
      "recentTransactions": [
        {
          "category": "string",
          "amount": number,
          "date": "timestamp",
          "description": "string"
        }
      ]
    },
    "bills": {
      "paid": {
        "count": number,
        "total": number
      },
      "unpaid": {
        "count": number,
        "total": number
      }
    }
  },
  "analysis": "string (AI-generated analysis with insights and recommendations)",
  "generatedAt": "timestamp"
}
```

## AI Analysis Includes

The AI-generated analysis provides:

1. **Financial Health Overview** - Assessment of current financial situation
2. **Spending Patterns** - Analysis of expense categories and habits
3. **Key Insights** - 3-5 specific observations about finances
4. **Actionable Tips** - 5-7 practical recommendations for improvement
5. **Budget Recommendations** - Suggested budget allocation
6. **Savings Opportunities** - Areas to potentially save money

## Setup Requirements

### 1. Install Dependencies

```bash
npm install @google/generative-ai
```

### 2. Get Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

### 3. Configure Environment Variables

Add to your `.env` file:

```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

## Usage Examples

### Frontend Integration

```javascript
// React/JavaScript example
const analyzeFinances = async () => {
  try {
    const response = await fetch("http://localhost:5001/api/ai/analyze", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${userToken}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (data.success) {
      console.log("User Data:", data.userData);
      console.log("AI Analysis:", data.analysis);

      // Display analysis to user
      setAnalysisResult(data.analysis);
      setFinancialData(data.userData);
    }
  } catch (error) {
    console.error("Failed to get AI analysis:", error);
  }
};
```

### cURL Test

```bash
# Login first
TOKEN=$(curl -s -X POST "http://localhost:5001/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"tenant@example.com","password":"password123"}' | \
  grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# Get AI analysis
curl -X POST "http://localhost:5001/api/ai/analyze" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

### Test Script

```bash
# Run the provided test script
./test-ai-analysis.sh
```

## Data Privacy & Security

- ✅ Only authenticated tenants can access this endpoint
- ✅ Users can only analyze their own financial data
- ✅ No data is stored by the AI service (Gemini processes on-demand)
- ✅ Sensitive information (passwords, tokens) is never sent to AI
- ✅ All communication is over HTTPS in production

## Error Handling

### Common Errors

**403 Forbidden**

```json
{
  "error": "Only tenants can analyze their finances"
}
```

_Solution_: Ensure you're logged in as a tenant user.

**500 Internal Server Error**

```json
{
  "error": "Failed to generate AI analysis. Please try again later."
}
```

_Possible causes_:

- Invalid or missing GEMINI_API_KEY
- Gemini API rate limit exceeded
- Network connectivity issues

**401 Unauthorized**

```json
{
  "error": "Unauthorized"
}
```

_Solution_: Provide a valid authentication token.

## Response Time

- Typical response time: 2-5 seconds
- Depends on Gemini API response time
- May be slower for users with extensive transaction history

## Rate Limiting

Google's Gemini API free tier limits:

- 60 requests per minute
- Consider implementing caching for frequent requests
- Add a cooldown period between analyses (e.g., 1 hour)

## Future Enhancements

Potential improvements:

1. **Caching**: Store AI analysis results for 24 hours to reduce API calls
2. **Historical Tracking**: Save analysis results to track progress over time
3. **Comparison Reports**: Show improvement metrics compared to previous analyses
4. **Goal Setting**: Allow users to set financial goals and track progress
5. **Alerts**: Notify users of unusual spending patterns
6. **Multi-language**: Support analysis in multiple languages
7. **PDF Export**: Generate downloadable PDF reports

## Example AI Response

Here's a sample of what the AI might return:

```markdown
## Financial Health Overview

Your financial situation shows responsible payment behavior with all rent
obligations met on time. However, your recent spending has increased by 23%
compared to your historical average, which deserves attention.

## Spending Patterns

You're spending the most on:

1. Food & Dining ($450/month) - 28% of expenses
2. Transportation ($320/month) - 20% of expenses
3. Entertainment ($280/month) - 17% of expenses

## Key Insights

1. Your rent-to-income ratio appears healthy at approximately 30%
2. Entertainment spending increased 45% in the last 30 days
3. You've earned 450 reward points - leverage these for savings
4. No late payments recorded - excellent payment discipline
5. Recent food delivery expenses up 60% from previous month

## Actionable Tips

1. Set a monthly entertainment budget of $200 to save $80/month
2. Consider meal prepping to reduce food delivery expenses
3. Use your 450 reward points in the shop to offset upcoming expenses
4. Track daily expenses to identify unnecessary purchases
5. Create an emergency fund equal to 3 months of rent
6. Review subscriptions and cancel unused services
7. Set up automatic bill payments to maintain your perfect record

## Budget Recommendations

Based on your $1500 monthly rent:

- Housing: $1500 (30%)
- Food: $300 (6%)
- Transportation: $250 (5%)
- Savings: $500 (10%)
- Entertainment: $200 (4%)
- Other: Remaining budget

## Savings Opportunities

1. Switch to home cooking 3 more nights per week: Save $120/month
2. Use public transport twice weekly: Save $80/month
3. Cut entertainment by 30%: Save $84/month
   Total potential savings: $284/month ($3,408/year)
```

## Technical Implementation

### Files Created/Modified

1. **New Files**:

   - `src/controllers/aiController.js` - AI analysis controller
   - `src/routes/aiRoutes.js` - AI routes
   - `test-ai-analysis.sh` - Test script
   - `AI_ANALYSIS_FEATURE.md` - This documentation

2. **Modified Files**:
   - `src/server.js` - Added AI routes
   - `.env` - Added GEMINI_API_KEY
   - `package.json` - Added @google/generative-ai dependency

### Code Architecture

```
Request Flow:
1. Client sends POST to /api/ai/analyze with auth token
2. Auth middleware validates token and adds user to req
3. aiController.analyzeUserFinances executes:
   a. Validates user is a tenant
   b. Fetches all user financial data from database
   c. Calculates statistics and aggregates
   d. Formats data for AI prompt
   e. Calls Gemini AI with comprehensive prompt
   f. Returns AI analysis with user data
4. Client receives structured response with insights
```

## Support & Troubleshooting

### Verify Installation

```bash
# Check if dependency is installed
npm list @google/generative-ai

# Verify routes are registered
curl http://localhost:5001/health
```

### Debug Mode

Add logging to see what data is sent to AI:

```javascript
// In aiController.js, before AI call
console.log("Sending to AI:", JSON.stringify(userData, null, 2));
```

### API Key Issues

Test your Gemini API key:

```bash
curl -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}' \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=YOUR_API_KEY"
```

## License & Attribution

- Gemini AI by Google
- Integration by RentEase Team
- Last Updated: November 2025
