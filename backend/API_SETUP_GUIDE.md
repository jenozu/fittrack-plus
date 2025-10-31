# 🍽️ FitTrack+ Food API Setup Guide

This guide will help you set up the **free** food nutrition APIs used by FitTrack+.

## 📋 Overview

FitTrack+ uses **two completely free food databases**:

1. **USDA FoodData Central** - Free government database (API key required)
2. **Open Food Facts** - Free open-source database (NO API key required!)

---

## ✅ Quick Setup Checklist

- [ ] Get USDA API key (5 minutes)
- [ ] Create `.env` file in `backend/` directory
- [ ] Add USDA API key to `.env`
- [ ] Install Python dependencies
- [ ] Test the APIs

---

## 🔑 1. Get Your USDA API Key (FREE)

### What is USDA FoodData Central?
- **Cost**: 100% Free
- **Rate Limits**: None!
- **Database**: 800,000+ foods
- **Best For**: Whole foods, generic items (chicken, rice, apples, etc.)

### How to Get Your API Key:

1. **Visit**: https://fdc.nal.usda.gov/api-key-signup.html

2. **Fill out the form**:
   - First Name
   - Last Name
   - Email Address
   - Organization: (put "Personal Project" or "FitTrack+ App")

3. **Submit** the form

4. **Check your email** - You'll receive your API key instantly (usually within 1 minute)

5. **Copy** the API key from the email

**Example API Key**: `abcdef123456789abcdef123456789abcdef1234`

---

## 🌍 2. Open Food Facts (NO SETUP REQUIRED!)

### What is Open Food Facts?
- **Cost**: 100% Free & Open Source
- **API Key**: Not required!
- **Database**: 2.8+ million products worldwide
- **Best For**: Branded foods, packaged items, barcode scanning

### Features:
- ✅ No registration needed
- ✅ No API key required
- ✅ No rate limits
- ✅ Community-maintained (like Wikipedia for food)
- ✅ Barcode/UPC lookup
- ✅ Nutrition grade (A-E rating)
- ✅ Product images

**Works out of the box - no configuration needed!**

---

## ⚙️ 3. Configure Your Environment

### Step 1: Copy the Example Environment File

```bash
# Navigate to the backend directory
cd backend

# Copy the example file
cp .env.example .env
```

### Step 2: Edit the `.env` File

Open `backend/.env` in your text editor and add your USDA API key:

```env
# USDA FoodData Central API
USDA_API_KEY=paste_your_actual_api_key_here

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/fittrackplus

# Security
SECRET_KEY=your-super-secret-key-here
```

**Important**: Replace `paste_your_actual_api_key_here` with your real USDA API key!

---

## 🚀 4. Install Dependencies

Make sure you have the required Python packages installed:

```bash
# Activate your virtual environment
# On Windows:
.\venv\Scripts\activate

# On macOS/Linux:
source venv/bin/activate

# Install/update dependencies
pip install requests python-dotenv
```

---

## 🧪 5. Test Your Setup

### Test the APIs with the built-in test scripts:

#### Test Open Food Facts:
```bash
cd backend
python -c "from services.openfoodfacts_service import OpenFoodFactsService; service = OpenFoodFactsService(); print('Testing Open Food Facts...'); results = service.search_food('yogurt', limit=3); print(f'Found {len(results)} results'); [print(f'  - {r[\"food_name\"]}') for r in results]"
```

#### Test USDA:
```bash
cd backend
python -c "from services.usda_service import USDAService; service = USDAService(); print('Testing USDA...'); results = service.search_food('chicken', limit=3); print(f'Found {len(results)} results'); [print(f'  - {r[\"food_name\"]}') for r in results]"
```

Or run the comprehensive test script:

```bash
cd backend/services
python openfoodfacts_service.py
```

---

## 📊 API Comparison

| Feature | USDA FoodData Central | Open Food Facts |
|---------|----------------------|-----------------|
| **Cost** | FREE | FREE |
| **API Key** | Required (free) | Not required |
| **Rate Limits** | None | None (be reasonable) |
| **Database Size** | 800,000+ foods | 2.8M+ products |
| **Best For** | Whole/generic foods | Branded products |
| **Barcode Lookup** | Limited | Excellent |
| **Data Quality** | Government-verified | Community-verified |
| **Coverage** | Mostly US foods | Global products |

---

## 🎯 How FitTrack+ Uses These APIs

### Search Flow:
1. **User searches** for "greek yogurt"
2. **Internal database** is checked first (cached results)
3. If more results needed:
   - **Open Food Facts** is queried for branded products
   - **USDA** is queried for generic foods
4. Results are **combined and deduplicated**
5. New results are **cached** in the local database for faster future searches

### Barcode Scanning:
1. User scans a barcode
2. Internal database checked first
3. If not found, **Open Food Facts** is queried (best for barcodes)
4. Result is cached for next time

---

## 🔧 Troubleshooting

### Problem: "USDA API returns no results"

**Solutions**:
- Verify your API key is correct in `.env`
- Check that `.env` is in the `backend/` directory
- Make sure you're activating the virtual environment
- Try a simpler search term (e.g., "chicken" instead of "grilled chicken breast")

### Problem: "Open Food Facts returns empty results"

**Solutions**:
- Check your internet connection
- Try a different search term
- The API might be temporarily down (rare) - wait a few minutes

### Problem: "Module not found errors"

**Solution**:
```bash
# Reinstall dependencies
pip install -r requirements.txt
```

---

## 🌟 Pro Tips

1. **Start with USDA** - It has the most reliable data for whole foods
2. **Open Food Facts is great for barcodes** - Use it for packaged foods
3. **Results are cached** - After the first search, subsequent searches are instant
4. **No rate limits** - Both APIs are generous with usage
5. **Always test with real data** - The apps currently use mock data for development

---

## 📚 Additional Resources

### USDA FoodData Central:
- **Website**: https://fdc.nal.usda.gov/
- **API Docs**: https://fdc.nal.usda.gov/api-guide.html
- **Data Types**: Foundation Foods, SR Legacy, Survey Foods, Branded Foods

### Open Food Facts:
- **Website**: https://world.openfoodfacts.org/
- **API Docs**: https://openfoodfacts.github.io/openfoodfacts-server/api/
- **Mobile App**: Available on iOS and Android for contributing data
- **GitHub**: https://github.com/openfoodfacts

---

## ✅ Next Steps

Once your APIs are configured:

1. **Start the backend server**:
   ```bash
   cd backend
   uvicorn main:app --reload
   ```

2. **Test the food search endpoint**:
   ```bash
   curl http://localhost:8000/food/search?query=chicken
   ```

3. **Start building!** Your food search is now powered by real, comprehensive nutrition data!

---

## 🆘 Need Help?

- Check the main [README.md](../README.md)
- Review the [SETUP_GUIDE.md](../SETUP_GUIDE.md)
- Open an issue on GitHub
- Check the API documentation links above

---

**Happy Coding! 🚀**

