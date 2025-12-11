"""add_corporate_transaction_types

Revision ID: 29bc6e996add
Revises: 52332bc90510
Create Date: 2025-12-11 16:46:18.710224

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '29bc6e996add'
down_revision: Union[str, None] = 'd97d06f9ce3a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Añadir nuevos valores al enum TransactionType
    op.execute("ALTER TYPE transactiontype ADD VALUE IF NOT EXISTS 'DIVIDEND'")
    op.execute("ALTER TYPE transactiontype ADD VALUE IF NOT EXISTS 'SPLIT'")
    op.execute("ALTER TYPE transactiontype ADD VALUE IF NOT EXISTS 'CORPORATE'")


def downgrade() -> None:
    # No se puede eliminar valores de un enum en PostgreSQL sin recrearlo
    # Esta operación requeriría recrear el enum y todas las tablas que lo usan
    pass
