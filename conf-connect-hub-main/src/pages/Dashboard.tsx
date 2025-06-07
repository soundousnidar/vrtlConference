import React, { useState, useEffect } from "react";
import InfoBox from "@/components/InfoBox";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import axios from "axios";
import { unparse } from "papaparse";
import autoTable from "jspdf-autotable";
import jsPDF from "jspdf";

const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  index,
}: any) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const Dashboard: React.FC = () => {
  const [abstracts, setAbstracts] = useState(0);
  const [reviewers, setReviewers] = useState(0);
  const [participants, setParticipants] = useState(0);
  const [oralAccepted, setOralAccepted] = useState(0);
  const [posterAccepted, setPosterAccepted] = useState(0);
  const [rejected, setRejected] = useState(0);
  const [sessionsTotal, setSessionsTotal] = useState(0);
  const [sessionsToday, setSessionsToday] = useState(0);
  const [certPart, setCertPart] = useState(0);
  const [certSpeaker, setCertSpeaker] = useState(0);
  const [certReviewer, setCertReviewer] = useState(0);
  const [deadline, setDeadline] = useState("2025-06-10");
  const [loading, setLoading] = useState(true);


  

useEffect(() => {
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token"); // 🔐 Récupère le token JWT

      const response = await axios.get("http://127.0.0.1:8000//stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("✅ Données reçues du backend:", response.data);

      setAbstracts(response.data.abstracts);
      setReviewers(response.data.reviewers);
      setParticipants(response.data.participants);
      setOralAccepted(response.data.oral_accepted);
      setPosterAccepted(response.data.poster_accepted);
      setRejected(response.data.rejected);
      setSessionsTotal(response.data.sessions_total);
      setSessionsToday(response.data.sessions_today);
      setCertPart(response.data.cert_participants);
      setCertSpeaker(response.data.cert_speakers);
      setCertReviewer(response.data.cert_reviewers);

      if (response.data.deadline) {
        setDeadline(response.data.deadline);
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        alert("⛔️ Session expirée ou non autorisée. Veuillez vous reconnecter.");
        window.location.href = "/login"; // ou utiliser `navigate()` si tu as React Router
      } else {
        console.error("❌ Erreur lors de la récupération des statistiques :", error);
      }
    } finally {
      setLoading(false);
    }
  };

  fetchStats();
}, []);





  const daysLeft = Math.ceil(
    (new Date(deadline).getTime() - new Date().getTime()) / (1000 * 3600 * 24)
  );
  const totalDays = 30;
  const progress = 100 - Math.min((daysLeft / totalDays) * 100, 100);

  const chartData = [
    { name: "Abstracts", value: abstracts },
    { name: "Reviewers", value: reviewers },
    { name: "Participants", value: participants },
  ];
  const COLORS = ["#3b82f6", "#10b981", "#6366f1"];

  const handleExportCSV = () => {
    const csv = unparse([
      {
        abstracts,
        reviewers,
        participants,
        oralAccepted,
        posterAccepted,
        rejected,
        sessionsTotal,
        sessionsToday,
        certPart,
        certSpeaker,
        certReviewer,
        deadline,
      },
    ]);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "statistiques.csv");
    link.click();
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Statistiques de la conférence", 10, 10);

    autoTable(doc, {
      startY: 25,
      head: [["Statistique", "Valeur"]],
      body: [
        ["Abstracts", abstracts],
        ["Reviewers", reviewers],
        ["Participants", participants],
        ["Oral acceptés", oralAccepted],
        ["E-posters acceptés", posterAccepted],
        ["Rejetés", rejected],
        ["Sessions totales", sessionsTotal],
        ["Sessions aujourd'hui", sessionsToday],
        ["Certificats participants", certPart],
        ["Certificats conférenciers", certSpeaker],
        ["Certificats reviewers", certReviewer],
        ["Deadline", deadline],
      ],
    });
    doc.save("statistiques.pdf");
  };

  return (
    <div className="p-8 space-y-6 print:bg-white print:text-black">
      <div className="flex justify-between items-center print:hidden">
        <h1 className="text-3xl font-bold">Tableau de bord</h1>
        <div className="flex gap-4">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Exporter CSV
          </button>
          <button
            onClick={handleExportPDF}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Exporter PDF
          </button>
        </div>
      </div>

      {daysLeft <= 3 && (
        <div className="bg-red-100 text-red-800 border-l-4 border-red-500 p-4 rounded-xl shadow print:hidden">
          ⚠️ Attention : La deadline approche ! Il reste <strong>{daysLeft}</strong> jour{daysLeft > 1 ? "s" : ""}.
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center h-40 space-y-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
          <p className="text-gray-600">Chargement des données...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-6">
            <InfoBox title="Abstracts soumis" value={abstracts} color="#3b82f6" />
            <InfoBox title="Reviewers actifs" value={reviewers} color="#10b981" />
            <InfoBox title="Participants inscrits" value={participants} color="#6366f1" />
          </div>

          <div className="grid grid-cols-3 gap-6 mt-4">
            <InfoBox title="Oral acceptés" value={oralAccepted} color="#0ea5e9" />
            <InfoBox title="E-posters acceptés" value={posterAccepted} color="#14b8a6" />
            <InfoBox title="Rejetés" value={rejected} color="#ef4444" />
          </div>

          <div className="grid grid-cols-3 gap-6 mt-4">
            <InfoBox title="Sessions programmées" value={sessionsTotal} color="#f59e0b" />
            <InfoBox title="Sessions aujourd’hui" value={sessionsToday} color="#84cc16" />
            <InfoBox title="Certificats Participants" value={certPart} color="#6366f1" />
          </div>

          <div className="grid grid-cols-2 gap-6 mt-4">
            <InfoBox title="Certificats Conférenciers" value={certSpeaker} color="#f97316" />
            <InfoBox title="Certificats Reviewers" value={certReviewer} color="#3b82f6" />
          </div>

          <div className="bg-white mt-6 p-4 rounded-xl shadow">
            <h2 className="text-xl font-semibold">Deadline</h2>
            <p className="text-2xl text-red-600">{deadline}</p>
          </div>

          <div className="bg-white mt-6 p-6 rounded-xl shadow">
            <h2 className="text-xl font-semibold mb-2">Progression vers la deadline</h2>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="h-4 rounded-full bg-blue-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {Math.round(progress)}% du temps écoulé
            </p>
          </div>

          <div className="bg-white mt-6 p-6 rounded-xl shadow w-full">
            <h2 className="text-xl font-semibold mb-4">Statistiques visuelles</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={100}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white mt-6 p-6 rounded-xl shadow w-full">
            <h2 className="text-xl font-semibold mb-4">Comparaison des statistiques</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
