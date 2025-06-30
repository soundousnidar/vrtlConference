import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Abstract, AbstractStatus } from '@/types/conference';
import { abstractService } from '@/services/abstractService';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const Abstracts = () => {
  const navigate = useNavigate();
  const [abstracts, setAbstracts] = useState<Abstract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAbstracts = async () => {
      // Check if user is logged in
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return; // Don't fetch abstracts if not logged in
      }
      
      try {
        const data = await abstractService.getMyAbstracts();
        setAbstracts(data);
      } catch (error: any) {
        console.error('Error fetching abstracts:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger vos abstracts",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAbstracts();
  }, []);

  const getStatusBadge = (status: AbstractStatus | string | undefined) => {
    const statusConfig = {
      [AbstractStatus.PENDING]: { label: "En attente", variant: "outline" as const },
      [AbstractStatus.ACCEPTED]: { label: "Accepté", variant: "default" as const },
      [AbstractStatus.REJECTED]: { label: "Rejeté", variant: "destructive" as const }
    };
    const config = status ? statusConfig[status as AbstractStatus] : undefined;
    if (!config) {
      return <Badge variant="secondary">Inconnu</Badge>;
    }
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleSubmitNewAbstract = () => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour soumettre un abstract",
        variant: "destructive",
      });
      navigate('/login', { state: { from: '/abstracts' } });
      return;
    }
    
    // Navigate to conferences page where they can select a conference to submit to
    navigate('/conferences');
    toast({
      title: "Soumission d'Abstract",
      description: "Veuillez sélectionner une conférence pour soumettre votre abstract",
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de vos abstracts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <FileText className="w-8 h-8 text-primary" />
          <h1 className="text-4xl font-bold">Mes Abstracts</h1>
        </div>
        <Button onClick={handleSubmitNewAbstract} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Soumettre un Abstract
        </Button>
      </div>
      
      {abstracts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            {localStorage.getItem('token') ? (
              <>
                <h3 className="text-lg font-semibold mb-2">Aucun abstract soumis</h3>
                <p className="text-gray-600 mb-4">
                  Vous n'avez pas encore soumis d'abstract. Commencez par explorer les conférences disponibles.
                </p>
                <Button onClick={handleSubmitNewAbstract} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Soumettre mon premier Abstract
                </Button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold mb-2">Connectez-vous pour voir vos abstracts</h3>
                <p className="text-gray-600 mb-4">
                  Connectez-vous à votre compte pour soumettre et gérer vos abstracts.
                </p>
                <Button onClick={handleSubmitNewAbstract} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Soumettre un Abstract
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {abstracts.map((abstract) => (
            <Card key={abstract.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{abstract.title}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Soumis le {format(new Date(abstract.submitted_at), 'dd MMM yyyy', { locale: fr })}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{abstract.conference?.title || 'Conférence'}</span>
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(abstract.status)}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-3 line-clamp-3">{abstract.summary}</p>
                <div className="flex flex-wrap gap-2">
                  {abstract.keywords.split(',').map((keyword, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {keyword.trim()}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Abstracts; 