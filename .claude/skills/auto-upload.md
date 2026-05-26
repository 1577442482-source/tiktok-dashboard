---
name: auto-upload
description: "Automatically upload all Excel files from a specified folder to the TikTok dashboard. Triggers when user says things like '将某某文件夹上传至看版', '上传文件夹', '批量导入', or 'auto upload'."
argument-hint: "/Users/vigo/Desktop/周度数据"
---

# Auto Upload Skill

When the user invokes this skill, follow these steps to bulk-upload all Excel files from the specified folder to the TikTok dashboard.

## Steps

### 1. Get the folder path
The user will provide a folder path. If they give a relative path like "桌面/周度数据", expand it to an absolute path:
- `桌面` / `Desktop` → `/Users/vigo/Desktop/`
- `下载` / `Downloads` → `/Users/vigo/Downloads/`
- `文档` / `Documents` → `/Users/vigo/Documents/`

### 2. Ensure the dev server is running
```bash
# Check if vite is running on port 5173 or 5174
lsof -ti:5173,5174 2>/dev/null

# If not running, start it in background:
cd /Users/vigo/Documents/tiktok-dashboard && npm run dev &
# Wait for it to be ready (check for "ready in" or "Local:" in output)
```

### 3. Verify the folder exists and has .xlsx files
```bash
ls /Users/vigo/Desktop/周度数据/*.xlsx 2>/dev/null | head -5
```

### 4. Call the bulk import API
Find the actual port the dev server is running on (check output or try 5173 then 5174), then call:
```bash
PORT=$(lsof -ti:5173 2>/dev/null && echo 5173 || echo 5174)
curl -s -X POST "http://localhost:$PORT/api/bulk-import" \
  -H 'Content-Type: application/json' \
  -d "{\"directory\":\"$FOLDER_PATH\"}" | python3 -m json.tool
```

### 5. Open the dashboard
```bash
open "http://localhost:$PORT/upload"
```

### 6. Report results
Tell the user:
- How many files were successfully imported
- How many files had errors (if any)
- The dashboard is open at the upload page
- The imported data is now available in the dashboard

## Important Notes
- This only works when the Vite dev server is running locally (not in production)
- The API parses Excel files server-side using the same logic as the browser
- Overlapping date ranges are automatically handled (old data replaced by new)
- All imported data goes into IndexedDB in the browser
- After import, the user should refresh the browser page to see updated data
