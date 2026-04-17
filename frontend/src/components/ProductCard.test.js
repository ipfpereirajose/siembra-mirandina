import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProductCard from './ProductCard';

describe('ProductCard Component', () => {
  const mockProduct = {
    id: 1,
    nombre: 'Tomate Cherry',
    precio_base_usd: 2.50,
    imagen_url: 'https://example.com/tomate.jpg',
    inventario: { stock_disponible: 10 }
  };

  const mockOnAdd = jest.fn();

  beforeEach(() => {
    localStorage.clear();
  });

  test('renders product information correctly', () => {
    render(<ProductCard product={mockProduct} onAdd={mockOnAdd} />);
    
    expect(screen.getByText('Tomate Cherry')).toBeInTheDocument();
    expect(screen.getByText('SKU: 1')).toBeInTheDocument();
    expect(screen.getByText('$2.50')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1')).toBeInTheDocument();
  });

  test('shows fallback when no image', () => {
    const productWithoutImage = { ...mockProduct, imagen_url: null };
    render(<ProductCard product={productWithoutImage} onAdd={mockOnAdd} />);
    
    expect(screen.getByText('🌱')).toBeInTheDocument();
  });

  test('handles add to cart correctly', () => {
    render(<ProductCard product={mockProduct} onAdd={mockOnAdd} />);
    
    const addButton = screen.getByText('Añadir');
    fireEvent.click(addButton);
    
    expect(mockOnAdd).toHaveBeenCalledWith(mockProduct, 1);
  });

  test('disables button when out of stock', () => {
    const outOfStockProduct = { ...mockProduct, inventario: { stock_disponible: 0 } };
    render(<ProductCard product={outOfStockProduct} onAdd={mockOnAdd} />);
    
    const addButton = screen.getByText('Añadir');
    expect(addButton).toBeDisabled();
  });

  test('shows success message temporarily', () => {
    render(<ProductCard product={mockProduct} onAdd={mockOnAdd} />);
    
    const addButton = screen.getByText('Añadir');
    fireEvent.click(addButton);
    
    expect(screen.getByText('✓ Agregado')).toBeInTheDocument();
    
    // Wait for timeout to clear
    jest.advanceTimersByTime(2000);
    expect(screen.getByText('Añadir')).toBeInTheDocument();
  });
});
