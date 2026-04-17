import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CartSidebar from './CartSidebar';

describe('CartSidebar Component', () => {
  const mockCart = [
    { id: 1, product: { id: 1, nombre: 'Tomate', precio_base_usd: 2.50 }, quantity: 2 },
    { id: 2, product: { id: 2, nombre: 'Lechuga', precio_base_usd: 1.80 }, quantity: 1 }
  ];

  const mockSetCart = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('displays cart items correctly', () => {
    render(<CartSidebar cart={mockCart} setCart={mockSetCart} onClose={mockOnClose} />);
    
    expect(screen.getByText('Bandeja de Despacho')).toBeInTheDocument();
    expect(screen.getByText('Tomate')).toBeInTheDocument();
    expect(screen.getByText('2 x $2.50')).toBeInTheDocument();
    expect(screen.getByText('Lechuga')).toBeInTheDocument();
    expect(screen.getByText('1 x $1.80')).toBeInTheDocument();
  });

  test('calculates total correctly', () => {
    render(<CartSidebar cart={mockCart} setCart={mockSetCart} onClose={mockOnClose} />);
    
    expect(screen.getByText('$6.80')).toBeInTheDocument();
  });

  test('shows empty cart message', () => {
    render(<CartSidebar cart={[]} setCart={mockSetCart} onClose={mockOnClose} />);
    
    expect(screen.getByText('El carrito está vacío.')).toBeInTheDocument();
    expect(screen.getByText('🛒 Agrega productos')).toBeInTheDocument();
  });

  test('handles checkout for unauthenticated user', async () => {
    window.alert = jest.fn();
    
    render(<CartSidebar cart={mockCart} setCart={mockSetCart} onClose={mockOnClose} />);
    
    const checkoutButton = screen.getByText('Confirmar Orden B2B');
    userEvent.click(checkoutButton);
    
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        'Para confirmar tu orden, por favor regístrate o inicia sesión primero.'
      );
    });
  });

  test('clears success state when sidebar closes', () => {
    const { rerender } = render(<CartSidebar cart={mockCart} setCart={mockSetCart} onClose={mockOnClose} />);
    
    // Simulate success state
    rerender(<CartSidebar cart={mockCart} setCart={mockSetCart} onClose={mockOnClose} successId="test123" />);
    
    expect(screen.queryByText('¡Factura Generada!')).toBeInTheDocument();
    
    // Close sidebar
    userEvent.click(screen.getByText('×'));
    
    // Success state should be cleared
    expect(screen.queryByText('¡Factura Generada!')).not.toBeInTheDocument();
  });
});
