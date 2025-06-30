#!/bin/bash

# WhatsApp Admin CS - Default Users Setup Script
# This script creates default admin and agent users for development/testing

echo "🚀 Setting up default users for WhatsApp Admin CS..."

# Backend API endpoint
API_URL="http://localhost:8080/api"

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to create a user
create_user() {
    local username=$1
    local password=$2
    local full_name=$3
    local role=$4
    
    echo -e "${BLUE}📝 Creating user: ${username}...${NC}"
    
    response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"${username}\",\"password\":\"${password}\",\"role\":\"${role}\",\"full_name\":\"${full_name}\"}" \
        "${API_URL}/auth/register")
    
    success=$(echo "$response" | jq -r '.success // false' 2>/dev/null)
    
    if [ "$success" = "true" ]; then
        echo -e "${GREEN}✅ User '${username}' created successfully${NC}"
    else
        message=$(echo "$response" | jq -r '.message // "Unknown error"' 2>/dev/null)
        if [[ "$message" == *"already exists"* ]] || [[ "$message" == *"duplicate"* ]]; then
            echo -e "${YELLOW}⚠️  User '${username}' already exists${NC}"
        else
            echo -e "${RED}❌ Failed to create user '${username}': ${message}${NC}"
        fi
    fi
}

# Function to test user login
test_login() {
    local username=$1
    local password=$2
    
    echo -e "${BLUE}🔐 Testing login for ${username}...${NC}"
    
    response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"${username}\",\"password\":\"${password}\"}" \
        "${API_URL}/auth/login")
    
    success=$(echo "$response" | jq -r '.success // false' 2>/dev/null)
    
    if [ "$success" = "true" ]; then
        user_info=$(echo "$response" | jq -r '.data.admin.username // .data.user.username' 2>/dev/null)
        echo -e "${GREEN}✅ Login successful for '${user_info}'${NC}"
    else
        message=$(echo "$response" | jq -r '.message // "Unknown error"' 2>/dev/null)
        echo -e "${RED}❌ Login failed for '${username}': ${message}${NC}"
    fi
}

# Check if backend is running
echo -e "${BLUE}🔍 Checking if backend is running...${NC}"
if ! curl -s "${API_URL}/health" > /dev/null 2>&1; then
    if ! curl -s "http://localhost:8080/" > /dev/null 2>&1; then
        echo -e "${RED}❌ Backend is not running on localhost:8080${NC}"
        echo -e "${YELLOW}Please start the backend server first${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}✅ Backend is running${NC}"

echo ""
echo -e "${BLUE}===========================================${NC}"
echo -e "${BLUE}      Creating Default Users${NC}"
echo -e "${BLUE}===========================================${NC}"
echo ""

# Create default users
create_user "admin" "admin123" "System Administrator" "admin"
create_user "agent" "agent123" "Customer Service Agent" "admin"

echo ""
echo -e "${BLUE}===========================================${NC}"
echo -e "${BLUE}      Testing User Logins${NC}"
echo -e "${BLUE}===========================================${NC}"
echo ""

# Test logins
test_login "admin" "admin123"
test_login "agent" "agent123"

echo ""
echo -e "${GREEN}🎉 Setup completed!${NC}"
echo ""
echo -e "${BLUE}Default Users Created:${NC}"
echo -e "${YELLOW}┌─────────────────────────────────────┐${NC}"
echo -e "${YELLOW}│  Username: admin                    │${NC}"
echo -e "${YELLOW}│  Password: admin123                 │${NC}"
echo -e "${YELLOW}│  Role:     Administrator            │${NC}"
echo -e "${YELLOW}├─────────────────────────────────────┤${NC}"
echo -e "${YELLOW}│  Username: agent                    │${NC}"
echo -e "${YELLOW}│  Password: agent123                 │${NC}"
echo -e "${YELLOW}│  Role:     Customer Service Agent   │${NC}"
echo -e "${YELLOW}└─────────────────────────────────────┘${NC}"
echo ""
echo -e "${BLUE}Frontend URL: http://localhost:3002${NC}"
echo -e "${BLUE}Backend URL:  http://localhost:8080${NC}"
echo ""
echo -e "${GREEN}You can now login to the WhatsApp Admin CS system!${NC}" 