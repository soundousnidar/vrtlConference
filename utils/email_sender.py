import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import traceback

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