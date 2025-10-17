# Frontend Integration - API Connection

## ✅ Changes Made

Updated `assessment/src/data-loader.js` to use the live API:

### Smart Data Source Selection
```javascript
// Automatically detects environment
this.baseUrl = window.location.hostname === 'localhost' 
  ? './data/'                          // Local development
  : 'https://api.moderneer.co.uk/api/'; // Production
```

### API Response Handling
```javascript
// API returns: { success: true, data: {...} }
// Local files return: {...} directly
const data = this.useAPI ? json.data : json;
```

---

## 🧪 Testing

### Local Testing (uses local JSON files)
```bash
# Open with Live Server or local server
http://localhost:5500/assessment/
```

### Production Testing (uses API)
```bash
# After deploying to GitHub Pages
https://moderneer.co.uk/assessment/
```

---

## 🚀 Deployment Steps

### 1. Commit Frontend Changes
```powershell
cd c:\dev\moderneer_static
git add assessment/src/data-loader.js
git commit -m "feat: Integrate with api.moderneer.co.uk backend"
git push
```

### 2. Verify on GitHub Pages
- Wait 1-2 minutes for GitHub Pages to deploy
- Open https://moderneer.co.uk/assessment/
- Open DevTools → Console
- Should see: `🔧 Data source: API (https://api.moderneer.co.uk)`

### 3. Check Network Requests
- DevTools → Network tab
- Refresh page
- Look for requests to `api.moderneer.co.uk`
- Should see `200 OK` responses

---

## 📊 Expected Console Output

**Production (moderneer.co.uk):**
```
🔧 Data source: API (https://api.moderneer.co.uk)
🔄 Loading assessment configuration from JSON files...
📄 Loaded config.json from API (v3.0.0)
📄 Loaded pillars.json from API (v3.0.0)
📄 Loaded rules.json from API (v1.0.0)
📄 Loaded scales.json from API (v1.0.0)
✅ Assessment configuration loaded successfully
📊 Loaded: 12 pillars, 6 gates, 3 caps
```

**Local (localhost):**
```
🔧 Data source: Local JSON files
🔄 Loading assessment configuration from JSON files...
📄 Loaded config.json from local (v3.0.0)
...
```

---

## 🔍 Verification Checklist

- [ ] Console shows "Data source: API"
- [ ] Network tab shows requests to `api.moderneer.co.uk`
- [ ] All requests return `200 OK`
- [ ] No CORS errors
- [ ] Assessment loads correctly
- [ ] All 12 pillars displayed
- [ ] Scoring functionality works

---

## 🐛 Troubleshooting

### Issue: CORS Error
**Symptom:** `Access to fetch blocked by CORS policy`  
**Solution:** Already configured! API allows moderneer.co.uk

### Issue: 404 Not Found
**Symptom:** API endpoints return 404  
**Solution:** Check API is still deployed at Vercel

### Issue: Still using local files
**Symptom:** Console shows "Local JSON files"  
**Solution:** Make sure you're testing on moderneer.co.uk, not localhost

---

## 📈 Benefits of API Integration

✅ **Single source of truth** - Update data in one place  
✅ **Easier updates** - No need to redeploy frontend for data changes  
✅ **Future scalability** - Can add database, auth, user data  
✅ **Analytics** - Track API usage (Vercel dashboard)  
✅ **Version control** - API versioning support  

---

**Status:** Ready to test and deploy! 🚀
