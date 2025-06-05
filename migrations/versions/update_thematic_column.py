"""update thematic column type

Revision ID: update_thematic_column
Create Date: 2024-02-14 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSON

# revision identifiers, used by Alembic.
revision = 'update_thematic_column'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Convert existing data to JSON
    op.execute("""
        ALTER TABLE conferences 
        ALTER COLUMN thematic TYPE jsonb 
        USING thematic::jsonb
    """)

def downgrade():
    # Convert back to string
    op.execute("""
        ALTER TABLE conferences 
        ALTER COLUMN thematic TYPE varchar 
        USING thematic::varchar
    """) 