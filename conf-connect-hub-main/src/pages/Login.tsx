import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Calendar, User, Lock, Mail, ArrowLeft, Camera, CameraOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(location.pathname === '/register');
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      const imageUrl = URL.createObjectURL(file);
      setPreviewUrl(imageUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
  
    // Préparer les données à envoyer
    const formData = new FormData();
    if (isRegister) {
      formData.append("fullname", name);
      formData.append("email", email);
      formData.append("password", password);
      formData.append("confirm_password", confirmPassword);
      if (profileImage) {
        formData.append("photo", profileImage);
      }
    } else {
      formData.append("email", email);
      formData.append("password", password);
    }
  
    try {
      console.log('Sending auth request...'); // Debug log
      const response = await fetch(
        isRegister ? "http://localhost:8000/auth/register" : "http://localhost:8000/auth/login",
        {
          method: "POST",
          body: formData,
        }
      );
  
      const data = await response.json();
      console.log('Auth response:', data); // Debug log
      
      if (!response.ok) {
        throw new Error(data.detail || "Une erreur est survenue");
      }
  
      if (data.access_token) {
        // Store the token with Bearer prefix if it's not already there
        const token = data.access_token.startsWith('Bearer ') 
          ? data.access_token 
          : `Bearer ${data.access_token}`;
        
        console.log('Storing token:', token); // Debug log
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(data.user));
        
        toast({
          title: isRegister ? "Compte créé avec succès" : "Connexion réussie",
          description: isRegister 
            ? "Votre compte a été créé et vous êtes maintenant connecté."
            : "Vous êtes maintenant connecté.",
        });

        // Redirect to the intended page or home
        const intendedPath = location.state?.from || '/';
        navigate(intendedPath, { replace: true });
      }
    } catch (error: any) {
      console.error("Erreur d'authentification:", error); // Debug log
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la connexion/inscription.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegister(!isRegister);
    // Reset form when switching modes
    setEmail("");
    setPassword("");
    setName("");
    setConfirmPassword("");
    setProfileImage(null);
    setPreviewUrl(null);
    // Update URL without causing a navigation
    navigate(isRegister ? '/login' : '/register', { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow py-4">
        <div className="container mx-auto px-4 max-w-md">
          {/* Back to home link */}
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" />
            <span>Retour à l'accueil</span>
          </Link>
          
          {/* Auth card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="p-4">
              {/* Logo */}
              <div className="flex justify-center mb-4">
                <Link to="/" className="flex items-center gap-2 text-lg font-bold">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-md"></div>
                    <Calendar className="h-6 w-6 text-primary relative z-10" />
                  </div>
                  <span>VirtualConf</span>
                </Link>
              </div>
              
              {/* Title */}
              <h1 className="text-xl font-bold mb-4 text-center">
                {isRegister ? "Créer un compte" : "Connexion"}
              </h1>
              
              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {isRegister && (
                  <>
                    <div className="flex flex-col items-center space-y-3 mb-4">
                      <Avatar className="w-20 h-20">
                        {previewUrl ? (
                          <AvatarImage src={previewUrl} alt="Profile preview" />
                        ) : (
                          <AvatarFallback className="bg-muted">
                            <User className="w-10 h-10 text-muted-foreground" />
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex items-center gap-3">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                          id="profile-image"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById("profile-image")?.click()}
                          className="flex items-center gap-2"
                        >
                          {previewUrl ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
                          <span>{previewUrl ? "Changer" : "Ajouter"}</span>
                        </Button>
                        {previewUrl && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setProfileImage(null);
                              setPreviewUrl(null);
                            }}
                            className="text-destructive"
                          >
                            Supprimer
                          </Button>
                        )}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="name" className="block text-xs font-medium mb-1">
                        Nom complet
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-muted-foreground">
                          <User className="h-3 w-3" />
                        </div>
                        <input
                          id="name"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="block w-full pl-8 pr-2 py-1.5 border border-gray-200 rounded-md focus:ring-1 focus:ring-primary/20 focus:outline-none text-sm"
                          placeholder="Jean Dupont"
                          required
                        />
                      </div>
                    </div>
                  </>
                )}
                
                <div>
                  <label htmlFor="email" className="block text-xs font-medium mb-1">
                    Adresse email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-muted-foreground">
                      <Mail className="h-3 w-3" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-8 pr-2 py-1.5 border border-gray-200 rounded-md focus:ring-1 focus:ring-primary/20 focus:outline-none text-sm"
                      placeholder="vous@exemple.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-xs font-medium mb-1">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-muted-foreground">
                      <Lock className="h-3 w-3" />
                    </div>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-8 pr-2 py-1.5 border border-gray-200 rounded-md focus:ring-1 focus:ring-primary/20 focus:outline-none text-sm"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                {isRegister && (
                  <div>
                    <label htmlFor="confirmPassword" className="block text-xs font-medium mb-1">
                      Confirmer le mot de passe
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-muted-foreground">
                        <Lock className="h-3 w-3" />
                      </div>
                      <input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="block w-full pl-8 pr-2 py-1.5 border border-gray-200 rounded-md focus:ring-1 focus:ring-primary/20 focus:outline-none text-sm"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>
                )}

                <Button type="submit" className="w-full text-sm h-8" disabled={isLoading}>
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin">⌛</span>
                      {isRegister ? "Création..." : "Connexion..."}
                    </span>
                  ) : (
                    isRegister ? "Créer un compte" : "Se connecter"
                  )}
                </Button>

                <div className="text-center text-xs">
                  <button
                    type="button"
                    onClick={toggleMode}
                    className="text-primary hover:underline"
                  >
                    {isRegister
                      ? "Déjà un compte ? Se connecter"
                      : "Pas de compte ? S'inscrire"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer className="mt-auto py-4" />
    </div>
  );
};

export default Login;
