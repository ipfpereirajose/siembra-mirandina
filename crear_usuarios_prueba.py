#!/usr/bin/env python3
"""
Script para crear usuarios de prueba en Supabase
"""

import os
import sys
from supabase import create_client, Client
from app.core.config import get_settings

def crear_usuarios_prueba():
    """Crea usuarios de prueba en la base de datos"""
    
    settings = get_settings()
    supabase = create_client(
        supabase_url=settings.SUPABASE_URL,
        supabase_key=settings.SUPABASE_SERVICE_KEY
    )
    
    print("🔐 Creando usuarios de prueba en Supabase...")
    print(f"📊 URL: {settings.SUPABASE_URL}")
    
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
    
    try:
        for i, usuario in enumerate(usuarios_prueba, 1):
            print(f"\n📝 Creando usuario {i}: {usuario['rol']} - {usuario['email']}")
            
            # 1. Crear usuario en Auth
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
            print(f"✅ Usuario creado en Auth: {user_id}")
            
            # 2. Crear empresa
            empresa_result = supabase.table('empresas').insert({
                "nombre": usuario["empresa_nombre"],
                "nit_rfc": usuario["documento"],
                "tipo_personalidad": usuario["tipo_personalidad"],
                "direccion_fiscal": usuario["direccion_fiscal"],
                "telefono_contacto": usuario["telefono"],
                "limite_credito_usd": 5000.00 if usuario["rol"] == "CLIENTE" else 10000.00
            }).execute()
            
            empresa_id = empresa_result.data[0]['id']
            print(f"✅ Empresa creada: {empresa_id}")
            
            # 3. Crear perfil
            nombre_completo = f"{usuario['nombre']} {usuario['apellido']}"
            perfil_result = supabase.table('perfiles').insert({
                "id": user_id,
                "empresa_id": empresa_id,
                "rol": usuario["rol"],
                "nombre_completo": nombre_completo,
                "telefono": usuario["telefono"]
            }).execute()
            
            print(f"✅ Perfil creado: {nombre_completo}")
            print(f"🎯 Usuario {usuario['rol']} listo para testing")
        
        print(f"\n🎉 ¡{len(usuarios_prueba)} usuarios de prueba creados exitosamente!")
        print("\n📋 Resumen de credenciales:")
        print("┌─────────────────────────────────────────────────────┐")
        print("│ ROL        │ CORREO                          │ CONTRASEÑA     │")
        print("├─────────────────────────────────────────────┤")
        for usuario in usuarios_prueba:
            print(f"│ {usuario['rol']:<10} │ {usuario['email']:<31} │ {usuario['password']:<14} │")
        print("└─────────────────────────────────────────────┘")
        
    except Exception as e:
        print(f"❌ Error creando usuarios: {str(e)}")
        return False
    
    return True

def verificar_usuarios():
    """Verifica si los usuarios existen en la base de datos"""
    
    settings = get_settings()
    supabase = create_client(
        supabase_url=settings.SUPABASE_URL,
        supabase_key=settings.SUPABASE_SERVICE_KEY
    )
    
    print("\n🔍 Verificando usuarios existentes...")
    
    emails_prueba = [
        "productor@siembramirandina.com",
        "cliente@siembramirandina.com",
        "admin@siembramirandina.com"
    ]
    
    for email in emails_prueba:
        try:
            # Verificar en perfiles
            result = supabase.table('perfiles').select('*').eq('email', email).execute()
            
            if result.data:
                perfil = result.data[0]
                print(f"✅ {email} - Rol: {perfil['rol']} - Empresa: {perfil['empresa_id']}")
            else:
                print(f"❌ {email} - No encontrado en perfiles")
                
        except Exception as e:
            print(f"❌ Error verificando {email}: {str(e)}")

if __name__ == "__main__":
    print("🌱 Siembra Mirandina - Script de Usuarios de Prueba")
    print("=" * 50)
    
    # Verificar variables de entorno
    if not os.getenv("SUPABASE_URL") or not os.getenv("SUPABASE_SERVICE_KEY"):
        print("❌ Error: Variables de entorno no configuradas")
        print("Por favor configura SUPABASE_URL y SUPABASE_SERVICE_KEY")
        sys.exit(1)
    
    # Menu de opciones
    print("\n📋 Opciones:")
    print("1. Crear usuarios de prueba")
    print("2. Verificar usuarios existentes")
    print("3. Crear y verificar (recomendado)")
    
    opcion = input("\n🎯 Selecciona una opción (1-3): ").strip()
    
    if opcion == "1":
        crear_usuarios_prueba()
    elif opcion == "2":
        verificar_usuarios()
    elif opcion == "3":
        print("\n🔄 Creando usuarios...")
        if crear_usuarios_prueba():
            print("\n🔍 Verificando usuarios creados...")
            verificar_usuarios()
    else:
        print("❌ Opción no válida")
