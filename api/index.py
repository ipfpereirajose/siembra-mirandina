import sys
import os

# Aseguramos que el directorio raiz del proyecto esté en el path
# para que los imports 'from app.xxx import yyy' funcionen correctamente
# cuando Vercel ejecuta esta función desde /api/index.py
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
