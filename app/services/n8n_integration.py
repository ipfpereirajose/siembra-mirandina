import httpx
import logging
from app.core.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

async def notificar_nueva_venta(pedido: dict):
    """
    Envía el payload del pedido a n8n para que genere la factura 
    y actualice el CRM (HubSpot/Pipedrive).
    """
    if not settings.N8N_WEBHOOK_SALES_URL:
        logger.warning("N8N_WEBHOOK_SALES_URL no configurada. Omitiendo notificación.")
        return

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                settings.N8N_WEBHOOK_SALES_URL,
                json={"event": "NUEVA_VENTA_B2B", "data": pedido},
                timeout=5.0
            )
            response.raise_for_status()
            logger.info("Notificación de venta enviada a n8n con éxito.")
    except Exception as e:
        logger.error(f"Fallo al notificar a n8n: {e}")

async def alertar_stock_bajo(producto_id: str, stock_actual: int, umbral: int):
    """
    Dispara un webhook a n8n si el stock bajó más allá del umbral.
    """
    if not settings.N8N_WEBHOOK_INVENTORY_URL:
        return

    try:
        async with httpx.AsyncClient() as client:
            await client.post(
                settings.N8N_WEBHOOK_INVENTORY_URL,
                json={
                    "event": "ALERTA_STOCK_BAJO",
                    "producto_id": str(producto_id),
                    "stock_restante": stock_actual,
                    "umbral_configurado": umbral
                },
                timeout=5.0
            )
            logger.warning(f"Alerta de inventario enviada para producto {producto_id}.")
    except Exception as e:
        logger.error(f"Fallo al enviar alerta de stock a n8n: {e}")
