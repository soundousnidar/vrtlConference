import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Calendar, 
  User, 
  Menu, 
  X, 
  ChevronDown, 
  FileText, 
  Users, 
  Award,
  LogIn,
  UserPlus,
  BookOpen,
  MessageSquare,
  Info,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);

    // Check authentication status
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
    }

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleDropdownClick = (dropdown: string) => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
    navigate('/login');
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-white/80 backdrop-blur-md shadow-sm" : "bg-white"
      }`}
    >
      <nav className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">VirtualConf</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/conferences" className="flex items-center gap-1 hover:text-primary transition-colors">
              <BookOpen className="w-4 h-4" />
              <span>Conférences</span>
            </Link>

            <div className="relative group">
              <button 
                className="flex items-center gap-1 hover:text-primary transition-colors py-2"
                onClick={() => handleDropdownClick('resources')}
              >
                <FileText className="w-4 h-4" />
                <span>Ressources</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              <div className={`absolute top-full left-0 w-48 py-2 bg-white dark:bg-gray-900 rounded-lg shadow-lg ${
                activeDropdown === 'resources' ? 'block' : 'hidden'
              } group-hover:block`}>
                <Link to="/certificates" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800">
                  <Award className="w-4 h-4 inline mr-2" />
                  Certificats
                </Link>
                <Link to="/abstracts" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800">
                  <FileText className="w-4 h-4 inline mr-2" />
                  Abstracts
                </Link>
                <Link to="/forum" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800">
                  <MessageSquare className="w-4 h-4 inline mr-2" />
                  Forum
                </Link>
              </div>
            </div>

            <Link to="/about" className="flex items-center gap-1 hover:text-primary transition-colors">
              <Info className="w-4 h-4" />
              <span>À propos</span>
            </Link>

            {/* Auth Buttons */}
            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <>
                  <Button variant="ghost" onClick={() => navigate('/profile')} className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>Mon profil</span>
                  </Button>
                  <Button variant="destructive" onClick={handleLogout} className="flex items-center gap-2">
                    <LogOut className="w-4 h-4" />
                    <span>Déconnexion</span>
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => navigate('/login')} className="flex items-center gap-2">
                    <LogIn className="w-4 h-4" />
                    <span>Connexion</span>
                  </Button>
                  <Button variant="default" onClick={() => navigate('/register')} className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    <span>Inscription</span>
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4">
            <div className="flex flex-col gap-4">
              <Link
                to="/conferences"
                className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100"
              >
                <BookOpen className="w-4 h-4" />
                <span>Conférences</span>
              </Link>

              <div className="px-4 py-2">
                <button
                  className="flex items-center gap-2 w-full"
                  onClick={() => handleDropdownClick('mobile-resources')}
                >
                  <FileText className="w-4 h-4" />
                  <span>Ressources</span>
                  <ChevronDown className="w-4 h-4 ml-auto" />
                </button>
                {activeDropdown === 'mobile-resources' && (
                  <div className="mt-2 ml-4 flex flex-col gap-2">
                    <Link to="/certificates" className="flex items-center gap-2 py-2">
                      <Award className="w-4 h-4" />
                      <span>Certificats</span>
                    </Link>
                    <Link to="/abstracts" className="flex items-center gap-2 py-2">
                      <FileText className="w-4 h-4" />
                      <span>Abstracts</span>
                    </Link>
                    <Link to="/forum" className="flex items-center gap-2 py-2">
                      <MessageSquare className="w-4 h-4" />
                      <span>Forum</span>
                    </Link>
                  </div>
                )}
              </div>

              <Link
                to="/about"
                className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100"
              >
                <Info className="w-4 h-4" />
                <span>À propos</span>
              </Link>

              {/* Mobile Auth Buttons */}
              <div className="border-t pt-4 mt-2">
                {isAuthenticated ? (
                  <>
                    <Button
                      variant="ghost"
                      onClick={() => navigate('/profile')}
                      className="w-full justify-start mb-2"
                    >
                      <User className="w-4 h-4 mr-2" />
                      <span>Mon profil</span>
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleLogout}
                      className="w-full justify-start"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      <span>Déconnexion</span>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      onClick={() => navigate('/login')}
                      className="w-full justify-start mb-2"
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      <span>Connexion</span>
                    </Button>
                    <Button
                      variant="default"
                      onClick={() => navigate('/register')}
                      className="w-full justify-start"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      <span>Inscription</span>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
