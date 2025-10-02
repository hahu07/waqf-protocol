# Waqf Protocol - Quick Start Guide 🚀

## Current Status ✅

✅ Build successful  
✅ All admin pages designed  
⏳ **Collections need to be set up** (in progress)  
⏳ Ready for testing with real data

---

## 1. Setup Collections (Do This First!)

Follow the checklist: **[COLLECTION_SETUP_CHECKLIST.md](./COLLECTION_SETUP_CHECKLIST.md)**

**TL;DR:**
1. Go to https://console.juno.build/
2. Sign in and select satellite: `atbka-rp777-77775-aaaaq-cai`
3. Create 6 collections (5 Documents + 1 Assets)
4. Refresh your dashboard

---

## 2. Start Development Server

```bash
cd /home/amanachain/Juno/waqfProtocol
npm run dev
```

The server will start on: **http://localhost:3001**

---

## 3. Admin Dashboard Routes

| URL | Page | Purpose |
|-----|------|---------|
| `/admin` | Dashboard | Stats & overview |
| `/admin/causes` | Causes | Manage charitable causes ⭐ |
| `/admin/users` | Users | Admin management |
| `/admin/reports` | Reports | Analytics & reports |
| `/admin/settings` | Settings | System configuration |

---

## 4. First Steps After Setup

### A. Create Your First Cause
1. Navigate to `/admin/causes`
2. Click "✨ Add New Cause"
3. Fill in the form:
   - Name: "Education for All"
   - Description: Use the markdown editor
   - Icon: Select an emoji
   - Category: Select from dropdown
   - Status: Set to "Approved"
4. Click "Create Cause"

### B. Test Image Upload
1. In the cause form, drag an image to the description editor
2. Or click the 🖼️ icon to upload
3. Image should appear in the markdown preview

### C. Explore Other Pages
- Check **User Management** for admin controls
- View **Reports** for analytics
- Configure **Settings** for your preferences

---

## 5. Key Features to Test

### Causes Management ⭐
- [x] View all causes in card layout
- [ ] Create new cause
- [ ] Edit existing cause  
- [ ] Delete cause (with confirmation)
- [ ] Upload images via drag-and-drop
- [ ] Change cause status (Active/Inactive)
- [ ] Set approval status
- [ ] View follower count

### User Management
- [ ] View administrators list
- [ ] Add new admin
- [ ] Check audit log
- [ ] Switch between tabs

### Reports
- [ ] View report cards
- [ ] Check statistics
- [ ] Click to open detailed reports

### Settings
- [ ] Change site name
- [ ] Toggle maintenance mode
- [ ] Update notification settings
- [ ] Save changes

---

## 6. Troubleshooting

### "Collections Not Set Up" Error
**Solution**: Follow [COLLECTION_SETUP_CHECKLIST.md](./COLLECTION_SETUP_CHECKLIST.md)

### "Canister not found" Error  
**Problem**: Wrong satellite ID in `.env`  
**Solution**: 
1. Check your `.env` or `.env.local` file
2. Make sure `NEXT_PUBLIC_SATELLITE_ID=atbka-rp777-77775-aaaaq-cai`
3. Restart dev server

### Build Errors
**Solution**: 
```bash
npm run build
```
If errors occur, check the error messages and refer to [BUILD_SUCCESS_SUMMARY.md](./BUILD_SUCCESS_SUMMARY.md)

### Port Already in Use
**Solution**:
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Or use a different port
PORT=3002 npm run dev
```

---

## 7. Documentation Index

### Setup & Configuration
- 📋 [COLLECTION_SETUP_CHECKLIST.md](./COLLECTION_SETUP_CHECKLIST.md) - Collection setup
- 🔧 [JUNO_SETUP_GUIDE.md](./JUNO_SETUP_GUIDE.md) - Detailed Juno guide

### Features & Design
- ✨ [CAUSES_MANAGEMENT_REDESIGN.md](./CAUSES_MANAGEMENT_REDESIGN.md) - Causes feature
- 🎨 [ADMIN_DASHBOARD_COMPLETE.md](./ADMIN_DASHBOARD_COMPLETE.md) - All admin pages
- 📊 [ADMIN_DASHBOARD_REDESIGN.md](./ADMIN_DASHBOARD_REDESIGN.md) - Dashboard design

### Development
- ✅ [BUILD_SUCCESS_SUMMARY.md](./BUILD_SUCCESS_SUMMARY.md) - Build info
- 🔐 [AUTHENTICATION_CHANGES.md](./AUTHENTICATION_CHANGES.md) - Auth setup
- 🛣️ [ROLE_BASED_ROUTING.md](./ROLE_BASED_ROUTING.md) - Routing details

---

## 8. Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server

# Linting
npm run lint             # Run ESLint

# Juno Deployment (after setup)
juno deploy              # Deploy to Juno satellite
```

---

## 9. Design System Quick Reference

### Colors
```css
Primary:   #2563eb → #9333ea (blue to purple gradient)
Success:   #10b981 → #059669 (green gradient)
Warning:   #f59e0b → #d97706 (orange gradient)
Danger:    #ef4444 → #dc2626 (red gradient)
```

### Common Classes
```
Headers:    text-2xl/3xl font-bold
Cards:      rounded-xl shadow-lg border-gray-100
Buttons:    gradient background, shadow-lg, hover:-translate-y-1
Icons:      gradient container, rounded-xl
```

---

## 10. Next Steps

### Immediate (After Collection Setup)
1. ✅ Create collections in Juno
2. 🧪 Test creating causes
3. 📸 Test image uploads
4. 👥 Add test admin users
5. 📊 Check reports with data

### Short Term
- [ ] Add more causes
- [ ] Test on mobile devices
- [ ] Create waqfs
- [ ] Test donations flow
- [ ] Set up email notifications

### Long Term
- [ ] Production deployment
- [ ] User feedback collection
- [ ] Performance optimization
- [ ] Add analytics
- [ ] Multi-language support

---

## 11. Getting Help

### Error Messages
- The app shows helpful error messages with setup instructions
- Check browser console for detailed errors (F12)

### Documentation
- All `.md` files in the root directory
- Inline code comments
- Juno docs: https://juno.build/docs

### Community
- Juno Discord: https://discord.gg/wHZ57Z2RAG
- Internet Computer Forum: https://forum.dfinity.org/

---

## 12. Project Structure

```
waqfProtocol/
├── src/
│   ├── app/
│   │   ├── admin/          # Admin pages
│   │   ├── auth/           # Authentication
│   │   ├── waqf/           # Waqf creator pages
│   │   └── page.tsx        # Home page
│   │
│   ├── components/
│   │   ├── admin/          # Admin components ⭐
│   │   ├── auth/           # Auth components
│   │   ├── ui/             # UI components
│   │   └── waqf/           # Waqf components
│   │
│   ├── lib/                # Utilities
│   ├── hooks/              # Custom React hooks
│   ├── types/              # TypeScript types
│   └── context/            # React context
│
├── public/                 # Static assets
└── *.md                    # Documentation
```

---

## 🎉 You're All Set!

After setting up the collections, your Waqf Protocol admin dashboard will be fully functional with:

✅ Professional UI/UX  
✅ Full CRUD operations  
✅ Image uploads  
✅ Real-time stats  
✅ User management  
✅ Reporting  
✅ Settings  

**Happy building! 🚀**
