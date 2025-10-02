# Juno Datastore Setup Guide 🚀

## Error: "Collection not found"

If you're seeing errors like:
```
Error from Canister: juno.collections.error.not_found (Datastore - waqfs)
```

This means your Juno satellite doesn't have the required collections set up yet.

## Quick Setup (5 minutes)

### Step 1: Access Juno Console
1. Go to **[Juno Console](https://console.juno.build/)**
2. Sign in with your Internet Identity
3. Select your satellite from the dashboard

### Step 2: Create Document Collections

Navigate to **Datastore** → Click **"Add Collection"** for each:

#### 1. waqfs Collection
```
Name: waqfs
Type: Documents
Read: managed
Write: managed
Memory: heap
```

#### 2. causes Collection
```
Name: causes
Type: Documents
Read: managed
Write: managed
Memory: heap
```

#### 3. donations Collection
```
Name: donations
Type: Documents
Read: managed
Write: managed
Memory: heap
```

#### 4. allocations Collection
```
Name: allocations
Type: Documents
Read: managed
Write: managed
Memory: heap
```

#### 5. admins Collection
```
Name: admins
Type: Documents
Read: managed
Write: managed
Memory: heap
```

### Step 3: Create Asset Collection

#### 6. cause_images Collection (for file uploads)
```
Name: cause_images
Type: Assets  ⚠️ Important: Select "Assets" not "Documents"
Read: public  ⚠️ Public so images can be displayed
Write: managed
Memory: heap
Max size: 10MB (or your preference)
```

### Step 4: Verify Setup

After creating all collections:
1. Refresh your Waqf Protocol app
2. The dashboard should now load without errors
3. You can start creating causes, waqfs, etc.

## Collection Purposes

| Collection | Purpose | Access |
|-----------|---------|--------|
| `waqfs` | Store waqf (endowment) data | Managed (authenticated users) |
| `causes` | Store charitable causes | Managed (admins can manage) |
| `donations` | Track donations/contributions | Managed |
| `allocations` | Store fund allocation records | Managed |
| `admins` | Admin user management | Managed |
| `cause_images` | Store cause images/media | Public read, managed write |

## Access Control Levels

### managed
- Only authenticated users with proper permissions can read/write
- Your app code controls access via Juno's authentication

### public
- Anyone can read (no authentication needed)
- Used for cause_images so images display publicly
- Write still requires authentication

## Troubleshooting

### Issue: "Permission denied"
**Solution**: Make sure you're logged in and have the correct satellite ID in your `.env` file:
```
NEXT_PUBLIC_SATELLITE_ID=your-satellite-id-here
```

### Issue: "Collection already exists"
**Solution**: That's fine! Just skip creating that collection.

### Issue: Image upload fails
**Solution**: 
1. Verify `cause_images` is type **Assets** (not Documents)
2. Check that Write permission is set to **managed**
3. Verify you're authenticated when uploading

### Issue: Dashboard still shows error
**Solution**:
1. Clear browser cache
2. Hard refresh (Ctrl+F5 or Cmd+Shift+R)
3. Restart dev server: `npm run dev`

## Advanced: Collection Rules

For more fine-grained control, you can set custom rules in the Juno console:

### Example: Only admins can create causes
```javascript
// In Juno console, under Collection Rules
{
  "write": {
    "rule": "user.role === 'admin'"
  }
}
```

### Example: Users can only edit their own waqfs
```javascript
{
  "write": {
    "rule": "doc.data.owner === user.key"
  }
}
```

## Next Steps

Once all collections are created:

1. ✅ **Test Admin Dashboard** - Visit `/admin` to see stats
2. ✅ **Create First Cause** - Go to `/admin/causes` and add a cause
3. ✅ **Test Image Upload** - Add an image to a cause description
4. ✅ **Create Waqf** - Go to `/waqf` and create your first waqf

## Resources

- 📚 [Juno Documentation](https://juno.build/docs)
- 🎓 [Juno Datastore Guide](https://juno.build/docs/build/datastore)
- 💬 [Juno Discord Community](https://discord.gg/wHZ57Z2RAG)
- 🐛 [Report Issues](https://github.com/buildwithjuno/juno)

## Need Help?

If you encounter issues:
1. Check the browser console for detailed error messages
2. Verify your satellite ID in environment variables
3. Make sure you're signed in to Internet Identity
4. Check that all collections are created correctly

---

**Happy Building! 🎉**

Remember: Collections only need to be created once. After initial setup, your app will work seamlessly!
