import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import traceback
from fpdf import FPDF
import io
from PIL import Image
import qrcode

class EmailSender:
    def __init__(self):
        # Gmail SMTP configuration
        self.smtp_server = "smtp.gmail.com"
        self.smtp_port = 587  # Using TLS port instead of SSL
        self.from_email = "sundusnidar@gmail.com"  # Replace with your Gmail
        self.password = "wzja gtwm lttz molj"  # Replace with your app password
        
        print(f"Email sender initialized with Gmail: {self.from_email}")

    def send_email(self, to_email: str, subject: str, text_body: str, html_body: str = None):
        """
        Send an email using Gmail SMTP
        """
        try:
            print(f"\n=== Starting email sending process to {to_email} ===")
            
            # Create message
            msg = MIMEMultipart('alternative')
            msg['From'] = self.from_email
            msg['To'] = to_email
            msg['Subject'] = subject
            
            print("✓ Email message created")

            # Always attach plain text version
            msg.attach(MIMEText(text_body, 'plain'))
            print("✓ Plain text body attached")

            # Attach HTML version if provided
            if html_body:
                msg.attach(MIMEText(html_body, 'html'))
                print("✓ HTML body attached")

            # Connect to SMTP server
            print("\nConnecting to Gmail SMTP server...")
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.set_debuglevel(1)  # Enable debug output
            
            # Start TLS
            print("Starting TLS connection...")
            server.starttls()
            print("✓ TLS connection established")
            
            # Login
            print("\nAttempting to login...")
            server.login(self.from_email, self.password)
            print("✓ Successfully logged in to Gmail")
            
            # Send email
            print("\nSending email...")
            server.sendmail(self.from_email, to_email, msg.as_string())
            print(f"✓ Email successfully sent to {to_email}")
            
            return True
            
        except Exception as e:
            print("\n❌ Error occurred while sending email:")
            print(f"Error type: {type(e).__name__}")
            print(f"Error message: {str(e)}")
            print("\nFull traceback:")
            print(traceback.format_exc())
            raise Exception(f"Failed to send email: {str(e)}")
            
        finally:
            try:
                if 'server' in locals():
                    print("\nClosing SMTP connection...")
                    server.quit()
                    print("✓ SMTP connection closed")
            except Exception as e:
                print(f"❌ Error closing SMTP connection: {str(e)}")

    def send_reviewer_invitation(self, to_email: str, conference_title: str, accept_url: str, reject_url: str):
        """
        Send a reviewer invitation email
        """
        try:
            print(f"\n=== Preparing reviewer invitation for {to_email} ===")
            
            subject = f"Invitation à évaluer la conférence : {conference_title}"
            
            # Create HTML body
            html_body = f"""
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #2c3e50;">Invitation à devenir Reviewer</h2>
                    
                    <p>Bonjour,</p>
                    
                    <p>Vous avez été invité(e) à devenir reviewer pour la conférence :</p>
                    
                    <div style="background-color: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 5px;">
                        <h3 style="color: #2c3e50; margin-top: 0;">{conference_title}</h3>
                    </div>

                    <div style="margin: 30px 0;">
                        <a href="{accept_url}" style="display: inline-block; background-color: #28a745; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin-right: 15px;">
                            Accepter l'invitation
                        </a>
                        
                        <a href="{reject_url}" style="display: inline-block; background-color: #dc3545; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px;">
                            Décliner l'invitation
                        </a>
                    </div>

                    <p style="color: #666; font-size: 0.9em;">
                        Si les boutons ne fonctionnent pas, vous pouvez copier et coller ces liens dans votre navigateur :<br>
                        Accepter : {accept_url}<br>
                        Décliner : {reject_url}
                    </p>

                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

                    <p style="color: #666; font-size: 0.8em;">
                        Cet email a été envoyé automatiquement. Merci de ne pas y répondre directement.
                    </p>
                </div>
            </body>
            </html>
            """

            # Create plain text version
            text_body = f"""
            Invitation à devenir Reviewer

            Bonjour,

            Vous avez été invité(e) à devenir reviewer pour la conférence : {conference_title}

            Pour accepter l'invitation : {accept_url}
            Pour décliner l'invitation : {reject_url}

            Si vous ne pouvez pas cliquer sur les liens, copiez-les et collez-les dans votre navigateur.

            Cet email a été envoyé automatiquement. Merci de ne pas y répondre directement.
            """

            # Send the email
            return self.send_email(to_email, subject, text_body, html_body)
            
        except Exception as e:
            print(f"\n❌ Error preparing reviewer invitation: {str(e)}")
            raise 

def generate_certificate_pdf(user_name, conference_title, cert_type, date, reviewer_name=None, presentation_title=None, 
                           conference_deadline=None, conference_important_date=None, venue=None, 
                           organizer_name=None, certificate_id=None, review_count=None):
    pdf = FPDF('L', 'mm', 'A4')  # Paysage
    pdf.add_page()
    pdf.set_auto_page_break(False)

    left_margin = 30
    right_margin = 30
    content_width = 297 - left_margin - right_margin

    # --- Cadre ---
    pdf.set_draw_color(180, 180, 180)
    pdf.set_line_width(0.8)
    pdf.rect(10, 10, 277, 190)

    # --- Logo (optionnel) ---
    logo_path = "logo.png"
    if os.path.exists(logo_path):
        pdf.image(logo_path, x=left_margin, y=15, w=40)

    # --- Titre principal selon le type ---
    if cert_type == "participation":
        titre = "CERTIFICAT DE PARTICIPATION"
        texte = f"Ce certificat atteste que"
        justification = f"a participé à la conférence '{conference_title}', tenue du {conference_deadline} au {conference_important_date} en tant que participant."
        nom = user_name.upper()
    elif cert_type == "presentation":
        titre = "CERTIFICAT DE COMMUNICATION SCIENTIFIQUE"
        texte = f"Ce certificat atteste que"
        justification = f"a présenté une communication intitulée '{presentation_title}' lors de la conférence '{conference_title}'."
        nom = user_name.upper()
    elif cert_type == "reviewer":
        titre = "CERTIFICAT D'ÉVALUATION DE RÉSUMÉS"
        texte = f"Ce certificat atteste que"
        justification = f"a contribué à l'évaluation scientifique des résumés soumis à la conférence '{conference_title}'."
        nom = (reviewer_name or user_name).upper()
    else:
        titre = f"CERTIFICAT DE {cert_type.upper()}"
        texte = f"Ce certificat atteste que"
        justification = f"a contribué à la conférence '{conference_title}'."
        nom = user_name.upper()

    # --- Titre stylisé ---
    pdf.set_font("Arial", 'B', 32)
    pdf.set_text_color(40, 40, 80)
    pdf.set_xy(left_margin, 35)
    pdf.cell(content_width, 20, titre, align='C', ln=1)

    # --- Ligne décorative ---
    pdf.set_draw_color(100, 100, 100)
    pdf.set_line_width(1)
    pdf.line(left_margin + 10, 60, 297 - right_margin - 10, 60)

    # --- Texte d'introduction ---
    pdf.set_font("Arial", '', 16)
    pdf.set_text_color(80, 80, 80)
    pdf.set_xy(left_margin, 70)
    pdf.cell(content_width, 10, texte, align='C', ln=1)

    # --- Nom du bénéficiaire ---
    pdf.set_font("Arial", 'B', 28)
    pdf.set_text_color(60, 60, 60)
    pdf.set_xy(left_margin, 90)
    pdf.cell(content_width, 20, nom, align='C', ln=1)

    # --- Justification détaillée ---
    pdf.set_font("Arial", '', 14)
    pdf.set_text_color(80, 80, 80)
    pdf.set_xy(left_margin, 115)
    pdf.multi_cell(content_width, 8, justification, align='C')

    # --- Informations de la conférence ---
    y_position = pdf.get_y() + 10
    pdf.set_font("Arial", '', 12)
    pdf.set_text_color(60, 60, 60)
    if conference_deadline and conference_important_date:
        pdf.set_xy(left_margin, y_position)
        pdf.cell(content_width, 8, f"Dates de l'événement : du {conference_deadline} au {conference_important_date}", align='C', ln=1)
        y_position += 12
    if venue:
        venue_text = "Événement en ligne" if venue == "ONLINE" else "Événement présentiel"
        pdf.set_xy(left_margin, y_position)
        pdf.cell(content_width, 8, f"Lieu : {venue_text}", align='C', ln=1)
        y_position += 12
    pdf.set_xy(left_margin, y_position)
    pdf.cell(content_width, 8, f"Date de délivrance : {date}", align='C', ln=1)
    y_position += 12
    if certificate_id:
        pdf.set_xy(left_margin, y_position)
        pdf.cell(content_width, 8, f"Code de vérification : {certificate_id}", align='C', ln=1)
        y_position += 12

    # --- QR code de vérification (optionnel) ---
    if certificate_id:
        qr_url = f"https://tonsite.com/verify/{certificate_id}"
        qr = qrcode.make(qr_url)
        qr_path = "qr_temp.png"
        qr.save(qr_path)
        pdf.image(qr_path, x=297 - right_margin - 30, y=y_position - 40, w=30)
        os.remove(qr_path)

    # --- Signature de l'organisateur ---
    signature_y = 185
    pdf.set_font("Arial", 'B', 12)
    pdf.set_text_color(80, 80, 80)
    pdf.set_xy(left_margin, signature_y)
    organizer_name = organizer_name or "AUDREY MOULIN"
    pdf.cell(content_width, 10, organizer_name, align='C')
    pdf.set_font("Arial", '', 10)
    pdf.set_xy(left_margin, signature_y + 8)
    pdf.cell(content_width, 10, "Président de conférence", align='C')

    # --- Générer le PDF en mémoire ---
    pdf_bytes = pdf.output(dest='S').encode('latin1')
    pdf_output = io.BytesIO(pdf_bytes)
    pdf_output.seek(0)
    return pdf_output 