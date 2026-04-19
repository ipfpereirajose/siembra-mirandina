from fastapi import APIRouter, HTTPException, status, Depends
from app.db.supabase_client import get_supabase
from app.models.schemas import RegisterRequest, RegisterResponse, ResetPasswordRequest
from app.api.routers.comercio import get_user_context # Para jalar roles
from pydantic import BaseModel

router_auth = APIRouter(prefix="/auth", tags=["Autenticación y Registro"])

class LoginRequest(BaseModel):
    correo: str
    password: str

@router_auth.post("/login")
def login_cuenta(payload: LoginRequest):
    """
    Inicia sesión y recupera el perfil completo del usuario.
    Regresa: { user: { id, rol, empresa_id, nombre_completo } }
    """
    supabase = get_supabase()
    try:
        # 1. Autenticar con Supabase
        auth_res = supabase.auth.sign_in_with_password({
            "email": payload.correo,
            "password": payload.password
        })
        
        user_id = auth_res.user.id
        
        # 2. Obtener Perfil y Empresa
        # Evitamos .single() para que no lance excepción si no existe el registro en la tabla de perfiles
        res_perfil = supabase.table('perfiles').select('*, empresas(*)').eq('id', user_id).limit(1).execute()
        
        perfil = res_perfil.data[0] if res_perfil.data else None
        
        # Si el usuario no tiene perfil (huérfano en desarrollo), devolvemos datos básicos
        if not perfil:
            return {
                "user": {
                    "id": user_id,
                    "rol": auth_res.user.user_metadata.get("rol", "CLIENTE_NATURAL"),
                    "empresa_id": None,
                    "nombre_completo": auth_res.user.user_metadata.get("nombre", "Usuario Invitado")
                },
                "session": {
                    "access_token": auth_res.session.access_token,
                    "expires_in": auth_res.session.expires_in
                }
            }
            
        return {
            "user": {
                "id": user_id,
                "rol": perfil["rol"],
                "empresa_id": perfil["empresa_id"],
                "nombre_completo": perfil["nombre_completo"]
            },
            "session": {
                "access_token": auth_res.session.access_token,
                "expires_in": auth_res.session.expires_in
            }
        }
    except Exception as e:
        # Error genérico para no dar pistas de qué falló (seguridad)
        raise HTTPException(status_code=401, detail="Credenciales inválidas o error de sistema.")

@router_auth.post("/register", response_model=RegisterResponse)
def registrar_cuenta(payload: RegisterRequest):
    """
    Registra una cuenta en Siembra Mirandina.
    Motor de verificación: Si el RIF o CI existe, se rechaza el registro.
    """
    supabase = get_supabase()

    # 1. Motor de Verificación: ¿Existe el RIF/CI en 'empresas'?
    check_empresa = supabase.table('empresas').select('id').eq('nit_rfc', payload.documento).execute()
    if check_empresa.data:
        raise HTTPException(
            status_code=400, 
            detail="El RIF o CI ya se encuentra registrado en el sistema. Por favor verifique sus datos o intente recuperar su contraseña."
        )
    
    # 2. Verificar si el correo ya existe en Auth
    # (Supabase admin create_user fallará si existe, pero lo manejamos)
    
    try:
        # 3. Crear usuario en Auth
        auth_res = supabase.auth.admin.create_user({
            "email": payload.correo,
            "password": payload.password,
            "email_confirm": True,
            "user_metadata": {
                "rol": payload.rol,
                "nombre": payload.nombre
            }
        })
        user_id = auth_res.user.id
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"No se pudo crear el usuario (el correo ya existe o es inválido).")
        
    try:
        # 4. Combinar Nombre y Apellido
        nombre_final = payload.nombre
        if payload.apellido:
            nombre_final = f"{payload.nombre} {payload.apellido}"

        # 5. Registrar en la tabla Empresas
        empresa_res = supabase.table('empresas').insert({
            "nombre": nombre_final,
            "nit_rfc": payload.documento,
            "tipo_personalidad": payload.tipo_personalidad,
            "direccion_fiscal": payload.direccion_fiscal, 
            "telefono_contacto": payload.telefono,
            "limite_credito_usd": 0.00
        }).execute()
        empresa_id = empresa_res.data[0]['id']
        
        # 6. Vincular el Perfil con el rol específico
        supabase.table('perfiles').insert({
            "id": user_id,
            "empresa_id": empresa_id,
            "rol": payload.rol,
            "nombre_completo": nombre_final,
            "telefono": payload.telefono
        }).execute()
        
        return RegisterResponse(
            mensaje="Cuenta de Siembra Mirandina registrada exitosamente.",
            usuario_id=user_id,
            empresa_id=empresa_id
        )
        
    except Exception as e:
        # Limpieza (Rollback manual ya que Auth no es transaccional con DB en este flujo)
        supabase.auth.admin.delete_user(user_id)
        raise HTTPException(status_code=500, detail=f"Fallo al registrar los datos fiscales: {str(e)}")

@router_auth.post("/reset-password")
def recuperar_clave(payload: ResetPasswordRequest):
    """
    Envía el email de recuperación vía Supabase (por defecto usa su SMTP).
    """
    try:
        supabase = get_supabase()
        supabase.auth.reset_password_for_email(payload.correo)
        return {"mensaje": "Si el correo está registrado, se ha enviado un enlace para restablecer la contraseña."}
    except Exception as e:
        # Silenciamos fallos exactos por seguridad anti-escaneo
        return {"mensaje": "Si el correo está registrado, se ha enviado un enlace para restablecer la contraseña."}

class TicketRequest(BaseModel):
    campo_modificado: str
    valor_nuevo: str

@router_auth.get("/me")
def obtener_perfil(auth_ctx: dict = Depends(get_user_context)):
    supabase = get_supabase()
    res_perfil = supabase.table('perfiles').select('*, empresas(*)').eq('id', str(auth_ctx["usuario_id"])).limit(1).execute()
    
    if not res_perfil.data:
        # Retornar una estructura vacía pero coherente para que el frontend no rompa
        return {"nombre_completo": "Usuario sin Perfil Fiscal", "telefono": "", "empresas": {"nit_rfc": "N/A", "direccion_fiscal": "No registrada"}}

    return res_perfil.data[0]

@router_auth.post("/update-profile")
def actualizar_perfil(payload: dict, auth_ctx: dict = Depends(get_user_context)):
    supabase = get_supabase()
    # Actualizar datos en perfiles y empresas
    # payload: { nombre_completo, telefono, direccion_fiscal, password? }
    try:
        if "nombre_completo" in payload:
            supabase.table('perfiles').update({"nombre_completo": payload["nombre_completo"], "telefono": payload.get("telefono")}).eq('id', str(auth_ctx["usuario_id"])).execute()
        
        if "direccion_fiscal" in payload:
            profile = supabase.table('perfiles').select('empresa_id').eq('id', str(auth_ctx["usuario_id"])).single().execute()
            supabase.table('empresas').update({"direccion_fiscal": payload["direccion_fiscal"]}).eq('id', profile.data["empresa_id"]).execute()
            
        if "password" in payload and payload["password"]:
            # Cambiar password en Supabase Auth
            supabase.auth.admin.update_user_by_id(str(auth_ctx["usuario_id"]), {"password": payload["password"]})
            
        return {"mensaje": "Perfil actualizado correctamente."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
