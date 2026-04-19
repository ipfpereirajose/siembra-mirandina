import os
import time
from app.db.supabase_client import get_supabase
from dotenv import load_dotenv

load_dotenv()
supabase = get_supabase()

# Catálogos base definidos por el usuario con keywords para lorempixel/loremflickr
data_catalogo = {
    "Herramientas Manuales": [
        {"nombre": "Azada/Azadón", "desc": "Para labrar, remover tierra y desmalezar.", "precio": 12.50, "kw": "hoe,farming"},
        {"nombre": "Pala", "desc": "Para cavar, mover tierra, sustratos y abono.", "precio": 15.00, "kw": "shovel,farm"},
        {"nombre": "Rastrillo", "desc": "Para nivelar el terreno y recoger residuos.", "precio": 14.20, "kw": "rake,farming"},
        {"nombre": "Tijeras de poda", "desc": "Para cortar ramas y dar forma a los cultivos.", "precio": 18.50, "kw": "pruners"},
        {"nombre": "Carretilla", "desc": "Para transportar materiales, tierra y cosechas.", "precio": 45.00, "kw": "wheelbarrow"},
        {"nombre": "Barretón/Chuzo", "desc": "Para hacer agujeros profundos y cavar zanjas.", "precio": 22.00, "kw": "digging,tool"},
        {"nombre": "Hoz/Guadaña", "desc": "Para segar hierba o cosechar cereales.", "precio": 16.00, "kw": "scythe"},
        {"nombre": "Serrucho de poda", "desc": "Para cortar ramas gruesas.", "precio": 20.00, "kw": "saw,pruning"}
    ],
    "Maquinaria y Equipos Agrícolas": [
        {"nombre": "Tractor B2B Premium", "desc": "Maquinaria principal para arrastrar implementos.", "precio": 25000.00, "kw": "tractor"},
        {"nombre": "Motocultor", "desc": "Para labranza en terrenos pequeños.", "precio": 1200.00, "kw": "tiller,farm"},
        {"nombre": "Sembradora", "desc": "Para colocar semillas o plántulas mecánicamente.", "precio": 3500.00, "kw": "seeder,farm"},
        {"nombre": "Arado de Discos", "desc": "Para preparar y airear la tierra.", "precio": 850.00, "kw": "plow"},
        {"nombre": "Pulverizadora", "desc": "Para aplicar fertilizantes foliares o fitosanitarios.", "precio": 450.00, "kw": "sprayer,agriculture"},
        {"nombre": "Sistema de Riego (Goteo)", "desc": "Mangueras, aspersores, goteo.", "precio": 150.00, "kw": "irrigation"}
    ],
    "Insumos Agrícolas (Consumibles)": [
        {"nombre": "Fertilizante NPK 15-15-15", "desc": "Nitrogenados, fosforados, potásicos (NPK) y foliares.", "precio": 35.00, "kw": "fertilizer"},
        {"nombre": "Herbicida Sistemico (Glifosato)", "desc": "Insecticidas, herbicidas, fungicidas y acaricidas.", "precio": 42.00, "kw": "herbicide"},
        {"nombre": "Semillas de Maíz Certificadas", "desc": "Material vegetal certificado.", "precio": 85.00, "kw": "corn,seeds"},
        {"nombre": "Lombricompost Orgánico", "desc": "Compost, lombricompost, estiércol, materia orgánica.", "precio": 15.00, "kw": "compost"},
        {"nombre": "Sustrato Turba/Fibra Coco", "desc": "Turba, fibra de coco, perlita (para semilleros).", "precio": 25.00, "kw": "soil,peat"}
    ],
    "Materiales de Protección": [
        {"nombre": "Malla Sombra 80%", "desc": "Protección solar o antigranizo.", "precio": 120.00, "kw": "shade,net"},
        {"nombre": "Plástico de Invernadero", "desc": "Polietileno para cubiertas.", "precio": 180.00, "kw": "greenhouse,plastic"},
        {"nombre": "Kit Guantes y Mascarillas", "desc": "Equipo de protección personal (EPP).", "precio": 25.00, "kw": "gloves,farming"}
    ],
    "Tecnología Agrícola": [
        {"nombre": "Sensor Humedad Suelo", "desc": "Para monitoreo del suelo y clima.", "precio": 95.00, "kw": "sensor,soil"},
        {"nombre": "Medidor pH-metro", "desc": "Para medir la acidez/alcalinidad del suelo.", "precio": 115.00, "kw": "ph-meter"},
        {"nombre": "Dron Agrícola de Monitoreo", "desc": "Agricultura de precisión e imágenes NDVI.", "precio": 4500.00, "kw": "drone,agriculture"}
    ]
}

def sembrar_catagolo():
    print("Iniciando la siembra en Base de Datos de nuevos productos...")
    c = 1
    for cat_name, productos in data_catalogo.items():
        # Insertar Categoría o Recuperar si existe
        try:
            cat_res = supabase.table('categorias').insert({"nombre": cat_name, "descripcion": f"Catalogo B2B para {cat_name}"}).execute()
            cat_id = cat_res.data[0]['id']
        except Exception:
            # Si ya existe, buscar su ID
            cat_res = supabase.table('categorias').select('id').eq('nombre', cat_name).limit(1).execute()
            cat_id = cat_res.data[0]['id']
        
        for p in productos:
            sku_val = f"ARCO-{c:04d}"
            # Evitar duplicados de productos si ya se corrió parcialmente
            check_prod = supabase.table('productos').select('id').eq('sku', sku_val).limit(1).execute()
            if check_prod.data:
                print(f"Saltando: {sku_val} (Ya existe)")
                c += 1
                continue
            # Imagenes dinámicas de Unsplash. (Usando loremflickr que provee imágenes gratuitas dummy orientadas)
            # Parametros para variar imagen
            img_url = f"https://loremflickr.com/400/300/{p['kw']}?lock={c}"
            
            # Insertar Producto
            prod_res = supabase.table('productos').insert({
                "sku": sku_val,
                "nombre": p['nombre'],
                "descripcion_tecnica": p['desc'],
                "categoria_id": cat_id,
                "precio_base_usd": p['precio'],
                "imagen_url": img_url
            }).execute()
            
            # Insertar Inventario Inmediato de 100 unidades c/u
            prod_id = prod_res.data[0]['id']
            supabase.table('inventario').insert({
                "producto_id": prod_id,
                "stock_disponible": 100,
                "umbral_alerta": 10
            }).execute()
            c += 1
            print(f"OK Agregado: {sku_val} - {p['nombre']}")

if __name__ == "__main__":
    sembrar_catagolo()
    print("¡Base de datos Agrícola 100% Poblada!")
