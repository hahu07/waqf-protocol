# Juno Collection Setup Checklist ✅

## Satellite ID
Current: `atbka-rp777-77775-aaaaq-cai`

## Collections to Create

### 1. Document Collections
**Settings**: Type: Documents, Read: managed, Write: managed, Memory: heap

- [ ] **waqfs** - Stores waqf (endowment) profiles
- [ ] **causes** - Stores charitable causes  
- [ ] **donations** - Tracks donations and contributions
- [ ] **allocations** - Records fund allocation history
- [ ] **admins** - Admin user management data

### 2. Asset Collections  
**Settings**: Type: Assets, Read: public, Write: managed, Memory: heap

- [ ] **cause_images** - Stores images for causes (Max size: 10MB recommended)

## Quick Steps

1. Go to: https://console.juno.build/
2. Sign in with Internet Identity
3. Select satellite: `atbka-rp777-77775-aaaaq-cai`
4. Click "Datastore" in sidebar
5. Click "Add Collection" button
6. For each collection:
   - Enter name (exactly as shown above)
   - Select type (Documents or Assets)
   - Set Read permission
   - Set Write permission
   - Set Memory: heap
   - Click Create

## Verification

After creating all collections:
- [ ] Refresh your Waqf Protocol dashboard
- [ ] Dashboard loads without errors
- [ ] You can navigate to /admin/causes
- [ ] You can create a test cause
- [ ] Image upload works in cause form

## Troubleshooting

**If dashboard still shows error after creating collections:**
1. Hard refresh browser (Ctrl+F5 / Cmd+Shift+R)
2. Check all 6 collections exist in Juno console
3. Verify collection names match exactly (case-sensitive)
4. Clear browser cache
5. Restart dev server: `npm run dev`

**If you see permission errors:**
- Make sure Read/Write are set to "managed" (not "public" or "private")
- Exception: cause_images should have Read: public

## Notes

✅ Collections only need to be created once
✅ Changes take effect immediately
✅ You can modify collection settings later if needed
✅ All data is stored on the Internet Computer blockchain

---

**After setup is complete, your admin dashboard will be fully functional!** 🎉
