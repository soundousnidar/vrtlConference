import React from "react";
import { Link } from "react-router-dom";
import { 
  Calendar, 
  Mail, 
  Facebook, 
  Linkedin, 
  Phone, 
  MapPin, 
  Globe,
  BookOpen,
  Award,
  FileText,
  MessageSquare,
  Shield,
  HelpCircle,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";

// Twitter SVG from simpleicons.org
const TwitterIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg role="img" viewBox="0 0 24 24" {...props} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <title>Twitter</title>
    <path d="M24 4.557a9.83 9.83 0 0 1-2.828.775 4.932 4.932 0 0 0 2.165-2.724c-.951.564-2.005.974-3.127 1.195a4.916 4.916 0 0 0-8.38 4.482A13.94 13.94 0 0 1 1.671 3.149a4.822 4.822 0 0 0-.666 2.475c0 1.708.87 3.216 2.188 4.099a4.904 4.904 0 0 1-2.229-.616c-.054 2.281 1.581 4.415 3.949 4.89a4.936 4.936 0 0 1-2.224.084c.627 1.956 2.444 3.377 4.6 3.417A9.867 9.867 0 0 1 0 21.543a13.94 13.94 0 0 0 7.548 2.209c9.058 0 14.009-7.496 14.009-13.986 0-.21 0-.423-.016-.634A9.936 9.936 0 0 0 24 4.557z"/>
  </svg>
);

interface FooterProps {
  className?: string;
}

const Footer = ({ className }: FooterProps) => {
  return (
    <footer className={cn("bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800", className)}>
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Colonne 1 - Logo et description */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <Calendar className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">VirtualConf</span>
            </Link>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Plateforme de gestion de conférences virtuelles et présentielles.
            </p>
            <div className="flex gap-3">
              <a href="#" className="text-gray-400 hover:text-primary">
                <TwitterIcon className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Colonne 2 - Navigation */}
          <div>
            <h3 className="font-semibold mb-4">Navigation</h3>
            <nav className="flex flex-col space-y-2">
              <Link to="/conferences" className="text-sm text-gray-600 hover:text-primary">Conférences</Link>
              <Link to="/certificates" className="text-sm text-gray-600 hover:text-primary">Certificats</Link>
              <Link to="/abstracts" className="text-sm text-gray-600 hover:text-primary">Abstracts</Link>
              <Link to="/forum" className="text-sm text-gray-600 hover:text-primary">Forum</Link>
              <Link to="/about" className="text-sm text-gray-600 hover:text-primary">À propos</Link>
            </nav>
          </div>

          {/* Colonne 3 - Légal */}
          <div>
            <h3 className="font-semibold mb-4">Légal</h3>
            <nav className="flex flex-col space-y-2">
              <Link to="/terms" className="text-sm text-gray-600 hover:text-primary">Conditions d'utilisation</Link>
              <Link to="/privacy" className="text-sm text-gray-600 hover:text-primary">Politique de confidentialité</Link>
              <Link to="/cookies" className="text-sm text-gray-600 hover:text-primary">Politique des cookies</Link>
              <Link to="/help" className="text-sm text-gray-600 hover:text-primary">Centre d'aide</Link>
            </nav>
          </div>

          {/* Colonne 4 - Contact */}
          <div>
            <h3 className="font-semibold mb-4">Contact</h3>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Une question ? Contactez-nous !</p>
              <a href="mailto:contact@virtualconf.com" className="text-sm text-gray-600 hover:text-primary flex items-center gap-2">
                <Mail className="h-4 w-4" />
                contact@virtualconf.com
              </a>
              <a href="tel:+33123456789" className="text-sm text-gray-600 hover:text-primary flex items-center gap-2">
                <Phone className="h-4 w-4" />
                +33 1 23 45 67 89
              </a>
              <div className="flex gap-2">
                <MapPin className="h-4 w-4 text-gray-600 flex-shrink-0 mt-1" />
                <address className="text-sm text-gray-600 not-italic">
                  123 Avenue de la Conférence<br />
                  75000 Paris, France
                </address>
              </div>
            </div>
          </div>
        </div>

        {/* Barre de copyright */}
        <div className="mt-8 pt-4 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-gray-600">
              © {new Date().getFullYear()} VirtualConf. Tous droits réservés.
            </p>
            <div className="flex gap-6">
              <Link to="/terms" className="text-xs text-gray-600 hover:text-primary">Conditions</Link>
              <Link to="/privacy" className="text-xs text-gray-600 hover:text-primary">Confidentialité</Link>
              <Link to="/cookies" className="text-xs text-gray-600 hover:text-primary">Cookies</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
