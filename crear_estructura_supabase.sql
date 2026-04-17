-- Estructura de tablas para Siembra Mirandina
-- Ejecutar este script en Supabase SQL Editor

-- 1. Tabla de Empresas
CREATE TABLE IF NOT EXISTS empresas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    nit_rfc VARCHAR(50) UNIQUE NOT NULL,
    tipo_personalidad VARCHAR(20) NOT NULL CHECK (tipo_personalidad IN ('NATURAL', 'JURIDICA')),
    direccion_fiscal TEXT,
    telefono_contacto VARCHAR(50),
    limite_credito_usd DECIMAL(12,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de Perfiles (usuarios)
CREATE TABLE IF NOT EXISTS perfiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('ADMINISTRADOR', 'PRODUCTOR', 'CLIENTE')),
    nombre_completo VARCHAR(255) NOT NULL,
    telefono VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabla de Productos
CREATE TABLE IF NOT EXISTS productos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    precio_base_usd DECIMAL(10,2) NOT NULL,
    sku VARCHAR(100) UNIQUE,
    imagen_url TEXT,
    categoria VARCHAR(100),
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabla de Inventario
CREATE TABLE IF NOT EXISTS inventario (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    producto_id UUID REFERENCES productos(id) ON DELETE CASCADE NOT NULL,
    stock_disponible INTEGER DEFAULT 0,
    stock_reservado INTEGER DEFAULT 0,
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabla de Pedidos
CREATE TABLE IF NOT EXISTS pedidos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cliente_id UUID REFERENCES perfiles(id) ON DELETE CASCADE NOT NULL,
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
    metodo_pago VARCHAR(50) DEFAULT 'CREDITO_NET_30',
    estado VARCHAR(20) DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'CONFIRMADO', 'ENVIADO', 'ENTREGADO', 'CANCELADO')),
    total_usd DECIMAL(12,2) NOT NULL,
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tabla de Líneas de Pedido
CREATE TABLE IF NOT EXISTS pedido_lineas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE NOT NULL,
    producto_id UUID REFERENCES productos(id) ON DELETE CASCADE NOT NULL,
    cantidad INTEGER NOT NULL,
    precio_unitario_usd DECIMAL(10,2) NOT NULL,
    total_usd DECIMAL(12,2) GENERATED ALWAYS AS (cantidad * precio_unitario_usd) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Tabla de Declaraciones de Producción
CREATE TABLE IF NOT EXISTS declaraciones_produccion (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    productor_id UUID REFERENCES perfiles(id) ON DELETE CASCADE NOT NULL,
    producto_id UUID REFERENCES productos(id) ON DELETE CASCADE NOT NULL,
    cantidad_disponible INTEGER NOT NULL,
    unidad_medida VARCHAR(20) DEFAULT 'Kg',
    precio_sugerido_usd DECIMAL(10,2),
    temporada VARCHAR(50),
    estado VARCHAR(20) DEFAULT 'ACTIVA' CHECK (estado IN ('ACTIVA', 'INACTIVA', 'SUSPENDIDA')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Tabla de Solicitudes Oferta-Demanda
CREATE TABLE IF NOT EXISTS solicitudes_oferta_demanda (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    solicitante_id UUID REFERENCES perfiles(id) ON DELETE CASCADE NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('OFERTA', 'DEMANDA')),
    producto VARCHAR(255),
    cantidad INTEGER,
    unidad_medida VARCHAR(20),
    precio_referencia_usd DECIMAL(10,2),
    descripcion TEXT,
    estado VARCHAR(20) DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'EN_PROCESO', 'COMPLETADA', 'CANCELADA')),
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Tabla de Notificaciones
CREATE TABLE IF NOT EXISTS notificaciones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id UUID REFERENCES perfiles(id) ON DELETE CASCADE NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    mensaje TEXT NOT NULL,
    tipo VARCHAR(20) DEFAULT 'INFO' CHECK (tipo IN ('INFO', 'ALERTA', 'EXITO', 'ERROR')),
    leida BOOLEAN DEFAULT FALSE,
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_empresas_nit ON empresas(nit_rfc);
CREATE INDEX IF NOT EXISTS idx_perfiles_email ON perfiles(id);
CREATE INDEX IF NOT EXISTS idx_perfiles_rol ON perfiles(rol);
CREATE INDEX IF NOT EXISTS idx_productos_empresa ON productos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_productos_sku ON productos(sku);
CREATE INDEX IF NOT EXISTS idx_inventario_producto ON inventario(producto_id);
CREATE INDEX IF NOT EXISTS idx_inventario_empresa ON inventario(empresa_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente ON pedidos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_empresa ON pedidos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_pedido_lineas_pedido ON pedido_lineas(pedido_id);
CREATE INDEX IF NOT EXISTS idx_declaraciones_productor ON declaraciones_produccion(productor_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_empresa ON solicitudes_oferta_demanda(empresa_id);

-- Row Level Security (RLS) para perfiles
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios pueden ver su propio perfil" ON perfiles
    FOR ALL USING (auth.uid() = id);

CREATE POLICY "Admin puede ver todos los perfiles" ON perfiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM perfiles p 
            WHERE p.id = auth.uid() AND p.rol = 'ADMINISTRADOR'
        )
    );

-- Row Level Security (RLS) para productos
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Productores ven sus productos" ON productos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM perfiles p 
            WHERE p.id = auth.uid() AND p.rol = 'PRODUCTOR'
            AND productos.empresa_id = p.empresa_id
        )
    );

CREATE POLICY "Clientes pueden ver productos activos" ON productos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM perfiles p 
            WHERE p.id = auth.uid() AND p.rol = 'CLIENTE'
        )
    );

CREATE POLICY "Admin puede ver todos los productos" ON productos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM perfiles p 
            WHERE p.id = auth.uid() AND p.rol = 'ADMINISTRADOR'
        )
    );

-- Habilitar RLS en todas las tablas
ALTER TABLE inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_lineas ENABLE ROW LEVEL SECURITY;
ALTER TABLE declaraciones_produccion ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitudes_oferta_demanda ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;

-- Insertar usuarios de prueba después de crear las tablas
-- Estos comandos deben ejecutarse por separado después de crear la estructura
