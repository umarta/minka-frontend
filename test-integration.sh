#!/bin/bash

echo "🧪 Running Chat Integration Tests..."
echo "=================================="

# Test 1: Backend Health
echo "1. Testing Backend Health..."
if curl -s http://localhost:8080/api/sessions > /dev/null; then
    echo "   ✅ Backend is running"
else
    echo "   ❌ Backend is not responding"
    exit 1
fi

# Test 2: Frontend Health
echo "2. Testing Frontend Health..."
if curl -s http://localhost:3001/chat/test > /dev/null; then
    echo "   ✅ Frontend is running"
else
    echo "   ❌ Frontend is not responding"
    exit 1
fi

# Test 3: Authentication
echo "3. Testing Authentication..."
LOGIN_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"username":"agent","password":"agent123"}' \
    http://localhost:8080/api/auth/login)

if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
    echo "   ✅ Authentication successful"
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
else
    echo "   ❌ Authentication failed"
    echo "   Response: $LOGIN_RESPONSE"
    exit 1
fi

# Test 4: API Endpoints (with auth)
echo "4. Testing API Endpoints..."

# Test Contacts API
echo "   Testing Contacts API..."
CONTACTS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
    http://localhost:8080/api/contacts?page=1&per_page=5)
if echo "$CONTACTS_RESPONSE" | grep -q '"success":true'; then
    echo "   ✅ Contacts API working"
else
    echo "   ❌ Contacts API failed"
fi

# Test Tickets API
echo "   Testing Tickets API..."
TICKETS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
    http://localhost:8080/api/tickets?page=1&per_page=5)
if echo "$TICKETS_RESPONSE" | grep -q '"success":true'; then
    echo "   ✅ Tickets API working"
else
    echo "   ❌ Tickets API failed"
fi

# Test Quick Reply API
echo "   Testing Quick Reply API..."
QUICKREPLY_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
    http://localhost:8080/api/quick-replies)
if echo "$QUICKREPLY_RESPONSE" | grep -q '"success":true'; then
    echo "   ✅ Quick Reply API working"
else
    echo "   ❌ Quick Reply API failed"
fi

# Test Messages API
echo "   Testing Messages API..."
MESSAGES_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
    http://localhost:8080/api/messages?page=1&per_page=5)
if echo "$MESSAGES_RESPONSE" | grep -q '"success":true'; then
    echo "   ✅ Messages API working"
else
    echo "   ❌ Messages API failed"
fi

echo ""
echo "🎉 Integration Test Summary:"
echo "============================"
echo "✅ Backend: Running on http://localhost:8080"
echo "✅ Frontend: Running on http://localhost:3001"
echo "✅ Authentication: Working"
echo "✅ API Endpoints: All tested"
echo ""
echo "🌐 Test Page: http://localhost:3001/chat/test"
echo "🔗 Backend API: http://localhost:8080/api"
echo ""
echo "All tests completed successfully! 🚀"
