import os
import shutil

# Mapping of artifact filename to final product filename
mapping = {
    'agrotech_tools_ref_1776561170374.png': 'herramientas.png',
    'agrotech_machinery_ref_1776561184985.png': 'maquinaria.png',
    'agrotech_inputs_ref_1776561197720.png': 'insumos.png',
    'agrotech_protection_ref_1776561211762.png': 'proteccion.png',
    'agrotech_technology_ref_1776561224025.png': 'tecnologia.png'
}

source_dir = r'C:\Users\Usuario\.gemini\antigravity\brain\25cf5f7c-8366-4bed-8acc-1884040e3bc3'
dest_dir = 'frontend/public/products'

for src, dst in mapping.items():
    src_path = os.path.join(source_dir, src)
    dst_path = os.path.join(dest_dir, dst)
    if os.path.exists(src_path):
        print(f"Moving {src} to {dst}...")
        shutil.move(src_path, dst_path)
    else:
        print(f"File not found: {src_path}")

print("Done.")
