import React, { useEffect, useState } from "react";
import axios from "axios";
import { Award, Download, Loader2, AlertTriangle } from "lucide-react";

interface Certificate {
  id: number;
  conference_id: number;
  user_id: number;
  cert_type: string;
  issued_at: string;
}

const Certificates: React.FC = () => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const res = await axios.get("http://localhost:8000/certificates/my-certificates", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setCertificates(res.data);
      } catch (err) {
        setError("Impossible de charger vos certificats.");
        console.error("Erreur:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCertificates();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Award className="w-8 h-8 text-primary" />
        <h1 className="text-4xl font-bold">Mes Certificats</h1>
      </div>

      {loading ? (
        <div className="flex justify-center items-center">
          <Loader2 className="animate-spin w-6 h-6 text-gray-500" />
          <span className="ml-2 text-gray-500">Chargement...</span>
        </div>
      ) : error ? (
        <div className="text-red-600 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          {error}
        </div>
      ) : certificates.length === 0 ? (
        <p className="text-gray-500">
          Aucun certificat disponible pour le moment. Participez à des conférences pour obtenir vos certificats !
        </p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="p-6 border rounded-lg shadow bg-white dark:bg-gray-900"
            >
              <h3 className="text-lg font-semibold capitalize">{cert.cert_type}</h3>
              <p className="text-sm text-gray-500">Délivré le : {new Date(cert.issued_at).toLocaleDateString()}</p>

              <a
                href={`http://localhost:8000/certificates/generate/${cert.conference_id}/${cert.user_id}/${cert.cert_type}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <Download className="h-4 w-4" />
                Télécharger
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Certificates;
