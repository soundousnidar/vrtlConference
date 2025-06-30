import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useParams } from "react-router-dom";
import Layout from "./components/Layout";
import AuthLayout from "./components/AuthLayout";
import Index from "./pages/Index";
import ConferenceDetails from "./pages/ConferenceDetails";
import UserProfile from "./pages/UserProfile";
import ReviewerDashboard from "./pages/ReviewerDashboard";
import ReviewerInvitations from "./pages/ReviewerInvitations";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "@/pages/Register";
import { ConferencesPage } from '@/pages/ConferencesPage';
import About from './pages/About';
import Certificates from './pages/Certificates';
import Abstracts from './pages/Abstracts';
import Forum from './pages/Forum';
import CreateConference from './pages/CreateConference';
import EditConference from './pages/EditConference';
import Dashboard from "./pages/Dashboard";
import InvitationAccepted from './pages/InvitationAccepted';
import AcceptInvitation from './pages/AcceptInvitation';
import ReviewerConferenceAbstracts from './pages/ReviewerConferenceAbstracts';
import AbstractReviews from './pages/AbstractReviews';
import LiveStreamRoom from './components/LiveStreamRoom';
import PushTestButton from './components/PushTestButton';


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <PushTestButton />
      <BrowserRouter>
        <Routes>
          {/* Auth routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>
          
          {/* Main routes with Layout */}
          <Route element={<Layout />}>
            <Route path="/" element={<ConferencesPage />} />
            <Route path="/conferences" element={<ConferencesPage />} />
            <Route path="/conferences/create" element={<CreateConference />} />
            <Route path="/conferences/edit/:id" element={<EditConference />} />
            <Route path="/conferences/:id" element={<ConferenceDetails />} />
            <Route path="/conference/:id" element={<ConferenceDetails />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/reviewer" element={<ReviewerDashboard />} />
            <Route path="/reviewer/invitations" element={<ReviewerInvitations />} />
            <Route path="/about" element={<About />} />
            <Route path="/certificates" element={<Certificates />} />
            <Route path="/abstracts" element={<Abstracts />} />
            <Route path="/forum" element={<Forum />} />
            <Route path="/dashboard/:id" element={<Dashboard />} />
            <Route path="/invitation-accepted" element={<InvitationAccepted />} />
            <Route path="/accept-invitation/:token" element={<AcceptInvitation />} />
            <Route path="/reviewer/conference/:conferenceId/abstracts" element={<ReviewerConferenceAbstracts />} />
            <Route path="/abstracts/:abstractId/reviews" element={<AbstractReviews />} />
            <Route path="/conferences/:id/live" element={
              <LiveStreamRoomWrapper />
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

function LiveStreamRoomWrapper() {
  const { id } = useParams();
  const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  const user = userStr ? JSON.parse(userStr) : { fullname: 'Utilisateur' };
  return <LiveStreamRoom conferenceId={Number(id)} user={user} />;
}

export default App;
