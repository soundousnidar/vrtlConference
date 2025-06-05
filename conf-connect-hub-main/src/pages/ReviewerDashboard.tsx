
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Star, FileText, Clock, CheckCircle } from 'lucide-react';
import { Abstract, AbstractStatus } from '@/types/conference';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';

// Données d'exemple
const mockAbstractsToReview: Abstract[] = [
  {
    id: 1,
    title: "Intelligence Artificielle et Éthique en Médecine",
    summary: "Cette recherche examine les implications éthiques de l'utilisation de l'IA dans le diagnostic médical. Nous proposons un cadre pour évaluer les biais algorithmiques et garantir une prise de décision équitable.",
    keywords: "IA, éthique, médecine, diagnostic, biais",
    submitted_at: "2024-02-10T14:30:00Z",
    updated_at: "2024-02-10T14:30:00Z",
    status: AbstractStatus.PENDING,
    user_id: 2,
    conference_id: 1,
    user: {
      id: 2,
      first_name: "Alice",
      last_name: "Martin",
      email: "alice.martin@univ.fr",
      affiliation: "Université de Marseille"
    },
    conference: {
      id: 1,
      title: "Conférence IA & Société 2024"
    } as any,
    authors: [
      {
        id: 1,
        first_name: "Alice",
        last_name: "Martin",
        email: "alice.martin@univ.fr",
        affiliation: "Université de Marseille"
      }
    ]
  },
  {
    id: 2,
    title: "Apprentissage Automatique pour la Détection de Fraude",
    summary: "Nous présentons une nouvelle approche basée sur l'apprentissage profond pour détecter les transactions frauduleuses en temps réel. Notre modèle atteint une précision de 98.5% avec un taux de faux positifs très faible.",
    keywords: "machine learning, fraude, détection, deep learning",
    submitted_at: "2024-02-12T09:15:00Z",
    updated_at: "2024-02-12T09:15:00Z",
    status: AbstractStatus.PENDING,
    user_id: 3,
    conference_id: 1,
    user: {
      id: 3,
      first_name: "Pierre",
      last_name: "Durand",
      email: "pierre.durand@tech.com",
      affiliation: "TechCorp Inc."
    },
    conference: {
      id: 1,
      title: "Conférence IA & Société 2024"
    } as any,
    authors: [
      {
        id: 2,
        first_name: "Pierre",
        last_name: "Durand",
        email: "pierre.durand@tech.com",
        affiliation: "TechCorp Inc."
      }
    ]
  }
];

interface ReviewModalProps {
  abstract: Abstract | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ abstract, isOpen, onClose, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleStarClick = (value: number) => {
    setRating(value);
  };

  const handleSubmit = () => {
    if (rating === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez attribuer une note.",
        variant: "destructive"
      });
      return;
    }

    if (!comment.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez ajouter un commentaire.",
        variant: "destructive"
      });
      return;
    }

    onSubmit(rating, comment);
    setRating(0);
    setComment('');
    onClose();
  };

  if (!abstract) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Révision de l'Abstract</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations de l'abstract */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">{abstract.title}</h3>
              <p className="text-sm text-muted-foreground">
                Par {abstract.user.first_name} {abstract.user.last_name} • {abstract.user.affiliation}
              </p>
            </div>

            <div>
              <Label className="text-base font-medium">Résumé</Label>
              <p className="text-sm mt-2 bg-gray-50 p-4 rounded-lg">
                {abstract.summary}
              </p>
            </div>

            <div>
              <Label className="text-base font-medium">Mots-clés</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {abstract.keywords.split(', ').map((keyword, index) => (
                  <Badge key={index} variant="outline">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-base font-medium">Auteurs</Label>
              <div className="mt-2 space-y-2">
                {abstract.authors.map((author, index) => (
                  <div key={author.id} className="text-sm">
                    {index + 1}. {author.first_name} {author.last_name}
                    {author.affiliation && ` - ${author.affiliation}`}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Formulaire de révision */}
          <div className="space-y-4 border-t pt-6">
            <div>
              <Label className="text-base font-medium">Évaluation *</Label>
              <div className="flex items-center gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleStarClick(value)}
                    onMouseEnter={() => setHoveredRating(value)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="text-2xl hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        value <= (hoveredRating || rating)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm text-muted-foreground">
                  {rating > 0 && `${rating}/5`}
                </span>
              </div>
            </div>

            <div>
              <Label htmlFor="comment" className="text-base font-medium">
                Commentaires et suggestions *
              </Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Fournissez des commentaires constructifs sur l'abstract..."
                rows={5}
                className="mt-2"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSubmit}>
            Soumettre la révision
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const ReviewerDashboard: React.FC = () => {
  const [selectedAbstract, setSelectedAbstract] = useState<Abstract | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [abstracts, setAbstracts] = useState(mockAbstractsToReview);

  const handleReviewClick = (abstract: Abstract) => {
    setSelectedAbstract(abstract);
    setIsReviewModalOpen(true);
  };

  const handleReviewSubmit = (rating: number, comment: string) => {
    if (!selectedAbstract) return;

    console.log('Révision soumise:', {
      abstractId: selectedAbstract.id,
      rating,
      comment
    });

    // Mettre à jour le statut de l'abstract (simulation)
    setAbstracts(prev => prev.filter(a => a.id !== selectedAbstract.id));

    toast({
      title: "Révision soumise",
      description: "Votre révision a été enregistrée avec succès."
    });
  };

  const pendingCount = abstracts.filter(a => a.status === AbstractStatus.PENDING).length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Tableau de Bord Reviewer</h1>
          <p className="text-muted-foreground">
            Gérez vos révisions d'abstracts pour les conférences
          </p>
        </div>

        {/* Statistiques */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="mx-auto h-8 w-8 text-orange-600 mb-2" />
              <div className="text-2xl font-bold">{pendingCount}</div>
              <div className="text-sm text-muted-foreground">En attente de révision</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle className="mx-auto h-8 w-8 text-green-600 mb-2" />
              <div className="text-2xl font-bold">12</div>
              <div className="text-sm text-muted-foreground">Révisions complétées</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <FileText className="mx-auto h-8 w-8 text-blue-600 mb-2" />
              <div className="text-2xl font-bold">3</div>
              <div className="text-sm text-muted-foreground">Conférences actives</div>
            </CardContent>
          </Card>
        </div>

        {/* Liste des abstracts à réviser */}
        <Card>
          <CardHeader>
            <CardTitle>Abstracts à Réviser</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {abstracts.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-muted-foreground">Aucun abstract en attente de révision</p>
              </div>
            ) : (
              abstracts.map((abstract) => (
                <div key={abstract.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{abstract.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {abstract.conference.title}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>
                          Par {abstract.user.first_name} {abstract.user.last_name}
                        </span>
                        <span>
                          Soumis le {format(new Date(abstract.submitted_at), 'dd MMM yyyy', { locale: fr })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{abstract.status === AbstractStatus.PENDING ? 'En attente' : abstract.status}</Badge>
                      <Button 
                        onClick={() => handleReviewClick(abstract)}
                        size="sm"
                      >
                        Réviser
                      </Button>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {abstract.summary}
                  </p>
                  
                  <div className="flex flex-wrap gap-1">
                    {abstract.keywords.split(', ').slice(0, 4).map((keyword, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de révision */}
      <ReviewModal
        abstract={selectedAbstract}
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        onSubmit={handleReviewSubmit}
      />
    </div>
  );
};

export default ReviewerDashboard;
