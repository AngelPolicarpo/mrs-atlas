"""
Migration para dropar tabelas legadas:
- Tabelas allauth (account_*, socialaccount_*)
- Tabela authtoken_token
- Tabela django_site (não mais necessária sem allauth)

Esta migration usa RunSQL para executar DROP TABLE IF EXISTS.
"""

from django.db import migrations


class Migration(migrations.Migration):
    """Dropa tabelas legadas que não são mais necessárias."""

    dependencies = [
        ('accounts', '0005_simplificacao_rbac'),
    ]

    operations = [
        # =====================================================
        # DROPAR TABELAS ALLAUTH
        # =====================================================
        
        # account_emailaddress
        migrations.RunSQL(
            sql='DROP TABLE IF EXISTS account_emailaddress CASCADE;',
            reverse_sql=migrations.RunSQL.noop,
        ),
        
        # account_emailconfirmation
        migrations.RunSQL(
            sql='DROP TABLE IF EXISTS account_emailconfirmation CASCADE;',
            reverse_sql=migrations.RunSQL.noop,
        ),
        
        # socialaccount_socialaccount
        migrations.RunSQL(
            sql='DROP TABLE IF EXISTS socialaccount_socialaccount CASCADE;',
            reverse_sql=migrations.RunSQL.noop,
        ),
        
        # socialaccount_socialapp
        migrations.RunSQL(
            sql='DROP TABLE IF EXISTS socialaccount_socialapp CASCADE;',
            reverse_sql=migrations.RunSQL.noop,
        ),
        
        # socialaccount_socialapp_sites
        migrations.RunSQL(
            sql='DROP TABLE IF EXISTS socialaccount_socialapp_sites CASCADE;',
            reverse_sql=migrations.RunSQL.noop,
        ),
        
        # socialaccount_socialtoken
        migrations.RunSQL(
            sql='DROP TABLE IF EXISTS socialaccount_socialtoken CASCADE;',
            reverse_sql=migrations.RunSQL.noop,
        ),
        
        # =====================================================
        # DROPAR TABELA AUTHTOKEN
        # =====================================================
        
        migrations.RunSQL(
            sql='DROP TABLE IF EXISTS authtoken_token CASCADE;',
            reverse_sql=migrations.RunSQL.noop,
        ),
        
        # =====================================================
        # DROPAR TABELA DJANGO_SITE
        # =====================================================
        
        migrations.RunSQL(
            sql='DROP TABLE IF EXISTS django_site CASCADE;',
            reverse_sql=migrations.RunSQL.noop,
        ),
    ]
