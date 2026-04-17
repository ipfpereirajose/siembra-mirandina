#!/usr/bin/env python3
"""
Script para configurar usuarios de prueba en Supabase
Ejecutar este script una sola vez para crear las cuentas de prueba
"""

import os
import sys
from supabase import create_client, Client
from app.core.config import get_settings

def main():
    """Función principal para crear usuarios de prueba"""
    
    # Configurar variables de entorno desde .env
    settings = get_settings()
    
    print("🌱 Siembra Mirandina - Configuración de Usuarios de Prueba")
    print("=" * 60)
    
    # Verificar conexión con Supabase
    try:
        supabase = create_client(
            supabase_url=settings.SUPABASE_URL,
            supabase_key=settings.SUPABASE_SERVICE_KEY
        )
        print(f"✅ Conexión exitosa con Supabase")
        print(f"📊 URL: {settings.SUPABASE_URL}")
        
    except Exception as e:
        print(f"❌ Error conectando a Supabase: {str(e)}")
        return False
    
    # Datos de usuarios de prueba
    usuarios_prueba = [
        {
            "email": "productor@siembramirandina.com",
            "password": "Productor@2026!",
            "nombre": "Juan Pérez",
            "apellido": "Agricultor",
            "rol": "PRODUCTOR",
            "documento": "J-123456789",
            "tipo_personalidad": "NATURAL",
            "direccion_fiscal": "Finca El Progreso, Sector La Vega, Miranda",
            "telefono": "+58 212 1234567",
            "empresa_nombre": "AgroPérez C.A."
        },
        {
            "email": "cliente@siembramirandina.com",
            "password": "Cliente@2026!",
            "nombre": "María",
            "apellido": "González",
            "rol": "CLIENTE",
            "documento": "G-987654321",
            "tipo_personalidad": "JURIDICA",
            "direccion_fiscal": "Av. Principal #45, Los Teques, Miranda",
            "telefono": "+58 212 9876543",
            "empresa_nombre": "Distribuidora Miranda C.A."
        },
        {
            "email": "admin@siembramirandina.com",
            "password": "Admin@2026!",
            "nombre": "Carlos",
            "apellido": "Rodríguez",
            "rol": "ADMINISTRADOR",
            "documento": "J-000000000",
            "tipo_personalidad": "JURIDICA",
            "direccion_fiscal": "Torre Central, Piso 15, Caracas",
            "telefono": "+58 212 0000000",
            "empresa_nombre": "Siembra Mirandina Tech"
        }
    ]
    
    print("\n🔄 Creando usuarios de prueba...")
    print("-" * 60)
    
    usuarios_creados = 0
    usuarios_fallidos = 0
    
    for i, usuario in enumerate(usuarios_prueba, 1):
        try:
            print(f"\n📝 [{i}/3] Creando: {usuario['rol']} - {usuario['email']}")
            
            # 1. Verificar si ya existe
            existing_user = supabase.table('perfiles').select('*').eq('email', usuario['email']).execute()
            
            if existing_user.data:
                print(f"⚠️  El usuario {usuario['email']} ya existe. Omitiendo...")
                continue
            
            # 2. Crear usuario en Auth
            auth_result = supabase.auth.admin.create_user({
                "email": usuario["email"],
                "password": usuario["password"],
                "email_confirm": True,
                "user_metadata": {
                    "rol": usuario["rol"],
                    "nombre": usuario["nombre"]
                }
            })
            
            user_id = auth_result.user.id
            print(f"   ✅ Usuario creado en Auth: {user_id}")
            
            # 3. Crear empresa
            empresa_result = supabase.table('empresas').insert({
                "nombre": usuario["empresa_nombre"],
                "nit_rfc": usuario["documento"],
                "tipo_personalidad": usuario["tipo_personalidad"],
                "direccion_fiscal": usuario["direccion_fiscal"],
                "telefono_contacto": usuario["telefono"],
                "limite_credito_usd": 5000.00 if usuario["rol"] == "CLIENTE" else 10000.00
            }).execute()
            
            empresa_id = empresa_result.data[0]['id']
            print(f"   ✅ Empresa creada: {empresa_id}")
            
            # 4. Crear perfil
            nombre_completo = f"{usuario['nombre']} {usuario['apellido']}"
            perfil_result = supabase.table('perfiles').insert({
                "id": user_id,
                "empresa_id": empresa_id,
                "rol": usuario["rol"],
                "nombre_completo": nombre_completo,
                "telefono": usuario["telefono"]
            }).execute()
            
            print(f"   ✅ Perfil creado: {nombre_completo}")
            usuarios_creados += 1
            
        except Exception as e:
            print(f"   ❌ Error creando {usuario['email']}: {str(e)}")
            usuarios_fallidos += 1
    
    print("\n" + "=" * 60)
    print(f"📊 RESUMEN:")
    print(f"   ✅ Usuarios creados: {usuarios_creados}")
    print(f"   ❌ Usuarios fallidos: {usuarios_fallidos}")
    print(f"   📈 Tasa de éxito: {(usuarios_creados/len(usuarios_prueba))*100:.1f}%")
    
    if usuarios_creados > 0:
        print("\n🎯 USUARIOS LISTOS PARA TESTING:")
        print("┌─────────────────────────────────────────────────┐")
        print("│ ROL        │ CORREO                          │ CONTRASEÑA     │")
        print("├─────────────────────────────────────────────────┤")
        for usuario in usuarios_prueba:
            print(f"│ {usuario['rol']:<11} │ {usuario['email']:<32} │ {usuario['password']:<14} │")
        print("└─────────────────────────────────────────────────┘")
        
        print("\n🌐 INSTRUCCIONES:")
        print("1. Ir a tu aplicación desplegada en Vercel")
        print("2. Usar las credenciales según el rol deseado")
        print("3. Explorar las funcionalidades específicas de cada rol")
        
        return True
    else:
        print("\n❌ No se pudo crear ningún usuario. Revisa la configuración.")
        return False

if __name__ == "__main__":
    print("🔐 Verificando configuración...")
    
    # Verificar variables de entorno
    if not os.path.exists('.env'):
        print("❌ Error: Archivo .env no encontrado")
        print("Por favor crea el archivo .env con las credenciales de Supabase")
        sys.exit(1)
    
    # Ejecutar función principal
    if main():
        print("\n🎉 ¡Configuración completada con éxito!")
        print("📱 Los usuarios están listos para usar en la aplicación")
    else:
        print("\n💥 Error en la configuración. Revisa los logs arriba.")
        sys.exit(1)
