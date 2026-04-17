-- Siembra Mirandina - Base de Datos Agrotech
-- Ejecuta este script en el SQL Editor de tu proyecto de Supabase.

-- Habilitar extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. EMPRESAS / ENTIDADES
CREATE TABLE public.empresas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    nit_rfc VARCHAR(50) UNIQUE NOT NULL, -- RIF o CI
    tipo_personalidad VARCHAR(1) CHECK (tipo_personalidad IN ('J', 'G', 'V', 'E')),
    direccion_fiscal TEXT,
    telefono_contacto VARCHAR(50),
    limite_credito_usd DECIMAL(12, 2) DEFAULT 0.00,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. PERFILES (Roles actualizados)
CREATE TABLE public.perfiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    empresa_id UUID REFERENCES public.empresas(id) NOT NULL,
    rol VARCHAR(50) NOT NULL CHECK (rol IN ('ADMINISTRADOR', 'PRODUCTOR', 'CLIENTE_EMPRESA', 'CLIENTE_NATURAL')),
    nombre_completo VARCHAR(255) NOT NULL,
    telefono VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. CATEGORÍAS AGRÍCOLAS
CREATE TABLE public.categorias (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT
);

-- 4. PRODUCTOS (Catálogo Maestro)
CREATE TABLE public.productos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    categoria_id UUID REFERENCES public.categorias(id),
    nombre VARCHAR(200) NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    descripcion_tecnica TEXT,
    imagen_url TEXT,
    precio_base_usd DECIMAL(10, 2) NOT NULL, -- Precio referencial BCV
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. INVENTARIO CENTRALIZADO (Real-time)
CREATE TABLE public.inventario (
    producto_id UUID REFERENCES public.productos(id) PRIMARY KEY,
    stock_disponible DECIMAL(12, 2) NOT NULL DEFAULT 0.00, -- Puede ser Kg con decimales
    umbral_alerta DECIMAL(12, 2) NOT NULL DEFAULT 5.00,
    ultima_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. PRODUCCIÓN DECLARADA POR PRODUCTORES
CREATE TABLE public.produccion_productor (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    productor_id UUID REFERENCES public.perfiles(id) NOT NULL,
    producto_id UUID REFERENCES public.productos(id) NOT NULL,
    cantidad_disponible DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    unidad_medida VARCHAR(20) CHECK (unidad_medida IN ('Sacos', 'Kg', 'Huacales', 'Cajas', 'Unidades')),
    precio_propuesto_usd DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7. PEDIDOS PERSONALIZADOS (Clientes Empresariales)
CREATE TABLE public.pedidos_personalizados (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cliente_id UUID REFERENCES public.perfiles(id) NOT NULL,
    producto_id UUID REFERENCES public.productos(id),
    categoria_sugerida VARCHAR(100),
    cantidad DECIMAL(12, 2) NOT NULL,
    unidad_medida VARCHAR(20),
    precio_acordado_usd DECIMAL(10, 2),
    total_estimado_usd DECIMAL(12, 2),
    estado VARCHAR(50) DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'EN_ESPERA_PRODUCCION', 'DESPACHADO', 'CANCELADO')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 8. NOTIFICACIONES (Campana)
CREATE TABLE public.notificaciones (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    usuario_id UUID REFERENCES public.perfiles(id) NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT NOT NULL,
    leido BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ==========================================
-- DISPARADORES (TRIGGERS) PARA INVENTARIO
-- ==========================================

-- Función para actualizar inventario central cuando un productor declara producción
CREATE OR REPLACE FUNCTION actualizar_inventario_central()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.inventario (producto_id, stock_disponible)
    VALUES (NEW.producto_id, NEW.cantidad_disponible)
    ON CONFLICT (producto_id) DO UPDATE
    SET stock_disponible = public.inventario.stock_disponible + NEW.cantidad_disponible,
        ultima_actualizacion = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_update_inventory
AFTER INSERT OR UPDATE ON public.produccion_productor
FOR EACH ROW EXECUTE FUNCTION actualizar_inventario_central();

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produccion_productor ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos_personalizados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Users_Read_Own_Profile" ON public.perfiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Productor_Manage_Own_Production" ON public.produccion_productor FOR ALL USING (productor_id = auth.uid());
CREATE POLICY "Admin_Read_All_Inventory" ON public.inventario FOR SELECT USING (EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol = 'ADMINISTRADOR'));
CREATE POLICY "Notification_Read_Own" ON public.notificaciones FOR SELECT USING (usuario_id = auth.uid());
