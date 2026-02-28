from fastapi import FastAPI, APIRouter, HTTPException, Header, UploadFile, File, Form
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import httpx


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# Verifact API Models
class LoginRequest(BaseModel):
    email: str
    password: str

class UsuarioResponse(BaseModel):
    id: str
    clienteId: str
    nombre: str
    email: str
    rol: str
    clienteNombre: str
    clienteRNC: str

class LoginResponse(BaseModel):
    success: bool
    token: Optional[str] = None
    refreshToken: Optional[str] = None
    expira: Optional[str] = None
    usuario: Optional[UsuarioResponse] = None
    message: Optional[str] = None

# Verifact API Base URL
VERIFACT_API_URL = os.environ.get('VERIFACT_API_URL', 'https://ecf-test.api.verifact.com.do')

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

# =============================================
# VERIFACT API PROXY ENDPOINTS
# =============================================

@api_router.post("/auth/login")
async def proxy_login(login_data: LoginRequest):
    """
    Proxy endpoint for Verifact login API.
    This bypasses CORS and SSL issues by making the request server-side.
    """
    try:
        async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
            response = await client.post(
                f"{VERIFACT_API_URL}/api/auth/login",
                json={
                    "email": login_data.email,
                    "password": login_data.password
                },
                headers={
                    "Content-Type": "application/json"
                }
            )
            
            # Return the response from Verifact API
            if response.status_code == 200:
                return response.json()
            else:
                # Try to get error message from response
                try:
                    error_data = response.json()
                    return {
                        "success": False,
                        "message": error_data.get("message", f"Error del servidor: {response.status_code}")
                    }
                except:
                    return {
                        "success": False,
                        "message": f"Error del servidor: {response.status_code}"
                    }
                    
    except httpx.ConnectError as e:
        logger.error(f"Connection error to Verifact API: {str(e)}")
        raise HTTPException(
            status_code=503,
            detail="No se pudo conectar con el servidor de Verifact"
        )
    except httpx.TimeoutException as e:
        logger.error(f"Timeout connecting to Verifact API: {str(e)}")
        raise HTTPException(
            status_code=504,
            detail="Tiempo de espera agotado al conectar con Verifact"
        )
    except Exception as e:
        logger.error(f"Error proxying login request: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error interno: {str(e)}"
        )

@api_router.post("/auth/logout")
async def proxy_logout(authorization: str = Header(...)):
    """
    Proxy endpoint for Verifact logout API.
    Invalidates the user session on the server.
    """
    try:
        async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
            response = await client.post(
                f"{VERIFACT_API_URL}/api/auth/logout",
                headers={
                    "Authorization": authorization,
                    "Accept": "*/*"
                }
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                # Even if server returns error, we still want to logout locally
                return {"message": "Sesión cerrada"}
                    
    except Exception as e:
        logger.error(f"Error during logout: {str(e)}")
        # Return success anyway since we'll clear local storage
        return {"message": "Sesión cerrada"}

class RefreshTokenRequest(BaseModel):
    refreshToken: str

@api_router.post("/auth/refresh")
async def proxy_refresh_token(
    refresh_data: RefreshTokenRequest,
    authorization: str = Header(...)
):
    """
    Proxy endpoint for Verifact refresh token API.
    Renews the JWT token using the refresh token.
    """
    try:
        async with httpx.AsyncClient(verify=False, timeout=30.0) as http_client:
            response = await http_client.post(
                f"{VERIFACT_API_URL}/api/auth/refresh",
                json={
                    "refreshToken": refresh_data.refreshToken
                },
                headers={
                    "Authorization": authorization,
                    "Content-Type": "application/json",
                    "Accept": "text/plain"
                }
            )
            
            if response.status_code in [200, 201]:
                return response.json()
            elif response.status_code == 401:
                return {
                    "success": False,
                    "message": "Sesión expirada. Por favor, inicie sesión nuevamente."
                }
            else:
                try:
                    error_data = response.json()
                    return {
                        "success": False,
                        "message": error_data.get("message", f"Error: {response.status_code}")
                    }
                except:
                    return {
                        "success": False,
                        "message": f"Error del servidor: {response.status_code}"
                    }
                    
    except httpx.ConnectError as e:
        logger.error(f"Connection error to Verifact API: {str(e)}")
        raise HTTPException(status_code=503, detail="No se pudo conectar con el servidor de Verifact")
    except httpx.TimeoutException as e:
        logger.error(f"Timeout connecting to Verifact API: {str(e)}")
        raise HTTPException(status_code=504, detail="Tiempo de espera agotado")
    except Exception as e:
        logger.error(f"Error refreshing token: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

# =============================================
# CLIENTES (REGISTRO) API PROXY ENDPOINTS
# =============================================

class RegisterClienteRequest(BaseModel):
    companyName: str
    rnc: str
    companyEmail: str
    phone: Optional[str] = None
    fiscalAddress: Optional[str] = None
    userFullName: str
    userEmail: str
    userPassword: str

@api_router.post("/clientes/registrar")
async def proxy_register_cliente(register_data: RegisterClienteRequest):
    """
    Proxy endpoint to register a new client/company in Verifact API.
    This endpoint is public and does not require authentication.
    """
    try:
        async with httpx.AsyncClient(verify=False, timeout=30.0) as http_client:
            response = await http_client.post(
                f"{VERIFACT_API_URL}/api/clientes/registrar",
                json={
                    "companyName": register_data.companyName,
                    "rnc": register_data.rnc,
                    "companyEmail": register_data.companyEmail,
                    "phone": register_data.phone or "",
                    "fiscalAddress": register_data.fiscalAddress or "",
                    "userFullName": register_data.userFullName,
                    "userEmail": register_data.userEmail,
                    "userPassword": register_data.userPassword
                },
                headers={
                    "Content-Type": "application/json",
                    "Accept": "*/*"
                }
            )
            
            if response.status_code == 200:
                result = response.json()
                return {
                    "success": True,
                    "clienteId": result.get("clienteId"),
                    "clienteRNC": result.get("clienteRNC"),
                    "usuarioId": result.get("usuarioId"),
                    "usuarioEmail": result.get("usuarioEmail")
                }
            elif response.status_code == 400:
                try:
                    error_data = response.json()
                    return {
                        "success": False,
                        "message": error_data.get("message") or error_data.get("title") or "Datos de registro inválidos"
                    }
                except:
                    return {
                        "success": False,
                        "message": "Datos de registro inválidos"
                    }
            else:
                try:
                    error_data = response.json()
                    return {
                        "success": False,
                        "message": error_data.get("message") or f"Error: {response.status_code}"
                    }
                except:
                    return {
                        "success": False,
                        "message": f"Error del servidor: {response.status_code}"
                    }
                    
    except httpx.ConnectError as e:
        logger.error(f"Connection error to Verifact API: {str(e)}")
        raise HTTPException(status_code=503, detail="No se pudo conectar con el servidor de Verifact")
    except httpx.TimeoutException as e:
        logger.error(f"Timeout connecting to Verifact API: {str(e)}")
        raise HTTPException(status_code=504, detail="Tiempo de espera agotado")
    except Exception as e:
        logger.error(f"Error registering client: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

# =============================================
# CERTIFICADOS API PROXY ENDPOINTS
# =============================================

@api_router.get("/certificado/listado")
async def proxy_get_certificados(authorization: str = Header(...)):
    """
    Proxy endpoint to get all certificates from Verifact API.
    """
    try:
        async with httpx.AsyncClient(verify=False, timeout=30.0) as http_client:
            response = await http_client.get(
                f"{VERIFACT_API_URL}/api/certificado/listado",
                headers={
                    "Authorization": authorization,
                    "Accept": "*/*"
                }
            )
            
            if response.status_code in [200, 201]:
                return response.json()
            elif response.status_code == 401:
                raise HTTPException(status_code=401, detail="No autorizado")
            else:
                try:
                    error_data = response.json()
                    return {
                        "success": False,
                        "message": error_data.get("message", f"Error: {response.status_code}")
                    }
                except:
                    return {
                        "success": False,
                        "message": f"Error del servidor: {response.status_code}"
                    }
                    
    except httpx.ConnectError as e:
        logger.error(f"Connection error to Verifact API: {str(e)}")
        raise HTTPException(status_code=503, detail="No se pudo conectar con el servidor de Verifact")
    except httpx.TimeoutException as e:
        logger.error(f"Timeout connecting to Verifact API: {str(e)}")
        raise HTTPException(status_code=504, detail="Tiempo de espera agotado")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting certificates: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

@api_router.post("/certificado/subir")
async def proxy_upload_certificado(
    certificado: UploadFile = File(...),
    password: str = Form(...),
    authorization: str = Header(...)
):
    """
    Proxy endpoint to upload a certificate (.p12) to Verifact API.
    """
    try:
        # Read file content
        file_content = await certificado.read()
        
        async with httpx.AsyncClient(verify=False, timeout=60.0) as http_client:
            # Prepare multipart form data
            files = {
                'certificado': (certificado.filename, file_content, 'application/x-pkcs12')
            }
            data = {
                'password': password
            }
            
            response = await http_client.post(
                f"{VERIFACT_API_URL}/api/certificado/subir",
                files=files,
                data=data,
                headers={
                    "Authorization": authorization,
                    "Accept": "*/*"
                }
            )
            
            if response.status_code in [200, 201]:
                return response.json()
            elif response.status_code == 401:
                raise HTTPException(status_code=401, detail="No autorizado")
            elif response.status_code == 400:
                try:
                    error_data = response.json()
                    return {
                        "success": False,
                        "message": error_data.get("message", "Error al procesar el certificado")
                    }
                except:
                    return {
                        "success": False,
                        "message": "Error al procesar el certificado"
                    }
            else:
                try:
                    error_data = response.json()
                    return {
                        "success": False,
                        "message": error_data.get("message", f"Error: {response.status_code}")
                    }
                except:
                    return {
                        "success": False,
                        "message": f"Error del servidor: {response.status_code}"
                    }
                    
    except httpx.ConnectError as e:
        logger.error(f"Connection error to Verifact API: {str(e)}")
        raise HTTPException(status_code=503, detail="No se pudo conectar con el servidor de Verifact")
    except httpx.TimeoutException as e:
        logger.error(f"Timeout connecting to Verifact API: {str(e)}")
        raise HTTPException(status_code=504, detail="Tiempo de espera agotado")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading certificate: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

# =============================================
# FACTURAS API PROXY ENDPOINTS
# =============================================

@api_router.post("/facturas/facturaselectronicas")
async def proxy_upload_factura(
    XmlFile: UploadFile = File(...),
    authorization: str = Header(...)
):
    """
    Proxy endpoint to upload an electronic invoice (XML) to Verifact API.
    """
    try:
        # Read file content
        file_content = await XmlFile.read()
        
        async with httpx.AsyncClient(verify=False, timeout=60.0) as http_client:
            # Prepare multipart form data
            files = {
                'XmlFile': (XmlFile.filename, file_content, 'text/xml')
            }
            data = {
                'Xml': ''
            }
            
            response = await http_client.post(
                f"{VERIFACT_API_URL}/api/facturas/facturaselectronicas",
                files=files,
                data=data,
                headers={
                    "Authorization": authorization,
                    "Accept": "*/*"
                }
            )
            
            if response.status_code == 200:
                result = response.json()
                # Check if there's an error in the response
                if result.get('error') and result['error'] != '':
                    return {
                        "success": False,
                        "message": result['error'],
                        "trackId": result.get('trackId')
                    }
                return {
                    "success": True,
                    "trackId": result.get('trackId'),
                    "mensaje": result.get('mensaje', 'Factura enviada exitosamente')
                }
            elif response.status_code == 401:
                raise HTTPException(status_code=401, detail="No autorizado")
            elif response.status_code == 400:
                try:
                    error_data = response.json()
                    return {
                        "success": False,
                        "message": error_data.get("message") or error_data.get("error") or "Error al procesar la factura"
                    }
                except:
                    return {
                        "success": False,
                        "message": "Error al procesar la factura"
                    }
            else:
                try:
                    error_data = response.json()
                    return {
                        "success": False,
                        "message": error_data.get("message") or error_data.get("error") or f"Error: {response.status_code}"
                    }
                except:
                    return {
                        "success": False,
                        "message": f"Error del servidor: {response.status_code}"
                    }
                    
    except httpx.ConnectError as e:
        logger.error(f"Connection error to Verifact API: {str(e)}")
        raise HTTPException(status_code=503, detail="No se pudo conectar con el servidor de Verifact")
    except httpx.TimeoutException as e:
        logger.error(f"Timeout connecting to Verifact API: {str(e)}")
        raise HTTPException(status_code=504, detail="Tiempo de espera agotado")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading invoice: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

@api_router.get("/facturas/getfacturaselectronicas")
async def proxy_get_facturas(
    fechaInicio: str,
    fechaFin: str,
    authorization: str = Header(...)
):
    """
    Proxy endpoint to get electronic invoices from Verifact API.
    Date format: DD-MM-YYYY
    """
    try:
        async with httpx.AsyncClient(verify=False, timeout=30.0) as http_client:
            response = await http_client.get(
                f"{VERIFACT_API_URL}/api/facturas/getfacturaselectronicas",
                params={
                    "fechaInicio": fechaInicio,
                    "fechaFin": fechaFin
                },
                headers={
                    "Authorization": authorization,
                    "Accept": "*/*"
                }
            )
            
            if response.status_code in [200, 201]:
                return response.json()
            elif response.status_code == 401:
                raise HTTPException(status_code=401, detail="No autorizado")
            else:
                try:
                    error_data = response.json()
                    return {
                        "total": 0,
                        "facturas": [],
                        "message": error_data.get("message", f"Error: {response.status_code}")
                    }
                except:
                    return {
                        "total": 0,
                        "facturas": [],
                        "message": f"Error del servidor: {response.status_code}"
                    }
                    
    except httpx.ConnectError as e:
        logger.error(f"Connection error to Verifact API: {str(e)}")
        raise HTTPException(status_code=503, detail="No se pudo conectar con el servidor de Verifact")
    except httpx.TimeoutException as e:
        logger.error(f"Timeout connecting to Verifact API: {str(e)}")
        raise HTTPException(status_code=504, detail="Tiempo de espera agotado")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting invoices: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

# =============================================
# USUARIOS API PROXY ENDPOINTS
# =============================================

class CreateUserRequest(BaseModel):
    email: str
    password: str
    nombre: str
    rol: str

class UpdateUserRequest(BaseModel):
    email: str
    password: Optional[str] = None
    nombre: str
    rol: str
    esActivo: bool = True

@api_router.get("/usuarios")
async def proxy_get_usuarios(authorization: str = Header(...)):
    """
    Proxy endpoint to get all users from Verifact API.
    """
    try:
        async with httpx.AsyncClient(verify=False, timeout=30.0) as http_client:
            response = await http_client.get(
                f"{VERIFACT_API_URL}/api/usuarios",
                headers={
                    "Authorization": authorization,
                    "Accept": "text/plain"
                }
            )
            
            if response.status_code in [200, 201]:
                return response.json()
            elif response.status_code == 401:
                raise HTTPException(status_code=401, detail="No autorizado")
            else:
                try:
                    error_data = response.json()
                    return {
                        "success": False,
                        "message": error_data.get("message", f"Error: {response.status_code}")
                    }
                except:
                    return {
                        "success": False,
                        "message": f"Error del servidor: {response.status_code}"
                    }
                    
    except httpx.ConnectError as e:
        logger.error(f"Connection error to Verifact API: {str(e)}")
        raise HTTPException(status_code=503, detail="No se pudo conectar con el servidor de Verifact")
    except httpx.TimeoutException as e:
        logger.error(f"Timeout connecting to Verifact API: {str(e)}")
        raise HTTPException(status_code=504, detail="Tiempo de espera agotado")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting users: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

@api_router.get("/usuarios/{user_id}")
async def proxy_get_usuario(user_id: str, authorization: str = Header(...)):
    """
    Proxy endpoint to get a specific user from Verifact API.
    """
    try:
        async with httpx.AsyncClient(verify=False, timeout=30.0) as http_client:
            response = await http_client.get(
                f"{VERIFACT_API_URL}/api/usuarios/{user_id}",
                headers={
                    "Authorization": authorization,
                    "Accept": "text/plain"
                }
            )
            
            if response.status_code in [200, 201]:
                return response.json()
            elif response.status_code == 401:
                raise HTTPException(status_code=401, detail="No autorizado")
            elif response.status_code == 404:
                raise HTTPException(status_code=404, detail="Usuario no encontrado")
            else:
                try:
                    error_data = response.json()
                    return {
                        "success": False,
                        "message": error_data.get("message", f"Error: {response.status_code}")
                    }
                except:
                    return {
                        "success": False,
                        "message": f"Error del servidor: {response.status_code}"
                    }
                    
    except httpx.ConnectError as e:
        logger.error(f"Connection error to Verifact API: {str(e)}")
        raise HTTPException(status_code=503, detail="No se pudo conectar con el servidor de Verifact")
    except httpx.TimeoutException as e:
        logger.error(f"Timeout connecting to Verifact API: {str(e)}")
        raise HTTPException(status_code=504, detail="Tiempo de espera agotado")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

@api_router.post("/usuarios")
async def proxy_create_usuario(user_data: CreateUserRequest, authorization: str = Header(...)):
    """
    Proxy endpoint to create a new user in Verifact API.
    """
    try:
        async with httpx.AsyncClient(verify=False, timeout=30.0) as http_client:
            response = await http_client.post(
                f"{VERIFACT_API_URL}/api/usuarios",
                json={
                    "email": user_data.email,
                    "password": user_data.password,
                    "nombre": user_data.nombre,
                    "rol": user_data.rol
                },
                headers={
                    "Authorization": authorization,
                    "Content-Type": "application/json",
                    "Accept": "text/plain"
                }
            )
            
            if response.status_code in [200, 201]:
                return response.json()
            elif response.status_code == 401:
                raise HTTPException(status_code=401, detail="No autorizado")
            elif response.status_code == 400:
                try:
                    error_data = response.json()
                    return {
                        "success": False,
                        "message": error_data.get("error") or error_data.get("message") or error_data.get("title") or "Datos inválidos"
                    }
                except:
                    return {
                        "success": False,
                        "message": "Datos de usuario inválidos"
                    }
            else:
                try:
                    error_data = response.json()
                    return {
                        "success": False,
                        "message": error_data.get("error") or error_data.get("message") or f"Error: {response.status_code}"
                    }
                except:
                    return {
                        "success": False,
                        "message": f"Error del servidor: {response.status_code}"
                    }
                    
    except httpx.ConnectError as e:
        logger.error(f"Connection error to Verifact API: {str(e)}")
        raise HTTPException(status_code=503, detail="No se pudo conectar con el servidor de Verifact")
    except httpx.TimeoutException as e:
        logger.error(f"Timeout connecting to Verifact API: {str(e)}")
        raise HTTPException(status_code=504, detail="Tiempo de espera agotado")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating user: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

@api_router.put("/usuarios/{user_id}")
async def proxy_update_usuario(user_id: str, user_data: UpdateUserRequest, authorization: str = Header(...)):
    """
    Proxy endpoint to update a user in Verifact API.
    """
    try:
        update_data = {
            "email": user_data.email,
            "nombre": user_data.nombre,
            "rol": user_data.rol,
            "esActivo": user_data.esActivo
        }
        
        # Only include password if provided
        if user_data.password:
            update_data["password"] = user_data.password
        
        async with httpx.AsyncClient(verify=False, timeout=30.0) as http_client:
            response = await http_client.put(
                f"{VERIFACT_API_URL}/api/usuarios/{user_id}",
                json=update_data,
                headers={
                    "Authorization": authorization,
                    "Content-Type": "application/json",
                    "Accept": "text/plain"
                }
            )
            
            if response.status_code in [200, 201]:
                return response.json()
            elif response.status_code == 401:
                raise HTTPException(status_code=401, detail="No autorizado")
            elif response.status_code == 404:
                raise HTTPException(status_code=404, detail="Usuario no encontrado")
            elif response.status_code == 400:
                try:
                    error_data = response.json()
                    return {
                        "success": False,
                        "message": error_data.get("error") or error_data.get("message") or error_data.get("title") or "Datos inválidos"
                    }
                except:
                    return {
                        "success": False,
                        "message": "Datos de usuario inválidos"
                    }
            else:
                try:
                    error_data = response.json()
                    return {
                        "success": False,
                        "message": error_data.get("error") or error_data.get("message") or f"Error: {response.status_code}"
                    }
                except:
                    return {
                        "success": False,
                        "message": f"Error del servidor: {response.status_code}"
                    }
                    
    except httpx.ConnectError as e:
        logger.error(f"Connection error to Verifact API: {str(e)}")
        raise HTTPException(status_code=503, detail="No se pudo conectar con el servidor de Verifact")
    except httpx.TimeoutException as e:
        logger.error(f"Timeout connecting to Verifact API: {str(e)}")
        raise HTTPException(status_code=504, detail="Tiempo de espera agotado")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating user: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

# =============================================
# CLIENTES (EMPRESA) API PROXY ENDPOINTS
# =============================================

@api_router.get("/clientes")
async def proxy_get_clientes(authorization: str = Header(...)):
    """
    Proxy endpoint to get company/client information from Verifact API.
    """
    try:
        async with httpx.AsyncClient(verify=False, timeout=30.0) as http_client:
            response = await http_client.get(
                f"{VERIFACT_API_URL}/api/clientes",
                headers={
                    "Authorization": authorization,
                    "Accept": "text/plain"
                }
            )
            
            if response.status_code in [200, 201]:
                return response.json()
            elif response.status_code == 401:
                raise HTTPException(status_code=401, detail="No autorizado")
            else:
                try:
                    error_data = response.json()
                    return {
                        "success": False,
                        "message": error_data.get("error") or error_data.get("message") or f"Error: {response.status_code}"
                    }
                except:
                    return {
                        "success": False,
                        "message": f"Error del servidor: {response.status_code}"
                    }
                    
    except httpx.ConnectError as e:
        logger.error(f"Connection error to Verifact API: {str(e)}")
        raise HTTPException(status_code=503, detail="No se pudo conectar con el servidor de Verifact")
    except httpx.TimeoutException as e:
        logger.error(f"Timeout connecting to Verifact API: {str(e)}")
        raise HTTPException(status_code=504, detail="Tiempo de espera agotado")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting clients: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

# =============================================
# CAMBIO DE CONTRASEÑA API PROXY ENDPOINT
# =============================================

class ChangePasswordRequest(BaseModel):
    currentPassword: str
    newPassword: str

@api_router.post("/usuarios/{user_id}/password")
async def proxy_change_password(user_id: str, password_data: ChangePasswordRequest, authorization: str = Header(...)):
    """
    Proxy endpoint to change user password in Verifact API.
    """
    try:
        async with httpx.AsyncClient(verify=False, timeout=30.0) as http_client:
            response = await http_client.post(
                f"{VERIFACT_API_URL}/api/usuarios/{user_id}/password",
                json={
                    "currentPassword": password_data.currentPassword,
                    "newPassword": password_data.newPassword
                },
                headers={
                    "Authorization": authorization,
                    "Content-Type": "application/json",
                    "Accept": "*/*"
                }
            )
            
            if response.status_code in [200, 201]:
                return {"success": True, "message": "Contraseña actualizada exitosamente"}
            elif response.status_code == 401:
                raise HTTPException(status_code=401, detail="No autorizado")
            elif response.status_code == 400:
                try:
                    error_data = response.json()
                    return {
                        "success": False,
                        "message": error_data.get("error") or error_data.get("message") or "Contraseña actual incorrecta"
                    }
                except:
                    return {
                        "success": False,
                        "message": "Contraseña actual incorrecta"
                    }
            else:
                try:
                    error_data = response.json()
                    return {
                        "success": False,
                        "message": error_data.get("error") or error_data.get("message") or f"Error: {response.status_code}"
                    }
                except:
                    return {
                        "success": False,
                        "message": f"Error del servidor: {response.status_code}"
                    }
                    
    except httpx.ConnectError as e:
        logger.error(f"Connection error to Verifact API: {str(e)}")
        raise HTTPException(status_code=503, detail="No se pudo conectar con el servidor de Verifact")
    except httpx.TimeoutException as e:
        logger.error(f"Timeout connecting to Verifact API: {str(e)}")
        raise HTTPException(status_code=504, detail="Tiempo de espera agotado")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error changing password: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

# =============================================
# RECEPCIÓN eCF API PROXY ENDPOINTS
# =============================================

@api_router.get("/fe/recepcion/ecf/recibidos")
async def proxy_get_ecf_recibidos():
    """
    Proxy endpoint to get received eCF documents.
    This endpoint does not require authentication.
    """
    try:
        async with httpx.AsyncClient(verify=False, timeout=30.0) as http_client:
            response = await http_client.get(
                f"{VERIFACT_API_URL}/fe/recepcion/api/ecf/recibidos/raw",
                headers={
                    "Accept": "text/plain"
                }
            )
            
            if response.status_code in [200, 201]:
                return response.json()
            else:
                try:
                    error_data = response.json()
                    return {
                        "success": False,
                        "message": error_data.get("error") or error_data.get("message") or f"Error: {response.status_code}"
                    }
                except:
                    return {
                        "success": False,
                        "message": f"Error del servidor: {response.status_code}"
                    }
                    
    except httpx.ConnectError as e:
        logger.error(f"Connection error to Verifact API: {str(e)}")
        raise HTTPException(status_code=503, detail="No se pudo conectar con el servidor de Verifact")
    except httpx.TimeoutException as e:
        logger.error(f"Timeout connecting to Verifact API: {str(e)}")
        raise HTTPException(status_code=504, detail="Tiempo de espera agotado")
    except Exception as e:
        logger.error(f"Error getting received eCF: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

# =============================================
# RNC CONSULTA API PROXY ENDPOINT
# =============================================

@api_router.get("/rnc/consultar/{rnc}")
async def proxy_consultar_rnc(rnc: str, authorization: str = Header(...)):
    """
    Proxy endpoint to get RNC information from Verifact API.
    """
    try:
        async with httpx.AsyncClient(verify=False, timeout=30.0) as http_client:
            response = await http_client.get(
                f"{VERIFACT_API_URL}/api/rnc/consultar-rnc/{rnc}",
                headers={
                    "Authorization": authorization,
                    "Accept": "text/plain"
                }
            )
            
            if response.status_code in [200, 201]:
                return response.json()
            elif response.status_code == 404:
                return {
                    "name": "No encontrado",
                    "status": "DESCONOCIDO",
                    "createdAt": None
                }
            else:
                return {
                    "name": "Error al consultar",
                    "status": "ERROR",
                    "createdAt": None
                }
                    
    except Exception as e:
        logger.error(f"Error consulting RNC: {str(e)}")
        return {
            "name": "Error",
            "status": "ERROR",
            "createdAt": None
        }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()