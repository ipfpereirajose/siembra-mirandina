import os
import shutil

# Mapping of artifact filename to final product filename
mapping = {
    'papa_granola_ref_1776560828887.png': 'papa.png',
    'tomate_perita_ref_1776560841848.png': 'tomate.png',
    'cebolla_blanca_ref_1776560854049.png': 'cebolla.png',
    'caraotas_negras_ref_1776560872210.png': 'caraota.png',
    'pimenton_rojo_ref_1776560885304.png': 'pimenton.png',
    'yuca_dulce_ref_1776560897890.png': 'yuca.png',
    'lechuga_criolla_ref_1776560910017.png': 'lechuga.png',
    'cebollin_ref_1776560927381.png': 'cebollin.png',
    'ajo_morado_ref_1776560938661.png': 'ajo.png',
    'remolacha_ref_1776560951870.png': 'remolacha.png'
}

source_dir = r'C:\Users\Usuario\.gemini\antigravity\brain\25cf5f7c-8366-4bed-8acc-1884040e3bc3'
dest_dir = 'frontend/public/products'

if not os.path.exists(dest_dir):
    os.makedirs(dest_dir)

for src, dst in mapping.items():
    src_path = os.path.join(source_dir, src)
    dst_path = os.path.join(dest_dir, dst)
    if os.path.exists(src_path):
        print(f"Moving {src} to {dst}...")
        shutil.move(src_path, dst_path)
    else:
        print(f"File not found: {src_path}")

print("Done.")
