def get_cert_filename(name: str, cert_type: str) -> str:
    safe_name = name.replace(" ", "_")
    return f"{safe_name}_{cert_type}_certificate.pdf"
