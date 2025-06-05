import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders

def send_email(to_email: str, subject: str, body: str):
    # Paramètres du serveur SMTP
    smtp_server = "smtp.gmail.com"  # Pour Gmail (tu peux aussi utiliser un autre serveur SMTP)
    smtp_port = 587  # Port SMTP pour Gmail
    from_email = "tonemail@gmail.com"  # Ton email
    password = "tonmotdepasse"  # Ton mot de passe email ou mot de passe d'application (si tu utilises Gmail)
    
    # Préparation du message
    msg = MIMEMultipart()
    msg['From'] = from_email
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain'))  # Texte en format brut
    
    # Connexion au serveur SMTP et envoi de l'email
    try:
        # Connexion au serveur
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()  # Sécurise la connexion avec TLS
        server.login(from_email, password)  # Se connecter au serveur avec ton email et mot de passe
        
        # Envoi de l'email
        text = msg.as_string()  # Conversion du message en format string
        server.sendmail(from_email, to_email, text)  # Envoie l'email

        print(f"Email envoyé à {to_email}")
        
    except Exception as e:
        print(f"Erreur lors de l'envoi de l'email: {e}")
    
    finally:
        server.quit()  # Déconnexion du serveur SMTP
