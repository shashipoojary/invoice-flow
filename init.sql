-- Initialize the database with required tables for InvoiceFlow Pro

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    company VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    total DECIMAL(10,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue')),
    due_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create invoice_items table
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    rate DECIMAL(10,2) NOT NULL DEFAULT 0,
    amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO clients (id, name, email, company, phone, address) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'John Smith', 'john@techcorp.com', 'TechCorp Solutions', '+1-555-0123', '123 Business St, New York, NY 10001'),
    ('550e8400-e29b-41d4-a716-446655440002', 'Sarah Johnson', 'sarah@designstudio.com', 'Design Studio Inc', '+1-555-0456', '456 Creative Ave, Los Angeles, CA 90210'),
    ('550e8400-e29b-41d4-a716-446655440003', 'Mike Wilson', 'mike@startup.io', 'Startup.io', '+1-555-0789', '789 Innovation Blvd, San Francisco, CA 94105')
ON CONFLICT (email) DO NOTHING;

INSERT INTO invoices (id, invoice_number, client_id, subtotal, tax_rate, tax_amount, total, status, due_date, notes) VALUES
    ('660e8400-e29b-41d4-a716-446655440001', 'INV-2024-001', '550e8400-e29b-41d4-a716-446655440001', 5000.00, 8.5, 425.00, 5425.00, 'paid', '2024-01-15', 'Website development project'),
    ('660e8400-e29b-41d4-a716-446655440002', 'INV-2024-002', '550e8400-e29b-41d4-a716-446655440002', 3200.00, 8.5, 272.00, 3472.00, 'sent', '2024-02-20', 'Logo design and branding'),
    ('660e8400-e29b-41d4-a716-446655440003', 'INV-2024-003', '550e8400-e29b-41d4-a716-446655440003', 7500.00, 8.5, 637.50, 8137.50, 'overdue', '2024-01-30', 'Mobile app development')
ON CONFLICT (invoice_number) DO NOTHING;

INSERT INTO invoice_items (invoice_id, description, quantity, rate, amount) VALUES
    ('660e8400-e29b-41d4-a716-446655440001', 'Frontend Development', 40, 100.00, 4000.00),
    ('660e8400-e29b-41d4-a716-446655440001', 'Backend API Development', 10, 100.00, 1000.00),
    ('660e8400-e29b-41d4-a716-446655440002', 'Logo Design', 1, 1500.00, 1500.00),
    ('660e8400-e29b-41d4-a716-446655440002', 'Brand Guidelines', 1, 1700.00, 1700.00),
    ('660e8400-e29b-41d4-a716-446655440003', 'iOS App Development', 50, 100.00, 5000.00),
    ('660e8400-e29b-41d4-a716-446655440003', 'Android App Development', 25, 100.00, 2500.00)
ON CONFLICT DO NOTHING;
