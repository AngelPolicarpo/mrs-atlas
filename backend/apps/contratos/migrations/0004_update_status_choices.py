# Generated migration to update status choices

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('contratos', '0003_remove_empresa_prestadora'),
    ]

    operations = [
        migrations.AlterField(
            model_name='contrato',
            name='status',
            field=models.CharField(choices=[('ATIVO', 'Ativo'), ('CANCELADO', 'Cancelado'), ('FINALIZADO', 'Finalizado')], default='ATIVO', max_length=20, verbose_name='Status'),
        ),
        # Data migration to update existing records
        migrations.RunPython(
            code=lambda apps, schema_editor: update_existing_statuses(apps),
            reverse_code=lambda apps, schema_editor: None
        ),
    ]


def update_existing_statuses(apps):
    """Convert old status values to new ones"""
    Contrato = apps.get_model('contratos', 'Contrato')
    
    # Map old statuses to new ones
    status_mapping = {
        'RASCUNHO': 'ATIVO',
        'SUSPENSO': 'ATIVO',
        'ENCERRADO': 'FINALIZADO',
        # Keep ATIVO and CANCELADO as is
    }
    
    for old_status, new_status in status_mapping.items():
        Contrato.objects.filter(status=old_status).update(status=new_status)
