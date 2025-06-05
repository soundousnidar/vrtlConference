from fastapi import APIRouter, Depends, HTTPException, Form, UploadFile, File, security
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime
from models.conferences import Conference, VenueEnum
from models.users import User, UserRole
from database import get_db
from auth import get_current_user
from sqlalchemy import select
from fastapi.encoders import jsonable_encoder
import traceback
import base64
import json
import os
from models.reviewer_invitations import ReviewerInvitation, InvitationStatus
from models.reviewers import Reviewer
from utils.email_sender import EmailSender
import secrets

router = APIRouter()

CONFERENCE_NOT_FOUND_MSG = "Conférence introuvable"

# Obtenir toutes les conférences
@router.get("/conferences/", include_in_schema=True)
def get_all_conferences(db: Session = Depends(get_db)):
    try:
        print("=== GET ALL CONFERENCES DEBUG ===")
        print("1. Starting to fetch conferences...")
        
        # First, let's check if we can query the Conference table
        try:
            # Use a simpler query first
            conferences = db.query(Conference).all()
            print(f"2. Found {len(conferences)} conferences in database")
            
            # Create a simple list of conferences
            result = []
            for conf in conferences:
                try:
                    conf_dict = {
                        "id": conf.id,
                        "title": conf.title,
                        "description": conf.description or "Pas de description disponible",
                        "deadline": conf.deadline.isoformat() if conf.deadline else None,
                        "important_date": conf.important_date.isoformat() if conf.important_date else None,
                        "fees": conf.fees,
                        "venue": conf.venue,
                        "thematic": conf.thematic if isinstance(conf.thematic, list) else [conf.thematic],
                        "organizer_id": conf.organizer_id,
                        "created_at": conf.created_at.isoformat() if conf.created_at else None,
                    }
                    
                    # Add image if it exists
                    if conf.image:
                        try:
                            conf_dict["image_url"] = f"data:image/jpeg;base64,{base64.b64encode(conf.image).decode('utf-8')}"
                            print(f"Successfully encoded image for conference {conf.id}")
                        except Exception as img_error:
                            print(f"Error encoding image for conference {conf.id}: {str(img_error)}")
                            conf_dict["image_url"] = None
                    else:
                        print(f"No image found for conference {conf.id}")
                        conf_dict["image_url"] = None
                    
                    result.append(conf_dict)
                    print(f"3. Successfully processed conference {conf.id}: {conf.title}")
                except Exception as conf_error:
                    print(f"Error processing conference {conf.id}: {str(conf_error)}")
                    print(traceback.format_exc())
                    continue
            
            print(f"4. Successfully processed {len(result)} conferences")
            return {"conferences": result}
            
        except Exception as query_error:
            print(f"Error querying conferences: {str(query_error)}")
            print(traceback.format_exc())
            raise HTTPException(
                status_code=500,
                detail=f"Error querying conferences: {str(query_error)}"
            )
            
    except Exception as e:
        print("Error in get_all_conferences:")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

# Créer une nouvelle conférence
@router.post("/conferences/")
async def create_conference(
    title: str = Form(...),
    deadline: date = Form(...),
    important_date: date = Form(...),
    fees: float = Form(...),
    venue: VenueEnum = Form(...),
    thematic: str = Form(...),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    try:
        # Parse thematic JSON string to list
        try:
            # First try to parse as JSON
            try:
                thematic_list = json.loads(thematic)
            except json.JSONDecodeError:
                # If JSON parsing fails, try comma-separated format
                thematic_list = [t.strip() for t in thematic.split(',') if t.strip()]
            
            if not isinstance(thematic_list, list):
                raise ValueError("Le champ thématique doit être une liste")
            if not thematic_list:
                raise ValueError("Au moins une thématique est requise")
            print(f"Processed thematic list: {thematic_list}")
        except Exception as e:
            print(f"Error processing thematic: {str(e)}")
            print(f"Raw thematic value: {thematic}")
            raise ValueError("Format de thématique invalide. Veuillez fournir une liste de thèmes séparés par des virgules.")
        
        # Validate dates
        if deadline < date.today():
            raise ValueError("La date limite ne peut pas être dans le passé")
        if important_date < deadline:
            raise ValueError("La date importante doit être après la date limite")
        
        # Validate fees
        if fees < 0:
            raise ValueError("Les frais ne peuvent pas être négatifs")
        
        # Read image data if provided
        image_data = None
        if image:
            try:
                image_data = await image.read()
                print("Image successfully processed")
            except Exception as img_error:
                print(f"Error processing image: {str(img_error)}")
                raise ValueError("Erreur lors du traitement de l'image")
        
        # Create conference object
        try:
            conference = Conference(
                title=title,
                deadline=deadline,
                important_date=important_date,
                fees=fees,
                venue=venue,
                thematic=thematic_list,  # Store as JSON array
                organizer_id=current_user.id,
                image=image_data
            )
            print("Conference object created successfully")
            
            db.add(conference)
            db.commit()
            db.refresh(conference)
            print("Conference saved to database successfully")
            
            # Prepare response
            conf_dict = {
                "id": conference.id,
                "title": conference.title,
                "deadline": conference.deadline.isoformat(),
                "important_date": conference.important_date.isoformat(),
                "fees": conference.fees,
                "venue": conference.venue,
                "thematic": conference.thematic,
                "organizer_id": conference.organizer_id
            }
            
            if image_data:
                conf_dict["image_url"] = f"data:image/jpeg;base64,{base64.b64encode(image_data).decode('utf-8')}"
            
            return conf_dict
            
        except Exception as db_error:
            print(f"Database error: {str(db_error)}")
            print(f"Database error traceback: {traceback.format_exc()}")
            db.rollback()
            raise ValueError(f"Erreur lors de la sauvegarde de la conférence: {str(db_error)}")
            
    except ValueError as ve:
        print(f"Validation error: {str(ve)}")
        raise HTTPException(
            status_code=422,
            detail=str(ve)
        )
    except Exception as e:
        print("Unexpected error in create_conference:")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Une erreur inattendue s'est produite: {str(e)}"
        )

# Obtenir une conférence par ID
@router.get("/conferences/{conference_id}")
def get_conference(conference_id: int, db: Session = Depends(get_db)):
    try:
        conference = db.query(Conference).filter(Conference.id == conference_id).first()
        if not conference:
            raise HTTPException(status_code=404, detail=CONFERENCE_NOT_FOUND_MSG)
        
        # Get the organizer
        organizer = db.query(User).filter(User.id == conference.organizer_id).first()
        if not organizer:
            raise HTTPException(status_code=404, detail="Organisateur introuvable")
        
        # Convert the conference object to a dictionary
        conf_dict = {
            "id": conference.id,
            "title": conference.title,
            "description": conference.description or "Pas de description disponible",
            "deadline": conference.deadline.isoformat() if conference.deadline else None,
            "important_date": conference.important_date.isoformat() if conference.important_date else None,
            "fees": conference.fees,
            "venue": conference.venue,
            "thematic": conference.thematic if isinstance(conference.thematic, list) else [conference.thematic],
            "organizer_id": conference.organizer_id,
            "organizer_name": f"{organizer.first_name} {organizer.last_name}",
            "created_at": conference.created_at.isoformat() if conference.created_at else None,
        }
        
        # Handle image if it exists
        if hasattr(conference, 'image') and conference.image:
            try:
                conf_dict["image_url"] = f"data:image/jpeg;base64,{base64.b64encode(conference.image).decode('utf-8')}"
            except Exception as img_error:
                print(f"Error encoding image for conference {conference.id}: {str(img_error)}")
                conf_dict["image_url"] = None
        
        return conf_dict
    except Exception as e:
        print("Error in get_conference:")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

# Mettre à jour une conférence
@router.put("/conferences/{conference_id}")
def update_conference(
    conference_id: int,
    title: str = Form(...),
    deadline: date = Form(...),
    important_date: date = Form(...),
    fees: float = Form(...),
    venue: VenueEnum = Form(...),
    thematics: List[str] = Form(...),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    conference = db.query(Conference).filter(Conference.id == conference_id).first()
    if not conference:
        raise HTTPException(status_code=404, detail=CONFERENCE_NOT_FOUND_MSG)

    # Read image data if provided
    if image:
        image_data = image.file.read()
        conference.image = image_data

    conference.title = title
    conference.deadline = deadline
    conference.important_date = important_date
    conference.fees = fees
    conference.venue = venue
    conference.thematic = thematics

    db.commit()
    db.refresh(conference)
    
    # Convert the conference object to include base64 image if present
    conf_dict = conference.__dict__.copy()
    if conference.image:
        conf_dict["image_url"] = f"data:image/jpeg;base64,{base64.b64encode(conference.image).decode('utf-8')}"
    return conf_dict

# Supprimer une conférence
@router.delete("/conferences/{conference_id}")
def delete_conference(conference_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    conference = db.query(Conference).filter(Conference.id == conference_id).first()
    if not conference:
        raise HTTPException(status_code=404, detail=CONFERENCE_NOT_FOUND_MSG)

    db.delete(conference)
    db.commit()
    return {"message": "Conférence supprimée avec succès"}

@router.post("/conferences/{conference_id}/invite-reviewers")
async def invite_reviewers(
    conference_id: int,
    reviewer_emails: List[str],
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    try:
        # Get the conference
        conference = db.query(Conference).filter(Conference.id == conference_id).first()
        if not conference:
            raise HTTPException(status_code=404, detail=CONFERENCE_NOT_FOUND_MSG)
            
        # Check if the current user is the organizer
        if conference.organizer_id != current_user.id:
            raise HTTPException(status_code=403, detail="Vous n'êtes pas l'organisateur de cette conférence")
            
        # Initialize email sender
        email_sender = EmailSender()
        results = {
            "success": [],
            "failed": [],
            "already_invited": []
        }
        
        for email in reviewer_emails:
            try:
                # Check if user exists
                user = db.query(User).filter(User.email == email).first()
                if not user:
                    # Create new user with reviewer role
                    user = User(
                        email=email,
                        role=UserRole.reviewer,
                        is_active=False,  # They need to accept invitation to activate
                        fullname="Pending Reviewer"
                    )
                    db.add(user)
                    db.flush()  # Get the user ID without committing
                
                # Check if already invited
                existing_invitation = db.query(ReviewerInvitation).filter(
                    ReviewerInvitation.conference_id == conference_id,
                    ReviewerInvitation.invitee_id == user.id
                ).first()
                
                if existing_invitation:
                    results["already_invited"].append(email)
                    continue
                
                # Create invitation
                invitation = ReviewerInvitation(
                    invited_by_id=current_user.id,
                    invitee_id=user.id,
                    conference_id=conference_id,
                    status=InvitationStatus.pending
                )
                db.add(invitation)
                
                # Generate invitation link
                invitation_link = f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/reviewer/invitation/{invitation.id}"
                
                # Send invitation email
                email_sender.send_reviewer_invitation(
                    to_email=email,
                    conference_title=conference.title,
                    invitation_link=invitation_link
                )
                
                results["success"].append(email)
                
            except Exception as e:
                print(f"Error inviting reviewer {email}: {str(e)}")
                results["failed"].append(email)
                continue
        
        db.commit()
        return results
        
    except Exception as e:
        db.rollback()
        print(f"Error in invite_reviewers: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Error inviting reviewers: {str(e)}"
        )

@router.get("/reviewer-invitations")
async def get_reviewer_invitations(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    try:
        invitations = db.query(ReviewerInvitation).filter(
            ReviewerInvitation.invitee_id == current_user.id
        ).all()
        
        return [{
            "id": inv.id,
            "conference_id": inv.conference_id,
            "conference_title": inv.conference.title,
            "invited_by": f"{inv.invited_by.first_name} {inv.invited_by.last_name}",
            "status": inv.status,
            "created_at": inv.created_at.isoformat()
        } for inv in invitations]
        
    except Exception as e:
        print(f"Error getting reviewer invitations: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Error getting invitations: {str(e)}"
        )

@router.post("/conferences/{conference_id}/invite-reviewer")
async def invite_reviewer(
    conference_id: int,
    email: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        print(f"Received invitation request - Conference ID: {conference_id}, Email: {email}")
        
        # Verify if the conference exists and the current user is the organizer
        conference = db.query(Conference).filter(Conference.id == conference_id).first()
        if not conference:
            print(f"Conference {conference_id} not found")
            raise HTTPException(status_code=404, detail="Conférence introuvable")
            
        print(f"Conference found: {conference.title}")
        print(f"Current user ID: {current_user.id}, Organizer ID: {conference.organizer_id}")
        
        if conference.organizer_id != current_user.id:
            raise HTTPException(status_code=403, detail="Vous n'êtes pas l'organisateur de cette conférence")

        # Check if there's already a pending invitation for this email
        existing_invitation = db.query(ReviewerInvitation).filter(
            ReviewerInvitation.conference_id == conference_id,
            ReviewerInvitation.invitee_email == email,
            ReviewerInvitation.status == InvitationStatus.pending
        ).first()

        if existing_invitation:
            print(f"User already invited to this conference")
            raise HTTPException(
                status_code=400,
                detail="Cet utilisateur a déjà été invité à cette conférence"
            )

        # Generate unique tokens for accept/reject
        accept_token = secrets.token_urlsafe(32)
        reject_token = secrets.token_urlsafe(32)

        # Create invitation
        invitation = ReviewerInvitation(
            conference_id=conference_id,
            invited_by_id=current_user.id,
            invitee_email=email,
            accept_token=accept_token,
            reject_token=reject_token,
            status=InvitationStatus.pending
        )
        
        db.add(invitation)
        db.flush()  # Get the invitation ID without committing

        # Prepare email content
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
        accept_url = f"{frontend_url}/accept-invitation/{accept_token}"
        reject_url = f"{frontend_url}/reject-invitation/{reject_token}"
        
        email_subject = f"Invitation à évaluer la conférence : {conference.title}"
        email_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2c3e50;">Invitation à devenir Reviewer</h2>
                
                <p>Bonjour,</p>
                
                <p>Vous avez été invité(e) par {current_user.first_name} {current_user.last_name} à devenir reviewer pour la conférence :</p>
                
                <div style="background-color: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 5px;">
                    <h3 style="color: #2c3e50; margin-top: 0;">{conference.title}</h3>
                    <p style="margin-bottom: 0;">{conference.description or 'Pas de description disponible'}</p>
                </div>

                <p>En tant que reviewer, vous aurez la responsabilité d'évaluer les soumissions et de contribuer à la qualité scientifique de la conférence.</p>

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
                    Cet email a été envoyé automatiquement. Merci de ne pas y répondre directement.<br>
                    Si vous n'êtes pas concerné(e) par cette invitation, vous pouvez ignorer cet email.
                </p>
            </div>
        </body>
        </html>
        """

        # Send email using EmailSender
        email_sender = EmailSender()
        try:
            # Generate URLs for accept/reject
            frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
            accept_url = f"{frontend_url}/accept-invitation/{accept_token}"
            reject_url = f"{frontend_url}/reject-invitation/{reject_token}"
            
            # Send invitation email
            email_sender.send_reviewer_invitation(
                to_email=email,
                conference_title=conference.title,
                accept_url=accept_url,
                reject_url=reject_url
            )
            print(f"Invitation email sent successfully to {email}")
            
            # If email sent successfully, commit the invitation to database
            db.commit()
            return {
                "message": "Invitation envoyée avec succès",
                "invitation_id": invitation.id
            }
            
        except Exception as email_error:
            print(f"Error sending invitation email: {str(email_error)}")
            print(traceback.format_exc())
            db.rollback()
            raise HTTPException(
                status_code=500,
                detail=f"Erreur lors de l'envoi de l'email d'invitation: {str(email_error)}"
            )

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Error inviting reviewer: {str(e)}")
        print(traceback.format_exc())
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de l'envoi de l'invitation: {str(e)}"
        )

@router.post("/reviewer-invitations/accept/{token}")
async def accept_reviewer_invitation(
    token: str,
    db: Session = Depends(get_db)
):
    try:
        # Find invitation by accept token
        invitation = db.query(ReviewerInvitation).filter(
            ReviewerInvitation.accept_token == token,
            ReviewerInvitation.status == InvitationStatus.pending
        ).first()

        if not invitation:
            raise HTTPException(status_code=404, detail="Invitation invalide ou expirée")

        # Update invitation status
        invitation.status = InvitationStatus.accepted
        
        # Send confirmation email to both reviewer and organizer
        email_sender = EmailSender()
        conference = db.query(Conference).filter(Conference.id == invitation.conference_id).first()
        organizer = db.query(User).filter(User.id == invitation.invited_by_id).first()
        
        if conference and organizer:
            # Email to reviewer
            reviewer_subject = f"Confirmation d'acceptation - {conference.title}"
            reviewer_body = f"""
            Bonjour,

            Vous avez accepté l'invitation pour être reviewer de la conférence "{conference.title}".
            
            Pour commencer à évaluer les abstracts, veuillez créer un compte ou vous connecter sur notre plateforme :
            {os.getenv('FRONTEND_URL', 'http://localhost:3000')}/register

            Cordialement,
            L'équipe de la conférence
            """
            
            # Email to organizer
            organizer_subject = f"Un reviewer a accepté votre invitation - {conference.title}"
            organizer_body = f"""
            Bonjour {organizer.first_name},

            {invitation.invitee_email} a accepté votre invitation pour être reviewer de la conférence "{conference.title}".
            
            Vous pouvez suivre le statut des invitations dans votre tableau de bord.

            Cordialement,
            L'équipe de la conférence
            """
            
            try:
                await email_sender.send_email(
                    to_email=invitation.invitee_email,
                    subject=reviewer_subject,
                    body=reviewer_body
                )
                await email_sender.send_email(
                    to_email=organizer.email,
                    subject=organizer_subject,
                    body=organizer_body
                )
            except Exception as email_error:
                print(f"Error sending confirmation emails: {str(email_error)}")
        
        db.commit()
        return {"message": "Invitation acceptée avec succès"}

    except Exception as e:
        db.rollback()
        print(f"Error accepting invitation: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de l'acceptation de l'invitation: {str(e)}"
        )

@router.post("/reviewer-invitations/reject/{token}")
async def reject_reviewer_invitation(
    token: str,
    db: Session = Depends(get_db)
):
    try:
        # Find invitation by reject token
        invitation = db.query(ReviewerInvitation).filter(
            ReviewerInvitation.reject_token == token,
            ReviewerInvitation.status == InvitationStatus.pending
        ).first()

        if not invitation:
            raise HTTPException(status_code=404, detail="Invitation invalide ou expirée")

        # Update invitation status
        invitation.status = InvitationStatus.rejected
        db.commit()

        return {"message": "Invitation refusée"}

    except Exception as e:
        print(f"Error rejecting invitation: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors du refus de l'invitation: {str(e)}"
        )

@router.get("/reviewer-invitations/sent")
async def get_sent_invitations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        invitations = db.query(ReviewerInvitation).filter(
            ReviewerInvitation.invited_by_id == current_user.id
        ).all()
        
        return [{
            "id": inv.id,
            "conference_id": inv.conference_id,
            "conference_title": inv.conference.title,
            "invitee_email": inv.invitee_email,
            "status": inv.status,
            "created_at": inv.created_at.isoformat()
        } for inv in invitations]
        
    except Exception as e:
        print(f"Error getting sent invitations: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Error getting sent invitations: {str(e)}"
        )

@router.get("/reviewer-invitations/received")
async def get_received_invitations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        invitations = db.query(ReviewerInvitation).filter(
            ReviewerInvitation.invitee_id == current_user.id
        ).all()
        
        return [{
            "id": inv.id,
            "conference_id": inv.conference_id,
            "conference_title": inv.conference.title,
            "invitee_email": current_user.email,
            "status": inv.status,
            "created_at": inv.created_at.isoformat()
        } for inv in invitations]
        
    except Exception as e:
        print(f"Error getting received invitations: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Error getting received invitations: {str(e)}"
        )

@router.post("/check-reviewer-status")
async def check_reviewer_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        # Find accepted invitations for this user's email
        accepted_invitations = db.query(ReviewerInvitation).filter(
            ReviewerInvitation.invitee_email == current_user.email,
            ReviewerInvitation.status == InvitationStatus.accepted
        ).all()
        
        activated_conferences = []
        
        for invitation in accepted_invitations:
            # Check if already a reviewer for this conference
            existing_reviewer = db.query(Reviewer).filter(
                Reviewer.user_id == current_user.id,
                Reviewer.conference_id == invitation.conference_id
            ).first()
            
            if not existing_reviewer:
                # Create new reviewer entry
                reviewer = Reviewer(
                    user_id=current_user.id,
                    conference_id=invitation.conference_id
                )
                db.add(reviewer)
                
                # Get conference details
                conference = db.query(Conference).filter(
                    Conference.id == invitation.conference_id
                ).first()
                
                if conference:
                    activated_conferences.append({
                        "id": conference.id,
                        "title": conference.title
                    })
        
        db.commit()
        
        return {
            "message": "Statut de reviewer vérifié et mis à jour",
            "activated_conferences": activated_conferences
        }
        
    except Exception as e:
        db.rollback()
        print(f"Error checking reviewer status: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la vérification du statut de reviewer: {str(e)}"
        )
