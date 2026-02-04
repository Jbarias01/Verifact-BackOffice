import React, { useState, useEffect, useCallback } from 'react';
import { 
    Shield, 
    Upload, 
    Calendar, 
    Clock, 
    CheckCircle2, 
    AlertTriangle,
    FileKey,
    User,
    Building2,
    RefreshCw,
    Loader2,
    X,
    Eye,
    EyeOff
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import axios from 'axios';

// API URL Configuration (same as AuthContext)
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const VERIFACT_API_DIRECT = process.env.REACT_APP_VERIFACT_API_URL || 'https://ecf-test.api.verifact.com.do';
const USE_PROXY = BACKEND_URL && BACKEND_URL.includes('preview.emergentagent.com');
const API_BASE_URL = USE_PROXY ? `${BACKEND_URL}/api` : VERIFACT_API_DIRECT;

// Helper to parse certificate subject
const parseSubject = (subject) => {
    if (!subject) return { cn: 'N/A', serialNumber: 'N/A' };
    
    const parts = subject.split(', ');
    const result = {};
    
    parts.forEach(part => {
        const [key, value] = part.split('=');
        if (key && value) {
            result[key.trim()] = value.trim();
        }
    });
    
    return {
        cn: result.CN || 'N/A',
        serialNumber: result.SERIALNUMBER || 'N/A',
        givenName: result.G || '',
        surname: result.SN || '',
        country: result.C || 'DO'
    };
};

// Helper to format date
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-DO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

const Certificados = () => {
    const { token } = useAuth();
    const [certificados, setCertificados] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    
    // Upload form state
    const [selectedFile, setSelectedFile] = useState(null);
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const fetchCertificados = useCallback(async () => {
        if (!token) return;
        
        setIsLoading(true);
        setError(null);
        
        try {
            const response = await axios.get(`${VERIFACT_API_URL}/api/certificado/listado`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.data.success) {
                setCertificados(response.data.data || []);
            } else {
                setError(response.data.message || 'Error al obtener certificados');
            }
        } catch (err) {
            console.error('Error fetching certificates:', err);
            if (err.response?.status === 401) {
                setError('Sesión expirada. Por favor, inicie sesión nuevamente.');
            } else {
                setError('Error al cargar los certificados');
            }
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchCertificados();
    }, [fetchCertificados]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.name.endsWith('.p12') && !file.name.endsWith('.pfx')) {
                setUploadError('Solo se permiten archivos .p12 o .pfx');
                setSelectedFile(null);
                return;
            }
            setSelectedFile(file);
            setUploadError(null);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        
        if (!selectedFile) {
            setUploadError('Seleccione un archivo de certificado');
            return;
        }
        
        if (!password) {
            setUploadError('Ingrese la contraseña del certificado');
            return;
        }
        
        setIsUploading(true);
        setUploadError(null);
        setUploadSuccess(false);
        
        try {
            const formData = new FormData();
            formData.append('certificado', selectedFile);
            formData.append('password', password);
            
            const response = await axios.post(`${VERIFACT_API_URL}/api/certificado/subir`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            if (response.data.success) {
                setUploadSuccess(true);
                setSelectedFile(null);
                setPassword('');
                // Refresh the list
                await fetchCertificados();
                // Close dialog after success
                setTimeout(() => {
                    setIsUploadOpen(false);
                    setUploadSuccess(false);
                }, 2000);
            } else {
                setUploadError(response.data.message || 'Error al subir el certificado');
            }
        } catch (err) {
            console.error('Error uploading certificate:', err);
            if (err.response?.status === 401) {
                setUploadError('Sesión expirada. Por favor, inicie sesión nuevamente.');
            } else if (err.response?.data?.detail) {
                setUploadError(err.response.data.detail);
            } else {
                setUploadError('Error al subir el certificado');
            }
        } finally {
            setIsUploading(false);
        }
    };

    const resetUploadForm = () => {
        setSelectedFile(null);
        setPassword('');
        setUploadError(null);
        setUploadSuccess(false);
    };

    const getStatusBadge = (cert) => {
        if (!cert.esActivo) {
            return (
                <Badge variant="outline" className="bg-muted text-muted-foreground">
                    Inactivo
                </Badge>
            );
        }
        
        if (cert.diasRestantes <= 30) {
            return (
                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Expira pronto
                </Badge>
            );
        }
        
        if (cert.diasRestantes <= 90) {
            return (
                <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                    <Clock className="h-3 w-3 mr-1" />
                    {cert.diasRestantes} días
                </Badge>
            );
        }
        
        return (
            <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Activo
            </Badge>
        );
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3">
                        <Shield className="h-8 w-8 text-primary" />
                        Certificados Digitales
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Gestiona los certificados de firma electrónica para facturación
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button 
                        variant="outline" 
                        onClick={fetchCertificados}
                        disabled={isLoading}
                    >
                        <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                        Actualizar
                    </Button>
                    <Dialog open={isUploadOpen} onOpenChange={(open) => {
                        setIsUploadOpen(open);
                        if (!open) resetUploadForm();
                    }}>
                        <DialogTrigger asChild>
                            <Button className="bg-primary hover:bg-primary-hover">
                                <Upload className="h-4 w-4 mr-2" />
                                Subir Certificado
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <FileKey className="h-5 w-5 text-primary" />
                                    Subir Certificado Digital
                                </DialogTitle>
                                <DialogDescription>
                                    Sube tu certificado .p12 para firmar facturas electrónicas
                                </DialogDescription>
                            </DialogHeader>
                            
                            <form onSubmit={handleUpload} className="space-y-4">
                                {uploadSuccess && (
                                    <div className="p-4 rounded-lg bg-success/10 border border-success/20 text-success flex items-center gap-2">
                                        <CheckCircle2 className="h-5 w-5" />
                                        <span>Certificado subido exitosamente</span>
                                    </div>
                                )}
                                
                                {uploadError && (
                                    <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                                        {uploadError}
                                    </div>
                                )}
                                
                                <div className="space-y-2">
                                    <Label htmlFor="certificado">Archivo del Certificado (.p12)</Label>
                                    <div className="relative">
                                        <Input
                                            id="certificado"
                                            type="file"
                                            accept=".p12,.pfx"
                                            onChange={handleFileChange}
                                            className="cursor-pointer"
                                        />
                                    </div>
                                    {selectedFile && (
                                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                                            <FileKey className="h-4 w-4" />
                                            {selectedFile.name}
                                        </p>
                                    )}
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="password">Contraseña del Certificado</Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Ingrese la contraseña"
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                                
                                <DialogFooter className="gap-2 sm:gap-0">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsUploadOpen(false)}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button 
                                        type="submit" 
                                        disabled={isUploading || !selectedFile || !password}
                                        className="bg-primary hover:bg-primary-hover"
                                    >
                                        {isUploading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Subiendo...
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="h-4 w-4 mr-2" />
                                                Subir Certificado
                                            </>
                                        )}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Certificados</p>
                                <p className="text-2xl font-bold text-foreground">{certificados.length}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-primary/10">
                                <Shield className="h-6 w-6 text-primary" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Activos</p>
                                <p className="text-2xl font-bold text-success">
                                    {certificados.filter(c => c.esActivo && c.diasRestantes > 30).length}
                                </p>
                            </div>
                            <div className="p-3 rounded-xl bg-success/10">
                                <CheckCircle2 className="h-6 w-6 text-success" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Por Expirar</p>
                                <p className="text-2xl font-bold text-warning">
                                    {certificados.filter(c => c.esActivo && c.diasRestantes <= 90).length}
                                </p>
                            </div>
                            <div className="p-3 rounded-xl bg-warning/10">
                                <AlertTriangle className="h-6 w-6 text-warning" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Certificates Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Certificados Registrados</CardTitle>
                    <CardDescription>
                        Lista de certificados de firma digital para facturación electrónica
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <span className="ml-2 text-muted-foreground">Cargando certificados...</span>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
                            <p className="text-destructive font-medium">{error}</p>
                            <Button 
                                variant="outline" 
                                onClick={fetchCertificados}
                                className="mt-4"
                            >
                                Reintentar
                            </Button>
                        </div>
                    ) : certificados.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Shield className="h-16 w-16 text-muted-foreground/50 mb-4" />
                            <h3 className="text-lg font-semibold text-foreground mb-2">
                                No hay certificados registrados
                            </h3>
                            <p className="text-muted-foreground mb-4 max-w-md">
                                Sube tu certificado digital .p12 para comenzar a firmar facturas electrónicas
                            </p>
                            <Button 
                                onClick={() => setIsUploadOpen(true)}
                                className="bg-primary hover:bg-primary-hover"
                            >
                                <Upload className="h-4 w-4 mr-2" />
                                Subir Primer Certificado
                            </Button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Titular</TableHead>
                                        <TableHead>Emisor</TableHead>
                                        <TableHead>Emisión</TableHead>
                                        <TableHead>Expiración</TableHead>
                                        <TableHead>Días Restantes</TableHead>
                                        <TableHead>Estado</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {certificados.map((cert) => {
                                        const subject = parseSubject(cert.subject);
                                        const emisor = parseSubject(cert.emisor);
                                        
                                        return (
                                            <TableRow key={cert.id}>
                                                <TableCell>
                                                    <div className="flex items-start gap-3">
                                                        <div className="p-2 rounded-lg bg-primary/10">
                                                            <User className="h-4 w-4 text-primary" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-foreground">
                                                                {subject.cn}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {subject.serialNumber}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-start gap-3">
                                                        <div className="p-2 rounded-lg bg-secondary">
                                                            <Building2 className="h-4 w-4 text-muted-foreground" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-foreground text-sm">
                                                                {emisor.cn}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                                        {formatDate(cert.fechaEmision)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                                        {formatDate(cert.fechaExpiracion)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className={cn(
                                                        "flex items-center gap-2 font-semibold",
                                                        cert.diasRestantes <= 30 && "text-destructive",
                                                        cert.diasRestantes > 30 && cert.diasRestantes <= 90 && "text-warning",
                                                        cert.diasRestantes > 90 && "text-success"
                                                    )}>
                                                        <Clock className="h-4 w-4" />
                                                        {cert.diasRestantes} días
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {getStatusBadge(cert)}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default Certificados;
