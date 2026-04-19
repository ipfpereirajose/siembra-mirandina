-- REPARACIÓN DE INVENTARIO: RLS Y SINCRONIZACIÓN REAL
-- Copia y pega esto en el SQL Editor de Supabase

-- 1. Habilitar RLS en inventario (si no lo estaba) y permitir lectura para todos
ALTER TABLE public.inventario ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public_Read_Inventory" ON public.inventario;
CREATE POLICY "Public_Read_Inventory" ON public.inventario 
FOR SELECT USING (true); -- Cualquiera puede ver el stock disponible

-- 2. Función mejorada para actualizar inventario (Suma Real de todos los productores)
CREATE OR REPLACE FUNCTION actualizar_inventario_central()
RETURNS TRIGGER AS $$
DECLARE
    total_stock DECIMAL(12, 2);
BEGIN
    -- Calculamos la suma total de este producto sumando a todos los productores
    -- Podríamos filtrar por 'esta_en_venta' = true si quisiéramos más control
    SELECT COALESCE(SUM(cantidad_disponible), 0) 
    INTO total_stock 
    FROM public.produccion_productor 
    WHERE producto_id = COALESCE(NEW.producto_id, OLD.producto_id);

    -- Insertar o Actualizar el inventario central
    INSERT INTO public.inventario (producto_id, stock_disponible, ultima_actualizacion)
    VALUES (COALESCE(NEW.producto_id, OLD.producto_id), total_stock, now())
    ON CONFLICT (producto_id) DO UPDATE 
    SET stock_disponible = total_stock,
        ultima_actualizacion = now();

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 3. Re-vincular el trigger para INSERT, UPDATE y DELETE
DROP TRIGGER IF EXISTS tr_update_inventory ON public.produccion_productor;
CREATE TRIGGER tr_update_inventory
AFTER INSERT OR UPDATE OR DELETE ON public.produccion_productor
FOR EACH ROW EXECUTE FUNCTION actualizar_inventario_central();

-- 4. Ejecutar una actualización inicial para todos los productos
-- Esto recalculará todo el inventario central basándose en la producción actual
INSERT INTO public.inventario (producto_id, stock_disponible, ultima_actualizacion)
SELECT producto_id, SUM(cantidad_disponible), now()
FROM public.produccion_productor
GROUP BY producto_id
ON CONFLICT (producto_id) DO UPDATE 
SET stock_disponible = EXCLUDED.stock_disponible,
    ultima_actualizacion = now();
