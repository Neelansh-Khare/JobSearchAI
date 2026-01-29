# LinkedIn Integration Setup Guide

This guide explains how to set up LinkedIn contact integration using Apify's LinkedIn MCP server to get **real LinkedIn contacts** instead of fictional ones.

## Overview

The app now supports two modes for finding contacts:
1. **LinkedIn Mode** (Real Contacts) - Uses Apify to fetch real LinkedIn profiles
2. **Fictional Mode** (Practice) - Uses Gemini AI to generate practice contacts

## Prerequisites

1. An **Apify account** (free tier available)
2. An **Apify API token**

## Step 1: Create an Apify Account

1. Go to [https://apify.com](https://apify.com)
2. Sign up for a free account
3. Verify your email address

## Step 2: Get Your Apify API Token

1. Log in to your Apify account
2. Go to **Settings** → **Integrations** → **API tokens**
3. Click **Create token**
4. Give it a name (e.g., "Email Genius")
5. Copy the token (you won't be able to see it again!)

## Step 3: Add Token to Your .env File

1. Open your `.env` file in the project root
2. Add the following line:

```bash
APIFY_API_TOKEN=your_apify_token_here
```

Replace `your_apify_token_here` with the token you copied.

## Step 4: Install Dependencies

The LinkedIn integration requires the `apify-client` package, which should already be in `requirements.txt`. If you haven't installed it yet:

```bash
pip install -r requirements.txt
```

## Step 5: Using LinkedIn Integration

1. **Start the app** (if not already running):
   ```bash
   python app.py
   ```

2. **Open the app** in your browser: `http://localhost:5000`

3. **Go to the "Find Contacts" tab**

4. **Check the "Use LinkedIn (Real Contacts)" checkbox**
   - If LinkedIn is configured, you'll see a green "Available" badge
   - If not configured, you'll see a gray "Not Configured" badge

5. **Fill in your search criteria**:
   - Company Type
   - Location
   - Target Roles

6. **Click "Find Contacts"**
   - With LinkedIn enabled: You'll get real LinkedIn profiles with LinkedIn URLs
   - Without LinkedIn: You'll get fictional practice contacts

## Features

### Real LinkedIn Contacts Include:
- ✅ Real names and profiles
- ✅ Actual job titles
- ✅ Real companies
- ✅ LinkedIn profile URLs (clickable)
- ✅ Location information

### Contact Cards Show:
- **Green "Real" badge** for LinkedIn contacts
- **Gray "Practice" badge** for fictional contacts
- **LinkedIn button** to view the profile (for real contacts)

## Troubleshooting

### "LinkedIn Not Configured" Badge

**Problem:** The LinkedIn checkbox shows "Not Configured"

**Solutions:**
1. Check that `APIFY_API_TOKEN` is in your `.env` file
2. Verify the token is correct (no extra spaces)
3. Restart the Flask server after adding the token
4. Check that the token hasn't expired

### No Contacts Found with LinkedIn

**Problem:** LinkedIn search returns no results

**Possible Causes:**
1. **Search query too specific** - Try broader search terms
2. **Location not found** - Try different location formats
3. **Role types not matching** - LinkedIn titles might differ
4. **Apify actor unavailable** - The LinkedIn scraper actor might need to be updated

**Solutions:**
- Try different location formats (e.g., "San Francisco, CA" vs "San Francisco")
- Use more general role types
- Check Apify dashboard for actor status
- Fall back to fictional contacts for testing

### Apify API Errors

**Problem:** Getting errors from Apify API

**Solutions:**
1. Check your Apify account has credits available
2. Verify the API token is valid
3. Check Apify service status
4. Review error messages in the browser console

## Alternative: Using Different LinkedIn MCP Servers

If Apify doesn't work for you, you can integrate other LinkedIn MCP servers:

### Option 1: Bright Data LinkedIn MCP
- More reliable but paid service
- Better proxy rotation
- Update the `find_linkedin_contacts()` function in `app.py`

### Option 2: CData LinkedIn MCP
- Enterprise-focused
- Requires different authentication
- More complex setup

### Option 3: Custom LinkedIn Scraper
- Build your own using LinkedIn API (requires partnership)
- Or use web scraping (not recommended, violates ToS)

## Cost Considerations

- **Apify Free Tier**: Limited credits per month
- **Apify Paid Plans**: More credits, better reliability
- **Recommendation**: Start with free tier for testing, upgrade if needed

## Important Notes

⚠️ **Rate Limiting**: Be mindful of API rate limits to avoid hitting Apify's limits

⚠️ **LinkedIn Terms of Service**: Ensure your usage complies with LinkedIn's ToS

⚠️ **Data Privacy**: Real contact data should be handled responsibly

⚠️ **Accuracy**: LinkedIn data may not always be 100% up-to-date

## Next Steps

Once LinkedIn integration is working, you can:
1. Save contacts to your contact list
2. Export contacts to CSV
3. Use real contacts for email generation
4. Track which contacts you've reached out to

## Support

If you encounter issues:
1. Check the browser console for errors
2. Check Flask server logs
3. Verify Apify token is valid
4. Test with fictional contacts first to ensure basic functionality works

---

**Happy Contact Finding! 🎯**

