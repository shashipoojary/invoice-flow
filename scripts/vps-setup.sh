#!/bin/bash

# =====================================================
# VPS Setup Script for PostgreSQL Migration
# =====================================================
# This script sets up PostgreSQL and Redis on a fresh Ubuntu/Debian VPS
# Run this script on your VPS as root or with sudo

set -e

echo "🚀 Starting VPS setup for PostgreSQL migration..."

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install PostgreSQL 15
echo "🐘 Installing PostgreSQL 15..."
apt install -y postgresql-15 postgresql-contrib

# Install Redis
echo "📦 Installing Redis..."
apt install -y redis-server

# Start and enable services
echo "🔄 Starting services..."
systemctl start postgresql
systemctl enable postgresql
systemctl start redis-server
systemctl enable redis-server

# Get database name and user from environment or use defaults
DB_NAME=${DB_NAME:-invoicedb}
DB_USER=${DB_USER:-invoiceuser}
DB_PASSWORD=${DB_PASSWORD:-$(openssl rand -base64 32)}

echo "📝 Creating database and user..."
sudo -u postgres psql <<EOF
CREATE DATABASE ${DB_NAME};
CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
\q
EOF

# Configure PostgreSQL for remote access (optional)
read -p "Do you want to enable remote PostgreSQL access? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔧 Configuring PostgreSQL for remote access..."
    
    # Update postgresql.conf
    sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" /etc/postgresql/15/main/postgresql.conf
    
    # Update pg_hba.conf
    echo "host    ${DB_NAME}    ${DB_USER}    0.0.0.0/0    md5" >> /etc/postgresql/15/main/pg_hba.conf
    
    # Restart PostgreSQL
    systemctl restart postgresql
    
    echo "✅ Remote access enabled"
else
    echo "ℹ️  Remote access not enabled (local only)"
fi

# Configure Redis (optional - set password)
read -p "Do you want to set a Redis password? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    REDIS_PASSWORD=$(openssl rand -base64 32)
    echo "requirepass ${REDIS_PASSWORD}" >> /etc/redis/redis.conf
    systemctl restart redis-server
    echo "✅ Redis password set: ${REDIS_PASSWORD}"
    echo "📝 Update REDIS_URL in .env: redis://:${REDIS_PASSWORD}@your-vps-ip:6379"
fi

echo ""
echo "✅ VPS setup complete!"
echo ""
echo "📝 Database connection details:"
echo "   Database: ${DB_NAME}"
echo "   User: ${DB_USER}"
echo "   Password: ${DB_PASSWORD}"
echo "   Connection: postgresql://${DB_USER}:${DB_PASSWORD}@$(hostname -I | awk '{print $1}'):5432/${DB_NAME}"
echo ""
echo "📝 Next steps:"
echo "   1. Save the connection string above"
echo "   2. Import your database schema: psql -h your-vps-ip -U ${DB_USER} -d ${DB_NAME} -f database/complete_setup.sql"
echo "   3. Create users table: psql -h your-vps-ip -U ${DB_USER} -d ${DB_NAME} -f database/migration_create_users_table.sql"
echo "   4. Update DATABASE_URL in your .env.local file"
echo ""

