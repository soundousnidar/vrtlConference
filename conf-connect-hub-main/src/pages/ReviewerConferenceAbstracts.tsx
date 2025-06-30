import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import api from '@/lib/api';
import reviewerService from '@/services/reviewerService';

interface Author {
  first_name: string;
  last_name: string;
  email?: string;
  affiliation?: string;
}

interface Reviewer {
  id: number;
  fullname: string;
  email: string;
}

interface Abstract {
  id: number;
  title: string;
  summary: string;
  keywords: string;
  authors: Author[];
  submitted_at: string;
  status?: string;
  assigned_reviewers?: Reviewer[];
  file_uploaded?: boolean;
}

const ReviewerConferenceAbstracts: React.FC = () => {
  const { conferenceId } = useParams<{ conferenceId: string }>();
  const [abstracts, setAbstracts] = useState<Abstract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [assigning, setAssigning] = useState<{[abstractId: number]: boolean}>({});
  const [selectedReviewer, setSelectedReviewer] = useState<{[abstractId: number]: number | ''}>({});
  const [reviewStates, setReviewStates] = useState<{[abstractId: number]: {comment: string, decision: 'ACCEPTED' | 'REJECTED' | '', submitted: boolean, error?: string}}>( {} );
  const [showReviewForm, setShowReviewForm] = useState<{[abstractId: number]: boolean}>({});
  const [reviewFiles, setReviewFiles] = useState<{[abstractId: number]: File | null}>({});
  const [myReviews, setMyReviews] = useState<{[abstractId: number]: any}>({});
  const navigate = useNavigate();

  const fetchAbstracts = async () => {
    if (!conferenceId) return;
    setLoading(true);
    try {
      // First, try fetching as a reviewer (assigned abstracts)
      const response = await api.get(`/reviewers/${conferenceId}/abstracts`);
      setAbstracts(response.data);
      setIsOrganizer(false);
    } catch (reviewerError) {
      try {
        // If that fails, try fetching as an organizer (all abstracts)
        const response = await api.get(`/abstracts/organizer/${conferenceId}/abstracts`);
        setAbstracts(response.data);
        setIsOrganizer(true);
      } catch (organizerError) {
        setError("Impossible de charger les abstracts ou vous n'avez pas accès.");
        setIsOrganizer(false);
      }
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchAbstracts();
  }, [conferenceId]);

  // Fetch reviewers for the conference (for assignment dropdown)
  useEffect(() => {
    const fetchReviewers = async () => {
      if (!conferenceId || !isOrganizer) return;
      try {
        const response = await api.get(`/conferences/${conferenceId}/reviewers`);
        setReviewers(response.data);
      } catch {
        setReviewers([]);
      }
    };
    fetchReviewers();
  }, [conferenceId, isOrganizer]);

  // Remove reviewer dropdown and assignment logic
  // Add assign and refuse handlers
  const handleAssign = async (abstractId: number) => {
    setAssigning(prev => ({ ...prev, [abstractId]: true }));
    try {
      await api.post(`/abstracts/${abstractId}/assign`);
      // Refresh abstracts list after assignment
      await fetchAbstracts();
    } catch (err) {
      alert("Erreur lors de l'assignation de l'abstract.");
    } finally {
      setAssigning(prev => ({ ...prev, [abstractId]: false }));
    }
  };

  const handleRefuse = async (abstractId: number) => {
    setAssigning(prev => ({ ...prev, [abstractId]: true }));
    try {
      await api.post(`/abstracts/${abstractId}/refuse`);
      // Refresh abstracts list after refusal
      await fetchAbstracts();
    } catch (err) {
      alert("Erreur lors du refus de l'abstract.");
    } finally {
      setAssigning(prev => ({ ...prev, [abstractId]: false }));
    }
  };

  const handleDownload = async (abstractId: number) => {
    const token = localStorage.getItem('token');
    try {
      const response = await api.get(`/abstracts/abstracts/${abstractId}/download`, {
        responseType: 'blob',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // Get filename from content-disposition
      const disposition = response.headers['content-disposition'];
      let filename = 'document';
      if (disposition) {
        const match = disposition.match(/filename="(.+)"/);
        if (match) filename = match[1];
      }
      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" })
      );
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Erreur lors du téléchargement du fichier.');
    }
  };

  const handleReviewChange = (abstractId: number, field: 'comment' | 'decision', value: string) => {
    setReviewStates(prev => ({
      ...prev,
      [abstractId]: {
        ...prev[abstractId],
        [field]: value
      }
    }));
  };

  const handleReviewSubmit = async (abstractId: number) => {
    const state = reviewStates[abstractId];
    if (!state || !state.comment || !state.decision) {
      setReviewStates(prev => ({
        ...prev,
        [abstractId]: {
          ...prev[abstractId],
          error: "Merci de remplir le commentaire et de choisir une décision."
        }
      }));
      return;
    }
    try {
      if (myReviews[abstractId]) {
        // Modification : PUT
        await reviewerService.updateReview(myReviews[abstractId].id, state.comment, state.decision as 'ACCEPTED' | 'REJECTED');
      } else {
        // Création : POST
        await reviewerService.submitReview(abstractId, state.comment, state.decision as 'ACCEPTED' | 'REJECTED');
      }
      setReviewStates(prev => ({
        ...prev,
        [abstractId]: {
          ...prev[abstractId],
          submitted: true,
          error: undefined
        }
      }));
      // Refresh myReviews
      const res = await reviewerService.getMyReviewForAbstract(abstractId);
      setMyReviews(prev => ({ ...prev, [abstractId]: res.review }));
      setShowReviewForm(prev => ({ ...prev, [abstractId]: false }));
    } catch (err) {
      setReviewStates(prev => ({
        ...prev,
        [abstractId]: {
          ...prev[abstractId],
          error: "Erreur lors de la soumission de la review."
        }
      }));
    }
  };

  useEffect(() => {
    // Pour chaque abstract, récupère la review du reviewer courant
    const fetchMyReviews = async () => {
      const userStr = localStorage.getItem('user');
      if (!userStr) return;
      const user = JSON.parse(userStr);
      const reviews: {[abstractId: number]: any} = {};
      for (const abs of abstracts) {
        try {
          const res = await reviewerService.getMyReviewForAbstract(abs.id);
          if (res && res.review) {
            reviews[abs.id] = res.review;
          }
        } catch {}
      }
      setMyReviews(reviews);
    };
    if (abstracts.length > 0) fetchMyReviews();
  }, [abstracts]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <FileText className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold">Abstracts de la conférence</h1>
      </div>
      {loading ? (
        <p>Chargement...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : abstracts.length === 0 ? (
        <p>Aucun abstract pour cette conférence.</p>
      ) : (
        <div className="grid gap-6">
          {abstracts.map((abs) => (
            <Card key={abs.id}>
              <CardHeader>
                <CardTitle>{abs.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-2 text-sm text-muted-foreground">Soumis le {new Date(abs.submitted_at).toLocaleDateString()}</div>
                <div className="mb-2">{abs.summary}</div>
                <div className="mb-2 flex flex-wrap gap-2">
                  {abs.keywords.split(',').map((kw, i) => (
                    <Badge key={i} variant="outline">{kw.trim()}</Badge>
                  ))}
                </div>
                <div className="mb-2 text-xs text-muted-foreground">
                  Auteurs : {abs.authors.map(a => `${a.first_name} ${a.last_name}`).join(', ')}
                </div>
                {abs.status && <div className="text-xs">Statut : {abs.status}</div>}
                {/* Download button if file is uploaded */}
                {abs.file_uploaded && (
                  <button
                    className="flex items-center gap-2 mt-2 px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                    onClick={() => handleDownload(abs.id)}
                  >
                    <FileText className="w-4 h-4" /> Télécharger le fichier
                  </button>
                )}
                {/* Assigned reviewers (to be displayed) */}
                {abs.assigned_reviewers && abs.assigned_reviewers.length > 0 && (
                  <div className="mt-2 text-xs">
                    Reviewers assignés : {abs.assigned_reviewers.map(r => r.fullname).join(', ')}
                  </div>
                )}
                {/* Assignment form for organizer */}
                {isOrganizer && (
                  <div className="mt-4 flex items-center gap-2">
                    {abs.status === 'assigned' ? (
                      <button
                        className="bg-green-600 text-white px-3 py-1 rounded"
                        onClick={() => navigate(`/abstracts/${abs.id}/reviews`)}
                      >
                        Voir les reviews
                      </button>
                    ) : (
                      <>
                        <button
                          className="bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-50"
                          disabled={assigning[abs.id]}
                          onClick={() => handleAssign(abs.id)}
                        >
                          {assigning[abs.id] ? 'Assignation...' : 'Assigner'}
                        </button>
                        <button
                          className="bg-red-600 text-white px-3 py-1 rounded disabled:opacity-50"
                          disabled={assigning[abs.id]}
                          onClick={() => handleRefuse(abs.id)}
                        >
                          {assigning[abs.id] ? 'Refus...' : 'Refuser'}
                        </button>
                      </>
                    )}
                  </div>
                )}
                {!isOrganizer && (
                  <div className="mt-4 border-t pt-4">
                    {myReviews[abs.id] ? (
                      !showReviewForm[abs.id] ? (
                        <>
                          <div className="mb-2">
                            <span className="font-semibold">Votre review :</span>
                            <div className="text-sm mt-1">Commentaire : {myReviews[abs.id].comment}</div>
                            <div className="text-sm">Décision : {myReviews[abs.id].decision}</div>
                          </div>
                          <button
                            className="bg-yellow-500 text-white px-3 py-1 rounded"
                            onClick={() => setShowReviewForm(prev => ({ ...prev, [abs.id]: true }))}
                          >
                            Modifier ma review
                          </button>
                        </>
                      ) : (
                        <form onSubmit={e => { e.preventDefault(); handleReviewSubmit(abs.id); }} className="space-y-2">
                          <div>
                            <label className="block text-sm font-medium mb-1">Commentaire</label>
                            <textarea
                              className="w-full border rounded px-2 py-1"
                              rows={3}
                              value={reviewStates[abs.id]?.comment || myReviews[abs.id].comment || ''}
                              onChange={e => handleReviewChange(abs.id, 'comment', e.target.value)}
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Décision</label>
                            <select
                              className="w-full border rounded px-2 py-1"
                              value={reviewStates[abs.id]?.decision || myReviews[abs.id].decision || ''}
                              onChange={e => handleReviewChange(abs.id, 'decision', e.target.value)}
                              required
                            >
                              <option value="">Choisir...</option>
                              <option value="ACCEPTED">Accepter</option>
                              <option value="REJECTED">Rejeter</option>
                            </select>
                          </div>
                          {reviewStates[abs.id]?.error && <div className="text-red-600 text-sm">{reviewStates[abs.id].error}</div>}
                          <button
                            type="submit"
                            className="bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-50"
                            disabled={reviewStates[abs.id]?.submitted}
                          >
                            Enregistrer la modification
                          </button>
                          <button
                            type="button"
                            className="ml-2 bg-gray-300 text-gray-800 px-3 py-1 rounded"
                            onClick={() => setShowReviewForm(prev => ({ ...prev, [abs.id]: false }))}
                          >
                            Annuler
                          </button>
                        </form>
                      )
                    ) : (
                      !showReviewForm[abs.id] ? (
                        <button
                          className="bg-blue-600 text-white px-3 py-1 rounded"
                          onClick={() => setShowReviewForm(prev => ({ ...prev, [abs.id]: true }))}
                        >
                          Ajouter une review
                        </button>
                      ) : (
                        <form onSubmit={e => { e.preventDefault(); handleReviewSubmit(abs.id); }} className="space-y-2">
                          <div>
                            <label className="block text-sm font-medium mb-1">Commentaire</label>
                            <textarea
                              className="w-full border rounded px-2 py-1"
                              rows={3}
                              value={reviewStates[abs.id]?.comment || ''}
                              onChange={e => handleReviewChange(abs.id, 'comment', e.target.value)}
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Décision</label>
                            <select
                              className="w-full border rounded px-2 py-1"
                              value={reviewStates[abs.id]?.decision || ''}
                              onChange={e => handleReviewChange(abs.id, 'decision', e.target.value)}
                              required
                            >
                              <option value="">Choisir...</option>
                              <option value="ACCEPTED">Accepter</option>
                              <option value="REJECTED">Rejeter</option>
                            </select>
                          </div>
                          {reviewStates[abs.id]?.error && <div className="text-red-600 text-sm">{reviewStates[abs.id].error}</div>}
                          <button
                            type="submit"
                            className="bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-50"
                            disabled={reviewStates[abs.id]?.submitted}
                          >
                            Soumettre la review
                          </button>
                          <button
                            type="button"
                            className="ml-2 bg-gray-300 text-gray-800 px-3 py-1 rounded"
                            onClick={() => setShowReviewForm(prev => ({ ...prev, [abs.id]: false }))}
                          >
                            Annuler
                          </button>
                        </form>
                      )
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewerConferenceAbstracts; 