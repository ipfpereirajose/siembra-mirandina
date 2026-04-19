-- Transacciones B2B y Pagos
CREATE TABLE IF NOT EXISTS public.pedidos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cliente_id UUID REFERENCES public.perfiles(id) NOT NULL,
    estado VARCHAR(50) DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'ESPERA_PAGO', 'PROCESANDO', 'DESPACHADO', 'CANCELADO')),
    total_usd DECIMAL(12, 2) NOT NULL,
    codigo_referencia VARCHAR(100),
    evidencia_pago TEXT,
    metodo_pago VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.lineas_pedido (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    pedido_id UUID REFERENCES public.pedidos(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES public.productos(id) NOT NULL,
    cantidad DECIMAL(12, 2) NOT NULL,
    precio_unitario_usd DECIMAL(10, 2) NOT NULL,
    subtotal_usd DECIMAL(12, 2) NOT NULL,
    siembra_trazabilidad JSONB -- Para regresar stock a los productores si hay cancelación
);

-- Habilitar Políticas si aplica (las ignoramos aquí por permisos de Admin/Server)
