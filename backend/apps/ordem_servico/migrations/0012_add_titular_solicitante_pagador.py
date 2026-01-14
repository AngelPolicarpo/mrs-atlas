# Generated migration for adding titular as solicitante/pagador

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('titulares', '0001_initial'),
        ('ordem_servico', '0011_servico_item_unique'),
    ]

    operations = [
        # Tornar empresa_solicitante nullable
        migrations.AlterField(
            model_name='ordemservico',
            name='empresa_solicitante',
            field=models.ForeignKey(
                blank=True,
                db_column='id_empresa_solicitante',
                help_text='Empresa que solicita o serviço (pode ser diferente da contratante)',
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='ordens_solicitadas',
                to='empresa.empresa',
                verbose_name='Empresa Solicitante',
            ),
        ),
        # Tornar empresa_pagadora nullable
        migrations.AlterField(
            model_name='ordemservico',
            name='empresa_pagadora',
            field=models.ForeignKey(
                blank=True,
                db_column='id_empresa_pagadora',
                help_text='Empresa responsável pelo pagamento',
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='ordens_pagas',
                to='empresa.empresa',
                verbose_name='Empresa Pagadora',
            ),
        ),
        # Adicionar titular_solicitante
        migrations.AddField(
            model_name='ordemservico',
            name='titular_solicitante',
            field=models.ForeignKey(
                blank=True,
                db_column='id_titular_solicitante',
                help_text='Titular que solicita o serviço como particular',
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='ordens_solicitadas_particular',
                to='titulares.titular',
                verbose_name='Titular Solicitante',
            ),
        ),
        # Adicionar titular_pagador
        migrations.AddField(
            model_name='ordemservico',
            name='titular_pagador',
            field=models.ForeignKey(
                blank=True,
                db_column='id_titular_pagador',
                help_text='Titular responsável pelo pagamento (particular)',
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='ordens_pagas_particular',
                to='titulares.titular',
                verbose_name='Titular Pagador',
            ),
        ),
    ]
