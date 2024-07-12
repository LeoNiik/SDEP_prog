-- Crea il database
CREATE DATABASE ecommerce;

-- Connetti al database appena creato
\c ecommerce;

DROP SCHEMA IF EXISTS ecom_schema CASCADE;
CREATE SCHEMA ecom_schema;
SET search_path to ecom_schema;

DROP TABLE IF EXISTS Users;

CREATE TABLE Users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    balance DECIMAL(10, 2) DEFAULT 0.00,
    admin BOOLEAN DEFAULT FALSE,  -- viene settato a true solo quando il webmaster accetta la richiesta
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_id VARCHAR(32) UNIQUE,
    verify_token VARCHAR(32) UNIQUE
);
DROP TABLE IF EXISTS Products;

-- creami un utente che e' admin e si chiama admin
-- la password mettimela hashata sha256

INSERT INTO Users (username, email, password, admin, verified) VALUES ('admin', 'francolama21@gmail.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', TRUE, TRUE);

CREATE TABLE Products (
    id SERIAL PRIMARY KEY,
    vendor_id INT REFERENCES Users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    quantity INT NOT NULL,
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);
DROP TABLE IF EXISTS Cart;

CREATE TABLE Cart (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES Users(id) ON DELETE CASCADE NOT NULL,
    product_id INT REFERENCES Products(id) ON DELETE CASCADE NOT NULL,
    quantity INT NOT NULL
);
DROP TABLE IF EXISTS Orders;

CREATE TABLE Orders (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES Users(id) ON DELETE CASCADE NOT NULL,
    vendor_id INT REFERENCES Users(id) ON DELETE CASCADE NOT NULL,
    product_id INT REFERENCES Products(id) ON DELETE CASCADE NOT NULL,
    quantity INT NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);








