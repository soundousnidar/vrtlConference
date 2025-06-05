import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Lock, Camera, CameraOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";

const Register = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

    const formData = new FormData();
    formData.append("fullname", name);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("confirm_password", confirmPassword);
    if (profileImage) {
      formData.append("photo", profileImage);
    }

    try {
      const response = await fetch("http://localhost:8000/auth/register", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || "Une erreur est survenue");
      }

      if (data.access_token) {
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("user", JSON.stringify(data.user));
        
        toast({
          title: "Compte créé avec succès",
          description: "Votre compte a été créé et vous êtes maintenant connecté.",
        });

        navigate('/', { replace: true });
      }
    } catch (error: any) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de l'inscription.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
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
                    <User className="h-6 w-6 text-primary relative z-10" />
                  </div>
                  <span>VirtualConf</span>
                </Link>
              </div>
              
              {/* Title */}
              <h1 className="text-xl font-bold mb-4 text-center">
                Créer un compte
              </h1>
              
              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
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
                      <User className="h-4 w-4" />
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

                <div>
                  <label htmlFor="email" className="block text-xs font-medium mb-1">
                    Adresse email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-muted-foreground">
                      <Mail className="h-4 w-4" />
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
                      <Lock className="h-4 w-4" />
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

                <div>
                  <label htmlFor="confirmPassword" className="block text-xs font-medium mb-1">
                    Confirmer le mot de passe
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-muted-foreground">
                      <Lock className="h-4 w-4" />
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

                <Button type="submit" className="w-full text-sm h-8" disabled={isLoading}>
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin">⌛</span>
                      Création...
                    </span>
                  ) : (
                    "Créer un compte"
                  )}
                </Button>

                <div className="text-center text-xs">
                  <Link to="/login" className="text-primary hover:underline">
                    Déjà un compte ? Se connecter
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Register; 