
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Filter, Calendar, Users, Award } from 'lucide-react';
import ConferenceCard from '@/components/ConferenceCard';
import { Conference, VenueEnum } from '@/types/conference';

// Données d'exemple - à remplacer par des appels API
const mockConferences: Conference[] = [
  {
    id: 1,
    title: "Conférence Internationale sur l'Intelligence Artificielle",
    description: "Une conférence prestigieuse rassemblant les meilleurs chercheurs en IA du monde entier. Cette édition met l'accent sur l'éthique de l'IA et les applications pratiques.",
    deadline: "2024-03-15T23:59:59Z",
    created_at: "2024-01-01T00:00:00Z",
    organizer_id: 1,
    important_date: "2024-05-20T09:00:00Z",
    organizer: {
      id: 1,
      first_name: "Marie",
      last_name: "Dubois",
      email: "marie.dubois@universite.fr",
      affiliation: "Université de Paris"
    },
    thematic: ["Intelligence Artificielle", "Machine Learning", "Éthique IA"],
    fees: 150,
    venue: VenueEnum.ONLINE,
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=200&fit=crop"
  },
  {
    id: 2,
    title: "Symposium International de Cybersécurité",
    description: "Explorez les dernières innovations en matière de sécurité informatique, de cryptographie et de protection des données dans un monde numérique en évolution.",
    deadline: "2024-04-10T23:59:59Z",
    created_at: "2024-01-15T00:00:00Z",
    organizer_id: 2,
    important_date: "2024-06-15T09:00:00Z",
    organizer: {
      id: 2,
      first_name: "Jean",
      last_name: "Martin",
      email: "jean.martin@tech.fr",
      affiliation: "École Polytechnique"
    },
    thematic: ["Cybersécurité", "Cryptographie", "Blockchain", "Sécurité des Données"],
    fees: 200,
    venue: VenueEnum.IN_PERSON,
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=200&fit=crop"
  },
  {
    id: 3,
    title: "Conférence Européenne de Bioinformatique",
    description: "Découvrez les avancées révolutionnaires en bioinformatique, génomique computationnelle et médecine personnalisée.",
    deadline: "2024-03-30T23:59:59Z",
    created_at: "2024-02-01T00:00:00Z",
    organizer_id: 3,
    important_date: "2024-07-10T09:00:00Z",
    organizer: {
      id: 3,
      first_name: "Sophie",
      last_name: "Laurent",
      email: "sophie.laurent@bio.fr",
      affiliation: "Institut Pasteur"
    },
    thematic: ["Bioinformatique", "Génomique", "Médecine Personnalisée", "Big Data"],
    fees: 180,
    venue: VenueEnum.ONLINE,
    image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=200&fit=crop"
  },
  {
    id: 4,
    title: "Forum International des Technologies Vertes",
    description: "Conférence dédiée aux technologies durables, énergies renouvelables et solutions innovantes pour l'environnement.",
    deadline: "2024-04-25T23:59:59Z",
    created_at: "2024-02-10T00:00:00Z",
    organizer_id: 4,
    important_date: "2024-08-05T09:00:00Z",
    organizer: {
      id: 4,
      first_name: "Pierre",
      last_name: "Verdier",
      email: "pierre.verdier@env.fr",
      affiliation: "ADEME"
    },
    thematic: ["Technologies Vertes", "Énergies Renouvelables", "Développement Durable"],
    fees: 120,
    venue: VenueEnum.IN_PERSON,
    image: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=400&h=200&fit=crop"
  }
];

const Index: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedThematic, setSelectedThematic] = useState<string | null>(null);
  const [conferences] = useState(mockConferences);

  // Extraction des thématiques uniques
  const allThematics = Array.from(
    new Set(conferences.flatMap(conf => conf.thematic))
  );

  // Filtrage des conférences
  const filteredConferences = conferences.filter(conference => {
    const matchesSearch = conference.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conference.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conference.organizer.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conference.organizer.last_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesThematic = !selectedThematic || 
                           conference.thematic.includes(selectedThematic);
    
    return matchesSearch && matchesThematic;
  });

  const handleViewDetails = (conferenceId: number) => {
    navigate(`/conference/${conferenceId}`);
  };

  const handleUserProfile = () => {
    navigate('/profile');
  };

  const handleReviewerDashboard = () => {
    navigate('/reviewer');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ConférenceHub</h1>
              <p className="text-sm text-muted-foreground">Plateforme de conférences virtuelles</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleReviewerDashboard}>
                <Award size={16} className="mr-2" />
                Reviewer
              </Button>
              <Button variant="outline" onClick={handleUserProfile}>
                <Users size={16} className="mr-2" />
                Mon Profil
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Section Hero */}
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Découvrez les Conférences d'Excellence
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Participez aux événements scientifiques les plus prestigieux, soumettez vos recherches 
            et collaborez avec des experts du monde entier.
          </p>
        </div>

        {/* Statistiques rapides */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="text-center p-6">
            <CardContent className="p-0">
              <Calendar className="mx-auto h-10 w-10 text-blue-600 mb-3" />
              <div className="text-2xl font-bold text-gray-900">{conferences.length}</div>
              <div className="text-muted-foreground">Conférences Actives</div>
            </CardContent>
          </Card>
          <Card className="text-center p-6">
            <CardContent className="p-0">
              <Users className="mx-auto h-10 w-10 text-green-600 mb-3" />
              <div className="text-2xl font-bold text-gray-900">150+</div>
              <div className="text-muted-foreground">Chercheurs Inscrits</div>
            </CardContent>
          </Card>
          <Card className="text-center p-6">
            <CardContent className="p-0">
              <Award className="mx-auto h-10 w-10 text-purple-600 mb-3" />
              <div className="text-2xl font-bold text-gray-900">45</div>
              <div className="text-muted-foreground">Papers Acceptés</div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres et recherche */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
                <Input
                  placeholder="Rechercher une conférence, un organisateur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Thématiques:</span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-4">
            <Button
              variant={selectedThematic === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedThematic(null)}
            >
              Toutes
            </Button>
            {allThematics.map((thematic) => (
              <Button
                key={thematic}
                variant={selectedThematic === thematic ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedThematic(thematic)}
              >
                {thematic}
              </Button>
            ))}
          </div>
        </div>

        {/* Résultats */}
        <div className="mb-4">
          <p className="text-muted-foreground">
            {filteredConferences.length} conférence{filteredConferences.length > 1 ? 's' : ''} trouvée{filteredConferences.length > 1 ? 's' : ''}
            {selectedThematic && ` pour "${selectedThematic}"`}
          </p>
        </div>

        {/* Liste des conférences en horizontal */}
        <div className="space-y-6">
          {filteredConferences.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune conférence trouvée</h3>
              <p className="text-muted-foreground">
                Essayez de modifier vos critères de recherche ou vos filtres.
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {filteredConferences.map((conference) => (
                <div key={conference.id} className="w-full">
                  <ConferenceCard
                    conference={conference}
                    onViewDetails={handleViewDetails}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
