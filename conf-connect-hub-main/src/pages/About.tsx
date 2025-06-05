import React from 'react';

const About = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">À propos de VirtualConf</h1>
      <div className="prose dark:prose-invert max-w-none">
        <p className="text-lg mb-6">
          VirtualConf est une plateforme innovante dédiée à la gestion et à l'organisation de conférences virtuelles et présentielles.
          Notre mission est de faciliter le partage des connaissances et la collaboration entre professionnels du monde entier.
        </p>
        <h2 className="text-2xl font-semibold mt-8 mb-4">Notre Mission</h2>
        <p className="mb-6">
          Nous nous efforçons de créer un espace où les idées peuvent circuler librement, où les experts peuvent partager leurs connaissances,
          et où les participants peuvent interagir et apprendre dans un environnement professionnel et convivial.
        </p>
        <h2 className="text-2xl font-semibold mt-8 mb-4">Notre Vision</h2>
        <p className="mb-6">
          Notre vision est de devenir la référence mondiale en matière de plateformes de conférences virtuelles,
          en offrant des outils innovants et une expérience utilisateur exceptionnelle.
        </p>
      </div>
    </div>
  );
};

export default About; 