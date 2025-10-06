// Debug script to test admin creation
const { setDoc, getDoc } = require('@junobuild/core');

const ADMIN_COLLECTION = 'admins';

// Test function to create admin with minimal data
async function testCreateAdmin() {
    const userId = `test-admin-${Date.now()}`;
    
    console.log('🧪 Testing admin creation with minimal data...');
    
    // Try the most minimal structure first
    const minimalData = {
        email: `${userId}@test.com`,
        role: 'support_agent',
        permissions: ['user_support'],
        created_by: 'test-creator',
        active: true
    };
    
    console.log('📦 Minimal admin data:', minimalData);
    
    try {
        await setDoc({
            collection: ADMIN_COLLECTION,
            doc: {
                key: userId,
                data: minimalData
            }
        });
        console.log('✅ SUCCESS: Minimal admin created successfully!');
        
        // Try to read it back
        const created = await getDoc({
            collection: ADMIN_COLLECTION,
            key: userId
        });
        console.log('📖 Retrieved admin:', created?.data);
        
    } catch (error) {
        console.error('❌ FAILED to create minimal admin:', error);
        console.error('Error details:', {
            name: error.name,
            message: error.message,
            code: error.code
        });
    }
}

// Test function to create admin with full data structure
async function testCreateAdminFull() {
    const userId = `test-admin-full-${Date.now()}`;
    
    console.log('🧪 Testing admin creation with full data structure...');
    
    const fullData = {
        // Rust backend required fields
        email: `${userId}@test.com`,
        role: 'support_agent',
        permissions: ['user_support'],
        created_by: 'test-creator',
        active: true,
        
        // Frontend additional fields
        userId: userId,
        name: `Test User ${userId}`,
        createdAt: Date.now(),
        lastActive: Date.now()
    };
    
    console.log('📦 Full admin data:', fullData);
    
    try {
        await setDoc({
            collection: ADMIN_COLLECTION,
            doc: {
                key: userId,
                data: fullData
            }
        });
        console.log('✅ SUCCESS: Full admin created successfully!');
        
    } catch (error) {
        console.error('❌ FAILED to create full admin:', error);
        console.error('Error details:', {
            name: error.name,
            message: error.message,
            code: error.code
        });
    }
}

// Run tests
async function runTests() {
    console.log('🚀 Starting admin creation debug tests...');
    console.log('Current time:', new Date().toISOString());
    console.log('Current time UTC seconds:', Math.floor(Date.now() / 1000) % 86400);
    
    await testCreateAdmin();
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    await testCreateAdminFull();
}

// Export for use
module.exports = { testCreateAdmin, testCreateAdminFull, runTests };

// Run if called directly
if (require.main === module) {
    runTests().catch(console.error);
}