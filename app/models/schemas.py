from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID

# --- CATEGORÍAS ---
class CategoriaBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None

class CategoriaResponse(CategoriaBase):
    id: UUID
    
# --- PRODUCTOS E INVENTARIO ---
class ProductoBase(BaseModel):
    categoria_id: Optional[UUID] = None
    nombre: str
    sku: str
    descripcion_tecnica: Optional[str] = None
    imagen_url: Optional[str] = None
    precio_base_usd: float
    unidad_medida: str = "Unidad"
    activo: bool = True

class InventarioInfo(BaseModel):
    stock_disponible: float
    umbral_alerta: Optional[float] = 5.0

class ProductoResponse(BaseModel):
    id: UUID
    sku: str
    nombre: str
    descripcion_tecnica: Optional[str] = None
    precio_base_usd: float
    unidad_medida: str = "Unidad"
    imagen_url: Optional[str] = None
    inventario: Optional[InventarioInfo] = None
    # Precio dinámico tras calcular la lista de precios B2B (si existe)
    precio_final_usd: Optional[float] = None

# --- PEDIDOS Y CHECKOUT ---
class LineaPedidoCreate(BaseModel):
    producto_id: UUID
    cantidad: int = Field(gt=0, description="La cantidad debe ser mayor a 0")

class CheckoutRequest(BaseModel):
    # La empresa y el usuario lo tomaríamos del Token de Auth, pero por ahora lo inyectamos
    # En producción real se toma del RLS, sin embargo, a nivel API lo requeriremos de forma explícita
    # para el MVP si el RLS confía en Auth.
    metodo_pago: str = Field(..., description="Opciones: TARJETA_CREDITO, TRANSFERENCIA_BANCARIA, CREDITO_NET_30")
    lineas: List[LineaPedidoCreate] = Field(..., min_length=1)

class LineaPedidoResponse(BaseModel):
    id: UUID
    producto_id: UUID
    cantidad: int
    precio_unitario_usd: float
    subtotal_usd: float

class PedidoResponse(BaseModel):
    id: UUID
    empresa_id: UUID
    usuario_id: UUID
    estado: str
    metodo_pago: str
    total_usd: float
    factura_url: Optional[str] = None
    created_at: datetime
    lineas: Optional[List[LineaPedidoResponse]] = []

# --- AUTENTICACIÓN Y REGISTRO ---
class RegisterRequest(BaseModel):
    tipo: str = Field(..., description="Opciones: PERSONA o EMPRESA")
    rol: str = Field(..., description="Opciones: PRODUCTOR, CLIENTE_EMPRESA, CLIENTE_NATURAL")
    tipo_personalidad: str = Field(..., description="Opciones: J, G, V, E")
    nombre: str = Field(..., description="Nombre Fiscal o Nombres de la persona")
    apellido: Optional[str] = Field(default="", description="Apellidos (Solo aplica a persona natural)")
    documento: str = Field(..., description="RIF para Empresas, CI para Personas")
    direccion_fiscal: str = Field(..., description="Dirección Fiscal o Residencia")
    telefono: str = Field(..., description="Teléfono de contacto")
    correo: str
    password: str = Field(..., min_length=6)

class RegisterResponse(BaseModel):
    mensaje: str
    usuario_id: UUID
    empresa_id: UUID

class ResetPasswordRequest(BaseModel):
    correo: str

# --- NUEVOS MODELOS SIEMBRA MIRANDINA ---
class ProduccionCreate(BaseModel):
    producto_id: Optional[UUID] = None
    nuevo_producto_nombre: Optional[str] = None # Para rubros no listados
    cantidad_disponible: float
    cantidad_en_venta: Optional[float] = 0.0
    esta_en_venta: Optional[bool] = False
    unidad_medida: str # Sacos, Kg, Huacales, Cajas, Unidades
    precio_propuesto_usd: Optional[float] = None

class ProduccionUpdateVenta(BaseModel):
    id: UUID
    cantidad_en_venta: float
    esta_en_venta: bool


class PedidoPersonalizadoCreate(BaseModel):
    producto_id: UUID
    cantidad: float
    unidad_medida: str
    precio_referencial_usd: Optional[float] = None

class RequisicionMasivaCreate(BaseModel):
    filas: List[PedidoPersonalizadoCreate] = Field(..., min_length=1)

class ActualizarEstadoPedido(BaseModel):
    id_orden: UUID
    nuevo_estado: str # Ej: SUBASTA_ABIERTA, CONTRA_OFERTA, EJECUTADO

class AporteProductorCreate(BaseModel):
    id_orden: UUID
    cantidad: float

class ValidarPagoPedido(BaseModel):
    id_orden: UUID
    url_comprobante: str

class NotificacionResponse(BaseModel):
    id: UUID
    titulo: str
    mensaje: str
    leido: bool
    created_at: datetime
