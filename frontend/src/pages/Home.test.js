import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Home from './Home';

// Mock fetch
global.fetch = jest.fn();

describe('Home Component', () => {
  const mockProducts = [
    { id: 1, nombre: 'Tomate Cherry', precio_base_usd: 2.50 },
    { id: 2, nombre: 'Lechuga', precio_base_usd: 1.80 }
  ];

  beforeEach(() => {
    localStorage.clear();
    fetch.mockClear();
  });

  test('loads and displays products', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockProducts)
    });

    render(<Home cart={[]} setCart={jest.fn()} />);
    
    await waitFor(() => {
      expect(screen.getByText('Tomate Cherry')).toBeInTheDocument();
      expect(screen.getByText('Lechuga')).toBeInTheDocument();
    });
  });

  test('filters products based on search term', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockProducts)
    });

    render(<Home cart={[]} setCart={jest.fn()} />);
    
    const searchInput = screen.getByPlaceholderText('🔍 Buscar por nombre o SKU...');
    fireEvent.change(searchInput, { target: { value: 'Tomate' } });
    
    await waitFor(() => {
      expect(screen.getByText('Tomate Cherry')).toBeInTheDocument();
      expect(screen.queryByText('Lechuga')).not.toBeInTheDocument();
    });
  });

  test('adds product to cart', () => {
    const mockSetCart = jest.fn();
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockProducts)
    });

    render(<Home cart={[]} setCart={mockSetCart} />);
    
    const addButton = screen.getAllByText('Añadir')[0];
    userEvent.click(addButton);
    
    expect(mockSetCart).toHaveBeenCalledWith([
      { id: 1, nombre: 'Tomate Cherry', precio_base_usd: 2.50, quantity: 1 }
    ]);
  });

  test('persists cart to localStorage', () => {
    const mockSetCart = jest.fn();
    const mockCart = [{ id: 1, quantity: 1 }];
    
    // Mock localStorage
    const getItemSpy = jest.spyOn(Storage.prototype, 'getItem');
    const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');
    
    getItemSpy.mockReturnValue(null);
    
    render(<Home cart={mockCart} setCart={mockSetCart} />);
    
    expect(setItemSpy).toHaveBeenCalledWith('tempCart', JSON.stringify(mockCart));
  });

  test('loads cart from localStorage on mount', () => {
    const mockCart = [{ id: 1, quantity: 1 }];
    const mockSetCart = jest.fn();
    
    // Mock localStorage
    const getItemSpy = jest.spyOn(Storage.prototype, 'getItem');
    getItemSpy.mockReturnValue(JSON.stringify(mockCart));
    
    render(<Home cart={mockCart} setCart={mockSetCart} />);
    
    expect(mockSetCart).toHaveBeenCalledWith(mockCart);
  });
});
