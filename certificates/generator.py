from fpdf import FPDF
from io import BytesIO
from fastapi import HTTPException
from models.certificate import Certificate
from models.users import User
from models.conferences import Conference

def generate_certificate(conference_id: int, user_id: int, cert_type: str, db):
    # Récupération de l'utilisateur
    user = db.query(User).filter(User.id == user_id).first()
    # Récupération de la conférence
    conference = db.query(Conference).filter(Conference.id == conference_id).first()

    if not user or not conference:
        raise HTTPException(status_code=404, detail="Utilisateur ou conférence introuvable")

    # Création du PDF
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", 'B', size=18)
    pdf.cell(200, 15, txt="CERTIFICAT DE " + cert_type.upper(), ln=True, align='C')

    pdf.ln(10)
    pdf.set_font("Arial", '', size=14)
    pdf.multi_cell(0, 10, txt=(
        f"Ce certificat est décerné à :\n\n"
        f"{user.fullname}\n\n"
        f"pour sa contribution en tant que '{cert_type}' lors de la conférence :\n"
        f"« {conference.title} » organisée le {conference.important_date.strftime('%d/%m/%Y')}."
    ))

    pdf.ln(20)
    pdf.set_font("Arial", 'I', size=12)
    pdf.cell(0, 10, txt="Virtual Conference Team", align='R')

    # Génération du PDF en mémoire
    output = BytesIO()
    pdf.output(output)
    output.seek(0)
    return output
