#!/usr/bin/env python3
"""
Script de test pour vérifier le webhook Stripe et les mises à jour de statut
"""

import requests
import json
import os
from datetime import datetime

# Configuration
BACKEND_URL = "http://localhost:8001"
FRONTEND_URL = "http://localhost:8080"

def test_registration_status(user_token, conference_id):
    """Teste le statut d'inscription d'un utilisateur"""
    print(f"\n🔍 Test du statut d'inscription pour la conférence {conference_id}")
    
    headers = {"Authorization": f"Bearer {user_token}"}
    
    # Vérifier si inscrit
    response = requests.get(f"{BACKEND_URL}/conferences/{conference_id}/is-registered", headers=headers)
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Statut d'inscription: {data}")
        return data
    else:
        print(f"❌ Erreur lors de la vérification: {response.status_code} - {response.text}")
        return None

def test_registrations_list(user_token):
    """Teste la liste des inscriptions de l'utilisateur"""
    print(f"\n📋 Test de la liste des inscriptions")
    
    headers = {"Authorization": f"Bearer {user_token}"}
    
    response = requests.get(f"{BACKEND_URL}/registrations/me", headers=headers)
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Inscriptions trouvées: {len(data)}")
        for reg in data:
            print(f"   - Conférence: {reg['conference']['title']}")
            print(f"     Statut: {reg['status']}")
            print(f"     Paiements: {len(reg['payments'])}")
        return data
    else:
        print(f"❌ Erreur lors de la récupération: {response.status_code} - {response.text}")
        return None

def test_webhook_endpoint():
    """Teste si le endpoint webhook est accessible"""
    print(f"\n🌐 Test de l'endpoint webhook")
    
    response = requests.get(f"{BACKEND_URL}/payments/webhook")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text[:200]}...")

def check_stripe_webhook_secret():
    """Vérifie la configuration du webhook secret"""
    print(f"\n🔐 Vérification du webhook secret")
    
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
    if webhook_secret:
        print(f"✅ STRIPE_WEBHOOK_SECRET configuré: {webhook_secret[:10]}...")
    else:
        print(f"❌ STRIPE_WEBHOOK_SECRET non configuré")

def main():
    print("🚀 Test de diagnostic du système de paiement")
    print("=" * 50)
    
    # Vérifications de base
    check_stripe_webhook_secret()
    test_webhook_endpoint()
    
    # Demander les informations de test
    print(f"\n📝 Informations de test nécessaires:")
    user_token = input("Token utilisateur (Bearer xxx): ").strip()
    if user_token.startswith("Bearer "):
        user_token = user_token[7:]  # Enlever "Bearer "
    
    conference_id = input("ID de la conférence: ").strip()
    
    if user_token and conference_id:
        # Tests avec les informations fournies
        test_registration_status(user_token, conference_id)
        test_registrations_list(user_token)
    else:
        print("❌ Informations manquantes pour les tests complets")
    
    print(f"\n📋 Instructions pour tester le webhook:")
    print(f"1. Installer Stripe CLI: https://stripe.com/docs/stripe-cli")
    print(f"2. Lancer: stripe listen --forward-to {BACKEND_URL}/payments/webhook")
    print(f"3. Faire un paiement test")
    print(f"4. Vérifier les logs du backend pour voir les messages de debug")

if __name__ == "__main__":
    main() 